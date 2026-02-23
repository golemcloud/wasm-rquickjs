import { spawn } from "node:child_process";
import fs from "node:fs";
import logUpdate from "log-update";
import { REPO_ROOT } from "./paths.js";

const MAX_PREVIEW_LINES = 20;

/** Run a command, stream output to stdout (collapsing on success), tee to logfile, return { ok, output }. */
export function run(
  cmd: string[],
  logfile: string,
): Promise<{ ok: boolean; output: string }> {
  console.log(`  Log: ${logfile}`);

  return new Promise((resolve) => {
    const child = spawn(cmd[0], cmd.slice(1), {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const chunks: string[] = [];
    const previewLines: string[] = [];

    function onData(data: Buffer) {
      const text = data.toString();
      chunks.push(text);
      for (const line of text.split("\n")) {
        if (line.length > 0) {
          previewLines.push(line);
          if (previewLines.length > MAX_PREVIEW_LINES) {
            previewLines.shift();
          }
        }
      }
      logUpdate(previewLines.join("\n"));
    }

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("close", (code) => {
      const combined = chunks.join("");
      fs.writeFileSync(logfile, combined);

      const ok = code === 0;

      if (ok) {
        // Collapse: replace streaming output with a summary line
        logUpdate(`  ✓ ${cmd.join(" ")} completed successfully`);
        logUpdate.done();
      } else {
        // Keep last lines visible on failure
        logUpdate.done();
      }

      resolve({ ok, output: combined });
    });
  });
}
