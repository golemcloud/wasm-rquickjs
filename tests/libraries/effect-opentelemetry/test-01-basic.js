import assert from "assert";
import * as OtlpResource from "@effect/opentelemetry/OtlpResource";

export const run = () => {
  const resource = OtlpResource.make({
    serviceName: "effect-opentelemetry-test",
    serviceVersion: "1.2.3",
    attributes: {
      "deployment.environment": "test",
      "feature.flag": true,
      "sample.rate": 0.5,
    },
  });

  assert.ok(Array.isArray(resource.attributes));
  assert.ok(resource.attributes.length >= 4);

  const byKey = new Map(resource.attributes.map((entry) => [entry.key, entry.value]));
  assert.strictEqual(byKey.get("service.name")?.stringValue, "effect-opentelemetry-test");
  assert.strictEqual(byKey.get("service.version")?.stringValue, "1.2.3");
  assert.strictEqual(byKey.get("deployment.environment")?.stringValue, "test");
  assert.strictEqual(byKey.get("feature.flag")?.boolValue, true);
  assert.strictEqual(byKey.get("sample.rate")?.doubleValue, 0.5);

  return "PASS: OtlpResource.make builds service and custom attributes";
};
