//! Stateful zstd backend. Every handle owns its own codec context.

use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use zstd_safe::{
    CCtx, CParameter, DCtx, DParameter, InBuffer, OutBuffer, ResetDirective, Strategy,
};

enum Codec {
    Compress(CCtx<'static>, Option<u64>),
    Decompress(DCtx<'static>),
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

fn compression_parameter(key: u32, value: i32) -> Option<CParameter> {
    Some(match key {
        100 => CParameter::CompressionLevel(value),
        101 => CParameter::WindowLog(value as u32),
        102 => CParameter::HashLog(value as u32),
        103 => CParameter::ChainLog(value as u32),
        104 => CParameter::SearchLog(value as u32),
        105 => CParameter::MinMatch(value as u32),
        106 => CParameter::TargetLength(value as u32),
        107 => CParameter::Strategy(match value {
            1 => Strategy::ZSTD_fast,
            2 => Strategy::ZSTD_dfast,
            3 => Strategy::ZSTD_greedy,
            4 => Strategy::ZSTD_lazy,
            5 => Strategy::ZSTD_lazy2,
            6 => Strategy::ZSTD_btlazy2,
            7 => Strategy::ZSTD_btopt,
            8 => Strategy::ZSTD_btultra,
            9 => Strategy::ZSTD_btultra2,
            _ => return None,
        }),
        160 => CParameter::EnableLongDistanceMatching(value != 0),
        161 => CParameter::LdmHashLog(value as u32),
        162 => CParameter::LdmMinMatch(value as u32),
        163 => CParameter::LdmBucketSizeLog(value as u32),
        164 => CParameter::LdmHashRateLog(value as u32),
        200 => CParameter::ContentSizeFlag(value != 0),
        201 => CParameter::ChecksumFlag(value != 0),
        202 => CParameter::DictIdFlag(value != 0),
        400 => CParameter::NbWorkers(value as u32),
        401 => CParameter::JobSize(value as u32),
        402 => CParameter::OverlapSizeLog(value as u32),
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
        let mut ctx = CCtx::create();
        ctx.load_dictionary(dictionary).ok()?;
        for (key, value) in params {
            if key == 107 && value == 0 {
                continue;
            }
            ctx.set_parameter(compression_parameter(key, value)?).ok()?;
        }
        let pledged = pledged.map(|v| v as u64);
        ctx.set_pledged_src_size(pledged).ok()?;
        Codec::Compress(ctx, pledged)
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

fn frame_prefix(bytes: &[u8]) -> bool {
    let length = bytes.len().min(4);
    bytes[..length] == [0x28, 0xb5, 0x2f, 0xfd][..length]
        || (0x50..=0x5f).any(|first| bytes[..length] == [first, 0x2a, 0x4d, 0x18][..length])
}

pub(super) fn push(
    id: u32,
    bytes: &[u8],
    flush: u8,
    limit: usize,
) -> Result<Vec<u8>, (i32, String)> {
    let mut streams = STREAMS.lock().unwrap();
    let stream = streams.get_mut(&id).ok_or_else(|| {
        (
            60,
            "Operation not authorized at current processing stage".to_string(),
        )
    })?;
    if let Codec::Compress(_, pledged) = stream.codec {
        if stream.complete && bytes.is_empty() {
            return Ok(Vec::new());
        }
        if let Some(input_size) = &mut stream.input_size {
            *input_size += bytes.len() as u64;
            // A single compressStream2(end) call infers the input size even when
            // the caller supplied a pledge. Validate only the active pledge.
            if flush == 2 && Some(*input_size) != pledged {
                return Err((72, "Src size is incorrect".to_string()));
            }
        }
    }
    let mut data = std::mem::take(&mut stream.pending);
    data.extend_from_slice(bytes);
    let mut input = InBuffer::around(&data);
    let mut result = Vec::new();
    loop {
        if matches!(stream.codec, Codec::Decompress(_)) && stream.complete {
            let remaining = &data[input.pos..];
            if stream.garbage || (!remaining.is_empty() && !frame_prefix(remaining)) {
                stream.garbage = true;
                if stream.reject_garbage {
                    return Err((
                        -7,
                        "Trailing junk found after the end of the compressed stream".to_string(),
                    ));
                }
                break;
            }
            if remaining.len() < 4 {
                if flush == 2 && !remaining.is_empty() && stream.reject_garbage {
                    return Err((
                        -7,
                        "Trailing junk found after the end of the compressed stream".to_string(),
                    ));
                }
                stream.pending.extend_from_slice(remaining);
                break;
            }
        }
        let before = input.pos;
        let mut chunk = vec![0; 16_384.min(limit.saturating_sub(result.len()).saturating_add(1))];
        let mut output = OutBuffer::around(&mut chunk[..]);
        let remaining = match &mut stream.codec {
            Codec::Compress(ctx, _) => {
                let directive = match flush {
                    1 => zstd_safe::zstd_sys::ZSTD_EndDirective::ZSTD_e_flush,
                    2 => zstd_safe::zstd_sys::ZSTD_EndDirective::ZSTD_e_end,
                    _ => zstd_safe::zstd_sys::ZSTD_EndDirective::ZSTD_e_continue,
                };
                ctx.compress_stream2(&mut output, &mut input, directive)
            }
            Codec::Decompress(ctx) => ctx.decompress_stream(&mut output, &mut input),
        }
        .map_err(native_error)?;
        let written = output.pos();
        result.extend_from_slice(&chunk[..written]);
        if result.len() > limit {
            return Err((-6, "output exceeds maxOutputLength".to_string()));
        }
        match stream.codec {
            Codec::Compress(_, _) => {
                stream.emitted |= written > 0;
                stream.complete = flush == 2 && remaining == 0;
                if stream.complete {
                    stream.emitted = false;
                    stream.input_size = None;
                }
                if input.pos == data.len() && (flush == 0 || remaining == 0) {
                    break;
                }
            }
            Codec::Decompress(_) => {
                stream.complete = remaining == 0;
                if input.pos == data.len() && written < chunk.len() {
                    if flush == 2 && !stream.complete {
                        return Err((-5, "unexpected end of file".to_string()));
                    }
                    break;
                }
            }
        }
        if input.pos == before && written == 0 {
            break;
        }
    }
    Ok(result)
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
            ctx.reset(ResetDirective::SessionOnly)
                .and_then(|_| ctx.set_pledged_src_size(*pledged))
        }
        Codec::Decompress(ctx) => ctx.reset(ResetDirective::SessionOnly),
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
