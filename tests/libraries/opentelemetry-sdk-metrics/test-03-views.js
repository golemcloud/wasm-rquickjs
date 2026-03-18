import assert from 'assert';
import {
  AggregationType,
  createAllowListAttributesProcessor,
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
  const provider = new MeterProvider({
    readers: [reader],
    views: [
      {
        instrumentName: 'http.duration',
        name: 'http.duration.filtered',
        aggregation: {
          type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
          options: {
            boundaries: [10, 100],
          },
        },
        attributesProcessors: [createAllowListAttributesProcessor(['method'])],
      },
      {
        instrumentName: 'drop.me',
        aggregation: { type: AggregationType.DROP },
      },
    ],
  });

  const meter = provider.getMeter('test-view-meter', '1.0.0');
  const histogram = meter.createHistogram('http.duration');
  const counter = meter.createCounter('drop.me');

  histogram.record(42, { method: 'GET', route: '/users', status: '200' });
  counter.add(1, { ignored: 'true' });

  await provider.forceFlush();

  const exported = exporter.getMetrics();

  const renamedMetric = findMetric(exported, 'http.duration.filtered');
  assert.ok(renamedMetric, 'expected renamed metric stream from view');
  assert.strictEqual(renamedMetric.dataPoints.length, 1);

  const attrs = renamedMetric.dataPoints[0].attributes;
  assert.deepStrictEqual(Object.keys(attrs), ['method'], 'view should keep only allow-listed attributes');
  assert.strictEqual(attrs.method, 'GET');

  const droppedMetric = findMetric(exported, 'drop.me');
  assert.strictEqual(droppedMetric, undefined, 'drop aggregation should remove metric from export');

  await provider.shutdown();
  return 'PASS: views can rename streams, filter attributes, and drop selected instruments';
};
