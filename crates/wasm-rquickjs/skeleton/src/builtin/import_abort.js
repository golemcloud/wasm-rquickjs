// wasm-rquickjs:import-abort
//
// The abort signal of generated async imports. `withSignal(signal, fn)` makes `signal` current
// while `fn` runs synchronously. Every async import that JavaScript calls meanwhile takes the
// signal with it: when the signal aborts before the import finishes, the import's promise rejects
// with `signal.reason` and the runtime drops the import, which cancels its component-model
// subtask.
import * as native from '__wasm_rquickjs_builtin/import_abort_native';

/**
 * Calls `fn` with `signal` current, then restores the previous signal. `undefined` and `null`
 * clear the current signal.
 */
export function withSignal(signal, fn) {
    const previous = native.enter(signal);
    try {
        return fn();
    } finally {
        native.leave(previous);
    }
}

export default { withSignal };
