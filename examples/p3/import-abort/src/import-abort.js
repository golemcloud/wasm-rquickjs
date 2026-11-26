import { withSignal } from 'wasm-rquickjs:import-abort';
import { wait, waitResult, consume, hold, takeFuture, Timer } from 'test:import-abort/host';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function settle(promise) {
    try {
        return { value: await promise };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}

// Starts `call` with a fresh signal current, aborts the signal after `ms` and settles the call.
async function abortAfter(label, ms, call) {
    const controller = new AbortController();
    const promise = withSignal(controller.signal, call);
    await sleep(ms);
    controller.abort(new Error(`stop-${label}`));
    return settle(promise);
}

async function* bytes() {
    yield 1;
    yield 2;
    yield 3;
}

// A JS stream source that records how many items the runtime pulled from it, whether it ran to
// its end, and whether its `finally` block ran (on its end or on `return()`).
function source() {
    const state = { pulled: 0, exhausted: false, closed: false };
    state.iterable = (async function* () {
        try {
            for (let item = 1; item <= 3; item++) {
                state.pulled = item;
                yield item;
            }
            state.exhausted = true;
        } finally {
            state.closed = true;
        }
    })();
    return state;
}

function sourceOutcome(outcome, state) {
    return { ...outcome, pulled: state.pulled, exhausted: state.exhausted, closed: state.closed };
}

// An AbortSignal-like object that counts its abort listeners. `abort` removes the listeners
// registered with `once`, as `AbortSignal` does.
function countingSignal() {
    const listeners = new Set();
    const signal = {
        aborted: false,
        reason: undefined,
        addEventListener(type, listener, options) {
            if (type === 'abort') {
                listeners.add({ listener, once: Boolean(options && options.once) });
            }
        },
        removeEventListener(type, listener) {
            for (const entry of listeners) {
                if (type === 'abort' && entry.listener === listener) {
                    listeners.delete(entry);
                }
            }
        },
        abort(reason) {
            signal.aborted = true;
            signal.reason = reason;
            for (const entry of [...listeners]) {
                if (entry.once) {
                    listeners.delete(entry);
                }
                entry.listener();
            }
        },
        count() {
            return listeners.size;
        },
    };
    return signal;
}

// Calls `call` with a counting signal current. It reports the listener count once the import
// runs and after the import settled. With `abortAfterMs` the signal aborts after that delay.
async function countListeners(label, call, abortAfterMs) {
    const signal = countingSignal();
    const promise = withSignal(signal, call);
    await sleep(5);
    const during = signal.count();
    if (abortAfterMs !== undefined) {
        await sleep(abortAfterMs);
        signal.abort(new Error(`stop-${label}`));
    }
    const outcome = await settle(promise);
    return { ...outcome, during, after: signal.count() };
}

export async function run() {
    const outcomes = {};

    outcomes.free = await abortAfter('free', 20, () => wait('free', 10000));
    outcomes.result = await abortAfter('result', 20, () => waitResult('result', 10000));
    const timer = new Timer();
    outcomes.method = await abortAfter('method', 20, () => timer.wait('method', 10000));
    outcomes.static = await abortAfter('static', 20, () => Timer.waitStatic('static', 10000));
    outcomes.keyword = await settle(timer.await_('keyword', 1));
    outcomes.deferred = await abortAfter('deferred', 20, () => consume('deferred', bytes(), 10000));

    // An aborted signal rejects without starting the import.
    const aborted = new AbortController();
    aborted.abort(new Error('stop-pre'));
    outcomes.pre = await settle(withSignal(aborted.signal, () => wait('pre', 0)));
    const preDeferredSource = source();
    outcomes.preDeferred = sourceOutcome(
        await settle(
            withSignal(aborted.signal, () => consume('pre-deferred', preDeferredSource.iterable, 0)),
        ),
        preDeferredSource,
    );

    // A JS stream source that the host keeps without reading is closed when the abort cancels
    // the import.
    const heldSource = source();
    const held = await abortAfter('held', 20, () => hold('held', heldSource.iterable, 10000));
    await sleep(50);
    outcomes.held = sourceOutcome(held, heldSource);

    // A signal that aborts after the parameters were lowered but before the runtime first polls
    // the import starts no host call, and the lowered stream is closed.
    const prePoll = new AbortController();
    const prePollSource = source();
    const prePollCall = withSignal(prePoll.signal, () =>
        hold('pre-poll', prePollSource.iterable, 10000),
    );
    prePoll.abort(new Error('stop-pre-poll'));
    const prePollOutcome = await settle(prePollCall);
    await sleep(50);
    outcomes.prePoll = sourceOutcome(prePollOutcome, prePollSource);

    // A signal that aborts while the parameters are lowered starts no host call. The `then`
    // getter runs synchronously when the runtime lowers the stream source.
    const lowering = new AbortController();
    const loweringSource = source();
    const loweringValue = {
        get then() {
            lowering.abort(new Error('stop-lowering'));
            return undefined;
        },
        [Symbol.asyncIterator]() {
            return loweringSource.iterable;
        },
    };
    const loweringOutcome = await settle(
        withSignal(lowering.signal, () => hold('lowering', loweringValue, 10000)),
    );
    await sleep(50);
    outcomes.lowering = sourceOutcome(loweringOutcome, loweringSource);

    // An import that finishes first is not affected by a later abort.
    const late = new AbortController();
    outcomes.finished = await settle(withSignal(late.signal, () => wait('finished', 1)));
    outcomes.finishedDeferred = await settle(
        withSignal(late.signal, () => consume('finished-deferred', bytes(), 1)),
    );
    late.abort(new Error('stop-late'));

    // Only imports called synchronously inside `withSignal` take the signal, and an inner
    // `withSignal` restores the outer signal when it returns.
    const outer = new AbortController();
    const inner = new AbortController();
    let nestedInner;
    let nestedOuter;
    let afterAwait;
    withSignal(outer.signal, () => {
        withSignal(inner.signal, () => {
            nestedInner = wait('nested-inner', 30);
        });
        nestedOuter = wait('nested-outer', 10000);
        afterAwait = (async () => {
            await Promise.resolve();
            return wait('after-await', 30);
        })();
    });
    const unsignalled = wait('unsignalled', 30);
    await sleep(10);
    outer.abort(new Error('stop-outer'));
    outcomes.nestedInner = await settle(nestedInner);
    outcomes.nestedOuter = await settle(nestedOuter);
    outcomes.afterAwait = await settle(afterAwait);
    outcomes.unsignalled = await settle(unsignalled);

    // An exception from `fn` propagates out of `withSignal` and restores the signal that was
    // current before.
    const throwOuter = new AbortController();
    let thrownInner;
    let throwOuterCall;
    withSignal(throwOuter.signal, () => {
        try {
            withSignal(new AbortController().signal, () => {
                throw new Error('boom-inner');
            });
        } catch (error) {
            thrownInner = error.message;
        }
        throwOuterCall = wait('throw-outer', 10000);
    });
    const throwTop = new AbortController();
    let thrownTop;
    try {
        withSignal(throwTop.signal, () => {
            throw new Error('boom-top');
        });
    } catch (error) {
        thrownTop = error.message;
    }
    const afterThrow = wait('after-throw', 30);
    await sleep(10);
    throwOuter.abort(new Error('stop-throw-outer'));
    throwTop.abort(new Error('stop-throw-top'));
    outcomes.thrownInner = thrownInner;
    outcomes.throwOuter = await settle(throwOuterCall);
    outcomes.thrownTop = thrownTop;
    outcomes.afterThrow = await settle(afterThrow);

    // No abort listener stays on the signal after the import settled, for both bridge kinds,
    // whether the import finished or was aborted, and when a parameter fails to convert.
    outcomes.listeners = {
        freeFinished: await countListeners('count-free-finished', () =>
            wait('count-free-finished', 30),
        ),
        freeAborted: await countListeners(
            'count-free-aborted',
            () => wait('count-free-aborted', 10000),
            10,
        ),
        deferredFinished: await countListeners('count-deferred-finished', () =>
            consume('count-deferred-finished', bytes(), 30),
        ),
        deferredAborted: await countListeners(
            'count-deferred-aborted',
            () => consume('count-deferred-aborted', bytes(), 10000),
            10,
        ),
    };
    const badSignal = countingSignal();
    const badFuture = {
        get then() {
            throw new Error('bad-future');
        },
    };
    let badError;
    try {
        withSignal(badSignal, () => takeFuture('count-bad-future', badFuture, 0));
    } catch (error) {
        badError = error instanceof Error ? error.message : String(error);
    }
    outcomes.listeners.conversionError = { error: badError, after: badSignal.count() };

    return JSON.stringify(outcomes);
}
