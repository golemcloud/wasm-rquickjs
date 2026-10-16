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
Module._load = poison;
Module._resolveFilename = poison;
Module.createRequire = poison;
Module.prototype.require = poison;
Module.prototype._compile = poison;
Module._extensions['.js'] = poison;
Module._extensions['.child-leak'] = poison;
Module._extensions = { '.child-replacement': poison };
Module.wrapper[0] = '(function poisonedWrapper() {';
module.filename = '/workspace/inline-child-mutated.cjs';
module.exports = { childOnly: true };

const nested = spawnSync(
    process.execPath,
    [observerScript],
    { encoding: 'utf8' },
);
report.nestedStatus = nested.status;
report.nested = nested.status === 0 ? JSON.parse(nested.stdout) : null;
report.nestedStderr = nested.stderr;

process.stdout.write(JSON.stringify(report));
