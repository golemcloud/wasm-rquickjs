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
        globalThis.gc = __wasm_rquickjs_gc;
    "#;
