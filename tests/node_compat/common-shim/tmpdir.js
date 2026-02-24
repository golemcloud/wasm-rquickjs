'use strict';

const fs = require('fs');
const path = require('path');

// Keep this path intentionally short because some WASI runtimes hit much
// lower effective path-length limits than native Node.js environments.
const tmpPath = '/tmp/w';
const longPathAliasRoot = '/tmp/wlp';
const LONG_PATH_THRESHOLD = 512;
const longPathAliases = new Map();

function installLongPathFsShim() {
    if (fs.__wasmLongPathShimInstalled) {
        return;
    }
    fs.__wasmLongPathShimInstalled = true;

    const originalMkdirSync = fs.mkdirSync.bind(fs);
    const originalExistsSync = fs.existsSync.bind(fs);
    const originalAccess = fs.access.bind(fs);
    const originalAccessSync = fs.accessSync.bind(fs);

    function resolveMappedLongPath(targetPath) {
        let bestMatch = null;

        for (const [sourcePath, aliasPath] of longPathAliases.entries()) {
            if (targetPath === sourcePath || targetPath.startsWith(`${sourcePath}/`)) {
                if (!bestMatch || sourcePath.length > bestMatch.sourcePath.length) {
                    bestMatch = { sourcePath, aliasPath };
                }
            }
        }

        if (!bestMatch) {
            return null;
        }

        return bestMatch.aliasPath + targetPath.slice(bestMatch.sourcePath.length);
    }

    function mapPath(targetPath, createIfMissing) {
        if (typeof targetPath !== 'string' || targetPath.length < LONG_PATH_THRESHOLD) {
            return targetPath;
        }

        const mappedPath = resolveMappedLongPath(targetPath);
        if (mappedPath) {
            return mappedPath;
        }

        if (!createIfMissing) {
            return targetPath;
        }

        originalMkdirSync(longPathAliasRoot, { recursive: true });
        const aliasPath = path.join(longPathAliasRoot, String(longPathAliases.size));
        longPathAliases.set(targetPath, aliasPath);
        return aliasPath;
    }

    fs.mkdirSync = function mkdirSyncPatched(targetPath, options) {
        const shouldCreateAlias = typeof targetPath === 'string' &&
            options &&
            typeof options === 'object' &&
            options.recursive;
        return originalMkdirSync(mapPath(targetPath, shouldCreateAlias), options);
    };

    fs.existsSync = function existsSyncPatched(targetPath) {
        return originalExistsSync(mapPath(targetPath, false));
    };

    fs.accessSync = function accessSyncPatched(targetPath, mode) {
        return originalAccessSync(mapPath(targetPath, false), mode);
    };

    fs.access = function accessPatched(targetPath, modeOrCallback, callback) {
        return originalAccess(mapPath(targetPath, false), modeOrCallback, callback);
    };
}

installLongPathFsShim();

function rmSync(p) {
    try {
        const entries = fs.readdirSync(p);
        for (const entry of entries) {
            const full = path.join(p, entry);
            try {
                const st = fs.statSync(full);
                if (st.isDirectory()) {
                    rmSync(full);
                } else {
                    fs.unlinkSync(full);
                }
            } catch (e) {
                // ignore errors during cleanup
            }
        }
        fs.rmdirSync(p);
    } catch (e) {
        // directory might not exist
    }
}

const tmpdir = {
    path: tmpPath,
    refresh: function() {
        // Clean up and recreate
        longPathAliases.clear();
        rmSync(longPathAliasRoot);
        rmSync(tmpPath);
        fs.mkdirSync(tmpPath, { recursive: true });
        return tmpPath;
    },
    resolve: function(...paths) {
        return path.resolve(tmpPath, ...paths);
    },
    hasEnoughSpace: function() {
        return true;
    }
};

module.exports = tmpdir;
