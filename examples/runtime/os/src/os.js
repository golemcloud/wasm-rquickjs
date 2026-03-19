import os from 'node:os';

export function test() {
    const result = {
        hasEOL: typeof os.EOL === 'string',
        eolValue: JSON.stringify(os.EOL),
        canImportAsOs: true,
        hasArch: typeof os.arch === 'function',
        hasPlatform: typeof os.platform === 'function',
        hasHostname: typeof os.hostname === 'function',
        hasUptime: typeof os.uptime === 'function',
        hasHomedir: typeof os.homedir === 'function',
        hasTmpdir: typeof os.tmpdir === 'function'
    };
    return JSON.stringify(result);
}
