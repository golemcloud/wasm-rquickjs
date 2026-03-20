use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "response_static")]
fn compiled_response_static() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/response-static");
    CompiledTest::new(path, true).expect("Failed to compile response_static")
}

#[test]
async fn response_static_error(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-error",
        &[],
    )
    .await;

    let result = result?;

    // Response.error() should have status 500 (INTERNAL_SERVER_ERROR)
    match result {
        Some(Val::Record(vals)) => {
            let status = vals
                .iter()
                .find(|(k, _)| k == "status")
                .and_then(|(_, v)| match v {
                    Val::U16(s) => Some(*s),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No status field found"))?;

            assert_eq!(status, 500, "error() should have status 500");
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_redirect(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-redirect",
        &[],
    )
    .await;

    let result = result?;

    // Response.redirect() should have status 301
    match result {
        Some(Val::Record(vals)) => {
            let status = vals
                .iter()
                .find(|(k, _)| k == "status")
                .and_then(|(_, v)| match v {
                    Val::U16(s) => Some(*s),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No status field found"))?;

            let location = vals
                .iter()
                .find(|(k, _)| k == "location")
                .and_then(|(_, v)| match v {
                    Val::Option(Some(val)) => match &**val {
                        Val::String(s) => Some(s.clone()),
                        _ => None,
                    },
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No location field found"))?;

            assert_eq!(status, 301, "redirect(url, 301) should have status 301");
            assert_eq!(location, "https://example.com/new-path");
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_redirect_default(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-redirect-default",
        &[],
    )
    .await;

    let result = result?;

    // Response.redirect() should default to status 302
    match result {
        Some(Val::Record(vals)) => {
            let status = vals
                .iter()
                .find(|(k, _)| k == "status")
                .and_then(|(_, v)| match v {
                    Val::U16(s) => Some(*s),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No status field found"))?;

            assert_eq!(status, 302, "redirect() should default to status 302");
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_json(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-json",
        &[],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::Record(vals)) => {
            let status = vals
                .iter()
                .find(|(k, _)| k == "status")
                .and_then(|(_, v)| match v {
                    Val::U16(s) => Some(*s),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No status field found"))?;

            let content_type = vals
                .iter()
                .find(|(k, _)| k == "content-type")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No content-type field found"))?;

            let text = vals
                .iter()
                .find(|(k, _)| k == "text")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No text field found"))?;

            assert_eq!(status, 200);
            assert_eq!(content_type, "application/json");
            assert!(text.contains("Hello, World!"));
            assert!(text.contains("count"));
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_json_custom_status(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-json-custom-status",
        &[],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::Record(vals)) => {
            let status = vals
                .iter()
                .find(|(k, _)| k == "status")
                .and_then(|(_, v)| match v {
                    Val::U16(s) => Some(*s),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No status field found"))?;

            assert_eq!(
                status, 404,
                "json() with init.status should set that status"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_json_with_headers(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-json-with-headers",
        &[],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::Record(vals)) => {
            let content_type = vals
                .iter()
                .find(|(k, _)| k == "content-type")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No content-type field found"))?;

            let custom_header =
                vals.iter()
                    .find(|(k, _)| k == "custom-header")
                    .and_then(|(_, v)| match v {
                        Val::Option(Some(val)) => match &**val {
                            Val::String(s) => Some(s.clone()),
                            _ => None,
                        },
                        _ => None,
                    });

            assert_eq!(content_type, "application/json");
            assert_eq!(custom_header, Some("CustomValue".to_string()));
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_redirect_invalid_status(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-redirect-invalid-status",
        &[],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::Record(vals)) => {
            let success = vals
                .iter()
                .find(|(k, _)| k == "success")
                .and_then(|(_, v)| match v {
                    Val::Bool(b) => Some(*b),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No success field found"))?;

            let error = vals
                .iter()
                .find(|(k, _)| k == "error")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No error field found"))?;

            assert!(
                success,
                "Should have caught the error. Error message: {}",
                error
            );
            assert!(
                error.contains("RangeError"),
                "Should throw RangeError, got: {}",
                error
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_static_json_string(
    #[tagged_as("response_static")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-static/response-exports"),
        "test-response-json-string",
        &[],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::Record(vals)) => {
            let content_type = vals
                .iter()
                .find(|(k, _)| k == "content-type")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No content-type field found"))?;

            let text = vals
                .iter()
                .find(|(k, _)| k == "text")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No text field found"))?;

            assert_eq!(content_type, "application/json");
            assert!(text.contains("name"));
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}
