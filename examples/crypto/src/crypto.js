import { createHash } from 'node:crypto';

export function newUuids() {
    const uuid1 = crypto.randomUUID()
    const uuid2 = crypto.randomUUID()
    return [uuid1, uuid2]
}

export function randomS8(count) {
    const buf = new Int8Array(count);
    crypto.getRandomValues(buf);
    return Array.from(buf);
}

export function randomU32(count) {
    const buf = new Uint32Array(count);
    crypto.getRandomValues(buf);
    return Array.from(buf);
}

export function sha256Hex(input) {
    return createHash('sha256').update(input).digest('hex');
}

export function sha256MultiUpdate(parts) {
    const hash = createHash('sha256');
    for (const part of parts) {
        hash.update(part);
    }
    return hash.digest('hex');
}
