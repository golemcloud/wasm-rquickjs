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

#[test]
async fn crypto_hash_md5(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hash-with-algorithm",
        &[
            Val::String("md5".to_string()),
            Val::String("Test123".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(hex, "68eacb97d86f0c4621fa2b0e17cabd8c");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hash_sha1(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hash-with-algorithm",
        &[
            Val::String("sha1".to_string()),
            Val::String("Test123".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(hex, "8308651804facb7b9af8ffc53a33a22d6a1c8ac2");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hash_sha512(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hash-with-algorithm",
        &[
            Val::String("sha512".to_string()),
            Val::String("Test123".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(
                hex,
                "c12834f1031f6497214f27d4432f26517ad494156cb88d512bdb1dc4b57db2d6\
                 92a3dfa269a19b0a0a2a0fd7d6a2a885e33c839c93c206da30a187392847ed27"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hash_one_shot(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hash-one-shot",
        &[
            Val::String("sha256".to_string()),
            Val::String("some data to hash".to_string()),
        ],
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
async fn crypto_list_hashes(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "list-hashes", &[]).await;

    let result = result?;
    match result {
        Some(Val::List(vals)) => {
            let hashes: Vec<String> = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::String(s) => Some(s),
                    _ => None,
                })
                .collect();
            assert!(hashes.contains(&"sha256".to_string()));
            assert!(hashes.contains(&"sha1".to_string()));
            assert!(hashes.contains(&"md5".to_string()));
            assert!(hashes.contains(&"sha512".to_string()));
            Ok(())
        }
        _ => Err(anyhow!("Expected list result")),
    }
}

#[test]
async fn crypto_random_bytes(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "generate-random-bytes",
        &[Val::U32(32)],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::List(vals)) => {
            let bytes: Vec<u8> = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::U8(b) => Some(b),
                    _ => None,
                })
                .collect();
            assert_eq!(bytes.len(), 32);
            assert!(
                bytes.iter().any(|b| b != &bytes[0]),
                "Random bytes should not all be the same"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected list<u8> result")),
    }
}

#[test]
async fn crypto_random_int(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "generate-random-int",
        &[Val::S64(0), Val::S64(100)],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::S64(n)) => {
            assert!(n >= 0 && n < 100, "Random int {n} should be in [0, 100)");
            Ok(())
        }
        _ => Err(anyhow!("Expected s64 result, got {:?}", result)),
    }
}

#[test]
async fn crypto_timing_safe_equal(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "check-timing-safe-equal",
        &[
            Val::String("hello".to_string()),
            Val::String("hello".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(equal)) => {
            assert!(equal, "timingSafeEqual should return true for equal strings");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_timing_safe_not_equal(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "check-timing-safe-equal",
        &[
            Val::String("hello".to_string()),
            Val::String("world".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(equal)) => {
            assert!(
                !equal,
                "timingSafeEqual should return false for different strings"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}
