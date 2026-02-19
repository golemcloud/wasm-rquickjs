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
let counts = {};

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

function _getStdout() {
    const c = globalThis.console;
    return c && c._stdout ? c._stdout : null;
}

function _getStderr() {
    const c = globalThis.console;
    return c && c._stderr ? c._stderr : null;
}

export function debug(...v) {
    const msg = util.format(...v);
    const s = _getStdout();
    if (s) { s.write(msg + '\n'); } else { consoleNative.debug(msg); }
}

export function dir(object, options) {
    let msg;
    try {
        const result = util.inspect(object, options);
        msg = result !== undefined ? result : 'undefined';
    } catch (e) {
        msg = e instanceof TypeError && /revoked proxy/i.test(e.message)
            ? '<Revoked Proxy>' : `[Unable to inspect: ${e.message}]`;
    }
    const s = _getStdout();
    if (s) { s.write(msg + '\n'); } else { consoleNative.println(msg); }
}

export function dirxml(object) {
    dir(object);
}

export function error(...v) {
    const msg = util.format(...v);
    const s = _getStderr();
    if (s) { s.write(msg + '\n'); } else { consoleNative.error(msg); }
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
    const msg = util.format(...v);
    const s = _getStdout();
    if (s) { s.write(msg + '\n'); } else { consoleNative.info(msg); }
}

export function log(...v) {
    let msg;
    try {
        msg = util.format(...v);
    } catch (e) {
        msg = `[Unable to format: ${e.message}]`;
    }
    const s = _getStdout();
    if (s) { s.write(msg + '\n'); } else { consoleNative.println(msg); }
}

export function table(data, keys) {
    console.log(printTable(data, keys));
}

let timers = {}

export function time(label) {
    label = label === undefined ? DEFAULT_LABEL : label;
    const start = consoleNative.timestamp();
    timers[label] = start;
}

export function timeLog(label, ...v) {
    label = label === undefined ? DEFAULT_LABEL : label;
    const start = timers[label];
    if (start === undefined) {
        warn(`No such timer label: ${label}`);
        return;
    }
    const now = consoleNative.timestamp();
    const diff = now - start;
    log(`${label}: ${diff}ms`, ...v);
}

export function timeEnd(label) {
    label = label === undefined ? DEFAULT_LABEL : label;
    const start = timers[label];
    if (start === undefined) {
        warn(`No such timer label: ${label}`);
        return;
    }
    const now = consoleNative.timestamp();
    const diff = now - start;
    log(`${label}: ${diff}ms - timer ended`);
    delete timers[label];
}

export function trace(...v) {
    const msg = util.format(...v);
    const s = _getStderr();
    if (s) { s.write(msg + '\n'); } else { consoleNative.trace(msg); }
}

export function warn(...v) {
    const msg = util.format(...v);
    const s = _getStderr();
    if (s) { s.write(msg + '\n'); } else { consoleNative.warn(msg); }
}

// table rendering based on https://github.com/ronnyKJ/consoleTable

var SEPARATOR = '│';

/**
 * Repeat provided string a given no. of times.
 * @param  {number} amount Number of times to repeat.
 * @param  {string} str    Character(s) to repeat
 * @return {string}        Repeated string.
 */
function repeatString(amount, str) {
    str = str || ' ';
    return Array.apply(0, Array(amount)).join(str);
}

/**
 * Formats certain type of values for more readability.
 * @param  {...}  value         Value to format.
 * @param  {Boolean} isHeaderValue Is this a value in the table header.
 * @return {string}                Formatted value.
 */
function getFormattedString(value, isHeaderValue) {
    if (isHeaderValue) {
    } else if (typeof value === 'string') {
        // Wrap strings in inverted commans.
        return value;
    } else if (typeof value === 'function') {
        // Just show `function` for a function.
        return 'function';
    }
    return value + '';
}

/**
 * Colorize and format given value.
 * @param  {...}  value         Value to colorize.
 * @param  {Boolean} isHeaderValue Is this a value in the table header.
 * @return {string}                Colorized + formatted value.
 */
function getColoredAndFormattedString(value, isHeaderValue) {
    value = getFormattedString(value, isHeaderValue);
    return value + '';
}

function printRows(rows) {
    if (!rows.length) return;
    let row, rowString,
        i, j,
        padding,
        tableWidth = 0,
        numCols = rows[0].length;

    // For every column, calculate the maximum width in any row.
    for (j = 0; j < numCols; j++) {
        let maxLengthForColumn = 0;
        for (i = 0; i < rows.length; i++) {
            maxLengthForColumn = Math.max(getFormattedString(rows[i][j], !i || !j).length, maxLengthForColumn);
        }
        // Give some more padding to biggest string.
        maxLengthForColumn += 4;
        tableWidth += maxLengthForColumn;

        // Give padding to rows for current column.
        for (i = 0; i < rows.length; i++) {
            padding = maxLengthForColumn - getFormattedString(rows[i][j], !i || !j).length;
            // Distribute padding - 1 in starting, rest at the end.
            rows[i][j] = ' ' + getColoredAndFormattedString(rows[i][j], !i || !j) + repeatString(padding - 1);
        }
    }

    // HACK: Increase table width just by 1 to make it look good.
    tableWidth += 1;

    let output = [];
    output.push(repeatString(tableWidth, '='))
    for (i = 0; i < rows.length; i++) {
        row = rows[i];
        rowString = '';
        for (j = 0; j < row.length; j++) {
            rowString += row[j] + SEPARATOR;
        }
        output.push(rowString);
        // Draw border after table header.
        if (!i) {
            output.push(repeatString(tableWidth, '-'))
        }
    }
    output.push(repeatString(tableWidth, '='));
    return output.join('\n');
}

function printTable(data, keys) {
    let i, j, rows = [], row, entry,
        objKeys,
        tempData;

    // Simply console.log if an `object` type wasn't passed.
    if (typeof data !== 'object') {
        console.log(data);
        return;
    }

    // If an object was passed, create data from its properties instead.
    if (!(data instanceof Array)) {
        tempData = [];
        // `objKeys` are now used to index every row.
        objKeys = Object.keys(data);
        for (const key in data) {
            // Avoiding `hasOwnProperty` check because Chrome shows prototype properties
            // as well.
            tempData.push(data[key]);
        }
        data = tempData;
    }
    // Wrapping data in nested arrays if it is unnested
    tempData = [];
    for (j = 0; j < data.length; j++) {
        const entry = data[j];
        if (!(entry instanceof Array) && !(entry instanceof Object)) {
            // If entry is not an array or object, wrap it in an array.
            tempData.push([entry]);
        } else {
            // Otherwise, just push the entry as it is.
            tempData.push(entry);
        }
    }
    data = tempData;

    // Get the keys from first data entry if custom keys are not passed.
    if (!keys) {
        keys = Object.keys(data[0]);
        keys.sort();
    }

    // Create header row.
    rows.push([]);
    row = rows[rows.length - 1];
    row.push('(index)');
    for (i = 0; i < keys.length; i++) {
        row.push(keys[i]);
    }

    for (j = 0; j < data.length; j++) {
        entry = data[j];
        rows.push([]);
        row = rows[rows.length - 1];
        // Push entry for 1st column (index).
        row.push(objKeys ? objKeys[j] : j);
        for (i = 0; i < keys.length; i++) {
            row.push(entry[keys[i]]);
        }
    }

    return printRows(rows);
}

const _METHODS_TO_BIND = [
    'log', 'info', 'warn', 'error', 'debug',
    'dir', 'dirxml', 'trace', 'assert', 'clear',
    'count', 'countReset', 'group', 'groupCollapsed', 'groupEnd',
    'table', 'time', 'timeLog', 'timeEnd',
];

export function Console(stdout, stderr, ignoreErrors) {
    if (!new.target) {
        return new Console(stdout, stderr, ignoreErrors);
    }

    let colorMode = 'auto';
    let colorModeWasSet = false;
    let inspectOptions;

    if (stdout && typeof stdout === 'object' && !stdout.write) {
        const options = stdout;
        stderr = options.stderr;
        ignoreErrors = options.ignoreErrors;
        if (options.colorMode !== undefined) {
            colorMode = options.colorMode;
            colorModeWasSet = true;
        }
        inspectOptions = options.inspectOptions;
        stdout = options.stdout;
    }

    if (!stdout || typeof stdout.write !== 'function') {
        const err = new TypeError(`The "stdout" argument must be an instance of Writable. Received ${util.inspect(stdout)}`);
        err.code = 'ERR_CONSOLE_WRITABLE_STREAM';
        throw err;
    }

    if (stderr && typeof stderr.write !== 'function') {
        const err = new TypeError(`The "stderr" argument must be an instance of Writable. Received ${util.inspect(stderr)}`);
        err.code = 'ERR_CONSOLE_WRITABLE_STREAM';
        throw err;
    }

    if (colorMode !== 'auto' && colorMode !== true && colorMode !== false) {
        const err = new TypeError(`The argument 'colorMode' must be one of: 'auto', true, false. Received ${util.inspect(colorMode)}`);
        err.code = 'ERR_INVALID_ARG_VALUE';
        throw err;
    }

    if (inspectOptions !== undefined) {
        if (typeof inspectOptions !== 'object' || inspectOptions === null) {
            let received;
            if (inspectOptions == null) {
                received = ` Received ${inspectOptions}`;
            } else if (typeof inspectOptions === 'function') {
                received = ` Received function ${inspectOptions.name}`;
            } else {
                let inspected = util.inspect(inspectOptions, { colors: false });
                if (inspected.length > 28) inspected = inspected.slice(0, 25) + '...';
                received = ` Received type ${typeof inspectOptions} (${inspected})`;
            }
            const err = new TypeError(`The "options.inspectOptions" property must be of type object.${received}`);
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        if ('colors' in inspectOptions && colorModeWasSet) {
            const err = new TypeError('Option "options.inspectOptions.color" cannot be used in combination with option "colorMode"');
            err.code = 'ERR_INCOMPATIBLE_OPTION_PAIR';
            throw err;
        }
    }

    this._stdout = stdout;
    this._stderr = stderr || stdout;
    this._ignoreErrors = ignoreErrors !== false;
    this._colorMode = colorMode;
    this._inspectOptions = inspectOptions;
    this._counts = {};
    this._timers = {};

    // Bind methods from the most-derived prototype so subclass overrides win,
    // while still supporting detached usage (e.g. [1,2,3].forEach(c.log)).
    const proto = new.target.prototype || Console.prototype;
    for (let i = 0; i < _METHODS_TO_BIND.length; i++) {
        const name = _METHODS_TO_BIND[i];
        const fn = typeof proto[name] === 'function' ? proto[name] : Console.prototype[name];
        this[name] = fn.bind(this);
    }
}

Console.prototype._writeToStream = function(stream, string) {
    if (this._ignoreErrors) {
        try { stream.write(string); } catch (e) {}
    } else {
        stream.write(string);
    }
};

Console.prototype._getColors = function() {
    if (this._inspectOptions && 'colors' in this._inspectOptions) {
        return this._inspectOptions.colors;
    }
    if (this._colorMode === 'auto') {
        return !!(this._stdout && this._stdout.isTTY);
    }
    return this._colorMode;
};

Console.prototype.log = function(...args) {
    const opts = { colors: this._getColors(), ...this._inspectOptions };
    const str = args.length === 0 ? '' :
        args.length === 1 && typeof args[0] === 'string' ? args[0] :
        args.length === 1 ? util.inspect(args[0], opts) :
        util.format(...args);
    this._writeToStream(this._stdout, str + '\n');
};
Console.prototype.info = function(...args) { this.log(...args); };
Console.prototype.debug = function(...args) { this.log(...args); };
Console.prototype.warn = function(...args) {
    const str = util.format(...args);
    this._writeToStream(this._stderr, str + '\n');
};
Console.prototype.error = function(...args) { this.warn(...args); };
Console.prototype.dir = function(object, options) {
    const opts = { ...this._inspectOptions, ...options };
    const result = util.inspect(object, opts);
    this._writeToStream(this._stdout, (result !== undefined ? result : 'undefined') + '\n');
};
Console.prototype.dirxml = function(...args) { this.dir(...args); };
Console.prototype.trace = function(...args) { trace(...args); };
Console.prototype.assert = function(condition, ...v) { assert(condition, ...v); };
Console.prototype.clear = function() { clear(); };
Console.prototype.count = function(label) {
    label = label === undefined ? DEFAULT_LABEL : String(label);
    if (!this._counts[label]) this._counts[label] = 0;
    this._counts[label]++;
    this._writeToStream(this._stdout, `${label}: ${this._counts[label]}\n`);
};
Console.prototype.countReset = function(label) {
    label = label === undefined ? DEFAULT_LABEL : String(label);
    if (this._counts[label]) {
        this._counts[label] = 0;
    } else {
        this._writeToStream(this._stderr, `Count for '${label}' does not exist\n`);
    }
};
Console.prototype.group = function(...args) { if (args.length > 0) this.log(...args); };
Console.prototype.groupCollapsed = function(...args) { if (args.length > 0) this.log(...args); };
Console.prototype.groupEnd = function() {};
Console.prototype.table = function(...args) { table(...args); };
Console.prototype.time = function(label) {
    label = label === undefined ? DEFAULT_LABEL : label;
    this._timers[label] = consoleNative.timestamp();
};
Console.prototype.timeLog = function(label, ...v) {
    label = label === undefined ? DEFAULT_LABEL : label;
    const start = this._timers[label];
    if (start === undefined) {
        this._writeToStream(this._stderr, `No such timer label: ${label}\n`);
        return;
    }
    const diff = consoleNative.timestamp() - start;
    this._writeToStream(this._stdout, `${label}: ${diff}ms` + (v.length ? ' ' + util.format(...v) : '') + '\n');
};
Console.prototype.timeEnd = function(label) {
    label = label === undefined ? DEFAULT_LABEL : label;
    const start = this._timers[label];
    if (start === undefined) {
        this._writeToStream(this._stderr, `No such timer label: ${label}\n`);
        return;
    }
    const diff = consoleNative.timestamp() - start;
    this._writeToStream(this._stdout, `${label}: ${diff}ms - timer ended\n`);
    delete this._timers[label];
};

Object.defineProperty(Console, Symbol.hasInstance, {
    value: function(instance) {
        if (instance === globalThis.console) return true;
        return !!instance && Console.prototype.isPrototypeOf(instance);
    }
});

export default { Console, assert, clear, count, countReset, debug, dir, dirxml, error, group, groupCollapsed, groupEnd, info, log, table, time, timeLog, timeEnd, trace, warn };
