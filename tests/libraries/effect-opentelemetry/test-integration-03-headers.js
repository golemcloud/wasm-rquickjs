import assert from "assert";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as Effect from "effect/Effect";
import * as OtlpSerialization from "@effect/opentelemetry/OtlpSerialization";
import * as OtlpTracer from "@effect/opentelemetry/OtlpTracer";

const BASE_URL = "http://localhost:18080";

const resetServerState = async () => {
  const response = await fetch(`${BASE_URL}/reset`, { method: "POST" });
  assert.strictEqual(response.status, 200);
};

const readServerStats = async () => {
  const response = await fetch(`${BASE_URL}/stats`);
  assert.strictEqual(response.status, 200);
  return response.json();
};

export const run = async () => {
  await resetServerState();

  await Effect.withSpan("headers-check")(
    Effect.void,
  ).pipe(
    Effect.provide(
      OtlpTracer.layer({
        url: `${BASE_URL}/v1/traces`,
        resource: { serviceName: "effect-opentelemetry-headers" },
        headers: {
          authorization: "Bearer test-token",
          "x-collector-scope": "effect-opentelemetry",
        },
        exportInterval: "20 millis",
        shutdownTimeout: "2 seconds",
      }),
    ),
    Effect.provide(OtlpSerialization.layerJson),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );

  const stats = await readServerStats();
  assert.ok(stats.traces.requests >= 1, "Expected at least one trace request");
  assert.strictEqual(stats.traces.lastHeaders["authorization"], "Bearer test-token");
  assert.strictEqual(stats.traces.lastHeaders["x-collector-scope"], "effect-opentelemetry");

  return "PASS: OtlpTracer forwards custom collector headers";
};
