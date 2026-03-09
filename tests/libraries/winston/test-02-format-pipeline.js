import assert from 'assert';
import winston from 'winston';

export const run = () => {
  const pipeline = winston.format.combine(
    winston.format.label({ label: 'worker' }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'label'] }),
    winston.format.json()
  );

  const transformed = pipeline.transform({
    level: 'info',
    message: 'formatted',
    requestId: 'req-123',
    retries: 2,
  });

  assert.strictEqual(transformed.level, 'info');
  assert.strictEqual(transformed.message, 'formatted');
  assert.strictEqual(transformed.label, 'worker');
  assert.strictEqual(transformed.metadata.requestId, 'req-123');
  assert.strictEqual(transformed.metadata.retries, 2);
  assert.ok(typeof transformed[Symbol.for('message')] === 'string');

  return 'PASS: format pipeline combines label, metadata, and json output';
};
