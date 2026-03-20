import assert from "assert";
import * as Args from "@effect/cli/Args";
import * as Command from "@effect/cli/Command";
import * as Options from "@effect/cli/Options";
import { Effect, Exit } from "effect";

export const run = async () => {
  let captured;

  const deployCommand = Command.make(
    "deploy",
    {
      target: Args.text({ name: "target" }),
      dryRun: Options.boolean("dry-run").pipe(Options.withAlias("d")),
      retries: Options.integer("retries").pipe(Options.withDefault(1)),
    },
    (config) => Effect.sync(() => {
      captured = config;
    }),
  );

  const runCommand = Command.run(deployCommand, {
    name: "Deploy CLI",
    version: "1.0.0",
  });

  await Effect.runPromise(runCommand(["node", "deploy", "production", "-d", "--retries", "5"]));

  assert.deepStrictEqual(captured, {
    target: "production",
    dryRun: true,
    retries: 5,
  });

  const invalidExit = await Effect.runPromiseExit(runCommand(["node", "deploy", "-d"]));
  assert.strictEqual(Exit.isFailure(invalidExit), true);

  return "PASS: Command.run executes handlers and reports parse failures";
};
