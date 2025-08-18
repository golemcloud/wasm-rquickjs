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

export function debug(...v) {
    consoleNative.debug(util.format(...v))
}

export function dir(object, options) {
    consoleNative.println(util.inspect(object, options));
}

export function dirxml(object) {
    // just fallback to dir() here
    dir(object);
}

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
    consoleNative.trace(util.format(...v))
}

export function warn(...v) {
    consoleNative.warn(util.format(...v))
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
