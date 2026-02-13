use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("crypto")]
    CompiledTest
);

#[test]
async fn web_crypto_random_uuid(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "new-uuids", &[]).await;

    let result = result?;

    match result {
        Some(Val::Tuple(vals)) => {
            let strings = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::String(s) => Some(s),
                    _ => None,
                })
                .collect::<Vec<_>>();

            assert_eq!(strings.len(), 2);

            strings
                .into_iter()
                .map(|s| uuid::Uuid::parse_str(&s))
                .collect::<Result<Vec<_>, _>>()?;

            Ok(())
        }
        _ => Err(anyhow!("Expected tuple result")),
    }
}

#[test]
async fn web_crypto_random_s8(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "random-s8", &[Val::U32(10)]).await;

    let result = result?;

    match result {
        Some(Val::List(vals)) => {
            let bytes = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::S8(b) => Some(b),
                    _ => None,
                })
                .collect::<Vec<_>>();

            assert_eq!(bytes.len(), 10);
            assert!(
                bytes.iter().any(|b| b != &bytes[0]),
                "There should be some different bytes in the list"
            );

            Ok(())
        }
        _ => Err(anyhow!("Expected list<s8> result")),
    }
}

#[test]
async fn web_crypto_random_u32(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "random-u32", &[Val::U32(10)]).await;

    let result = result?;

    match result {
        Some(Val::List(vals)) => {
            let numbers = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::U32(n) => Some(n),
                    _ => None,
                })
                .collect::<Vec<_>>();

            assert_eq!(numbers.len(), 10);
            assert!(
                numbers.iter().any(|b| b != &numbers[0]),
                "There should be some different numbers in the list"
            );

            Ok(())
        }
        _ => Err(anyhow!("Expected list<u32> result")),
    }
}

#[test]
async fn crypto_create_hash_sha256(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "sha256-hex",
        &[Val::String("some data to hash".to_string())],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::String(hex)) => {
            assert_eq!(
                hex,
                "6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_create_hash_multi_update(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "sha256-multi-update",
        &[Val::List(vec![
            Val::String("some ".to_string()),
            Val::String("data ".to_string()),
            Val::String("to hash".to_string()),
        ])],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::String(hex)) => {
            assert_eq!(
                hex,
                "6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}
