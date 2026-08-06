#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use crate::internal::runtime_services::RuntimeServices;
    use rquickjs::Ctx;

    #[rquickjs::function]
    pub fn heap_size_limit(ctx: Ctx<'_>) -> i64 {
        ctx.userdata::<RuntimeServices>()
            .expect("runtime services not initialized")
            .heap_size_limit as i64
    }
}

pub const V8_JS: &str = include_str!("v8.js");
pub const REEXPORT_JS: &str = r#"export * from 'node:v8'; export { default } from 'node:v8';"#;
