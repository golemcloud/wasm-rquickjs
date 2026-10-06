import { Buffer } from 'node:buffer';
import {
  brotliCompressSync,
  brotliDecompressSync,
  createBrotliCompress,
  createBrotliDecompress,
  createGzip,
  createGunzip,
  crc32,
  deflateRawSync,
  deflateSync,
  gzipSync,
  gunzipSync,
  inflateRawSync,
  inflateSync,
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

export async function testByteTransfer() {
  const source = Buffer.alloc(131103);
  for (let i = 0; i < source.length; i++) source[i] = i % 251;
  for (const [compress, decompress] of [
    [gzipSync, gunzipSync],
    [deflateSync, inflateSync],
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
    let error;
    try {
      decompress(detached);
    } catch (caught) {
      error = caught;
    }
    if (error?.code !== 'Z_BUF_ERROR' || error.message !== 'unexpected end of file') {
      throw new Error('detached decompression did not match empty-input failure');
    }
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
