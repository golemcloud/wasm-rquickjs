#[rquickjs::module]
pub mod native_module {
    use rquickjs::Ctx;

    #[rquickjs::function]
    pub fn gc(_ctx: Ctx<'_>) {
        let state = crate::internal::get_js_state();
        state
            .gc_pending
            .store(true, std::sync::atomic::Ordering::Relaxed);
    }
}

pub const WIRE_JS: &str = r#"
        import { gc as __wasm_rquickjs_gc } from '__wasm_rquickjs_builtin/gc_native';
        globalThis.gc = __wasm_rquickjs_gc;
    "#;
