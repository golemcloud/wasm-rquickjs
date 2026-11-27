use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::panic::{RefUnwindSafe, UnwindSafe};
use std::rc::{Rc, Weak as StatementWeak};
use std::sync::{Arc, LazyLock, Mutex, Weak};
use std::time::Duration;

use rquickjs::qjs;
use rusqlite::OpenFlags;
use rusqlite::functions::FunctionFlags;
use rusqlite::types::ValueRef;

const MAX_SAFE_INTEGER: i64 = 9007199254740991; // 2^53 - 1
const MIN_SAFE_INTEGER: i64 = -9007199254740991;

use rusqlite::ffi::sqlite3_errstr;

struct ConnectionTable {
    connections: HashMap<u32, Arc<SqliteConnection>>,
    next_id: u32,
}

impl ConnectionTable {
    fn new() -> Self {
        Self {
            connections: HashMap::new(),
            next_id: 1,
        }
    }

    fn insert(&mut self, conn: rusqlite::Connection) -> u32 {
        let id = self.next_id;
        self.next_id += 1;
        self.connections.insert(
            id,
            Arc::new(SqliteConnection {
                conn,
                statements: RefCell::new(Vec::new()),
                in_authorizer: Cell::new(false),
                mutating: Cell::new(false),
            }),
        );
        id
    }
}

struct SqliteConnection {
    conn: rusqlite::Connection,
    statements: RefCell<Vec<StatementWeak<StatementState>>>,
    in_authorizer: Cell<bool>,
    mutating: Cell<bool>,
}

// SAFETY: Like the session and JS callback tables below, this registry is only
// accessed by the single-threaded WASM runtime. No connection crosses threads.
unsafe impl Send for SqliteConnection {}
unsafe impl Sync for SqliteConnection {}

impl std::ops::Deref for SqliteConnection {
    type Target = rusqlite::Connection;

    fn deref(&self) -> &Self::Target {
        &self.conn
    }
}

struct StatementState {
    connection: Weak<SqliteConnection>,
    raw: Cell<*mut rusqlite::ffi::sqlite3_stmt>,
    executing: Cell<bool>,
    cursor: Cell<bool>,
    generation: Cell<u64>,
}

impl StatementState {
    fn pointer<'js>(
        &self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<*mut rusqlite::ffi::sqlite3_stmt> {
        let ptr = self.raw.get();
        if ptr.is_null() {
            return Err(throw_coded_error(
                ctx,
                "Error",
                "statement has been finalized",
                "ERR_INVALID_STATE",
            ));
        }
        Ok(ptr)
    }

    fn finalize(&self) {
        let ptr = self.raw.replace(std::ptr::null_mut());
        self.cursor.set(false);
        if !ptr.is_null() {
            // SAFETY: only this state owns the handle; the connection's weak
            // registry finalizes it before dropping the connection.
            unsafe {
                rusqlite::ffi::sqlite3_finalize(ptr);
            }
        }
    }
}

impl Drop for StatementState {
    fn drop(&mut self) {
        // SQLite can invoke aggregate xFinal while finalizing. A GC finalizer
        // must not call JS, even if collection happens inside a SQLite callback.
        let _guard = JsCtxGuard::new(std::ptr::null_mut());
        self.finalize();
    }
}

#[derive(rquickjs::class::Trace, rquickjs::JsLifetime)]
#[rquickjs::class]
pub struct NativeStatement {
    #[qjs(skip_trace)]
    state: Rc<StatementState>,
}

#[derive(rquickjs::class::Trace, rquickjs::JsLifetime)]
#[rquickjs::class]
pub struct NativeIterator {
    #[qjs(skip_trace)]
    state: Rc<StatementState>,
    generation: u64,
    #[qjs(skip_trace)]
    done: Cell<bool>,
}

impl Drop for NativeIterator {
    fn drop(&mut self) {
        if !self.done.get()
            && self.generation == self.state.generation.get()
            && !self.state.raw.get().is_null()
            && !self.state.executing.get()
        {
            let _guard = JsCtxGuard::new(std::ptr::null_mut());
            unsafe {
                rusqlite::ffi::sqlite3_reset(self.state.raw.get());
            }
            self.state.cursor.set(false);
        }
    }
}

struct StatementGuard<'a> {
    state: &'a StatementState,
    conn: Arc<SqliteConnection>,
    _js: JsCtxGuard,
}

struct FlagGuard<'a>(&'a Cell<bool>);
impl Drop for FlagGuard<'_> {
    fn drop(&mut self) {
        self.0.set(false);
    }
}

impl Drop for StatementGuard<'_> {
    fn drop(&mut self) {
        self.state.executing.set(false);
    }
}

impl StatementState {
    fn enter<'a, 'js>(&'a self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<StatementGuard<'a>> {
        self.pointer(ctx)?;
        let conn = self.connection.upgrade().ok_or_else(|| {
            throw_coded_error(
                ctx,
                "Error",
                "statement has been finalized",
                "ERR_INVALID_STATE",
            )
        })?;
        if self.executing.get() || conn.in_authorizer.get() || conn.mutating.get() {
            return Err(throw_coded_error(
                ctx,
                "Error",
                if conn.in_authorizer.get() {
                    "database cannot be accessed from an authorizer callback"
                } else {
                    "statement is already being executed"
                },
                "ERR_INVALID_STATE",
            ));
        }
        self.executing.set(true);
        Ok(StatementGuard {
            state: self,
            conn,
            _js: JsCtxGuard::new(ctx.as_raw().as_ptr()),
        })
    }

    fn begin<'js>(
        &self,
        ctx: &rquickjs::Ctx<'js>,
        params: &rquickjs::Value<'js>,
        bare: bool,
        unknown: bool,
    ) -> rquickjs::Result<()> {
        self.generation.set(self.generation.get().wrapping_add(1));
        self.cursor.set(false);
        let rc = unsafe { rusqlite::ffi::sqlite3_reset(self.raw.get()) };
        let conn = self.connection.upgrade().unwrap();
        check_sqlite(ctx, &conn, rc)?;
        bind_params(ctx, &conn, self.raw.get(), params, bare, unknown)
    }

    fn step<'js>(
        &self,
        ctx: &rquickjs::Ctx<'js>,
        conn: &SqliteConnection,
    ) -> rquickjs::Result<bool> {
        let rc = unsafe { rusqlite::ffi::sqlite3_step(self.raw.get()) };
        match rc {
            rusqlite::ffi::SQLITE_ROW => Ok(true),
            rusqlite::ffi::SQLITE_DONE => Ok(false),
            _ => {
                check_sqlite(ctx, conn, rc)?;
                unreachable!()
            }
        }
    }

    fn finish<'js, T>(
        &self,
        ctx: &rquickjs::Ctx<'js>,
        conn: &SqliteConnection,
        outcome: rquickjs::Result<T>,
    ) -> rquickjs::Result<T> {
        self.cursor.set(false);
        let rc = unsafe { rusqlite::ffi::sqlite3_reset(self.raw.get()) };
        match outcome {
            Ok(value) => {
                check_sqlite(ctx, conn, rc)?;
                Ok(value)
            }
            Err(error) => {
                take_pending_js_exception(ctx);
                Err(error)
            }
        }
    }
}

fn check_sqlite<'js>(
    ctx: &rquickjs::Ctx<'js>,
    conn: &SqliteConnection,
    rc: i32,
) -> rquickjs::Result<()> {
    if rc == rusqlite::ffi::SQLITE_OK {
        return Ok(());
    }
    let message = unsafe { std::ffi::CStr::from_ptr(rusqlite::ffi::sqlite3_errmsg(conn.handle())) }
        .to_string_lossy()
        .into_owned();
    Err(map_sqlite_or_udf_error(
        ctx,
        rusqlite::Error::SqliteFailure(rusqlite::ffi::Error::new(rc), Some(message)),
    ))
}

fn prepare_statement_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    sql: String,
) -> rquickjs::Result<NativeStatement> {
    let conn = connection(&ctx, conn_id)?;
    if conn.in_authorizer.get() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "database is busy",
            "ERR_INVALID_STATE",
        ));
    }
    let _guard = JsCtxGuard::new(ctx.as_raw().as_ptr());
    let sql = std::ffi::CString::new(sql).map_err(|_| {
        throw_coded_error(
            &ctx,
            "Error",
            "SQL text contains a null byte",
            "ERR_INVALID_ARG_VALUE",
        )
    })?;
    let mut raw = std::ptr::null_mut();
    let rc = unsafe {
        rusqlite::ffi::sqlite3_prepare_v2(
            conn.handle(),
            sql.as_ptr(),
            -1,
            &mut raw,
            std::ptr::null_mut(),
        )
    };
    if rc != rusqlite::ffi::SQLITE_OK {
        if !raw.is_null() {
            unsafe {
                rusqlite::ffi::sqlite3_finalize(raw);
            }
        }
        check_sqlite(&ctx, &conn, rc)?;
    }
    if raw.is_null() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "SQL text contains no statements",
            "ERR_INVALID_ARG_VALUE",
        ));
    }
    let state = Rc::new(StatementState {
        connection: Arc::downgrade(&conn),
        raw: Cell::new(raw),
        executing: Cell::new(false),
        cursor: Cell::new(false),
        generation: Cell::new(0),
    });
    let mut statements = conn.statements.borrow_mut();
    statements.retain(|s| s.strong_count() > 0);
    statements.push(Rc::downgrade(&state));
    Ok(NativeStatement { state })
}

#[rquickjs::methods]
impl NativeStatement {
    pub fn check<'js>(&self, ctx: rquickjs::Ctx<'js>) -> rquickjs::Result<()> {
        self.state.pointer(&ctx).map(|_| ())
    }

    pub fn close<'js>(&self, ctx: rquickjs::Ctx<'js>) -> rquickjs::Result<()> {
        let ptr = self.state.pointer(&ctx)?;
        let conn = self.state.connection.upgrade().unwrap();
        if self.state.executing.get() || conn.mutating.get() {
            return Err(throw_coded_error(
                &ctx,
                "Error",
                "statement is already being executed",
                "ERR_INVALID_STATE",
            ));
        }
        if conn.in_authorizer.get() && unsafe { rusqlite::ffi::sqlite3_stmt_busy(ptr) } != 0 {
            return Err(throw_coded_error(
                &ctx,
                "Error",
                "database cannot be accessed from an authorizer callback",
                "ERR_INVALID_STATE",
            ));
        }
        self.state.executing.set(true);
        let _guard = StatementGuard {
            state: &self.state,
            conn,
            _js: JsCtxGuard::new(ctx.as_raw().as_ptr()),
        };
        self.state.finalize();
        Ok(())
    }

    pub fn dispose<'js>(&self, ctx: rquickjs::Ctx<'js>) -> rquickjs::Result<()> {
        if self.state.raw.get().is_null() {
            return Ok(());
        }
        self.close(ctx)
    }

    pub fn source<'js>(&self, ctx: rquickjs::Ctx<'js>) -> rquickjs::Result<String> {
        let ptr = self.state.pointer(&ctx)?;
        Ok(
            unsafe { std::ffi::CStr::from_ptr(rusqlite::ffi::sqlite3_sql(ptr)) }
                .to_string_lossy()
                .into_owned(),
        )
    }

    pub fn stat<'js>(&self, ctx: rquickjs::Ctx<'js>, counter: String) -> rquickjs::Result<i32> {
        let ptr = self.state.pointer(&ctx)?;
        let id = match counter.as_str() {
            "fullscanStep" => 1,
            "sort" => 2,
            "autoindex" => 3,
            "vmStep" => 4,
            "reprepare" => 5,
            "run" => 6,
            "filterMiss" => 7,
            "filterHit" => 8,
            "memused" => 99,
            _ => {
                return Err(throw_coded_error(
                    &ctx,
                    "TypeError",
                    "The \"counter\" argument is not a valid statistic name.",
                    "ERR_INVALID_ARG_VALUE",
                ));
            }
        };
        Ok(unsafe { rusqlite::ffi::sqlite3_stmt_status(ptr, id, 0) })
    }

    #[qjs(rename = "resetStats")]
    pub fn reset_stats<'js>(&self, ctx: rquickjs::Ctx<'js>) -> rquickjs::Result<()> {
        let ptr = self.state.pointer(&ctx)?;
        for id in 1..=8 {
            unsafe {
                rusqlite::ffi::sqlite3_stmt_status(ptr, id, 1);
            }
        }
        Ok(())
    }
}

struct SessionState {
    session: rusqlite::session::Session<'static>,
    conn_id: u32,
}

// SAFETY: WASM is single-threaded; Session is never actually sent across threads.
unsafe impl Send for SessionState {}

struct SessionTable {
    sessions: HashMap<u32, SessionState>,
    next_id: u32,
}

impl SessionTable {
    fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            next_id: 1,
        }
    }

    fn insert(&mut self, state: SessionState) -> u32 {
        let id = self.next_id;
        self.next_id += 1;
        self.sessions.insert(id, state);
        id
    }
}

static CONN_TABLE: LazyLock<Mutex<ConnectionTable>> =
    LazyLock::new(|| Mutex::new(ConnectionTable::new()));

static SESSION_TABLE: LazyLock<Mutex<SessionTable>> =
    LazyLock::new(|| Mutex::new(SessionTable::new()));

thread_local! {
    static JS_CTX_PTR: Cell<*mut qjs::JSContext> = const { Cell::new(std::ptr::null_mut()) };
}

struct JsCtxGuard {
    prev: *mut qjs::JSContext,
}

impl JsCtxGuard {
    fn new(ctx_ptr: *mut qjs::JSContext) -> Self {
        let prev = JS_CTX_PTR.with(|p| {
            let prev = p.get();
            p.set(ctx_ptr);
            prev
        });
        JsCtxGuard { prev }
    }
}

impl Drop for JsCtxGuard {
    fn drop(&mut self) {
        JS_CTX_PTR.with(|p| p.set(self.prev));
    }
}

thread_local! {
    static PENDING_JS_EXCEPTION: RefCell<Option<rquickjs::Persistent<rquickjs::Value<'static>>>> = const { RefCell::new(None) };
}

fn save_pending_js_exception<'js>(ctx: &rquickjs::Ctx<'js>, val: rquickjs::Value<'js>) {
    PENDING_JS_EXCEPTION.with(|p| {
        *p.borrow_mut() = Some(rquickjs::Persistent::save(ctx, val));
    });
}

fn take_pending_js_exception<'js>(ctx: &rquickjs::Ctx<'js>) -> Option<rquickjs::Value<'js>> {
    PENDING_JS_EXCEPTION.with(|p| {
        p.borrow_mut()
            .take()
            .and_then(|persistent| persistent.restore(ctx).ok())
    })
}

fn map_sqlite_or_udf_error<'js>(ctx: &rquickjs::Ctx<'js>, err: rusqlite::Error) -> rquickjs::Error {
    if let Some(pending) = take_pending_js_exception(ctx) {
        return ctx.throw(pending);
    }
    sqlite_error(ctx, &err)
}

#[derive(Clone)]
struct SendPersistent<T>(rquickjs::Persistent<T>);

// SAFETY: WASM is single-threaded; Persistent is never actually sent across threads.
unsafe impl<T> Send for SendPersistent<T> {}
unsafe impl<T> Sync for SendPersistent<T> {}

impl<T: Clone> SendPersistent<T> {
    fn clone_inner(&self) -> rquickjs::Persistent<T> {
        self.0.clone()
    }
}

fn sqlite_error<'js>(ctx: &rquickjs::Ctx<'js>, err: &rusqlite::Error) -> rquickjs::Error {
    match create_sqlite_error(ctx, err) {
        Ok(e) => e,
        Err(_) => rquickjs::Exception::throw_message(ctx, &format!("SQLite error: {}", err)),
    }
}

fn create_sqlite_error<'js>(
    ctx: &rquickjs::Ctx<'js>,
    err: &rusqlite::Error,
) -> rquickjs::Result<rquickjs::Error> {
    let (message, errcode_val, errstr_val) = match err {
        rusqlite::Error::SqliteFailure(ffi_err, msg) => {
            let message = msg.as_deref().unwrap_or("unknown error").to_string();
            let extended = ffi_err.extended_code;
            let primary = extended & 0xFF;
            let errstr = unsafe {
                let ptr = sqlite3_errstr(primary);
                std::ffi::CStr::from_ptr(ptr).to_string_lossy().into_owned()
            };
            (message, Some(extended), Some(errstr))
        }
        _ => (err.to_string(), None, None),
    };

    let globals = ctx.globals();
    let error_ctor: rquickjs::Function = globals.get("Error")?;
    let error_obj: rquickjs::Object = error_ctor.call((&message,))?;
    error_obj.set("code", "ERR_SQLITE_ERROR")?;
    if let Some(ec) = errcode_val {
        error_obj.set("errcode", ec)?;
    }
    if let Some(es) = errstr_val {
        error_obj.set("errstr", es)?;
    }
    Ok(ctx.throw(error_obj.into_value()))
}

fn create_error_object<'js>(
    ctx: &rquickjs::Ctx<'js>,
    error_type: &str,
    message: &str,
    code: &str,
) -> rquickjs::Result<rquickjs::Object<'js>> {
    let globals = ctx.globals();
    let error_ctor: rquickjs::Function = globals.get(error_type)?;
    let error_obj: rquickjs::Object = error_ctor.call((message,))?;
    error_obj.set("code", code)?;
    Ok(error_obj)
}

fn throw_coded_error<'js>(
    ctx: &rquickjs::Ctx<'js>,
    error_type: &str,
    message: &str,
    code: &str,
) -> rquickjs::Error {
    match create_error_object(ctx, error_type, message, code) {
        Ok(obj) => ctx.throw(obj.into_value()),
        Err(_) => rquickjs::Exception::throw_message(ctx, message),
    }
}

fn save_udf_error<'js>(
    ctx: &rquickjs::Ctx<'js>,
    error_type: &str,
    message: &str,
    code: &str,
) -> rusqlite::Error {
    if let Ok(error_obj) = create_error_object(ctx, error_type, message, code) {
        save_pending_js_exception(ctx, error_obj.into_value());
    }
    rusqlite::Error::UserFunctionError(message.to_string().into())
}

fn js_value_to_sqlite<'js>(
    ctx: &rquickjs::Ctx<'js>,
    val: &rquickjs::Value<'js>,
    param_pos: usize,
) -> rquickjs::Result<rusqlite::types::Value> {
    if val.is_null() {
        return Ok(rusqlite::types::Value::Null);
    }
    if let Some(b) = val.as_bool() {
        return Ok(rusqlite::types::Value::Integer(if b { 1 } else { 0 }));
    }
    if let Some(i) = val.as_int() {
        return Ok(rusqlite::types::Value::Real(i as f64));
    }
    if let Some(f) = val.as_float() {
        return Ok(rusqlite::types::Value::Real(f));
    }
    if val.is_big_int() {
        // Convert BigInt to string and parse as i128 to reliably check range,
        // because QuickJS's to_i64() truncates instead of returning an error.
        let globals = ctx.globals();
        let string_fn: rquickjs::Function = globals.get("String")?;
        let str_val: String = string_fn.call((val.clone(),))?;
        return match str_val.parse::<i128>() {
            Ok(big) if big >= i64::MIN as i128 && big <= i64::MAX as i128 => {
                Ok(rusqlite::types::Value::Integer(big as i64))
            }
            _ => Err(throw_coded_error(
                ctx,
                "RangeError",
                &format!(
                    "BigInt value is too large to bind to a SQLite parameter: parameter {}",
                    param_pos
                ),
                "ERR_INVALID_ARG_VALUE",
            )),
        };
    }
    if let Some(s) = val.as_string() {
        let s = s.to_string()?;
        return Ok(rusqlite::types::Value::Text(s));
    }
    if let Ok(ta) = rquickjs::TypedArray::<u8>::from_value(val.clone()) {
        let bytes = crate::wrappers::copy_typed_array_bytes(&ta)
            .ok_or_else(|| rquickjs::Exception::throw_message(ctx, "detached TypedArray buffer"))?;
        return Ok(rusqlite::types::Value::Blob(bytes));
    }
    // Check for other TypedArray types or DataView (has .buffer property)
    if let Some(obj) = val.as_object()
        && let Ok(buffer_val) = obj.get::<_, rquickjs::Value<'js>>("buffer")
        && !buffer_val.is_undefined()
        && !buffer_val.is_null()
    {
        let byte_offset: usize = obj.get::<_, f64>("byteOffset").unwrap_or(0.0) as usize;
        let byte_length: usize = obj.get::<_, f64>("byteLength").unwrap_or(0.0) as usize;
        if let Some(ab) = rquickjs::ArrayBuffer::from_value(buffer_val)
            // SAFETY: All JS property access is complete. The following slice
            // copy cannot execute JS or suspend, and ab roots its backing bytes.
            && let Some(raw_bytes) = unsafe { ab.as_bytes() }
        {
            let buf_len = raw_bytes.len();
            let end = (byte_offset + byte_length).min(buf_len);
            let start = byte_offset.min(end);
            let bytes = raw_bytes[start..end].to_vec();
            return Ok(rusqlite::types::Value::Blob(bytes));
        }
    }
    // Unsupported type (undefined, function, symbol, regex, Promise, Map, Set, etc.)
    Err(throw_coded_error(
        ctx,
        "TypeError",
        &format!(
            "Provided value cannot be bound to SQLite parameter {}",
            param_pos
        ),
        "ERR_INVALID_ARG_TYPE",
    ))
}

fn sqlite_value_to_js<'js>(
    ctx: &rquickjs::Ctx<'js>,
    val: &ValueRef<'_>,
    read_big_ints: bool,
    col_index: usize,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    use rquickjs::IntoJs;
    match val {
        ValueRef::Null => Ok(rquickjs::Value::new_null(ctx.clone())),
        ValueRef::Integer(i) => {
            if read_big_ints {
                let bigint = rquickjs::BigInt::from_i64(ctx.clone(), *i)?;
                Ok(rquickjs::Value::from_big_int(bigint))
            } else if *i > MAX_SAFE_INTEGER || *i < MIN_SAFE_INTEGER {
                Err(throw_coded_error(
                    ctx,
                    "RangeError",
                    &format!(
                        "The value of column {} is too large to be represented as a JavaScript number: {}",
                        col_index, i
                    ),
                    "ERR_OUT_OF_RANGE",
                ))
            } else if *i >= i32::MIN as i64 && *i <= i32::MAX as i64 {
                (*i as i32).into_js(ctx)
            } else {
                (*i as f64).into_js(ctx)
            }
        }
        ValueRef::Real(f) => f.into_js(ctx),
        ValueRef::Text(bytes) => {
            let s = std::str::from_utf8(bytes).map_err(|_| {
                rquickjs::Exception::throw_message(ctx, "Invalid UTF-8 in SQLite TEXT value")
            })?;
            s.into_js(ctx)
        }
        ValueRef::Blob(bytes) => {
            let typed_array =
                rquickjs::TypedArray::<u8>::new_copy(ctx.clone(), bytes).map_err(|_| {
                    rquickjs::Exception::throw_message(ctx, "Failed to create TypedArray for BLOB")
                })?;
            Ok(typed_array.into_value())
        }
    }
}

fn sqlite_owned_value_to_js<'js>(
    ctx: &rquickjs::Ctx<'js>,
    val: &rusqlite::types::Value,
    read_big_ints: bool,
    col_index: usize,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    use rquickjs::IntoJs;
    match val {
        rusqlite::types::Value::Null => Ok(rquickjs::Value::new_null(ctx.clone())),
        rusqlite::types::Value::Integer(i) => {
            if read_big_ints {
                let bigint = rquickjs::BigInt::from_i64(ctx.clone(), *i)?;
                Ok(rquickjs::Value::from_big_int(bigint))
            } else if *i > MAX_SAFE_INTEGER || *i < MIN_SAFE_INTEGER {
                Err(throw_coded_error(
                    ctx,
                    "RangeError",
                    &format!(
                        "The value of column {} is too large to be represented as a JavaScript number: {}",
                        col_index, i
                    ),
                    "ERR_OUT_OF_RANGE",
                ))
            } else if *i >= i32::MIN as i64 && *i <= i32::MAX as i64 {
                (*i as i32).into_js(ctx)
            } else {
                (*i as f64).into_js(ctx)
            }
        }
        rusqlite::types::Value::Real(f) => f.into_js(ctx),
        rusqlite::types::Value::Text(s) => s.as_str().into_js(ctx),
        rusqlite::types::Value::Blob(bytes) => {
            let typed_array =
                rquickjs::TypedArray::<u8>::new_copy(ctx.clone(), bytes).map_err(|_| {
                    rquickjs::Exception::throw_message(ctx, "Failed to create TypedArray for BLOB")
                })?;
            Ok(typed_array.into_value())
        }
    }
}

fn create_null_proto_object<'js>(
    ctx: &rquickjs::Ctx<'js>,
) -> rquickjs::Result<rquickjs::Object<'js>> {
    let globals = ctx.globals();
    let object_ctor: rquickjs::Object = globals.get("Object")?;
    let create_fn: rquickjs::Function = object_ctor.get("create")?;
    create_fn.call((rquickjs::Value::new_null(ctx.clone()),))
}

fn row_to_js<'js>(
    ctx: &rquickjs::Ctx<'js>,
    stmt: *mut rusqlite::ffi::sqlite3_stmt,
    return_arrays: bool,
    read_big_ints: bool,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    use rusqlite::{ffi, types::Value};
    let mut names = Vec::new();
    let mut values = Vec::new();
    // SAFETY: the caller has stepped to SQLITE_ROW and holds the statement
    // execution guard. Copy all SQLite bytes before any JS allocation/property
    // creation can run user code or GC finalizers.
    unsafe {
        for i in 0..ffi::sqlite3_column_count(stmt) {
            names.push(
                std::ffi::CStr::from_ptr(ffi::sqlite3_column_name(stmt, i))
                    .to_string_lossy()
                    .into_owned(),
            );
            values.push(match ffi::sqlite3_column_type(stmt, i) {
                ffi::SQLITE_INTEGER => Value::Integer(ffi::sqlite3_column_int64(stmt, i)),
                ffi::SQLITE_FLOAT => Value::Real(ffi::sqlite3_column_double(stmt, i)),
                ffi::SQLITE_TEXT => {
                    let ptr = ffi::sqlite3_column_text(stmt, i);
                    let len = ffi::sqlite3_column_bytes(stmt, i) as usize;
                    let bytes = if len == 0 {
                        &[]
                    } else {
                        std::slice::from_raw_parts(ptr, len)
                    };
                    Value::Text(
                        std::str::from_utf8(bytes)
                            .map_err(|_| {
                                rquickjs::Exception::throw_message(
                                    ctx,
                                    "Invalid UTF-8 in SQLite TEXT value",
                                )
                            })?
                            .to_string(),
                    )
                }
                ffi::SQLITE_BLOB => {
                    let ptr = ffi::sqlite3_column_blob(stmt, i);
                    let len = ffi::sqlite3_column_bytes(stmt, i) as usize;
                    Value::Blob(if len == 0 {
                        Vec::new()
                    } else {
                        std::slice::from_raw_parts(ptr.cast::<u8>(), len).to_vec()
                    })
                }
                _ => Value::Null,
            });
        }
    }
    owned_row_to_js(ctx, &names, &values, return_arrays, read_big_ints)
}

fn owned_row_to_js<'js>(
    ctx: &rquickjs::Ctx<'js>,
    col_names: &[String],
    values: &[rusqlite::types::Value],
    return_arrays: bool,
    read_big_ints: bool,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    if return_arrays {
        let arr = rquickjs::Array::new(ctx.clone())?;
        for (i, val) in values.iter().enumerate() {
            let js_val = sqlite_owned_value_to_js(ctx, val, read_big_ints, i)?;
            arr.set(i, js_val)?;
        }
        Ok(arr.into_value())
    } else {
        let obj = create_null_proto_object(ctx)?;
        for (i, name) in col_names.iter().enumerate() {
            let js_val = sqlite_owned_value_to_js(ctx, &values[i], read_big_ints, i)?;
            obj.set(name.as_str(), js_val)?;
        }
        Ok(obj.into_value())
    }
}

fn lock_conn_table<'js>(
    ctx: &rquickjs::Ctx<'js>,
) -> rquickjs::Result<std::sync::MutexGuard<'static, ConnectionTable>> {
    CONN_TABLE.lock().map_err(|_| {
        rquickjs::Exception::throw_message(ctx, "sqlite connection table lock poisoned")
    })
}

fn connection<'js>(ctx: &rquickjs::Ctx<'js>, id: u32) -> rquickjs::Result<Arc<SqliteConnection>> {
    let conn = lock_conn_table(ctx)?
        .connections
        .get(&id)
        .cloned()
        .ok_or_else(|| {
            throw_coded_error(ctx, "Error", "database is not open", "ERR_INVALID_STATE")
        })?;
    if conn.mutating.get() {
        return Err(throw_coded_error(
            ctx,
            "Error",
            "database is busy",
            "ERR_INVALID_STATE",
        ));
    }
    Ok(conn)
}

fn check_idle_connection<'js>(
    ctx: &rquickjs::Ctx<'js>,
    conn: &Arc<SqliteConnection>,
    message: &str,
) -> rquickjs::Result<()> {
    // The table and the current operation own the only strong references when
    // no SQLite call is on the stack. Statements retain weak connection links.
    if Arc::strong_count(conn) > 2 || conn.in_authorizer.get() {
        return Err(throw_coded_error(
            ctx,
            "Error",
            message,
            "ERR_INVALID_STATE",
        ));
    }
    Ok(())
}

fn finalize_statements(conn: &SqliteConnection) {
    let statements: Vec<_> = conn
        .statements
        .borrow_mut()
        .drain(..)
        .filter_map(|s| s.upgrade())
        .collect();
    // No registry borrow survives sqlite3_finalize (aggregate cleanup can call JS).
    for stmt in statements {
        stmt.finalize();
    }
}

fn bind_params<'js>(
    ctx: &rquickjs::Ctx<'js>,
    conn: &SqliteConnection,
    stmt: *mut rusqlite::ffi::sqlite3_stmt,
    params: &rquickjs::Value<'js>,
    allow_bare_named: bool,
    allow_unknown_named: bool,
) -> rquickjs::Result<()> {
    use rusqlite::ffi;
    // SAFETY: the caller owns a live statement and holds its execution guard.
    unsafe {
        ffi::sqlite3_clear_bindings(stmt);
    }
    if params.is_null() || params.is_undefined() {
        return Ok(());
    }

    if let Some(arr) = params.as_array() {
        for i in 0..arr.len() {
            let val: rquickjs::Value<'js> = arr.get(i)?;
            bind_value(ctx, conn, stmt, i + 1, &val)?;
        }
    } else if params.is_object() {
        let obj = params.as_object().ok_or_else(|| {
            rquickjs::Exception::throw_message(ctx, "expected object for named parameters")
        })?;
        let mut bare_names = HashMap::new();
        if allow_bare_named {
            for idx in 1..=unsafe { ffi::sqlite3_bind_parameter_count(stmt) } {
                let ptr = unsafe { ffi::sqlite3_bind_parameter_name(stmt, idx) };
                if ptr.is_null() {
                    continue;
                }
                let name = unsafe { std::ffi::CStr::from_ptr(ptr) }
                    .to_string_lossy()
                    .into_owned();
                let bare = name[1..].to_string();
                if let Some((other, _)) = bare_names.insert(bare.clone(), (name.clone(), idx)) {
                    return Err(throw_coded_error(
                        ctx,
                        "Error",
                        &format!(
                            "Cannot create bare named parameter '{}' because of conflicting names '{}' and '{}'.",
                            bare, other, name
                        ),
                        "ERR_INVALID_STATE",
                    ));
                }
            }
        }
        // Enumerate keys without reading values: ignored unknown keys must not
        // invoke getters, and recognized getters run exactly once.
        let keys: Vec<String> = obj
            .own_keys(rquickjs::object::Filter::default())
            .collect::<rquickjs::Result<_>>()?;
        for key in keys {
            let name = std::ffi::CString::new(key.as_str()).ok();
            let mut idx = name.as_ref().map_or(0, |name| unsafe {
                ffi::sqlite3_bind_parameter_index(stmt, name.as_ptr())
            });
            if idx == 0 && allow_bare_named {
                idx = bare_names.get(&key).map_or(0, |(_, idx)| *idx);
            }
            if idx == 0 {
                if allow_unknown_named {
                    continue;
                }
                return Err(throw_coded_error(
                    ctx,
                    "Error",
                    &format!("Unknown named parameter '{}'", key),
                    "ERR_INVALID_STATE",
                ));
            }
            let val = obj.get(key)?;
            bind_value(ctx, conn, stmt, idx as usize, &val)?;
        }
    }
    Ok(())
}

fn bind_value<'js>(
    ctx: &rquickjs::Ctx<'js>,
    conn: &SqliteConnection,
    stmt: *mut rusqlite::ffi::sqlite3_stmt,
    index: usize,
    val: &rquickjs::Value<'js>,
) -> rquickjs::Result<()> {
    use rusqlite::{ffi, types::Value};
    let value = js_value_to_sqlite(ctx, val, index)?;
    // SAFETY: handle is live/guarded; SQLite copies string/blob bytes before the
    // owned Rust value is dropped, including empty blobs (a non-null slice ptr).
    let rc = unsafe {
        match value {
            Value::Null => ffi::sqlite3_bind_null(stmt, index as i32),
            Value::Integer(i) => ffi::sqlite3_bind_int64(stmt, index as i32, i),
            Value::Real(f) => ffi::sqlite3_bind_double(stmt, index as i32, f),
            Value::Text(s) => ffi::sqlite3_bind_text64(
                stmt,
                index as i32,
                s.as_ptr().cast(),
                s.len() as u64,
                ffi::SQLITE_TRANSIENT(),
                ffi::SQLITE_UTF8 as u8,
            ),
            Value::Blob(b) => ffi::sqlite3_bind_blob64(
                stmt,
                index as i32,
                b.as_ptr().cast(),
                b.len() as u64,
                ffi::SQLITE_TRANSIENT(),
            ),
        }
    };
    check_sqlite(ctx, conn, rc)
}

fn open_database_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    path: String,
    read_only: bool,
    enable_foreign_keys: bool,
    enable_dqs: bool,
    timeout: u32,
) -> rquickjs::Result<u32> {
    crate::internal::preinit::check("SQLite database open", &path);
    let conn = if path == ":memory:" {
        rusqlite::Connection::open_in_memory().map_err(|e| sqlite_error(&ctx, &e))?
    } else {
        let flags = if read_only {
            OpenFlags::SQLITE_OPEN_READ_ONLY
        } else {
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE
        };
        rusqlite::Connection::open_with_flags(&path, flags).map_err(|e| sqlite_error(&ctx, &e))?
    };

    // Node.js compiles sqlite with math functions enabled. libsqlite3-sys does not,
    // so expose PI() explicitly for node:sqlite compatibility.
    conn.create_scalar_function(
        "pi",
        0,
        FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
        |_| Ok(std::f64::consts::PI),
    )
    .map_err(|e| sqlite_error(&ctx, &e))?;

    if enable_foreign_keys {
        conn.execute_batch("PRAGMA foreign_keys = ON")
            .map_err(|e| sqlite_error(&ctx, &e))?;
    } else {
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .map_err(|e| sqlite_error(&ctx, &e))?;
    }

    conn.set_db_config(
        rusqlite::config::DbConfig::SQLITE_DBCONFIG_DQS_DML,
        enable_dqs,
    )
    .map_err(|e| sqlite_error(&ctx, &e))?;
    conn.set_db_config(
        rusqlite::config::DbConfig::SQLITE_DBCONFIG_DQS_DDL,
        enable_dqs,
    )
    .map_err(|e| sqlite_error(&ctx, &e))?;

    if timeout > 0 {
        conn.busy_timeout(Duration::from_millis(timeout as u64))
            .map_err(|e| sqlite_error(&ctx, &e))?;
    }

    conn.set_db_config(rusqlite::config::DbConfig::SQLITE_DBCONFIG_DEFENSIVE, true)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    let mut table = lock_conn_table(&ctx)?;
    let id = table.insert(conn);
    Ok(id)
}

fn close_database_impl<'js>(ctx: rquickjs::Ctx<'js>, conn_id: u32) -> rquickjs::Result<()> {
    let conn = connection(&ctx, conn_id)?;
    check_idle_connection(&ctx, &conn, "database cannot be closed while in a callback")?;
    let _guard = JsCtxGuard::new(ctx.as_raw().as_ptr());
    conn.mutating.set(true);
    let _mutation = FlagGuard(&conn.mutating);
    finalize_statements(&conn);
    // Clean up sessions associated with this connection first
    if let Ok(mut session_table) = SESSION_TABLE.lock() {
        session_table
            .sessions
            .retain(|_, state| state.conn_id != conn_id);
    }

    let mut table = lock_conn_table(&ctx)?;
    if table.connections.remove(&conn_id).is_none() {
        return Err(rquickjs::Exception::throw_message(
            &ctx,
            "database is not open",
        ));
    }
    Ok(())
}

fn exec_sql_impl<'js>(ctx: rquickjs::Ctx<'js>, conn_id: u32, sql: String) -> rquickjs::Result<()> {
    let _guard = JsCtxGuard::new(ctx.as_raw().as_ptr());
    let conn = connection(&ctx, conn_id)?;
    if conn.in_authorizer.get() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "database is busy",
            "ERR_INVALID_STATE",
        ));
    }
    conn.execute_batch(&sql)
        .map_err(|e| map_sqlite_or_udf_error(&ctx, e))?;
    Ok(())
}

fn is_open_impl(conn_id: u32) -> bool {
    CONN_TABLE
        .lock()
        .map(|t| t.connections.contains_key(&conn_id))
        .unwrap_or(false)
}

fn is_autocommit_impl(conn_id: u32) -> bool {
    CONN_TABLE
        .lock()
        .ok()
        .and_then(|t| t.connections.get(&conn_id).map(|c| c.is_autocommit()))
        .unwrap_or(false)
}

fn stmt_run_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    stmt: &NativeStatement,
    params: rquickjs::Value<'js>,
    allow_bare_named: bool,
    allow_unknown_named: bool,
    read_big_ints: bool,
) -> rquickjs::Result<rquickjs::Object<'js>> {
    let guard = stmt.state.enter(&ctx)?;
    let outcome = (|| {
        stmt.state
            .begin(&ctx, &params, allow_bare_named, allow_unknown_named)?;
        while stmt.state.step(&ctx, &guard.conn)? {}
        Ok(())
    })();
    stmt.state.finish(&ctx, &guard.conn, outcome)?;
    let changes = guard.conn.changes();
    let last_rowid = guard.conn.last_insert_rowid();

    let result = rquickjs::Object::new(ctx.clone())?;
    if read_big_ints {
        let changes_bi = rquickjs::BigInt::from_i64(ctx.clone(), changes as i64)?;
        result.set("changes", rquickjs::Value::from_big_int(changes_bi))?;
        let rowid_bi = rquickjs::BigInt::from_i64(ctx.clone(), last_rowid)?;
        result.set("lastInsertRowid", rquickjs::Value::from_big_int(rowid_bi))?;
    } else {
        result.set("changes", changes as f64)?;
        result.set("lastInsertRowid", last_rowid as f64)?;
    }
    Ok(result)
}

#[derive(Clone, Copy)]
struct StatementResultOptions {
    allow_bare_named: bool,
    allow_unknown_named: bool,
    read_big_ints: bool,
    return_arrays: bool,
}

fn stmt_get_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    stmt: &NativeStatement,
    params: rquickjs::Value<'js>,
    options: StatementResultOptions,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    let guard = stmt.state.enter(&ctx)?;
    let outcome = (|| {
        stmt.state.begin(
            &ctx,
            &params,
            options.allow_bare_named,
            options.allow_unknown_named,
        )?;
        if stmt.state.step(&ctx, &guard.conn)? {
            row_to_js(
                &ctx,
                stmt.state.raw.get(),
                options.return_arrays,
                options.read_big_ints,
            )
        } else {
            Ok(rquickjs::Value::new_undefined(ctx.clone()))
        }
    })();
    stmt.state.finish(&ctx, &guard.conn, outcome)
}

fn stmt_all_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    stmt: &NativeStatement,
    params: rquickjs::Value<'js>,
    options: StatementResultOptions,
) -> rquickjs::Result<rquickjs::Array<'js>> {
    let guard = stmt.state.enter(&ctx)?;
    let outcome = (|| {
        stmt.state.begin(
            &ctx,
            &params,
            options.allow_bare_named,
            options.allow_unknown_named,
        )?;
        let result = rquickjs::Array::new(ctx.clone())?;
        let mut idx = 0;
        while stmt.state.step(&ctx, &guard.conn)? {
            result.set(
                idx,
                row_to_js(
                    &ctx,
                    stmt.state.raw.get(),
                    options.return_arrays,
                    options.read_big_ints,
                )?,
            )?;
            idx += 1;
        }
        Ok(result)
    })();
    stmt.state.finish(&ctx, &guard.conn, outcome)
}

fn stmt_expanded_sql_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    stmt: &NativeStatement,
) -> rquickjs::Result<String> {
    let ptr = stmt.state.pointer(&ctx)?;
    let text = unsafe { rusqlite::ffi::sqlite3_expanded_sql(ptr) };
    if text.is_null() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "Expanded SQL text would exceed configured limits",
            "ERR_SQLITE_ERROR",
        ));
    }
    let result = unsafe { std::ffi::CStr::from_ptr(text) }
        .to_string_lossy()
        .into_owned();
    unsafe {
        rusqlite::ffi::sqlite3_free(text.cast());
    }
    Ok(result)
}

fn stmt_columns_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    stmt: &NativeStatement,
) -> rquickjs::Result<rquickjs::Array<'js>> {
    let ptr = stmt.state.pointer(&ctx)?;
    let col_count = unsafe { rusqlite::ffi::sqlite3_column_count(ptr) };
    // Copy all SQLite-owned strings before allocating JS objects or invoking
    // inherited setters, which can finalize this statement through reentry.
    let names: Vec<String> = (0..col_count)
        .map(|i| {
            unsafe { std::ffi::CStr::from_ptr(rusqlite::ffi::sqlite3_column_name(ptr, i)) }
                .to_string_lossy()
                .into_owned()
        })
        .collect();
    let result = rquickjs::Array::new(ctx.clone())?;

    for (i, name) in names.iter().enumerate() {
        let info = rquickjs::Object::new(ctx.clone())?;
        info.set("name", name.as_str())?;
        info.set("column", rquickjs::Value::new_null(ctx.clone()))?;
        info.set("table", rquickjs::Value::new_null(ctx.clone()))?;
        info.set("database", rquickjs::Value::new_null(ctx.clone()))?;
        info.set("type", rquickjs::Value::new_null(ctx.clone()))?;
        result.set(i, info)?;
    }

    Ok(result)
}

fn stmt_iterate_init_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    stmt: &NativeStatement,
    params: rquickjs::Value<'js>,
    allow_bare_named: bool,
    allow_unknown_named: bool,
) -> rquickjs::Result<NativeIterator> {
    let guard = stmt.state.enter(&ctx)?;
    if let Err(error) = stmt
        .state
        .begin(&ctx, &params, allow_bare_named, allow_unknown_named)
    {
        return stmt.state.finish(&ctx, &guard.conn, Err(error));
    }
    stmt.state.cursor.set(true);
    Ok(NativeIterator {
        state: stmt.state.clone(),
        generation: stmt.state.generation.get(),
        done: Cell::new(false),
    })
}

fn stmt_iterate_next_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    iter: &NativeIterator,
    read_big_ints: bool,
    return_arrays: bool,
) -> rquickjs::Result<rquickjs::Object<'js>> {
    iter.state.pointer(&ctx)?;
    let result = create_null_proto_object(&ctx)?;
    if iter.done.get() {
        result.set("value", rquickjs::Value::new_null(ctx.clone()))?;
        result.set("done", true)?;
        return Ok(result);
    }
    let guard = iter.state.enter(&ctx)?;
    if iter.generation != iter.state.generation.get() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "iterator was invalidated",
            "ERR_INVALID_STATE",
        ));
    }
    if iter.state.step(&ctx, &guard.conn)? {
        result.set(
            "value",
            row_to_js(&ctx, iter.state.raw.get(), return_arrays, read_big_ints)?,
        )?;
        result.set("done", false)?;
    } else {
        iter.done.set(true);
        iter.state.finish(&ctx, &guard.conn, Ok(()))?;
        result.set("value", rquickjs::Value::new_null(ctx.clone()))?;
        result.set("done", true)?;
    }
    Ok(result)
}

fn stmt_iterate_return_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    iter: &NativeIterator,
) -> rquickjs::Result<()> {
    iter.state.pointer(&ctx)?;
    if !iter.done.get() {
        let _guard = iter.state.enter(&ctx)?;
        // Return must not replace a pending loop-body exception with reset's
        // deferred SQLite error. Invalidation still prevents next() afterwards.
        unsafe {
            rusqlite::ffi::sqlite3_reset(iter.state.raw.get());
        }
        // Node resets even for a stale iterator, but it must not clear the
        // recovery guard owned by a newer, still-live iterator.
        if iter.generation == iter.state.generation.get() {
            iter.state.cursor.set(false);
        }
        iter.done.set(true);
        take_pending_js_exception(&ctx);
    }
    Ok(())
}

/// Reconstruct a temporary `Ctx` from the thread-local raw pointer.
///
/// # Safety
/// The caller must ensure that `JS_CTX_PTR` was set by a `JsCtxGuard` that is
/// still alive (i.e. the originating `Ctx<'js>` is on the stack). This is
/// guaranteed when called from within rusqlite UDF closures during statement
/// execution, because our `stmt_*` functions set the guard before executing.
///
/// `Ctx::from_raw` dups the context (increments refcount). When the returned
/// `Ctx` is dropped it frees once, so the net refcount change is zero.
unsafe fn get_udf_js_ctx() -> Result<rquickjs::Ctx<'static>, rusqlite::Error> {
    let raw_ctx = JS_CTX_PTR.with(|p| p.get());
    let nn = std::ptr::NonNull::new(raw_ctx).ok_or_else(|| {
        rusqlite::Error::UserFunctionError("No JS context available for UDF callback".into())
    })?;
    Ok(unsafe { rquickjs::Ctx::from_raw(nn) })
}

fn udf_sqlite_value_to_js<'js>(
    ctx: &rquickjs::Ctx<'js>,
    val: &ValueRef<'_>,
    use_big_int_args: bool,
) -> Result<rquickjs::Value<'js>, rusqlite::Error> {
    match val {
        ValueRef::Integer(i)
            if !use_big_int_args && (*i > MAX_SAFE_INTEGER || *i < MIN_SAFE_INTEGER) =>
        {
            let msg = format!(
                "Value is too large to be represented as a JavaScript number: {}",
                i
            );
            Err(save_udf_error(ctx, "RangeError", &msg, "ERR_OUT_OF_RANGE"))
        }
        _ => sqlite_value_to_js(ctx, val, use_big_int_args, 0)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into())),
    }
}

fn udf_js_result_to_sqlite<'js>(
    ctx: &rquickjs::Ctx<'js>,
    result: &rquickjs::Value<'js>,
) -> Result<rusqlite::types::Value, rusqlite::Error> {
    if result.is_null() || result.is_undefined() {
        return Ok(rusqlite::types::Value::Null);
    }
    if let Some(b) = result.as_bool() {
        return Ok(rusqlite::types::Value::Integer(if b { 1 } else { 0 }));
    }
    if let Some(i) = result.as_int() {
        return Ok(rusqlite::types::Value::Integer(i as i64));
    }
    if let Some(f) = result.as_float() {
        if f.fract() == 0.0 && f >= i64::MIN as f64 && f <= i64::MAX as f64 {
            return Ok(rusqlite::types::Value::Integer(f as i64));
        }
        return Ok(rusqlite::types::Value::Real(f));
    }
    if result.is_big_int() {
        let bigint = result
            .as_big_int()
            .ok_or_else(|| rusqlite::Error::UserFunctionError("Failed to convert BigInt".into()))?;
        let i = bigint
            .clone()
            .to_i64()
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;
        if !(MIN_SAFE_INTEGER..=MAX_SAFE_INTEGER).contains(&i) {
            return Err(save_udf_error(
                ctx,
                "RangeError",
                &format!("BigInt value is out of range: {}", i),
                "ERR_OUT_OF_RANGE",
            ));
        }
        return Ok(rusqlite::types::Value::Integer(i));
    }
    if let Some(s) = result.as_string() {
        let s = s
            .to_string()
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;
        return Ok(rusqlite::types::Value::Text(s));
    }
    // Check for Promise (thenable) before TypedArray
    if let Some(obj) = result.as_object()
        && let Ok(then_val) = obj.get::<_, rquickjs::Value>("then")
        && then_val.is_function()
    {
        return Err(rusqlite::Error::UserFunctionError(
            "Asynchronous user-defined functions are not supported".into(),
        ));
    }
    if let Ok(ta) = rquickjs::TypedArray::<u8>::from_value(result.clone()) {
        let bytes = crate::wrappers::copy_typed_array_bytes(&ta).ok_or_else(|| {
            rusqlite::Error::UserFunctionError("detached TypedArray buffer".into())
        })?;
        return Ok(rusqlite::types::Value::Blob(bytes));
    }
    if result.is_function() {
        return Err(rusqlite::Error::UserFunctionError(
            "Returned JavaScript value cannot be converted to a SQLite value".into(),
        ));
    }
    Ok(rusqlite::types::Value::Null)
}

fn build_function_flags(deterministic: bool, direct_only: bool) -> FunctionFlags {
    let mut flags = FunctionFlags::SQLITE_UTF8;
    if deterministic {
        flags |= FunctionFlags::SQLITE_DETERMINISTIC;
    }
    if direct_only {
        flags |= FunctionFlags::SQLITE_DIRECTONLY;
    }
    flags
}

#[derive(Clone, Copy)]
struct FunctionOptions {
    deterministic: bool,
    direct_only: bool,
    use_big_int_args: bool,
    varargs: bool,
    num_args: i32,
}

fn register_function_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    name: String,
    callback: rquickjs::Function<'js>,
    options: FunctionOptions,
) -> rquickjs::Result<()> {
    let persistent_fn = SendPersistent(rquickjs::Persistent::save(&ctx, callback));
    let flags = build_function_flags(options.deterministic, options.direct_only);
    let n_arg = if options.varargs {
        -1
    } else {
        options.num_args
    };

    let conn = connection(&ctx, conn_id)?;

    conn.create_scalar_function(&*name, n_arg, flags, move |fctx| {
        // SAFETY: The UDF closure is called synchronously during statement
        // execution, which is always within a JsCtxGuard scope.
        let js_ctx = unsafe { get_udf_js_ctx()? };

        let func: rquickjs::Function<'_> = persistent_fn
            .clone_inner()
            .restore(&js_ctx)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;

        let args_count = fctx.len();
        let mut js_args = Vec::with_capacity(args_count);
        for i in 0..args_count {
            let val = fctx.get_raw(i);
            let js_val = udf_sqlite_value_to_js(&js_ctx, &val, options.use_big_int_args)?;
            js_args.push(js_val);
        }

        let mut call_args = rquickjs::function::Args::new(js_ctx.clone(), js_args.len());
        call_args
            .push_args(js_args)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;
        let result: rquickjs::Value<'_> = func.call_arg(call_args).map_err(|e| {
            if matches!(e, rquickjs::Error::Exception) {
                let exception = js_ctx.catch();
                save_pending_js_exception(&js_ctx, exception);
            }
            rusqlite::Error::UserFunctionError(format!("{}", e).into())
        })?;

        udf_js_result_to_sqlite(&js_ctx, &result)
    })
    .map_err(|e| sqlite_error(&ctx, &e))?;

    Ok(())
}

struct JsAggregate {
    start: rquickjs::Persistent<rquickjs::Value<'static>>,
    step: rquickjs::Persistent<rquickjs::Function<'static>>,
    result_fn: Option<rquickjs::Persistent<rquickjs::Function<'static>>>,
    use_big_int_args: bool,
}

// SAFETY: WASM is single-threaded; these are never actually sent across threads.
unsafe impl Send for JsAggregate {}
unsafe impl Sync for JsAggregate {}

struct JsAccumulator(rquickjs::Persistent<rquickjs::Value<'static>>);

impl RefUnwindSafe for JsAccumulator {}
impl UnwindSafe for JsAccumulator {}

impl rusqlite::functions::Aggregate<JsAccumulator, rusqlite::types::Value> for JsAggregate {
    fn init(&self, _ctx: &mut rusqlite::functions::Context<'_>) -> rusqlite::Result<JsAccumulator> {
        let js_ctx = unsafe { get_udf_js_ctx()? };
        let start_val: rquickjs::Value<'_> = self
            .start
            .clone()
            .restore(&js_ctx)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;

        // If start is a function, call it to get the initial value
        let init_val = if start_val.is_function() {
            let func = start_val.as_function().ok_or_else(|| {
                rusqlite::Error::UserFunctionError("start is not a function".into())
            })?;
            func.call::<_, rquickjs::Value<'_>>(())
                .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?
        } else {
            start_val
        };

        Ok(JsAccumulator(rquickjs::Persistent::save(&js_ctx, init_val)))
    }

    fn step(
        &self,
        fctx: &mut rusqlite::functions::Context<'_>,
        acc: &mut JsAccumulator,
    ) -> rusqlite::Result<()> {
        let js_ctx = unsafe { get_udf_js_ctx()? };

        let step_fn: rquickjs::Function<'_> = self
            .step
            .clone()
            .restore(&js_ctx)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;

        let acc_val: rquickjs::Value<'_> = acc
            .0
            .clone()
            .restore(&js_ctx)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;

        let args_count = fctx.len();
        let mut js_args: Vec<rquickjs::Value<'_>> = Vec::with_capacity(args_count + 1);
        js_args.push(acc_val);
        for i in 0..args_count {
            let val = fctx.get_raw(i);
            let js_val = udf_sqlite_value_to_js(&js_ctx, &val, self.use_big_int_args)?;
            js_args.push(js_val);
        }

        let mut call_args = rquickjs::function::Args::new(js_ctx.clone(), js_args.len());
        call_args
            .push_args(js_args)
            .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;
        let new_acc: rquickjs::Value<'_> = step_fn.call_arg(call_args).map_err(|e| {
            if matches!(e, rquickjs::Error::Exception) {
                let exception = js_ctx.catch();
                save_pending_js_exception(&js_ctx, exception);
            }
            rusqlite::Error::UserFunctionError(format!("{}", e).into())
        })?;

        acc.0 = rquickjs::Persistent::save(&js_ctx, new_acc);
        Ok(())
    }

    fn finalize(
        &self,
        _ctx: &mut rusqlite::functions::Context<'_>,
        acc: Option<JsAccumulator>,
    ) -> rusqlite::Result<rusqlite::types::Value> {
        let js_ctx = unsafe { get_udf_js_ctx()? };

        let acc_val = match acc {
            Some(a) => {
                a.0.restore(&js_ctx)
                    .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?
            }
            None => {
                // No rows: evaluate start to get initial value
                let start_val: rquickjs::Value<'_> = self
                    .start
                    .clone()
                    .restore(&js_ctx)
                    .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;
                if start_val.is_function() {
                    let func = start_val.as_function().ok_or_else(|| {
                        rusqlite::Error::UserFunctionError("start is not a function".into())
                    })?;
                    func.call::<_, rquickjs::Value<'_>>(())
                        .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?
                } else {
                    start_val
                }
            }
        };

        if let Some(ref result_persistent) = self.result_fn {
            let result_func: rquickjs::Function<'_> = result_persistent
                .clone()
                .restore(&js_ctx)
                .map_err(|e| rusqlite::Error::UserFunctionError(format!("{}", e).into()))?;
            let result: rquickjs::Value<'_> = result_func.call((acc_val,)).map_err(|e| {
                if matches!(e, rquickjs::Error::Exception) {
                    let exception = js_ctx.catch();
                    save_pending_js_exception(&js_ctx, exception);
                }
                rusqlite::Error::UserFunctionError(format!("{}", e).into())
            })?;
            udf_js_result_to_sqlite(&js_ctx, &result)
        } else {
            udf_js_result_to_sqlite(&js_ctx, &acc_val)
        }
    }
}

fn register_aggregate_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    name: String,
    start: rquickjs::Value<'js>,
    step: rquickjs::Function<'js>,
    result_fn: rquickjs::Value<'js>,
    options: FunctionOptions,
) -> rquickjs::Result<()> {
    let persistent_start = rquickjs::Persistent::save(&ctx, start);
    let persistent_step = rquickjs::Persistent::save(&ctx, step);
    let persistent_result = if result_fn.is_function() {
        let func = result_fn
            .into_function()
            .ok_or_else(|| rquickjs::Exception::throw_message(&ctx, "result must be a function"))?;
        Some(rquickjs::Persistent::save(&ctx, func))
    } else {
        None
    };

    let flags = build_function_flags(options.deterministic, options.direct_only);
    let n_arg = if options.varargs {
        -1
    } else {
        options.num_args
    };

    let aggr = JsAggregate {
        start: persistent_start,
        step: persistent_step,
        result_fn: persistent_result,
        use_big_int_args: options.use_big_int_args,
    };

    let conn = connection(&ctx, conn_id)?;

    conn.create_aggregate_function(&*name, n_arg, flags, aggr)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    Ok(())
}

fn create_session_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    table_name: rquickjs::Value<'js>,
    db_name: String,
) -> rquickjs::Result<u32> {
    let conn = connection(&ctx, conn_id)?;

    // SAFETY: Session internally stores raw pointers, not references. The
    // PhantomData<&'conn Connection> lifetime is a compile-time-only constraint.
    // We transmute to 'static because we guarantee the connection outlives the
    // session by tracking conn_id and cleaning up sessions when connections close.
    let mut session = unsafe {
        let s = rusqlite::session::Session::new_with_name(&conn, db_name.as_str())
            .map_err(|e| sqlite_error(&ctx, &e))?;
        std::mem::transmute::<rusqlite::session::Session<'_>, rusqlite::session::Session<'static>>(
            s,
        )
    };

    if table_name.is_null() || table_name.is_undefined() {
        session
            .attach::<&str>(None)
            .map_err(|e| sqlite_error(&ctx, &e))?;
    } else if let Some(s) = table_name.as_string() {
        let name = s.to_string()?;
        session
            .attach(Some(name.as_str()))
            .map_err(|e| sqlite_error(&ctx, &e))?;
    }

    let state = SessionState { session, conn_id };
    let mut session_table = SESSION_TABLE
        .lock()
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "session table lock poisoned"))?;
    let id = session_table.insert(state);
    Ok(id)
}

fn session_changeset_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    session_id: u32,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    let mut session_table = SESSION_TABLE
        .lock()
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "session table lock poisoned"))?;
    let state = session_table
        .sessions
        .get_mut(&session_id)
        .ok_or_else(|| rquickjs::Exception::throw_message(&ctx, "session is not valid"))?;

    let mut output = Vec::new();
    state
        .session
        .changeset_strm(&mut output)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    let typed_array = rquickjs::TypedArray::<u8>::new_copy(ctx.clone(), &output)
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "Failed to create TypedArray"))?;
    Ok(typed_array.into_value())
}

fn session_patchset_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    session_id: u32,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    let mut session_table = SESSION_TABLE
        .lock()
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "session table lock poisoned"))?;
    let state = session_table
        .sessions
        .get_mut(&session_id)
        .ok_or_else(|| rquickjs::Exception::throw_message(&ctx, "session is not valid"))?;

    let mut output = Vec::new();
    state
        .session
        .patchset_strm(&mut output)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    let typed_array = rquickjs::TypedArray::<u8>::new_copy(ctx.clone(), &output)
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "Failed to create TypedArray"))?;
    Ok(typed_array.into_value())
}

fn session_close_impl<'js>(ctx: rquickjs::Ctx<'js>, session_id: u32) -> rquickjs::Result<()> {
    let mut session_table = SESSION_TABLE
        .lock()
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "session table lock poisoned"))?;
    if session_table.sessions.remove(&session_id).is_none() {
        return Err(rquickjs::Exception::throw_message(
            &ctx,
            "session is not valid",
        ));
    }
    Ok(())
}

type ChangesetFilter = Box<dyn Fn(&str) -> bool + Send + 'static>;

fn apply_changeset_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    changeset: rquickjs::TypedArray<'js, u8>,
    on_conflict: rquickjs::Value<'js>,
    filter: rquickjs::Value<'js>,
) -> rquickjs::Result<bool> {
    let _guard = JsCtxGuard::new(ctx.as_raw().as_ptr());

    let conn = connection(&ctx, conn_id)?;

    let bytes = crate::wrappers::copy_typed_array_bytes(&changeset)
        .ok_or_else(|| rquickjs::Exception::throw_message(&ctx, "detached TypedArray buffer"))?;

    let has_on_conflict = on_conflict.is_function();
    let persistent_on_conflict = if has_on_conflict {
        Some(SendPersistent(rquickjs::Persistent::save(
            &ctx,
            on_conflict.into_function().unwrap(),
        )))
    } else {
        None
    };

    let has_filter = filter.is_function();
    let persistent_filter = if has_filter {
        Some(SendPersistent(rquickjs::Persistent::save(
            &ctx,
            filter.into_function().unwrap(),
        )))
    } else {
        None
    };

    let filter_fn: Option<ChangesetFilter> = if has_filter {
        let pf = persistent_filter.unwrap();
        Some(Box::new(move |table_name: &str| -> bool {
            let js_ctx = match unsafe { get_udf_js_ctx() } {
                Ok(ctx) => ctx,
                Err(_) => return true,
            };
            let func: rquickjs::Function<'_> = match pf.clone_inner().restore(&js_ctx) {
                Ok(f) => f,
                Err(_) => return true,
            };
            match func.call::<_, rquickjs::Value<'_>>((table_name,)) {
                Ok(val) => val.as_bool().unwrap_or(true),
                Err(_) => true,
            }
        }))
    } else {
        None
    };

    let aborted = Arc::new(Mutex::new(false));
    let callback_error: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));

    let aborted_clone = Arc::clone(&aborted);
    let error_clone = Arc::clone(&callback_error);

    let conflict_fn = move |conflict_type: rusqlite::session::ConflictType,
                            _item: rusqlite::session::ChangesetItem|
          -> rusqlite::session::ConflictAction {
        if let Some(ref pc) = persistent_on_conflict {
            let js_ctx = match unsafe { get_udf_js_ctx() } {
                Ok(ctx) => ctx,
                Err(_) => {
                    *aborted_clone.lock().unwrap() = true;
                    return rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT;
                }
            };
            let func: rquickjs::Function<'_> = match pc.clone_inner().restore(&js_ctx) {
                Ok(f) => f,
                Err(_) => {
                    *aborted_clone.lock().unwrap() = true;
                    return rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT;
                }
            };
            let conflict_type_int = conflict_type as i32;
            match func.call::<_, rquickjs::Value<'_>>((conflict_type_int,)) {
                Ok(val) => {
                    if let Some(action) = val.as_int() {
                        match action {
                            0 => rusqlite::session::ConflictAction::SQLITE_CHANGESET_OMIT,
                            1 => rusqlite::session::ConflictAction::SQLITE_CHANGESET_REPLACE,
                            2 => {
                                *aborted_clone.lock().unwrap() = true;
                                rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT
                            }
                            _ => {
                                *aborted_clone.lock().unwrap() = true;
                                rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT
                            }
                        }
                    } else {
                        *aborted_clone.lock().unwrap() = true;
                        rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT
                    }
                }
                Err(e) => {
                    *error_clone.lock().unwrap() = Some(format!("{}", e));
                    *aborted_clone.lock().unwrap() = true;
                    rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT
                }
            }
        } else {
            *aborted_clone.lock().unwrap() = true;
            rusqlite::session::ConflictAction::SQLITE_CHANGESET_ABORT
        }
    };

    let mut input: &[u8] = &bytes;
    let result = conn.apply_strm(&mut input, filter_fn, conflict_fn);

    // Check if the JS callback threw an error
    if let Some(err_msg) = callback_error.lock().unwrap().as_ref() {
        return Err(rquickjs::Exception::throw_message(&ctx, err_msg));
    }

    match result {
        Ok(()) => Ok(!*aborted.lock().unwrap()),
        Err(e) => {
            if *aborted.lock().unwrap() {
                Ok(false)
            } else {
                Err(sqlite_error(&ctx, &e))
            }
        }
    }
}

fn get_constants_impl<'js>(ctx: rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Object<'js>> {
    let obj = rquickjs::Object::new(ctx.clone())?;

    // Authorizer results
    obj.set("SQLITE_OK", 0)?;
    obj.set("SQLITE_DENY", 1)?;
    obj.set("SQLITE_IGNORE", 2)?;

    // Authorizer actions
    obj.set("SQLITE_CREATE_INDEX", 1)?;
    obj.set("SQLITE_CREATE_TABLE", 2)?;
    obj.set("SQLITE_CREATE_TEMP_INDEX", 3)?;
    obj.set("SQLITE_CREATE_TEMP_TABLE", 4)?;
    obj.set("SQLITE_CREATE_TEMP_TRIGGER", 5)?;
    obj.set("SQLITE_CREATE_TEMP_VIEW", 6)?;
    obj.set("SQLITE_CREATE_TRIGGER", 7)?;
    obj.set("SQLITE_CREATE_VIEW", 8)?;
    obj.set("SQLITE_DELETE", 9)?;
    obj.set("SQLITE_DROP_INDEX", 10)?;
    obj.set("SQLITE_DROP_TABLE", 11)?;
    obj.set("SQLITE_DROP_TEMP_INDEX", 12)?;
    obj.set("SQLITE_DROP_TEMP_TABLE", 13)?;
    obj.set("SQLITE_DROP_TEMP_TRIGGER", 14)?;
    obj.set("SQLITE_DROP_TEMP_VIEW", 15)?;
    obj.set("SQLITE_DROP_TRIGGER", 16)?;
    obj.set("SQLITE_DROP_VIEW", 17)?;
    obj.set("SQLITE_INSERT", 18)?;
    obj.set("SQLITE_PRAGMA", 19)?;
    obj.set("SQLITE_READ", 20)?;
    obj.set("SQLITE_SELECT", 21)?;
    obj.set("SQLITE_TRANSACTION", 22)?;
    obj.set("SQLITE_UPDATE", 23)?;
    obj.set("SQLITE_ATTACH", 24)?;
    obj.set("SQLITE_DETACH", 25)?;
    obj.set("SQLITE_ALTER_TABLE", 26)?;
    obj.set("SQLITE_REINDEX", 27)?;
    obj.set("SQLITE_ANALYZE", 28)?;
    obj.set("SQLITE_CREATE_VTABLE", 29)?;
    obj.set("SQLITE_DROP_VTABLE", 30)?;
    obj.set("SQLITE_FUNCTION", 31)?;
    obj.set("SQLITE_SAVEPOINT", 32)?;
    obj.set("SQLITE_RECURSIVE", 33)?;

    // Changeset conflicts
    obj.set("SQLITE_CHANGESET_DATA", 1)?;
    obj.set("SQLITE_CHANGESET_NOTFOUND", 2)?;
    obj.set("SQLITE_CHANGESET_CONFLICT", 3)?;
    obj.set("SQLITE_CHANGESET_CONSTRAINT", 4)?;
    obj.set("SQLITE_CHANGESET_FOREIGN_KEY", 5)?;

    // Changeset resolution
    obj.set("SQLITE_CHANGESET_OMIT", 0)?;
    obj.set("SQLITE_CHANGESET_REPLACE", 1)?;
    obj.set("SQLITE_CHANGESET_ABORT", 2)?;

    Ok(obj)
}

fn enable_defensive_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    active: bool,
) -> rquickjs::Result<()> {
    let conn = connection(&ctx, conn_id)?;
    conn.set_db_config(
        rusqlite::config::DbConfig::SQLITE_DBCONFIG_DEFENSIVE,
        active,
    )
    .map_err(|e| sqlite_error(&ctx, &e))?;
    Ok(())
}

fn location_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    let table = lock_conn_table(&ctx)?;
    let conn = table
        .connections
        .get(&conn_id)
        .ok_or_else(|| rquickjs::Exception::throw_message(&ctx, "database is not open"))?;
    match conn.path() {
        Some(path) if !path.is_empty() => {
            use rquickjs::IntoJs;
            path.to_string().into_js(&ctx)
        }
        _ => Ok(rquickjs::Value::new_null(ctx.clone())),
    }
}

fn set_authorizer_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    callback: rquickjs::Value<'js>,
) -> rquickjs::Result<()> {
    let conn = connection(&ctx, conn_id)?;
    if conn.in_authorizer.get() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "database is busy",
            "ERR_INVALID_STATE",
        ));
    }

    if callback.is_null() || callback.is_undefined() {
        let _ = conn.authorizer(
            None::<fn(rusqlite::hooks::AuthContext<'_>) -> rusqlite::hooks::Authorization>,
        );
        return Ok(());
    }

    let func = callback.as_function().ok_or_else(|| {
        rquickjs::Exception::throw_message(&ctx, "callback must be a function or null")
    })?;
    let persistent_fn = SendPersistent(rquickjs::Persistent::save(&ctx, func.clone()));
    let weak_connection = Arc::downgrade(&conn);

    let _ = conn.authorizer(Some(
        move |auth_ctx: rusqlite::hooks::AuthContext<'_>| -> rusqlite::hooks::Authorization {
            let Some(connection) = weak_connection.upgrade() else {
                return rusqlite::hooks::Authorization::Deny;
            };
            connection.in_authorizer.set(true);
            let _guard = FlagGuard(&connection.in_authorizer);
            let js_ctx = match unsafe { get_udf_js_ctx() } {
                Ok(ctx) => ctx,
                Err(_) => return rusqlite::hooks::Authorization::Deny,
            };
            let func: rquickjs::Function<'_> = match persistent_fn.clone_inner().restore(&js_ctx) {
                Ok(f) => f,
                Err(_) => return rusqlite::hooks::Authorization::Deny,
            };

            let action_code = auth_action_to_code(&auth_ctx.action);
            let (arg1, arg2) = auth_action_args(&auth_ctx.action);
            let db_name = auth_ctx.database_name.unwrap_or("");
            let accessor = auth_ctx.accessor.unwrap_or("");

            let result: Result<rquickjs::Value<'_>, _> =
                func.call((action_code, arg1, arg2, db_name, accessor));

            match result {
                Ok(val) => match val.as_int() {
                    Some(0) => rusqlite::hooks::Authorization::Allow,
                    Some(1) => rusqlite::hooks::Authorization::Deny,
                    Some(2) => rusqlite::hooks::Authorization::Ignore,
                    _ => rusqlite::hooks::Authorization::Deny,
                },
                Err(_) => rusqlite::hooks::Authorization::Deny,
            }
        },
    ));

    Ok(())
}

fn auth_action_to_code(action: &rusqlite::hooks::AuthAction<'_>) -> i32 {
    use rusqlite::hooks::AuthAction;
    match action {
        AuthAction::CreateIndex { .. } => 1,
        AuthAction::CreateTable { .. } => 2,
        AuthAction::CreateTempIndex { .. } => 3,
        AuthAction::CreateTempTable { .. } => 4,
        AuthAction::CreateTempTrigger { .. } => 5,
        AuthAction::CreateTempView { .. } => 6,
        AuthAction::CreateTrigger { .. } => 7,
        AuthAction::CreateView { .. } => 8,
        AuthAction::Delete { .. } => 9,
        AuthAction::DropIndex { .. } => 10,
        AuthAction::DropTable { .. } => 11,
        AuthAction::DropTempIndex { .. } => 12,
        AuthAction::DropTempTable { .. } => 13,
        AuthAction::DropTempTrigger { .. } => 14,
        AuthAction::DropTempView { .. } => 15,
        AuthAction::DropTrigger { .. } => 16,
        AuthAction::DropView { .. } => 17,
        AuthAction::Insert { .. } => 18,
        AuthAction::Pragma { .. } => 19,
        AuthAction::Read { .. } => 20,
        AuthAction::Select => 21,
        AuthAction::Transaction { .. } => 22,
        AuthAction::Update { .. } => 23,
        AuthAction::Attach { .. } => 24,
        AuthAction::Detach { .. } => 25,
        AuthAction::AlterTable { .. } => 26,
        AuthAction::Reindex { .. } => 27,
        AuthAction::Analyze { .. } => 28,
        AuthAction::CreateVtable { .. } => 29,
        AuthAction::DropVtable { .. } => 30,
        AuthAction::Function { .. } => 31,
        AuthAction::Savepoint { .. } => 32,
        AuthAction::Recursive => 33,
        _ => 0,
    }
}

fn auth_action_args<'a>(action: &'a rusqlite::hooks::AuthAction<'a>) -> (&'a str, &'a str) {
    use rusqlite::hooks::AuthAction;
    match action {
        AuthAction::CreateIndex {
            index_name,
            table_name,
        } => (index_name, table_name),
        AuthAction::CreateTable { table_name } => (table_name, ""),
        AuthAction::CreateTempIndex {
            index_name,
            table_name,
        } => (index_name, table_name),
        AuthAction::CreateTempTable { table_name } => (table_name, ""),
        AuthAction::CreateTempTrigger {
            trigger_name,
            table_name,
        } => (trigger_name, table_name),
        AuthAction::CreateTempView { view_name } => (view_name, ""),
        AuthAction::CreateTrigger {
            trigger_name,
            table_name,
        } => (trigger_name, table_name),
        AuthAction::CreateView { view_name } => (view_name, ""),
        AuthAction::Delete { table_name } => (table_name, ""),
        AuthAction::DropIndex {
            index_name,
            table_name,
        } => (index_name, table_name),
        AuthAction::DropTable { table_name } => (table_name, ""),
        AuthAction::DropTempIndex {
            index_name,
            table_name,
        } => (index_name, table_name),
        AuthAction::DropTempTable { table_name } => (table_name, ""),
        AuthAction::DropTempTrigger {
            trigger_name,
            table_name,
        } => (trigger_name, table_name),
        AuthAction::DropTempView { view_name } => (view_name, ""),
        AuthAction::DropTrigger {
            trigger_name,
            table_name,
        } => (trigger_name, table_name),
        AuthAction::DropView { view_name } => (view_name, ""),
        AuthAction::Insert { table_name } => (table_name, ""),
        AuthAction::Pragma {
            pragma_name,
            pragma_value,
        } => (pragma_name, pragma_value.unwrap_or("")),
        AuthAction::Read {
            table_name,
            column_name,
        } => (table_name, column_name),
        AuthAction::Select => ("", ""),
        AuthAction::Transaction { .. } => ("", ""),
        AuthAction::Update {
            table_name,
            column_name,
        } => (table_name, column_name),
        AuthAction::Attach { filename } => (filename, ""),
        AuthAction::Detach { database_name } => (database_name, ""),
        AuthAction::AlterTable {
            database_name,
            table_name,
        } => (database_name, table_name),
        AuthAction::Reindex { index_name } => (index_name, ""),
        AuthAction::Analyze { table_name } => (table_name, ""),
        AuthAction::CreateVtable {
            table_name,
            module_name,
        } => (table_name, module_name),
        AuthAction::DropVtable {
            table_name,
            module_name,
        } => (table_name, module_name),
        AuthAction::Function { function_name } => (function_name, ""),
        AuthAction::Savepoint { savepoint_name, .. } => (savepoint_name, ""),
        AuthAction::Recursive => ("", ""),
        _ => ("", ""),
    }
}

fn serialize_database_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
) -> rquickjs::Result<rquickjs::Value<'js>> {
    let conn = connection(&ctx, conn_id)?;

    let data = conn
        .serialize(rusqlite::MAIN_DB)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    let bytes: &[u8] = &data;
    let typed_array = rquickjs::TypedArray::<u8>::new(ctx.clone(), bytes)
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "failed to create Uint8Array"))?;
    Ok(typed_array.into_value())
}

fn restore_database_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    bytes: rquickjs::TypedArray<'js, u8>,
) -> rquickjs::Result<()> {
    crate::internal::preinit::check("SQLite database restore", "in-memory database");
    let conn = connection(&ctx, conn_id)?;
    check_idle_connection(
        &ctx,
        &conn,
        "cannot restore database during active execution",
    )?;
    if conn
        .statements
        .borrow()
        .iter()
        .filter_map(StatementWeak::upgrade)
        .any(|s| s.cursor.get())
    {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "cannot restore database with an active cursor",
            "ERR_INVALID_STATE",
        ));
    }

    if conn
        .is_readonly(rusqlite::MAIN_DB)
        .map_err(|e| sqlite_error(&ctx, &e))?
    {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "cannot restore a read-only database",
            "ERR_SQLITE_ERROR",
        ));
    }

    if !conn.is_autocommit() {
        return Err(throw_coded_error(
            &ctx,
            "Error",
            "cannot restore database with an open transaction",
            "ERR_SQLITE_ERROR",
        ));
    }

    // SAFETY: Deserialization and the backup below run synchronously without
    // JavaScript callbacks; bytes roots the input until the copy is complete.
    let data = unsafe { bytes.as_bytes() }.ok_or_else(|| {
        rquickjs::Exception::throw_message(&ctx, "failed to read Uint8Array bytes")
    })?;

    // Use deserialize_read_exact into a temp in-memory connection, then backup into dest
    let mut temp_conn =
        rusqlite::Connection::open_in_memory().map_err(|e| sqlite_error(&ctx, &e))?;
    temp_conn
        .deserialize_read_exact(rusqlite::MAIN_DB, data, data.len(), false)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    // SAFETY: both connections are rooted, no execution/cursor is active, and
    // backup invokes no JS. Unlike deserialize this preserves idle handles and
    // connection-local UDFs. SQLite expires prepared statements after backup.
    unsafe {
        let backup = rusqlite::ffi::sqlite3_backup_init(
            conn.handle(),
            c"main".as_ptr(),
            temp_conn.handle(),
            c"main".as_ptr(),
        );
        if backup.is_null() {
            return check_sqlite(&ctx, &conn, rusqlite::ffi::sqlite3_errcode(conn.handle()));
        }
        let rc = rusqlite::ffi::sqlite3_backup_step(backup, -1);
        let finished = rusqlite::ffi::sqlite3_backup_finish(backup);
        check_sqlite(
            &ctx,
            &conn,
            if rc == rusqlite::ffi::SQLITE_DONE {
                finished
            } else {
                rc
            },
        )
    }
}

fn deserialize_database_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    bytes: rquickjs::TypedArray<'js, u8>,
    name: String,
) -> rquickjs::Result<()> {
    crate::internal::preinit::check("SQLite database deserialize", "in-memory database");
    let conn = connection(&ctx, conn_id)?;
    check_idle_connection(
        &ctx,
        &conn,
        "database cannot be deserialized while in a callback",
    )?;
    let name = std::ffi::CString::new(name).map_err(|_| {
        throw_coded_error(&ctx, "Error", "invalid database name", "ERR_SQLITE_ERROR")
    })?;
    let data = unsafe { bytes.as_bytes() }.ok_or_else(|| {
        throw_coded_error(
            &ctx,
            "Error",
            "The \"buffer\" argument was resized while reading \"options\"",
            "ERR_INVALID_STATE",
        )
    })?;
    // SQLite takes ownership only of its own allocator's copy. Finalize before
    // the deserialize attempt, not before validation/allocation, as Node does.
    unsafe {
        let buffer = rusqlite::ffi::sqlite3_malloc64(data.len() as u64).cast::<u8>();
        if buffer.is_null() {
            return Err(rquickjs::Exception::throw_message(
                &ctx,
                "memory allocation failed",
            ));
        }
        std::ptr::copy_nonoverlapping(data.as_ptr(), buffer, data.len());
        let _guard = JsCtxGuard::new(ctx.as_raw().as_ptr());
        conn.mutating.set(true);
        let _mutation = FlagGuard(&conn.mutating);
        finalize_statements(&conn);
        let rc = rusqlite::ffi::sqlite3_deserialize(
            conn.handle(),
            name.as_ptr(),
            buffer,
            data.len() as i64,
            data.len() as i64,
            (rusqlite::ffi::SQLITE_DESERIALIZE_FREEONCLOSE
                | rusqlite::ffi::SQLITE_DESERIALIZE_RESIZEABLE) as u32,
        );
        check_sqlite(&ctx, &conn, rc)
    }
}

fn native_backup_impl<'js>(
    ctx: rquickjs::Ctx<'js>,
    conn_id: u32,
    path: String,
    source_db: String,
    target_db: String,
    rate: i32,
) -> rquickjs::Result<i32> {
    crate::internal::preinit::check("SQLite database backup", &path);
    let table = lock_conn_table(&ctx)?;
    let src_conn = table
        .connections
        .get(&conn_id)
        .ok_or_else(|| rquickjs::Exception::throw_message(&ctx, "database is not open"))?;

    let mut dst_conn = rusqlite::Connection::open(&path).map_err(|e| sqlite_error(&ctx, &e))?;

    let src_name = std::ffi::CString::new(source_db)
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "invalid source database name"))?;
    let dst_name = std::ffi::CString::new(target_db)
        .map_err(|_| rquickjs::Exception::throw_message(&ctx, "invalid target database name"))?;

    let backup =
        rusqlite::backup::Backup::new_with_names(src_conn, &*src_name, &mut dst_conn, &*dst_name)
            .map_err(|e| sqlite_error(&ctx, &e))?;

    backup
        .run_to_completion(rate, Duration::ZERO, None)
        .map_err(|e| sqlite_error(&ctx, &e))?;

    let page_count = backup.progress().pagecount;

    Ok(page_count)
}

#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use super::{NativeIterator, NativeStatement};
    use rquickjs::{Array, Class, Ctx, Object, Value};

    #[rquickjs::function]
    pub fn prepare_statement<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        sql: String,
    ) -> rquickjs::Result<NativeStatement> {
        super::prepare_statement_impl(ctx, conn_id, sql)
    }

    #[rquickjs::function]
    pub fn deserialize_database<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        bytes: rquickjs::TypedArray<'js, u8>,
        name: String,
    ) -> rquickjs::Result<()> {
        super::deserialize_database_impl(ctx, conn_id, bytes, name)
    }

    #[rquickjs::function]
    pub fn check_database_idle<'js>(ctx: Ctx<'js>, conn_id: u32) -> rquickjs::Result<()> {
        super::check_idle_connection(
            &ctx,
            &super::connection(&ctx, conn_id)?,
            "database cannot be deserialized while in a callback",
        )
    }

    #[rquickjs::function]
    pub fn open_database<'js>(
        ctx: Ctx<'js>,
        path: String,
        read_only: bool,
        enable_foreign_keys: bool,
        enable_dqs: bool,
        timeout: u32,
    ) -> rquickjs::Result<u32> {
        super::open_database_impl(
            ctx,
            path,
            read_only,
            enable_foreign_keys,
            enable_dqs,
            timeout,
        )
    }

    #[rquickjs::function]
    pub fn close_database<'js>(ctx: Ctx<'js>, conn_id: u32) -> rquickjs::Result<()> {
        super::close_database_impl(ctx, conn_id)
    }

    #[rquickjs::function]
    pub fn exec_sql<'js>(ctx: Ctx<'js>, conn_id: u32, sql: String) -> rquickjs::Result<()> {
        super::exec_sql_impl(ctx, conn_id, sql)
    }

    #[rquickjs::function]
    pub fn is_open(conn_id: u32) -> bool {
        super::is_open_impl(conn_id)
    }

    #[rquickjs::function]
    pub fn is_autocommit(conn_id: u32) -> bool {
        super::is_autocommit_impl(conn_id)
    }

    #[rquickjs::function]
    pub fn stmt_run<'js>(
        ctx: Ctx<'js>,
        stmt: Class<'js, NativeStatement>,
        params: Value<'js>,
        allow_bare_named: bool,
        allow_unknown_named: bool,
        read_big_ints: bool,
    ) -> rquickjs::Result<Object<'js>> {
        super::stmt_run_impl(
            ctx,
            &stmt.borrow(),
            params,
            allow_bare_named,
            allow_unknown_named,
            read_big_ints,
        )
    }

    // These positional arguments are the public rquickjs bridge ABI consumed by sqlite.js.
    #[allow(clippy::too_many_arguments)]
    #[rquickjs::function]
    pub fn stmt_get<'js>(
        ctx: Ctx<'js>,
        stmt: Class<'js, NativeStatement>,
        params: Value<'js>,
        allow_bare_named: bool,
        allow_unknown_named: bool,
        read_big_ints: bool,
        return_arrays: bool,
    ) -> rquickjs::Result<Value<'js>> {
        super::stmt_get_impl(
            ctx,
            &stmt.borrow(),
            params,
            super::StatementResultOptions {
                allow_bare_named,
                allow_unknown_named,
                read_big_ints,
                return_arrays,
            },
        )
    }

    // These positional arguments are the public rquickjs bridge ABI consumed by sqlite.js.
    #[allow(clippy::too_many_arguments)]
    #[rquickjs::function]
    pub fn stmt_all<'js>(
        ctx: Ctx<'js>,
        stmt: Class<'js, NativeStatement>,
        params: Value<'js>,
        allow_bare_named: bool,
        allow_unknown_named: bool,
        read_big_ints: bool,
        return_arrays: bool,
    ) -> rquickjs::Result<Array<'js>> {
        super::stmt_all_impl(
            ctx,
            &stmt.borrow(),
            params,
            super::StatementResultOptions {
                allow_bare_named,
                allow_unknown_named,
                read_big_ints,
                return_arrays,
            },
        )
    }

    #[rquickjs::function]
    pub fn stmt_expanded_sql<'js>(
        ctx: Ctx<'js>,
        stmt: Class<'js, NativeStatement>,
    ) -> rquickjs::Result<String> {
        super::stmt_expanded_sql_impl(ctx, &stmt.borrow())
    }

    #[rquickjs::function]
    pub fn stmt_columns<'js>(
        ctx: Ctx<'js>,
        stmt: Class<'js, NativeStatement>,
    ) -> rquickjs::Result<Array<'js>> {
        super::stmt_columns_impl(ctx, &stmt.borrow())
    }

    #[rquickjs::function]
    pub fn stmt_iterate_init<'js>(
        ctx: Ctx<'js>,
        stmt: Class<'js, NativeStatement>,
        params: Value<'js>,
        allow_bare_named: bool,
        allow_unknown_named: bool,
    ) -> rquickjs::Result<NativeIterator> {
        super::stmt_iterate_init_impl(
            ctx,
            &stmt.borrow(),
            params,
            allow_bare_named,
            allow_unknown_named,
        )
    }

    #[rquickjs::function]
    pub fn stmt_iterate_next<'js>(
        ctx: Ctx<'js>,
        iter: Class<'js, NativeIterator>,
        read_big_ints: bool,
        return_arrays: bool,
    ) -> rquickjs::Result<Object<'js>> {
        super::stmt_iterate_next_impl(ctx, &iter.borrow(), read_big_ints, return_arrays)
    }

    #[rquickjs::function]
    pub fn stmt_iterate_return<'js>(
        ctx: Ctx<'js>,
        iter: Class<'js, NativeIterator>,
    ) -> rquickjs::Result<()> {
        super::stmt_iterate_return_impl(ctx, &iter.borrow())
    }

    // These positional arguments are the public rquickjs bridge ABI consumed by sqlite.js.
    #[allow(clippy::too_many_arguments)]
    #[rquickjs::function]
    pub fn register_function<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        name: String,
        callback: rquickjs::Function<'js>,
        deterministic: bool,
        direct_only: bool,
        use_big_int_args: bool,
        varargs: bool,
        num_args: i32,
    ) -> rquickjs::Result<()> {
        super::register_function_impl(
            ctx,
            conn_id,
            name,
            callback,
            super::FunctionOptions {
                deterministic,
                direct_only,
                use_big_int_args,
                varargs,
                num_args,
            },
        )
    }

    // These positional arguments are the public rquickjs bridge ABI consumed by sqlite.js.
    #[allow(clippy::too_many_arguments)]
    #[rquickjs::function]
    pub fn register_aggregate<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        name: String,
        start: Value<'js>,
        step: rquickjs::Function<'js>,
        result_fn: Value<'js>,
        deterministic: bool,
        direct_only: bool,
        use_big_int_args: bool,
        varargs: bool,
        num_args: i32,
    ) -> rquickjs::Result<()> {
        super::register_aggregate_impl(
            ctx,
            conn_id,
            name,
            start,
            step,
            result_fn,
            super::FunctionOptions {
                deterministic,
                direct_only,
                use_big_int_args,
                varargs,
                num_args,
            },
        )
    }

    #[rquickjs::function]
    pub fn create_session<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        table_name: Value<'js>,
        db_name: String,
    ) -> rquickjs::Result<u32> {
        super::create_session_impl(ctx, conn_id, table_name, db_name)
    }

    #[rquickjs::function]
    pub fn session_changeset<'js>(ctx: Ctx<'js>, session_id: u32) -> rquickjs::Result<Value<'js>> {
        super::session_changeset_impl(ctx, session_id)
    }

    #[rquickjs::function]
    pub fn session_patchset<'js>(ctx: Ctx<'js>, session_id: u32) -> rquickjs::Result<Value<'js>> {
        super::session_patchset_impl(ctx, session_id)
    }

    #[rquickjs::function]
    pub fn session_close<'js>(ctx: Ctx<'js>, session_id: u32) -> rquickjs::Result<()> {
        super::session_close_impl(ctx, session_id)
    }

    #[rquickjs::function]
    pub fn apply_changeset<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        changeset: rquickjs::TypedArray<'js, u8>,
        on_conflict: Value<'js>,
        filter: Value<'js>,
    ) -> rquickjs::Result<bool> {
        super::apply_changeset_impl(ctx, conn_id, changeset, on_conflict, filter)
    }

    #[rquickjs::function]
    pub fn get_constants<'js>(ctx: Ctx<'js>) -> rquickjs::Result<Object<'js>> {
        super::get_constants_impl(ctx)
    }

    #[rquickjs::function]
    pub fn enable_defensive<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        active: bool,
    ) -> rquickjs::Result<()> {
        super::enable_defensive_impl(ctx, conn_id, active)
    }

    #[rquickjs::function]
    pub fn location<'js>(ctx: Ctx<'js>, conn_id: u32) -> rquickjs::Result<Value<'js>> {
        super::location_impl(ctx, conn_id)
    }

    #[rquickjs::function]
    pub fn set_authorizer<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        callback: Value<'js>,
    ) -> rquickjs::Result<()> {
        super::set_authorizer_impl(ctx, conn_id, callback)
    }

    #[rquickjs::function]
    pub fn native_backup<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        path: String,
        source_db: String,
        target_db: String,
        rate: i32,
    ) -> rquickjs::Result<i32> {
        super::native_backup_impl(ctx, conn_id, path, source_db, target_db, rate)
    }

    #[rquickjs::function]
    pub fn serialize_database<'js>(ctx: Ctx<'js>, conn_id: u32) -> rquickjs::Result<Value<'js>> {
        super::serialize_database_impl(ctx, conn_id)
    }

    #[rquickjs::function]
    pub fn restore_database<'js>(
        ctx: Ctx<'js>,
        conn_id: u32,
        bytes: rquickjs::TypedArray<'js, u8>,
    ) -> rquickjs::Result<()> {
        super::restore_database_impl(ctx, conn_id, bytes)
    }
}

pub const SQLITE_JS: &str = include_str!("sqlite.js");

#[allow(dead_code)]
pub const WIRE_JS: &str = "";
