use rand::RngCore;
use rquickjs::TypedArray;
use std::collections::HashMap;
use std::slice;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{LazyLock, Mutex};

use digest::Digest;
use md5::Md5;
use ripemd::Ripemd160;
use sha1::Sha1;
use sha2::{Sha224, Sha256, Sha384, Sha512};
use sha3::{Sha3_256, Sha3_384, Sha3_512};

enum HashContext {
    Md5(Md5),
    Sha1(Sha1),
    Sha224(Sha224),
    Sha256(Sha256),
    Sha384(Sha384),
    Sha512(Sha512),
    Sha3_256(Sha3_256),
    Sha3_384(Sha3_384),
    Sha3_512(Sha3_512),
    Ripemd160(Ripemd160),
}

impl HashContext {
    fn update(&mut self, data: &[u8]) {
        match self {
            HashContext::Md5(h) => h.update(data),
            HashContext::Sha1(h) => h.update(data),
            HashContext::Sha224(h) => h.update(data),
            HashContext::Sha256(h) => h.update(data),
            HashContext::Sha384(h) => h.update(data),
            HashContext::Sha512(h) => h.update(data),
            HashContext::Sha3_256(h) => h.update(data),
            HashContext::Sha3_384(h) => h.update(data),
            HashContext::Sha3_512(h) => h.update(data),
            HashContext::Ripemd160(h) => h.update(data),
        }
    }

    fn finalize(self) -> Vec<u8> {
        match self {
            HashContext::Md5(h) => h.finalize().to_vec(),
            HashContext::Sha1(h) => h.finalize().to_vec(),
            HashContext::Sha224(h) => h.finalize().to_vec(),
            HashContext::Sha256(h) => h.finalize().to_vec(),
            HashContext::Sha384(h) => h.finalize().to_vec(),
            HashContext::Sha512(h) => h.finalize().to_vec(),
            HashContext::Sha3_256(h) => h.finalize().to_vec(),
            HashContext::Sha3_384(h) => h.finalize().to_vec(),
            HashContext::Sha3_512(h) => h.finalize().to_vec(),
            HashContext::Ripemd160(h) => h.finalize().to_vec(),
        }
    }

    fn clone_context(&self) -> HashContext {
        match self {
            HashContext::Md5(h) => HashContext::Md5(h.clone()),
            HashContext::Sha1(h) => HashContext::Sha1(h.clone()),
            HashContext::Sha224(h) => HashContext::Sha224(h.clone()),
            HashContext::Sha256(h) => HashContext::Sha256(h.clone()),
            HashContext::Sha384(h) => HashContext::Sha384(h.clone()),
            HashContext::Sha512(h) => HashContext::Sha512(h.clone()),
            HashContext::Sha3_256(h) => HashContext::Sha3_256(h.clone()),
            HashContext::Sha3_384(h) => HashContext::Sha3_384(h.clone()),
            HashContext::Sha3_512(h) => HashContext::Sha3_512(h.clone()),
            HashContext::Ripemd160(h) => HashContext::Ripemd160(h.clone()),
        }
    }
}

fn create_hasher(algorithm: &str) -> Option<HashContext> {
    match algorithm {
        "md5" => Some(HashContext::Md5(Md5::new())),
        "sha1" => Some(HashContext::Sha1(Sha1::new())),
        "sha224" => Some(HashContext::Sha224(Sha224::new())),
        "sha256" => Some(HashContext::Sha256(Sha256::new())),
        "sha384" => Some(HashContext::Sha384(Sha384::new())),
        "sha512" => Some(HashContext::Sha512(Sha512::new())),
        "sha3-256" => Some(HashContext::Sha3_256(Sha3_256::new())),
        "sha3-384" => Some(HashContext::Sha3_384(Sha3_384::new())),
        "sha3-512" => Some(HashContext::Sha3_512(Sha3_512::new())),
        "ripemd160" => Some(HashContext::Ripemd160(Ripemd160::new())),
        _ => None,
    }
}

const SUPPORTED_HASHES: &[&str] = &[
    "md5", "sha1", "sha224", "sha256", "sha384", "sha512", "sha3-256", "sha3-384", "sha3-512",
    "ripemd160",
];

static NEXT_HANDLE: AtomicU32 = AtomicU32::new(1);
static CONTEXTS: LazyLock<Mutex<HashMap<u32, HashContext>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn next_id() -> u32 {
    NEXT_HANDLE.fetch_add(1, Ordering::Relaxed)
}

fn hash_init_impl(algorithm: &str) -> Option<u32> {
    let algo = algorithm.to_lowercase();
    create_hasher(&algo).map(|hasher| {
        let id = next_id();
        CONTEXTS.lock().unwrap().insert(id, hasher);
        id
    })
}

fn hash_update_impl(id: u32, data: &[u8]) -> bool {
    if let Some(hasher) = CONTEXTS.lock().unwrap().get_mut(&id) {
        hasher.update(data);
        true
    } else {
        false
    }
}

fn hash_final_impl(id: u32) -> Option<Vec<u8>> {
    CONTEXTS.lock().unwrap().remove(&id).map(|h| h.finalize())
}

fn hash_copy_impl(id: u32) -> Option<u32> {
    let cloned = {
        let contexts = CONTEXTS.lock().unwrap();
        contexts.get(&id).map(|hasher| hasher.clone_context())
    };
    cloned.map(|c| {
        let new_id = next_id();
        CONTEXTS.lock().unwrap().insert(new_id, c);
        new_id
    })
}

// Native functions for the crypto implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    use rquickjs::TypedArray;

    #[rquickjs::function]
    pub fn random_uuid_v4_string() -> String {
        let uuid = uuid::Uuid::new_v4();
        uuid.to_string()
    }

    #[rquickjs::function]
    pub fn hash_init(algorithm: String) -> Option<u32> {
        super::hash_init_impl(&algorithm)
    }

    #[rquickjs::function]
    pub fn hash_update(id: u32, data: TypedArray<'_, u8>) -> bool {
        if let Some(raw) = data.as_raw() {
            let slice = unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) };
            super::hash_update_impl(id, slice)
        } else {
            false
        }
    }

    #[rquickjs::function]
    pub fn hash_final(id: u32) -> Option<Vec<u8>> {
        super::hash_final_impl(id)
    }

    #[rquickjs::function]
    pub fn hash_copy(id: u32) -> Option<u32> {
        super::hash_copy_impl(id)
    }

    #[rquickjs::function]
    pub fn hash_free(id: u32) {
        super::CONTEXTS.lock().unwrap().remove(&id);
    }

    #[rquickjs::function]
    pub fn hash_one_shot(algorithm: String, data: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let algo = algorithm.to_lowercase();
        let mut hasher = super::create_hasher(&algo)?;
        if let Some(raw) = data.as_raw() {
            let slice = unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) };
            hasher.update(slice);
        }
        Some(hasher.finalize())
    }

    #[rquickjs::function]
    pub fn get_hashes() -> Vec<String> {
        super::SUPPORTED_HASHES
            .iter()
            .map(|s| s.to_string())
            .collect()
    }

    #[rquickjs::function]
    pub fn random_bytes(len: u32) -> Vec<u8> {
        use rand::RngCore;
        let mut buf = vec![0u8; len as usize];
        rand::rng().fill_bytes(&mut buf);
        buf
    }

    #[rquickjs::function]
    pub fn random_int_range(min: f64, max: f64) -> Option<f64> {
        use rand::RngCore;
        let min_i = min as i64;
        let max_i = max as i64;
        if min_i >= max_i {
            return None;
        }
        let range = (max_i - min_i) as u64;
        let mut buf = [0u8; 8];
        rand::rng().fill_bytes(&mut buf);
        let random_val = u64::from_le_bytes(buf);
        let result = min_i + (random_val % range) as i64;
        Some(result as f64)
    }

    #[rquickjs::function]
    pub fn timing_safe_equal(
        a: TypedArray<'_, u8>,
        b: TypedArray<'_, u8>,
    ) -> Option<bool> {
        let a_raw = a.as_raw()?;
        let b_raw = b.as_raw()?;
        if a_raw.len != b_raw.len {
            return None;
        }
        let a_slice = unsafe { std::slice::from_raw_parts(a_raw.ptr.as_ptr(), a_raw.len) };
        let b_slice = unsafe { std::slice::from_raw_parts(b_raw.ptr.as_ptr(), b_raw.len) };
        use subtle::ConstantTimeEq;
        Some(a_slice.ct_eq(b_slice).into())
    }

    #[rquickjs::function]
    pub fn randomize_int8_array(array: TypedArray<'_, i8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint8_array(array: TypedArray<'_, u8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint8_clamped_array(array: TypedArray<'_, u8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_int16_array(array: TypedArray<'_, i16>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint16_array(array: TypedArray<'_, u16>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_int32_array(array: TypedArray<'_, i32>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint32_array(array: TypedArray<'_, u32>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_bigint64_array(array: TypedArray<'_, i64>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_biguint64_array(array: TypedArray<'_, u64>) {
        super::randomize_typed_array(array);
    }
}

fn randomize_typed_array<V>(array: TypedArray<V>) {
    if let Some(raw) = array.as_raw() {
        let slice = unsafe { slice::from_raw_parts_mut(raw.ptr.as_ptr(), raw.len) };
        rand::rng().fill_bytes(slice);
    }
}

// JS functions for the crypto implementation
pub const WEB_CRYPTO_JS: &str = include_str!("web-crypto.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from '__wasm_rquickjs_builtin/web_crypto';"#;

// JS code wiring the crypto module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_web_crypto from '__wasm_rquickjs_builtin/web_crypto';
        globalThis.crypto = __wasm_rquickjs_web_crypto;
    "#;
