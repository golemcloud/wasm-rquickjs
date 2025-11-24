
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
