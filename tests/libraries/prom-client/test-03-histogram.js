import assert from 'assert';
import client from 'prom-client';

const { Registry, Histogram } = client;

export const run = async () => {
  const registry = new Registry();

  const latency = new Histogram({
    name: 'test_request_latency_seconds',
    help: 'Request latency',
    labelNames: ['route'],
    buckets: [0.1, 0.5, 1],
    registers: [registry],
  });

  latency.observe({ route: '/fast' }, 0.05);
  latency.observe({ route: '/fast' }, 0.2);
  latency.observe({ route: '/fast' }, 0.8);
  latency.zero({ route: '/slow' });

  const metric = await latency.get();
  const count = metric.values.find(
    (v) => v.metricName === 'test_request_latency_seconds_count' && v.labels.route === '/fast',
  );
  const sum = metric.values.find(
    (v) => v.metricName === 'test_request_latency_seconds_sum' && v.labels.route === '/fast',
  );
  const slowCount = metric.values.find(
    (v) => v.metricName === 'test_request_latency_seconds_count' && v.labels.route === '/slow',
  );

  assert.ok(count, 'Expected count metric for /fast');
  assert.ok(sum, 'Expected sum metric for /fast');
  assert.ok(slowCount, 'Expected initialized count metric for /slow');

  assert.strictEqual(count.value, 3);
  assert.ok(Math.abs(sum.value - 1.05) < 1e-10);
  assert.strictEqual(slowCount.value, 0);

  const text = await registry.metrics();
  assert.ok(
    text.includes('test_request_latency_seconds_bucket{le="0.5",route="/fast"} 2'),
    'Expected <=0.5 bucket count to be 2 for /fast',
  );

  return 'PASS: Histogram observation, buckets, and zero initialization work';
};
