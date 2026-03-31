
import * as poll from 'wasi:io/poll@0.2.3';
import * as monotonicClock from 'wasi:clocks/monotonic-clock@0.2.3';

export const test = async () => {
    let nanos = BigInt(2 * 1000 * 1000 * 1000);
    let pollable = monotonicClock.subscribeDuration(nanos)
    let before = monotonicClock.now();
    await pollable.promise();
    let after = monotonicClock.now();
    return after - before;
};

// Test: abortablePromise with already-aborted signal rejects immediately
export const testAbortableAlreadyAborted = async () => {
    let nanos = BigInt(10 * 1000 * 1000 * 1000); // 10 seconds
    let pollable = monotonicClock.subscribeDuration(nanos);
    let signal = AbortSignal.abort('already aborted');

    let before = monotonicClock.now();
    try {
        await pollable.abortablePromise(signal);
        console.log('ERROR: should have thrown');
    } catch (e) {
        let after = monotonicClock.now();
        let elapsed = Number(after - before) / 1_000_000; // ms
        console.log(`caught: ${e}`);
        console.log(`elapsed_ms: ${elapsed}`);
        // Should be nearly instant (< 100ms), not 10 seconds
        console.log(`fast: ${elapsed < 100}`);
    }
};

// Test: abortablePromise resolves normally when not aborted
export const testAbortableNotAborted = async () => {
    let nanos = BigInt(100 * 1000 * 1000); // 100ms
    let pollable = monotonicClock.subscribeDuration(nanos);
    let controller = new AbortController();

    let before = monotonicClock.now();
    await pollable.abortablePromise(controller.signal);
    let after = monotonicClock.now();
    let elapsed = Number(after - before) / 1_000_000; // ms
    console.log(`elapsed_ms: ${elapsed}`);
    console.log(`resolved: ${elapsed >= 90}`); // should have waited ~100ms
};

// Test: abortablePromise aborted mid-wait via setTimeout
export const testAbortableMidWait = async () => {
    let nanos = BigInt(10 * 1000 * 1000 * 1000); // 10 seconds
    let pollable = monotonicClock.subscribeDuration(nanos);
    let controller = new AbortController();

    // Abort after 50ms
    setTimeout(() => {
        controller.abort('timeout abort');
    }, 50);

    let before = monotonicClock.now();
    try {
        await pollable.abortablePromise(controller.signal);
        console.log('ERROR: should have thrown');
    } catch (e) {
        let after = monotonicClock.now();
        let elapsed = Number(after - before) / 1_000_000; // ms
        console.log(`caught: ${e}`);
        console.log(`elapsed_ms: ${elapsed}`);
        // Should abort quickly (< 500ms), not wait 10 seconds
        console.log(`fast: ${elapsed < 500}`);
    }
};

// Test: race pattern - winner resolves, loser is aborted
export const testAbortableRace = async () => {
    // Create two pollables with different durations
    let fastNanos = BigInt(100 * 1000 * 1000);  // 100ms
    let slowNanos = BigInt(10 * 1000 * 1000 * 1000); // 10 seconds

    let fastPollable = monotonicClock.subscribeDuration(fastNanos);
    let slowPollable = monotonicClock.subscribeDuration(slowNanos);

    let controller = new AbortController();

    let before = monotonicClock.now();

    // Race: fast pollable vs slow abortable pollable
    let result = await Promise.race([
        fastPollable.promise().then(() => {
            controller.abort('fast won');
            return 'fast';
        }),
        slowPollable.abortablePromise(controller.signal).then(() => 'slow').catch(e => 'aborted'),
    ]);

    let after = monotonicClock.now();
    let elapsed = Number(after - before) / 1_000_000; // ms

    console.log(`winner: ${result}`);
    console.log(`elapsed_ms: ${elapsed}`);
    // Should complete in ~100ms (fast wins), not 10 seconds
    console.log(`fast: ${elapsed < 1000}`);
};
