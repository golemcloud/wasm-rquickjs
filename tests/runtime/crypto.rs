use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "crypto", scope = Cloneable)]
async fn compiled_crypto() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/crypto");
    CompiledTest::new_with_features(path, true, FeatureCombination::Full)
        .await
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

#[test]
async fn crypto_subtle_sign_verify_rsa_pss(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "subtle-sign-verify-rsa-pss",
        &[Val::String("Hello, SubtleCrypto RSA-PSS!".to_string())],
    )
    .await;

    let result = result?;
    match result {
        Some(Val::Bool(valid)) => {
            assert!(valid, "SubtleCrypto RSA-PSS sign/verify should succeed");
            Ok(())
        }
        _ => Err(anyhow!("Expected bool result")),
    }
}

#[test]
async fn crypto_x25519_agreement(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "x25519-agreement", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    // RFC 7748, section 6.1.
    let shared = "4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742";
    assert_eq!(
        actual,
        serde_json::json!({
            "alicePublic": "8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a",
            "bobPublic": "de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f",
            "aliceShared": shared,
            "bobShared": shared,
            "lowOrder": "ERR_OSSL_FAILED_DURING_DERIVATION",
            "generatedPublicMatchesPrivate": true,
            "generatedPublicDiffersFromPrivate": true,
            "generatedAgree": true,
        })
    );
    Ok(())
}

#[test]
async fn crypto_p521_key_pair(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "p521-key-pair", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        actual,
        serde_json::json!({
            "crv": "P-521",
            "generatorOnCurve": true,
            "publicOnCurve": true,
            "scalarInRange": true,
            "publicIsScalarTimesGenerator": true,
            "privateCarriesPublic": true,
        })
    );
    Ok(())
}

#[test]
async fn crypto_cfrg448_vectors(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "cfrg448-vectors", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    // RFC 7748, section 6.2.
    let alice_public = "9b08f7cc31b7e3e67d22d5aea121074a273bd2b83de09c63faa73d2c22c5d9bbc836647241d953d40c5b12da88120d53177f80e532c41fa0";
    let shared = "07fff4181ac6cc95ec1c16a94a0f74d12da232ce40a77552281d282bb60c0b56fd2464c335543936521c24403085d59a449a5037514a879d";
    // RFC 8032, section 7.4, "1 octet".
    let ed_signature = "26b8f91727bd62897af15e41eb43c377efb9c610d48f2335cb0bd0087810f4352541b143c4b981b7e18f62de8ccdf633fc1bf037ab7cd779805e0dbcc0aae1cbcee1afb2e027df36bc04dcecbf154336c19f0af7e0a6472905e799f1953d2a0ff3348ab21aa4adafd1d234441cf807c03a00";
    assert_eq!(
        actual,
        serde_json::json!({
            "alicePublic": alice_public,
            "bobPublic": "3eb7a829b0cd20f5bcfc0b599b6feccf6da4627107bdb0d4f345b43027d8b972fc3e34fb4232a13ca706dcb57aec3dae07bdc1c67bf33609",
            "shared": shared,
            "sharedReverse": shared,
            "nonCanonicalBase": alice_public,
            "low_zero": "ERR_OSSL_FAILED_DURING_DERIVATION",
            "low_one": "ERR_OSSL_FAILED_DURING_DERIVATION",
            "low_pMinus1": "ERR_OSSL_FAILED_DURING_DERIVATION",
            "edPublic": "43ba28f430cdff456ae531545f7ecd0ac834a55d9358c0372bfa0c6c6798c0866aea01eb00742802b8438ea4cb82169c235160627b4c3a9480",
            "edSig": ed_signature,
            "edVerify": true,
            "edNonCanonicalS": false,
            "edFlipped": false,
            "edWrongMsg": false,
            "edShort": false,
            "edUnusedBitPublicKey": false,
            "edUnusedBitR": false,
            "subtleBits": shared,
            "subtleBits100": "07fff4181ac6cc95ec1c16a940",
            "subtleKey": &shared[..64],
            "subtleEdSig": ed_signature,
            "x448GeneratedAgree": true,
            "x448GeneratedPublicDiffersFromPrivate": true,
            "ed448GeneratedPublicMatchesReimport": true,
            "ed448GeneratedRoundTrip": true,
            "subtleECDHMatchesNode": true,
            "subtleX25519MatchesNode": true,
        })
    );
    Ok(())
}

#[test]
async fn crypto_rsa_private_operations(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "rsa-private-operations", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    // Expected values are what Node.js 22.14.0 returns for the same calls.
    assert_eq!(
        actual,
        serde_json::json!({
            "pkcs1Type1": {
                "valid": "returned",
                "firstByteNonzero": "ERR_OSSL_RSA_INVALID_PADDING",
                "blockType02": "ERR_OSSL_RSA_BLOCK_TYPE_IS_NOT_01",
                "blockType00": "ERR_OSSL_RSA_BLOCK_TYPE_IS_NOT_01",
                "badPadByte": "ERR_OSSL_RSA_BAD_FIXED_HEADER_DECRYPT",
                "noSeparator": "ERR_OSSL_RSA_NULL_BEFORE_BLOCK_MISSING",
                "padTooShort": "ERR_OSSL_RSA_BAD_PAD_BYTE_COUNT",
                "padExactly8": "returned",
            },
            "oversized": {
                "privateDecryptOaep": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
                "privateDecryptOaepSha256": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
                "privateDecryptShake": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
                "privateDecryptRaw": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
                "privateDecryptRawLead1": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
                "publicDecryptPkcs1": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
                "publicDecryptRaw": "ERR_OSSL_RSA_DATA_GREATER_THAN_MOD_LEN",
            },
            "noPaddingEncrypt": {
                "publicShort": "ERR_OSSL_RSA_DATA_TOO_SMALL_FOR_KEY_SIZE",
                "publicEmpty": "ERR_OSSL_RSA_DATA_TOO_SMALL_FOR_KEY_SIZE",
                "publicOversized": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_KEY_SIZE",
                "privateShort": "ERR_OSSL_RSA_DATA_TOO_SMALL_FOR_KEY_SIZE",
                "privateEmpty": "ERR_OSSL_RSA_DATA_TOO_SMALL_FOR_KEY_SIZE",
                "privateOversized": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_KEY_SIZE",
                "publicExact": "returned",
            },
            "oaep": "oaep secret",
            "oaepRepeat": "oaep secret",
            "oaepSha1": "sha1 secret",
            "oaepWrongLabel": "ERR_OSSL_RSA_OAEP_DECODING_ERROR",
            "oaepTampered": "ERR_OSSL_RSA_OAEP_DECODING_ERROR",
            "oaepOtherKey": "ERR_OSSL_RSA_OAEP_DECODING_ERROR",
            "oaepOtherKeyAboveModulus": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_MODULUS",
            "pkcs1Signature": true,
            "pkcs1Verify": true,
            "publicDecrypt": "raw type1",
            "publicDecryptOtherKey": "ERR_OSSL_RSA_INVALID_PADDING",
            "publicDecryptOtherKeyAboveModulus": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_MODULUS",
            "publicDecryptOtherKeyBlockType": "ERR_OSSL_RSA_BLOCK_TYPE_IS_NOT_01",
            "publicDecryptShortPkcs1": "ERR_OSSL_RSA_INVALID_PADDING",
            "rawTooLarge": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_MODULUS",
            "rawEqualsModulus": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_MODULUS",
            "rawPublicEncryptEqualsModulus": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_MODULUS",
            "rawPublicDecryptEqualsModulus": "ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_MODULUS",
            "rawOversized": "rejected",
            "rawShortPrivateDecrypt": true,
            "rawShortPrivateDecryptInverts": true,
            "rawShortPublicDecryptInverts": true,
            "publicDecryptTampered": "rejected",
            "rawRoundTrip": true,
            "rawOtherKeyDiffers": true,
            "pkcs1Decrypt": "ERR_INVALID_ARG_VALUE",
            "smallKeyRoundTrip": true,
        })
    );
    Ok(())
}

#[test]
async fn crypto_ecdsa_host_signatures(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "ecdsa-host-signatures", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    let mut expected = serde_json::Map::new();
    for curve in ["p256", "p384", "p521", "k256"] {
        expected.insert(curve.to_string(), true.into());
        expected.insert(format!("{curve}OtherMessage"), false.into());
        expected.insert(format!("{curve}OwnNotDoubleHashed"), true.into());
    }
    assert_eq!(actual, serde_json::Value::Object(expected));
    Ok(())
}

#[test]
async fn crypto_k256_signature_forms(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "k256-signature-forms", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    // Node.js 22.14.0 and 26.13.1 return these values for the same calls.
    assert_eq!(
        actual,
        serde_json::json!({
            "lowDer": true,
            "highDer": true,
            "highOtherMessage": false,
            "highWrongKey": false,
            "zeroS": false,
            "sEqualsN": false,
            "sPlusN": false,
            "zeroR": false,
            "trailingByte": false,
        })
    );
    Ok(())
}

#[test]
async fn crypto_dsa_encoding_forms(
    #[tagged_as("crypto")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "dsa-encoding-forms", &[]).await;

    let Some(Val::String(json)) = result? else {
        return Err(anyhow!("Expected string result"));
    };
    let actual: serde_json::Value = serde_json::from_str(&json)?;
    // Node.js 22.14.0 and 26.13.1 return these values for the same calls.
    let host_signature = serde_json::json!({
        "der": true,
        "derExplicit": true,
        "p1363": true,
        "p1363AsDer": false,
        "derAsP1363": false,
        "p1363OtherMessage": false,
        "p1363Altered": false,
        "p1363Short": false,
        "p1363Zero": false,
        "p1363AllOnes": false,
    });
    let own = |length: u64| serde_json::json!({ "length": length, "p1363": true, "asDer": false, "streaming": true });
    let web = |length: u64| {
        serde_json::json!({
            "hostSignature": true,
            "hostSignatureAltered": false,
            "ownLength": length,
            "own": true,
        })
    };
    assert_eq!(
        actual,
        serde_json::json!({
            "p256": host_signature,
            "p384": host_signature,
            "p521": host_signature,
            "k256": host_signature,
            "dsa": host_signature,
            "invalidEncoding": "err:ERR_INVALID_ARG_VALUE",
            "ownp256": own(64),
            "ownp521": own(132),
            "webP256": web(64),
            "webP384": web(96),
            "webP521": web(132),
        })
    );
    Ok(())
}
