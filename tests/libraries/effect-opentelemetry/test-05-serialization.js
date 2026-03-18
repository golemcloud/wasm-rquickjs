import assert from "assert";
import * as Effect from "effect/Effect";
import * as OtlpSerialization from "@effect/opentelemetry/OtlpSerialization";

const tracesPayload = {
  resourceSpans: [
    {
      resource: {
        attributes: [],
        droppedAttributesCount: 0,
      },
      scopeSpans: [
        {
          scope: { name: "effect-opentelemetry-tests" },
          spans: [],
        },
      ],
    },
  ],
};

export const run = async () => {
  const jsonBody = await Effect.gen(function* () {
    const serialization = yield* OtlpSerialization.OtlpSerialization;
    return serialization.traces(tracesPayload);
  }).pipe(
    Effect.provide(OtlpSerialization.layerJson),
    Effect.runPromise,
  );

  assert.strictEqual(jsonBody._tag, "Uint8Array");
  assert.strictEqual(jsonBody.contentType, "application/json");
  assert.ok(jsonBody.contentLength > 0);

  const protobufBody = await Effect.gen(function* () {
    const serialization = yield* OtlpSerialization.OtlpSerialization;
    return serialization.traces(tracesPayload);
  }).pipe(
    Effect.provide(OtlpSerialization.layerProtobuf),
    Effect.runPromise,
  );

  assert.strictEqual(protobufBody._tag, "Uint8Array");
  assert.strictEqual(protobufBody.contentType, "application/x-protobuf");
  assert.ok(protobufBody.contentLength > 0);

  return "PASS: OtlpSerialization emits JSON and Protobuf HttpBody payloads";
};
