use rand::RngCore;
use rquickjs::TypedArray;
use std::slice;

// Native functions for the crypto implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::TypedArray;

    #[rquickjs::function]
    pub fn random_uuid_v4_string() -> String {
        let uuid = uuid::Uuid::new_v4();
        uuid.to_string()
    }

    #[rquickjs::function]
    pub fn randomize_int8_array<'js>(array: TypedArray<'js, i8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint8_array<'js>(array: TypedArray<'js, u8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint8_clamped_array<'js>(array: TypedArray<'js, u8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_int16_array<'js>(array: TypedArray<'js, i16>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint16_array<'js>(array: TypedArray<'js, u16>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_int32_array<'js>(array: TypedArray<'js, i32>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint32_array<'js>(array: TypedArray<'js, u32>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_bigint64_array<'js>(array: TypedArray<'js, i64>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_biguint64_array<'js>(array: TypedArray<'js, u64>) {
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

// JS code wiring the crypto module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_web_crypto from '__wasm_rquickjs_builtin/web_crypto';
        globalThis.crypto = __wasm_rquickjs_web_crypto;
    "#;
