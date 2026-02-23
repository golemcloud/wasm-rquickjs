import { simpleGit } from "simple-git";
import { REPO_ROOT } from "./paths.js";

const git = simpleGit(REPO_ROOT);

export async function commitProgress(category: string, targetTest: string): Promise<void> {
  console.log("  Committing progress...");
  const paths = [
    "tests/node_compat/config.jsonc",
    "crates/wasm-rquickjs/skeleton/src/",
    "tests/node_compat/common-shim/",
    "README.md",
  ];

  await git.add(paths);
  try {
    await git.commit(
      `fix(node-compat): ${category} — fix ${targetTest}\n\nAutomated fix via node-compat-fixer`,
    );
  } catch {
    console.log("  (nothing to commit)");
  }
}
