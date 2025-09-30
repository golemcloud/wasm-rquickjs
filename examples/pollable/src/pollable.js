
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
