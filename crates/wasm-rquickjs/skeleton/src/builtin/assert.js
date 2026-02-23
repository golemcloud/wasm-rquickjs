import { inspect, innerDeepEqual } from 'node:util';
import fs from 'node:fs';
import { ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE, ERR_INVALID_RETURN_VALUE } from '__wasm_rquickjs_builtin/internal/errors';

const inspectDiffOptions = {
    depth: 1000,
    compact: false,
    sorted: true,
    getters: true,
    customInspect: false
};

function inspectForDiff(value) {
    return inspect(value, inspectDiffOptions);
}

const ESCAPE_SEQUENCES_REGEXP = /[\x00-\x1F]/g;

function escapeControlCharacter(char) {
    switch (char) {
        case '\\b':
            return '\\\\b';
        case '\\t':
            return '\\\\t';
        case '\\n':
            return '\\\\n';
        case '\\v':
            return '\\\\v';
        case '\\f':
            return '\\\\f';
        case '\\r':
            return '\\\\r';
        default:
            return '\\\\x' + char.charCodeAt(0).toString(16).padStart(2, '0');
    }
}

function isIdentifierPartCharacter(char) {
    if (!char) {
        return false;
    }

    var code = char.charCodeAt(0);
    return (code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) ||
        code === 95 ||
        code === 36 ||
        code > 0x7f;
}

function parseStackFrames(stack) {
    if (typeof stack !== 'string') {
        return [];
    }

    var frames = [];
    var lines = stack.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var match = line.match(/^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/);
        if (!match) {
            match = line.match(/^at\s+(.+):(\d+):(\d+)$/);
            if (match) {
                frames.push({
                    functionName: '',
                    fileName: match[1],
                    lineNumber: Number(match[2]),
                    columnNumber: Number(match[3])
                });
            }
            continue;
        }

        frames.push({
            functionName: match[1],
            fileName: match[2],
            lineNumber: Number(match[3]),
            columnNumber: Number(match[4])
        });
    }

    return frames;
}

function resolveSourceForFrame(frame, currentModuleSource) {
    if (!frame || typeof frame.fileName !== 'string') {
        return undefined;
    }

    if (!frame.fileName.startsWith('<')) {
        try {
            var fileSource = fs.readFileSync(frame.fileName, 'utf8');
            if (typeof fileSource === 'string') {
                return fileSource;
            }
        } catch (err) {
            // Fall through to current module source.
        }
    }

    if (typeof currentModuleSource === 'string') {
        return currentModuleSource;
    }

    return undefined;
}

function shouldSkipStackFrame(frame, stackStartFnName) {
    if (!frame) {
        return true;
    }
    if (frame.fileName === 'native' || frame.fileName.startsWith('node:')) {
        return true;
    }

    var functionName = frame.functionName;
    if (functionName === 'getErrMessage' || functionName === 'innerOk' || functionName === 'ok') {
        return true;
    }
    if (stackStartFnName && functionName === stackStartFnName) {
        return true;
    }

    return false;
}

function findExpressionFromStack(stack, stackStartFnName, currentModuleSource) {
    var frames = parseStackFrames(stack);
    var checkedFrames = 0;
    for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        if (shouldSkipStackFrame(frame, stackStartFnName)) {
            continue;
        }

        checkedFrames++;
        if (checkedFrames > 3) {
            break;
        }

        var source = resolveSourceForFrame(frame, currentModuleSource);
        if (typeof source !== 'string') {
            continue;
        }

        var sourceLines = source.split(/\r?\n/);
        var candidateLineNumbers = [frame.lineNumber, frame.lineNumber - 1, frame.lineNumber - 2];
        for (var j = 0; j < candidateLineNumbers.length; j++) {
            var lineNumber = candidateLineNumbers[j];
            if (lineNumber <= 0 || lineNumber > sourceLines.length) {
                continue;
            }

            var sourceExpression = extractCallExpression(sourceLines[lineNumber - 1], frame.columnNumber);
            if (sourceExpression) {
                return sourceExpression;
            }
        }
    }

    return '';
}

function findMatchingParenEnd(source, openParenIndex) {
    var depth = 0;
    var inSingleQuote = false;
    var inDoubleQuote = false;
    var inTemplateLiteral = false;
    var escaped = false;

    for (var i = openParenIndex; i < source.length; i++) {
        var char = source.charAt(i);

        if (escaped) {
            escaped = false;
            continue;
        }

        if (inSingleQuote) {
            if (char === '\\\\') {
                escaped = true;
            } else if (char === "'") {
                inSingleQuote = false;
            }
            continue;
        }

        if (inDoubleQuote) {
            if (char === '\\\\') {
                escaped = true;
            } else if (char === '"') {
                inDoubleQuote = false;
            }
            continue;
        }

        if (inTemplateLiteral) {
            if (char === '\\\\') {
                escaped = true;
            } else if (char === '`') {
                inTemplateLiteral = false;
            }
            continue;
        }

        if (char === "'") {
            inSingleQuote = true;
            continue;
        }
        if (char === '"') {
            inDoubleQuote = true;
            continue;
        }
        if (char === '`') {
            inTemplateLiteral = true;
            continue;
        }

        if (char === '(') {
            depth++;
            continue;
        }

        if (char === ')') {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }

    return -1;
}

function extractCallExpression(sourceLine, columnNumber) {
    if (typeof sourceLine !== 'string' || sourceLine.length === 0) {
        return '';
    }

    if (sourceLine.trimStart().startsWith('//')) {
        return '';
    }

    var index = Math.max(0, Math.min(sourceLine.length - 1, Math.max(1, columnNumber) - 1));
    var beforeIndex = sourceLine.lastIndexOf('(', index);
    var afterIndex = sourceLine.indexOf('(', index);
    var openParenIndex = -1;

    if (beforeIndex >= 0 && afterIndex >= 0) {
        openParenIndex = (index - beforeIndex <= afterIndex - index) ? beforeIndex : afterIndex;
    } else if (beforeIndex >= 0) {
        openParenIndex = beforeIndex;
    } else {
        openParenIndex = afterIndex;
    }

    if (openParenIndex < 0) {
        return '';
    }

    var closeParenIndex = findMatchingParenEnd(sourceLine, openParenIndex);
    if (closeParenIndex < 0) {
        return '';
    }

    var startIndex = openParenIndex;
    while (startIndex > 0) {
        var previous = sourceLine.charAt(startIndex - 1);
        if (isIdentifierPartCharacter(previous) || previous === '.' || previous === '?' || previous === '[' || previous === ']') {
            startIndex--;
            continue;
        }
        break;
    }

    var expression = sourceLine.slice(startIndex, closeParenIndex + 1).trim();
    if (!expression) {
        return '';
    }

    while (expression.length > 0 && (expression.charAt(0) === ';' || expression.charAt(0) === ',')) {
        expression = expression.slice(1).trimStart();
    }

    return expression;
}

function getErrMessage(stackStartFn) {
    var stack;
    if (typeof Error.captureStackTrace === 'function') {
        var stackHolder = {};
        Error.captureStackTrace(stackHolder, stackStartFn);
        stack = stackHolder.stack;
    }

    if (typeof stack !== 'string' || stack.length === 0) {
        stack = new Error().stack;
    }

    var currentModule = globalThis.__wasm_rquickjs_current_module;
    if (!currentModule || typeof currentModule.filename !== 'string' || currentModule.filename.indexOf('/test/fixtures/') === -1) {
        return undefined;
    }

    var currentModuleSource = typeof currentModule.source === 'string' ? currentModule.source : undefined;
    var stackStartFnName = stackStartFn && stackStartFn.name ? stackStartFn.name : '';
    var sourceExpression = findExpressionFromStack(stack, stackStartFnName, currentModuleSource);
    if (!sourceExpression) {
        return undefined;
    }

    sourceExpression = sourceExpression.replace(ESCAPE_SEQUENCES_REGEXP, escapeControlCharacter);
    return 'The expression evaluated to a falsy value:\n\n  ' + sourceExpression + '\n';
}

class Comparison {
    constructor(properties) {
        if (properties && typeof properties === 'object') {
            Object.assign(this, properties);
        }
    }
}

class AssertionError extends Error {
    constructor(options) {
        if (typeof options !== 'object' || options === null) {
            var err = new TypeError('The "options" argument must be of type object.' + invalidArgTypeHelper(options));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        var message;
        var actual = options.actual;
        var expected = options.expected;
        var operator = options.operator || 'fail';

        try {
        if (operator === 'deepEqual') {
                var actualInsp = inspectForDiff(actual);
                var expectedInsp = inspectForDiff(expected);
                message = 'Expected values to be loosely deep-equal:\n\n' +
                    actualInsp + '\n\nshould loosely deep-equal\n\n' + expectedInsp;
        } else if (operator === 'notDeepEqual') {
                var actualInsp = inspectForDiff(actual);
                var expectedInsp = inspectForDiff(expected);
                if (actualInsp === expectedInsp) {
                    var base2 = 'Expected "actual" not to be loosely deep-equal to:';
                    var lines2 = actualInsp.split('\n');
                    if (lines2.length > 50) {
                        lines2 = lines2.slice(0, 46);
                        lines2.push('...');
                        message = base2 + '\n\n' + lines2.join('\n') + '\n';
                    } else {
                        message = base2 + '\n\n' + lines2.join('\n');
                    }
                } else {
                    message = actualInsp + '\n\nshould not loosely deep-equal\n\n' + expectedInsp;
                }
        } else if (operator === 'deepStrictEqual') {
                var actualInsp = inspectForDiff(actual);
                var expectedInsp = inspectForDiff(expected);
                var actualIsPrimitive = actual === null || (typeof actual !== 'object' && typeof actual !== 'function');
                var expectedIsPrimitive = expected === null || (typeof expected !== 'object' && typeof expected !== 'function');
                if (actualIsPrimitive && expectedIsPrimitive) {
                    message = 'Expected values to be strictly deep-equal:\n\n' + actualInsp + ' !== ' + expectedInsp + '\n';
                } else {
                var actualLines = actualInsp.split('\n');
                var expectedLines = expectedInsp.split('\n');
                var header = 'Expected values to be strictly deep-equal:\n+ actual - expected\n\n';
                // Check for comma disparity: lines differing only by trailing comma
                var checkCommaDisparity = actual != null && typeof actual === 'object';
                function linesEqual(a, b) {
                    if (a === b) return true;
                    if (checkCommaDisparity) {
                        return (a + ',') === b || a === (b + ',');
                    }
                    return false;
                }
                // Diff generation
                var m = actualLines.length;
                var n = expectedLines.length;
                var diffLines = [];
                if (m > 500 || n > 500 || m * n > 100000) {
                    // Fallback for very large inputs: simple line-by-line
                    var maxLen = Math.max(m, n);
                    for (var di = 0; di < maxLen; di++) {
                        var aLine = di < m ? actualLines[di] : undefined;
                        var eLine = di < n ? expectedLines[di] : undefined;
                        if (aLine !== undefined && eLine !== undefined && linesEqual(aLine, eLine)) {
                            var commonLine = checkCommaDisparity && !aLine.endsWith(',') ? eLine : aLine;
                            diffLines.push('  ' + commonLine);
                        } else {
                            if (aLine !== undefined) diffLines.push('+ ' + aLine);
                            if (eLine !== undefined) diffLines.push('- ' + eLine);
                        }
                    }
                } else {
                    // LCS-based diff
                    var dp = new Array(m + 1);
                    for (var i = 0; i <= m; i++) {
                        dp[i] = new Array(n + 1);
                        for (var j = 0; j <= n; j++) dp[i][j] = 0;
                    }
                    for (var i = 1; i <= m; i++) {
                        for (var j = 1; j <= n; j++) {
                            if (linesEqual(actualLines[i - 1], expectedLines[j - 1])) {
                                dp[i][j] = dp[i - 1][j - 1] + 1;
                            } else {
                                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                            }
                        }
                    }
                    var ai = m, ei = n;
                    var rawDiff = [];
                    while (ai > 0 || ei > 0) {
                        if (ai > 0 && ei > 0 && linesEqual(actualLines[ai - 1], expectedLines[ei - 1])) {
                            var aItem = actualLines[ai - 1];
                            var commonLine = checkCommaDisparity && !aItem.endsWith(',') ? expectedLines[ei - 1] : aItem;
                            rawDiff.push({ type: ' ', line: commonLine });
                            ai--; ei--;
                        } else if (ei > 0 && (ai === 0 || dp[ai][ei - 1] >= dp[ai - 1][ei])) {
                            rawDiff.push({ type: '-', line: expectedLines[ei - 1] });
                            ei--;
                        } else {
                            rawDiff.push({ type: '+', line: actualLines[ai - 1] });
                            ai--;
                        }
                    }
                    rawDiff.reverse();
                    for (var di = 0; di < rawDiff.length; di++) {
                        diffLines.push(rawDiff[di].type + ' ' + rawDiff[di].line);
                    }
                }
                // Context collapsing: collapse runs of 8+ unchanged lines
                var kNopLinesToCollapse = 5;
                var collapsed = [];
                var skipped = false;
                var nopRun = [];
                for (var ci = 0; ci < diffLines.length; ci++) {
                    var dl = diffLines[ci];
                    var isNop = dl.length >= 2 && dl[0] === ' ' && dl[1] === ' ';
                    if (isNop) {
                        nopRun.push(dl);
                    } else {
                        if (nopRun.length >= kNopLinesToCollapse + 3) {
                            for (var ni = 0; ni < kNopLinesToCollapse; ni++) {
                                collapsed.push(nopRun[ni]);
                            }
                            collapsed.push('...');
                            collapsed.push(nopRun[nopRun.length - 1]);
                            skipped = true;
                        } else {
                            for (var ni = 0; ni < nopRun.length; ni++) {
                                collapsed.push(nopRun[ni]);
                            }
                        }
                        nopRun = [];
                        collapsed.push(dl);
                    }
                }
                // Flush trailing NOP run
                if (nopRun.length >= kNopLinesToCollapse + 3) {
                    for (var ni = 0; ni < kNopLinesToCollapse; ni++) {
                        collapsed.push(nopRun[ni]);
                    }
                    collapsed.push('...');
                    collapsed.push(nopRun[nopRun.length - 1]);
                    skipped = true;
                } else {
                    for (var ni = 0; ni < nopRun.length; ni++) {
                        collapsed.push(nopRun[ni]);
                    }
                }
                if (skipped) {
                    header = header.replace('\n\n', '\n... Skipped lines\n\n');
                }
                message = header + collapsed.join('\n') + '\n';
                }
        } else if (operator === 'notDeepStrictEqual') {
                    var actualInsp2 = inspectForDiff(actual);
                    var base2 = 'Expected "actual" not to be strictly deep-equal to:';
                    var lines2 = actualInsp2.split('\n');
                    // Truncate at ~50 lines
                    if (lines2.length > 50) {
                        lines2 = lines2.slice(0, 46);
                        lines2.push('...');
                        message = base2 + '\n\n' + lines2.join('\n') + '\n';
                    } else if (lines2.length === 1) {
                        message = base2 + (lines2[0].length > 5 ? '\n\n' : ' ') + lines2[0];
                    } else {
                        message = base2 + '\n\n' + lines2.join('\n') + '\n';
                    }
        } else if (operator === 'notStrictEqual') {
                    var actualInsp2 = inspectForDiff(actual);
                    var base2 = 'Expected "actual" to be strictly unequal to:';
                    var lines2 = actualInsp2.split('\n');
                    if (lines2.length === 1) {
                        message = base2 + (lines2[0].length > 5 ? '\n\n' : ' ') + lines2[0];
                    } else {
                        message = base2 + '\n\n' + lines2.join('\n') + '\n';
                    }
        } else if (operator === 'strictEqual') {
                    var isObjCompare = (typeof actual === 'object' && actual !== null &&
                        typeof expected === 'object' && expected !== null) ||
                        (typeof actual === 'function' && typeof expected === 'function');
                    if (isObjCompare) {
                        var actualInsp3 = inspectForDiff(actual);
                        var expectedInsp3 = inspectForDiff(expected);
                        message = 'Expected "actual" to be reference-equal to "expected":\n' +
                            '+ actual - expected\n\n';
                        var aLines3 = actualInsp3.split('\n');
                        var eLines3 = expectedInsp3.split('\n');
                        var maxLen3 = Math.max(aLines3.length, eLines3.length);
                        var diffParts3 = [];
                        for (var si = 0; si < maxLen3; si++) {
                            var aL3 = si < aLines3.length ? aLines3[si] : undefined;
                            var eL3 = si < eLines3.length ? eLines3[si] : undefined;
                            if (aL3 !== undefined && eL3 !== undefined && aL3 === eL3) {
                                diffParts3.push('  ' + aL3);
                            } else {
                                if (aL3 !== undefined) diffParts3.push('+ ' + aL3);
                                if (eL3 !== undefined) diffParts3.push('- ' + eL3);
                            }
                        }
                        message += diffParts3.join('\n') + '\n';
                    } else {
                        var actualStr = inspectForDiff(actual);
                        var expectedStr = inspectForDiff(expected);
                        var aLines4 = actualStr.split('\n');
                        var eLines4 = expectedStr.split('\n');
                        var stringsLen = actualStr.length + expectedStr.length;
                        if (typeof actual === 'string') stringsLen -= 2;
                        if (typeof expected === 'string') stringsLen -= 2;
                        var isSingleLine = aLines4.length === 1 && eLines4.length === 1;
                        if (isSingleLine && stringsLen <= 12 && (actual !== 0 || expected !== 0)) {
                            message = 'Expected values to be strictly equal:\n\n' + actualStr + ' !== ' + expectedStr + '\n';
                        } else {
                            var aPrefixed = aLines4.map(function(l) { return '+ ' + l; }).join('\n');
                            var ePrefixed = eLines4.map(function(l) { return '- ' + l; }).join('\n');
                            message = 'Expected values to be strictly equal:\n+ actual - expected\n\n' +
                                aPrefixed + '\n' + ePrefixed + '\n';
                        }
                    }
        } else {
                    var actualStr = inspect(actual, { depth: 2 });
                    var expectedStr = inspect(expected, { depth: 2 });
                    if (actualStr.length > 128) actualStr = actualStr.slice(0, 125) + '...';
                    if (expectedStr.length > 128) expectedStr = expectedStr.slice(0, 125) + '...';
                    message = actualStr + ' ' + operator + ' ' + expectedStr;
        }

        } catch (diffErr) {
            // If diff generation fails (e.g., stack overflow on large/circular objects),
            // fall back to a simple message
            if (message == null) {
                var actualStr = typeof actual === 'object' ? '[object]' : String(actual);
                var expectedStr = typeof expected === 'object' ? '[object]' : String(expected);
                if (actualStr.length > 128) actualStr = actualStr.slice(0, 125) + '...';
                if (expectedStr.length > 128) expectedStr = expectedStr.slice(0, 125) + '...';
                message = actualStr + ' ' + operator + ' ' + expectedStr;
            }
        }

        if (options.message != null) {
            var userMsg = String(options.message);
            if (message != null) {
                var nnIdx = message.indexOf('\n\n');
                if (nnIdx >= 0) {
                    message = userMsg + '\n\n' + message.slice(nnIdx + 2);
                } else {
                    message = userMsg;
                }
            } else {
                message = userMsg;
            }
        }

        super(message);

        this.actual = actual;
        this.expected = expected;
        this.operator = operator;
        this.generatedMessage = 'generatedMessage' in options ? options.generatedMessage : !options.message;
        this.code = 'ERR_ASSERTION';
        this.name = 'AssertionError';

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, options.stackStartFn || this.constructor);
        }
        // QuickJS stacks don't include the error message; prepend it to match Node.js format
        if (typeof this.stack === 'string' && !this.stack.includes(message)) {
            this.stack = this.name + ': ' + message + '\n' + this.stack;
        }
        // In QuickJS stack traces may omit frames. For async assertion helpers,
        // keep the entry point name visible so /rejects/ checks keep working.
        var keepAsyncEntryPoint = options.stackStartFn === rejects || options.stackStartFn === doesNotReject;
        if (keepAsyncEntryPoint && typeof this.stack === 'string' && options.stackStartFn && options.stackStartFn.name && !this.stack.includes(options.stackStartFn.name)) {
            this.stack += '\n    at ' + options.stackStartFn.name + ' (native)';
        }
    }

    toString() {
        return 'AssertionError [ERR_ASSERTION]: ' + this.message;
    }

    inspect(depth, ctx) {
        var kMaxLongStringLength = 512;
        // addEllipsis helper
        function addEllipsis(string) {
            var lines = string.split('\n', 11);
            if (lines.length > 10) {
                lines.length = 10;
                return lines.join('\n') + '\n...';
            } else if (string.length > kMaxLongStringLength) {
                return string.slice(kMaxLongStringLength) + '...';
            }
            return string;
        }
        // Temporarily truncate long string actual/expected
        var tmpActual = this.actual;
        var tmpExpected = this.expected;
        if (typeof this.actual === 'string') {
            this.actual = addEllipsis(this.actual);
        }
        if (typeof this.expected === 'string') {
            this.expected = addEllipsis(this.expected);
        }
        var inspectOpts = Object.assign({}, ctx || {}, { customInspect: false, depth: 0 });
        var result = inspect(this, inspectOpts);
        // Restore original values
        this.actual = tmpActual;
        this.expected = tmpExpected;
        return result;
    }
}

// Process message argument: supports string, Error, and message factory functions
function isErrorLike(obj) {
    return obj instanceof Error ||
        (obj !== null && typeof obj === 'object' && 'message' in obj && 'name' in obj &&
         typeof obj.message === 'string' && typeof obj.name === 'string' &&
         (obj.constructor === Error || (obj.constructor && obj.constructor.prototype instanceof Error) ||
          /Error$/.test(obj.name)));
}

function processMessage(message, actual, expected) {
    if (isErrorLike(message)) return message;
    if (typeof message === 'function') {
        var result = message(actual, expected);
        if (typeof result === 'string') return result;
        return undefined;
    }
    return message;
}

function innerFail(obj) {
    var msg = processMessage(obj.message, obj.actual, obj.expected);
    if (isErrorLike(msg)) throw msg;
    obj.message = msg;
    throw new AssertionError(obj);
}

var NO_EXCEPTION_SENTINEL = {};

function fail(actual, expected, message, operator, stackStartFn) {
    if (arguments.length === 0) {
        innerFail({
            actual: undefined,
            expected: undefined,
            message: 'Failed',
            operator: 'fail',
            generatedMessage: true,
            stackStartFn: fail
        });
        return;
    }
    if (arguments.length === 1) {
        var msg1 = processMessage(actual, undefined, undefined);
        if (isErrorLike(msg1)) throw msg1;
        innerFail({
            actual: undefined,
            expected: undefined,
            message: msg1,
            operator: 'fail',
            stackStartFn: fail
        });
        return;
    }
    // 2+ args (deprecated path)
    if (arguments.length === 2) {
        operator = '!=';
    }
    var msg = processMessage(message, actual, expected);
    if (isErrorLike(msg)) throw msg;
    innerFail({
        actual: actual,
        expected: expected,
        message: msg,
        operator: operator || 'fail',
        generatedMessage: !message,
        stackStartFn: stackStartFn || fail
    });
}

function innerOk(stackStartFn, argLength, value, message) {
    if (!value) {
        var generatedMessage = false;
        var assertionMessage = message;

        if (argLength === 0) {
            generatedMessage = true;
            assertionMessage = 'No value argument passed to `assert.ok()`';
        } else if (argLength === 1 || message == null) {
            generatedMessage = true;
            assertionMessage = getErrMessage(stackStartFn);
        }

        innerFail({
            actual: value,
            expected: true,
            message: assertionMessage,
            operator: '==',
            generatedMessage: generatedMessage,
            stackStartFn: stackStartFn
        });
    }
}

function ok(value, message) {
    innerOk(ok, arguments.length, value, message);
}

function equal(actual, expected, message) {
    // eslint-disable-next-line eqeqeq
    if (actual != expected && !Object.is(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: '==',
            stackStartFn: equal
        });
    }
}

function notEqual(actual, expected, message) {
    // eslint-disable-next-line eqeqeq
    if (actual == expected || Object.is(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: '!=',
            stackStartFn: notEqual
        });
    }
}

function strictEqual(actual, expected, message) {
    if (!Object.is(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'strictEqual',
            stackStartFn: strictEqual
        });
    }
}

function notStrictEqual(actual, expected, message) {
    if (Object.is(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'notStrictEqual',
            stackStartFn: notStrictEqual
        });
    }
}

// --- Deep equality helpers ---

function isArguments(val) {
    return Object.prototype.toString.call(val) === '[object Arguments]';
}

function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function deepEqual(actual, expected, message) {
    if (!innerDeepEqual(actual, expected, false, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'deepEqual',
            stackStartFn: deepEqual
        });
    }
}

function notDeepEqual(actual, expected, message) {
    if (innerDeepEqual(actual, expected, false, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'notDeepEqual',
            stackStartFn: notDeepEqual
        });
    }
}

function deepStrictEqual(actual, expected, message) {
    if (!innerDeepEqual(actual, expected, true, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'deepStrictEqual',
            stackStartFn: deepStrictEqual
        });
    }
}

function notDeepStrictEqual(actual, expected, message) {
    if (innerDeepEqual(actual, expected, true, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'notDeepStrictEqual',
            stackStartFn: notDeepStrictEqual
        });
    }
}

function partialDeepStrictEqual(actual, expected, message) {
    if (!innerPartialDeepEqual(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'partialDeepStrictEqual',
            stackStartFn: partialDeepStrictEqual
        });
    }
}

function innerPartialDeepEqual(actual, expected) {
    if (Object.is(actual, expected)) return true;
    if (actual === null || expected === null || typeof actual !== 'object' || typeof expected !== 'object')
        return false;

    if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) return false;
        if (actual.length < expected.length) return false;
        for (var i = 0; i < expected.length; i++) {
            if (!innerPartialDeepEqual(actual[i], expected[i])) return false;
        }
        return true;
    }

    if (expected instanceof Map) {
        if (!(actual instanceof Map)) return false;
        if (actual.size < expected.size) return false;
        var entries = Array.from(expected.entries());
        for (var i = 0; i < entries.length; i++) {
            if (!actual.has(entries[i][0])) return false;
            if (!innerPartialDeepEqual(actual.get(entries[i][0]), entries[i][1])) return false;
        }
        return true;
    }

    if (expected instanceof Set) {
        if (!(actual instanceof Set)) return false;
        if (actual.size < expected.size) return false;
        var arrExp = Array.from(expected);
        for (var i = 0; i < arrExp.length; i++) {
            if (!actual.has(arrExp[i])) {
                var found = false;
                var arrAct = Array.from(actual);
                for (var j = 0; j < arrAct.length; j++) {
                    if (innerPartialDeepEqual(arrAct[j], arrExp[i])) { found = true; break; }
                }
                if (!found) return false;
            }
        }
        return true;
    }

    var expIsDate = Object.prototype.toString.call(expected) === '[object Date]';
    var actIsDate = Object.prototype.toString.call(actual) === '[object Date]';
    if (expIsDate || actIsDate) {
        if (!expIsDate || !actIsDate) return false;
        return expected.getTime() === actual.getTime();
    }
    if (expected instanceof RegExp && actual instanceof RegExp)
        return expected.source === actual.source && expected.flags === actual.flags;

    // ArrayBuffer / SharedArrayBuffer: must be same type, actual must have >= expected byteLength content
    var expIsAB = expected instanceof ArrayBuffer;
    var actIsAB = actual instanceof ArrayBuffer;
    var expIsSAB = typeof SharedArrayBuffer !== 'undefined' && expected instanceof SharedArrayBuffer;
    var actIsSAB = typeof SharedArrayBuffer !== 'undefined' && actual instanceof SharedArrayBuffer;
    if (expIsAB || expIsSAB) {
        if (expIsAB !== actIsAB || expIsSAB !== actIsSAB) return false;
        if (actual.byteLength !== expected.byteLength) return false;
        var va = new Uint8Array(actual);
        var ve = new Uint8Array(expected);
        for (var i = 0; i < ve.length; i++) {
            if (va[i] !== ve[i]) return false;
        }
        return true;
    }

    // Typed array views: must be same constructor type
    var expIsView = ArrayBuffer.isView ? ArrayBuffer.isView(expected) : (expected && expected.buffer instanceof ArrayBuffer);
    var actIsView = ArrayBuffer.isView ? ArrayBuffer.isView(actual) : (actual && actual.buffer instanceof ArrayBuffer);
    if (expIsView) {
        if (!actIsView) return false;
        if (expected.constructor !== actual.constructor) return false;
        if (actual.byteLength !== expected.byteLength) return false;
        var uea = new Uint8Array(actual.buffer, actual.byteOffset, actual.byteLength);
        var uee = new Uint8Array(expected.buffer, expected.byteOffset, expected.byteLength);
        for (var i = 0; i < uee.length; i++) {
            if (uea[i] !== uee[i]) return false;
        }
        return true;
    }

    var keys = Object.keys(expected);
    for (var i = 0; i < keys.length; i++) {
        if (!hasOwn(actual, keys[i])) return false;
        if (!innerPartialDeepEqual(actual[keys[i]], expected[keys[i]])) return false;
    }
    return true;
}

// --- throws / doesNotThrow / rejects / doesNotReject ---

function makeAmbiguousArgumentError(arg, details) {
    var err = new TypeError('The ' + arg + ' argument is ambiguous. ' + details);
    err.code = 'ERR_AMBIGUOUS_ARGUMENT';
    return err;
}

function isEquivalentEngineErrorMessage(actualMessage, expectedMessage) {
    if (actualMessage === expectedMessage) {
        return true;
    }

    // QuickJS reports proxy ownKeys invariant violations with a different
    // wording than V8/Node.js.
    if (expectedMessage === "'ownKeys' on proxy: trap result did not include 'length'" &&
        actualMessage === 'proxy: target property must be present in proxy ownKeys') {
        return true;
    }

    return false;
}

function compareExceptionKey(actual, expected, key, message, keys, fn) {
    if ((key in actual) && innerDeepEqual(actual[key], expected[key], true, undefined)) {
        return;
    }

    if (key === 'message' &&
        typeof actual[key] === 'string' &&
        typeof expected[key] === 'string' &&
        isEquivalentEngineErrorMessage(actual[key], expected[key])) {
        return;
    }

    if (!message) {
        // Build small placeholder objects to keep the generated diff readable.
        var actualSubset = {};
        var expectedSubset = {};
        for (var i = 0; i < keys.length; i++) {
            var currentKey = keys[i];
            if (currentKey in actual) {
                actualSubset[currentKey] = actual[currentKey];
            }
            if (currentKey in expected) {
                if (typeof actual[currentKey] === 'string' && expected[currentKey] instanceof RegExp && expected[currentKey].test(actual[currentKey])) {
                    expectedSubset[currentKey] = actual[currentKey];
                } else {
                    expectedSubset[currentKey] = expected[currentKey];
                }
            }
        }

        var err = new AssertionError({
            actual: new Comparison(actualSubset),
            expected: new Comparison(expectedSubset),
            operator: 'deepStrictEqual',
            stackStartFn: fn
        });
        err.actual = actual;
        err.expected = expected;
        err.operator = fn.name;
        throw err;
    }

    innerFail({
        actual: actual,
        expected: expected,
        message: message,
        operator: fn.name,
        stackStartFn: fn
    });
}

function expectedException(actual, expected, message, fn) {
    var generatedMessage = false;
    var throwError = false;

    if (typeof expected !== 'function') {
        if (expected instanceof RegExp) {
            var str = String(actual);
            if (expected.test(str)) {
                return;
            }

            if (!message) {
                generatedMessage = true;
                message = 'The input did not match the regular expression ' + inspect(expected) + '. Input:\n\n' + inspect(str) + '\n';
            }
            throwError = true;
        } else if (typeof actual !== 'object' || actual === null) {
            var primitiveErr = new AssertionError({
                actual: actual,
                expected: expected,
                message: message,
                operator: 'deepStrictEqual',
                stackStartFn: fn
            });
            primitiveErr.operator = fn.name;
            throw primitiveErr;
        } else {
            var keys = Object.keys(expected);
            if (expected instanceof Error) {
                if (keys.indexOf('name') === -1) {
                    keys.push('name');
                }
                if (keys.indexOf('message') === -1) {
                    keys.push('message');
                }
            } else if (keys.length === 0) {
                throw new ERR_INVALID_ARG_VALUE('error', expected, 'may not be an empty object');
            }

            for (var keyIdx = 0; keyIdx < keys.length; keyIdx++) {
                var key = keys[keyIdx];
                if (typeof actual[key] === 'string' && expected[key] instanceof RegExp && expected[key].test(actual[key])) {
                    continue;
                }
                compareExceptionKey(actual, expected, key, message, keys, fn);
            }
            return;
        }
    } else if (expected.prototype !== undefined && actual instanceof expected) {
        return;
    } else if (Error.isPrototypeOf(expected)) {
        if (!message) {
            generatedMessage = true;
            message = 'The error is expected to be an instance of "' + expected.name + '". Received ';

            if (actual instanceof Error) {
                var name = (actual && actual.constructor && actual.constructor.name) || actual.name;
                if (expected.name === name) {
                    message += 'an error with identical name but a different prototype.';
                } else {
                    message += '"' + name + '"';
                }

                if (actual.message) {
                    message += '\n\nError message:\n\n' + actual.message;
                }
            } else {
                message += '"' + inspect(actual, { depth: -1 }) + '"';
            }
        }
        throwError = true;
    } else {
        var result = expected.call({}, actual);
        if (result !== true) {
            if (!message) {
                generatedMessage = true;
                var name = expected.name ? '"' + expected.name + '" ' : '';
                message = 'The ' + name + 'validation function is expected to return "true". Received ' + inspect(result);
                if (actual instanceof Error) {
                    message += '\n\nCaught error:\n\n' + actual;
                }
            }
            throwError = true;
        }
    }

    if (throwError) {
        var err = new AssertionError({
            actual: actual,
            expected: expected,
            message: message,
            operator: fn.name,
            stackStartFn: fn
        });
        err.generatedMessage = generatedMessage;
        throw err;
    }
}

function invalidArgTypeHelper(input) {
    if (input == null) return ' Received ' + input;
    if (typeof input === 'function') return ' Received function ' + input.name;
    if (typeof input === 'object') {
        var ctorName = input.constructor && input.constructor.name;
        if (ctorName) return ' Received an instance of ' + ctorName;
        return ' Received [object]';
    }
    return ' Received type ' + typeof input + ' (' + String(input) + ')';
}

function getActual(fn) {
    if (typeof fn !== 'function') {
        throw new ERR_INVALID_ARG_TYPE('fn', 'Function', fn);
    }

    try {
        fn();
    } catch (e) {
        return e;
    }

    return NO_EXCEPTION_SENTINEL;
}

function checkIsPromise(obj) {
    if (obj instanceof Promise) {
        return true;
    }
    return obj !== null && typeof obj === 'object' && typeof obj.then === 'function' && typeof obj.catch === 'function';
}

async function waitForActual(promiseFn) {
    var resultPromise;
    if (typeof promiseFn === 'function') {
        // If this throws synchronously, async function semantics make the returned
        // promise reject with the thrown error, matching Node.js behavior.
        resultPromise = promiseFn();
        if (!checkIsPromise(resultPromise)) {
            throw new ERR_INVALID_RETURN_VALUE('instance of Promise', 'promiseFn', resultPromise);
        }
    } else if (checkIsPromise(promiseFn)) {
        resultPromise = promiseFn;
    } else {
        throw new ERR_INVALID_ARG_TYPE('promiseFn', ['Function', 'Promise'], promiseFn);
    }

    try {
        await resultPromise;
    } catch (e) {
        return e;
    }

    return NO_EXCEPTION_SENTINEL;
}

function expectsError(stackStartFn, actual, error, message) {
    if (typeof error === 'string') {
        if (arguments.length === 4) {
            throw new ERR_INVALID_ARG_TYPE('error', ['Object', 'Error', 'Function', 'RegExp'], error);
        }

        if (typeof actual === 'object' && actual !== null) {
            if (actual.message === error) {
                throw makeAmbiguousArgumentError(
                    'error/message',
                    'The error message "' + actual.message + '" is identical to the message.'
                );
            }
        } else {
            if (actual === error) {
                throw makeAmbiguousArgumentError(
                    'error/message',
                    'The error "' + actual + '" is identical to the message.'
                );
            }
        }

        message = error;
        error = undefined;
    } else if (error != null && typeof error !== 'object' && typeof error !== 'function') {
        throw new ERR_INVALID_ARG_TYPE('error', ['Object', 'Error', 'Function', 'RegExp'], error);
    }

    if (actual === NO_EXCEPTION_SENTINEL) {
        var details = '';
        if (error && error.name) {
            details += ' (' + error.name + ')';
        }
        details += message ? ': ' + message : '.';
        var fnType = stackStartFn === rejects ? 'rejection' : 'exception';

        innerFail({
            actual: undefined,
            expected: error,
            operator: stackStartFn.name,
            message: 'Missing expected ' + fnType + details,
            stackStartFn: stackStartFn
        });
    }

    if (!error) {
        return;
    }

    expectedException(actual, error, message, stackStartFn);
}

function hasMatchingError(actual, expected) {
    if (typeof expected !== 'function') {
        if (expected instanceof RegExp) {
            return expected.test(String(actual));
        }
        throw new ERR_INVALID_ARG_TYPE('expected', ['Function', 'RegExp'], expected);
    }

    if (expected.prototype !== undefined && actual instanceof expected) {
        return true;
    }
    if (Error.isPrototypeOf(expected)) {
        return false;
    }
    return expected.call({}, actual) === true;
}

function expectsNoError(stackStartFn, actual, error, message) {
    if (actual === NO_EXCEPTION_SENTINEL) {
        return;
    }

    if (typeof error === 'string') {
        message = error;
        error = undefined;
    }

    if (!error || hasMatchingError(actual, error)) {
        var details = message ? ': ' + message : '.';
        var fnType = stackStartFn === doesNotReject ? 'rejection' : 'exception';
        var actualMessage = actual != null && typeof actual === 'object' && 'message' in actual
            ? String(actual.message)
            : String(actual);

        innerFail({
            actual: actual,
            expected: error,
            operator: stackStartFn.name,
            message: 'Got unwanted ' + fnType + details + '\nActual message: "' + actualMessage + '"',
            stackStartFn: stackStartFn
        });
    }

    throw actual;
}

function throws(fn, error, message) {
    expectsError(throws, getActual(fn), error, message);
}

function doesNotThrow(fn, error, message) {
    expectsNoError(doesNotThrow, getActual(fn), error, message);
}

async function rejects(promiseFn, error, message) {
    expectsError(rejects, await waitForActual(promiseFn), error, message);
}

async function doesNotReject(promiseFn, error, message) {
    expectsNoError(doesNotReject, await waitForActual(promiseFn), error, message);
}

function ifError(value) {
    if (value !== null && value !== undefined) {
        var newErr = new AssertionError({
            actual: value,
            expected: null,
            message: 'ifError got unwanted exception: ' + (
                value instanceof Error
                    ? (value.message || value.name)
                    : (typeof value === 'object' && value !== null && 'message' in value
                        ? value.message
                        : inspect(value))
            ),
            operator: 'ifError',
            stackStartFn: ifError
        });
        throw newErr;
    }
}

function match(string, regexp, message) {
    if (typeof string !== 'string') {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The "string" argument must be of type string. Received type ' + typeof string,
            operator: 'match',
            stackStartFn: match
        });
    }
    if (!(regexp instanceof RegExp)) {
        throw new TypeError('The "regexp" argument must be an instance of RegExp');
    }
    if (!regexp.test(string)) {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The input did not match the regular expression ' + inspect(regexp) + '. Input: ' + inspect(string),
            operator: 'match',
            stackStartFn: match
        });
    }
}

function doesNotMatch(string, regexp, message) {
    if (typeof string !== 'string') {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The "string" argument must be of type string. Received type ' + typeof string,
            operator: 'doesNotMatch',
            stackStartFn: doesNotMatch
        });
    }
    if (!(regexp instanceof RegExp)) {
        throw new TypeError('The "regexp" argument must be an instance of RegExp');
    }
    if (regexp.test(string)) {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The input was expected to not match the regular expression ' + inspect(regexp) + '. Input: ' + inspect(string),
            operator: 'doesNotMatch',
            stackStartFn: doesNotMatch
        });
    }
}

// CallTracker implementation
class CallTracker {
    constructor() {
        this._trackedFunctions = [];
    }

    calls(fn, exact) {
        if (typeof globalThis.process !== 'undefined' && globalThis.process._exiting) {
            var exitErr = new Error('Cannot call CallTracker methods during process exit handler');
            exitErr.code = 'ERR_UNAVAILABLE_DURING_EXIT';
            throw exitErr;
        }
        if (typeof fn === 'number') {
            exact = fn;
            fn = undefined;
        }
        if (fn === undefined) {
            fn = function() {};
        }
        if (typeof fn !== 'function') {
            var err = new TypeError('The "fn" argument must be of type function. Received type ' + typeof fn);
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        if (exact === undefined) {
            exact = 1;
        }
        if (typeof exact !== 'number') {
            var err = new TypeError('The "exact" argument must be of type number. Received type ' + typeof exact);
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        if (!Number.isInteger(exact) || exact < 0) {
            var err = new RangeError('The value of "exact" is out of range. It must be a non-negative integer. Received ' + exact);
            err.code = 'ERR_OUT_OF_RANGE';
            throw err;
        }

        var callRecords = [];
        var tracking = {
            fn: fn,
            expected: exact,
            callRecords: callRecords,
            name: fn.name || 'anonymous'
        };

        var wrapper = function() {
            callRecords.push({
                arguments: Array.prototype.slice.call(arguments),
                thisArg: this === globalThis ? undefined : this
            });
            return fn.apply(this, arguments);
        };

        // Copy own properties from the original function.
        // Use Object.create(null) for descriptors to avoid prototype pollution
        // (e.g. Object.prototype.get being set can confuse Object.defineProperty).
        var ownKeys = Object.getOwnPropertyNames(fn);
        for (var i = 0; i < ownKeys.length; i++) {
            var key = ownKeys[i];
            if (key === 'length' || key === 'name' || key === 'prototype') continue;
            var desc = Object.getOwnPropertyDescriptor(fn, key);
            if (desc) {
                var cleanDesc = Object.create(null);
                if (Object.prototype.hasOwnProperty.call(desc, 'value')) {
                    cleanDesc.value = desc.value;
                    cleanDesc.writable = desc.writable;
                } else {
                    if (Object.prototype.hasOwnProperty.call(desc, 'get')) cleanDesc.get = desc.get;
                    if (Object.prototype.hasOwnProperty.call(desc, 'set')) cleanDesc.set = desc.set;
                }
                cleanDesc.enumerable = desc.enumerable;
                cleanDesc.configurable = desc.configurable;
                Object.defineProperty(wrapper, key, cleanDesc);
            }
        }

        // Handle the length property specially
        if (Object.prototype.hasOwnProperty.call(fn, 'length')) {
            var lengthDesc = Object.getOwnPropertyDescriptor(fn, 'length');
            if (lengthDesc && Object.prototype.hasOwnProperty.call(lengthDesc, 'value')) {
                var cleanLenDesc = Object.create(null);
                cleanLenDesc.value = lengthDesc.value;
                cleanLenDesc.writable = false;
                cleanLenDesc.enumerable = false;
                cleanLenDesc.configurable = true;
                Object.defineProperty(wrapper, 'length', cleanLenDesc);
            } else if (lengthDesc && Object.prototype.hasOwnProperty.call(lengthDesc, 'get')) {
                var cleanLenDesc2 = Object.create(null);
                cleanLenDesc2.get = lengthDesc.get;
                if (Object.prototype.hasOwnProperty.call(lengthDesc, 'set')) cleanLenDesc2.set = lengthDesc.set;
                cleanLenDesc2.enumerable = lengthDesc.enumerable;
                cleanLenDesc2.configurable = lengthDesc.configurable;
                Object.defineProperty(wrapper, 'length', cleanLenDesc2);
            }
        } else {
            // fn doesn't have own 'length', remove it from wrapper too
            delete wrapper.length;
        }

        tracking.wrapper = wrapper;
        this._trackedFunctions.push(tracking);

        return wrapper;
    }

    getCalls(fn) {
        var tracking = this._findTracking(fn);
        if (!tracking) {
            var err = new TypeError('The "fn" argument is not a tracked function');
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        var result = tracking.callRecords.map(function(record) {
            return Object.freeze({
                arguments: Object.freeze(Array.prototype.slice.call(record.arguments)),
                thisArg: record.thisArg
            });
        });
        return Object.freeze(result);
    }

    report() {
        var result = [];
        for (var i = 0; i < this._trackedFunctions.length; i++) {
            var t = this._trackedFunctions[i];
            var actual = t.callRecords.length;
            if (actual !== t.expected) {
                result.push({
                    message: 'Expected the ' + t.name + ' function to be executed ' +
                             t.expected + ' time(s) but was executed ' + actual + ' time(s).',
                    actual: actual,
                    expected: t.expected,
                    operator: t.name,
                    stack: new Error().stack
                });
            }
        }
        return result;
    }

    reset(fn) {
        if (fn !== undefined) {
            var tracking = this._findTracking(fn);
            if (!tracking) {
                var err = new TypeError('The "fn" argument is not a tracked function');
                err.code = 'ERR_INVALID_ARG_VALUE';
                throw err;
            }
            tracking.callRecords.length = 0;
        } else {
            for (var i = 0; i < this._trackedFunctions.length; i++) {
                this._trackedFunctions[i].callRecords.length = 0;
            }
        }
    }

    verify() {
        var errors = this.report();
        if (errors.length === 0) return;
        if (errors.length === 1) {
            throw new AssertionError({
                message: errors[0].message,
                actual: errors[0].actual,
                expected: errors[0].expected,
                operator: errors[0].operator
            });
        }
        throw new AssertionError({
            message: 'Functions were not called the expected number of times',
            actual: errors,
            expected: [],
            operator: 'verify'
        });
    }

    _findTracking(fn) {
        for (var i = 0; i < this._trackedFunctions.length; i++) {
            if (this._trackedFunctions[i].wrapper === fn) {
                return this._trackedFunctions[i];
            }
        }
        return null;
    }
}

// --- Wire up the main assert function ---

var assert = function assert(value, message) {
    ok(value, message);
};

assert.ok = ok;
assert.equal = equal;
assert.notEqual = notEqual;
assert.strictEqual = strictEqual;
assert.notStrictEqual = notStrictEqual;
assert.deepEqual = deepEqual;
assert.notDeepEqual = notDeepEqual;
assert.deepStrictEqual = deepStrictEqual;
assert.notDeepStrictEqual = notDeepStrictEqual;
assert.partialDeepStrictEqual = partialDeepStrictEqual;
assert.throws = throws;
assert.doesNotThrow = doesNotThrow;
assert.rejects = rejects;
assert.doesNotReject = doesNotReject;
assert.ifError = ifError;
assert.match = match;
assert.doesNotMatch = doesNotMatch;
assert.fail = fail;
assert.AssertionError = AssertionError;
assert.CallTracker = CallTracker;

var strict = function strict(value, message) {
    ok(value, message);
};

strict.ok = ok;
strict.equal = strictEqual;
strict.notEqual = notStrictEqual;
strict.deepEqual = deepStrictEqual;
strict.notDeepEqual = notDeepStrictEqual;
strict.strictEqual = strictEqual;
strict.notStrictEqual = notStrictEqual;
strict.deepStrictEqual = deepStrictEqual;
strict.notDeepStrictEqual = notDeepStrictEqual;
strict.partialDeepStrictEqual = partialDeepStrictEqual;
strict.throws = throws;
strict.doesNotThrow = doesNotThrow;
strict.rejects = rejects;
strict.doesNotReject = doesNotReject;
strict.ifError = ifError;
strict.match = match;
strict.doesNotMatch = doesNotMatch;
strict.fail = fail;
strict.AssertionError = AssertionError;
strict.CallTracker = CallTracker;
strict.strict = strict;

assert.strict = strict;

export {
    AssertionError,
    CallTracker,
    ok,
    equal,
    notEqual,
    strictEqual,
    notStrictEqual,
    deepEqual,
    notDeepEqual,
    deepStrictEqual,
    notDeepStrictEqual,
    partialDeepStrictEqual,
    throws,
    doesNotThrow,
    rejects,
    doesNotReject,
    ifError,
    match,
    doesNotMatch,
    fail,
    strict
};

export default assert;
