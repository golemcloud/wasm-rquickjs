use crate::common::{
    CompiledTest, FeatureCombination, TestInstance, TestTarget, invoke_and_capture_output,
    test_target,
};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec};
use wasmtime::component::Val;

#[test_dep(tagged_as = "process_backend", scope = Cloneable)]
async fn compiled_process_backend() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/process-backend");
    CompiledTest::new_with_features_and_additional_modules(
        path,
        true,
        FeatureCombination::Normal,
        &[JsModuleSpec {
            name: "wasm-rquickjs-runtime-init".to_string(),
            mode: EmbeddingMode::EmbedFile(path.join("src/runtime-init.js")),
        }],
    )
    .await
    .expect("Failed to compile process backend")
}

#[test]
async fn process_backend_is_runtime_local_and_preserves_inline_execution(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    assert!(
        output.is_empty(),
        "backend output leaked to component stdio: {output}"
    );
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

async fn check_local_node_child_lifetime(compiled: &CompiledTest, api: &str) -> anyhow::Result<()> {
    if test_target() == TestTarget::P2 {
        return check_isolated_child(compiled, serde_json::json!({ "mode": "unsupported" })).await;
    }
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    instance.set_epoch_deadline(30);
    std::fs::write(
        instance.temp_dir_path().join("local-child-lifetime.json"),
        serde_json::to_string(api)?,
    )?;
    let (result, stdout, stderr) = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        instance.invoke_and_capture_output_with_stderr(None, "run", &[]),
    )
    .await?;
    assert_eq!(result?, Some(Val::Bool(true)));
    assert!(stdout.is_empty(), "child stdout escaped: {stdout}");
    assert!(stderr.is_empty(), "child stderr escaped: {stderr}");
    Ok(())
}

#[test]
async fn synchronous_isolated_child_boundary(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({})).await
}

async fn check_isolated_child(
    compiled: &CompiledTest,
    mut config: serde_json::Value,
) -> anyhow::Result<()> {
    // P2 checks its public inline behavior rather than the P3-only lifecycle.
    if test_target() == TestTarget::P2 {
        config["mode"] = serde_json::json!("unsupported");
    }
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    instance.set_epoch_deadline(30);
    std::fs::write(
        instance.temp_dir_path().join("isolated-child-probe.json"),
        serde_json::to_string(&config)?,
    )?;
    let (result, stdout, stderr) = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        instance.invoke_and_capture_output_with_stderr(None, "run", &[]),
    )
    .await?;
    let result = result.map_err(|error| {
        match std::fs::read_to_string(instance.temp_dir_path().join("module-stdio-phase")) {
            Ok(phase) => error.context(format!("Last module/stdio phase: {phase}")),
            Err(_) => error,
        }
    })?;
    assert_eq!(result, Some(Val::Bool(true)));
    assert!(stdout.is_empty(), "child stdout escaped: {stdout}");
    assert!(stderr.is_empty(), "child stderr escaped: {stderr}");
    Ok(())
}

#[test]
async fn synchronous_isolated_child_callback(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "callback" })).await
}

#[test]
async fn synchronous_isolated_child_nested(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "nested" })).await
}

#[test]
async fn synchronous_isolated_child_http(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _server) = crate::common::test_server::start_test_server().await;
    check_isolated_child(
        compiled,
        serde_json::json!({
            "mode": "http",
            "url": format!("http://localhost:{port}/redirect-to?url=/todos&status=302&delay_ms=30"),
        }),
    )
    .await
}

#[test]
async fn synchronous_isolated_child_unref(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "unref" })).await
}

#[test]
async fn synchronous_isolated_child_unref_with_pending_http(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    for mode in ["unref-http", "unref-http-after-ref"] {
        let released = std::sync::Arc::new(tokio::sync::Notify::new());
        let held = released.clone();
        let router = axum::Router::new()
            .route(
                "/held",
                axum::routing::get(move || {
                    let held = held.clone();
                    async move {
                        held.notified().await;
                        "done"
                    }
                }),
            )
            .route(
                "/release",
                axum::routing::get(move || {
                    let released = released.clone();
                    async move {
                        released.notify_one();
                        "released"
                    }
                }),
            );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
        let port = listener.local_addr()?.port();
        let _server = crate::common::test_server::TestServerHandle::new(tokio::spawn(async move {
            axum::serve(listener, router).await.unwrap();
        }));
        check_isolated_child(
            compiled,
            serde_json::json!({
                "mode": mode, "url": format!("http://127.0.0.1:{port}"),
            }),
        )
        .await?;
    }
    Ok(())
}

#[test]
async fn synchronous_isolated_child_timer_edges(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "timer-edges" })).await
}

#[test]
async fn synchronous_isolated_child_checkpoint(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "checkpoint" })).await
}

#[test]
async fn synchronous_isolated_child_cleanup(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "cleanup" })).await
}

#[test]
async fn local_node_child_spawn_sync_waits_for_asynchronous_work(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_local_node_child_lifetime(compiled, "spawnSync").await
}

#[test]
async fn local_node_child_exec_file_waits_for_asynchronous_work(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_local_node_child_lifetime(compiled, "execFile").await
}

#[test]
async fn local_node_child_public_contract(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "public-contract" })).await
}

#[test]
async fn local_node_child_module_and_stdio_contract(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "module-stdio" })).await
}

#[test]
async fn local_node_child_rejected_tla_keeps_runtime_usable(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(
        compiled,
        serde_json::json!({ "mode": "tla-cleanup", "kind": "require" }),
    )
    .await
}

#[test]
async fn local_node_child_unresolved_tla_keeps_runtime_usable(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(
        compiled,
        serde_json::json!({ "mode": "tla-cleanup", "kind": "pending" }),
    )
    .await
}

#[test]
async fn local_node_child_entry_resolution_contract(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "entry-resolution" })).await
}

#[test]
async fn local_node_child_microtask_error_contract(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "microtask-errors" })).await
}

#[test]
async fn local_node_child_async_control_contract(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check_isolated_child(compiled, serde_json::json!({ "mode": "async-control" })).await
}
