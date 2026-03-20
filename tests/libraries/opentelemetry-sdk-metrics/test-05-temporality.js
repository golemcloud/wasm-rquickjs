import assert from 'assert';
import {
  AggregationTemporality,
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

const extractSingleCounterValue = (resourceMetrics, metricName) => {
  const metric = findMetric(resourceMetrics, metricName);
  assert.ok(metric, `expected metric ${metricName}`);
  assert.strictEqual(metric.dataPoints.length, 1, 'expected one point for single attribute set');
  return metric.dataPoints[0].value;
};

export const run = async () => {
  const exporter = new InMemoryMetricExporter(AggregationTemporality.DELTA);
  const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
  const provider = new MeterProvider({ readers: [reader] });

  const meter = provider.getMeter('test-delta-meter', '1.0.0');
  const counter = meter.createCounter('jobs.processed');

  counter.add(2, { queue: 'critical' });
  await provider.forceFlush();
  const firstExport = exporter.getMetrics();
  assert.strictEqual(extractSingleCounterValue(firstExport, 'jobs.processed'), 2);

  exporter.reset();

  counter.add(5, { queue: 'critical' });
  await provider.forceFlush();
  const secondExport = exporter.getMetrics();
  assert.strictEqual(
    extractSingleCounterValue(secondExport, 'jobs.processed'),
    5,
    'delta temporality should export only the increment since the previous collection'
  );

  await provider.shutdown();
  await provider.forceFlush();

  return 'PASS: delta temporality exports per-collection increments';
};
