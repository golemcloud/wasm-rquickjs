import assert from "assert";
import * as CliConfig from "@effect/cli/CliConfig";
import * as Options from "@effect/cli/Options";
import { Effect, Option } from "effect";

export const run = async () => {
  const optionSpec = Options.all({
    verbose: Options.boolean("verbose").pipe(Options.withAlias("v")),
    retries: Options.integer("retries").pipe(Options.withDefault(3)),
    tags: Options.repeated(Options.text("tag")),
    output: Options.optional(Options.text("output")),
  });

  const [error, leftover, parsed] = await Effect.runPromise(
    Options.processCommandLine(
      optionSpec,
      ["-v", "--retries", "7", "--tag", "alpha", "--tag", "beta"],
      CliConfig.defaultConfig,
    ),
  );

  assert.strictEqual(Option.isNone(error), true);
  assert.strictEqual(leftover.length, 0);
  assert.strictEqual(parsed.verbose, true);
  assert.strictEqual(parsed.retries, 7);
  assert.deepStrictEqual(parsed.tags, ["alpha", "beta"]);
  assert.strictEqual(Option.isNone(parsed.output), true);

  return "PASS: options parse aliases, defaults, repeats, and optional values";
};
