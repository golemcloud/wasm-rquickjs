//! The runtime-wide custom invocation context of `golem:durability/durability@1.6.0`.
//!
//! The host attributes durable effects to the custom invocation context that is installed on the
//! current task when the effect starts. JavaScript interleaves many logical flows on one task, so
//! this module keeps one cell that names the scope of the flow that runs now and switches the host
//! context with `exchange-custom-invocation-context` only when the effective scope changes.
//!
//! * Every open scope except the current one holds the host snapshot that reinstalls it. The
//!   current scope holds none, because the host has it installed.
//! * Promise reactions (including native `await`) run in the scope that registered them, through
//!   the QuickJS promise hook. It is installed when the first scope opens, so a runtime that never
//!   opens a scope pays nothing for it.
//! * Async import bridges capture the scope when JavaScript calls them, and install it around every
//!   poll and the drop of the import future ([`scoped`]).
//! * Timers, `setImmediate`, `process.nextTick` and `queueMicrotask` capture the scope when they are
//!   registered, through the internal JavaScript module.
//! * Each exported call starts a new root scope. A scope that is closed, or that belongs to an
//!   earlier root, resolves to its nearest open ancestor or to the running root, so a stale
//!   snapshot is never installed.

use rquickjs::class::Trace;
use rquickjs::function::This;
use rquickjs::{Class, Ctx, Function, JsLifetime, Object, qjs};
use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll};

/// The host functions of `golem:durability/durability@1.6.0`, as raw resource handles of
/// `custom-invocation-context`. The generated import modules provide it when the world imports
/// `exchange-custom-invocation-context`.
pub struct Host {
    /// `exchange-custom-invocation-context`: installs `next` (or keeps the current context when it
    /// is `None`) and returns the previous context.
    pub exchange: fn(Option<u32>) -> u32,
    /// Drops a `custom-invocation-context` handle.
    pub drop_snapshot: fn(u32),
}

fn host() -> Option<&'static Host> {
    crate::modules::CUSTOM_INVOCATION_CONTEXT_HOST.as_ref()
}

/// An owned `custom-invocation-context` handle.
struct Snapshot(u32);

impl Snapshot {
    fn into_handle(self) -> u32 {
        let handle = self.0;
        std::mem::forget(self);
        handle
    }
}

impl Drop for Snapshot {
    fn drop(&mut self) {
        if let Some(host) = host() {
            (host.drop_snapshot)(self.0);
        }
    }
}

/// The identity of a scope. It keeps its ancestors so that a closed scope can still resolve to
/// its nearest open ancestor.
pub(crate) struct ScopeInfo {
    id: u64,
    root: u64,
    parent: Option<Rc<ScopeInfo>>,
    reported: Cell<bool>,
}

impl ScopeInfo {
    fn is_root(&self) -> bool {
        self.parent.is_none()
    }
}

struct OpenScope {
    snapshot: Option<Snapshot>,
    open_children: usize,
}

struct State {
    root: Rc<ScopeInfo>,
    current: Rc<ScopeInfo>,
    scopes: HashMap<u64, OpenScope>,
    next_id: u64,
    hook_stack: Vec<Rc<ScopeInfo>>,
}

impl State {
    fn new() -> Self {
        let root = Rc::new(ScopeInfo {
            id: 0,
            root: 0,
            parent: None,
            reported: Cell::new(false),
        });
        let mut scopes = HashMap::new();
        scopes.insert(
            0,
            OpenScope {
                snapshot: None,
                open_children: 0,
            },
        );
        Self {
            current: root.clone(),
            root,
            scopes,
            next_id: 1,
            hook_stack: Vec::new(),
        }
    }

    fn allocate_id(&mut self) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    /// The open scope that `scope` stands for: itself when it is open, else its nearest open
    /// ancestor, else the running root.
    fn resolve(&self, scope: &Rc<ScopeInfo>) -> Rc<ScopeInfo> {
        if scope.root == self.root.id {
            let mut candidate = scope;
            loop {
                if self.scopes.contains_key(&candidate.id) {
                    if !Rc::ptr_eq(candidate, scope) {
                        report_stale(scope, "it is closed");
                    }
                    return candidate.clone();
                }
                match &candidate.parent {
                    Some(parent) => candidate = parent,
                    None => break,
                }
            }
        }
        if !scope.is_root() {
            report_stale(scope, "its invocation has ended");
        }
        self.root.clone()
    }
}

fn report_stale(scope: &ScopeInfo, reason: &str) {
    if !scope.reported.replace(true) {
        // Unbuffered stderr writes every piece of a format string separately, and a host that
        // journals output records each write. Write the report as one line.
        let report = format!(
            "wasm-rquickjs: work captured in custom invocation context {} runs in an enclosing context because {reason}\n",
            scope.id
        );
        let _ = std::io::Write::write_all(&mut std::io::stderr(), report.as_bytes());
    }
}

/// The scope each promise created inside a non-root scope was created in, keyed by the address
/// of the promise object, which is unique among live objects of every runtime of the component.
/// The entry of a dead promise is overwritten or removed by the INIT of the next promise at its
/// address, so a lookup never sees a stale entry. Every entry belongs to the root `root`; a new
/// root clears them, because their scopes would resolve to that new root anyway.
#[derive(Default)]
struct PromiseScopes {
    root: u64,
    scopes: HashMap<usize, Rc<ScopeInfo>>,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::new());
    static HOOK_INSTALLED: Cell<bool> = const { Cell::new(false) };
    static PROMISE_SCOPES: RefCell<PromiseScopes> = RefCell::new(PromiseScopes::default());
}

fn current_scope() -> Rc<ScopeInfo> {
    STATE.with_borrow(|state| state.current.clone())
}

/// Makes `target` (resolved to an open scope) current, exchanging host snapshots when it differs
/// from the current scope.
fn switch_to(target: &Rc<ScopeInfo>) {
    let released = STATE.with_borrow_mut(|state| {
        let target = state.resolve(target);
        if target.id == state.current.id {
            return None;
        }
        let host = host().expect("a custom invocation scope is open without a host exchange");
        let next = state
            .scopes
            .get_mut(&target.id)
            .and_then(|scope| scope.snapshot.take())
            .expect("an open custom invocation scope that is not current holds a snapshot");
        let previous = Snapshot((host.exchange)(Some(next.into_handle())));
        let released = match state.scopes.get_mut(&state.current.id) {
            Some(current) => {
                current.snapshot = Some(previous);
                None
            }
            None => Some(previous),
        };
        state.current = target;
        released
    });
    drop(released);
}

/// Starts the root scope of a new exported call. Scopes left open by an earlier call can no longer
/// be installed; their tokens resolve to this root.
pub(crate) fn begin_root() {
    let released = STATE.with_borrow_mut(|state| {
        let id = state.allocate_id();
        let root = Rc::new(ScopeInfo {
            id,
            root: id,
            parent: None,
            reported: Cell::new(false),
        });
        let mut scopes = HashMap::new();
        scopes.insert(
            id,
            OpenScope {
                snapshot: None,
                open_children: 0,
            },
        );
        state.root = root.clone();
        state.current = root;
        state.hook_stack.clear();
        std::mem::replace(&mut state.scopes, scopes)
    });
    drop(released);
}

/// Runs one exported call of a synchronous target in a new root scope, and reinstalls that root
/// before control returns to the host.
#[cfg(feature = "p2")]
pub(crate) async fn in_root<T>(call: impl Future<Output = T>) -> T {
    begin_root();
    let result = call.await;
    restore_root();
    result
}

/// Reinstalls the running root before control returns to the host.
pub(crate) fn restore_root() {
    let root = STATE.with_borrow(|state| state.root.clone());
    switch_to(&root);
}

/// The scope captured for futures that are created later, such as each sleep of a timer.
/// `None` stands for a capture before the first scope opened, so at the root.
pub(crate) type FutureScope = Option<Rc<ScopeInfo>>;

/// Captures the current scope for a future that is created now and polled later. Returns `None`
/// when no scope was ever opened.
fn capture_for_future() -> FutureScope {
    if HOOK_INSTALLED.get() {
        Some(current_scope())
    } else {
        None
    }
}

struct EnterGuard(Option<Rc<ScopeInfo>>);

impl EnterGuard {
    /// `None` stands for a future created before the first scope opened, so at the root.
    fn enter(scope: &Option<Rc<ScopeInfo>>) -> Self {
        let target = match scope {
            Some(scope) => scope.clone(),
            None if HOOK_INSTALLED.get() => STATE.with_borrow(|state| state.root.clone()),
            None => return Self(None),
        };
        let previous = current_scope();
        switch_to(&target);
        Self(Some(previous))
    }
}

impl Drop for EnterGuard {
    fn drop(&mut self) {
        if let Some(previous) = self.0.take() {
            switch_to(&previous);
        }
    }
}

/// A future that runs every poll, and its own drop, in the scope that was current when it was
/// created.
pub struct Scoped<F> {
    scope: Option<Rc<ScopeInfo>>,
    inner: Option<F>,
}

/// Wraps an import future so that the host call it starts, and its cancellation, are attributed
/// to the scope that is current now, when JavaScript calls the import.
pub fn scoped<F: Future>(inner: F) -> Scoped<F> {
    scoped_in(capture_for_future(), inner)
}

/// Wraps a future so that every poll, and its drop, runs in `scope`, captured earlier with
/// [`future_scope_of`]. A closed scope resolves to its nearest open ancestor.
pub(crate) fn scoped_in<F: Future>(scope: FutureScope, inner: F) -> Scoped<F> {
    Scoped {
        scope,
        inner: Some(inner),
    }
}

impl<F: Future> Future for Scoped<F> {
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<F::Output> {
        // SAFETY: `inner` is structurally pinned; it is never moved out, only dropped in place.
        let this = unsafe { self.get_unchecked_mut() };
        let _guard = EnterGuard::enter(&this.scope);
        let inner = unsafe { Pin::new_unchecked(this.inner.as_mut().expect("polled after drop")) };
        let result = inner.poll(cx);
        if result.is_ready() {
            // Drop the completed future in its scope.
            this.inner = None;
        }
        result
    }
}

/// The JavaScript promise an async import bridge returns.
pub type ScopedImport<'js, T> = rquickjs::promise::Promised<Pin<Box<dyn Future<Output = T> + 'js>>>;

/// Builds the result of an async import bridge. The bridge calls it in the synchronous part of the
/// JavaScript call, so the import runs in the scope of its caller.
pub fn scoped_import<'js, T>(future: impl Future<Output = T> + 'js) -> ScopedImport<'js, T> {
    rquickjs::promise::Promised(Box::pin(scoped(future)))
}

impl<F> Drop for Scoped<F> {
    fn drop(&mut self) {
        if self.inner.is_some() {
            let _guard = EnterGuard::enter(&self.scope);
            self.inner = None;
        }
    }
}

/// A JavaScript handle for one scope. A scope has one token object per QuickJS runtime while it
/// is open, so tokens can be compared by identity.
#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename = "CustomInvocationContextToken")]
pub struct Token {
    #[qjs(skip_trace)]
    scope: Rc<ScopeInfo>,
}

/// Per-runtime state: the token objects of open scopes and the scopes the promise hook recorded.
#[derive(JsLifetime)]
pub(crate) struct RuntimeTokens<'js> {
    tokens: RefCell<HashMap<u64, Class<'js, Token>>>,
    cached_root: Cell<u64>,
    hook_installed: Cell<bool>,
}

pub(crate) fn initialize(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
    ctx.store_userdata(RuntimeTokens {
        tokens: RefCell::new(HashMap::new()),
        cached_root: Cell::new(0),
        hook_installed: Cell::new(false),
    })
    .expect("Failed to initialize custom invocation context state");
    // A runtime created after the first scope opened (an execution job) needs the hook from its
    // start, because its promises can be created inside a scope.
    if HOOK_INSTALLED.get() {
        install_promise_hook(ctx);
    }
    Ok(())
}

fn token_for<'js>(ctx: &Ctx<'js>, scope: &Rc<ScopeInfo>) -> rquickjs::Result<Class<'js, Token>> {
    let runtime = ctx
        .userdata::<RuntimeTokens>()
        .expect("custom invocation context state not initialized");
    let open = STATE
        .with_borrow(|state| state.scopes.contains_key(&scope.id) && scope.root == state.root.id);
    if open && let Some(token) = runtime.tokens.borrow().get(&scope.id) {
        return Ok(token.clone());
    }
    let token = Class::instance(
        ctx.clone(),
        Token {
            scope: scope.clone(),
        },
    )?;
    if open {
        let mut tokens = runtime.tokens.borrow_mut();
        if runtime.cached_root.replace(scope.root) != scope.root {
            // Only the running root's scopes can be reached through the cache.
            tokens.clear();
        }
        tokens.insert(scope.id, token.clone());
    }
    Ok(token)
}

fn scope_of(token: &Class<'_, Token>) -> Rc<ScopeInfo> {
    token.borrow().scope.clone()
}

/// Returns the token of the current scope.
pub(crate) fn capture<'js>(ctx: &Ctx<'js>) -> rquickjs::Result<Class<'js, Token>> {
    token_for(ctx, &current_scope())
}

/// Returns the current token for a callback registration, or `None` while no scope was ever
/// opened, so registrations stay free in that case.
pub(crate) fn capture_for_callback<'js>(
    ctx: &Ctx<'js>,
) -> rquickjs::Result<Option<Class<'js, Token>>> {
    if HOOK_INSTALLED.get() {
        capture(ctx).map(Some)
    } else {
        Ok(None)
    }
}

/// The scope for futures of a callback registration, from the result of [`capture_for_callback`].
pub(crate) fn future_scope_of(token: Option<Class<'_, Token>>) -> FutureScope {
    token.map(|token| scope_of(&token))
}

/// Enters the scope of a callback that the runtime schedules itself, before the callback runs.
/// `token` is the result of [`capture_for_callback`] at registration; `None` means the callback
/// was registered before the first scope opened, so at the root. Returns the token to pass to
/// [`leave_callback`], or `None` while no scope was ever opened.
pub(crate) fn enter_callback<'js>(
    ctx: &Ctx<'js>,
    token: Option<Class<'js, Token>>,
) -> rquickjs::Result<Option<Class<'js, Token>>> {
    if !HOOK_INSTALLED.get() {
        return Ok(None);
    }
    let previous = current_scope();
    let target = match token {
        Some(token) => scope_of(&token),
        None => STATE.with_borrow(|state| state.root.clone()),
    };
    if !Rc::ptr_eq(&previous, &target) {
        switch_to(&target);
    }
    token_for(ctx, &previous).map(Some)
}

/// Restores the scope after a callback entered with [`enter_callback`]. `None` means no scope was
/// open when the callback started, so the root is restored if the callback opened one.
pub(crate) fn leave_callback(previous: Option<Class<'_, Token>>) {
    let previous = match previous {
        Some(previous) => scope_of(&previous),
        None if HOOK_INSTALLED.get() => STATE.with_borrow(|state| state.root.clone()),
        None => return,
    };
    switch_to(&previous);
}

/// Makes `next` current and returns the token that was current.
pub(crate) fn swap<'js>(
    ctx: &Ctx<'js>,
    next: Class<'js, Token>,
) -> rquickjs::Result<Class<'js, Token>> {
    let previous = current_scope();
    let next = scope_of(&next);
    if Rc::ptr_eq(&previous, &next) {
        return token_for(ctx, &previous);
    }
    switch_to(&next);
    token_for(ctx, &previous)
}

/// Opens the scope of a live custom durable invocation as a child of the current scope. Calls
/// `live.enter()`, which installs the new invocation on the host, and returns its token.
pub(crate) fn enter_live<'js>(
    ctx: &Ctx<'js>,
    live: Object<'js>,
) -> rquickjs::Result<Class<'js, Token>> {
    let Some(host) = host() else {
        return Err(rquickjs::Exception::throw_type(
            ctx,
            "custom invocation contexts need a component that imports golem:durability/durability@1.6.0",
        ));
    };
    let enter: Function = live.get("enter")?;
    let parent = STATE.with_borrow_mut(|state| {
        let parent = state.current.clone();
        let snapshot = Snapshot((host.exchange)(None));
        state
            .scopes
            .get_mut(&parent.id)
            .expect("the current scope is open")
            .snapshot = Some(snapshot);
        parent
    });
    if let Err(error) = enter.call::<_, ()>((This(live),)) {
        let released = STATE.with_borrow_mut(|state| {
            state
                .scopes
                .get_mut(&parent.id)
                .and_then(|scope| scope.snapshot.take())
        });
        drop(released);
        return Err(error);
    }
    install_promise_hook(ctx);
    let child = STATE.with_borrow_mut(|state| {
        let id = state.allocate_id();
        let child = Rc::new(ScopeInfo {
            id,
            root: state.root.id,
            parent: Some(parent.clone()),
            reported: Cell::new(false),
        });
        if let Some(parent) = state.scopes.get_mut(&parent.id) {
            parent.open_children += 1;
        }
        state.scopes.insert(
            id,
            OpenScope {
                snapshot: None,
                open_children: 0,
            },
        );
        state.current = child.clone();
        child
    });
    token_for(ctx, &child)
}

/// Closes a scope after its live invocation finished or was dropped. When the scope is current,
/// its nearest open ancestor becomes current. Closing a closed scope does nothing.
pub(crate) fn close<'js>(ctx: &Ctx<'js>, token: Class<'js, Token>) -> rquickjs::Result<()> {
    let scope = scope_of(&token);
    if scope.is_root() {
        return Err(rquickjs::Exception::throw_type(
            ctx,
            "the root custom invocation context cannot be closed",
        ));
    }
    let (open, open_children, is_current) =
        STATE.with_borrow(|state| match state.scopes.get(&scope.id) {
            Some(open) if scope.root == state.root.id => {
                (true, open.open_children, state.current.id == scope.id)
            }
            _ => (false, 0, false),
        });
    if !open {
        return Ok(());
    }
    if open_children > 0 {
        return Err(rquickjs::Exception::throw_message(
            ctx,
            "a custom invocation context cannot be closed while it has open child contexts",
        ));
    }
    if is_current {
        let parent = scope.parent.clone().expect("a non-root scope has a parent");
        switch_to(&parent);
    }
    let released = STATE.with_borrow_mut(|state| {
        let released = state.scopes.remove(&scope.id);
        if let Some(parent) = &scope.parent
            && let Some(parent) = state.scopes.get_mut(&parent.id)
        {
            parent.open_children -= 1;
        }
        released
    });
    drop(released);
    let removed = ctx
        .userdata::<RuntimeTokens>()
        .expect("custom invocation context state not initialized")
        .tokens
        .borrow_mut()
        .remove(&scope.id);
    drop(removed);
    Ok(())
}

fn install_promise_hook(ctx: &Ctx<'_>) {
    HOOK_INSTALLED.set(true);
    let runtime = ctx
        .userdata::<RuntimeTokens>()
        .expect("custom invocation context state not initialized");
    if runtime.hook_installed.replace(true) {
        return;
    }
    // The hook is installed through the C API because the safe rquickjs setter needs the runtime
    // lock, which the calling JavaScript already holds. It is the runtime's only promise hook.
    unsafe {
        let rt = qjs::JS_GetRuntime(ctx.as_raw().as_ptr());
        qjs::JS_SetPromiseHook(rt, Some(promise_hook), std::ptr::null_mut());
    }
}

/// Runs `f` on the recorded promise scopes of the running root with the address of `promise`.
fn with_promise_scopes<R>(
    promise: qjs::JSValue,
    f: impl FnOnce(&mut HashMap<usize, Rc<ScopeInfo>>, usize) -> R,
) -> R {
    let address = unsafe { qjs::JS_VALUE_GET_PTR(promise) } as usize;
    let root = STATE.with_borrow(|state| state.root.id);
    PROMISE_SCOPES.with_borrow_mut(|recorded| {
        if recorded.root != root {
            recorded.root = root;
            recorded.scopes.clear();
        }
        f(&mut recorded.scopes, address)
    })
}

unsafe extern "C" fn promise_hook(
    _ctx: *mut qjs::JSContext,
    hook_type: qjs::JSPromiseHookType,
    promise: qjs::JSValue,
    _parent: qjs::JSValue,
    _opaque: *mut std::ffi::c_void,
) {
    match hook_type {
        qjs::JSPromiseHookType_JS_PROMISE_HOOK_INIT => {
            let scope = STATE.with_borrow(|state| {
                (state.current.id != state.root.id).then(|| state.current.clone())
            });
            with_promise_scopes(promise, |scopes, address| match &scope {
                Some(scope) => {
                    scopes.insert(address, scope.clone());
                }
                None => {
                    if !scopes.is_empty() {
                        scopes.remove(&address);
                    }
                }
            });
        }
        qjs::JSPromiseHookType_JS_PROMISE_HOOK_BEFORE => {
            let recorded =
                with_promise_scopes(promise, |scopes, address| scopes.get(&address).cloned());
            let target = recorded.unwrap_or_else(|| STATE.with_borrow(|state| state.root.clone()));
            let previous = STATE.with_borrow_mut(|state| {
                let previous = state.current.clone();
                state.hook_stack.push(previous.clone());
                previous
            });
            if !Rc::ptr_eq(&previous, &target) {
                switch_to(&target);
            }
        }
        qjs::JSPromiseHookType_JS_PROMISE_HOOK_AFTER => {
            // A hook installed while a job runs sees that job's AFTER without its BEFORE. That job
            // started before any scope was open, so at the root.
            let previous = STATE.with_borrow_mut(|state| {
                state.hook_stack.pop().unwrap_or_else(|| state.root.clone())
            });
            switch_to(&previous);
        }
        _ => {}
    }
}
