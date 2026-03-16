import { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } from '__wasm_rquickjs_builtin/timeout';
import { setTimeout as pSetTimeout, setImmediate as pSetImmediate, setInterval as pSetInterval } from 'node:timers/promises';

export { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate };
export const promises = { setTimeout: pSetTimeout, setImmediate: pSetImmediate, setInterval: pSetInterval };

const TIMEOUT_MAX = 2 ** 31 - 1;

export function enroll(item, msecs) {
    if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
        process.emitWarning('timers.enroll() is deprecated. Please use setTimeout instead.', 'DeprecationWarning', 'DEP0095');
    }
    const delay = +msecs;
    if (delay > TIMEOUT_MAX) {
        if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
            process.emitWarning(`${msecs} does not fit into a 32-bit signed integer.\nTimer duration was truncated to ${TIMEOUT_MAX}.`, 'TimeoutOverflowWarning');
        }
        item._idleTimeout = TIMEOUT_MAX;
    } else if (!(delay >= 1)) {
        item._idleTimeout = 1;
    } else {
        item._idleTimeout = Math.trunc(delay);
    }
    item._idleStart = Date.now();
}

export function active(item) {
    if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
        process.emitWarning('timers.active() is deprecated. Please use setTimeout instead.', 'DeprecationWarning', 'DEP0096');
    }
    if (item._onTimeout && item._idleTimeout >= 0) {
        if (item.__timerHandle) {
            clearTimeout(item.__timerHandle);
        }
        item.__timerHandle = setTimeout(item._onTimeout, item._idleTimeout);
    }
}

export function unenroll(item) {
    if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
        process.emitWarning('timers.unenroll() is deprecated. Please use clearTimeout instead.', 'DeprecationWarning', 'DEP0096');
    }
    if (item.__timerHandle) {
        clearTimeout(item.__timerHandle);
        item.__timerHandle = null;
    }
    item._idleTimeout = -1;
}

export default { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate, promises, active, unenroll, enroll };
