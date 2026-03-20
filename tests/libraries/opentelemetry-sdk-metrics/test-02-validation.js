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

export const run = async () => {
  const exporter = new InMemoryMetricExporter();
  const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
  const provider = new MeterProvider({ readers: [reader] });

  const meter = provider.getMeter('test-validation-meter', '1.0.0');
  const counter = meter.createCounter('counter.nonnegative');
  const histogram = meter.createHistogram('histogram.nonnegative');

  // Negative values are invalid for Counter and Histogram in the OTel metrics API.
  counter.add(-8, { route: '/invalid' });
  counter.add(5, { route: '/valid' });

  histogram.record(-3, { route: '/invalid' });
  histogram.record(7, { route: '/valid' });

  await provider.forceFlush();

  const exported = exporter.getMetrics();

  const counterMetric = findMetric(exported, 'counter.nonnegative');
  assert.ok(counterMetric, 'expected counter metric');
  assert.strictEqual(counterMetric.dataPoints.length, 1, 'only valid counter measurement should be exported');
  assert.strictEqual(counterMetric.dataPoints[0].value, 5, 'counter should ignore invalid negative measurements');

  const histogramMetric = findMetric(exported, 'histogram.nonnegative');
  assert.ok(histogramMetric, 'expected histogram metric');
  assert.strictEqual(histogramMetric.dataPoints.length, 1, 'only valid histogram measurement should be exported');
  assert.strictEqual(histogramMetric.dataPoints[0].value.count, 1, 'histogram should ignore invalid negative measurements');
  assert.strictEqual(histogramMetric.dataPoints[0].value.sum, 7, 'histogram sum should include only the valid value');

  await provider.shutdown();
  return 'PASS: metric API validation ignores invalid negative values for monotonic instruments';
};
