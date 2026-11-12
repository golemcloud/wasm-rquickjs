pub const CUSTOM_INVOCATION_CONTEXT_JS: &str = include_str!("custom_invocation_context.js");

/// `queueMicrotask` jobs get no promise hook events, so the callback carries its scope itself.
pub const WIRE_JS: &str = r#"
        import { capture_for_callback as __wasm_rquickjs_captureScope, swap as __wasm_rquickjs_swapScope } from '__wasm_rquickjs_builtin/custom_invocation_context_native';
        const __wasm_rquickjs_queueMicrotask = globalThis.queueMicrotask;
        globalThis.queueMicrotask = function queueMicrotask(callback) {
            const scope = __wasm_rquickjs_captureScope();
            if (scope === undefined || typeof callback !== 'function') {
                return __wasm_rquickjs_queueMicrotask(callback);
            }
            return __wasm_rquickjs_queueMicrotask(function () {
                const previous = __wasm_rquickjs_swapScope(scope);
                try {
                    return callback();
                } finally {
                    __wasm_rquickjs_swapScope(previous);
                }
            });
        };
    "#;

#[rquickjs::module]
pub mod native_module {
    use crate::internal::custom_invocation_context::{self, Token};
    use rquickjs::{Class, Ctx, Object};

    #[rquickjs::function]
    pub fn capture<'js>(ctx: Ctx<'js>) -> rquickjs::Result<Class<'js, Token>> {
        custom_invocation_context::capture(&ctx)
    }

    #[rquickjs::function]
    pub fn capture_for_callback<'js>(ctx: Ctx<'js>) -> rquickjs::Result<Option<Class<'js, Token>>> {
        custom_invocation_context::capture_for_callback(&ctx)
    }

    #[rquickjs::function]
    pub fn swap<'js>(
        ctx: Ctx<'js>,
        next: Class<'js, Token>,
    ) -> rquickjs::Result<Class<'js, Token>> {
        custom_invocation_context::swap(&ctx, next)
    }

    #[rquickjs::function]
    pub fn enter_live<'js>(
        ctx: Ctx<'js>,
        live: Object<'js>,
    ) -> rquickjs::Result<Class<'js, Token>> {
        custom_invocation_context::enter_live(&ctx, live)
    }

    #[rquickjs::function]
    pub fn close<'js>(ctx: Ctx<'js>, token: Class<'js, Token>) -> rquickjs::Result<()> {
        custom_invocation_context::close(&ctx, token)
    }
}
