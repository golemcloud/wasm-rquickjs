import assert from 'assert';
import {
  bf16BytesToF32Array,
  bytesToSparseRow,
  f16BytesToF32Array,
  f32ArrayToBf16Bytes,
  f32ArrayToF16Bytes,
  f32ArrayToInt8Bytes,
  sparseToBytes,
} from '@zilliz/milvus2-sdk-node';

const approx = (a, b, epsilon) => Math.abs(a - b) <= epsilon;

export const run = () => {
  const vector = [0.5, -1.25, 3.0];

  const f16 = f32ArrayToF16Bytes(vector);
  const f16RoundTrip = f16BytesToF32Array(f16);
  assert.strictEqual(f16RoundTrip.length, vector.length);
  assert.ok(approx(f16RoundTrip[0], 0.5, 0.001));
  assert.ok(approx(f16RoundTrip[1], -1.25, 0.001));

  const bf16 = f32ArrayToBf16Bytes(vector);
  const bf16RoundTrip = bf16BytesToF32Array(bf16);
  assert.strictEqual(bf16RoundTrip.length, vector.length);
  assert.ok(approx(bf16RoundTrip[2], 3.0, 0.02));

  const sparse = sparseToBytes({ 1: 0.5, 4: 2.25 });
  const sparseRow = bytesToSparseRow(Buffer.from(sparse));
  assert.strictEqual(sparseRow['1'], 0.5);
  assert.strictEqual(sparseRow['4'], 2.25);

  const int8 = f32ArrayToInt8Bytes([1.2, -2.6, 7.49]);
  assert.deepStrictEqual(Array.from(int8), [1, 253, 7]);

  return 'PASS: vector byte conversion helpers are stable';
};
