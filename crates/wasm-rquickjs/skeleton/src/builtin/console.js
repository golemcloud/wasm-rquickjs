import * as consoleNative from '__wasm_rquickjs_builtin/console_native'

export function assert(condition, ...v) {
    if (!condition) {
        log("Assertion failed:", ...v)
    }
}

export function clear() {
    // not supported
}

// TODO: count()
// TODO: countReset()
export function debug(...v) {
    // TODO: add native function for various log levels, and optionally wire to wasi:logging
    log(...v)
}

// TODO: dir()
// TODO: dirxml()

export function error(...v) {
    // TODO: add native function for various log levels, and optionally wire to wasi:logging
    log(...v)
}

export function group(label) {
    if (label !== undefined) {
        log(label)
    }
}

export function groupCollapsed(label) {
    if (label !== undefined) {
        log(label)
    }
}

export function groupEnd() {
}

export function info(...v) {
    // TODO: add native function for various log levels, and optionally wire to wasi:logging
    log(...v)
}

export function log(...v) {
    // TODO: support string substitutions: https://developer.mozilla.org/en-US/docs/Web/API/console#using_string_substitutions
    consoleNative.println(`${v.join(" ")}`)
}

// TODO: table()
// TODO: time()
// TODO: timeEnd()
// TODO: timeLog()

export function trace(...v) {
    // TODO: add native function for various log levels, and optionally wire to wasi:logging
    log(...v)
}

export function warn(...v) {
    // TODO: add native function for various log levels, and optionally wire to wasi:logging
    log(...v)
}
