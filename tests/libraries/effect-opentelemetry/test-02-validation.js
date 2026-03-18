import assert from "assert";
import * as OtlpResource from "@effect/opentelemetry/OtlpResource";

export const run = () => {
  const entries = [
    ["name", "alice"],
    ["attempts", 3],
    ["enabled", true],
    ["latency", 12.5],
    ["labels", ["a", "b"]],
    ["meta", { nested: "ok", depth: 2 }],
  ];

  const attrs = OtlpResource.entriesToAttributes(entries);
  assert.strictEqual(attrs.length, entries.length);

  const find = (key) => attrs.find((entry) => entry.key === key)?.value;
  assert.strictEqual(find("name")?.stringValue, "alice");
  assert.strictEqual(find("attempts")?.intValue, 3);
  assert.strictEqual(find("enabled")?.boolValue, true);
  assert.strictEqual(find("latency")?.doubleValue, 12.5);
  assert.strictEqual(find("labels")?.arrayValue?.values.length, 2);
  assert.ok(find("meta")?.stringValue?.includes('"nested": "ok"'));
  assert.ok(find("meta")?.stringValue?.includes('"depth": 2'));

  const bytes = OtlpResource.unknownToAttributeValue(new Uint8Array([1, 2, 3]));
  assert.ok(bytes.stringValue?.includes('"0": 1'));
  assert.ok(bytes.stringValue?.includes('"2": 3'));

  return "PASS: OtlpResource converts primitives, arrays, objects, and bytes";
};
