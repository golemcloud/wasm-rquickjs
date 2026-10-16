const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const observerScript = require.resolve('./inline-module-observer.cjs');

const report = {
    requireMainIsModule: require.main === module,
    processMainIsModule: process.mainModule === module,
};

const poison = function poisonedModuleHook() {
    throw new Error('inline child module hook leaked');
};
const moduleLeakSymbol = Symbol.for('wasm-rquickjs:inline-module-child');
const prototypeLeakSymbol = Symbol.for('wasm-rquickjs:inline-module-child-prototype');
Module._load = poison;
Module._resolveFilename = poison;
Module.createRequire = poison;
Module.prototype.require = poison;
Module.prototype._compile = poison;
Module._extensions['.js'] = poison;
Module._extensions['.child-leak'] = poison;
Module._extensions = { '.child-replacement': poison };
Module.wrapper[0] = '(function poisonedWrapper() {';
Module.isBuiltin = poison;
Module.childLeak = poison;
Module[moduleLeakSymbol] = poison;
Module.prototype.childLeak = poison;
Module.prototype[prototypeLeakSymbol] = poison;
Module.globalPaths.push('/child-leak');
Module.builtinModules = ['child:leak'];
require.extensions['.local-child-leak'] = poison;
require.resolve.paths = poison;
if (Module.require && Module.require.resolve) {
    Module.require.resolve.paths = poison;
}
require.cache['/workspace/child-leak.cjs'] = { exports: poison };
module.filename = '/workspace/inline-child-mutated.cjs';
module.exports = { childOnly: true };

if (process.argv[2] === 'throw') {
    throw new Error('inline child failure');
}
if (process.argv[2] === 'exit') {
    process.exit(7);
}

const nested = spawnSync(
    process.execPath,
    [observerScript],
    { encoding: 'utf8' },
);
report.nestedStatus = nested.status;
report.nested = nested.status === 0 ? JSON.parse(nested.stdout) : null;
report.nestedStderr = nested.stderr;

process.stdout.write(JSON.stringify(report));
