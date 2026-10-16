const Module = require('node:module');

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
        Array.isArray(Module.wrapper) &&
        Module.wrapper[0].startsWith('(function'),
}));
