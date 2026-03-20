import assert from "assert";
import fs from "fs";

export const run = () => {
  const cliSource = fs.readFileSync("./node_modules/crewai/src/crewai/cli/cli.ts", "utf8");

  assert(cliSource.includes("const program: Command"));
  assert(cliSource.includes("interface CreateOptions"));
  assert(cliSource.includes("program.parse(process.argv);"));

  return "PASS: shipped CLI source contains TypeScript-only syntax and declarations";
};
