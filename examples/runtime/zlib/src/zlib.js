import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import * as zlib from 'node:zlib';
import {
  brotliCompressSync,
  brotliDecompressSync,
  createBrotliCompress,
  createBrotliDecompress,
  createGzip,
  createGunzip,
  crc32,
  constants,
  deflateRawSync,
  deflateSync,
  gzipSync,
  gunzipSync,
  inflateRawSync,
  inflateSync,
  unzipSync,
} from 'node:zlib';

async function streamRoundTrip(source, compress, decompress, expectedPrototype) {
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    compress.on('error', reject);
    decompress.on('error', reject);
    decompress.on('data', chunk => {
      if (expectedPrototype === undefined) {
        if (!Buffer.isBuffer(chunk)) reject(new Error('stream output is not a Buffer'));
      } else if (Object.getPrototypeOf(chunk) !== expectedPrototype || typeof chunk.equals !== 'function') {
        reject(new Error('stream output lost its original Buffer prototype'));
      }
      chunks.push(chunk);
    });
    decompress.on('end', resolve);
  });
  compress.pipe(decompress);
  for (let offset = 0; offset < source.length; offset += 7777) {
    compress.write(source.subarray(offset, offset + 7777));
  }
  compress.end();
  await done;
  if (!Buffer.concat(chunks).equals(source)) throw new Error('stream byte transfer');
}

function detachedBuffer(bytes) {
  const arrayBuffer = new ArrayBuffer(bytes.length);
  const buffer = Buffer.from(arrayBuffer);
  buffer.set(bytes);
  structuredClone(arrayBuffer, { transfer: [arrayBuffer] });
  return buffer;
}

function detachedUint8Array(bytes) {
  const arrayBuffer = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(bytes);
  structuredClone(arrayBuffer, { transfer: [arrayBuffer] });
  return view;
}

function detachedDataView(bytes) {
  const arrayBuffer = new ArrayBuffer(bytes.length);
  const view = new DataView(arrayBuffer);
  new Uint8Array(arrayBuffer).set(bytes);
  structuredClone(arrayBuffer, { transfer: [arrayBuffer] });
  return view;
}

function expectZBufError(operation, label) {
  let error;
  try {
    operation();
  } catch (caught) {
    error = caught;
  }
  if (error?.code !== 'Z_BUF_ERROR' || error.errno !== -5 ||
      error.message !== 'unexpected end of file') {
    throw new Error(`${label} did not report Z_BUF_ERROR`);
  }
}

function expectZDataError(operation, label, message = 'incorrect header check') {
  let error;
  try {
    operation();
  } catch (caught) {
    error = caught;
  }
  if (error?.code !== 'Z_DATA_ERROR' || error.errno !== -3 ||
      error.message !== message) {
    throw new Error(
      `${label} did not report Z_DATA_ERROR: ` +
      `${error?.code}/${error?.errno}/${error?.message}`,
    );
  }
}

function expectBrotliDecodeError(
  operation,
  label,
  code = 'ERR__ERROR_FORMAT_PADDING_2',
  errno = -15,
) {
  let error;
  try {
    operation();
  } catch (caught) {
    error = caught;
  }
  if (error?.code !== code || error.errno !== errno ||
      error.message !== 'Decompression failed') {
    throw new Error(
      `${label} did not report the Brotli decoder error: ` +
      `${error?.code}/${error?.errno}/${error?.message}`,
    );
  }
}

export async function testByteTransfer() {
  const source = Buffer.alloc(131103);
  for (let i = 0; i < source.length; i++) source[i] = i % 251;
  for (const [compress, decompress] of [
    [gzipSync, gunzipSync],
    [gzipSync, unzipSync],
    [deflateSync, inflateSync],
    [deflateSync, unzipSync],
    [deflateRawSync, inflateRawSync],
    [brotliCompressSync, brotliDecompressSync],
  ]) {
    for (const input of [Buffer.alloc(0), source.subarray(5, source.length - 7)]) {
      const compressed = compress(input);
      const output = decompress(compressed);
      if (!Buffer.isBuffer(compressed) || !Buffer.isBuffer(output) || !output.equals(input)) throw new Error('sync byte transfer');
      const independent = decompress(compressed);
      if (output.length) {
        output[0] ^= 0xff;
        if (output[0] === independent[0]) throw new Error('aliased output');
      }
    }
  }
  await streamRoundTrip(source, createGzip({ chunkSize: 1024 }), createGunzip({ chunkSize: 1024 }));
  await streamRoundTrip(source, createBrotliCompress(), createBrotliDecompress());

  const byteLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength');
  Object.defineProperty(ArrayBuffer.prototype, 'byteLength', {
    configurable: true,
    get() { throw new Error('public ArrayBuffer byteLength getter was called'); },
  });
  try {
    const compressed = gzipSync(source);
    const output = gunzipSync(compressed);
    if (!Buffer.isBuffer(compressed) || !Buffer.isBuffer(output) || !output.equals(source)) {
      throw new Error('poisoned byteLength transfer');
    }
  } finally {
    Object.defineProperty(ArrayBuffer.prototype, 'byteLength', byteLength);
  }

  const empty = Buffer.alloc(0);
  const detached = detachedBuffer([1, 2, 3]);
  if (!gzipSync(detached).equals(gzipSync(empty))) throw new Error('detached gzip input');
  if (!brotliCompressSync(detached).equals(brotliCompressSync(empty))) {
    throw new Error('detached brotli input');
  }
  if (crc32(detached) !== crc32(empty)) throw new Error('detached crc32 input');
  for (const decompress of [gunzipSync, brotliDecompressSync]) {
    expectZBufError(() => decompress(detached), 'detached Buffer decompression');
  }

  const detachedTypedArray = detachedUint8Array([1, 2, 3]);
  if (!gzipSync(detachedTypedArray).equals(gzipSync(empty))) {
    throw new Error('detached Uint8Array gzip input');
  }
  if (!brotliCompressSync(detachedTypedArray).equals(brotliCompressSync(empty))) {
    throw new Error('detached Uint8Array brotli input');
  }
  if (crc32(detachedTypedArray) !== crc32(empty)) {
    throw new Error('detached Uint8Array crc32 input');
  }
  for (const decompress of [gunzipSync, brotliDecompressSync]) {
    expectZBufError(() => decompress(detachedTypedArray), 'detached Uint8Array decompression');
  }

  const detachedView = detachedDataView([1, 2, 3]);
  for (const transform of [gzipSync, gunzipSync, brotliCompressSync, brotliDecompressSync]) {
    let error;
    try {
      transform(detachedView);
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof TypeError)) throw new Error('detached DataView zlib input');
  }
  if (crc32(detachedView) !== crc32(empty)) throw new Error('detached DataView crc32 input');

  for (const [compress, decompress] of [
    [gzipSync, gunzipSync],
    [deflateSync, inflateSync],
    [deflateRawSync, inflateRawSync],
    [brotliCompressSync, brotliDecompressSync],
  ]) {
    const compressed = compress(Buffer.from('truncated input'));
    expectZBufError(
      () => decompress(compressed.subarray(0, compressed.length - 1)),
      'truncated decompression',
    );
  }

  const partialSource = Buffer.from('permissive truncated input '.repeat(8));
  for (const [compress, decompress, finishFlush] of [
    [gzipSync, gunzipSync, constants.Z_SYNC_FLUSH],
    [gzipSync, unzipSync, constants.Z_SYNC_FLUSH],
    [deflateSync, inflateSync, constants.Z_SYNC_FLUSH],
    [deflateSync, unzipSync, constants.Z_SYNC_FLUSH],
    [deflateRawSync, inflateRawSync, constants.Z_SYNC_FLUSH],
    [brotliCompressSync, brotliDecompressSync, constants.BROTLI_OPERATION_FLUSH],
  ]) {
    const compressed = compress(partialSource);
    const output = decompress(compressed.subarray(0, compressed.length - 1), { finishFlush });
    if (!Buffer.isBuffer(output) || output.length === 0 ||
        !output.equals(partialSource.subarray(0, output.length))) {
      throw new Error('permissive truncated decompression');
    }
  }

  const corruptBrotliCases = [
    [Buffer.from([0xff]), 'ERR__ERROR_FORMAT_PADDING_2', -15],
    [
      Buffer.from(
        '21fc7fc02f11168f0502b91700317e85df18e9662ed2c9911ee84adf0bb282aa' +
        'c2de6022070ecd83ec88f2e6219d8336d2e4802165be21daed9db82780f2070d02',
        'hex',
      ),
      'ERR__ERROR_FORMAT_SIMPLE_HUFFMAN_SAME',
      -5,
    ],
    [Buffer.from([0x6c, 0x98, 0x60, 0]), 'ERR__ERROR_FORMAT_EXUBERANT_META_NIBBLE', -3],
  ];
  for (const options of [undefined, { finishFlush: constants.BROTLI_OPERATION_FLUSH }]) {
    for (const [input, code, errno] of corruptBrotliCases) {
      expectBrotliDecodeError(
        () => brotliDecompressSync(input, options),
        'corrupt Brotli decompression',
        code,
        errno,
      );
    }
  }

  const originalStartsWith = String.prototype.startsWith;
  try {
    String.prototype.startsWith = () => { throw new Error('mutable String.prototype.startsWith called'); };
    for (const [input, code, errno] of [corruptBrotliCases[1], corruptBrotliCases[2]]) {
      expectBrotliDecodeError(
        () => brotliDecompressSync(input),
        'poisoned startsWith Brotli decompression',
        code,
        errno,
      );
    }
  } finally {
    String.prototype.startsWith = originalStartsWith;
  }

  // Its 10-bit window forces 8 KiB of the first meta-block through the native
  // 4 KiB output chunk before the corrupt second meta-block fails. No partial
  // output may escape as a successful result.
  const lateCorruptBrotli = Buffer.from(
    '21fc7fc02f11168f0502b91700357e85df48e9662ed2c9911ee84adf0bb282aa' +
    'c2de6022070ecd83ec88f2e6219d8336d2e4802165be21daed9db82780f2070d02',
    'hex',
  );
  expectBrotliDecodeError(
    () => brotliDecompressSync(lateCorruptBrotli),
    'late corrupt Brotli decompression',
    'ERR__ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET',
    -4,
  );

  const gzipWithSuffix = gzipSync(partialSource);
  for (const [decompress, label, invalidMagicMessage] of [
    [gunzipSync, 'gunzip', 'incorrect header check'],
    [unzipSync, 'unzip', 'unknown compression method'],
  ]) {
    for (const suffix of [Buffer.from([0]), Buffer.from([0, 1])]) {
      const output = decompress(Buffer.concat([gzipWithSuffix, suffix]));
      if (!output.equals(partialSource)) {
        throw new Error(`${label} rejected zero-prefixed gzip padding`);
      }
    }
    const incompleteMemberSuffixes = [
      Buffer.from([1]),
      Buffer.from([0x1f]),
      Buffer.from([0x1f, 0x8b]),
      Buffer.from([0x1f, 0x8b, 0]),
    ];
    for (const suffix of incompleteMemberSuffixes) {
      expectZBufError(
        () => decompress(Buffer.concat([gzipWithSuffix, suffix])),
        `${label} incomplete next gzip member`,
      );
    }
    expectZDataError(
      () => decompress(Buffer.concat([gzipWithSuffix, Buffer.from([1, 2])])),
      `${label} non-padding gzip suffix`,
    );
    expectZDataError(
      () => decompress(Buffer.concat([gzipWithSuffix, Buffer.from([0x1f, 0])])),
      `${label} invalid next gzip magic`,
      invalidMagicMessage,
    );
    for (const [suffix, expectedMessage] of [
      [Buffer.from([0x1f, 0x01]), 'incorrect header check'],
      [Buffer.from([0x1f, 0x1f]), invalidMagicMessage],
    ]) {
      expectZDataError(
        () => decompress(suffix),
        `${label} invalid initial gzip or zlib header`,
        expectedMessage,
      );
      expectZDataError(
        () => decompress(Buffer.concat([gzipWithSuffix, suffix])),
        `${label} invalid next gzip or zlib header`,
        expectedMessage,
      );
    }
    expectZDataError(
      () => decompress(Buffer.concat([gzipWithSuffix, Buffer.from([0x1f, 0x8b, 0, 0])])),
      `${label} invalid next gzip method`,
      'unknown compression method',
    );
    expectZDataError(
      () => decompress(Buffer.concat([gzipWithSuffix, Buffer.from([0x1f, 0x8b, 8, 0x20])])),
      `${label} invalid next gzip flags`,
      'unknown header flags set',
    );

    const blockOutput = decompress(
      Buffer.concat([gzipWithSuffix, Buffer.from([1, 2])]),
      { finishFlush: constants.Z_BLOCK },
    );
    if (blockOutput.length !== 0) {
      throw new Error(`${label} Z_BLOCK produced gzip payload bytes`);
    }
    expectZDataError(
      () => decompress(Buffer.from([0x1f, 0x8b, 0, 0]), {
        finishFlush: constants.Z_BLOCK,
      }),
      `${label} Z_BLOCK invalid gzip method`,
      'unknown compression method',
    );
  }

  const OriginalError = globalThis.Error;
  try {
    globalThis.Error = function PoisonedError() { throw new OriginalError('mutable global Error called'); };
    expectZBufError(() => gunzipSync(empty), 'poisoned Error constructor');
  } finally {
    globalThis.Error = OriginalError;
  }

  const originalIsView = ArrayBuffer.isView;
  try {
    ArrayBuffer.isView = () => false;
    if (!gzipSync(new Uint8Array([1, 2, 3])).equals(gzipSync(Buffer.from([1, 2, 3])))) {
      throw new Error('mutable ArrayBuffer.isView');
    }
  } finally {
    ArrayBuffer.isView = originalIsView;
  }

  const gzip = createGzip();
  try {
    let error;
    try {
      gzip.write(detachedUint8Array([1, 2, 3]));
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof TypeError)) throw new Error('detached stream input did not throw TypeError');
  } finally {
    gzip.destroy();
  }

  const bufferPrototype = Buffer.prototype;
  const objectSetPrototypeOf = Object.setPrototypeOf;
  Buffer.prototype = {};
  Object.setPrototypeOf = () => { throw new Error('public Object.setPrototypeOf was called'); };
  try {
    const compressed = gzipSync(source);
    const output = gunzipSync(compressed);
    if (Object.getPrototypeOf(compressed) !== bufferPrototype ||
        Object.getPrototypeOf(output) !== bufferPrototype ||
        typeof compressed.equals !== 'function' || typeof output.equals !== 'function' ||
        !output.equals(source)) {
      throw new Error('zlib output used mutable Buffer.prototype');
    }
    await streamRoundTrip(source, createGzip(), createGunzip(), bufferPrototype);
  } finally {
    Object.setPrototypeOf = objectSetPrototypeOf;
    Buffer.prototype = bufferPrototype;
  }
  return true;
}

export async function testZstd() {
  const external = Buffer.from('KLUv/SAgAQEATm9kZSAyNiBleHRlcm5hbCB2ZWN0b3I6IDEzICsgMjk=', 'base64');
  assert.equal(zlib.zstdDecompressSync(external).toString(), 'Node 26 external vector: 13 + 29');
  for (const create of [zlib.createZstdCompress, zlib.createZstdDecompress]) {
    for (const rejectGarbageAfterEnd of [1, 'true', null]) {
      assert.throws(() => create({ rejectGarbageAfterEnd }), {
        name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE',
      });
    }
  }
  const source = Buffer.from('Ω asymmetric compression: 13|29 '.repeat(3000));
  for (const input of [Buffer.alloc(0), source, new DataView(source.buffer, source.byteOffset + 7, 29)]) {
    const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    const compressed = zlib.zstdCompressSync(input, { params: { [constants.ZSTD_c_checksumFlag]: true } });
    assert.deepEqual(zlib.zstdDecompressSync(compressed), bytes);
    await new Promise((resolve, reject) => {
      zlib.zstdCompress(input, (error, output) => {
        if (error) return reject(error);
        zlib.zstdDecompress(output, (error, result) => {
          if (error) return reject(error);
          try { assert.deepEqual(result, bytes); resolve(); } catch (error) { reject(error); }
        });
      });
    });
  }
  const compressed = zlib.zstdCompressSync(source);
  const trailingJunkError = { name: 'TypeError', code: 'ERR_TRAILING_JUNK_AFTER_STREAM_END' };
  for (const trailing of [Buffer.from('junk'), compressed.subarray(0, 3)]) {
    const withJunk = Buffer.concat([compressed, trailing]);
    assert.deepEqual(zlib.zstdDecompressSync(withJunk), source);
    assert.throws(() => zlib.zstdDecompressSync(withJunk, { rejectGarbageAfterEnd: true }), trailingJunkError);
    await assert.rejects(new Promise((resolve, reject) => {
      zlib.zstdDecompress(withJunk, { rejectGarbageAfterEnd: true }, (error, result) => {
        if (error) reject(error); else resolve(result);
      });
    }), trailingJunkError);
    for (const rejectGarbageAfterEnd of [false, true]) {
      const decoder = zlib.createZstdDecompress({ rejectGarbageAfterEnd });
      const chunks = [];
      const done = new Promise((resolve, reject) => {
        decoder.on('data', chunk => chunks.push(chunk));
        decoder.on('end', resolve);
        decoder.on('error', reject);
      });
      decoder.write(compressed);
      decoder.end(trailing);
      if (rejectGarbageAfterEnd) await assert.rejects(done, trailingJunkError);
      else {
        await done;
        assert.deepEqual(Buffer.concat(chunks), source);
      }
    }
  }
  assert.throws(() => zlib.zstdDecompressSync(compressed.subarray(0, compressed.length - 1)), {
    code: 'Z_BUF_ERROR', message: 'unexpected end of file',
  });
  const partial = zlib.zstdDecompressSync(compressed.subarray(0, compressed.length - 1), { finishFlush: 1 });
  assert.deepEqual(partial, source.subarray(0, partial.length));
  assert.throws(() => zlib.zstdCompressSync(source, { pledgedSrcSize: source.length - 1 }), {
    code: 'ZSTD_error_srcSize_wrong', errno: 72,
  });
  assert.throws(() => zlib.zstdDecompressSync(compressed, { maxOutputLength: source.length - 1 }), {
    code: 'ERR_BUFFER_TOO_LARGE',
  });
  const info = zlib.zstdCompressSync(source, { info: true });
  assert.ok(info.engine instanceof zlib.ZstdCompress);
  assert.deepEqual(zlib.zstdDecompressSync(info.buffer), source);
  await streamRoundTrip(source, zlib.createZstdCompress(), zlib.createZstdDecompress());
  const decoder = zlib.createZstdDecompress({ chunkSize: 64 });
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    decoder.on('data', chunk => chunks.push(chunk));
    decoder.on('end', resolve);
    decoder.on('error', reject);
  });
  for (const byte of Buffer.concat([external, compressed, external])) decoder.write(Buffer.from([byte]));
  decoder.end();
  await done;
  assert.deepEqual(Buffer.concat(chunks), Buffer.concat([
    Buffer.from('Node 26 external vector: 13 + 29'), source, Buffer.from('Node 26 external vector: 13 + 29'),
  ]));
  return true;
}

export function testZstdDisabled() {
  const source = Buffer.from('normal tier: gzip stays available, zstd does not');
  assert.deepEqual(gunzipSync(gzipSync(source)), source);
  for (const operation of [zlib.zstdCompressSync, zlib.zstdDecompressSync]) {
    assert.throws(() => operation(source), { code: 'ERR_ZLIB_INITIALIZATION_FAILED' });
  }
  return true;
}
