import {
    eval_in_new_context as evalInNewContext,
    eval_with_filename as evalWithFilename,
} from '__wasm_rquickjs_builtin/vm_native';
import * as pathModule from 'node:path';

let contextIdCounter = 1;
const contextSymbol = Symbol('vm.context');
const contextOptionsSymbol = Symbol('vm.context.options');
const identifierPattern = /^[$A-Z_a-z][$0-9A-Z_a-z]*$/;
const moduleNamespaceExportsSymbol = Symbol.for('wasm-rquickjs.vm.namespaceExports');
const moduleNamespaceBindingsSymbol = Symbol.for('wasm-rquickjs.vm.namespaceBindings');
const USE_MAIN_CONTEXT_DEFAULT_LOADER = Symbol('vm_dynamic_import_main_context_default');
const defaultLoaderImportHelper = '__wasm_rquickjs_vm_default_loader_import__';
const missingDynamicImportHelper = '__wasm_rquickjs_vm_missing_dynamic_import__';
const missingDynamicImportFlagHelper = '__wasm_rquickjs_vm_missing_dynamic_import_flag__';
let defaultLoaderImportHelperCounter = 1;
function defaultLoaderImportFunction(filename, specifier) {
    return import(resolveDefaultLoaderSpecifier(String(specifier), filename));
}

function missingDynamicImportFunction() {
    const err = new TypeError('A dynamic import callback was not specified.');
    err.code = 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING';
    return Promise.reject(err);
}

function missingDynamicImportFlagFunction() {
    const err = new TypeError('A dynamic import callback was invoked without --experimental-vm-modules');
    err.code = 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG';
    return Promise.reject(err);
}

export const constants = {
    USE_MAIN_CONTEXT_DEFAULT_LOADER,
};

function splitDeclarators(declarationList) {
    const result = [];
    let current = '';
    let depth = 0;
    let quote = '';

    for (let i = 0; i < declarationList.length; i++) {
        const ch = declarationList[i];
        const prev = i > 0 ? declarationList[i - 1] : '';

        if (quote) {
            current += ch;
            if (ch === quote && prev !== '\\') {
                quote = '';
            }
            continue;
        }

        if (ch === '\'' || ch === '"' || ch === '`') {
            quote = ch;
            current += ch;
            continue;
        }

        if (ch === '(' || ch === '[' || ch === '{') {
            depth++;
            current += ch;
            continue;
        }

        if (ch === ')' || ch === ']' || ch === '}') {
            if (depth > 0) depth--;
            current += ch;
            continue;
        }

        if (ch === ',' && depth === 0) {
            if (current.trim().length > 0) {
                result.push(current.trim());
            }
            current = '';
            continue;
        }

        current += ch;
    }

    if (current.trim().length > 0) {
        result.push(current.trim());
    }

    return result;
}

function parseSourceTextModuleBindings(source) {
    const bindings = [];
    const exportDeclarationPattern = /export\s+(const|let|var)\s+([^;]+)/g;
    let match;

    while ((match = exportDeclarationPattern.exec(source)) !== null) {
        const kind = match[1];
        const declarators = splitDeclarators(match[2]);

        for (let i = 0; i < declarators.length; i++) {
            const declarator = declarators[i];
            const eq = declarator.indexOf('=');
            const bindingName = (eq === -1 ? declarator : declarator.slice(0, eq)).trim();

            if (!identifierPattern.test(bindingName)) {
                throw new SyntaxError('Unsupported export declaration in vm.SourceTextModule');
            }

            bindings.push({
                name: bindingName,
                kind,
            });
        }
    }

    if (source.indexOf('export ') !== -1 && bindings.length === 0) {
        throw new SyntaxError('Unsupported export declaration in vm.SourceTextModule');
    }

    return bindings;
}

function compileSourceTextModuleEvaluator(source, names) {
    const executableSource = source.replace(/\bexport\s+(?=(?:const|let|var)\b)/g, '');
    const exportObjectEntries = names.map(function(name) {
        return JSON.stringify(name) + ': ' + name;
    }).join(', ');

    return new Function('"use strict";\n' + executableSource + '\nreturn { ' + exportObjectEntries + ' };');
}

function createModuleNamespace(module) {
    const namespaceTarget = Object.create(null);
    const names = module._names.slice().sort();

    // QuickJS does not expose virtual export keys from this proxy via
    // Object.getOwnPropertyNames() while bindings are uninitialized.
    // Store names out-of-band so util.inspect can still enumerate exports.
    Object.defineProperty(namespaceTarget, moduleNamespaceExportsSymbol, {
        value: names.slice(),
        enumerable: false,
        writable: false,
        configurable: false,
    });
    Object.defineProperty(namespaceTarget, moduleNamespaceBindingsSymbol, {
        value: module._bindings,
        enumerable: false,
        writable: false,
        configurable: false,
    });

    Object.defineProperty(namespaceTarget, Symbol.toStringTag, {
        value: 'Module',
        enumerable: false,
        writable: false,
        configurable: true,
    });

    return new Proxy(namespaceTarget, {
        ownKeys: function() {
            return names.concat([Symbol.toStringTag]);
        },
        has: function(_target, prop) {
            if (typeof prop === 'string' && module._bindings[prop] !== undefined) {
                return true;
            }
            return prop in namespaceTarget;
        },
        get: function(_target, prop, receiver) {
            if (typeof prop === 'string' && module._bindings[prop] !== undefined) {
                const binding = module._bindings[prop];
                if (!binding.initialized) {
                    throw new ReferenceError(prop + ' is not initialized');
                }
                return binding.value;
            }
            return Reflect.get(namespaceTarget, prop, receiver);
        },
        getOwnPropertyDescriptor: function(_target, prop) {
            if (typeof prop === 'string' && module._bindings[prop] !== undefined) {
                const binding = module._bindings[prop];
                if (!binding.initialized) {
                    throw new ReferenceError(prop + ' is not initialized');
                }

                return {
                    value: binding.value,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                };
            }

            return Object.getOwnPropertyDescriptor(namespaceTarget, prop);
        },
    });
}

function createIndirectEvalSource(code) {
    return '(0, eval)(' + JSON.stringify(code) + ')';
}

export function runInNewContext(code, sandbox, options) {
    if (code === undefined || code === null) code = '';
    code = String(code);
    options = validateOptionsObject(options);
    let helperName;
    if (options.importModuleDynamically === USE_MAIN_CONTEXT_DEFAULT_LOADER) {
        const rewritten = rewriteDefaultLoaderDynamicImportsForEvaluation(code, referrerFilenameFromOptions(options));
        code = rewritten.code;
        helperName = rewritten.helperName;
    } else if (options.importModuleDynamically === undefined) {
        const rewritten = rewriteMissingDynamicImportsForEvaluation(code);
        code = rewritten.code;
        helperName = rewritten.helperName;
    } else if (typeof options.importModuleDynamically === 'function') {
        const rewritten = rewriteMissingDynamicImportFlagForEvaluation(code);
        code = rewritten.code;
        helperName = rewritten.helperName;
    }
    return evalCodeInNewContext(code, sandbox, helperName);
}

function evalCodeInNewContext(code, sandbox, helperName) {
    const keys = [];
    const values = [];

    if (sandbox && typeof sandbox === 'object') {
        const sandboxKeys = Object.keys(sandbox);
        for (let i = 0; i < sandboxKeys.length; i++) {
            keys.push(sandboxKeys[i]);
            values.push(sandbox[sandboxKeys[i]]);
        }
    }
    if (helperName) {
        keys.push(helperName);
        values.push(globalThis[helperName]);
    }

    return evalInNewContext(createIndirectEvalSource(code), keys, values);
}

export function createContext(sandbox, options) {
    if (sandbox === undefined || sandbox === null) {
        sandbox = {};
    }
    if (typeof sandbox !== 'object') {
        throw new TypeError('sandbox must be an object');
    }
    options = validateOptionsObject(options);
    sandbox[contextSymbol] = contextIdCounter++;
    sandbox[contextOptionsSymbol] = snapshotVmOptions(options);
    return sandbox;
}

export function isContext(obj) {
    return obj != null && typeof obj === 'object' && contextSymbol in obj;
}

export function runInContext(code, context, options) {
    if (!isContext(context)) {
        throw new TypeError('argument must be a vm.Context');
    }
    if (code === undefined || code === null) code = '';
    code = String(code);
    options = validateOptionsObject(options);
    let helperName;
    if (options.importModuleDynamically === USE_MAIN_CONTEXT_DEFAULT_LOADER) {
        const rewritten = rewriteDefaultLoaderDynamicImportsForEvaluation(code, referrerFilenameFromOptions(options));
        code = rewritten.code;
        helperName = rewritten.helperName;
    } else if (options.importModuleDynamically === undefined) {
        const rewritten = rewriteMissingDynamicImportsForEvaluation(code);
        code = rewritten.code;
        helperName = rewritten.helperName;
    } else if (typeof options.importModuleDynamically === 'function') {
        const rewritten = rewriteMissingDynamicImportFlagForEvaluation(code);
        code = rewritten.code;
        helperName = rewritten.helperName;
    }
    return evalCodeInContext(code, context, helperName);
}

function evalCodeInContext(code, context, helperName) {
    const keys = [];
    const values = [];
    for (const k of Object.keys(context)) {
        if (typeof context[contextSymbol] !== 'undefined' && k === String(contextSymbol)) {
            continue;
        }
        keys.push(k);
        values.push(context[k]);
    }
    if (helperName) {
        keys.push(helperName);
        values.push(globalThis[helperName]);
    }

    return evalInNewContext(createIndirectEvalSource(code), keys, values);
}

export function runInThisContext(code, options) {
    if (code === undefined || code === null) return undefined;
    code = String(code);
    options = validateOptionsObject(options);
    if (options.importModuleDynamically === USE_MAIN_CONTEXT_DEFAULT_LOADER) {
        const filename = referrerFilenameFromOptions(options);
        return evalWithFilename(rewriteDefaultLoaderDynamicImportsForEvaluation(code, filename).code, filename);
    }
    if (options.importModuleDynamically === undefined) {
        return (0, eval)(rewriteMissingDynamicImportsForEvaluation(code).code);
    }
    if (typeof options.importModuleDynamically === 'function') {
        return (0, eval)(rewriteMissingDynamicImportFlagForEvaluation(code).code);
    }
    return (0, eval)(code);
}

export function compileFunction(code, params, options) {
    params = params || [];
    options = validateOptionsObject(options);
    validateInt32Option(options.lineOffset, 'options.lineOffset');
    validateInt32Option(options.columnOffset, 'options.columnOffset');
    if (options.importModuleDynamically === USE_MAIN_CONTEXT_DEFAULT_LOADER) {
        const filename = referrerFilenameFromOptions(options);
        const paramList = params.map(String).join(',');
        const source = '(function(' + paramList + '){' + rewriteDefaultLoaderDynamicImportsForEvaluation(String(code), filename).code + '\n})';
        return evalWithFilename(source, filename);
    }
    if (options.importModuleDynamically === undefined) {
        code = rewriteMissingDynamicImportsForEvaluation(String(code)).code;
    } else if (typeof options.importModuleDynamically === 'function') {
        code = rewriteMissingDynamicImportFlagForEvaluation(String(code)).code;
    }
    return new Function(...params, code);
}

function snapshotVmOptions(options) {
    options = validateOptionsObject(options);
    return Object.assign({}, options);
}

function validateOptionsObject(options) {
    if (options === undefined) return {};
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throwInvalidArgType('options', 'object', options);
    }
    return options;
}

function validateInt32Option(value, name) {
    if (value === undefined) return;
    if (typeof value !== 'number') {
        throwInvalidArgType(name, 'number', value);
    }
    if (!Number.isInteger(value)) {
        throwOutOfRange(name, 'an integer', value);
    }
    if (value < -2147483648 || value > 2147483647) {
        throwOutOfRange(name, '>= -2147483648 && <= 2147483647', value);
    }
}

function hasIdentifierBoundary(source, start, end) {
    const before = start > 0 ? source.charCodeAt(start - 1) : 0;
    const after = end < source.length ? source.charCodeAt(end) : 0;
    return !isIdentifierChar(before) && !isIdentifierChar(after);
}

function isIdentifierChar(ch) {
    return ch === 0x5f || ch === 0x24 ||
        (ch >= 0x30 && ch <= 0x39) ||
        (ch >= 0x41 && ch <= 0x5a) ||
        (ch >= 0x61 && ch <= 0x7a) ||
        ch >= 0x80;
}

function skipWhitespaceAndComments(source, i) {
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d || ch === 0x0b || ch === 0x0c) {
            i++;
            continue;
        }
        if (ch === 0x2f && source.charCodeAt(i + 1) === 0x2f) {
            i += 2;
            while (i < source.length && source.charCodeAt(i) !== 0x0a && source.charCodeAt(i) !== 0x0d) i++;
            continue;
        }
        if (ch === 0x2f && source.charCodeAt(i + 1) === 0x2a) {
            i += 2;
            while (i + 1 < source.length && !(source.charCodeAt(i) === 0x2a && source.charCodeAt(i + 1) === 0x2f)) i++;
            i = Math.min(i + 2, source.length);
            continue;
        }
        break;
    }
    return i;
}

function skipStringLiteral(source, i, quote) {
    i++;
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x5c) {
            i += 2;
            continue;
        }
        i++;
        if (ch === quote) break;
    }
    return i;
}

function skipTemplateLiteral(source, i) {
    i++;
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x5c) {
            i += 2;
            continue;
        }
        i++;
        if (ch === 0x60) break;
    }
    return i;
}

function rewriteTemplateLiteral(source, start, replacementOpenSource) {
    let i = start + 1;
    let out = '`';
    let chunkStart = i;
    let changed = false;
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x5c) {
            i += 2;
            continue;
        }
        if (ch === 0x60) {
            out += source.slice(chunkStart, i + 1);
            return { end: i + 1, text: out, changed };
        }
        if (ch === 0x24 && source.charCodeAt(i + 1) === 0x7b) {
            out += source.slice(chunkStart, i + 2);
            const expressionStart = i + 2;
            const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
            if (expressionEnd === -1) {
                out += source.slice(expressionStart);
                return { end: source.length, text: out, changed };
            }
            const expression = source.slice(expressionStart, expressionEnd);
            const rewritten = rewriteDynamicImports(expression, replacementOpenSource);
            if (rewritten.changed) changed = true;
            out += rewritten.code + '}';
            i = expressionEnd + 1;
            chunkStart = i;
            continue;
        }
        i++;
    }
    out += source.slice(chunkStart);
    return { end: source.length, text: out, changed };
}

function findTemplateExpressionEnd(source, start) {
    let i = start;
    let depth = 0;
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x27 || ch === 0x22) {
            i = skipStringLiteral(source, i, ch);
            continue;
        }
        if (ch === 0x60) {
            i = skipTemplateLiteral(source, i);
            continue;
        }
        if (ch === 0x2f && source.charCodeAt(i + 1) === 0x2f) {
            i += 2;
            while (i < source.length && source.charCodeAt(i) !== 0x0a && source.charCodeAt(i) !== 0x0d) i++;
            continue;
        }
        if (ch === 0x2f && source.charCodeAt(i + 1) === 0x2a) {
            i = skipWhitespaceAndComments(source, i);
            continue;
        }
        if (ch === 0x2f && regexCanFollow(source, i)) {
            i = skipRegexLiteral(source, i);
            continue;
        }
        if (ch === 0x7b) {
            depth++;
        } else if (ch === 0x7d) {
            if (depth === 0) return i;
            depth--;
        }
        i++;
    }
    return -1;
}

function findMatchingParen(source, open) {
    let depth = 1;
    let i = open + 1;
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x27 || ch === 0x22) {
            i = skipStringLiteral(source, i, ch);
            continue;
        }
        if (ch === 0x60) {
            i = skipTemplateLiteral(source, i);
            continue;
        }
        if (ch === 0x2f && source.charCodeAt(i + 1) === 0x2f) {
            i += 2;
            while (i < source.length && source.charCodeAt(i) !== 0x0a && source.charCodeAt(i) !== 0x0d) i++;
            continue;
        }
        if (ch === 0x2f && source.charCodeAt(i + 1) === 0x2a) {
            i = skipWhitespaceAndComments(source, i);
            continue;
        }
        if (ch === 0x2f && regexCanFollow(source, i)) {
            i = skipRegexLiteral(source, i);
            continue;
        }
        if (ch === 0x28) {
            depth++;
        } else if (ch === 0x29) {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

function skipRegexLiteral(source, i) {
    i++;
    let inClass = false;
    while (i < source.length) {
        const ch = source.charCodeAt(i);
        if (ch === 0x5c) {
            i += 2;
            continue;
        }
        if (ch === 0x5b) inClass = true;
        else if (ch === 0x5d) inClass = false;
        else if (ch === 0x2f && !inClass) {
            i++;
            while (i < source.length && isIdentifierChar(source.charCodeAt(i))) i++;
            break;
        }
        i++;
    }
    return i;
}

function isLikelyRegexLiteral(source, i) {
    const end = skipRegexLiteral(source, i);
    if (end >= source.length) return true;
    if (end === i + 1) return false;
    const next = source.charCodeAt(end);
    return next === 0x20 || next === 0x09 || next === 0x0a || next === 0x0d ||
        next === 0x2e || next === 0x3b || next === 0x2c || next === 0x29 ||
        next === 0x5d || next === 0x7d;
}

function previousWordBeforeMatchingParen(source, closeIndex) {
    let depth = 1;
    let i = closeIndex - 1;
    while (i >= 0) {
        const ch = source.charCodeAt(i);
        if (ch === 0x29) {
            depth++;
        } else if (ch === 0x28) {
            depth--;
            if (depth === 0) return previousSignificantWord(source, i);
        }
        i--;
    }
    return '';
}

function regexCanFollowParen(source, i) {
    if (previousSignificantChar(source, i) !== 0x29) return false;
    const word = previousWordBeforeMatchingParen(source, i - 1);
    return word === 'if' || word === 'while' || word === 'for' || word === 'with';
}

function previousSignificantChar(source, i) {
    i--;
    while (i >= 0) {
        const ch = source.charCodeAt(i);
        if (ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d || ch === 0x0b || ch === 0x0c) {
            i--;
            continue;
        }
        return ch;
    }
    return 0;
}

function previousSignificantWord(source, i) {
    i--;
    while (i >= 0) {
        const ch = source.charCodeAt(i);
        if (ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d || ch === 0x0b || ch === 0x0c) {
            i--;
            continue;
        }
        break;
    }
    const end = i + 1;
    while (i >= 0 && isIdentifierChar(source.charCodeAt(i))) i--;
    if (end === i + 1) return '';
    return source.slice(i + 1, end);
}

function previousSignificantIndex(source, i) {
    i--;
    while (i >= 0) {
        const ch = source.charCodeAt(i);
        if (ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d || ch === 0x0b || ch === 0x0c) {
            i--;
            continue;
        }
        return i;
    }
    return -1;
}

function regexCanFollow(source, i) {
    const prev = previousSignificantChar(source, i);
    if (prev === 0 || prev === 0x28 || prev === 0x5b || prev === 0x7b || prev === 0x2c ||
        prev === 0x3b || prev === 0x3a || prev === 0x3d || prev === 0x21 || prev === 0x3f ||
        prev === 0x26 || prev === 0x7c || prev === 0x2b || prev === 0x2d || prev === 0x2a ||
        prev === 0x2f || prev === 0x25 || prev === 0x7e || prev === 0x5e || prev === 0x3c ||
        prev === 0x3e) {
        return true;
    }
    const word = previousSignificantWord(source, i);
    return word === 'return' || word === 'throw' || word === 'case' || word === 'delete' ||
        word === 'void' || word === 'typeof' || word === 'yield' || word === 'await' ||
        word === 'else' || word === 'do' || word === 'in' || word === 'instanceof';
}

function isImportMethodDefinition(source, importStart, open) {
    const isMethodDelimiter = (ch) => ch === 0x7b || ch === 0x2c;
    const before = previousSignificantChar(source, importStart);
    let hasMethodPrefix = isMethodDelimiter(before);
    if (!hasMethodPrefix) {
        const prefixIndex = previousSignificantIndex(source, importStart);
        if (before === 0x2a && prefixIndex >= 0) {
            const beforeStar = previousSignificantChar(source, prefixIndex);
            if (isMethodDelimiter(beforeStar)) {
                hasMethodPrefix = true;
            } else if (previousSignificantWord(source, prefixIndex) === 'async') {
                const asyncEnd = previousSignificantIndex(source, prefixIndex) + 1;
                const asyncStart = source.lastIndexOf('async', asyncEnd);
                const beforeAsync = previousSignificantChar(source, asyncStart);
                if (isMethodDelimiter(beforeAsync)) {
                    hasMethodPrefix = true;
                } else if (previousSignificantWord(source, asyncStart) === 'static') {
                    const staticStart = source.lastIndexOf('static', asyncStart);
                    hasMethodPrefix = isMethodDelimiter(previousSignificantChar(source, staticStart));
                }
            } else if (previousSignificantWord(source, prefixIndex) === 'static') {
                const staticEnd = previousSignificantIndex(source, prefixIndex) + 1;
                const staticStart = source.lastIndexOf('static', staticEnd);
                hasMethodPrefix = isMethodDelimiter(previousSignificantChar(source, staticStart));
            }
        } else {
            const word = previousSignificantWord(source, importStart);
            if (word === 'async' || word === 'get' || word === 'set' || word === 'static') {
                const wordStart = source.lastIndexOf(word, importStart);
                const beforeWord = previousSignificantChar(source, wordStart);
                if (isMethodDelimiter(beforeWord)) {
                    hasMethodPrefix = true;
                } else if (word !== 'static' && previousSignificantWord(source, wordStart) === 'static') {
                    const staticStart = source.lastIndexOf('static', wordStart);
                    hasMethodPrefix = isMethodDelimiter(previousSignificantChar(source, staticStart));
                }
            }
        }
    }
    if (!hasMethodPrefix) return false;
    const close = findMatchingParen(source, open);
    if (close < 0) return false;
    return source.charCodeAt(skipWhitespaceAndComments(source, close + 1)) === 0x7b;
}

function throwInvalidArgType(name, expected, value) {
    const err = new TypeError('The "' + name + '" argument must be of type ' + expected + '. Received ' + formatReceived(value));
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
}

function throwOutOfRange(name, range, value) {
    const err = new RangeError('The value of "' + name + '" is out of range. It must be ' + range + '. Received ' + formatReceived(value));
    err.code = 'ERR_OUT_OF_RANGE';
    throw err;
}

function formatReceived(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return "'" + value + "'";
    if (typeof value === 'symbol') return value.toString();
    return String(value);
}

function referrerFilenameFromOptions(options) {
    if (typeof options.filename === 'string' && options.filename.length > 0) {
        return options.filename;
    }
    if (globalThis.process && typeof globalThis.process.cwd === 'function') {
        return globalThis.process.cwd() + '/';
    }
    return '/';
}

function referrerDirectory(filename) {
    if (filename.startsWith('file://')) {
        try {
            filename = decodeURIComponent(new URL(filename).pathname);
        } catch (_) {
            return globalThis.process && typeof globalThis.process.cwd === 'function'
                ? globalThis.process.cwd()
                : '/';
        }
    }
    if (filename.endsWith('/')) return filename.slice(0, -1) || '/';
    if (!filename.startsWith('/')) {
        return globalThis.process && typeof globalThis.process.cwd === 'function'
            ? globalThis.process.cwd()
            : '/';
    }
    return pathModule.dirname(filename);
}

function resolveDefaultLoaderSpecifier(specifier, filename) {
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
        return pathModule.resolve(referrerDirectory(filename), specifier);
    }
    return specifier;
}

function ensureDefaultLoaderImportBinding(helperName) {
    if (globalThis[helperName] !== defaultLoaderImportFunction) {
        Object.defineProperty(globalThis, helperName, {
            value: defaultLoaderImportFunction,
            writable: false,
            configurable: true,
        });
    }
}

function ensureMissingDynamicImportBinding(helperName) {
    if (globalThis[helperName] !== missingDynamicImportFunction) {
        Object.defineProperty(globalThis, helperName, {
            value: missingDynamicImportFunction,
            writable: false,
            configurable: true,
        });
    }
}

function ensureMissingDynamicImportFlagBinding(helperName) {
    if (globalThis[helperName] !== missingDynamicImportFlagFunction) {
        Object.defineProperty(globalThis, helperName, {
            value: missingDynamicImportFlagFunction,
            writable: false,
            configurable: true,
        });
    }
}

function chooseDefaultLoaderImportHelperName(code) {
    let helperName;
    do {
        helperName = defaultLoaderImportHelper + '_' + defaultLoaderImportHelperCounter++;
    } while (code.indexOf(helperName) !== -1);
    return helperName;
}

function chooseMissingDynamicImportHelperName(code) {
    let helperName;
    do {
        helperName = missingDynamicImportHelper + '_' + defaultLoaderImportHelperCounter++;
    } while (code.indexOf(helperName) !== -1);
    return helperName;
}

function chooseMissingDynamicImportFlagHelperName(code) {
    let helperName;
    do {
        helperName = missingDynamicImportFlagHelper + '_' + defaultLoaderImportHelperCounter++;
    } while (code.indexOf(helperName) !== -1);
    return helperName;
}

function defaultLoaderImportSource(filename, helperName) {
    return helperName + '(' + JSON.stringify(filename) + ',';
}

function missingDynamicImportSource(helperName) {
    return helperName + '(';
}

function missingDynamicImportFlagSource(helperName) {
    return helperName + '(';
}

function rewriteDefaultLoaderDynamicImportsForEvaluation(code, filename) {
    code = String(code);
    const helperName = chooseDefaultLoaderImportHelperName(code);
    const rewritten = rewriteDynamicImports(code, defaultLoaderImportSource(filename, helperName));
    if (rewritten.changed) ensureDefaultLoaderImportBinding(helperName);
    return {
        code: rewritten.code,
        helperName,
    };
}

function rewriteMissingDynamicImportsForEvaluation(code) {
    code = String(code);
    const helperName = chooseMissingDynamicImportHelperName(code);
    const rewritten = rewriteDynamicImports(code, missingDynamicImportSource(helperName));
    if (rewritten.changed) ensureMissingDynamicImportBinding(helperName);
    return {
        code: rewritten.code,
        helperName,
    };
}

function rewriteMissingDynamicImportFlagForEvaluation(code) {
    code = String(code);
    const helperName = chooseMissingDynamicImportFlagHelperName(code);
    const rewritten = rewriteDynamicImports(code, missingDynamicImportFlagSource(helperName));
    if (rewritten.changed) ensureMissingDynamicImportFlagBinding(helperName);
    return {
        code: rewritten.code,
        helperName,
    };
}

function rewriteDynamicImports(code, replacementOpenSource) {
    code = String(code);
    let changed = false;
    let out = '';
    let last = 0;
    let i = 0;
    while (i < code.length) {
        const ch = code.charCodeAt(i);
        if (ch === 0x27 || ch === 0x22) {
            i = skipStringLiteral(code, i, ch);
            continue;
        }
        if (ch === 0x60) {
            const template = rewriteTemplateLiteral(code, i, replacementOpenSource);
            if (template.changed) {
                changed = true;
                out += code.slice(last, i) + template.text;
                last = template.end;
            }
            i = template.end;
            continue;
        }
        if (ch === 0x2f && code.charCodeAt(i + 1) === 0x2f) {
            i += 2;
            while (i < code.length && code.charCodeAt(i) !== 0x0a && code.charCodeAt(i) !== 0x0d) i++;
            continue;
        }
        if (ch === 0x2f && code.charCodeAt(i + 1) === 0x2a) {
            i = skipWhitespaceAndComments(code, i);
            continue;
        }
        if (ch === 0x2f && (regexCanFollow(code, i) || (regexCanFollowParen(code, i) && isLikelyRegexLiteral(code, i)))) {
            i = skipRegexLiteral(code, i);
            continue;
        }
        if (code.startsWith('import', i)
            && hasIdentifierBoundary(code, i, i + 6)
            && previousSignificantChar(code, i) !== 0x2e
            && previousSignificantChar(code, i) !== 0x23) {
            const open = skipWhitespaceAndComments(code, i + 6);
            if (code.charCodeAt(open) === 0x28) {
                if (isImportMethodDefinition(code, i, open)) {
                    i = open + 1;
                    continue;
                }
                changed = true;
                out += code.slice(last, i) + replacementOpenSource;
                last = open + 1;
                i = open + 1;
                continue;
            }
        }
        i++;
    }
    if (last === 0) return { code, changed: false };
    return { code: out + code.slice(last), changed };
}

export class Script {
    constructor(code, options) {
        this._code = String(code);
        this._options = snapshotVmOptions(options);
        this._usesDefaultLoader = this._options.importModuleDynamically === USE_MAIN_CONTEXT_DEFAULT_LOADER;
        this._usesMissingDynamicImportCallback = this._options.importModuleDynamically === undefined;
        this._usesMissingDynamicImportFlag = typeof this._options.importModuleDynamically === 'function';
        this._defaultLoaderFilename = this._usesDefaultLoader
            ? referrerFilenameFromOptions(this._options)
            : undefined;
        const defaultLoaderRewrite = this._usesDefaultLoader
            ? rewriteDefaultLoaderDynamicImportsForEvaluation(this._code, this._defaultLoaderFilename)
            : undefined;
        const missingCallbackRewrite = this._usesMissingDynamicImportCallback
            ? rewriteMissingDynamicImportsForEvaluation(this._code)
            : undefined;
        const missingFlagRewrite = this._usesMissingDynamicImportFlag
            ? rewriteMissingDynamicImportFlagForEvaluation(this._code)
            : undefined;
        this._defaultLoaderCode = defaultLoaderRewrite && defaultLoaderRewrite.code;
        this._defaultLoaderHelperName = defaultLoaderRewrite && defaultLoaderRewrite.helperName;
        this._missingCallbackCode = missingCallbackRewrite && missingCallbackRewrite.code;
        this._missingCallbackHelperName = missingCallbackRewrite && missingCallbackRewrite.helperName;
        this._missingFlagCode = missingFlagRewrite && missingFlagRewrite.code;
        this._missingFlagHelperName = missingFlagRewrite && missingFlagRewrite.helperName;
    }

    runInNewContext(sandbox, options) {
        validateOptionsObject(options);
        if (this._usesDefaultLoader) {
            return evalCodeInNewContext(this._defaultLoaderCode, sandbox, this._defaultLoaderHelperName);
        }
        if (this._usesMissingDynamicImportCallback) {
            return evalCodeInNewContext(this._missingCallbackCode, sandbox, this._missingCallbackHelperName);
        }
        if (this._usesMissingDynamicImportFlag) {
            return evalCodeInNewContext(this._missingFlagCode, sandbox, this._missingFlagHelperName);
        }
        return runInNewContext(this._code, sandbox, {});
    }

    runInContext(context, options) {
        validateOptionsObject(options);
        if (this._usesDefaultLoader) {
            if (!isContext(context)) {
                throw new TypeError('argument must be a vm.Context');
            }
            return evalCodeInContext(this._defaultLoaderCode, context, this._defaultLoaderHelperName);
        }
        if (this._usesMissingDynamicImportCallback) {
            if (!isContext(context)) {
                throw new TypeError('argument must be a vm.Context');
            }
            return evalCodeInContext(this._missingCallbackCode, context, this._missingCallbackHelperName);
        }
        if (this._usesMissingDynamicImportFlag) {
            if (!isContext(context)) {
                throw new TypeError('argument must be a vm.Context');
            }
            return evalCodeInContext(this._missingFlagCode, context, this._missingFlagHelperName);
        }
        return runInContext(this._code, context, {});
    }

    runInThisContext(options) {
        validateOptionsObject(options);
        if (this._usesDefaultLoader) {
            return evalWithFilename(this._defaultLoaderCode, this._defaultLoaderFilename);
        }
        if (this._usesMissingDynamicImportCallback) {
            return (0, eval)(this._missingCallbackCode);
        }
        if (this._usesMissingDynamicImportFlag) {
            return (0, eval)(this._missingFlagCode);
        }
        return runInThisContext(this._code, {});
    }

    createCachedData() {
        return new Uint8Array(0);
    }
}

export class SourceTextModule {
    constructor(code, options) {
        this._source = String(code);
        this._status = 'unlinked';

        const declaredBindings = parseSourceTextModuleBindings(this._source);
        this._bindings = Object.create(null);
        this._names = [];

        for (let i = 0; i < declaredBindings.length; i++) {
            const binding = declaredBindings[i];
            this._names.push(binding.name);
            this._bindings[binding.name] = {
                kind: binding.kind,
                initialized: binding.kind === 'var',
                value: undefined,
            };
        }

        this._evaluateSource = compileSourceTextModuleEvaluator(this._source, this._names);
        this._namespace = createModuleNamespace(this);
    }

    get status() {
        return this._status;
    }

    get namespace() {
        if (this._status === 'unlinked') {
            throw new Error('Module status must be linked');
        }
        return this._namespace;
    }

    async link(linker) {
        this._status = 'linked';
    }

    async evaluate(options) {
        if (this._status === 'unlinked') {
            throw new Error('Module status must be linked before evaluate()');
        }
        if (this._status === 'evaluated') {
            return undefined;
        }

        this._status = 'evaluating';

        try {
            const evaluatedExports = this._evaluateSource();
            for (let i = 0; i < this._names.length; i++) {
                const name = this._names[i];
                const binding = this._bindings[name];
                binding.initialized = true;
                binding.value = evaluatedExports[name];
            }
            this._status = 'evaluated';
            return undefined;
        } catch (err) {
            this._status = 'errored';
            throw err;
        }
    }
}

export function createScript(code, options) {
    return new Script(code, options);
}

const vmExports = {
    runInNewContext,
    runInContext,
    runInThisContext,
    createContext,
    isContext,
    compileFunction,
    Script,
    SourceTextModule,
    createScript,
    constants,
};

export default vmExports;
