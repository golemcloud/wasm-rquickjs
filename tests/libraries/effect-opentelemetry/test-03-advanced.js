import assert from "assert";
import * as Effect from "effect/Effect";
import * as OtlpResource from "@effect/opentelemetry/OtlpResource";

export const run = async () => {
  const resource = await OtlpResource.fromConfig({
    serviceName: "config-based-service",
    serviceVersion: "9.9.9",
    attributes: {
      team: "runtime",
      revision: "abc123",
    },
  }).pipe(Effect.runPromise);

  assert.strictEqual(OtlpResource.unsafeServiceName(resource), "config-based-service");

  const attrs = new Map(resource.attributes.map((entry) => [entry.key, entry.value]));
  assert.strictEqual(attrs.get("service.version")?.stringValue, "9.9.9");
  assert.strictEqual(attrs.get("team")?.stringValue, "runtime");
  assert.strictEqual(attrs.get("revision")?.stringValue, "abc123");

  return "PASS: OtlpResource.fromConfig and unsafeServiceName agree on service identity";
};
