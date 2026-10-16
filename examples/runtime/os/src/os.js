import os from 'node:os';
import { performance as perfHooksPerformance } from 'node:perf_hooks';

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

export function testPerformanceClock() {
    const globalPerformance = globalThis.performance;
    const timeOrigin = globalPerformance.timeOrigin;
    const first = globalPerformance.now();
    let advanced = false;
    for (let i = 0; i < 10000; i++) {
        if (globalPerformance.now() > first) {
            advanced = true;
            break;
        }
    }
    const pairedWallTime = timeOrigin + globalPerformance.now();
    const originTracksWallClock = Math.abs(Date.now() - pairedWallTime) < 1000;
    const originalDateNow = Date.now;
    let second;
    let independentFromDateNow = false;

    Date.now = () => {
        throw new Error('performance.now() must not read the wall clock');
    };
    try {
        second = globalPerformance.now();
        independentFromDateNow = true;
    } finally {
        Date.now = originalDateNow;
    }

    let previous = second;
    let nonDecreasing = true;
    for (let i = 0; i < 100; i++) {
        const current = globalPerformance.now();
        if (current < previous) nonDecreasing = false;
        previous = current;
    }

    return JSON.stringify({
        globalAvailable: typeof globalPerformance?.now === 'function',
        sharedWithPerfHooks: globalPerformance === perfHooksPerformance,
        finiteTimeOrigin: Number.isFinite(timeOrigin),
        stableTimeOrigin: globalPerformance.timeOrigin === timeOrigin,
        startsNonNegative: first >= 0,
        firstReadingIsRecent: first < 60000,
        advances: advanced,
        originTracksWallClock,
        independentFromDateNow,
        nonDecreasing: second >= first && nonDecreasing,
    });
}
