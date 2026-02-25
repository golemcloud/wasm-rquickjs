import * as consoleNative from '__wasm_rquickjs_builtin/console_native'
import * as util from 'node:util'
import { Buffer } from 'node:buffer'
import { validateArray } from '__wasm_rquickjs_builtin/internal/validators'
import { isMap, isMapIterator, isSet, isSetIterator, isTypedArray } from '__wasm_rquickjs_builtin/internal/util/types'
import { getStringWidth } from '__wasm_rquickjs_builtin/internal/util/inspect'

const DEFAULT_GROUP_INDENTATION = 2;
const MAX_GROUP_INDENTATION = 1000;

let globalGroupIndentation = '';

function applyGroupIndent(message, groupIndentation) {
    if (!groupIndentation) {
        return message;
    }

    return `${groupIndentation}${String(message).replace(/\n/g, `\n${groupIndentation}`)}`;
}

function reduceGroupIndent(groupIndentation, groupIndentationWidth) {
    if (groupIndentationWidth <= 0 || groupIndentation.length === 0) {
        return groupIndentation;
    }

    return groupIndentation.slice(0, Math.max(0, groupIndentation.length - groupIndentationWidth));
}

function validateGroupIndentation(groupIndentation) {
    if (typeof groupIndentation !== 'number') {
        const err = new TypeError(`The "groupIndentation" argument must be of type number. Received ${util.inspect(groupIndentation)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }

    if (!Number.isInteger(groupIndentation)) {
        const err = new RangeError(`The value of "groupIndentation" is out of range. It must be an integer. Received ${groupIndentation}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }

    if (groupIndentation < 0 || groupIndentation > MAX_GROUP_INDENTATION) {
        const err = new RangeError(`The value of "groupIndentation" is out of range. It must be >= 0 && <= ${MAX_GROUP_INDENTATION}. Received ${groupIndentation}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
}

function writeToConfiguredStream(stream, message, nativeWriter, groupIndentation) {
    const output = applyGroupIndent(message, groupIndentation);
    if (stream) {
        stream.write(output + '\n');
    } else {
        nativeWriter(output);
    }
}

export function assert(condition, ...v) {
    if (!condition) {
        warn("Assertion failed:", ...v)
    }
}

const CLEAR_CONSOLE_CURSOR_HOME = '\u001b[1;1H';
const CLEAR_CONSOLE_SCREEN_DOWN = '\u001b[0J';

function clearStream(stream) {
    if (!stream || typeof stream.write !== 'function' || !stream.isTTY) {
        return;
    }

    const env = globalThis.process && globalThis.process.env;
    if (env && env.TERM === 'dumb') {
        return;
    }

    stream.write(CLEAR_CONSOLE_CURSOR_HOME);
    stream.write(CLEAR_CONSOLE_SCREEN_DOWN);
}

export function clear() {
    clearStream(_getStdout());
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
    writeToConfiguredStream(_getStdout(), msg, consoleNative.debug, globalGroupIndentation);
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
    writeToConfiguredStream(_getStdout(), msg, consoleNative.println, globalGroupIndentation);
}

export function dirxml(object) {
    dir(object);
}

export function error(...v) {
    const msg = util.format(...v);
    writeToConfiguredStream(_getStderr(), msg, consoleNative.error, globalGroupIndentation);
}

export function group(label) {
    if (label !== undefined) {
        log(label)
    }

    globalGroupIndentation += ' '.repeat(DEFAULT_GROUP_INDENTATION);
}

export function groupCollapsed(label) {
    if (label !== undefined) {
        log(label)
    }

    globalGroupIndentation += ' '.repeat(DEFAULT_GROUP_INDENTATION);
}

export function groupEnd() {
    globalGroupIndentation = reduceGroupIndent(globalGroupIndentation, DEFAULT_GROUP_INDENTATION);
}

export function info(...v) {
    const msg = util.format(...v);
    writeToConfiguredStream(_getStdout(), msg, consoleNative.info, globalGroupIndentation);
}

export function log(...v) {
    let msg;
    try {
        msg = util.format(...v);
    } catch (e) {
        msg = `[Unable to format: ${e.message}]`;
    }
    writeToConfiguredStream(_getStdout(), msg, consoleNative.println, globalGroupIndentation);
}

export function table(data, keys) {
    return renderTableForConsole(globalThis.console, data, keys);
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
    writeToConfiguredStream(_getStderr(), msg, consoleNative.trace, globalGroupIndentation);
}

export function warn(...v) {
    const msg = util.format(...v);
    writeToConfiguredStream(_getStderr(), msg, consoleNative.warn, globalGroupIndentation);
}

const tableChars = {
    middleMiddle: '─',
    rowMiddle: '┼',
    topRight: '┐',
    topLeft: '┌',
    leftMiddle: '├',
    topMiddle: '┬',
    bottomRight: '┘',
    bottomLeft: '└',
    bottomMiddle: '┴',
    rightMiddle: '┤',
    left: '│ ',
    right: ' │',
    middle: ' │ ',
};

function renderTableRow(row, columnWidths) {
    let out = tableChars.left;
    for (let i = 0; i < row.length; i++) {
        const cell = row[i];
        const len = getStringWidth(cell);
        const needed = columnWidths[i] - len;
        out += cell + ' '.repeat(Math.ceil(needed));
        if (i !== row.length - 1) {
            out += tableChars.middle;
        }
    }
    out += tableChars.right;
    return out;
}

function renderCliTable(head, columns) {
    const rows = [];
    const columnWidths = head.map((column) => getStringWidth(column));
    const longestColumn = Math.max(...columns.map((column) => column.length));

    for (let i = 0; i < head.length; i++) {
        const column = columns[i];
        for (let j = 0; j < longestColumn; j++) {
            if (rows[j] === undefined) {
                rows[j] = [];
            }

            const value = Object.prototype.hasOwnProperty.call(column, j) ? column[j] : '';
            rows[j][i] = value;
            columnWidths[i] = Math.max(columnWidths[i] || 0, getStringWidth(value));
        }
    }

    const divider = columnWidths.map((width) => tableChars.middleMiddle.repeat(width + 2));

    let result = tableChars.topLeft +
        divider.join(tableChars.topMiddle) +
        tableChars.topRight + '\n' +
        renderTableRow(head, columnWidths) + '\n' +
        tableChars.leftMiddle +
        divider.join(tableChars.rowMiddle) +
        tableChars.rightMiddle + '\n';

    for (const row of rows) {
        result += `${renderTableRow(row, columnWidths)}\n`;
    }

    result += tableChars.bottomLeft +
        divider.join(tableChars.bottomMiddle) +
        tableChars.bottomRight;

    return result;
}

const keyKey = 'Key';
const valuesKey = 'Values';
const indexKey = '(index)';
const iterKey = '(iteration index)';

function isArrayForTable(value) {
    return Array.isArray(value) || isTypedArray(value) || Buffer.isBuffer(value);
}

function inspectForTable(consoleContext, value) {
    const depth = value !== null &&
        typeof value === 'object' &&
        !isArrayForTable(value) &&
        Object.keys(value).length > 2 ? -1 : 0;
    const options = {
        depth,
        maxArrayLength: 3,
        breakLength: Infinity,
    };

    if (consoleContext && typeof consoleContext._getColors === 'function') {
        options.colors = consoleContext._getColors();
    }

    if (consoleContext && consoleContext._inspectOptions && typeof consoleContext._inspectOptions === 'object') {
        Object.assign(options, consoleContext._inspectOptions);
    }

    return util.inspect(value, options);
}

function writeTable(consoleContext, head, columns) {
    const rendered = renderCliTable(head, columns);
    if (consoleContext && typeof consoleContext.log === 'function') {
        return consoleContext.log(rendered);
    }

    return log(rendered);
}

function renderTableForConsole(consoleContext, tabularData, properties) {
    if (properties !== undefined) {
        validateArray(properties, 'properties');
    }

    if (tabularData === null || typeof tabularData !== 'object') {
        if (consoleContext && typeof consoleContext.log === 'function') {
            return consoleContext.log(tabularData);
        }

        return log(tabularData);
    }

    const inspectValue = (value) => inspectForTable(consoleContext, value);
    const getIndexArray = (length) => Array.from({ length }, (_, i) => inspectValue(i));

    if (isMapIterator(tabularData)) {
        const valuesFromIterator = Array.from(tabularData);
        const isKeyValue = valuesFromIterator.every((entry) => Array.isArray(entry) && entry.length === 2);

        if (isKeyValue) {
            const keys = [];
            const values = [];

            for (let i = 0; i < valuesFromIterator.length; i++) {
                keys.push(inspectValue(valuesFromIterator[i][0]));
                values.push(inspectValue(valuesFromIterator[i][1]));
            }

            return writeTable(consoleContext, [iterKey, keyKey, valuesKey], [
                getIndexArray(valuesFromIterator.length),
                keys,
                values,
            ]);
        }

        return writeTable(consoleContext, [iterKey, valuesKey], [
            getIndexArray(valuesFromIterator.length),
            valuesFromIterator.map((value) => inspectValue(value)),
        ]);
    }

    if (isMap(tabularData)) {
        const keys = [];
        const values = [];
        let length = 0;

        for (const [key, value] of tabularData) {
            keys.push(inspectValue(key));
            values.push(inspectValue(value));
            length++;
        }

        return writeTable(consoleContext, [iterKey, keyKey, valuesKey], [
            getIndexArray(length),
            keys,
            values,
        ]);
    }

    if (isSetIterator(tabularData) || isSet(tabularData)) {
        const values = [];
        let length = 0;

        for (const value of tabularData) {
            values.push(inspectValue(value));
            length++;
        }

        return writeTable(consoleContext, [iterKey, valuesKey], [getIndexArray(length), values]);
    }

    const map = { __proto__: null };
    let hasPrimitives = false;
    const valuesKeyArray = [];
    const indexKeyArray = Object.keys(tabularData);

    for (let i = 0; i < indexKeyArray.length; i++) {
        const item = tabularData[indexKeyArray[i]];
        const primitive = item === null ||
            (typeof item !== 'function' && typeof item !== 'object');

        if (properties === undefined && primitive) {
            hasPrimitives = true;
            valuesKeyArray[i] = inspectValue(item);
        } else {
            const keys = properties || Object.keys(item);
            for (const key of keys) {
                map[key] ??= [];
                if ((primitive && properties) || !Object.prototype.hasOwnProperty.call(item, key)) {
                    map[key][i] = '';
                } else {
                    map[key][i] = inspectValue(item[key]);
                }
            }
        }
    }

    const keys = Object.keys(map);
    const values = Object.values(map);
    if (hasPrimitives) {
        keys.push(valuesKey);
        values.push(valuesKeyArray);
    }

    keys.unshift(indexKey);
    values.unshift(indexKeyArray);
    return writeTable(consoleContext, keys, values);
}

const _METHODS_TO_BIND = [
    'log', 'info', 'warn', 'error', 'debug',
    'dir', 'dirxml', 'trace', 'assert', 'clear',
    'count', 'countReset', 'group', 'groupCollapsed', 'groupEnd',
    'table', 'time', 'timeLog', 'timeEnd',
];

function makeMethodNonConstructible(fn, name) {
    if (typeof fn !== 'function') {
        return fn;
    }

    const wrapped = new Proxy(fn, {
        construct() {
            throw new TypeError(`${name} is not a constructor`);
        },
    });

    // QuickJS may infer empty names for assigned function expressions.
    // Set the exact method name so tests observe Node-compatible names.
    Object.defineProperty(wrapped, 'name', {
        value: name,
        configurable: true,
    });

    return wrapped;
}

function isStackOverflowError(err) {
    if (!(err instanceof RangeError)) {
        return false;
    }

    const message = typeof err.message === 'string' ? err.message : '';
    return /(?:maximum call stack size exceeded|stack overflow|too much recursion)/i.test(message);
}

export function Console(stdout, stderr, ignoreErrors) {
    if (!new.target) {
        return new Console(stdout, stderr, ignoreErrors);
    }

    let colorMode = 'auto';
    let colorModeWasSet = false;
    let inspectOptions;
    let groupIndentation = DEFAULT_GROUP_INDENTATION;

    if (stdout && typeof stdout === 'object' && !stdout.write) {
        const options = stdout;
        stderr = options.stderr;
        ignoreErrors = options.ignoreErrors;
        if (options.colorMode !== undefined) {
            colorMode = options.colorMode;
            colorModeWasSet = true;
        }
        inspectOptions = options.inspectOptions;
        groupIndentation = options.groupIndentation;
        stdout = options.stdout;
    }

    if (groupIndentation === undefined) {
        groupIndentation = DEFAULT_GROUP_INDENTATION;
    }

    validateGroupIndentation(groupIndentation);

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
    this._groupIndentation = groupIndentation;
    this._groupIndent = '';

    // Bind methods from the most-derived prototype so subclass overrides win,
    // while still supporting detached usage (e.g. [1,2,3].forEach(c.log)).
    const proto = new.target.prototype || Console.prototype;
    for (let i = 0; i < _METHODS_TO_BIND.length; i++) {
        const name = _METHODS_TO_BIND[i];
        const fn = typeof proto[name] === 'function' ? proto[name] : Console.prototype[name];
        this[name] = makeMethodNonConstructible(fn.bind(this), name);
    }
}

Console.prototype._writeToStream = function(stream, string) {
    const hasTrailingNewline = string.endsWith('\n');
    const baseString = hasTrailingNewline ? string.slice(0, -1) : string;
    const indentedString = applyGroupIndent(baseString, this._groupIndent);
    const output = hasTrailingNewline ? `${indentedString}\n` : indentedString;

    if (this._ignoreErrors) {
        try {
            stream.write(output);
        } catch (e) {
            // Node.js does not swallow low-stack-space failures.
            if (isStackOverflowError(e)) {
                throw e;
            }
        }
    } else {
        stream.write(output);
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
Console.prototype.clear = function() { clearStream(this._stdout); };
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
Console.prototype.group = function(...args) {
    if (args.length > 0) {
        this.log(...args);
    }

    this._groupIndent += ' '.repeat(this._groupIndentation);
};
Console.prototype.groupCollapsed = function(...args) { this.group(...args); };
Console.prototype.groupEnd = function() {
    this._groupIndent = reduceGroupIndent(this._groupIndent, this._groupIndentation);
};
Console.prototype.table = function(tabularData, properties) {
    return renderTableForConsole(this, tabularData, properties);
};
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
