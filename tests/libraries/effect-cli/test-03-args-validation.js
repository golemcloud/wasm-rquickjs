import assert from "assert";
import * as Args from "@effect/cli/Args";
import * as CliConfig from "@effect/cli/CliConfig";
import { Effect, Exit, Option } from "effect";

export const run = async () => {
  const argSpec = Args.all({
    file: Args.text({ name: "file" }),
    count: Args.integer({ name: "count" }),
    notes: Args.optional(Args.text({ name: "notes" })),
  });

  const [leftover, parsed] = await Effect.runPromise(
    Args.validate(argSpec, ["input.json", "2"], CliConfig.defaultConfig),
  );

  assert.strictEqual(leftover.length, 0);
  assert.strictEqual(parsed.file, "input.json");
  assert.strictEqual(parsed.count, 2);
  assert.strictEqual(Option.isNone(parsed.notes), true);

  const invalidExit = await Effect.runPromiseExit(
    Args.validate(argSpec, ["input.json", "NaN"], CliConfig.defaultConfig),
  );
  assert.strictEqual(Exit.isFailure(invalidExit), true);

  return "PASS: argument validation succeeds for valid input and fails for invalid integers";
};
