use rquickjs::{Ctx, Result, module::ModuleDef};

pub struct NativeModule;

impl ModuleDef for NativeModule {
    fn declare(decl: &rquickjs::module::Declarations) -> Result<()> {
        Ok(())
    }

    fn evaluate<'js>(ctx: &Ctx<'js>, exports: &rquickjs::module::Exports<'js>) -> Result<()> {
        Ok(())
    }
}
