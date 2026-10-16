const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const childScript = require.resolve('./inline-module-child.cjs');
const observerScript = require.resolve('./inline-module-observer.cjs');

const parentMain = require.main;
const parentMainExports = parentMain.exports;
const parentMainSnapshot = {
    id: parentMain.id,
    filename: parentMain.filename,
    path: parentMain.path,
    loaded: parentMain.loaded,
    parent: parentMain.parent,
    children: parentMain.children,
};
const parentHooks = {
    load: Module._load,
    resolveFilename: Module._resolveFilename,
    createRequire: Module.createRequire,
    prototypeRequire: Module.prototype.require,
    prototypeCompile: Module.prototype._compile,
    extensions: Module._extensions,
    jsExtension: Module._extensions['.js'],
    wrapperPrefix: Module.wrapper[0],
};

const child = spawnSync(
    process.execPath,
    [childScript],
    { encoding: 'utf8' },
);
const later = spawnSync(
    process.execPath,
    [observerScript],
    { encoding: 'utf8' },
);

process.stdout.write(JSON.stringify({
    requireMainIsModule: require.main === module,
    processMainIsModule: process.mainModule === module,
    childStatus: child.status,
    child: child.status === 0 ? JSON.parse(child.stdout) : null,
    childStderr: child.stderr,
    laterStatus: later.status,
    later: later.status === 0 ? JSON.parse(later.stdout) : null,
    laterStderr: later.stderr,
    parentMainRestored: require.main === parentMain &&
        parentMain === module &&
        parentMain.id === parentMainSnapshot.id &&
        parentMain.filename === parentMainSnapshot.filename &&
        parentMain.path === parentMainSnapshot.path &&
        parentMain.exports === parentMainExports &&
        parentMain.loaded === parentMainSnapshot.loaded &&
        parentMain.parent === parentMainSnapshot.parent &&
        parentMain.children === parentMainSnapshot.children,
    parentHooksRestored: Module._load === parentHooks.load &&
        Module._resolveFilename === parentHooks.resolveFilename &&
        Module.createRequire === parentHooks.createRequire &&
        Module.prototype.require === parentHooks.prototypeRequire &&
        Module.prototype._compile === parentHooks.prototypeCompile &&
        Module._extensions === parentHooks.extensions &&
        Module._extensions['.js'] === parentHooks.jsExtension &&
        Module._extensions['.child-leak'] === undefined &&
        Module.wrapper[0] === parentHooks.wrapperPrefix,
}));
