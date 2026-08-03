import { create_job, start_job, poll_job, cancel_job, forget_job } from '__wasm_rquickjs_builtin/code_runner_native';
import { PassThrough } from 'node:stream';
import { deserialize } from '__wasm_rquickjs_builtin/structured_clone';

function normalize(options) {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const hasEntry = typeof options.entry === 'string';
  const hasSource = typeof options.source === 'string';
  if (hasEntry === hasSource) throw new TypeError('exactly one of entry or source is required');
  const overflow = options.overflow ?? 'terminate';
  if (overflow !== 'terminate' && overflow !== 'truncate') throw new TypeError('overflow must be terminate or truncate');
  return {
    entry: options.entry, source: options.source, cwd: options.cwd ?? process.cwd(),
    argv: options.argv ?? [], env: options.env ?? {}, timeoutMs: options.timeoutMs,
    maxBytes: options.maxBytes ?? 1024 * 1024, overflow,
  };
}

export function spawnJavaScript(options) {
  const optionsJson = JSON.stringify(normalize(options));
  const id = create_job(optionsJson);
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let settled = false;
  let resolveResult;
  let rejectResult;
  const result = new Promise((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
  const fail = error => {
    if (settled) return;
    settled = true;
    stdout.destroy();
    stderr.destroy();
    forget_job(id);
    rejectResult(error);
  };
  // Deliberately do not await: calling an async native function creates a
  // rquickjs-owned promise immediately, while this public function stays sync.
  // Completion and output are observed through the job registry below.
  start_job(id).catch(fail);
  const drain = () => {
    if (settled) return;
    let state;
    try { state = JSON.parse(poll_job(id)); }
    catch (error) { fail(error); return; }
    for (const chunk of state.stdout) stdout.write(chunk);
    for (const chunk of state.stderr) stderr.write(chunk);
    if (!state.done) { setTimeout(drain, 1); return; }
    settled = true;
    stdout.end(); stderr.end(); forget_job(id);
    if (state.error !== null) rejectResult(new Error(state.error));
    else {
      try { resolveResult({ value: deserialize(JSON.parse(state.value)), overflowed: state.overflowed }); }
      catch (error) { rejectResult(error); }
    }
  };
  setTimeout(drain, 1);
  return { stdout, stderr, result, cancel: () => cancel_job(id) };
}

export async function runJavaScript(options) {
  const job = spawnJavaScript(options);
  let stdout = '';
  let stderr = '';
  job.stdout.setEncoding('utf8'); job.stderr.setEncoding('utf8');
  job.stdout.on('data', chunk => { stdout += chunk; });
  job.stderr.on('data', chunk => { stderr += chunk; });
  const structured = await job.result;
  return { stdout, stderr, ...structured };
}

export default { spawnJavaScript, runJavaScript };
