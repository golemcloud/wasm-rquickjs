// wasm-rquickjs:custom-invocation-context
//
// The scope of the golem:durability custom invocation that work belongs to. The runtime keeps
// one current token: promise reactions (including `await`), timers, `setImmediate`,
// `process.nextTick`, `queueMicrotask` and async imports run in the token that was current when
// they were registered or called. SDKs switch tokens with `swap`/`run` and open scopes with
// `enterLive`; they never call `exchange-custom-invocation-context` themselves.
import * as native from '__wasm_rquickjs_builtin/custom_invocation_context_native';

const nativeSwap = native.swap;

/** Returns the token of the current scope. */
export function capture() {
    return native.capture();
}

/** Makes `next` current and returns the token that was current. */
export function swap(next) {
    return nativeSwap(next);
}

/** Calls `fn` with `token` current, then restores the previous token. */
export function run(token, fn) {
    const previous = nativeSwap(token);
    try {
        return fn();
    } finally {
        nativeSwap(previous);
    }
}

/**
 * Opens the scope of a live custom durable invocation returned by asynchronous begin. Call it in
 * the parent's scope. It calls `live.enter()`, makes the new scope current and returns its token.
 */
export function enterLive(live) {
    return native.enter_live(live);
}

/**
 * Closes a scope after its live invocation finished or was dropped. Throws while the scope has
 * open child scopes. Work that later runs in a closed token runs in its nearest open ancestor.
 */
export function close(token) {
    native.close(token);
}

export default { capture, swap, run, enterLive, close };
