function roundtripU64Impl(value) {
    return value;
}

function roundtripS64Impl(value) {
    return value;
}

export const roundtripU64 = roundtripU64Impl;
export const roundtripS64 = roundtripS64Impl;

let savedTime = 0n;

export function sampleHrtime() {
    savedTime = process.hrtime.bigint();
    return savedTime;
}

export function restoreHrtime(value) {
    savedTime = value;
}

export function elapsedHrtime() {
    return process.hrtime.bigint() - savedTime;
}

export function sampleHrtimeTuple() {
    const [seconds, nanos] = process.hrtime();
    return [BigInt(seconds), nanos];
}

export function elapsedHrtimeTuple(seconds, nanos) {
    const [elapsedSeconds, elapsedNanos] = process.hrtime([Number(seconds), nanos]);
    return [BigInt(elapsedSeconds), elapsedNanos];
}
