import assert from "assert";
import { CompressionCodecs, CompressionTypes, KafkaJSNotImplemented } from "kafkajs";

export const run = () => {
  assert.strictEqual(typeof CompressionCodecs[CompressionTypes.GZIP], "function");

  assert.throws(
    () => CompressionCodecs[CompressionTypes.Snappy](),
    (err) => err instanceof KafkaJSNotImplemented && /Snappy/.test(err.message),
  );

  assert.throws(
    () => CompressionCodecs[CompressionTypes.LZ4](),
    (err) => err instanceof KafkaJSNotImplemented && /LZ4/.test(err.message),
  );

  assert.throws(
    () => CompressionCodecs[CompressionTypes.ZSTD](),
    (err) => err instanceof KafkaJSNotImplemented && /ZSTD/.test(err.message),
  );

  return "PASS: compression codec registry exposes gzip and expected unimplemented codecs";
};
