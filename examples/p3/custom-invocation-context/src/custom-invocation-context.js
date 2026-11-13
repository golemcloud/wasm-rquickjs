import * as scopes from 'wasm-rquickjs:custom-invocation-context';
import {
    beginCustomDurableInvocationAsync,
    LiveCustomDurableInvocation,
} from 'golem:durability/durability@1.6.0';
import { effect, syncEffect, exchangeCount } from 'test:custom-invocation-context/effects';
import { middlewareCapture, middlewareDurable } from 'middleware';

let savedToken;

// The shape of the SDK's durableAsync: begin in the parent, enter without leaving the child
// current in the parent, run the body and finish in the child, then drop and close.
async function durableAsync(name, body) {
    const parent = scopes.capture();
    const live = await beginCustomDurableInvocationAsync(name);
    const child = scopes.run(parent, () => scopes.enterLive(live));
    try {
        const result = await scopes.run(child, () => body(child));
        await scopes.run(child, () => LiveCustomDurableInvocation.finishAsync(live));
        return result;
    } finally {
        scopes.run(child, () => live[Symbol.dispose]());
        scopes.close(child);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* generator(label) {
    yield 1;
    await effect(`${label}-gen`, 1);
    yield 2;
}

export async function run() {
    // Concurrent siblings that finish in the reverse order of their start, and a root effect
    // that starts while both wait.
    await Promise.all([
        durableAsync('a', async () => {
            await effect('a1', 30);
            await effect('a2', 0);
        }),
        durableAsync('b', async () => {
            await effect('b1', 5);
            syncEffect('b2');
        }),
        (async () => {
            await sleep(10);
            await effect('root1', 0);
        })(),
    ]);

    // Nesting.
    await durableAsync('outer', async () => {
        await durableAsync('inner', async () => {
            await effect('i1', 0);
        });
        syncEffect('o1');
    });

    // Callbacks the runtime schedules, and an async generator.
    await durableAsync('cb', async () => {
        await new Promise((resolve) => setTimeout(() => {
            syncEffect('timer');
            resolve();
        }, 5));
        await new Promise((resolve) => queueMicrotask(() => {
            syncEffect('microtask');
            resolve();
        }));
        await new Promise((resolve) => process.nextTick(() => {
            syncEffect('tick');
            resolve();
        }));
        await Promise.resolve().then(() => syncEffect('then'));
        await { then(resolve) { syncEffect('thenable'); resolve(); } };
        for await (const _ of generator('cb')) {
            syncEffect('loop');
        }
    });

    // A shared promise awaited from two scopes resumes each awaiter in its own scope.
    const shared = sleep(5);
    await Promise.all([
        durableAsync('s1', async () => { await shared; syncEffect('s1'); }),
        durableAsync('s2', async () => { await shared; syncEffect('s2'); }),
    ]);

    // A closed token resolves to its nearest open ancestor.
    let closed;
    await durableAsync('parent', async () => {
        await durableAsync('closed', async (child) => { closed = child; });
        scopes.run(closed, () => syncEffect('closed-in-parent'));
    });
    scopes.run(closed, () => syncEffect('closed-at-root'));

    // Tokens are stable, and close works while another token is current.
    const identity = await durableAsync('identity', async (child) => {
        return scopes.capture() === child;
    });

    await durableAsync('saved', async (child) => {
        savedToken = child;
        await effect('saved', 0);
    });
    syncEffect('root2');
    return JSON.stringify({ identity });
}

export async function runAfter() {
    // A token of an earlier call resolves to this call's root instead of trapping.
    scopes.run(savedToken, () => syncEffect('foreign'));
    return 'ok';
}

export async function runPlain() {
    await effect('plain1', 0);
    await Promise.resolve();
    syncEffect('plain2');
    return 'ok';
}

export async function runEdgeCases() {
    const report = {};

    await durableAsync('cb2', async (child) => {
        // setInterval keeps its registration token for every tick.
        await new Promise((resolve) => {
            let ticks = 0;
            const handle = setInterval(() => {
                syncEffect('interval');
                if (++ticks === 3) {
                    clearInterval(handle);
                    resolve();
                }
            }, 1);
        });
        // An interval that outlives its scope sleeps and runs in the nearest open ancestor.
        let late;
        await durableAsync('late', async () => {
            late = setInterval(() => syncEffect('late-tick'), 1);
        });
        await sleep(5);
        clearInterval(late);
        await new Promise((resolve) => setImmediate(() => {
            syncEffect('immediate');
            resolve();
        }));
        await Promise.race([sleep(1), new Promise(() => {})]);
        syncEffect('race');
        await sleep(1).finally(() => syncEffect('finally'));
        try {
            await Promise.reject(new Error('boom'));
        } catch {
            syncEffect('rejected');
        }

        // Nested swaps inside a job restore exactly, and swapping to the current token or running
        // in it makes no host call.
        const before = exchangeCount();
        scopes.swap(scopes.capture());
        scopes.run(child, () => syncEffect('run-current'));
        report.unchangedExchanges = exchangeCount() - before;

        // A FinalizationRegistry job queued inside a scope runs at the root.
        const finalized = new Promise((resolve) => {
            const registry = new FinalizationRegistry(() => {
                syncEffect('finalized');
                resolve();
            });
            (() => { registry.register({}, 'held'); })();
            globalThis.registryRef = registry;
        });
        gc();
        await Promise.race([finalized, sleep(50)]);
    });

    // A scope with an open child cannot be closed.
    await durableAsync('p2', async (parentToken) => {
        const live = await beginCustomDurableInvocationAsync('c2');
        const childToken = scopes.run(parentToken, () => scopes.enterLive(live));
        try {
            scopes.close(parentToken);
            report.closeWithChild = 'closed';
        } catch (error) {
            report.closeWithChild = 'refused';
        }
        await scopes.run(childToken, () => LiveCustomDurableInvocation.finishAsync(live));
        scopes.run(childToken, () => live[Symbol.dispose]());
        scopes.close(childToken);
    });

    // A second bundle shares the runtime's cell: it sees the same token, and the scopes it opens
    // are visible here.
    await durableAsync('main', async (child) => {
        report.sharedToken = middlewareCapture() === child;
        await middlewareDurable('mw', async (mwToken) => {
            report.sharedChild = scopes.capture() === mwToken;
            await effect('mw1', 0);
        });
    });
    return JSON.stringify(report);
}

// The first scope of a fresh runtime opens while root work is already queued. The scope is
// entered directly, without `run`, so it stays current until this job ends.
export async function runFirstScope() {
    const live = await beginCustomDurableInvocationAsync('first');
    queueMicrotask(() => syncEffect('first-microtask'));
    process.nextTick(() => syncEffect('first-tick'));
    const timer = new Promise((resolve) => setTimeout(() => {
        syncEffect('first-timer');
        resolve();
    }, 0));
    const child = scopes.enterLive(live);
    await effect('first-child', 5);
    await LiveCustomDurableInvocation.finishAsync(live);
    live[Symbol.dispose]();
    scopes.close(child);
    await timer;
    syncEffect('first-after');
    return 'ok';
}
