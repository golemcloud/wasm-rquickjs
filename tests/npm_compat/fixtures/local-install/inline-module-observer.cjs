const Module = require('node:module');
const moduleLeakSymbol = Symbol.for('wasm-rquickjs:inline-module-child');
const prototypeLeakSymbol = Symbol.for('wasm-rquickjs:inline-module-child-prototype');

const pathModule = Module._load('node:path', module, false);
const resolvedPath = Module._resolveFilename('node:path', module, false);
const requiredPath = Module.prototype.require.call(module, 'node:path');

process.stdout.write(JSON.stringify({
    requireMainIsModule: require.main === module,
    processMainIsModule: process.mainModule === module,
    hooksAreClean: pathModule === requiredPath &&
        resolvedPath === 'node:path' &&
        typeof Module.prototype._compile === 'function' &&
        typeof Module.createRequire === 'function' &&
        typeof Module._extensions['.js'] === 'function' &&
        Module._extensions['.child-leak'] === undefined &&
        require.extensions['.local-child-leak'] === undefined &&
        typeof require.resolve.paths === 'function' &&
        (!Module.require ||
            !Module.require.resolve ||
            typeof Module.require.resolve.paths === 'function') &&
        require.cache['/workspace/child-leak.cjs'] === undefined &&
        typeof Module.isBuiltin === 'function' &&
        !Object.prototype.hasOwnProperty.call(Module, 'childLeak') &&
        !Object.prototype.hasOwnProperty.call(Module, moduleLeakSymbol) &&
        !Object.prototype.hasOwnProperty.call(Module.prototype, 'childLeak') &&
        !Object.prototype.hasOwnProperty.call(Module.prototype, prototypeLeakSymbol) &&
        !Module.globalPaths.includes('/child-leak') &&
        !Module.builtinModules.includes('child:leak') &&
        Array.isArray(Module.wrapper) &&
        Module.wrapper[0].startsWith('(function'),
}));
