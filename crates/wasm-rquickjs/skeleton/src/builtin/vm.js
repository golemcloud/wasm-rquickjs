import { eval_in_new_context as evalInNewContext } from '__wasm_rquickjs_builtin/vm_native';

var contextIdCounter = 1;
var contextSymbol = Symbol('vm.context');
var identifierPattern = /^[$A-Z_a-z][$0-9A-Z_a-z]*$/;
var moduleNamespaceExportsSymbol = Symbol.for('wasm-rquickjs.vm.namespaceExports');
var moduleNamespaceBindingsSymbol = Symbol.for('wasm-rquickjs.vm.namespaceBindings');

function splitDeclarators(declarationList) {
    var result = [];
    var current = '';
    var depth = 0;
    var quote = '';

    for (var i = 0; i < declarationList.length; i++) {
        var ch = declarationList[i];
        var prev = i > 0 ? declarationList[i - 1] : '';

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
    var bindings = [];
    var exportDeclarationPattern = /export\s+(const|let|var)\s+([^;]+)/g;
    var match;

    while ((match = exportDeclarationPattern.exec(source)) !== null) {
        var kind = match[1];
        var declarators = splitDeclarators(match[2]);

        for (var i = 0; i < declarators.length; i++) {
            var declarator = declarators[i];
            var eq = declarator.indexOf('=');
            var bindingName = (eq === -1 ? declarator : declarator.slice(0, eq)).trim();

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
    var executableSource = source.replace(/\bexport\s+(?=(?:const|let|var)\b)/g, '');
    var exportObjectEntries = names.map(function(name) {
        return JSON.stringify(name) + ': ' + name;
    }).join(', ');

    return new Function('"use strict";\n' + executableSource + '\nreturn { ' + exportObjectEntries + ' };');
}

function createModuleNamespace(module) {
    var namespaceTarget = Object.create(null);
    var names = module._names.slice().sort();

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
                var binding = module._bindings[prop];
                if (!binding.initialized) {
                    throw new ReferenceError(prop + ' is not initialized');
                }
                return binding.value;
            }
            return Reflect.get(namespaceTarget, prop, receiver);
        },
        getOwnPropertyDescriptor: function(_target, prop) {
            if (typeof prop === 'string' && module._bindings[prop] !== undefined) {
                var binding = module._bindings[prop];
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

export class SourceTextModule {
    constructor(code, options) {
        this._source = String(code);
        this._status = 'unlinked';

        var declaredBindings = parseSourceTextModuleBindings(this._source);
        this._bindings = Object.create(null);
        this._names = [];

        for (var i = 0; i < declaredBindings.length; i++) {
            var binding = declaredBindings[i];
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
            var evaluatedExports = this._evaluateSource();
            for (var i = 0; i < this._names.length; i++) {
                var name = this._names[i];
                var binding = this._bindings[name];
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

var vmExports = {
    runInNewContext,
    runInContext,
    runInThisContext,
    createContext,
    isContext,
    compileFunction,
    Script,
    SourceTextModule,
    createScript,
};

export default vmExports;
