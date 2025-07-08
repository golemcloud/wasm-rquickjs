use encoding_rs::{Encoding, UTF_8, UTF_16BE, UTF_16LE};
use rquickjs::JsLifetime;
use rquickjs::class::Trace;
use std::ptr;
use std::ptr::NonNull;

// Native functions for the encoding implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use encoding_rs::Encoding;
    use rquickjs::prelude::*;
    use rquickjs::{Ctx, TypedArray};

    #[rquickjs::function]
    pub fn supports_encoding(encoding: String) -> bool {
        Encoding::for_label(encoding.as_bytes()).is_some()
    }

    #[rquickjs::function]
    pub fn decode(
        bytes: TypedArray<'_, u8>,
        encoding: String,
        stream: bool,
        fatal: bool,
        ignore_bom: bool,
    ) -> List<(Option<String>, Option<String>)> {
        let bytes = bytes
            .as_bytes()
            .expect("the UInt8Array passed to decode is detached");
        match super::decode_impl(bytes, encoding, stream, fatal, ignore_bom) {
            Ok(result) => List((Some(result), None)),
            Err(error) => List((None, Some(error))),
        }
    }

    #[rquickjs::function]
    pub fn encode(string: String, ctx: Ctx<'_>) -> TypedArray<'_, u8> {
        TypedArray::new_copy(ctx, super::encode_impl(&string))
            .expect("failed to create UInt8Array from string")
    }

    #[rquickjs::function]
    pub fn encode_into(string: String, target: TypedArray<'_, u8>) -> super::EncodeIntoResult {
        let raw = target
            .as_raw()
            .expect("the UInt8Array passed to encodeInto is detached");
        super::encode_into_impl(&string, raw.len, raw.ptr)
    }
}

#[rquickjs::class]
#[derive(Trace, JsLifetime)]
pub struct EncodeIntoResult {
    pub read: usize,
    pub written: usize,
}

fn encode_impl(string: &str) -> &[u8] {
    string.as_bytes()
}

fn encode_into_impl(string: &str, target_len: usize, target: NonNull<u8>) -> EncodeIntoResult {
    let mut bytes_to_copy = 0;
    let mut chars_copied = 0;
    for (idx, _) in string.char_indices() {
        if idx <= target_len {
            bytes_to_copy = idx;
            chars_copied += 1;
        } else {
            break;
        }
    }
    unsafe { ptr::copy_nonoverlapping(string.as_ptr(), target.as_ptr(), bytes_to_copy) }

    EncodeIntoResult {
        read: chars_copied,
        written: bytes_to_copy,
    }
}

fn decode_impl(
    bytes: &[u8],
    encoding: String,
    _stream: bool,
    fatal: bool,
    ignore_bom: bool,
) -> Result<String, String> {
    let encoding = Encoding::for_label(encoding.as_bytes())
        .ok_or_else(|| format!("Unsupported encoding: {encoding}"))?;

    // TODO: we are not implementing streaming yet. to do so, TextDecoder should keep a native
    //       decoding state with a String and `new_decoder` variants should be used with `decoder.decode_to_string` variants.

    match (ignore_bom, fatal) {
        (false, false) => {
            let (result, _replaced) = encoding.decode_with_bom_removal(bytes);
            Ok(result.to_string())
        }
        (false, true) => {
            let without_bom = if encoding == UTF_8 && bytes.starts_with(b"\xEF\xBB\xBF") {
                &bytes[3..]
            } else if (encoding == UTF_16LE && bytes.starts_with(b"\xFF\xFE"))
                || (encoding == UTF_16BE && bytes.starts_with(b"\xFE\xFF"))
            {
                &bytes[2..]
            } else {
                bytes
            };
            let result = encoding
                .decode_without_bom_handling_and_without_replacement(without_bom)
                .ok_or_else(|| "Malformed input".to_string())?;
            Ok(result.to_string())
        }
        (true, false) => {
            let (result, _replaced) = encoding.decode_without_bom_handling(bytes);
            Ok(result.to_string())
        }
        (true, true) => {
            let result = encoding
                .decode_without_bom_handling_and_without_replacement(bytes)
                .ok_or_else(|| "Malformed input".to_string())?;
            Ok(result.to_string())
        }
    }
}

// JS functions for the Encoding API implementation
pub const ENCODING_JS: &str = include_str!("encoding.js");

// JS code wiring the encoding module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_encoding from '__wasm_rquickjs_builtin/encoding';
        globalThis.TextDecoder = __wasm_rquickjs_encoding.TextDecoder;
        globalThis.TextEncoder = __wasm_rquickjs_encoding.TextEncoder;
        globalThis.TextDecoderStream = __wasm_rquickjs_encoding.TextDecoderStream;
        globalThis.TextEncoderStream = __wasm_rquickjs_encoding.TextEncoderStream;
    "#;
