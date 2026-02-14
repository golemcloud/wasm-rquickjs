import { eval_in_new_context as evalInNewContext } from '__wasm_rquickjs_builtin/vm_native';

var contextIdCounter = 1;
var contextSymbol = Symbol('vm.context');

export function runInNewContext(code, sandbox, options) {
    if (code === undefined || code === null) code = '';
    code = String(code);

    var keys = [];
    var values = [];

    if (sandbox && typeof sandbox === 'object') {
        var sandboxKeys = Object.keys(sandbox);
        for (var i = 0; i < sandboxKeys.length; i++) {
            keys.push(sandboxKeys[i]);
            values.push(sandbox[sandboxKeys[i]]);
        }
    }

    return evalInNewContext(code, keys, values);
}

export function createContext(sandbox) {
    if (sandbox === undefined || sandbox === null) {
        sandbox = {};
    }
    if (typeof sandbox !== 'object') {
        throw new TypeError('sandbox must be an object');
    }
    sandbox[contextSymbol] = contextIdCounter++;
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

    var keys = Object.keys(context).filter(function(k) { return k !== contextSymbol.toString(); });
    var values = keys.map(function(k) { return context[k]; });

    return evalInNewContext(code, keys, values);
}

export function runInThisContext(code, options) {
    if (code === undefined || code === null) return undefined;
    return (0, eval)(String(code));
}

export function compileFunction(code, params, options) {
    params = params || [];
    return new Function(...params, code);
}

export class Script {
    constructor(code, options) {
        this._code = String(code);
    }

    runInNewContext(sandbox, options) {
        return runInNewContext(this._code, sandbox, options);
    }

    runInContext(context, options) {
        return runInContext(this._code, context, options);
    }

    runInThisContext(options) {
        return runInThisContext(this._code, options);
    }

    createCachedData() {
        return new Uint8Array(0);
    }
}

export function createScript(code, options) {
    return new Script(code, options);
}

var vmExports = {
    runInNewContext,
    runInContext,
    runInThisContext,
    createContext,
    isContext,
    compileFunction,
    Script,
    createScript,
};

export default vmExports;
