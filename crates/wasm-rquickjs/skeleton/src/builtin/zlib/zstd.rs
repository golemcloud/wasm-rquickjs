//! Stateful zstd backend. Every handle owns its own codec context.

use std::borrow::Cow;
use std::collections::HashMap;
use std::ptr::NonNull;
use std::sync::{LazyLock, Mutex};
use zstd_safe::{DCtx, DParameter, InBuffer, OutBuffer, ResetDirective, zstd_sys};

enum Codec {
    // zstd-safe 7's boolean LDM setter cannot represent ZSTD_ps_disable.
    // Own the C context directly so libzstd receives the original integers.
    Compress(NonNull<zstd_sys::ZSTD_CCtx>, Option<u64>),
    Decompress(DCtx<'static>),
}

// SAFETY: Each context has one owner; STREAMS serializes every access.
unsafe impl Send for Codec {}

impl Drop for Codec {
    fn drop(&mut self) {
        if let Self::Compress(ctx, _) = self {
            // SAFETY: This is the sole owner, and no codec call can outlive it.
            unsafe { zstd_sys::ZSTD_freeCCtx(ctx.as_ptr()) };
        }
    }
}

struct Stream {
    codec: Codec,
    complete: bool,
    emitted: bool,
    input_size: Option<u64>,
    pending: Vec<u8>,
    garbage: bool,
    reject_garbage: bool,
}

static STREAMS: LazyLock<Mutex<HashMap<u32, Stream>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn compression_parameter(key: u32) -> Option<zstd_sys::ZSTD_cParameter> {
    use zstd_sys::ZSTD_cParameter::*;
    Some(match key {
        100 => ZSTD_c_compressionLevel,
        101 => ZSTD_c_windowLog,
        102 => ZSTD_c_hashLog,
        103 => ZSTD_c_chainLog,
        104 => ZSTD_c_searchLog,
        105 => ZSTD_c_minMatch,
        106 => ZSTD_c_targetLength,
        107 => ZSTD_c_strategy,
        160 => ZSTD_c_enableLongDistanceMatching,
        161 => ZSTD_c_ldmHashLog,
        162 => ZSTD_c_ldmMinMatch,
        163 => ZSTD_c_ldmBucketSizeLog,
        164 => ZSTD_c_ldmHashRateLog,
        200 => ZSTD_c_contentSizeFlag,
        201 => ZSTD_c_checksumFlag,
        202 => ZSTD_c_dictIDFlag,
        400 => ZSTD_c_nbWorkers,
        401 => ZSTD_c_jobSize,
        402 => ZSTD_c_overlapLog,
        _ => return None,
    })
}

pub(super) fn new(
    decompress: bool,
    params: &str,
    dictionary: &[u8],
    pledged: Option<f64>,
    reject_garbage: bool,
) -> Option<u32> {
    let params: Vec<(u32, i32)> = serde_json::from_str(params).ok()?;
    let codec = if decompress {
        let mut ctx = DCtx::create();
        ctx.load_dictionary(dictionary).ok()?;
        for (key, value) in params {
            if key != 100 {
                return None;
            }
            ctx.set_parameter(DParameter::WindowLogMax(value as u32))
                .ok()?;
        }
        Codec::Decompress(ctx)
    } else {
        // SAFETY: The new context is immediately placed in its owning Codec,
        // including on every initialization failure below.
        let ctx = NonNull::new(unsafe { zstd_sys::ZSTD_createCCtx() })?;
        let pledged = pledged.map(|v| v as u64);
        let codec = Codec::Compress(ctx, pledged);
        for (key, value) in params {
            let parameter = compression_parameter(key)?;
            // SAFETY: The context is owned, and the parameter enum is valid.
            native_result(unsafe {
                zstd_sys::ZSTD_CCtx_setParameter(ctx.as_ptr(), parameter, value)
            })
            .ok()?;
        }
        // SAFETY: loadDictionary copies the borrowed bytes; neither call retains
        // a Rust reference. Parameters precede dictionary table construction.
        native_result(unsafe {
            zstd_sys::ZSTD_CCtx_loadDictionary(
                ctx.as_ptr(),
                dictionary.as_ptr().cast(),
                dictionary.len(),
            )
        })
        .ok()?;
        native_result(unsafe {
            zstd_sys::ZSTD_CCtx_setPledgedSrcSize(
                ctx.as_ptr(),
                pledged.unwrap_or(zstd_safe::CONTENTSIZE_UNKNOWN),
            )
        })
        .ok()?;
        codec
    };
    let input_size = match &codec {
        Codec::Compress(_, pledged) => pledged.map(|_| 0),
        Codec::Decompress(_) => None,
    };
    let id = super::next_id();
    STREAMS.lock().unwrap().insert(
        id,
        Stream {
            codec,
            complete: false,
            emitted: false,
            input_size,
            pending: Vec::new(),
            garbage: false,
            reject_garbage,
        },
    );
    Some(id)
}

fn native_error(code: usize) -> (i32, String) {
    (
        code.wrapping_neg() as i32,
        zstd_safe::get_error_name(code).to_string(),
    )
}

fn native_result(code: usize) -> Result<usize, (i32, String)> {
    // SAFETY: ZSTD_isError only inspects the numeric result.
    if unsafe { zstd_sys::ZSTD_isError(code) } != 0 {
        Err(native_error(code))
    } else {
        Ok(code)
    }
}

fn frame_prefix(bytes: &[u8]) -> bool {
    let length = bytes.len().min(4);
    bytes[..length] == [0x28, 0xb5, 0x2f, 0xfd][..length]
        || (0x50..=0x5f).any(|first| bytes[..length] == [first, 0x2a, 0x4d, 0x18][..length])
}

pub(super) fn push(
    id: u32,
    bytes: &[u8],
    flush: u8,
    capacity: usize,
) -> Result<(Vec<u8>, usize, bool), (i32, String)> {
    let mut streams = STREAMS.lock().unwrap();
    let stream = streams.get_mut(&id).ok_or_else(|| {
        (
            60,
            "Operation not authorized at current processing stage".to_string(),
        )
    })?;
    if let Codec::Compress(_, pledged) = stream.codec {
        if stream.complete && bytes.is_empty() {
            return Ok((Vec::new(), 0, true));
        }
        if let Some(input_size) = stream.input_size {
            // A single compressStream2(end) call infers the input size even when
            // the caller supplied a pledge. Validate only the active pledge.
            if flush == 2 && Some(input_size + bytes.len() as u64) != pledged {
                return Err((72, "Src size is incorrect".to_string()));
            }
        }
    }
    let prefix = std::mem::take(&mut stream.pending);
    let prefix_len = prefix.len();
    let data = if prefix.is_empty() {
        Cow::Borrowed(bytes)
    } else {
        let mut data = prefix;
        data.extend_from_slice(bytes);
        Cow::Owned(data)
    };
    let mut input = InBuffer::around(&data);
    if matches!(stream.codec, Codec::Decompress(_)) && stream.complete {
        if stream.garbage || (!data.is_empty() && !frame_prefix(&data)) {
            stream.garbage = true;
            if stream.reject_garbage {
                return Err((
                    -7,
                    "Trailing junk found after the end of the compressed stream".to_string(),
                ));
            }
            // Stop this write without counting discarded input as consumed.
            return Ok((Vec::new(), 0, true));
        }
        if data.len() < 4 {
            if flush == 2 && !data.is_empty() && stream.reject_garbage {
                return Err((
                    -7,
                    "Trailing junk found after the end of the compressed stream".to_string(),
                ));
            }
            stream.pending.extend_from_slice(&data);
            return Ok((Vec::new(), bytes.len(), true));
        }
    }
    // One call produces at most capacity bytes. The caller retains unconsumed
    // input and resumes only when the readable side has demand.
    let mut chunk = vec![0; capacity];
    let (remaining, written) = match &mut stream.codec {
        Codec::Compress(ctx, _) => {
            let directive = match flush {
                1 => zstd_sys::ZSTD_EndDirective::ZSTD_e_flush,
                2 => zstd_sys::ZSTD_EndDirective::ZSTD_e_end,
                _ => zstd_sys::ZSTD_EndDirective::ZSTD_e_continue,
            };
            let mut raw_input = zstd_sys::ZSTD_inBuffer {
                src: data.as_ptr().cast(),
                size: data.len(),
                pos: 0,
            };
            let mut output = zstd_sys::ZSTD_outBuffer {
                dst: chunk.as_mut_ptr().cast(),
                size: chunk.len(),
                pos: 0,
            };
            // SAFETY: Both buffers stay alive for this synchronous call,
            // and the exclusively owned context retains neither pointer.
            let remaining = native_result(unsafe {
                zstd_sys::ZSTD_compressStream2(ctx.as_ptr(), &mut output, &mut raw_input, directive)
            })?;
            input.pos = raw_input.pos;
            (remaining, output.pos)
        }
        Codec::Decompress(ctx) => {
            let mut output = OutBuffer::around(&mut chunk[..]);
            let remaining = ctx
                .decompress_stream(&mut output, &mut input)
                .map_err(native_error)?;
            (remaining, output.pos())
        }
    };
    let done = match stream.codec {
        Codec::Compress(_, _) => {
            if let Some(size) = &mut stream.input_size {
                *size += input.pos as u64;
            }
            stream.emitted |= written > 0;
            stream.complete = flush == 2 && remaining == 0;
            if stream.complete {
                stream.emitted = false;
                stream.input_size = None;
            }
            input.pos == data.len() && (flush == 0 || remaining == 0)
        }
        Codec::Decompress(_) => {
            stream.complete = remaining == 0;
            if input.pos == data.len() && written < capacity && flush == 2 && !stream.complete {
                return Err((-5, "unexpected end of file".to_string()));
            }
            input.pos == data.len() && (written < capacity || stream.complete)
        }
    };
    chunk.truncate(written);
    Ok((chunk, input.pos.saturating_sub(prefix_len), done))
}

pub(super) fn reset(id: u32) -> bool {
    let mut streams = STREAMS.lock().unwrap();
    let Some(stream) = streams.get_mut(&id) else {
        return false;
    };
    let result = match &mut stream.codec {
        Codec::Compress(ctx, pledged) => {
            if stream.emitted && !stream.complete {
                return false;
            }
            // SAFETY: Session reset and pledge update use the exclusively owned context.
            native_result(unsafe {
                zstd_sys::ZSTD_CCtx_reset(
                    ctx.as_ptr(),
                    zstd_sys::ZSTD_ResetDirective::ZSTD_reset_session_only,
                )
            })
            .and_then(|_| {
                native_result(unsafe {
                    zstd_sys::ZSTD_CCtx_setPledgedSrcSize(
                        ctx.as_ptr(),
                        pledged.unwrap_or(zstd_safe::CONTENTSIZE_UNKNOWN),
                    )
                })
            })
            .map_err(|_| ())
        }
        Codec::Decompress(ctx) => ctx.reset(ResetDirective::SessionOnly).map_err(|_| ()),
    };
    stream.complete = false;
    stream.emitted = false;
    stream.input_size = match stream.codec {
        Codec::Compress(_, pledged) => pledged.map(|_| 0),
        Codec::Decompress(_) => None,
    };
    stream.garbage = false;
    stream.pending.clear();
    result.is_ok()
}

pub(super) fn close(id: u32) -> bool {
    STREAMS.lock().unwrap().remove(&id).is_some()
}
