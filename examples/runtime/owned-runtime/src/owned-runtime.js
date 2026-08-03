import { runJavaScript, spawnJavaScript } from 'golem:code-runner';
import { ownedRuntimeIsolationProbe } from 'golem:code-runner-test';

export async function run() {
    const live = spawnJavaScript({ source: `
        console.log('live:first');
        await new Promise(resolve => setTimeout(resolve, 1));
        console.log('live:last');
        return { label: process.env.LABEL, argv: process.argv };
    `, env: { LABEL: 'live' }, argv: ['runner', 'live'] });
    const ordering = [];
    let liveStdout = '';
    live.stdout.setEncoding('utf8');
    live.stdout.on('data', chunk => { liveStdout += chunk; ordering.push('data'); });
    const liveResult = await live.result;
    ordering.push('result');

    const [left, right] = await Promise.all([
        runJavaScript({ source: `console.log(process.env.LABEL); return process.env.LABEL;`, env: { LABEL: 'left' } }),
        runJavaScript({ source: `console.log(process.env.LABEL); return process.env.LABEL;`, env: { LABEL: 'right' } }),
    ]);
    let timeoutError;
    try {
        await runJavaScript({ source: `await new Promise(() => {});`, timeoutMs: 5 });
    } catch (error) {
        timeoutError = error.message;
    }
    let overflowError;
    try {
        await runJavaScript({
            source: `console.log('123456'); await new Promise(() => {});`, maxBytes: 4,
        });
    } catch (error) {
        overflowError = error.message;
    }
    const truncated = await runJavaScript({
        source: `console.log('ééé'); return 'ok';`, maxBytes: 5, overflow: 'truncate',
    });
    await runJavaScript({ source: `
        const { mkdirSync, writeFileSync } = await import('node:fs');
        mkdirSync('/tmp', { recursive: true });
        writeFileSync('/tmp/code-runner-entry.mjs',
          "export async function run() { console.log('entry'); return { kind: 'entry' }; }");
    ` });
    const entry = await runJavaScript({ entry: '/tmp/code-runner-entry.mjs' });
    const cancelledJob = spawnJavaScript({ source: `
        await new Promise(() => {});
    ` });
    setTimeout(() => cancelledJob.cancel(), 1);
    let cancellationError;
    try {
        await cancelledJob.result;
    } catch (error) {
        cancellationError = error.message;
    }
    const nested = await runJavaScript({ source: `
        const { spawnJavaScript } = await import('golem:code-runner');
        try {
            spawnJavaScript({ source: "return 'nested';" });
        } catch (error) {
            return error.message;
        }
    ` });
    const heldJobs = Array.from({ length: 8 }, () => spawnJavaScript({
        source: `await new Promise(() => {});`,
    }));
    let capacityError;
    try {
        spawnJavaScript({ source: `return 'ninth';` });
    } catch (error) {
        capacityError = error.message;
    }
    for (const job of heldJobs) job.cancel();
    await Promise.allSettled(heldJobs.map(job => job.result));
    const reclaimed = await runJavaScript({ source: `return 'reclaimed';` });
    const isolation = JSON.parse(await ownedRuntimeIsolationProbe());
    return JSON.stringify({
        liveStdout, liveResult, ordering, left, right,
        timeoutError, overflowError, truncated, entry, cancellationError,
        nested, capacityError, reclaimed, isolation,
    });
}
