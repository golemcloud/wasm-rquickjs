use std::collections::HashMap;
use std::io::{Cursor, Read, Write};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{LazyLock, Mutex};

use flate2::{Compression, Decompress, FlushDecompress, Status};

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
    ZlibCompress {
        encoder: flate2::write::DeflateEncoder<Vec<u8>>,
        header_emitted: bool,
        level: Compression,
        adler: Adler32State,
    },
    RawCompress {
        encoder: flate2::write::DeflateEncoder<Vec<u8>>,
    },
    Decompress {
        inner: Decompress,
        zlib_header: bool,
    },
    GzipCompress {
        encoder: flate2::write::GzEncoder<Vec<u8>>,
        level: Compression,
    },
    GzipDecompress {
        inner: Decompress,
        header_buf: Vec<u8>,
        header_parsed: bool,
    },
}

struct Adler32State {
    a: u32,
    b: u32,
}

impl Adler32State {
    fn new() -> Self {
        Adler32State { a: 1, b: 0 }
    }

    fn update(&mut self, data: &[u8]) {
        for &byte in data {
            self.a = (self.a + byte as u32) % 65521;
            self.b = (self.b + self.a) % 65521;
        }
    }

    fn finish(&self) -> u32 {
        (self.b << 16) | self.a
    }
}

fn compute_zlib_header(level: Compression) -> [u8; 2] {
    // CMF: CM=8 (deflate), CINFO=7 (window 32768)
    let cmf: u8 = 0x78;
    // FLG: FLEVEL based on compression level, no dict
    let flevel = match level.level() {
        0 | 1 => 0,
        2..=5 => 1,
        6 => 2,
        _ => 3,
    };
    let mut flg: u8 = flevel << 6;
    // FCHECK: (CMF * 256 + FLG) must be divisible by 31
    let check = (cmf as u16 * 256 + flg as u16) % 31;
    if check != 0 {
        flg += (31 - check) as u8;
    }
    [cmf, flg]
}

/// Parse a gzip header and return the number of bytes consumed.
/// Returns None if there aren't enough bytes yet.
fn parse_gzip_header(buf: &[u8]) -> Option<usize> {
    if buf.len() < 10 {
        return None;
    }
    // Check magic number
    if buf[0] != 0x1f || buf[1] != 0x8b {
        return None;
    }
    // Check compression method (must be 8 = deflate)
    if buf[2] != 8 {
        return None;
    }
    let flags = buf[3];
    let mut pos = 10; // Past the fixed header

    // FEXTRA
    if flags & 0x04 != 0 {
        if buf.len() < pos + 2 {
            return None;
        }
        let extra_len = u16::from_le_bytes([buf[pos], buf[pos + 1]]) as usize;
        pos += 2 + extra_len;
        if buf.len() < pos {
            return None;
        }
    }
    // FNAME
    if flags & 0x08 != 0 {
        while pos < buf.len() && buf[pos] != 0 {
            pos += 1;
        }
        if pos >= buf.len() {
            return None;
        }
        pos += 1; // skip null terminator
    }
    // FCOMMENT
    if flags & 0x10 != 0 {
        while pos < buf.len() && buf[pos] != 0 {
            pos += 1;
        }
        if pos >= buf.len() {
            return None;
        }
        pos += 1; // skip null terminator
    }
    // FHCRC
    if flags & 0x02 != 0 {
        if buf.len() < pos + 2 {
            return None;
        }
        pos += 2;
    }
    Some(pos)
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
        // 0: deflate (zlib format) — uses raw DeflateEncoder + manual zlib header/checksum
        0 => ZlibStreamKind::ZlibCompress {
            encoder: flate2::write::DeflateEncoder::new(Vec::new(), compression),
            header_emitted: false,
            level: compression,
            adler: Adler32State::new(),
        },
        // 1: inflate (zlib format)
        1 => ZlibStreamKind::Decompress {
            inner: Decompress::new(true),
            zlib_header: true,
        },
        // 2: gzip compress — streaming with flush support
        2 => ZlibStreamKind::GzipCompress {
            encoder: flate2::write::GzEncoder::new(Vec::new(), compression),
            level: compression,
        },
        // 3: gzip decompress — streaming with incremental decompression
        3 => ZlibStreamKind::GzipDecompress {
            inner: Decompress::new(false), // raw deflate, we handle gzip header manually
            header_buf: Vec::new(),
            header_parsed: false,
        },
        // 4: deflate raw compress
        4 => ZlibStreamKind::RawCompress {
            encoder: flate2::write::DeflateEncoder::new(Vec::new(), compression),
        },
        // 5: deflate raw decompress
        5 => ZlibStreamKind::Decompress {
            inner: Decompress::new(false),
            zlib_header: false,
        },
        // 6: unzip (auto-detect gzip/zlib) — streaming decompression
        6 => ZlibStreamKind::GzipDecompress {
            inner: Decompress::new(false),
            header_buf: Vec::new(),
            header_parsed: false,
        },
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
        ZlibStreamKind::ZlibCompress {
            encoder,
            header_emitted,
            level,
            adler,
        } => {
            let mut result = Vec::new();
            // Emit zlib header on first push with data or flush
            if !*header_emitted && (!data.is_empty() || flush != 0) {
                result.extend_from_slice(&compute_zlib_header(*level));
                *header_emitted = true;
            }
            if !data.is_empty() {
                adler.update(data);
                encoder.write_all(data).ok()?;
            }
            if flush == 4 {
                // Z_FINISH: finalize deflate stream and append adler32
                encoder.try_finish().ok()?;
                result.extend_from_slice(encoder.get_ref());
                encoder.get_mut().clear();
                let checksum = adler.finish();
                result.extend_from_slice(&checksum.to_be_bytes());
            } else if flush == 2 || flush == 3 {
                encoder.flush().ok()?;
                result.extend_from_slice(encoder.get_ref());
                encoder.get_mut().clear();
            } else {
                // Z_NO_FLUSH: collect any output the encoder produced
                result.extend_from_slice(encoder.get_ref());
                encoder.get_mut().clear();
            }
            Some(result)
        }
        ZlibStreamKind::RawCompress { encoder } => {
            if !data.is_empty() {
                encoder.write_all(data).ok()?;
            }
            if flush == 4 {
                encoder.try_finish().ok()?;
            } else if flush == 2 || flush == 3 {
                encoder.flush().ok()?;
            }
            let result = encoder.get_ref().clone();
            encoder.get_mut().clear();
            Some(result)
        }
        ZlibStreamKind::Decompress { inner, .. } => {
            let mut output = vec![0u8; data.len() + 1024];
            let flush_mode = map_flush_decompress(flush);
            let total_out = decompress_loop(inner, data, &mut output, flush_mode)?;
            output.truncate(total_out);
            Some(output)
        }
        ZlibStreamKind::GzipCompress { encoder, .. } => {
            if !data.is_empty() {
                encoder.write_all(data).ok()?;
            }
            if flush == 4 {
                // Z_FINISH — finalize the gzip stream
                encoder.try_finish().ok()?;
            } else if flush == 2 || flush == 3 {
                // Z_SYNC_FLUSH / Z_FULL_FLUSH — flush buffered data
                encoder.flush().ok()?;
            }
            let result = encoder.get_ref().clone();
            encoder.get_mut().clear();
            Some(result)
        }
        ZlibStreamKind::GzipDecompress {
            inner,
            header_buf,
            header_parsed,
        } => {
            let payload = if *header_parsed {
                // Header already parsed, all data is deflate payload
                data
            } else {
                // Accumulate header bytes
                header_buf.extend_from_slice(data);
                if let Some(header_len) = parse_gzip_header(header_buf) {
                    *header_parsed = true;
                    let payload = header_buf[header_len..].to_vec();
                    header_buf.clear();
                    if payload.is_empty() {
                        return Some(Vec::new());
                    }
                    // Use a temporary to avoid borrow issues
                    let mut output = vec![0u8; payload.len() + 4096];
                    let flush_mode = map_flush_decompress(flush);
                    let total_out = decompress_loop(inner, &payload, &mut output, flush_mode)?;
                    output.truncate(total_out);
                    return Some(output);
                } else {
                    // Need more header bytes
                    return Some(Vec::new());
                }
            };
            if payload.is_empty() {
                return Some(Vec::new());
            }
            let mut output = vec![0u8; payload.len() + 4096];
            let flush_mode = map_flush_decompress(flush);
            let total_out = decompress_loop(inner, payload, &mut output, flush_mode)?;
            output.truncate(total_out);
            Some(output)
        }
    }
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

        let consumed = inner.total_in() as usize - before_in;
        let produced = inner.total_out() as usize - before_out;
        input_offset += consumed;
        total_out += produced;

        match status {
            Status::StreamEnd => break,
            Status::BufError => {
                if input_offset >= data.len() && produced == 0 {
                    break;
                }
                output.resize(output.len() * 2, 0);
            }
            Status::Ok => {
                if input_offset >= data.len() && produced == 0 {
                    // All input consumed and no output produced — done
                    break;
                }
                // If all input consumed but output was still produced,
                // the decompressor may have more buffered output — continue
            }
        }
    }

    Some(total_out)
}

fn zlib_stream_reset_impl(id: u32) -> bool {
    let mut streams = ZLIB_STREAMS.lock().unwrap();
    if let Some(stream) = streams.get_mut(&id) {
        match &mut stream.kind {
            ZlibStreamKind::ZlibCompress {
                encoder,
                header_emitted,
                adler,
                ..
            } => {
                let _ = encoder.reset(Vec::new());
                *header_emitted = false;
                *adler = Adler32State::new();
            }
            ZlibStreamKind::RawCompress { encoder } => {
                let _ = encoder.reset(Vec::new());
            }
            ZlibStreamKind::Decompress {
                inner, zlib_header, ..
            } => {
                *inner = Decompress::new(*zlib_header);
            }
            ZlibStreamKind::GzipCompress { encoder, level } => {
                *encoder = flate2::write::GzEncoder::new(Vec::new(), *level);
            }
            ZlibStreamKind::GzipDecompress {
                inner,
                header_buf,
                header_parsed,
            } => {
                *inner = Decompress::new(false);
                header_buf.clear();
                *header_parsed = false;
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
        compressor: Option<brotli::CompressorWriter<Vec<u8>>>,
        has_data: bool,
    },
    DecompressBuffering {
        buffer: Vec<u8>,
    },
    DecompressStreaming {
        decompressor: brotli::Decompressor<Cursor<Vec<u8>>>,
    },
}

static BROTLI_STREAMS: LazyLock<Mutex<HashMap<u32, BrotliStream>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn brotli_stream_new_impl(mode: u8, params_json: &str) -> Option<u32> {
    let kind = match mode {
        0 => {
            let quality = parse_brotli_quality(params_json);
            let lgwin = parse_brotli_lgwin(params_json);
            BrotliStreamKind::Compress {
                compressor: Some(brotli::CompressorWriter::new(
                    Vec::new(),
                    4096,
                    quality as u32,
                    lgwin as u32,
                )),
                has_data: false,
            }
        }
        1 => BrotliStreamKind::DecompressBuffering {
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
            compressor,
            has_data,
        } => {
            if flush == 2 {
                // BROTLI_OPERATION_FINISH: write remaining data and finalize
                if let Some(mut c) = compressor.take() {
                    if !data.is_empty() {
                        c.write_all(data).ok()?;
                    }
                    let output = c.into_inner();
                    Some(output)
                } else {
                    Some(Vec::new())
                }
            } else if let Some(c) = compressor {
                if !data.is_empty() {
                    *has_data = true;
                    c.write_all(data).ok()?;
                }
                if flush == 1 && *has_data {
                    // BROTLI_OPERATION_FLUSH — only flush when data has been written
                    c.flush().ok()?;
                }
                let output = c.get_mut().drain(..).collect();
                Some(output)
            } else {
                Some(Vec::new())
            }
        }
        BrotliStreamKind::DecompressBuffering { buffer } => {
            buffer.extend_from_slice(data);
            // flush == 2 means finish (BROTLI_OPERATION_FINISH)
            if flush == 2 {
                let input = std::mem::take(buffer);
                let mut decompressor = brotli::Decompressor::new(Cursor::new(input), 4096);
                let chunk_size = 16 * 1024;
                let mut chunk = vec![0u8; chunk_size];
                let n = decompressor.read(&mut chunk).ok()?;
                chunk.truncate(n);
                stream.kind = BrotliStreamKind::DecompressStreaming { decompressor };
                Some(chunk)
            } else {
                Some(Vec::new())
            }
        }
        BrotliStreamKind::DecompressStreaming { .. } => Some(Vec::new()),
    }
}

fn brotli_stream_pull_impl(id: u32, max_bytes: u32) -> Option<Vec<u8>> {
    let mut streams = BROTLI_STREAMS.lock().unwrap();
    let stream = streams.get_mut(&id)?;

    match &mut stream.kind {
        BrotliStreamKind::DecompressStreaming { decompressor } => {
            let mut chunk = vec![0u8; max_bytes as usize];
            let n = decompressor.read(&mut chunk).ok()?;
            chunk.truncate(n);
            Some(chunk)
        }
        _ => Some(Vec::new()),
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
    pub fn brotli_stream_pull(id: u32, max_bytes: u32) -> Option<Vec<u8>> {
        super::brotli_stream_pull_impl(id, max_bytes)
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
