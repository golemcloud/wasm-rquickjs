import { terminalProbe, runProcess, startProcess, runJavaScript } from 'wasm-rquickjs:execution';
import { mkdirSync, writeFileSync } from 'node:fs';

export async function run(source) {
    return await terminalProbe(source);
}

export async function processRun(options) {
    const argv = process.argv;
    const cwd = process.cwd();
    try {
        const parsed = JSON.parse(options);
        if (parsed.entry === '/tmp/owned-process/entry.cjs') {
            mkdirSync('/tmp/owned-process', { recursive: true });
            writeFileSync(parsed.entry, 'console.log(process.cwd());setTimeout(()=>console.log("entry"),5);process.exitCode=4');
        }
        const result = await runProcess(parsed);
        return JSON.stringify({ ...result, stdout: Array.from(result.stdout), stderr: Array.from(result.stderr),
            parentUnchanged: process.argv === argv && process.cwd() === cwd });
    } catch (error) {
        return JSON.stringify({ error: String(error), parentUnchanged: process.argv === argv && process.cwd() === cwd });
    }
}

export async function processRecovery() {
    const child = startProcess({ source: 'setInterval(()=>{},1000)' });
    const completion = child.result.catch(error => String(error));
    setTimeout(() => child.cancel(), 5);
    const cancelled = await completion;
    let timeout;
    try { await runProcess({ source: 'for(;;){}', timeoutMs: 10 }); }
    catch (error) { timeout = String(error); }
    const results = await Promise.all([
        runProcess({ source: 'globalThis.marker=1;setTimeout(()=>console.log("first"),5)' }),
        runProcess({ source: 'console.log(typeof globalThis.marker);process.exit(7)' }),
    ]);
    const value = await runJavaScript({ source: 'return 42' });
    return JSON.stringify({ cancelled, timeout, codes: results.map(result => result.exitCode),
        outputs: results.map(result => result.stdout.toString()), value: value.value });
}
