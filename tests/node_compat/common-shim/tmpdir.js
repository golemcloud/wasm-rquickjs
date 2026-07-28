'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Keep this path intentionally short because some WASI runtimes hit much
// lower effective path-length limits than native Node.js environments.
const tmpPath = '/tmp/w';

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
        rmSync(tmpPath);
        fs.mkdirSync(tmpPath, { recursive: true });
        return tmpPath;
    },
    resolve: function(...paths) {
        return path.resolve(tmpPath, ...paths);
    },
    fileURL: function(...paths) {
        const fullPath = path.resolve(tmpPath + path.sep, ...paths);
        return pathToFileURL(fullPath);
    },
    hasEnoughSpace: function() {
        return true;
    }
};

module.exports = tmpdir;
module.exports.fileURL = tmpdir.fileURL;
module.exports.hasEnoughSpace = tmpdir.hasEnoughSpace;
module.exports.path = tmpdir.path;
module.exports.refresh = tmpdir.refresh;
module.exports.resolve = tmpdir.resolve;
