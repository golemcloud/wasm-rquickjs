import { createHash, hash, getHashes, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

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

export function hashWithAlgorithm(algorithm, input) {
    return createHash(algorithm).update(input).digest('hex');
}

export function hashOneShot(algorithm, input) {
    return hash(algorithm, input, 'hex');
}

export function listHashes() {
    return getHashes();
}

export function generateRandomBytes(size) {
    const buf = randomBytes(size);
    return new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength || buf.length);
}

export function generateRandomInt(min, max) {
    return BigInt(randomInt(Number(min), Number(max)));
}

export function checkTimingSafeEqual(a, b) {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
