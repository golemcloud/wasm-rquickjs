import { createHash, createHmac, hash, getHashes, getCiphers, getCurves, constants, randomBytes, randomInt, timingSafeEqual, pbkdf2Sync, scryptSync, hkdfSync, createCipheriv, createDecipheriv, generateKeyPair, generateKeyPairSync, createSign, createVerify, createPublicKey, createPrivateKey, sign, verify, getDiffieHellman, createDiffieHellman, createSecretKey } from 'node:crypto';

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

export function ed25519SignVerify(message) {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const data = Buffer.from(message);
    const signature = sign(null, data, privateKey);
    return verify(null, data, publicKey, signature);
}

export function ecdsaP256SignVerify(message) {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const sign = createSign('sha256');
    sign.update(message);
    const signature = sign.sign(privateKey);
    const verify = createVerify('sha256');
    verify.update(message);
    return verify.verify(publicKey, signature);
}

export function ecdsaSecp256k1SignVerify(message) {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
    const sign = createSign('sha256');
    sign.update(message);
    const signature = sign.sign(privateKey);
    const verify = createVerify('sha256');
    verify.update(message);
    return verify.verify(publicKey, signature);
}

export function ed25519KeyType() {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    return publicKey.type + ':' + privateKey.type + ':' + publicKey.asymmetricKeyType + ':' + privateKey.asymmetricKeyType;
}

export function ecdsaP256ExportImportVerify(message) {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

    const sign = createSign('sha256');
    sign.update(message);
    const signature = sign.sign(privateKey);

    const pubPem = publicKey.export({ format: 'pem', type: 'spki' });
    const importedPub = createPublicKey(pubPem);

    const verify = createVerify('sha256');
    verify.update(message);
    return verify.verify(importedPub, signature);
}

export function ed25519WrongKeyVerify(message) {
    const kp1 = generateKeyPairSync('ed25519');
    const kp2 = generateKeyPairSync('ed25519');

    const data = Buffer.from(message);
    const signature = sign(null, data, kp1.privateKey);
    return verify(null, data, kp2.publicKey, signature);
}

export function listCurves() {
    return getCurves();
}

export function getConstants() {
    const keys = Object.keys(constants);
    return keys.sort().join(',');
}

export function subtleDigestSha256(input) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(buf => {
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

export async function subtleSignVerifyHmac(message) {
    const key = await crypto.subtle.generateKey(
        { name: 'HMAC', hash: 'SHA-256', length: 256 },
        true,
        ['sign', 'verify']
    );
    const data = new TextEncoder().encode(message);
    const signature = await crypto.subtle.sign('HMAC', key, data);
    return await crypto.subtle.verify('HMAC', key, signature, data);
}

export async function subtleSignVerifyEd25519(message) {
    const keyPair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
    const data = new TextEncoder().encode(message);
    const signature = await crypto.subtle.sign('Ed25519', keyPair.privateKey, data);
    return await crypto.subtle.verify('Ed25519', keyPair.publicKey, signature, data);
}

export async function subtleSignVerifyRsaPss(message) {
    const algorithm = {
        name: 'RSA-PSS',
        modulusLength: 1024,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
    };
    const keyPair = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
    const data = new TextEncoder().encode(message);
    const pss = { name: 'RSA-PSS', saltLength: 32 };
    const signature = await crypto.subtle.sign(pss, keyPair.privateKey, data);
    return await crypto.subtle.verify(pss, keyPair.publicKey, signature, data);
}

export async function cryptoErrorContracts() {
    const lines = [];
    const check = (name, fn) => {
        try {
            const value = fn();
            lines.push(`${name}: ok ${typeof value === 'string' ? value.split('\n')[0] : typeof value}`);
        } catch (e) {
            lines.push(`${name}: ${e.name} ${e.code} ${e.message}`);
        }
    };
    const aeadFinal = (algorithm, tamper) => {
        const key = Buffer.alloc(32, 1);
        const iv = Buffer.alloc(12, 2);
        const cipher = createCipheriv(algorithm, key, iv);
        const ciphertext = Buffer.concat([cipher.update('payload'), cipher.final()]);
        const tag = cipher.getAuthTag();
        const decipher = createDecipheriv(algorithm, key, iv);
        if (tamper !== 'no-tag') {
            tag[0] ^= 1;
            decipher.setAuthTag(tag);
        }
        decipher.update(ciphertext);
        return decipher.final();
    };
    check('gcm tampered tag', () => aeadFinal('aes-256-gcm', 'tag'));
    check('gcm missing tag', () => aeadFinal('aes-256-gcm', 'no-tag'));
    check('chacha20-poly1305 tampered tag', () => aeadFinal('chacha20-poly1305', 'tag'));

    const rsa = generateKeyPairSync('rsa', { modulusLength: 512 });
    const ed = generateKeyPairSync('ed25519');
    check('public pkcs8', () => rsa.publicKey.export({ format: 'pem', type: 'pkcs8' }));
    check('public without format', () => rsa.publicKey.export({ type: 'spki' }));
    check('public spki ignores cipher', () => rsa.publicKey.export({ format: 'pem', type: 'spki', cipher: 'aes-128-cbc', passphrase: 'x' }));
    check('private without type', () => rsa.privateKey.export({ format: 'pem' }));
    check('private passphrase without cipher', () => rsa.privateKey.export({ format: 'pem', type: 'pkcs8', passphrase: 'x' }));
    check('private der pkcs1 encrypted', () => rsa.privateKey.export({ format: 'der', type: 'pkcs1', cipher: 'aes-128-cbc', passphrase: 'x' }));
    check('private unknown cipher', () => rsa.privateKey.export({ format: 'pem', type: 'pkcs8', cipher: 'nope', passphrase: 'x' }));
    check('private pem pkcs8 encrypted', () => rsa.privateKey.export({ format: 'pem', type: 'pkcs8', cipher: 'aes-128-cbc', passphrase: 'x' }));
    check('ed25519 public pkcs1', () => ed.publicKey.export({ format: 'pem', type: 'pkcs1' }));
    check('ed25519 private sec1', () => ed.privateKey.export({ format: 'pem', type: 'sec1' }));
    check('keygen passphrase without cipher', () => generateKeyPairSync('ed25519', { privateKeyEncoding: { format: 'jwk', passphrase: 'x' } }));
    check('keygen public pkcs8', () => generateKeyPairSync('ed25519', { publicKeyEncoding: { format: 'pem', type: 'pkcs8' } }));
    check('createPrivateKey der spki', () => createPrivateKey({ key: Buffer.alloc(0), format: 'der', type: 'spki' }));
    const shortTag = createDecipheriv('aes-256-gcm', Buffer.alloc(32), Buffer.alloc(12));
    check('gcm implicit 12-byte tag', () => shortTag.setAuthTag(Buffer.alloc(12)));
    check('gcm authTagLength 12-byte tag', () => createDecipheriv('aes-256-gcm', Buffer.alloc(32), Buffer.alloc(12), { authTagLength: 12 }).setAuthTag(Buffer.alloc(12)) && 'set');
    const info = new Uint8Array(2048);
    Object.defineProperty(info, 'byteLength', { get() { return 1; } });
    check('hkdfSync info with fake byteLength', () => hkdfSync('sha256', 'a', '', info, 10));
    check('cipher output encoding change', () => {
        const cipher = createCipheriv('aes-256-cbc', Buffer.alloc(32), Buffer.alloc(16));
        cipher.update('test', 'utf-8', 'utf-8');
        return cipher.final('hex');
    });
    check('generateKeyPair Ed25519', () => generateKeyPair('Ed25519', () => {}));
    check('generateKeyPair toString', () => generateKeyPair('toString', () => {}));

    // One-shot sign()/verify() validate synchronously but deliver errors of the
    // signing job to the callback, after returning.
    const viaCallback = (name, fn, show = (value) => value) => new Promise((resolve) => {
        let returned = false;
        const done = (outcome) => {
            lines.push(`${name}: ${returned ? '' : 'before return '}${outcome}`);
            resolve();
        };
        try {
            fn((err, value) => done(err ? `callback ${err.name} ${err.code}` : `callback ok ${show(value)}`));
            returned = true;
        } catch (e) {
            lines.push(`${name}: throws ${e.name} ${e.code}`);
            resolve();
        }
    });
    const x25519 = generateKeyPairSync('x25519');
    await viaCallback('sign digest too big for key', (cb) => sign('sha512', Buffer.from('message'), rsa.privateKey, cb));
    await viaCallback('verify with x25519 key', (cb) => verify(undefined, Buffer.from('message'), x25519.publicKey, Buffer.alloc(16), cb));
    await viaCallback('sign invalid padding', (cb) => sign('sha256', Buffer.from('message'), { key: rsa.privateKey, padding: 'x' }, cb));
    await viaCallback('verify mismatching signature', (cb) => verify('sha256', Buffer.from('message'), rsa.publicKey, Buffer.alloc(64), cb));

    // A key of the wrong type is rejected synchronously and never reaches the callback.
    const secretKey = createSecretKey(Buffer.alloc(32, 1));
    const message = Buffer.from('message');
    await viaCallback('sign with public KeyObject', (cb) => sign('sha256', message, rsa.publicKey, cb));
    await viaCallback('sign with nested secret KeyObject', (cb) => sign('sha256', message, { key: secretKey }, cb));
    await viaCallback('verify with secret KeyObject', (cb) => verify('sha256', message, secretKey, Buffer.alloc(64), cb));
    await viaCallback('verify with nested private KeyObject', (cb) => verify('sha256', message, { key: rsa.privateKey }, sign('sha256', message, rsa.privateKey), cb));

    // Inherited and non-enumerable padding/saltLength options reach the job.
    const pss = { padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 20 };
    const privatePem = rsa.privateKey.export({ format: 'pem', type: 'pkcs8' });
    const signatureKind = (signature) => `pkcs1=${verify('sha256', message, rsa.publicKey, signature)} pss=${verify('sha256', message, { key: rsa.publicKey, ...pss }, signature)}`;
    await viaCallback('sign inherited PSS options', (cb) => sign('sha256', message, Object.assign(Object.create(pss), { key: privatePem }), cb), signatureKind);
    await viaCallback('sign non-enumerable PSS options', (cb) => sign('sha256', message, Object.defineProperties({ key: privatePem }, { padding: { value: pss.padding }, saltLength: { value: pss.saltLength } }), cb), signatureKind);
    await viaCallback('sign default padding', (cb) => sign('sha256', message, { key: privatePem }, cb), signatureKind);
    const pssSignature = sign('sha256', message, { key: rsa.privateKey, ...pss });
    await viaCallback('verify inherited PSS options', (cb) => verify('sha256', message, Object.assign(Object.create(pss), { key: rsa.publicKey.export({ format: 'pem', type: 'spki' }) }), pssSignature, cb));
    await viaCallback('verify PSS signature with default padding', (cb) => verify('sha256', message, { key: rsa.publicKey }, pssSignature, cb));

    const modp14 = getDiffieHellman('modp14');
    const alice = createDiffieHellman(modp14.getPrime(), modp14.getGenerator());
    alice.generateKeys();
    const pMinus1 = Buffer.from(modp14.getPrime());
    pMinus1[pMinus1.length - 1] -= 1;
    check('DH computeSecret(1)', () => alice.computeSecret(Buffer.from([1])));
    check('DH computeSecret(p - 1)', () => alice.computeSecret(pMinus1));
    return lines;
}

export async function webcryptoErrorContracts() {
    const lines = [];
    const describe = (e) => `${e.name} ${e.code} ${e.message}`;
    const check = (name, fn) => {
        try {
            fn();
            lines.push(`${name}: ok`);
        } catch (e) {
            lines.push(`${name}: ${describe(e)}`);
        }
    };
    const checkAsync = async (name, fn) => {
        try {
            const value = await fn();
            lines.push(`${name}: ok ${value}`);
        } catch (e) {
            lines.push(`${name}: ${describe(e)}`);
        }
    };
    const { subtle } = crypto;
    check('getRandomValues()', () => crypto.getRandomValues());
    check('getRandomValues(ArrayBuffer)', () => crypto.getRandomValues(new ArrayBuffer(1)));
    check('getRandomValues(Float32Array)', () => crypto.getRandomValues(new Float32Array(1)));
    check('getRandomValues(65537 bytes)', () => crypto.getRandomValues(new Uint8Array(65537)));

    const iv = new Uint8Array(16);
    const cbcDecrypt = await subtle.importKey('raw', new Uint8Array(16), { name: 'AES-CBC' }, false, ['decrypt']);
    const cbcEncrypt = await subtle.importKey('raw', new Uint8Array(16), { name: 'AES-CBC' }, false, ['encrypt']);
    await checkAsync('encrypt without usage', () => subtle.encrypt({ name: 'AES-CBC', iv }, cbcDecrypt, new Uint8Array(1)));
    await checkAsync('decrypt without usage', () => subtle.decrypt({ name: 'AES-CBC', iv }, cbcEncrypt, new Uint8Array(16)));
    await checkAsync('decrypt wrong algorithm without usage', () => subtle.decrypt({ name: 'AES-CTR', counter: iv, length: 64 }, cbcEncrypt, new Uint8Array(16)));
    const hmacSign = await subtle.importKey('raw', new Uint8Array(32), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
    await checkAsync('verify without usage', () => subtle.verify('HMAC', hmacSign, new Uint8Array(32), new Uint8Array(1)));
    const kw = await subtle.importKey('raw', new Uint8Array(16), { name: 'AES-KW' }, false, ['unwrapKey']);
    await checkAsync('wrapKey without usage', () => subtle.wrapKey('raw', hmacSign, kw, 'AES-KW'));

    const hmac = (length, usages) => subtle.importKey('raw', new Uint8Array(32), { name: 'HMAC', hash: 'SHA-256', length }, false, usages);
    await checkAsync('HMAC usage deriveBits', () => hmac(undefined, ['deriveBits']));
    await checkAsync('HMAC length 0', () => hmac(0, ['sign']));
    await checkAsync('HMAC length 384', () => hmac(384, ['sign']));
    const jwk = await subtle.exportKey('jwk', hmacSign);
    lines.push(`HMAC SHA-256 jwk alg: ${jwk.alg}`);
    await checkAsync('HMAC jwk alg HS384', () => subtle.importKey('jwk', { ...jwk, alg: 'HS384' }, { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']));
    await checkAsync('HMAC jwk without alg', async () => (await subtle.importKey('jwk', { ...jwk, alg: undefined }, { name: 'HMAC', hash: 'SHA-256' }, true, ['sign'])).algorithm.length);
    const sha3 = await subtle.importKey('raw', new Uint8Array(32), { name: 'HMAC', hash: 'SHA3-256' }, true, ['sign']);
    lines.push(`HMAC SHA3-256 jwk alg: ${(await subtle.exportKey('jwk', sha3)).alg}`);
    return lines;
}
