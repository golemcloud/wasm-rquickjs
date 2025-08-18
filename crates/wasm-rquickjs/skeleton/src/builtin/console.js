import * as consoleNative from '__wasm_rquickjs_builtin/console_native'
import * as util from 'node:util'

export function assert(condition, ...v) {
    if (!condition) {
        warn("Assertion failed:", ...v)
    }
}

export function clear() {
    // not supported
}

const DEFAULT_LABEL = 'default';
let counts     = {};

export function count(label) {
    label = label === undefined ? DEFAULT_LABEL : label;
    if (!counts[label]) {
        counts[label] = 0;
    }
    counts[label]++;
    log(`${label}: ${counts[label]}`);
}

export function countReset(label) {
    label = label === undefined ? DEFAULT_LABEL : label;
    if (counts[label]) {
        counts[label] = 0;
    } else {
        console.warn(`Count for '${label}' does not exist`);
    }
}

export function debug(...v) {
    consoleNative.debug(util.format(...v))
}

// TODO: dir()
// TODO: dirxml()

export function error(...v) {
    consoleNative.error(util.format(...v))
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
    consoleNative.info(util.format(...v))
}

export function log(...v) {
    consoleNative.println(util.format(...v))
}

// TODO: table()
// TODO: time()
// TODO: timeEnd()
// TODO: timeLog()

export function trace(...v) {
    consoleNative.trace(util.format(...v))
}

export function warn(...v) {
    consoleNative.warn(util.format(...v))
}
