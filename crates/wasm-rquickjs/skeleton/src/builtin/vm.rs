use rquickjs::qjs;
use rquickjs::{CaughtError, Persistent, Value};
use std::ptr::NonNull;

#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::{Ctx, Value};

    /// Evaluate `code` in a brand-new QuickJS context that shares the same
    /// runtime (and therefore the same object heap). Sandbox properties are
    /// copied to the new context's global object before evaluation, and the
    /// result is returned as a value in the *calling* context.
    #[rquickjs::function]
    pub fn eval_in_new_context<'js>(
        ctx: Ctx<'js>,
        code: String,
        sandbox_keys: Vec<String>,
        sandbox_values: Vec<Value<'js>>,
    ) -> rquickjs::Result<Value<'js>> {
        super::eval_in_new_context_impl(ctx, &code, &sandbox_keys, &sandbox_values)
    }
}

fn eval_in_new_context_impl<'js>(
    caller_ctx: rquickjs::Ctx<'js>,
    code: &str,
    sandbox_keys: &[String],
    sandbox_values: &[rquickjs::Value<'js>],
) -> rquickjs::Result<rquickjs::Value<'js>> {
    // Save sandbox values as Persistent so they can be restored in the new context.
    let persistent_values: Vec<Persistent<Value<'static>>> = sandbox_values
        .iter()
        .map(|v| Persistent::save(&caller_ctx, v.clone()))
        .collect();

    // --- Minimal unsafe boundary: create a new JSContext on the same runtime ---
    // This is the only part that cannot be done with safe rquickjs APIs, because
    // we are inside a callback where the runtime lock is already held.
    let new_ctx: rquickjs::Ctx<'js> = unsafe {
        let rt = qjs::JS_GetRuntime(caller_ctx.as_raw().as_ptr());
        let raw_ctx = qjs::JS_NewContext(rt);
        let nn = NonNull::new(raw_ctx).ok_or(rquickjs::Error::Unknown)?;
        // Ctx::from_raw dups the context; we must free our original reference.
        let ctx = rquickjs::Ctx::from_raw(nn);
        qjs::JS_FreeContext(raw_ctx);
        ctx
    };

    // --- Everything below uses safe rquickjs APIs ---

    // Restore sandbox values into the new context's global object
    let new_global = new_ctx.globals();
    for (key, pval) in sandbox_keys.iter().zip(persistent_values.into_iter()) {
        let restored: Value<'js> = pval
            .restore(&new_ctx)
            .map_err(|_| rquickjs::Error::Unknown)?;
        new_global.set(key.as_str(), restored)?;
    }

    // Evaluate the code in the new context
    let eval_result: Result<Value<'js>, _> = new_ctx.eval(code);

    match eval_result {
        Ok(result) => {
            // Save the result as Persistent, then restore in the caller's context
            let persistent_result = Persistent::save(&new_ctx, result);
            let caller_result: Value<'js> = persistent_result
                .restore(&caller_ctx)
                .map_err(|_| rquickjs::Error::Unknown)?;
            Ok(caller_result)
        }
        Err(err) => {
            // Catch the exception from the new context and re-throw in the caller
            let caught = CaughtError::catch(&new_ctx, Err::<(), _>(err));
            if let Err(CaughtError::Exception(exc)) = caught {
                let msg: String = exc
                    .message()
                    .unwrap_or_else(|| "Error in vm.runInNewContext".to_string());
                let name: String = exc
                    .get::<_, rquickjs::String>("name")
                    .ok()
                    .and_then(|s| s.to_string().ok())
                    .unwrap_or_else(|| "Error".to_string());

                // Re-throw in the caller's context
                let err_code = format!(
                    "(() => {{ throw new {}({}) }})()",
                    name,
                    serde_json_mini_quote(&msg),
                );
                let _: Result<Value<'js>, _> = caller_ctx.eval(err_code);
                Err(rquickjs::Error::Exception)
            } else if let Err(CaughtError::Value(val)) = caught {
                // Non-Error throw (e.g. `throw "string"`)
                let persistent_val = Persistent::save(&new_ctx, val);
                if let Ok(restored) = persistent_val.restore(&caller_ctx) {
                    caller_ctx.throw(restored);
                }
                Err(rquickjs::Error::Exception)
            } else {
                Err(rquickjs::Error::Unknown)
            }
        }
    }
}

/// Minimal JSON string quoting for error messages.
fn serde_json_mini_quote(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c < '\x20' => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

// JS source for the vm module
pub const VM_JS: &str = include_str!("vm.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from '__wasm_rquickjs_builtin/vm'; export { default } from '__wasm_rquickjs_builtin/vm';"#;
