import assert from 'assert';
import { CborCodec, DateTime, Decimal, Duration, RecordId } from 'surrealdb';

export const run = () => {
  const codec = new CborCodec({});
  const payload = {
    id: new RecordId('person', 'codec-test'),
    createdAt: new DateTime(new Date('2025-01-01T00:00:00.000Z')),
    ratio: new Decimal('3.14159'),
    ttl: Duration.seconds(90),
    ok: true,
  };

  const encoded = codec.encode(payload);
  const decoded = codec.decode(encoded);

  assert.ok(decoded.id.toString().startsWith('person:'));
  assert.ok(decoded.id.toString().includes('codec-test'));
  assert.strictEqual(decoded.createdAt.toString(), '2025-01-01T00:00:00.000Z');
  assert.strictEqual(decoded.ratio.toString(), '3.14159');
  assert.strictEqual(decoded.ttl.toString(), '1m30s');
  assert.strictEqual(decoded.ok, true);

  return 'PASS: CBOR codec round-trips core SurrealDB value types';
};
