pub const IMPORT_ABORT_JS: &str = include_str!("import_abort.js");

#[rquickjs::module]
pub mod native_module {
    use crate::internal::import_abort;
    use rquickjs::{Ctx, Value};

    #[rquickjs::function]
    pub fn enter<'js>(ctx: Ctx<'js>, signal: Value<'js>) -> Option<Value<'js>> {
        import_abort::enter(&ctx, signal)
    }

    #[rquickjs::function]
    pub fn leave<'js>(ctx: Ctx<'js>, previous: Option<Value<'js>>) {
        import_abort::leave(&ctx, previous)
    }
}
