import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
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
  const frameResults = [];
  for (const scenario of ['buffered-reset', 'next-frame', 'reset-pledge']) {
    const compressor = zlib.createZstdCompress(
      scenario === 'buffered-reset' ? {} : { pledgedSrcSize: 5 },
    );
    const chunks = [];
    const completed = new Promise(resolve => {
      compressor.on('data', chunk => chunks.push(chunk));
      compressor.on('end', () => resolve(null));
      compressor.on('error', resolve);
    });
    const write = data => new Promise((resolve, reject) => {
      compressor.write(data, error => error ? reject(error) : resolve());
    });
    try {
      await write('hello');
      await new Promise((resolve, reject) => {
        compressor.flush(constants.ZSTD_e_end, error => error ? reject(error) : resolve());
      });
      if (scenario === 'buffered-reset') {
        const completedChunks = chunks.length;
        await write('x');
        assert.equal(chunks.length, completedChunks);
        compressor.reset();
        compressor.end('world');
      } else {
        if (scenario === 'reset-pledge') compressor.reset();
        compressor.end('x');
      }
      const error = await completed;
      if (error) throw error;
      frameResults.push(zlib.zstdDecompressSync(Buffer.concat(chunks)).toString());
    } catch (error) {
      compressor.destroy();
      frameResults.push({ code: error.code, errno: error.errno });
    }
  }
  assert.deepEqual(frameResults, [
    'helloworld', 'hellox', { code: 'ZSTD_error_srcSize_wrong', errno: 72 },
  ]);
  return true;
}

export async function testZstdContracts() {
  const failures = [];
  for (const [name, check] of [
    ['decompression byte accounting', async () => {
      // Node 26 frame for "hello", independent of this runtime's compressor.
      const frame = Buffer.from('28b52ffd200529000068656c6c6f', 'hex');
      const junk = Buffer.from('junk');
      const skippable = Buffer.from('502a4d1803000000616263', 'hex');
      for (const [suffix, expectedBytes, expectedOutput] of [
        [Buffer.alloc(0), 14, 'hello'],
        [junk, 14, 'hello'],
        [frame.subarray(0, 2), 16, 'hello'],
        [Buffer.from([0x28, 0xb5, 0, 0]), 14, 'hello'],
        [frame, 28, 'hellohello'],
        [Buffer.concat([skippable, frame, junk]), 39, 'hellohello'],
      ]) {
        const input = Buffer.concat([frame, suffix]);
        const sync = zlib.zstdDecompressSync(input, { info: true, chunkSize: 64 });
        assert.equal(sync.buffer.toString(), expectedOutput);
        assert.equal(sync.engine.bytesWritten, expectedBytes);
        const callback = await new Promise((resolve, reject) => zlib.zstdDecompress(input,
          { info: true, chunkSize: 64 }, (error, value) => error ? reject(error) : resolve(value)));
        assert.equal(callback.buffer.toString(), expectedOutput);
        assert.equal(callback.engine.bytesWritten, expectedBytes);
      }
      for (const [parts, expectedBytes, expectedOutput] of [
        [[Buffer.concat([frame, junk])], 14, 'hello'],
        [[frame, junk], 14, 'hello'],
        [[Buffer.concat([frame, frame.subarray(0, 1)]), junk], 15, 'hello'],
        [[frame, frame.subarray(0, 1), junk], 15, 'hello'],
        [[frame, frame.subarray(0, 2)], 16, 'hello'],
        [[frame, frame.subarray(0, 1), frame.subarray(1), junk], 28, 'hellohello'],
        [[frame, skippable.subarray(0, 3), skippable.subarray(3), frame, junk], 39, 'hellohello'],
      ]) {
        const decoder = zlib.createZstdDecompress({ chunkSize: 64 });
        const chunks = [];
        const done = new Promise((resolve, reject) => {
          decoder.on('data', chunk => chunks.push(chunk));
          decoder.on('end', resolve);
          decoder.on('error', reject);
        });
        for (const part of parts) {
          await new Promise((resolve, reject) => decoder.write(part,
            error => error ? reject(error) : resolve()));
        }
        decoder.end();
        await done;
        assert.equal(Buffer.concat(chunks).toString(), expectedOutput);
        assert.equal(decoder.bytesWritten, expectedBytes);
      }
    }],
    ['binary output despite constructor encoding', async () => {
      const source = Buffer.from([0, 255, 13, 29, 128, 65]);
      const options = { encoding: 'hex' };
      const frame = await new Promise((resolve, reject) => zlib.zstdCompress(source, options,
        (error, value) => error ? reject(error) : resolve(value)));
      assert.ok(Buffer.isBuffer(frame));
      const decoded = await new Promise((resolve, reject) => zlib.zstdDecompress(frame, options,
        (error, value) => error ? reject(error) : resolve(value)));
      assert.ok(Buffer.isBuffer(decoded));
      assert.deepEqual(decoded, source);
      await streamRoundTrip(source, zlib.createZstdCompress(options), zlib.createZstdDecompress(options));
      assert.deepEqual(options, { encoding: 'hex' });
    }],
    ['callback info snapshot', async () => {
      const source = Buffer.from('callback shape 13|29');
      const frame = zlib.zstdCompressSync(source);
      for (const info of [false, true]) {
        const options = { info };
        const result = new Promise((resolve, reject) => zlib.zstdDecompress(frame, options,
          (error, value) => error ? reject(error) : resolve(value)));
        options.info = !info;
        const value = await result;
        assert.deepEqual(info ? value.buffer : value, source);
        assert.equal(Buffer.isBuffer(value), !info);
        if (info) assert.ok(value.engine instanceof zlib.ZstdDecompress);
      }
    }],
    ['direct constant aliases', async () => {
      assert.equal(zlib.default.ZSTD_c_compressionLevel, 100);
      assert.equal(zlib.default.ZSTD_e_end, 2);
      assert.throws(() => { zlib.default.ZSTD_e_end = 99; }, TypeError);
      const source = Buffer.from('direct constant parameter 13|29');
      const frame = zlib.zstdCompressSync(source,
        { params: { [zlib.default.ZSTD_c_compressionLevel]: 9 } });
      assert.deepEqual(zlib.zstdDecompressSync(frame), source);
    }],
    ['callback validation precedence', async () => {
      for (const operation of [zlib.zstdCompress, zlib.zstdDecompress]) {
        assert.throws(() => operation(123),
          { code: 'ERR_INVALID_ARG_TYPE', message: /callback/ });
      }
    }],
    ['callback source pledge', async () => {
      const bytes = Buffer.from('héllo wörld 🚀 '.repeat(1000));
      const padded = Buffer.concat([Buffer.alloc(7), bytes, Buffer.alloc(11)]);
      const mismatches = [];
      for (const [input, options, normalized] of [
        ['', {}, Buffer.alloc(0)],
        ['hello', {}, Buffer.from('hello')],
        [bytes.toString(), {}, bytes],
        [new DataView(padded.buffer, padded.byteOffset + 7, bytes.length), {}, bytes],
        [Buffer.alloc(131073, 65), { chunkSize: 64 }, Buffer.alloc(131073, 65)],
        [bytes.toString(), { defaultEncoding: 'utf-8' }, bytes],
      ]) {
        const opts = { ...options, params: { [zlib.constants.ZSTD_c_compressionLevel]: 9 } };
        const compressed = await new Promise((resolve, reject) => zlib.zstdCompress(input, opts,
          (error, output) => error ? reject(error) : resolve(output)));
        const expected = zlib.zstdCompressSync(normalized, opts);
        console.log(`pledge ${normalized.length}: ${compressed.toString('hex')} sync: ${expected.toString('hex')}`);
        if (!compressed.equals(expected)) mismatches.push(`${typeof input}/${normalized.length}`);
        assert.equal(opts.pledgedSrcSize, undefined);
      }
      const latin1 = await new Promise((resolve, reject) => zlib.zstdCompress('é',
        { defaultEncoding: 'latin1', params: { [zlib.constants.ZSTD_c_compressionLevel]: 9 } },
        (error, output) => error ? reject(error) : resolve(output)));
      // Node deliberately leaves non-UTF-8 strings unpledged; their frame is
      // not byte-identical to synchronous compression of the encoded bytes.
      console.log(`latin1 unpledged: ${latin1.toString('hex')}`);
      assert.equal(latin1[4] & 0xe0, 0);
      assert.deepEqual(zlib.zstdDecompressSync(latin1), Buffer.from([0xe9]));
      const mismatch = await new Promise(resolve => zlib.zstdCompress(Buffer.from('hello'),
        { pledgedSrcSize: 1 }, error => resolve(error)));
      assert.equal(mismatch?.code, 'ZSTD_error_srcSize_wrong');
      assert.equal(mismatch?.errno, 72);
      assert.deepEqual(mismatches, []);
    }],
    ['constructor option ownership', async () => {
      let reads = 0;
      const compressor = zlib.createZstdCompress({
        get chunkSize() {
          if (++reads > 2) throw new Error('unowned third chunkSize read');
          return 64;
        },
      });
      await streamRoundTrip(Buffer.from('constructor ownership 13|29'), compressor, zlib.createZstdDecompress());
      assert.throws(() => zlib.createZstdCompress({ signal: {} }), { code: 'ERR_INVALID_ARG_TYPE' });
    }],
    ['error intrinsic capture', async () => {
      const original = String.prototype.startsWith;
      const find = Array.prototype.find;
      const keys = Object.keys;
      let error;
      // Construct first: parameter enumeration is not the error-mapping path.
      const decoder = zlib.createZstdDecompress();
      const failed = new Promise(resolve => decoder.on('error', resolve));
      try {
        String.prototype.startsWith = () => { throw new Error('mutable startsWith'); };
        Array.prototype.find = () => { throw new Error('mutable find'); };
        Object.keys = () => { throw new Error('mutable keys'); };
        decoder.end(Buffer.from([1, 2, 3, 4]));
        error = await failed;
      } finally {
        String.prototype.startsWith = original;
        Array.prototype.find = find;
        Object.keys = keys;
      }
      assert.equal(error?.code, 'ZSTD_error_prefix_unknown');
      assert.equal(error?.errno, 10);
    }],
    ['callback encoding', async () => {
      for (const pledgedSrcSize of [undefined, 1]) {
        const compressed = await new Promise((resolve, reject) => {
          zlib.zstdCompress('é', { defaultEncoding: 'latin1', pledgedSrcSize },
            (error, result) => error ? reject(error) : resolve(result));
        });
        assert.deepEqual(zlib.zstdDecompressSync(compressed), Buffer.from([0xe9]));
      }
    }],
    ['shared dictionaries', async () => {
      const shared = new SharedArrayBuffer(128);
      const dictionary = Buffer.from('dictionary asymmetric 13|29 '.repeat(3));
      new Uint8Array(shared).set(dictionary, 7);
      const source = Buffer.from('dictionary asymmetric 13|29 '.repeat(100));
      for (const value of [shared, new Uint8Array(shared, 7, dictionary.length),
        new DataView(shared, 7, dictionary.length)]) {
        const compressed = zlib.zstdCompressSync(source, { dictionary: value });
        assert.deepEqual(zlib.zstdDecompressSync(compressed, { dictionary: value }), source);
        await streamRoundTrip(source, zlib.createZstdCompress({ dictionary: value }),
          zlib.createZstdDecompress({ dictionary: value }));
      }
    }],
    ['numeric parameters', async () => {
      for (const value of [-2, 3, 100]) {
        assert.throws(() => zlib.createZstdCompress({ params: { 160: value } }),
          { code: 'ERR_ZLIB_INITIALIZATION_FAILED' });
      }
      const source = Buffer.from('numeric control 13|29');
      for (const value of [0, 1, 2]) {
        assert.deepEqual(zlib.zstdDecompressSync(zlib.zstdCompressSync(source, { params: { 160: value } })), source);
      }
      for (const key of [200, 201, 202]) {
        const enabled = zlib.zstdCompressSync(source, { params: { [key]: 1 } });
        for (const value of [-2, 2, 3, 100]) {
          assert.deepEqual(zlib.zstdCompressSync(source, { params: { [key]: value } }), enabled);
        }
      }
    }],
    ['stream backpressure', async () => {
      assert.throws(() => zlib.createZstdDecompress({ chunkSize: Number.MAX_SAFE_INTEGER + 1 }),
        { code: 'ERR_OUT_OF_RANGE' });
      const source = Buffer.alloc(1024 * 1024, 0x61);
      const decoder = zlib.createZstdDecompress({ chunkSize: 64, readableHighWaterMark: 64 });
      const chunks = [];
      let written = false;
      const done = new Promise((resolve, reject) => {
        decoder.on('error', reject);
        decoder.on('end', resolve);
      });
      decoder.write(zlib.zstdCompressSync(source), error => {
        if (error) decoder.destroy(error);
        written = true;
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      const buffered = decoder.readableLength;
      const writeCompleted = written;
      decoder.on('data', chunk => chunks.push(chunk));
      decoder.end();
      await done;
      assert.deepEqual(Buffer.concat(chunks), source);
      assert.equal(writeCompleted, false);
      assert.ok(buffered <= 64, `paused decoder buffered ${buffered} bytes`);
      assert.ok(chunks.every(chunk => chunk.length <= 64), 'output exceeds chunkSize');

      const random = Buffer.alloc(300000);
      let seed = 0x12345678;
      for (let i = 0; i < random.length; i++) {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
        random[i] = seed & 255;
      }
      const encoder = zlib.createZstdCompress({ chunkSize: 64, readableHighWaterMark: 64 });
      const encoded = [];
      const encodedDone = new Promise((resolve, reject) => {
        encoder.on('error', reject); encoder.on('end', resolve);
      });
      encoder.write(random);
      encoder.end();
      await new Promise(resolve => setTimeout(resolve, 0));
      const encodedBuffered = encoder.readableLength;
      encoder.on('data', chunk => encoded.push(chunk));
      await encodedDone;
      assert.ok(encodedBuffered <= 64, `paused encoder buffered ${encodedBuffered} bytes`);
      assert.ok(encoded.every(chunk => chunk.length <= 64), 'encoded output exceeds chunkSize');
      assert.deepEqual(zlib.zstdDecompressSync(Buffer.concat(encoded)), random);

      const frame = zlib.zstdCompressSync(source);
      assert.deepEqual(zlib.zstdDecompressSync(frame, { chunkSize: 64, maxOutputLength: source.length }), source);
      assert.throws(() => zlib.zstdDecompressSync(frame, { chunkSize: 64, maxOutputLength: source.length - 1 }),
        { code: 'ERR_BUFFER_TOO_LARGE' });
    }],
    ['paused stream destruction', async () => {
      const decoder = zlib.createZstdDecompress({ chunkSize: 64, readableHighWaterMark: 64 });
      const failure = new Error('cancel paused decoder');
      let callbacks = 0;
      const closed = new Promise(resolve => decoder.on('close', resolve));
      decoder.on('error', error => assert.equal(error, failure));
      decoder.write(zlib.zstdCompressSync(Buffer.alloc(1024 * 1024)), () => callbacks++);
      await new Promise(resolve => setTimeout(resolve, 0));
      decoder.destroy(failure);
      await closed;
      await new Promise(resolve => setTimeout(resolve, 0));
      assert.equal(decoder.destroyed, true);
      assert.ok(callbacks <= 1);
    }],
    ['stream string encodings', async () => {
      const source = Buffer.from('base64 decoder control 13|29');
      const frame = zlib.zstdCompressSync(source);
      for (const [decode, input, encoding, defaultEncoding, expected] of [
        [false, 'é', 'latin1', undefined, Buffer.from([0xe9])],
        [false, 'é', undefined, 'latin1', Buffer.from([0xe9])],
        [true, frame.toString('base64'), 'base64', undefined, source],
      ]) {
        const engine = decode ? zlib.createZstdDecompress({ decodeStrings: false }) :
          zlib.createZstdCompress({ decodeStrings: false, defaultEncoding });
        const chunks = [];
        const done = new Promise((resolve, reject) => {
          engine.on('error', reject); engine.on('end', resolve);
        });
        engine.on('data', chunk => chunks.push(chunk));
        engine.end(input, encoding);
        await done;
        const output = Buffer.concat(chunks);
        assert.deepEqual(decode ? output : zlib.zstdDecompressSync(output), expected);
      }
    }],
    ['finalizer method capture', async () => {
      const { register, unregister } = FinalizationRegistry.prototype;
      try {
        FinalizationRegistry.prototype.register = () => { throw new Error('mutable register'); };
        FinalizationRegistry.prototype.unregister = () => { throw new Error('mutable unregister'); };
        const source = Buffer.from('captured cleanup methods 13|29');
        assert.deepEqual(zlib.zstdDecompressSync(zlib.zstdCompressSync(source)), source);
        await streamRoundTrip(source, zlib.createZstdCompress(), zlib.createZstdDecompress());
      } finally {
        FinalizationRegistry.prototype.register = register;
        FinalizationRegistry.prototype.unregister = unregister;
      }
    }],
    ['callback cancellation and completion', async () => {
      const source = Buffer.from('callback lifecycle control 13|29');
      const frame = zlib.zstdCompressSync(source);
      const aborted = new AbortController();
      aborted.abort();
      for (const create of [zlib.createZstdCompress, zlib.createZstdDecompress]) {
        const engine = create({ signal: aborted.signal });
        const closed = new Promise(resolve => engine.on('close', resolve));
        const error = await new Promise(resolve => engine.on('error', resolve));
        await closed;
        assert.equal(error.code, 'ABORT_ERR');
      }
      assert.deepEqual(zlib.zstdDecompressSync(zlib.zstdCompressSync(source,
        { signal: aborted.signal }), { signal: aborted.signal }), source);
      for (const [operation, input] of [[zlib.zstdCompress, source], [zlib.zstdDecompress, frame]]) {
        for (const initiallyAborted of [false, true]) {
          const controller = new AbortController();
          if (initiallyAborted) controller.abort();
          let callbacks = 0;
          const done = new Promise(resolve => operation(input, { signal: controller.signal }, error => {
            callbacks++; resolve(error);
          }));
          if (!initiallyAborted) controller.abort();
          assert.equal((await done)?.code, 'ABORT_ERR');
          await new Promise(resolve => setTimeout(resolve, 0));
          assert.equal(callbacks, 1);
          assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
        }
        const controller = new AbortController();
        const result = await new Promise((resolve, reject) => operation(input,
          { signal: controller.signal, info: true }, (error, value) => error ? reject(error) : resolve(value)));
        assert.ok(Buffer.isBuffer(result.buffer));
        assert.deepEqual(operation === zlib.zstdCompress ? zlib.zstdDecompressSync(result.buffer) : result.buffer, source);
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
      }
      const error = await new Promise(resolve => zlib.zstdDecompress(frame,
        { maxOutputLength: source.length - 1 }, error => resolve(error)));
      assert.equal(error?.code, 'ERR_BUFFER_TOO_LARGE');
      const invalid = await new Promise(resolve => zlib.zstdDecompress(Buffer.from([1, 2]), error => resolve(error)));
      assert.ok(invalid);
    }],
  ]) {
    try { await check(); console.log(`${name}: PASS`); }
    catch (error) { failures.push(name); console.log(`${name}: FAIL ${error.message}`); }
  }
  assert.deepEqual(failures, []);
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
