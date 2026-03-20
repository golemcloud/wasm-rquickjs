import assert from "assert";
import fs from "fs";

export const run = () => {
  const manifest = JSON.parse(fs.readFileSync("./node_modules/crewai/package.json", "utf8"));

  assert.strictEqual(manifest.name, "crewai");
  assert.strictEqual(manifest.version, "1.0.1");
  assert.strictEqual(manifest.type, "module");
  assert.strictEqual(manifest.main, "src/crewai/cli/cli.ts");
  assert.strictEqual(manifest.bin?.crew, "src/crewai/cli/cli.ts");

  return "PASS: package manifest points to TypeScript CLI as the root entrypoint";
};
