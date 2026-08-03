pub const CODE_RUNNER_JS: &str = r#"
import { owned_runtime_isolation_probe } from '__wasm_rquickjs_builtin/code_runner_native';

// Temporary internal probe. Removed when the public spawn/run tests cover the
// same concurrent-runtime invariants.
export async function __testOwnedRuntimeIsolation() {
    return await owned_runtime_isolation_probe();
}
"#;

#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::Ctx;

    #[rquickjs::function]
    pub async fn owned_runtime_isolation_probe(ctx: Ctx<'_>) -> rquickjs::Result<String> {
        crate::internal::runtime_services::owned_runtime_isolation_probe()
            .await
            .map_err(|message| rquickjs::Exception::throw_message(&ctx, &message))
    }
}
