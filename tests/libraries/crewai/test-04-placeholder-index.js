import assert from "assert";
import fs from "fs";

export const run = () => {
  const indexSource = fs.readFileSync("./node_modules/crewai/index.js", "utf8");

  assert(indexSource.includes("Package placeholder"));
  assert(!/export\s/.test(indexSource), "placeholder index should not export runtime API");

  return "PASS: index.js is a placeholder script with no exported library API";
};
