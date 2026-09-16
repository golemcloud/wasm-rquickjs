export const TIMEOUT_MAX = 2 ** 31 - 1;

import { ERR_OUT_OF_RANGE } from '__wasm_rquickjs_builtin/internal/errors';
import { validateNumber } from '__wasm_rquickjs_builtin/internal/validators';

// Shared by timers.enroll() and stream setTimeout(), matching Node's
// internal getTimerDuration contract. Actual timer scheduling owns the
// minimum-one-millisecond and integer conversion rules.
export function getTimerDuration(msecs, name) {
    validateNumber(msecs, name);
    if (msecs < 0 || !Number.isFinite(msecs)) {
        throw new ERR_OUT_OF_RANGE(name, 'a non-negative finite number', msecs);
    }
    if (msecs > TIMEOUT_MAX) {
        if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
            process.emitWarning(
                `${msecs} does not fit into a 32-bit signed integer.\n` +
                `Timer duration was truncated to ${TIMEOUT_MAX}.`,
                'TimeoutOverflowWarning',
            );
        }
        return TIMEOUT_MAX;
    }
    return msecs;
}

// Convert a validated stream duration for Rust's integer P2 deadline. The
// ordinary JS timer performs this same scheduling conversion internally.
export function toTimerDelay(msecs) {
    return Math.max(1, Math.trunc(msecs));
}
