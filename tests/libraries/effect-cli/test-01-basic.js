import assert from "assert";
import * as Args from "@effect/cli/Args";
import * as Command from "@effect/cli/Command";
import { Effect, HashMap, HashSet } from "effect";

export const run = async () => {
  const greet = Command.make("greet", {
    name: Args.text({ name: "name" }),
  });

  const root = Command.make("tool").pipe(Command.withSubcommands([greet]));

  const names = Command.getNames(root);
  const subcommands = Command.getSubcommands(root);

  assert.strictEqual(HashSet.has(names, "tool"), true);
  assert.strictEqual(HashMap.has(subcommands, "greet"), true);

  const bashCompletions = await Effect.runPromise(Command.getBashCompletions(root, "tool"));
  const zshCompletions = await Effect.runPromise(Command.getZshCompletions(root, "tool"));

  assert.strictEqual(
    bashCompletions.some((line) => line.includes("_tool_bash")),
    true,
  );
  assert.strictEqual(
    zshCompletions.some((line) => line.includes("#compdef tool")),
    true,
  );

  return "PASS: command tree introspection and completion generation work";
};
