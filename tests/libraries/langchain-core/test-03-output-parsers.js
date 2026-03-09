import assert from "assert";
import {
  CommaSeparatedListOutputParser,
  JsonOutputParser,
  NumberedListOutputParser,
  StringOutputParser,
  parsePartialJson,
} from "@langchain/core/output_parsers";

export const run = async () => {
  const stringParser = new StringOutputParser();
  const stringResult = await stringParser.parse("hello");
  assert.strictEqual(stringResult, "hello");

  const jsonParser = new JsonOutputParser();
  const jsonResult = await jsonParser.parse("```json\n{\"a\":1,\"b\":2}\n```");
  assert.deepStrictEqual(jsonResult, { a: 1, b: 2 });

  const csvParser = new CommaSeparatedListOutputParser();
  const csvResult = await csvParser.parse("alpha, beta, gamma");
  assert.deepStrictEqual(csvResult, ["alpha", "beta", "gamma"]);

  const numberedParser = new NumberedListOutputParser();
  const numberedResult = await numberedParser.parse("1. one\n2. two\n3. three");
  assert.deepStrictEqual(numberedResult, ["one", "two", "three"]);

  const partial = parsePartialJson('{"name":"core","version":');
  assert.deepStrictEqual(partial, { name: "core" });

  return "PASS: output parsers handle string, JSON, CSV, and numbered list formats";
};
