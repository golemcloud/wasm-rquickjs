use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "crypto")]
fn compiled_crypto() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/crypto");
    CompiledTest::new_with_features(path, true, FeatureCombination::Full)
        .expect("Failed to compile crypto")
}

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
async fn crypto_hash_md5(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
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
async fn crypto_hash_sha1(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
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
async fn crypto_hash_sha512(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
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
async fn crypto_list_hashes(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
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
async fn crypto_random_bytes(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
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
async fn crypto_random_int(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
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
            assert!(
                (0..100).contains(&n),
                "Random int {n} should be in [0, 100)"
            );
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
            assert!(
                equal,
                "timingSafeEqual should return true for equal strings"
            );
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

#[test]
async fn crypto_hmac_sha256(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hmac-hex",
        &[
            Val::String("sha256".to_string()),
            Val::String("secret-key".to_string()),
            Val::String("some data to authenticate".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(
                hex,
                "8229597162d5857aefdf6d274e832044c98854a9968467cec03662038e9e45c3"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hmac_sha1(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hmac-hex",
        &[
            Val::String("sha1".to_string()),
            Val::String("key".to_string()),
            Val::String("The quick brown fox jumps over the lazy dog".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(hex, "de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hmac_md5(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hmac-hex",
        &[
            Val::String("md5".to_string()),
            Val::String("key".to_string()),
            Val::String("The quick brown fox jumps over the lazy dog".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(hex, "80070713463e7749b90c2dc24911e275");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hmac_multi_update(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hmac-multi-update",
        &[
            Val::String("sha256".to_string()),
            Val::String("secret-key".to_string()),
            Val::List(vec![
                Val::String("some ".to_string()),
                Val::String("data ".to_string()),
                Val::String("to authenticate".to_string()),
            ]),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(
                hex,
                "8229597162d5857aefdf6d274e832044c98854a9968467cec03662038e9e45c3"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_pbkdf2_sha256(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "pbkdf2-sha256-hex",
        &[
            Val::String("password".to_string()),
            Val::String("salt".to_string()),
            Val::U32(1000),
            Val::U32(32),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert_eq!(
                hex,
                "632c2812e46d4604102ba7618e9d6d7d2f8128f6266b4a03264d2a0460b7dcb3"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_scrypt(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "scrypt-hex",
        &[
            Val::String("password".to_string()),
            Val::String("salt".to_string()),
            Val::U32(32),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert!(!hex.is_empty(), "scrypt should produce non-empty output");
            assert_eq!(hex.len(), 64, "32 bytes = 64 hex chars");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_hkdf_sha256(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hkdf-sha256-hex",
        &[
            Val::String("key-material".to_string()),
            Val::String("salt".to_string()),
            Val::String("info".to_string()),
            Val::U32(32),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex)) => {
            assert!(!hex.is_empty(), "hkdf should produce non-empty output");
            assert_eq!(hex.len(), 64, "32 bytes = 64 hex chars");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_list_ciphers(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "list-ciphers", &[]).await;

    let result = result?;
    match result {
        Some(Val::List(vals)) => {
            let ciphers: Vec<String> = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::String(s) => Some(s),
                    _ => None,
                })
                .collect();
            assert!(
                ciphers.contains(&"aes-256-gcm".to_string()),
                "Should contain aes-256-gcm"
            );
            assert!(
                ciphers.contains(&"aes-256-cbc".to_string()),
                "Should contain aes-256-cbc"
            );
            assert!(
                ciphers.contains(&"chacha20-poly1305".to_string()),
                "Should contain chacha20-poly1305"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected list result")),
    }
}

#[test]
async fn crypto_aes_cbc_roundtrip(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "aes-cbc-roundtrip",
        &[
            Val::String("Hello, AES-CBC world!".to_string()),
            Val::String(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
            ),
            Val::String("abcdef0123456789abcdef0123456789".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(decrypted)) => {
            assert_eq!(decrypted, "Hello, AES-CBC world!");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_aes_ctr_roundtrip(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "aes-ctr-roundtrip",
        &[
            Val::String("Hello, AES-CTR world!".to_string()),
            Val::String(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
            ),
            Val::String("abcdef0123456789abcdef0123456789".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(decrypted)) => {
            assert_eq!(decrypted, "Hello, AES-CTR world!");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_aes_gcm_roundtrip(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "aes-gcm-roundtrip",
        &[
            Val::String("Hello, AES-GCM world!".to_string()),
            Val::String(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
            ),
            Val::String("000000000000000000000000".to_string()),
            Val::String("additional authenticated data".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(decrypted)) => {
            assert_eq!(decrypted, "Hello, AES-GCM world!");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_chacha20_poly1305_roundtrip(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "chacha20-poly1305-roundtrip",
        &[
            Val::String("Hello, ChaCha20-Poly1305!".to_string()),
            Val::String(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
            ),
            Val::String("000000000000000000000000".to_string()),
            Val::String("aad data".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(decrypted)) => {
            assert_eq!(decrypted, "Hello, ChaCha20-Poly1305!");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_aes_gcm_encrypt_deterministic(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "aes-gcm-encrypt-hex",
        &[
            Val::String("test".to_string()),
            Val::String(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
            ),
            Val::String("000000000000000000000000".to_string()),
        ],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::String(hex_result)) => {
            assert!(
                hex_result.contains(':'),
                "Should contain ciphertext:tag separated by ':'"
            );
            let parts: Vec<&str> = hex_result.split(':').collect();
            assert_eq!(parts.len(), 2);
            assert!(!parts[0].is_empty(), "Ciphertext should not be empty");
            assert_eq!(
                parts[1].len(),
                32,
                "Auth tag should be 16 bytes = 32 hex chars"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_ed25519_sign_verify(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "ed25519-sign-verify",
        &[Val::String("Hello, Ed25519!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(valid, "Ed25519 signature should verify successfully");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_ecdsa_p256_sign_verify(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "ecdsa-p256-sign-verify",
        &[Val::String("Hello, ECDSA P-256!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(valid, "ECDSA P-256 signature should verify successfully");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_ecdsa_secp256k1_sign_verify(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "ecdsa-secp256k1-sign-verify",
        &[Val::String("Hello, secp256k1!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(
                valid,
                "ECDSA secp256k1 signature should verify successfully"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_ed25519_key_type(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "ed25519-key-type", &[]).await;

    let result = result?;
    match result {
        Some(Val::String(key_info)) => {
            assert_eq!(key_info, "public:private:ed25519:ed25519");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_ecdsa_p256_export_import_verify(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "ecdsa-p256-export-import-verify",
        &[Val::String("Hello, export/import!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(valid, "ECDSA P-256 export/import/verify should succeed");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_ed25519_wrong_key_verify(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "ed25519-wrong-key-verify",
        &[Val::String("Hello, wrong key!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(!valid, "Ed25519 verification with wrong key should fail");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_list_curves(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "list-curves", &[]).await;

    let result = result?;
    match result {
        Some(Val::List(vals)) => {
            let curves: Vec<String> = vals
                .into_iter()
                .filter_map(|v| match v {
                    Val::String(s) => Some(s),
                    _ => None,
                })
                .collect();
            assert!(
                curves.contains(&"prime256v1".to_string()),
                "Should contain prime256v1"
            );
            assert!(
                curves.contains(&"secp384r1".to_string()),
                "Should contain secp384r1"
            );
            assert!(
                curves.contains(&"secp256k1".to_string()),
                "Should contain secp256k1"
            );
            Ok(())
        }
        _ => Err(anyhow!("Expected list result")),
    }
}

#[test]
async fn crypto_constants(#[tagged_as("crypto")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "get-constants", &[]).await;

    let result = result?;
    match result {
        Some(Val::String(keys_str)) => {
            let keys: Vec<&str> = keys_str.split(',').collect();
            assert!(
                keys.contains(&"RSA_PKCS1_PADDING"),
                "Should contain RSA_PKCS1_PADDING"
            );
            assert!(
                keys.contains(&"RSA_PKCS1_OAEP_PADDING"),
                "Should contain RSA_PKCS1_OAEP_PADDING"
            );
            assert!(
                keys.contains(&"POINT_CONVERSION_UNCOMPRESSED"),
                "Should contain POINT_CONVERSION_UNCOMPRESSED"
            );
            assert!(keys.len() > 10, "Should have many constants");
            Ok(())
        }
        _ => Err(anyhow!("Expected string result")),
    }
}

#[test]
async fn crypto_subtle_digest_sha256(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "subtle-digest-sha256",
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
async fn crypto_subtle_sign_verify_hmac(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "subtle-sign-verify-hmac",
        &[Val::String("Hello, SubtleCrypto HMAC!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(valid, "SubtleCrypto HMAC sign/verify should succeed");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_subtle_sign_verify_ed25519(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "subtle-sign-verify-ed25519",
        &[Val::String("Hello, SubtleCrypto Ed25519!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(valid, "SubtleCrypto Ed25519 sign/verify should succeed");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}
