import { Buffer } from 'node:buffer';
import { gzipSync, gunzipSync, deflateSync, inflateSync, deflateRawSync, inflateRawSync, createGzip, createGunzip } from 'node:zlib';

export async function testByteTransfer() {
  const source = Buffer.alloc(131103);
  for (let i = 0; i < source.length; i++) source[i] = i % 251;
  for (const [compress, decompress] of [[gzipSync, gunzipSync], [deflateSync, inflateSync], [deflateRawSync, inflateRawSync]]) {
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
  const gzip = createGzip({ chunkSize: 1024 });
  const gunzip = createGunzip({ chunkSize: 1024 });
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    gzip.on('error', reject);
    gunzip.on('error', reject);
    gunzip.on('data', chunk => {
      if (!Buffer.isBuffer(chunk)) reject(new Error('stream output is not a Buffer'));
      chunks.push(chunk);
    });
    gunzip.on('end', resolve);
  });
  gzip.pipe(gunzip);
  for (let offset = 0; offset < source.length; offset += 7777) gzip.write(source.subarray(offset, offset + 7777));
  gzip.end();
  await done;
  if (!Buffer.concat(chunks).equals(source)) throw new Error('stream byte transfer');
  return true;
}
