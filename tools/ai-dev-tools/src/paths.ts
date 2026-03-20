import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
export const CONFIG_PATH = path.join(REPO_ROOT, "tests", "node_compat", "config.jsonc");
export const SUITE_DIR = path.join(REPO_ROOT, "tests", "node_compat", "suite", "parallel");
export const LOG_DIR = path.join(REPO_ROOT, "tmp", "fix-node-compat-logs");
