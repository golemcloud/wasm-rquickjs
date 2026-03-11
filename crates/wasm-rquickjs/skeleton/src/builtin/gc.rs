#[rquickjs::module]
pub mod native_module {
    use rquickjs::Ctx;

    #[rquickjs::function]
    pub fn gc(ctx: Ctx<'_>) {
        ctx.run_gc();
    }
}

pub const WIRE_JS: &str = r#"
        import { gc as __wasm_rquickjs_gc } from '__wasm_rquickjs_builtin/gc_native';
        globalThis.gc = function gc() {
            if (typeof globalThis.__wasm_rquickjs_pre_gc === 'function') {
                globalThis.__wasm_rquickjs_pre_gc();
            }
            __wasm_rquickjs_gc();
        };
    "#;
