import assert from "assert";
import fs from "fs";

export const run = () => {
  const readme = fs.readFileSync("./node_modules/crewai/README.md", "utf8");

  assert(readme.includes("import { Crew, Agent, Task } from 'crewai';"));
  assert(readme.includes("const result = crew.run();"));

  return "PASS: README advertises importable Crew/Agent/Task API usage";
};
