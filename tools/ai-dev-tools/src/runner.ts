import { spawn } from "node:child_process";
import fs from "node:fs";
import logUpdate from "log-update";
import { REPO_ROOT } from "./paths.js";

const MAX_PREVIEW_LINES = 20;
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const FAIL_LINE_RE = /^(?:Finished test:\s+)?\S+\s+(?:\.\.\.\s+FAILED|\[FAILED\])\s*$/;

export interface RunOptions {
  /** Kill the process on first test failure detected in output. */
  failFast?: boolean;
}

/** Run a command, stream output to stdout (collapsing on success), tee to logfile, return { ok, output }. */
export function run(
  cmd: string[],
  logfile: string,
  options?: RunOptions,
): Promise<{ ok: boolean; output: string }> {
  console.log(`  Log: ${logfile}`);

  return new Promise((resolve) => {
    const child = spawn(cmd[0], cmd.slice(1), {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

    const chunks: string[] = [];
    const previewLines: string[] = [];
    let pending = "";
    let killed = false;

    function killTree() {
      if (killed) return;
      killed = true;
      try {
        process.kill(-child.pid!, "SIGINT");
      } catch {}
      setTimeout(() => {
        try {
          process.kill(-child.pid!, "SIGKILL");
        } catch {}
      }, 1500);
    }

    function onData(data: Buffer) {
      const text = data.toString();
      chunks.push(text);

      pending += text;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";

      for (const line of lines) {
        if (line.length > 0) {
          previewLines.push(line);
          if (previewLines.length > MAX_PREVIEW_LINES) {
            previewLines.shift();
          }
        }

        if (options?.failFast && !killed) {
          const clean = line.replace(ANSI_RE, "");
          if (FAIL_LINE_RE.test(clean)) {
            killTree();
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
