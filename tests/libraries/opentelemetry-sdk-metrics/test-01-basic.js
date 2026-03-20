import assert from 'assert';
import {
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

const findMetric = (resourceMetrics, metricName) => {
  for (const resource of resourceMetrics) {
    for (const scope of resource.scopeMetrics) {
      const match = scope.metrics.find((metric) => metric.descriptor.name === metricName);
      if (match) return match;
    }
  }
  return undefined;
};

const getSinglePoint = (metric) => {
  assert.ok(metric, 'expected metric to be exported');
  assert.ok(metric.dataPoints.length > 0, 'expected at least one data point');
  return metric.dataPoints[0];
};

export const run = async () => {
  const exporter = new InMemoryMetricExporter();
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 60_000,
    exportTimeoutMillis: 5_000,
  });
  const provider = new MeterProvider({ readers: [reader] });

  const meter = provider.getMeter('test-basic-meter', '1.0.0');
  const counter = meter.createCounter('requests.total');
  const upDownCounter = meter.createUpDownCounter('queue.depth');
  const histogram = meter.createHistogram('latency.ms');
  const gauge = meter.createGauge('worker.load');

  counter.add(1, { route: '/a' });
  counter.add(2, { route: '/a' });
  upDownCounter.add(5, { queue: 'email' });
  upDownCounter.add(-4, { queue: 'email' });
  histogram.record(20, { route: '/a' });
  histogram.record(13, { route: '/a' });
  gauge.record(3, { worker: 'alpha' });
  gauge.record(9, { worker: 'alpha' });

  await provider.forceFlush();

  const exported = exporter.getMetrics();
  assert.ok(exported.length >= 1, 'expected at least one ResourceMetrics entry');

  const counterPoint = getSinglePoint(findMetric(exported, 'requests.total'));
  assert.strictEqual(counterPoint.value, 3, 'counter should aggregate additions');

  const upDownPoint = getSinglePoint(findMetric(exported, 'queue.depth'));
  assert.strictEqual(upDownPoint.value, 1, 'upDownCounter should preserve signed updates');

  const histogramPoint = getSinglePoint(findMetric(exported, 'latency.ms'));
  assert.strictEqual(histogramPoint.value.count, 2, 'histogram should contain two recorded measurements');
  assert.strictEqual(histogramPoint.value.sum, 33, 'histogram sum should match recorded values');

  const gaugePoint = getSinglePoint(findMetric(exported, 'worker.load'));
  assert.strictEqual(gaugePoint.value, 9, 'gauge should keep the last recorded value');

  await provider.shutdown();
  return 'PASS: sync instruments export expected aggregate values';
};
