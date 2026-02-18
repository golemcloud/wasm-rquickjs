use std::collections::HashMap;
use std::io::{Cursor, Read, Write};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{LazyLock, Mutex};

use flate2::{Compress, Compression, Decompress, FlushCompress, FlushDecompress, Status};

// ===== Handle ID generation =====

static NEXT_HANDLE: AtomicU32 = AtomicU32::new(1);

fn next_id() -> u32 {
    NEXT_HANDLE.fetch_add(1, Ordering::Relaxed)
}

// ===== Zlib one-shot impl =====

fn map_compression_level(level: i32) -> Compression {
    if level < 0 {
        Compression::default()
    } else {
        Compression::new(level.min(9) as u32)
    }
}

fn map_flush_compress(flush: i32) -> FlushCompress {
    match flush {
        0 => FlushCompress::None,
        1 => FlushCompress::Partial,
        2 => FlushCompress::Sync,
        3 => FlushCompress::Full,
        4 => FlushCompress::Finish,
        _ => FlushCompress::None,
    }
}

fn map_flush_decompress(flush: i32) -> FlushDecompress {
    match flush {
        2 => FlushDecompress::Sync,
        4 => FlushDecompress::Finish,
        _ => FlushDecompress::None,
    }
}

fn zlib_compress_sync_impl(
    data: &[u8],
    level: i32,
    window_bits: i32,
) -> Option<Vec<u8>> {
    let compression = map_compression_level(level);

    if window_bits >= 24 {
        // gzip format
        let mut encoder = flate2::write::GzEncoder::new(Vec::new(), compression);
        encoder.write_all(data).ok()?;
        encoder.finish().ok()
    } else if window_bits < 0 {
        // raw deflate
        let mut encoder = flate2::write::DeflateEncoder::new(Vec::new(), compression);
        encoder.write_all(data).ok()?;
        encoder.finish().ok()
    } else {
        // zlib format
        let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), compression);
        encoder.write_all(data).ok()?;
        encoder.finish().ok()
    }
}

fn zlib_decompress_sync_impl(
    data: &[u8],
    window_bits: i32,
) -> Option<Vec<u8>> {
    if window_bits >= 24 || window_bits == 0 {
        // gzip or auto-detect: try gzip first
        let mut decoder = flate2::read::GzDecoder::new(Cursor::new(data));
        let mut output = Vec::new();
        match decoder.read_to_end(&mut output) {
            Ok(_) => return Some(output),
            Err(_) if window_bits == 0 => {
                // auto-detect: fall through to try zlib
            }
            Err(_) => return None,
        }
        // Try zlib
        let mut decoder = flate2::read::ZlibDecoder::new(Cursor::new(data));
        let mut output = Vec::new();
        decoder.read_to_end(&mut output).ok()?;
        Some(output)
    } else if window_bits < 0 {
        // raw deflate
        let mut decoder = flate2::read::DeflateDecoder::new(Cursor::new(data));
        let mut output = Vec::new();
        decoder.read_to_end(&mut output).ok()?;
        Some(output)
    } else {
        // zlib format
        let mut decoder = flate2::read::ZlibDecoder::new(Cursor::new(data));
        let mut output = Vec::new();
        decoder.read_to_end(&mut output).ok()?;
        Some(output)
    }
}

// ===== Brotli one-shot impl =====

fn brotli_compress_sync_impl(data: &[u8], params_json: &str) -> Option<Vec<u8>> {
    let quality = parse_brotli_quality(params_json);
    let lgwin = parse_brotli_lgwin(params_json);

    let mut output = Vec::new();
    let mut reader = Cursor::new(data);
    let params = brotli::enc::BrotliEncoderParams {
        quality,
        lgwin,
        ..Default::default()
    };
    brotli::BrotliCompress(&mut reader, &mut output, &params).ok()?;
    Some(output)
}

fn brotli_decompress_sync_impl(data: &[u8]) -> Option<Vec<u8>> {
    let mut output = Vec::new();
    let mut reader = Cursor::new(data);
    brotli::BrotliDecompress(&mut reader, &mut output).ok()?;
    Some(output)
}

fn parse_brotli_quality(params_json: &str) -> i32 {
    if let Some(pos) = params_json.find("\"quality\"") {
        let rest = &params_json[pos + 9..];
        if let Some(colon) = rest.find(':') {
            let after_colon = rest[colon + 1..].trim_start();
            let num_str: String = after_colon
                .chars()
                .take_while(|c| c.is_ascii_digit() || *c == '-')
                .collect();
            if let Ok(v) = num_str.parse::<i32>() {
                return v;
            }
        }
    }
    11 // brotli default
}

fn parse_brotli_lgwin(params_json: &str) -> i32 {
    if let Some(pos) = params_json.find("\"lgwin\"") {
        let rest = &params_json[pos + 7..];
        if let Some(colon) = rest.find(':') {
            let after_colon = rest[colon + 1..].trim_start();
            let num_str: String = after_colon
                .chars()
                .take_while(|c| c.is_ascii_digit() || *c == '-')
                .collect();
            if let Ok(v) = num_str.parse::<i32>() {
                return v;
            }
        }
    }
    22 // brotli default
}

// ===== CRC32 impl =====

fn crc32_compute_impl(data: &[u8], initial: u32) -> u32 {
    let mut hasher = crc32fast::Hasher::new_with_initial(initial);
    hasher.update(data);
    hasher.finalize()
}

// ===== Zlib streaming =====

struct ZlibStream {
    kind: ZlibStreamKind,
    bytes_written: u32,
}

enum ZlibStreamKind {
    Compress {
        inner: Compress,
    },
    Decompress {
        inner: Decompress,
        zlib_header: bool,
    },
    GzipCompress {
        buffer: Vec<u8>,
        level: Compression,
    },
    GzipDecompress {
        buffer: Vec<u8>,
    },
}

static ZLIB_STREAMS: LazyLock<Mutex<HashMap<u32, ZlibStream>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn zlib_stream_new_impl(
    mode: u8,
    level: i32,
    _window_bits: i32,
    _mem_level: i32,
    _strategy: i32,
) -> Option<u32> {
    let compression = map_compression_level(level);

    let kind = match mode {
        // 0: deflate (zlib format)
        0 => ZlibStreamKind::Compress {
            inner: Compress::new(compression, true),
        },
        // 1: inflate (zlib format)
        1 => ZlibStreamKind::Decompress {
            inner: Decompress::new(true),
            zlib_header: true,
        },
        // 2: gzip compress — buffer and compress on finish
        2 => ZlibStreamKind::GzipCompress {
            buffer: Vec::new(),
            level: compression,
        },
        // 3: gzip decompress — buffer and decompress on finish
        3 => ZlibStreamKind::GzipDecompress { buffer: Vec::new() },
        // 4: deflate raw compress
        4 => ZlibStreamKind::Compress {
            inner: Compress::new(compression, false),
        },
        // 5: deflate raw decompress
        5 => ZlibStreamKind::Decompress {
            inner: Decompress::new(false),
            zlib_header: false,
        },
        // 6: unzip (auto-detect gzip/zlib) — buffer and decompress on finish
        6 => ZlibStreamKind::GzipDecompress { buffer: Vec::new() },
        _ => return None,
    };

    let id = next_id();
    ZLIB_STREAMS.lock().unwrap().insert(
        id,
        ZlibStream {
            kind,
            bytes_written: 0,
        },
    );
    Some(id)
}

fn zlib_stream_push_impl(id: u32, data: &[u8], flush: i32) -> Option<Vec<u8>> {
    let mut streams = ZLIB_STREAMS.lock().unwrap();
    let stream = streams.get_mut(&id)?;

    stream.bytes_written += data.len() as u32;

    match &mut stream.kind {
        ZlibStreamKind::Compress { inner } => {
            let mut output = vec![0u8; data.len() + 1024];
            let flush_mode = map_flush_compress(flush);
            let total_out = compress_loop(inner, data, &mut output, flush_mode)?;
            output.truncate(total_out);
            Some(output)
        }
        ZlibStreamKind::Decompress { inner, .. } => {
            let mut output = vec![0u8; data.len() + 1024];
            let flush_mode = map_flush_decompress(flush);
            let total_out = decompress_loop(inner, data, &mut output, flush_mode)?;
            output.truncate(total_out);
            Some(output)
        }
        ZlibStreamKind::GzipCompress { buffer, level } => {
            buffer.extend_from_slice(data);
            if flush == 4 {
                // Z_FINISH — compress everything
                let mut encoder = flate2::write::GzEncoder::new(Vec::new(), *level);
                encoder.write_all(buffer).ok()?;
                let result = encoder.finish().ok()?;
                buffer.clear();
                Some(result)
            } else {
                Some(Vec::new())
            }
        }
        ZlibStreamKind::GzipDecompress { buffer } => {
            buffer.extend_from_slice(data);
            if flush == 4 {
                // Z_FINISH — decompress everything, auto-detecting format
                let result = zlib_decompress_sync_impl(buffer, 0)?;
                buffer.clear();
                Some(result)
            } else {
                Some(Vec::new())
            }
        }
    }
}

fn compress_loop(
    inner: &mut Compress,
    data: &[u8],
    output: &mut Vec<u8>,
    flush_mode: FlushCompress,
) -> Option<usize> {
    let mut total_out = 0;
    let mut input_offset = 0;

    loop {
        if total_out >= output.len().saturating_sub(256) {
            output.resize(output.len() * 2, 0);
        }

        let before_in = inner.total_in() as usize;
        let before_out = inner.total_out() as usize;

        let status = inner
            .compress(&data[input_offset..], &mut output[total_out..], flush_mode)
            .ok()?;

        input_offset += inner.total_in() as usize - before_in;
        total_out += inner.total_out() as usize - before_out;

        match status {
            Status::StreamEnd => break,
            Status::BufError => {
                if input_offset >= data.len()
                    && matches!(flush_mode, FlushCompress::None | FlushCompress::Partial)
                {
                    break;
                }
                output.resize(output.len() * 2, 0);
            }
            Status::Ok => {
                if input_offset >= data.len() && matches!(flush_mode, FlushCompress::None) {
                    break;
                }
            }
        }
    }

    Some(total_out)
}

fn decompress_loop(
    inner: &mut Decompress,
    data: &[u8],
    output: &mut Vec<u8>,
    flush_mode: FlushDecompress,
) -> Option<usize> {
    let mut total_out = 0;
    let mut input_offset = 0;

    loop {
        if total_out >= output.len().saturating_sub(256) {
            output.resize(output.len() * 2, 0);
        }

        let before_in = inner.total_in() as usize;
        let before_out = inner.total_out() as usize;

        let status = inner
            .decompress(&data[input_offset..], &mut output[total_out..], flush_mode)
            .ok()?;

        input_offset += inner.total_in() as usize - before_in;
        total_out += inner.total_out() as usize - before_out;

        match status {
            Status::StreamEnd => break,
            Status::BufError => {
                if input_offset >= data.len() {
                    break;
                }
                output.resize(output.len() * 2, 0);
            }
            Status::Ok => {
                if input_offset >= data.len() && matches!(flush_mode, FlushDecompress::None) {
                    break;
                }
            }
        }
    }

    Some(total_out)
}

fn zlib_stream_reset_impl(id: u32) -> bool {
    let mut streams = ZLIB_STREAMS.lock().unwrap();
    if let Some(stream) = streams.get_mut(&id) {
        match &mut stream.kind {
            ZlibStreamKind::Compress { inner } => {
                inner.reset();
            }
            ZlibStreamKind::Decompress {
                inner, zlib_header, ..
            } => {
                *inner = Decompress::new(*zlib_header);
            }
            ZlibStreamKind::GzipCompress { buffer, .. } => {
                buffer.clear();
            }
            ZlibStreamKind::GzipDecompress { buffer } => {
                buffer.clear();
            }
        }
        stream.bytes_written = 0;
        true
    } else {
        false
    }
}

fn zlib_stream_close_impl(id: u32) -> bool {
    ZLIB_STREAMS.lock().unwrap().remove(&id).is_some()
}

fn zlib_stream_bytes_written_impl(id: u32) -> u32 {
    ZLIB_STREAMS
        .lock()
        .unwrap()
        .get(&id)
        .map(|s| s.bytes_written)
        .unwrap_or(0)
}

// ===== Brotli streaming =====
// Brotli streaming buffers all data and compresses/decompresses on finish.

struct BrotliStream {
    kind: BrotliStreamKind,
    bytes_written: u32,
}

enum BrotliStreamKind {
    Compress {
        buffer: Vec<u8>,
        quality: i32,
        lgwin: i32,
    },
    Decompress {
        buffer: Vec<u8>,
    },
}

static BROTLI_STREAMS: LazyLock<Mutex<HashMap<u32, BrotliStream>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn brotli_stream_new_impl(mode: u8, params_json: &str) -> Option<u32> {
    let kind = match mode {
        0 => BrotliStreamKind::Compress {
            buffer: Vec::new(),
            quality: parse_brotli_quality(params_json),
            lgwin: parse_brotli_lgwin(params_json),
        },
        1 => BrotliStreamKind::Decompress {
            buffer: Vec::new(),
        },
        _ => return None,
    };

    let id = next_id();
    BROTLI_STREAMS.lock().unwrap().insert(
        id,
        BrotliStream {
            kind,
            bytes_written: 0,
        },
    );
    Some(id)
}

fn brotli_stream_push_impl(id: u32, data: &[u8], flush: u8) -> Option<Vec<u8>> {
    let mut streams = BROTLI_STREAMS.lock().unwrap();
    let stream = streams.get_mut(&id)?;

    stream.bytes_written += data.len() as u32;

    match &mut stream.kind {
        BrotliStreamKind::Compress {
            buffer,
            quality,
            lgwin,
        } => {
            buffer.extend_from_slice(data);
            // flush == 2 means finish (BROTLI_OPERATION_FINISH)
            if flush == 2 {
                let params = brotli::enc::BrotliEncoderParams {
                    quality: *quality,
                    lgwin: *lgwin,
                    ..Default::default()
                };
                let mut output = Vec::new();
                let mut reader = Cursor::new(&buffer[..]);
                brotli::BrotliCompress(&mut reader, &mut output, &params).ok()?;
                buffer.clear();
                Some(output)
            } else {
                Some(Vec::new())
            }
        }
        BrotliStreamKind::Decompress { buffer } => {
            buffer.extend_from_slice(data);
            // flush == 2 means finish (BROTLI_OPERATION_FINISH)
            if flush == 2 {
                let mut output = Vec::new();
                let mut reader = Cursor::new(&buffer[..]);
                brotli::BrotliDecompress(&mut reader, &mut output).ok()?;
                buffer.clear();
                Some(output)
            } else {
                Some(Vec::new())
            }
        }
    }
}

fn brotli_stream_close_impl(id: u32) -> bool {
    BROTLI_STREAMS.lock().unwrap().remove(&id).is_some()
}

fn brotli_stream_bytes_written_impl(id: u32) -> u32 {
    BROTLI_STREAMS
        .lock()
        .unwrap()
        .get(&id)
        .map(|s| s.bytes_written)
        .unwrap_or(0)
}

// ===== Native module =====

#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::TypedArray;

    // ===== One-shot functions =====

    #[rquickjs::function]
    pub fn zlib_compress_sync(
        data: TypedArray<'_, u8>,
        level: i32,
        window_bits: i32,
    ) -> Option<Vec<u8>> {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to zlibCompressSync is detached");
        super::zlib_compress_sync_impl(input, level, window_bits)
    }

    #[rquickjs::function]
    pub fn zlib_decompress_sync(
        data: TypedArray<'_, u8>,
        window_bits: i32,
    ) -> Option<Vec<u8>> {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to zlibDecompressSync is detached");
        super::zlib_decompress_sync_impl(input, window_bits)
    }

    #[rquickjs::function]
    pub fn brotli_compress_sync(
        data: TypedArray<'_, u8>,
        params_json: String,
    ) -> Option<Vec<u8>> {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to brotliCompressSync is detached");
        super::brotli_compress_sync_impl(input, &params_json)
    }

    #[rquickjs::function]
    pub fn brotli_decompress_sync(data: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to brotliDecompressSync is detached");
        super::brotli_decompress_sync_impl(input)
    }

    #[rquickjs::function]
    pub fn crc32_compute(data: TypedArray<'_, u8>, initial: u32) -> u32 {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to crc32Compute is detached");
        super::crc32_compute_impl(input, initial)
    }

    // ===== Zlib streaming functions =====

    #[rquickjs::function]
    pub fn zlib_stream_new(
        mode: u8,
        level: i32,
        window_bits: i32,
        mem_level: i32,
        strategy: i32,
    ) -> Option<u32> {
        super::zlib_stream_new_impl(mode, level, window_bits, mem_level, strategy)
    }

    #[rquickjs::function]
    pub fn zlib_stream_push(id: u32, data: TypedArray<'_, u8>, flush: i32) -> Option<Vec<u8>> {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to zlibStreamPush is detached");
        super::zlib_stream_push_impl(id, input, flush)
    }

    #[rquickjs::function]
    pub fn zlib_stream_reset(id: u32) -> bool {
        super::zlib_stream_reset_impl(id)
    }

    #[rquickjs::function]
    pub fn zlib_stream_close(id: u32) -> bool {
        super::zlib_stream_close_impl(id)
    }

    #[rquickjs::function]
    pub fn zlib_stream_bytes_written(id: u32) -> u32 {
        super::zlib_stream_bytes_written_impl(id)
    }

    // ===== Brotli streaming functions =====

    #[rquickjs::function]
    pub fn brotli_stream_new(mode: u8, params_json: String) -> Option<u32> {
        super::brotli_stream_new_impl(mode, &params_json)
    }

    #[rquickjs::function]
    pub fn brotli_stream_push(id: u32, data: TypedArray<'_, u8>, flush: u8) -> Option<Vec<u8>> {
        let input = data
            .as_bytes()
            .expect("the Uint8Array passed to brotliStreamPush is detached");
        super::brotli_stream_push_impl(id, input, flush)
    }

    #[rquickjs::function]
    pub fn brotli_stream_close(id: u32) -> bool {
        super::brotli_stream_close_impl(id)
    }

    #[rquickjs::function]
    pub fn brotli_stream_bytes_written(id: u32) -> u32 {
        super::brotli_stream_bytes_written_impl(id)
    }
}

pub const ZLIB_JS: &str = include_str!("zlib.js");

pub const REEXPORT_JS: &str = r#"export * from 'node:zlib'; export { default } from 'node:zlib';"#;
