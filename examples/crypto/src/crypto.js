import { createHash, createHmac, hash, getHashes, getCiphers, randomBytes, randomInt, timingSafeEqual, pbkdf2Sync, scryptSync, hkdfSync, createCipheriv, createDecipheriv } from 'node:crypto';

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

export function hmacHex(algorithm, key, data) {
    return createHmac(algorithm, key).update(data).digest('hex');
}

export function hmacMultiUpdate(algorithm, key, parts) {
    const hmac = createHmac(algorithm, key);
    for (const part of parts) {
        hmac.update(part);
    }
    return hmac.digest('hex');
}

export function pbkdf2Sha256Hex(password, salt, iterations, keylen) {
    const key = pbkdf2Sync(password, salt, iterations, keylen, 'sha256');
    return Buffer.from(key).toString('hex');
}

export function scryptHex(password, salt, keylen) {
    const key = scryptSync(password, salt, keylen, { N: 1024, r: 8, p: 1 });
    return Buffer.from(key).toString('hex');
}

export function hkdfSha256Hex(ikm, salt, info, keylen) {
    const key = hkdfSync('sha256', ikm, salt, info, keylen);
    return Buffer.from(key).toString('hex');
}

export function listCiphers() {
    return getCiphers();
}

export function aesCbcRoundtrip(plaintext, keyHex, ivHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const enc1 = cipher.update(plaintext, 'utf8');
    const enc2 = cipher.final();
    const encrypted = Buffer.concat([enc1, enc2]);

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const dec1 = decipher.update(encrypted);
    const dec2 = decipher.final();
    const decrypted = Buffer.concat([dec1, dec2]).toString('utf8');
    return decrypted;
}

export function aesCtrRoundtrip(plaintext, keyHex, ivHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = createCipheriv('aes-256-ctr', key, iv);
    const enc1 = cipher.update(plaintext, 'utf8');
    const enc2 = cipher.final();
    const encrypted = Buffer.concat([enc1, enc2]);

    const decipher = createDecipheriv('aes-256-ctr', key, iv);
    const dec1 = decipher.update(encrypted);
    const dec2 = decipher.final();
    const decrypted = Buffer.concat([dec1, dec2]).toString('utf8');
    return decrypted;
}

export function aesGcmRoundtrip(plaintext, keyHex, ivHex, aadText) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    if (aadText) {
        cipher.setAAD(Buffer.from(aadText, 'utf8'));
    }
    const enc1 = cipher.update(plaintext, 'utf8');
    const enc2 = cipher.final();
    const encrypted = Buffer.concat([enc1, enc2]);
    const authTag = cipher.getAuthTag();

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    if (aadText) {
        decipher.setAAD(Buffer.from(aadText, 'utf8'));
    }
    decipher.setAuthTag(authTag);
    const dec1 = decipher.update(encrypted);
    const dec2 = decipher.final();
    const decrypted = Buffer.concat([dec1, dec2]).toString('utf8');
    return decrypted;
}

export function chacha20Poly1305Roundtrip(plaintext, keyHex, ivHex, aadText) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = createCipheriv('chacha20-poly1305', key, iv);
    if (aadText) {
        cipher.setAAD(Buffer.from(aadText, 'utf8'));
    }
    const enc1 = cipher.update(plaintext, 'utf8');
    const enc2 = cipher.final();
    const encrypted = Buffer.concat([enc1, enc2]);
    const authTag = cipher.getAuthTag();

    const decipher = createDecipheriv('chacha20-poly1305', key, iv);
    if (aadText) {
        decipher.setAAD(Buffer.from(aadText, 'utf8'));
    }
    decipher.setAuthTag(authTag);
    const dec1 = decipher.update(encrypted);
    const dec2 = decipher.final();
    const decrypted = Buffer.concat([dec1, dec2]).toString('utf8');
    return decrypted;
}

export function aesGcmEncryptHex(plaintext, keyHex, ivHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc1 = cipher.update(plaintext, 'utf8');
    const enc2 = cipher.final();
    const encrypted = Buffer.concat([enc1, enc2]);
    const authTag = cipher.getAuthTag();
    return encrypted.toString('hex') + ':' + authTag.toString('hex');
}
