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

const getPoint = (metric) => {
  assert.ok(metric, 'expected exported metric');
  assert.ok(metric.dataPoints.length >= 1, 'expected at least one data point');
  return metric.dataPoints[0];
};

export const run = async () => {
  const exporter = new InMemoryMetricExporter();
  const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
  const provider = new MeterProvider({ readers: [reader] });
  const meter = provider.getMeter('test-observable-meter', '1.0.0');

  const cpuGauge = meter.createObservableGauge('cpu.usage');
  const queueGauge = meter.createObservableGauge('queue.pending');
  const freeGauge = meter.createObservableGauge('memory.free');
  const usedGauge = meter.createObservableGauge('memory.used');

  let singleCallbackRuns = 0;
  cpuGauge.addCallback((result) => {
    singleCallbackRuns += 1;
    result.observe(73.5, { core: '0' });
  });

  queueGauge.addCallback((result) => {
    result.observe(4, { queue: 'email' });
  });

  let batchCallbackRuns = 0;
  meter.addBatchObservableCallback((result) => {
    batchCallbackRuns += 1;
    result.observe(freeGauge, 256, { unit: 'mb' });
    result.observe(usedGauge, 768, { unit: 'mb' });
  }, [freeGauge, usedGauge]);

  await provider.forceFlush();

  assert.ok(singleCallbackRuns >= 1, 'single observable callback should run during collection');
  assert.ok(batchCallbackRuns >= 1, 'batch observable callback should run during collection');

  const exported = exporter.getMetrics();

  const cpuPoint = getPoint(findMetric(exported, 'cpu.usage'));
  assert.strictEqual(cpuPoint.value, 73.5);
  assert.strictEqual(cpuPoint.attributes.core, '0');

  const queuePoint = getPoint(findMetric(exported, 'queue.pending'));
  assert.strictEqual(queuePoint.value, 4);

  const freePoint = getPoint(findMetric(exported, 'memory.free'));
  const usedPoint = getPoint(findMetric(exported, 'memory.used'));
  assert.strictEqual(freePoint.value, 256);
  assert.strictEqual(usedPoint.value, 768);

  await provider.shutdown();
  return 'PASS: observable and batch observable callbacks are collected and exported';
};
