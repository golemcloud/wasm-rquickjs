import assert from 'assert';
import { ValueType, metrics } from '@opentelemetry/api';

export const run = () => {
  const meter = metrics.getMeter('lib-test-opentelemetry-api', '1.0.0');

  const counter = meter.createCounter('test.counter', {
    description: 'Monotonic counter test',
    unit: 'items',
    valueType: ValueType.INT,
  });
  counter.add(5, { route: '/items' });

  const upDownCounter = meter.createUpDownCounter('test.active');
  upDownCounter.add(3);
  upDownCounter.add(-1);

  const gauge = meter.createGauge('test.gauge');
  gauge.record(12.5, { shard: 'a' });

  const histogram = meter.createHistogram('test.latency', { unit: 'ms' });
  histogram.record(42.7, { operation: 'query' });

  const observableGauge = meter.createObservableGauge('test.observable.gauge');
  const gaugeCallback = (result) => {
    result.observe(9, { source: 'callback' });
  };
  observableGauge.addCallback(gaugeCallback);
  observableGauge.removeCallback(gaugeCallback);

  const observableCounter = meter.createObservableCounter('test.observable.counter');
  const batchCallback = (result) => {
    result.observe(observableCounter, 11, { source: 'batch' });
  };
  meter.addBatchObservableCallback(batchCallback, [observableCounter]);
  meter.removeBatchObservableCallback(batchCallback, [observableCounter]);

  assert.ok(counter);
  assert.ok(upDownCounter);
  assert.ok(gauge);
  assert.ok(histogram);

  return 'PASS: metrics API supports synchronous and observable instrument operations';
};
