'use strict';

const fs = require('fs');
const path = require('path');

const tmpPath = '/tmp/node-test-tmpdir';

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
    hasEnoughSpace: function() {
        return true;
    }
};

module.exports = tmpdir;
