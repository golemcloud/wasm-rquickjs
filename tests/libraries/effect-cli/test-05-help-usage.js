import assert from "assert";
import * as Args from "@effect/cli/Args";
import * as CliConfig from "@effect/cli/CliConfig";
import * as Command from "@effect/cli/Command";
import * as HelpDoc from "@effect/cli/HelpDoc";
import * as Options from "@effect/cli/Options";
import * as Usage from "@effect/cli/Usage";

export const run = () => {
  const serveCommand = Command.make("serve", {
    name: Args.text({ name: "name" }),
    port: Options.integer("port").pipe(Options.withAlias("p"), Options.withDefault(8080)),
    verbose: Options.boolean("verbose").pipe(Options.withAlias("v")),
  }).pipe(Command.withDescription("Serve resources"));

  const helpText = HelpDoc.toAnsiText(Command.getHelp(serveCommand, CliConfig.defaultConfig));
  assert.strictEqual(helpText.includes("(-p, --port integer)"), true);
  assert.strictEqual(helpText.includes("(-h, --help)"), true);
  assert.strictEqual(helpText.includes("<name>"), true);

  const usageText = HelpDoc.toAnsiText(Usage.getHelp(Command.getUsage(serveCommand)));
  assert.strictEqual(usageText.includes("name"), true);
  assert.strictEqual(usageText.includes("port") || usageText.includes("p"), true);

  return "PASS: help and usage documents include command arguments and built-in options";
};
