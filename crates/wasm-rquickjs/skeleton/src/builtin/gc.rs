#[rquickjs::module]
pub mod native_module {
    use rquickjs::Ctx;

    #[rquickjs::function]
    pub fn gc(ctx: Ctx<'_>) {
        ctx.run_gc();
    }
}

#[cfg(feature = "test-observability")]
mod observability {
    use rquickjs::class::Trace;
    use rquickjs::{Class, Ctx, Function, JsLifetime};
    use std::cell::Cell;
    use std::rc::Rc;

    #[derive(Debug, JsLifetime)]
    struct Counter(Rc<Cell<u64>>);

    #[derive(Trace, JsLifetime)]
    #[rquickjs::class]
    struct Probe {
        #[qjs(skip_trace)]
        drops: Rc<Cell<u64>>,
    }

    impl Drop for Probe {
        fn drop(&mut self) {
            self.drops.set(self.drops.get() + 1);
        }
    }

    fn new_probe<'js>(ctx: Ctx<'js>) -> rquickjs::Result<Class<'js, Probe>> {
        let drops = ctx.userdata::<Counter>().unwrap().0.clone();
        Class::instance(ctx, Probe { drops })
    }

    fn snapshot(ctx: Ctx<'_>) -> Vec<u64> {
        // SAFETY: The context roots its runtime; the initialized output is read
        // only after QuickJS has populated every field.
        let (stats, threshold) = unsafe {
            let rt = rquickjs::qjs::JS_GetRuntime(ctx.as_raw().as_ptr());
            let mut stats = std::mem::MaybeUninit::uninit();
            rquickjs::qjs::JS_ComputeMemoryUsage(rt, stats.as_mut_ptr());
            (stats.assume_init(), rquickjs::qjs::JS_GetGCThreshold(rt))
        };
        vec![
            stats.malloc_size as u64,
            stats.memory_used_size as u64,
            threshold as u64,
            ctx.userdata::<Counter>().unwrap().0.get(),
            (core::arch::wasm32::memory_size(0) * 65536) as u64,
            crate::internal::module_loading::import_attr_rewrite_token_count() as u64,
        ]
    }

    pub(super) fn install(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
        ctx.store_userdata(Counter(Rc::new(Cell::new(0)))).unwrap();
        let global = ctx.globals();
        global.set(
            "__wasm_rquickjs_gc_snapshot",
            Function::new(ctx.clone(), snapshot)?,
        )?;
        global.set(
            "__wasm_rquickjs_new_gc_probe",
            Function::new(ctx.clone(), new_probe)?,
        )?;
        global.set(
            "__wasm_rquickjs_shared_body_error_gc",
            Function::new(
                ctx.clone(),
                rquickjs::function::Async(
                    super::super::shared_response_body::gc_regression::error_gc,
                ),
            )?,
        )
    }
}

#[cfg(feature = "test-observability")]
pub(crate) fn install_observability(ctx: &rquickjs::Ctx<'_>) -> rquickjs::Result<()> {
    observability::install(ctx)
}

pub const WIRE_JS: &str = r#"
        import { gc as __wasm_rquickjs_gc } from '__wasm_rquickjs_builtin/gc_native';
        globalThis.gc = function gc() {
            if (typeof globalThis.__wasm_rquickjs_pre_gc === 'function') {
                globalThis.__wasm_rquickjs_pre_gc();
            }
            // Preserve explicit gc()'s deferred scheduling. This was introduced
            // to avoid forcing collection inside active async-generator frames;
            // automatic collection uses the engine's allocation checkpoints.
            // Observable cleanup (pre_gc hooks) still runs synchronously.
            globalThis.setTimeout(__wasm_rquickjs_gc, 0);
        };
    "#;
