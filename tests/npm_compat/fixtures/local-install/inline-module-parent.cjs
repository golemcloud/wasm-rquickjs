const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const childScript = require.resolve('./inline-module-child.cjs');
const observerScript = require.resolve('./inline-module-observer.cjs');
const moduleLeakSymbol = Symbol.for('wasm-rquickjs:inline-module-child');
const prototypeLeakSymbol = Symbol.for('wasm-rquickjs:inline-module-child-prototype');

const parentMain = require.main;
const parentMainExports = parentMain.exports;
const parentArgv = process.argv.slice();
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
    isBuiltin: Module.isBuiltin,
    globalPaths: Module.globalPaths,
    globalPathValues: Module.globalPaths.slice(),
    builtinModules: Module.builtinModules,
    builtinModuleValues: Module.builtinModules.slice(),
    requireCache: require.cache,
    requireExtensions: require.extensions,
    requireResolvePaths: require.resolve.paths,
    runtimeRequireResolvePaths: Module.require && Module.require.resolve
        ? Module.require.resolve.paths
        : undefined,
};

const child = spawnSync(
    process.execPath,
    [childScript],
    { encoding: 'utf8' },
);
const throwingChild = spawnSync(
    process.execPath,
    [childScript, 'throw'],
    { encoding: 'utf8' },
);
const exitingChild = spawnSync(
    process.execPath,
    [childScript, 'exit'],
    { encoding: 'utf8' },
);
const evalChild = spawnSync(
    process.execPath,
    [
        '-e',
        'const dependencyMarker = Symbol.for(' +
            '"wasm-rquickjs:inline-non-cjs-main-dependency");' +
            'const dependency = ' +
            'require("./inline-module-non-cjs-main-dependency.cjs");' +
            'delete globalThis[dependencyMarker];' +
            'process.stdout.write(JSON.stringify({' +
            'requireMain: require.main === undefined,' +
            'processMain: process.mainModule === undefined,' +
            'runtimeRequireMain: !require("node:module").require || ' +
                'require("node:module").require.main === undefined,' +
            'dependencyRequireMain: dependency.requireMainIsUndefined,' +
            'dependencyProcessMain: dependency.processMainIsUndefined' +
        '}))',
    ],
    { encoding: 'utf8' },
);
const printChild = spawnSync(
    process.execPath,
    ['-p', 'require.main === undefined && process.mainModule === undefined'],
    { encoding: 'utf8' },
);
const moduleEvalChild = spawnSync(
    process.execPath,
    [
        '--input-type=module',
        '-e',
        'import "./inline-module-non-cjs-main-dependency.cjs";\n' +
            'const dependencyMarker = Symbol.for(' +
                '"wasm-rquickjs:inline-non-cjs-main-dependency");' +
            'const dependency = globalThis[dependencyMarker];' +
            'delete globalThis[dependencyMarker];' +
            'process.stdout.write(JSON.stringify({' +
            'requireIsUndefined: typeof require === "undefined",' +
            'processMain: process.mainModule === undefined,' +
            'dependencyRequireMain: dependency.requireMainIsUndefined,' +
            'dependencyProcessMain: dependency.processMainIsUndefined' +
        '}))',
    ],
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
    throwingChildStatus: throwingChild.status,
    throwingChildStderr: throwingChild.stderr,
    exitingChildStatus: exitingChild.status,
    exitingChildStderr: exitingChild.stderr,
    evalChildStatus: evalChild.status,
    evalChild: evalChild.status === 0 ? JSON.parse(evalChild.stdout) : null,
    evalChildStderr: evalChild.stderr,
    printChildStatus: printChild.status,
    printChildClean: printChild.stdout === 'true\n',
    printChildStderr: printChild.stderr,
    moduleEvalChildStatus: moduleEvalChild.status,
    moduleEvalChild: moduleEvalChild.status === 0
        ? JSON.parse(moduleEvalChild.stdout)
        : null,
    moduleEvalChildStderr: moduleEvalChild.stderr,
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
    parentArgvRestored: JSON.stringify(process.argv) === JSON.stringify(parentArgv),
    parentHooksRestored: Module._load === parentHooks.load &&
        Module._resolveFilename === parentHooks.resolveFilename &&
        Module.createRequire === parentHooks.createRequire &&
        Module.prototype.require === parentHooks.prototypeRequire &&
        Module.prototype._compile === parentHooks.prototypeCompile &&
        Module._extensions === parentHooks.extensions &&
        Module._extensions['.js'] === parentHooks.jsExtension &&
        Module._extensions['.child-leak'] === undefined &&
        require.extensions === parentHooks.requireExtensions &&
        require.extensions['.local-child-leak'] === undefined &&
        require.cache === parentHooks.requireCache &&
        require.cache['/workspace/child-leak.cjs'] === undefined &&
        require.resolve.paths === parentHooks.requireResolvePaths &&
        (!Module.require ||
            !Module.require.resolve ||
            Module.require.resolve.paths === parentHooks.runtimeRequireResolvePaths) &&
        Module.isBuiltin === parentHooks.isBuiltin &&
        !Object.prototype.hasOwnProperty.call(Module, 'childLeak') &&
        !Object.prototype.hasOwnProperty.call(Module, moduleLeakSymbol) &&
        !Object.prototype.hasOwnProperty.call(Module.prototype, 'childLeak') &&
        !Object.prototype.hasOwnProperty.call(Module.prototype, prototypeLeakSymbol) &&
        Module.globalPaths === parentHooks.globalPaths &&
        JSON.stringify(Module.globalPaths) === JSON.stringify(parentHooks.globalPathValues) &&
        Module.builtinModules === parentHooks.builtinModules &&
        JSON.stringify(Module.builtinModules) === JSON.stringify(parentHooks.builtinModuleValues) &&
        Module.wrapper[0] === parentHooks.wrapperPrefix,
}));
