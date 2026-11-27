import { createHash, createHmac, hash, getHashes, getCiphers, getCurves, constants, randomBytes, randomInt, timingSafeEqual, pbkdf2Sync, scryptSync, hkdfSync, createCipheriv, createDecipheriv, generateKeyPair, generateKeyPairSync, createSign, createVerify, createPublicKey, createPrivateKey, diffieHellman, sign, verify, publicEncrypt, privateDecrypt, privateEncrypt, publicDecrypt, getDiffieHellman, createDiffieHellman, createSecretKey } from 'node:crypto';

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

export function x25519Agreement() {
    const privateKey = (hex) => createPrivateKey({
        key: Buffer.from('302e020100300506032b656e04220420' + hex, 'hex'), format: 'der', type: 'pkcs8',
    });
    const publicKey = (hex) => createPublicKey({
        key: Buffer.from('302a300506032b656e032100' + hex, 'hex'), format: 'der', type: 'spki',
    });
    const publicHex = (key) => Buffer.from(createPublicKey(key).export({ format: 'jwk' }).x, 'base64url').toString('hex');
    // RFC 7748, section 6.1
    const alice = privateKey('77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a');
    const bob = privateKey('5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb');
    let lowOrder;
    try {
        diffieHellman({ privateKey: alice, publicKey: publicKey('00'.repeat(32)) });
        lowOrder = 'accepted';
    } catch (err) {
        lowOrder = err.code;
    }
    const first = generateKeyPairSync('x25519');
    const second = generateKeyPairSync('x25519');
    const generatedPublic = first.publicKey.export({ format: 'jwk' }).x;
    return JSON.stringify({
        alicePublic: publicHex(alice),
        bobPublic: publicHex(bob),
        aliceShared: diffieHellman({ privateKey: alice, publicKey: createPublicKey(bob) }).toString('hex'),
        bobShared: diffieHellman({ privateKey: bob, publicKey: createPublicKey(alice) }).toString('hex'),
        lowOrder,
        generatedPublicMatchesPrivate: generatedPublic === createPublicKey(first.privateKey).export({ format: 'jwk' }).x,
        generatedPublicDiffersFromPrivate: generatedPublic !== first.privateKey.export({ format: 'jwk' }).d,
        generatedAgree: diffieHellman({ privateKey: first.privateKey, publicKey: second.publicKey })
            .equals(diffieHellman({ privateKey: second.privateKey, publicKey: first.publicKey })),
    });
}

// Checks a generated P-521 key against the SEC 2 curve parameters with plain BigInt arithmetic.
export function p521KeyPair() {
    const p = 2n ** 521n - 1n;
    const n = 0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409n;
    const b = 0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00n;
    const g = [
        0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66n,
        0x011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650n,
    ];
    const mod = (v) => ((v % p) + p) % p;
    const inv = (v) => {
        let result = 1n, base = mod(v), e = p - 2n;
        while (e > 0n) {
            if (e & 1n) result = (result * base) % p;
            base = (base * base) % p;
            e >>= 1n;
        }
        return result;
    };
    const add = (P, Q) => {
        if (P === null) return Q;
        if (Q === null) return P;
        if (P[0] === Q[0] && mod(P[1] + Q[1]) === 0n) return null;
        const l = P[0] === Q[0]
            ? mod((3n * P[0] * P[0] - 3n) * inv(2n * P[1]))
            : mod((Q[1] - P[1]) * inv(Q[0] - P[0]));
        const x = mod(l * l - P[0] - Q[0]);
        return [x, mod(l * (P[0] - x) - P[1])];
    };
    const onCurve = ([x, y]) => mod(y * y - (x * x * x - 3n * x + b)) === 0n;
    const big = (value) => BigInt('0x' + Buffer.from(value, 'base64url').toString('hex'));

    // Raw P-521 scalars have exactly 66 bytes. Independent SEC 2 points G/-G
    // also check noncanonical imports, including values needing many reductions.
    const scalar = (v) => Buffer.from(v.toString(16).padStart(132, '0'), 'hex');
    const rawImports = {};
    for (const namedCurve of ['P-521', 'secp521r1']) {
        const observed = rawImports[namedCurve] = {};
        for (const [name, d, y] of [
            ['one', 1n, g[1]], ['orderMinusOne', n - 1n, p - g[1]],
            ['orderPlusOne', n + 1n, g[1]], ['largePlusOne', 127n * n + 1n, g[1]],
            ['largeMinusOne', 127n * n - 1n, p - g[1]],
        ]) {
            const bytes = scalar(d);
            try {
                const key = createPrivateKey({ key: bytes, format: 'raw-private', asymmetricKeyType: 'ec', namedCurve });
                const rawJwk = key.export({ format: 'jwk' });
                observed[name] = {
                    x: big(rawJwk.x) === g[0], y: big(rawJwk.y) === y,
                    d: big(rawJwk.d) === d, raw: key.export({ format: 'raw-private' }).equals(bytes),
                };
            } catch (e) {
                observed[name] = `${e.name} ${e.code}`;
            }
        }
        for (const bytes of [
            Buffer.from([1]), Buffer.alloc(65, 1), Buffer.alloc(67, 1),
            Buffer.alloc(0), Buffer.alloc(6600, 0x55),
        ]) {
            try {
                createPrivateKey({ key: bytes, format: 'raw-private', asymmetricKeyType: 'ec', namedCurve });
                observed['length' + bytes.length] = 'accepted';
            } catch (e) {
                observed['length' + bytes.length] = `${e.name} ${e.code}`;
            }
        }
    }
    // Lower tiers can report the raw-import contract without generating an unsupported key.
    if (rawImports['P-521'].one === 'Error ERR_CRYPTO_INVALID_CURVE') {
        return JSON.stringify({ rawImports });
    }

    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-521' });
    const jwk = privateKey.export({ format: 'jwk' });
    const publicJwk = publicKey.export({ format: 'jwk' });
    const d = big(jwk.d);
    const point = [big(publicJwk.x), big(publicJwk.y)];
    let expected = null;
    let addend = g;
    for (let k = d; k > 0n; k >>= 1n) {
        if (k & 1n) expected = add(expected, addend);
        addend = add(addend, addend);
    }
    const exportRoundTrips = [
        ['der', 'sec1'], ['pem', 'sec1'],
        ['pem', 'pkcs8', 'aes-128-cbc'],
        ['pem', 'pkcs8', 'aes-256-cbc'],
    ].map(([format, type, cipher]) => {
        const passphrase = cipher ? 'p521 export' : undefined;
        const encoded = privateKey.export({ format, type, cipher, passphrase });
        const restored = createPrivateKey({ key: encoded, format, type, passphrase }).export({ format: 'jwk' });
        return restored.d === jwk.d && restored.x === jwk.x && restored.y === jwk.y;
    });
    return JSON.stringify({
        crv: publicJwk.crv,
        generatorOnCurve: onCurve(g),
        publicOnCurve: onCurve(point),
        scalarInRange: d > 0n && d < n,
        publicIsScalarTimesGenerator: expected !== null && expected[0] === point[0] && expected[1] === point[1],
        privateCarriesPublic: jwk.x === publicJwk.x && jwk.y === publicJwk.y,
        exportRoundTrips,
        rawImports,
    });
}

// RFC 7748 section 6.2 X448 and RFC 8032 section 7.4 Ed448 vectors, plus rejection and WebCrypto routes.
export async function cfrg448Vectors() {
    const h = (s) => Buffer.from(s, 'hex');
    const xPriv = (hex) => createPrivateKey({ key: h('3046020100300506032b656f043a0438' + hex), format: 'der', type: 'pkcs8' });
    const xPub = (hex) => createPublicKey({ key: h('3042300506032b656f033900' + hex), format: 'der', type: 'spki' });
    const edPriv = (hex) => createPrivateKey({ key: h('3047020100300506032b6571043b0439' + hex), format: 'der', type: 'pkcs8' });
    const jx = (k) => Buffer.from(createPublicKey(k).export({ format: 'jwk' }).x, 'base64url').toString('hex');
    const le = (n, len) => {
        const b = Buffer.alloc(len);
        for (let i = 0; i < len; i++) { b[i] = Number(n & 0xffn); n >>= 8n; }
        return b.toString('hex');
    };
    const p = 2n ** 448n - 2n ** 224n - 1n;
    const L = 2n ** 446n - 13818066809895115352007386748515426880336692474882178609894547503885n;
    const A = '9a8f4925d1519f5775cf46b04b5800d4ee9ee8bae8bc5565d498c28dd9c9baf574a9419744897391006382a6f127ab1d9ac2d8c0a598726b';
    const B = '1c306a7ac2a0e2e0990b294470cba339e6453772b075811d8fad0d1d6927c120bb5ee8972b0d3e21374c9c921b09d1b0366f10b65173992d';
    const out = {};
    out.alicePublic = jx(xPriv(A));
    out.bobPublic = jx(xPriv(B));
    out.shared = diffieHellman({ privateKey: xPriv(A), publicKey: xPub(out.bobPublic) }).toString('hex');
    out.sharedReverse = diffieHellman({ privateKey: xPriv(B), publicKey: xPub(out.alicePublic) }).toString('hex');
    out.nonCanonicalBase = diffieHellman({ privateKey: xPriv(A), publicKey: xPub(le(p + 5n, 56)) }).toString('hex');
    for (const [n, u] of [['zero', 0n], ['one', 1n], ['pMinus1', p - 1n]]) {
        try {
            diffieHellman({ privateKey: xPriv(A), publicKey: xPub(le(u, 56)) });
            out['low_' + n] = 'accepted';
        } catch (e) {
            out['low_' + n] = e.code;
        }
    }
    const k = edPriv('c4eab05d357007c632f3dbb48489924d552b08fe0c353a0d4a1f00acda2c463afbea67c5e8d2877c5e3bc397a659949ef8021e954e0a12274e');
    out.edPublic = jx(k);
    const sig = sign(null, h('03'), k);
    out.edSig = sig.toString('hex');
    const s = BigInt('0x' + Buffer.from(sig.subarray(57)).reverse().toString('hex'));
    const nonCanonical = Buffer.concat([sig.subarray(0, 57), h(le(s + L, 57))]);
    const flipped = Buffer.from(sig);
    flipped[10] ^= 1;
    const pub = createPublicKey(k);
    out.edVerify = verify(null, h('03'), pub, sig);
    out.edNonCanonicalS = verify(null, h('03'), pub, nonCanonical);
    out.edFlipped = verify(null, h('03'), pub, flipped);
    out.edWrongMsg = verify(null, h('04'), pub, sig);
    out.edShort = verify(null, h('03'), pub, sig.subarray(0, 113));
    // Signed over a public-key encoding with unused bit 448 set: only a lenient decoder accepts it.
    const unusedBitKey = createPublicKey({ key: h('3043300506032b6571033a00' + '43ba28f430cdff456ae531545f7ecd0ac834a55d9358c0372bfa0c6c6798c0866aea01eb00742802b8438ea4cb82169c235160627b4c3a9481'), format: 'der', type: 'spki' });
    out.edUnusedBitPublicKey = verify(null, h('03'), unusedBitKey, h('26b8f91727bd62897af15e41eb43c377efb9c610d48f2335cb0bd0087810f4352541b143c4b981b7e18f62de8ccdf633fc1bf037ab7cd77980109897beebf58a30dd7bc49d0c907c7f0ba328ee73c348027d093917337ad29de5b57f0925fe2c4067d72709bce0d4230cfe3e073237f60800'));
    // Wycheproof ed448 tcId 63: bit 448 of R set, S recomputed to match.
    const wpKey = createPublicKey({ key: h('3043300506032b6571033a00' + '419610a534af127f583b04818cdb7f0ff300b025f2e01682bcae33fd691cee039511df0cddc690ee978426e8b38e50ce5af7dcfba50f704c00'), format: 'der', type: 'spki' });
    out.edUnusedBitR = verify(null, h('313233343030'), wpKey, h('5db94c53101f521f6c1f43b60ea4d7e06fbd49c2e8afaf4fcc289e645e0880a87b8e55858df4cf2291a7303ffda446b82a117b4dd408cff2811adf92201088e051ee48b57aecf46edfc68e5baeed5ae4910ba5681d370f75ab593811e18293ef0808581c254196bcbf2b4c454136a6711b00'));

    const subtle = crypto.subtle;
    const a = await subtle.importKey('pkcs8', xPriv(A).export({ format: 'der', type: 'pkcs8' }), { name: 'X448' }, false, ['deriveBits', 'deriveKey']);
    const bp = await subtle.importKey('spki', xPub(out.bobPublic).export({ format: 'der', type: 'spki' }), { name: 'X448' }, true, []);
    out.subtleBits = Buffer.from(await subtle.deriveBits({ name: 'X448', public: bp }, a, 448)).toString('hex');
    out.subtleBits100 = Buffer.from(await subtle.deriveBits({ name: 'X448', public: bp }, a, 100)).toString('hex');
    const dk = await subtle.deriveKey({ name: 'X448', public: bp }, a, { name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    out.subtleKey = Buffer.from(await subtle.exportKey('raw', dk)).toString('hex');
    const edKey = await subtle.importKey('pkcs8', k.export({ format: 'der', type: 'pkcs8' }), { name: 'Ed448' }, false, ['sign']);
    out.subtleEdSig = Buffer.from(await subtle.sign({ name: 'Ed448' }, edKey, h('03'))).toString('hex');

    // Generated keys: the public key is derived from the private key, not copied from it.
    const x1 = generateKeyPairSync('x448');
    const x2 = generateKeyPairSync('x448');
    out.x448GeneratedAgree = diffieHellman({ privateKey: x1.privateKey, publicKey: x2.publicKey })
        .equals(diffieHellman({ privateKey: x2.privateKey, publicKey: x1.publicKey }));
    out.x448GeneratedPublicDiffersFromPrivate = x1.publicKey.export({ format: 'jwk' }).x !== x1.privateKey.export({ format: 'jwk' }).d;
    const e1 = generateKeyPairSync('ed448');
    const reimported = createPrivateKey({ key: e1.privateKey.export({ format: 'der', type: 'pkcs8' }), format: 'der', type: 'pkcs8' });
    out.ed448GeneratedPublicMatchesReimport = e1.publicKey.export({ format: 'jwk' }).x === createPublicKey(reimported).export({ format: 'jwk' }).x;
    out.ed448GeneratedRoundTrip = verify(null, h('0102'), e1.publicKey, sign(null, h('0102'), e1.privateKey));

    // ECDH and X25519 WebCrypto deriveBits agree with node:crypto diffieHellman.
    for (const [name, gen, params] of [
        ['ECDH', 'ec', { name: 'ECDH', namedCurve: 'P-256' }],
        ['X25519', 'x25519', { name: 'X25519' }],
    ]) {
        const one = generateKeyPairSync(gen, gen === 'ec' ? { namedCurve: 'P-256' } : undefined);
        const two = generateKeyPairSync(gen, gen === 'ec' ? { namedCurve: 'P-256' } : undefined);
        const priv = await subtle.importKey('pkcs8', one.privateKey.export({ format: 'der', type: 'pkcs8' }), params, false, ['deriveBits']);
        const peer = await subtle.importKey('spki', two.publicKey.export({ format: 'der', type: 'spki' }), params, true, []);
        const bits = Buffer.from(await subtle.deriveBits({ name, public: peer }, priv, 256));
        out['subtle' + name + 'MatchesNode'] = bits.equals(diffieHellman({ privateKey: one.privateKey, publicKey: two.publicKey }));
    }

    // deriveBits lengths: null keeps the whole secret, fractions truncate, and
    // negative, non-finite or too-long lengths are rejected.
    const bitsHex = async (length) => {
        try {
            return Buffer.from(await subtle.deriveBits({ name: 'X448', public: bp }, a, length)).toString('hex');
        } catch (e) {
            return e.name;
        }
    };
    out.subtleLengths = {};
    for (const [label, length] of [['0', 0], ['1', 1], ['12', 12], ['12.9', 12.9], ['null', null],
        ['-8', -8], ['NaN', NaN], ['2^32', 2 ** 32], ['456', 456], ["'16'", '16'],
        ['valueOf 16', { valueOf: () => 16 }], ['128n', 128n], ['valueOf 128n', { valueOf: () => 128n }]]) {
        out.subtleLengths[label] = await bitsHex(length);
    }

    // deriveBits and deriveKey check the key's usage, type and algorithm before deriving.
    const errorName = async (promise) => {
        try {
            await promise;
            return 'ok';
        } catch (e) {
            return e.name;
        }
    };
    const bitsOnly = await subtle.generateKey({ name: 'X25519' }, false, ['deriveBits']);
    const keyOnly = await subtle.generateKey({ name: 'X25519' }, false, ['deriveKey']);
    const otherX448 = await subtle.generateKey({ name: 'X448' }, false, ['deriveBits']);
    const p256 = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    const p384 = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-384' }, false, ['deriveBits']);
    const aes = { name: 'AES-GCM', length: 128 };
    const x25519 = (pub) => ({ name: 'X25519', public: pub });
    out.subtleKeyChecks = {
        deriveKeyOnlyBits: await errorName(subtle.deriveBits(x25519(bitsOnly.publicKey), keyOnly.privateKey, 128)),
        deriveKeyOnlyKey: await errorName(subtle.deriveKey(x25519(bitsOnly.publicKey), keyOnly.privateKey, aes, false, ['encrypt'])),
        deriveBitsOnlyKey: await errorName(subtle.deriveKey(x25519(keyOnly.publicKey), bitsOnly.privateKey, aes, false, ['encrypt'])),
        algorithmNameMismatch: await errorName(subtle.deriveBits({ name: 'X448', public: keyOnly.publicKey }, bitsOnly.privateKey, 128)),
        peerAlgorithmMismatch: await errorName(subtle.deriveBits(x25519(otherX448.publicKey), bitsOnly.privateKey, 128)),
        publicBaseKey: await errorName(subtle.deriveBits(x25519(keyOnly.publicKey), bitsOnly.publicKey, 128)),
        privatePeerKey: await errorName(subtle.deriveBits(x25519(keyOnly.privateKey), bitsOnly.privateKey, 128)),
        notCryptoKeyPeer: await errorName(subtle.deriveBits(x25519({}), bitsOnly.privateKey, 128)),
        curveMismatch: await errorName(subtle.deriveBits({ name: 'ECDH', public: p384.publicKey }, p256.privateKey, 128)),
    };
    return JSON.stringify(out);
}

// RSA private operations against a key and ciphertexts produced by host Node.js (OpenSSL).
const RSA_FIXTURE = {
    "pem": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7ti7GpD3JFahe\nNAW5q8TkgPaI/TdUD9bnepZLzj8tR4bxpJWJ8P5DWb5zkSaETbkWMA/ODQN+PtMo\nrEa5w/NAYHRj2q5a6iOGcBEXZUMOBZj5oM4daPSycFTxE/0p/nyJf6+PWvBJtG3V\n+Pquplgj6APhAlaFrORbXqGrue0aMuXUUlc1k9TMQVh0XHt60YO7Ub9GAYxUP8mp\nD+sajuoMaMYh2bvNvu9hckq/MhDksS6O61JzhIvykJnB0PrC7yur+UajAe4xU8iY\nKMz83KERCOWiUfFVuh+VXOcr8yJgfwPphDRezMHGQluM74ykIUe8U6Y19+d3SMY3\n9mxfnenfAgMBAAECggEAEVtrP9r4C5wBEZTl4qFLd4WlRk2DzDYavRTMyP2tQdaX\nV8jMOxEZscien7kQQrOdJbwT+g2iAQ52IBCuCYdg+tbwbDtQW//CgS/jpLIsXSOP\nXaXM6VNHLSjN8ezTQArUITK5XRwfk/EnJt368CNZixhtI2U/8uRlyT0a3fI3RnC9\nyUzmxUGM6c91c+Ato7exzVG6ALF3SrvacSlBaxqaYpSw/o+z7zRWKJgJuS/f7rti\nuSLK2tyJ0a21sW8krn/P8Orz56kKQvw0NVPbj1E3ONb8z9xN1shYze31qtpHkJBP\nda1LTiiKQHw0YT5EhUl1PM99MB2kmTAcZktcRxZfIQKBgQDpSaauDOJMniHuYPhQ\ncgPDC72J2ApUYelv6kn81TCwKMHxaPWUfO9g1IEplgj98YJsO9/POFk0mvESeSHw\n3eHWOPnYrNKnKAOcL4WuXyzZ2z27oTqP1ZS16Hk+VqzkCfi0bHIJq3IGw4kpJKWf\nGR+3Z9eccYJd26XNbMKNDXQySwKBgQDN/J3NOpdq+WLeBaKgI8iegntl0t4KpwJ9\nBL4MgK2VFjb8dp9xiu1ofc9nvcroFrJUougyY+sZ6PaT/kxvjKgDdu5T/3BAnTuX\npPWK9wrrHYlcvvlmcIIHkpTDqoaFhrA3Paw7c9Nc2OHiQExjVrVq4+pLr2LrfrYr\nDBmSgIUKPQKBgGMULsBZJHuZ5ZtSf+PaqJJcGCHFKY3xD63Cea3x9X27sbMP+s0X\nyqr7VegNmsAPpG7HdySRMAHRlHVeEPY1pkbPZ/2IWOc5bV8WJ9aJAYl9PdjEfxS7\nhy9DDstVEJTBT2mBbWWB9Sm+PjDFKbpKd1fzuHTvGIk4UlDO0koJ3sHFAoGAQDTZ\nyzrUL9gEZUhEZL5CroXliNutsoxUTjvIMYV6ldoS0ab4FCBF2Cg/Ggsi0C0i8RbG\nYc6bXbwr//1oPe0OAeZ0a2JXzwwzoxUcJHDUymyugGZWvwOaxFmAXW0t+Tj+fHmQ\n0gdMfshrwGZiaSSB8AuS4HyOzPD2P3zKC8xbq9ECgYEAmBX13TNcUllleiIKuYCS\n/z8mbGo85Kxwwcx2U0kIShnM3t63thw7d/5e3/tF9fJhPqRrTtjlO+Br0S4U2fdL\nGVlW3X9eJ+6HdLbwVKyGCjduHk/hUlmSLAfA7mPDaz8R/CM6m3FYA6gkq74dp/t+\n3sAtdlKKLdJ2thPUnsjZzlQ=\n-----END PRIVATE KEY-----\n",
    "oaep": "9c6e5fb5d7be3bf857f11a679e3304ee2a99316f7eb6ea0b52702ad9407e68d68bda4b7f9b8aa1875d46c523dcd0e826f965d0df2d0aced64d43eaed26ea97c5b325de74004a65eacc7f2da3fb9800ac2f6d464a034151eb967382430a8b6fd0a0590d364a1110c9216145e7832cc540a20cb21686cf40c31738b3678dd2fb0466e96d01442897da78677620add527c56eb4bcd825c5208cd63296cfe7aad9c10f7a493d0f26f18b34799bb45aefa6936d782f9e542662ba081d2468b89e2913725af7824222f04ee46eb9c652c0e014123f6766e4d64339e80db96f64bccfab269a279cb7dfae7f60f4542dc2c1ff34eb3d6d875a335795556790615ea12a6a",
    "oaepSha1": "23835561809359a95b6d78c0cf0e466d5e976a4a7eebf30afee143c1b5fda0b5a37272162bea1d5917a2b7095f3eaa1b07e1a58927a0dfef135bab1a32c19543dfe2c867ba516d25c738dad70fd46c51a9364a6fef02b0f05badde6d8b026c45ada5f9d0a55015de6f783917fdbdedc41607d83cd40b209855835036d60e63a7d0c209fd2891dbe2488b5a3d362b5d7b3611b1b68339a8a28eb12917bbc10a105c0750ccc9a32bea85903a5516857fe02c17cc8567bca7a9d1809da1c0d13957d109799176870f7d41d659e4af77e2ffd27c80d688276539e7cee6f60db7561c54e90fa6dbd070874891948ca09b4ac7239267f263b1fabc09eaabc3ebf9c031",
    "pkcs1Sig": "b53e7f786c451c1dcbc9639f77a31d78b66b2878e71fa7bc5c2dae78000006259fc7fb93d09a07e7ca7eb906bae3b887bdecf1348a1f948ea4abd320a90fa030d5cc92e2ae24ff789d98f3ab12e3d730d3ce1e2f80aeef8cecf7a877d56063567333cb8145a62546a08f731b7dd72ac3cfe07130ee4828c2c2aeb8e5345e4a866f43c897e9c5ce64860767442927107228ade2488fb6041423985ea98d45f71e642a8a3169d7ad5b882d2d6f9d4315e2d7c543d65097222164be5113642f2c2ded50a890a2f0018855d64d0dcbb7d9f32d94f4c44a04eb058bfcc270c8209318f78305b351f4231c3f8a25f7f3d6fab8d4f5ee59e22857f6effcba5d5e380629",
    "privEnc": "79cbfa6216fc55251c6d854aa409cd7c676b1e25816f26e7b1a9bf2b0f08f194b97ab8a0d7e954c0a0597b2dde2b3939f25b2b22d6b2b3e09861477c437bec679603940b15fa64e75b8637cc0efbe83104bc28b7e1b4f1c459ae753fb030704b2b2d57061ff4a7dd2f8d688537fda708348bf28f132998bf0c0fae73a6083bae92a236ac77d40a7d84b0868d3e608ae4602c7e5d55d752dd8e8d557614fa18880a837c5b16f0558749030b7a57771042bc41a23cfdd80711892c6054fda5312103f4ad822c0714f412a004f5e14fac5516d78b1f04fca23808a79d8445943b05fbde2c52c114c6d5c4fba2ed8946b941af51527b6931e8d91acbe25d1355e16c",
    "otherOaepBelow": "83d6c608f0a8a43cbf7ef674c41d9e88128f1924654a4c07578c112929d72a6164f93eae047ef7ce0572e0a596fca03d066a1d6a02ac694ec438c693eccaf9880a5b7e03755a73883b2bdbc296fc49e2fcdcb6b1ae14205fa5f96d1a3344598cc1aedf62c133d054865fab36aadb4e7ad969ba4a06a5a0928425aee314a7b037a21709fcab3dd3989fe48a53ef000972fc7049b29ab889936e9cb42f7a129c895a0112df0e9a4a86d43634975221990a4beb11fb167b6e38e3b59fcb575aba3d1416c63d9a7b3ba05b2947344c9ac38e14e3d199893faef1b892a12d4d4dddf28e9cd6e7a28a7e98c048752037ffd678e56861811cc0103702ea7e8f1340b082",
    "otherOaepAbove": "c528005eef8f5c87e13e40fa40a7f372e84c38df98d0e439a3529e8f2400b41da796e2c40406c77dfb5d8d010c7a8ec7ed64a2cecbad53eebc8c2a90df97215062d98abb48dc24cf46b8ba51d25b3d0f92060688313580b1d3b905bcc52684decafd76e9e56ab5c3465bec726a7b0224e685fb282dfc7da7388506211e0c16347c0fd6a38e2936144e3c9a1d6e073dff39b0ef74b17bb087d2ec31c3b11e748a943541542acde024b65af2593481d23e86ee73dc0b5c9b5bf628503c3f8c43cbb3fe5951e3eab0e249cb4bccd0057217fe42c14faede5038010ac5e420163b530f7bd31c7e98c68f47caa54a659fe7327bfac4fe7d259076257112cbfd506f0f",
    "otherSigBelow": "2b83d0f92be3ce627ca920d952e29d3eb33ef7e3d1d762ce09f099b15e28ff6718effcb02bb598788e49b68706592a5bad3bbfb43419b30e76e8b17936e5599c34b2d5c7455db4072d37fc914975d1b001da6f7bb31d3aea30d1596cad33e04ef0284c5f90cceb84becb22c53f6eb7baf4390de083a27858afbe5fc59cca3f41de199c9209a00cc0fc24c211e6b45d199ab4b23e838c438fac5c2ae6b358a88c44c920e3e62c9eb99be01577b73d6ddc0d68bddfe3d1070d63c1fe9c893fce03c296ae512f93cc817f9fdc30ccb988af12e703142b8a266c005519ae1f951d880d80265881c73c11a0d81e6cddd6c70bbcde4571fc41976fecedbed1e326707a",
    "otherSigAbove": "bc73e6884d7c4d96570a33886aa24805ccecf784e1d0ccd5dc7a7eb3cf5d513d925653b3dc74e6a0905f7afcb0948ec1619ff7a5f5483f4b4f1984568acc45bbcfc650a4ce5628a14b425f7ed6a429b65dfd99394394acc66cbf8babb9e434af6db462d3aa7f74d8eb4a50d6f92847c763317771d541fc62f12379cf4f0ef931c4b7f22815c49ba0bca02a406665fbe85d798873a2fd6e90e28f7cc5875d4b122b6a2fa2badec163f7c2db856e7795b22516be28aa87be194534d87542ee928c37b6bf59e7c98a907dd55cb55a21bbaf65e15b93124595002a102cf6c8c7e6cab871542a594a29386338fd57b6a82a84c875ce23b1431ccd3295d4ede69b9ee3",
    "otherSigBlockType": "28300913110411da24dffbceed8618af73d2abe9b9d0115211047f0536626f3701395e1c3ff08386e5147144c83a4752810662160f8ede1fdda092eb6658fb12dadf12d7f2d41910b1de5181c5296eac15b90c163c60458158046ce1cda37bb19451c988d2932aeb3f7dea766a092b5885d8285e290b4786dc35dc6a7f7a1d53cc98085376c52f05df39a9c099c5fa68ea6cd77cbc6ce8817b05b8d384563d653a4f6d8a85856ed64c96c5393cd990822a73d5ef327cb35131dbcfa3d2a4c1c04bc5a02e8cee38b0298904091d39226d86e37e581a9c099e63380cca81e13dc0fd57912e2545d283e74f4225644ca1b4d09a75525822386ff1b9700fe754c73f",
};

export function rsaPrivateOperations() {
    const h = (s) => Buffer.from(s, 'hex');
    const code = (fn) => {
        try {
            const result = fn();
            return 'returned:' + Buffer.from(result).toString();
        } catch (e) {
            return e.code || e.message;
        }
    };
    const rejected = (fn) => code(fn).startsWith('returned:') ? 'returned' : 'rejected';
    const key = createPrivateKey(RSA_FIXTURE.pem);
    const pub = createPublicKey(key);
    const oaep = (ct, label) => privateDecrypt({ key, oaepHash: 'sha256', oaepLabel: Buffer.from(label) }, ct);
    const tampered = h(RSA_FIXTURE.oaep);
    tampered[100] ^= 1;
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const small = generateKeyPairSync('rsa', { modulusLength: 512 });
    // A 256-byte message whose integer value is below every 2048-bit modulus.
    const rawMessage = Buffer.concat([Buffer.from([0]), Buffer.alloc(255, 0x5a)]);
    const shortInput = Buffer.alloc(255, 0x5a);
    const paddedShortInput = Buffer.concat([Buffer.alloc(1), shortInput]);
    const modulus = Buffer.from(pub.export({ format: 'jwk' }).n, 'base64url');
    const status = (fn) => {
        try {
            fn();
            return 'returned';
        } catch (e) {
            return e.code || e.message;
        }
    };
    // PKCS#1 type 1 blocks over the 256-byte modulus, signed with raw private encryption.
    const payload = [...Buffer.from('payload')];
    const ff = (n) => Array(n).fill(0xff);
    const typeBlock = (head, pad) => {
        const bytes = [...head, ...pad, 0, ...payload];
        return [...bytes, ...Array(256 - bytes.length).fill(0x41)];
    };
    const type1Sig = (bytes) => publicDecryptStatus(privateEncrypt({ key, padding: constants.RSA_NO_PADDING }, Buffer.from(bytes)));
    const publicDecryptStatus = (sig) => status(() => publicDecrypt(pub, sig));
    const oversized = (lead) => Buffer.concat([Buffer.from([lead]), h(RSA_FIXTURE.privEnc)]);
    const noPad = (k) => ({ key: k, padding: constants.RSA_NO_PADDING });
    return JSON.stringify({
        // OpenSSL's PKCS#1 type 1 checks, in order.
        pkcs1Type1: {
            valid: type1Sig(typeBlock([0, 1], ff(246))),
            firstByteNonzero: type1Sig([1, 1, ...typeBlock([], ff(244))].slice(0, 256)),
            blockType02: type1Sig(typeBlock([0, 2], ff(246))),
            blockType00: type1Sig(typeBlock([0, 0], ff(246))),
            badPadByte: type1Sig(typeBlock([0, 1], [...ff(20), 0x37])),
            noSeparator: type1Sig([0, 1, ...ff(254)]),
            padTooShort: type1Sig(typeBlock([0, 1], ff(7))),
            padExactly8: type1Sig(typeBlock([0, 1], ff(8))),
        },
        // Inputs longer than the modulus, whatever their leading byte.
        oversized: {
            privateDecryptOaep: status(() => privateDecrypt(key, oversized(0))),
            privateDecryptOaepSha256: status(() => privateDecrypt({ key, oaepHash: 'sha256' }, oversized(1))),
            privateDecryptShake: status(() => privateDecrypt({ key, oaepHash: 'shake256' }, oversized(0))),
            privateDecryptRaw: status(() => privateDecrypt(noPad(key), oversized(0))),
            privateDecryptRawLead1: status(() => privateDecrypt(noPad(key), oversized(1))),
            publicDecryptPkcs1: status(() => publicDecrypt(pub, oversized(0))),
            publicDecryptRaw: status(() => publicDecrypt(noPad(pub), oversized(1))),
        },
        // RSA_NO_PADDING encryption needs exactly the modulus length.
        noPaddingEncrypt: {
            publicShort: status(() => publicEncrypt(noPad(pub), Buffer.alloc(255, 0x5a))),
            publicEmpty: status(() => publicEncrypt(noPad(pub), Buffer.alloc(0))),
            publicOversized: status(() => publicEncrypt(noPad(pub), Buffer.alloc(257, 0))),
            privateShort: status(() => privateEncrypt(noPad(key), Buffer.alloc(255, 0x5a))),
            privateEmpty: status(() => privateEncrypt(noPad(key), Buffer.alloc(0))),
            privateOversized: status(() => privateEncrypt(noPad(key), Buffer.alloc(257, 0x5a))),
            publicExact: status(() => publicEncrypt(noPad(pub), rawMessage)),
        },
        oaep: oaep(h(RSA_FIXTURE.oaep), 'label').toString(),
        oaepRepeat: oaep(h(RSA_FIXTURE.oaep), 'label').toString(),
        oaepSha1: privateDecrypt(key, h(RSA_FIXTURE.oaepSha1)).toString(),
        oaepWrongLabel: code(() => oaep(h(RSA_FIXTURE.oaep), 'other')),
        oaepTampered: code(() => oaep(tampered, 'label')),
        // Ciphertexts from a second host key, below and above this modulus.
        oaepOtherKey: code(() => privateDecrypt(key, h(RSA_FIXTURE.otherOaepBelow))),
        oaepOtherKeyAboveModulus: code(() => privateDecrypt(key, h(RSA_FIXTURE.otherOaepAbove))),
        pkcs1Signature: sign('sha256', Buffer.from('message'), key).toString('hex') === RSA_FIXTURE.pkcs1Sig,
        pkcs1Verify: verify('sha256', Buffer.from('message'), pub, h(RSA_FIXTURE.pkcs1Sig)),
        publicDecrypt: publicDecrypt(pub, h(RSA_FIXTURE.privEnc)).toString(),
        publicDecryptOtherKey: code(() => publicDecrypt(pub, h(RSA_FIXTURE.otherSigBelow))),
        publicDecryptOtherKeyAboveModulus: code(() => publicDecrypt(pub, h(RSA_FIXTURE.otherSigAbove))),
        publicDecryptOtherKeyBlockType: code(() => publicDecrypt(pub, h(RSA_FIXTURE.otherSigBlockType))),
        publicDecryptShortPkcs1: code(() => publicDecrypt(pub, Buffer.alloc(255, 1))),
        rawTooLarge: code(() => privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, Buffer.alloc(256, 0xff))),
        rawEqualsModulus: code(() => privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, modulus)),
        rawPublicEncryptEqualsModulus: code(() => publicEncrypt({ key: pub, padding: constants.RSA_NO_PADDING }, modulus)),
        rawPublicDecryptEqualsModulus: code(() => publicDecrypt({ key: pub, padding: constants.RSA_NO_PADDING }, modulus)),
        rawOversized: rejected(() => privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, Buffer.alloc(257, 1))),
        // A ciphertext shorter than the modulus is read as a zero-left-padded integer.
        rawShortPrivateDecrypt: privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, shortInput)
            .equals(privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, paddedShortInput)),
        rawShortPrivateDecryptInverts: publicEncrypt({ key: pub, padding: constants.RSA_NO_PADDING },
            privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, shortInput)).equals(paddedShortInput),
        rawShortPublicDecryptInverts: privateEncrypt({ key, padding: constants.RSA_NO_PADDING },
            publicDecrypt({ key: pub, padding: constants.RSA_NO_PADDING }, shortInput)).equals(paddedShortInput),
        publicDecryptTampered: rejected(() => {
            const sig = h(RSA_FIXTURE.privEnc);
            sig[40] ^= 1;
            return publicDecrypt(pub, sig);
        }),
        rawRoundTrip: privateDecrypt({ key, padding: constants.RSA_NO_PADDING },
            publicEncrypt({ key: pub, padding: constants.RSA_NO_PADDING }, rawMessage)).equals(rawMessage),
        // Another key's ciphertext is rejected when it is not below this modulus; otherwise
        // it must decrypt to something other than the plaintext.
        rawOtherKeyDiffers: (() => {
            const ct = publicEncrypt({ key: other.publicKey, padding: constants.RSA_NO_PADDING }, rawMessage);
            try {
                return !privateDecrypt({ key, padding: constants.RSA_NO_PADDING }, ct).equals(rawMessage);
            } catch (_err) {
                return true;
            }
        })(),
        pkcs1Decrypt: code(() => privateDecrypt({ key, padding: constants.RSA_PKCS1_PADDING }, h(RSA_FIXTURE.oaepSha1))),
        smallKeyRoundTrip: verify('sha256', Buffer.from('m'), small.publicKey, sign('sha256', Buffer.from('m'), small.privateKey)),
    });
}

// ECDSA signatures made by host Node.js (OpenSSL) over "message" verify, and altered ones do not.
const ECDSA_HOST_SIGNATURES = {
    "p256": {
        "jwk": {
            "kty": "EC",
            "x": "ewlrdkdioY7DivHvo_aGMgz9Tjz4oIbL6eBgB8fAhFA",
            "y": "ZosaTp3g0Wc2p9hz0-zhCI4cTHIaHfGWYlSVfOioZpQ",
            "crv": "P-256"
        },
        "hash": "sha256",
        "sig": "304402203cdf64081aaa8dea7e761a62c3544df765e92496445db36dd18f0f8ffc20922e022072b9e57c782da07738920fff044d68d06d3751fcbbbedd062066d86cc16a37cc"
    },
    "p384": {
        "jwk": {
            "kty": "EC",
            "x": "KGmzjyJi0tWs_R4MTcQ5f4zuQ_w1XUQsM-3VwyCigzlRCgxvU4RkzUvSKF7sdMEU",
            "y": "dMY3URW9NWRv1JfbvUtMVNTlHOcbhDEez1s7r6F-V3Bj19vuLZE1eEe0g7Dq2gV1",
            "crv": "P-384"
        },
        "hash": "sha384",
        "sig": "30640230601f7d4e5fd4e372134944da3705247f8a9c084ac4eee4045340ca2252da2bac85707932d49118f0572c77991d4a08db02306ed9b61d97c6e5649419507f58dd0d8236e91314f9654fc07056120670b916a090a3e08d094e6d95795e3cd92b063113"
    },
    "p521": {
        "jwk": {
            "kty": "EC",
            "x": "AGSuEdVr4CarinHLxBXpKp8ojNbRrXD_3HJ9MioE-PZvSbgIODdpC6FbXxrHVEBNnROkQR6AnDngq1uNAR4Lxrr7",
            "y": "AIW350TB3DCjXop1THFYArXPEfEjWrFzQaugbuVQlIGl9jfWMgfByIflzyqysDYwqDdApPDHFPQce45a3JaOTKu4",
            "crv": "P-521"
        },
        "hash": "sha512",
        "sig": "30818702412a4e5a70926ec5c799242a5ee0604d0e72c81c265b7bec266bbf277403082af77975a331070f36c24267173d6f82883d8c2268c9a24845ef718f4a8146d068f8fe0242012aec44b98e325791382e414818851a8ce1a475bde60b8862c706551f320f02bd23dfc27ba712372ea725df22adc61f6c87f1e1e913d274722bdd430b3ede4eeaf0"
    },
    "k256": {
        "jwk": {
            "kty": "EC",
            "x": "3g76CsUpdzBF0n66XzhtCQBmET6bwFyRJS_kumteOZE",
            "y": "2dTMZyV6CRC4Wb8MRll02YNzBbuc3Op1aamr3Uh9SmU",
            "crv": "secp256k1"
        },
        "hash": "sha256",
        "sig": "3045022100fc6223fbed00156b28de5cd33635902999ccede6e3d6d92835d71f4b2fa0a5ea0220231d98e19563582b7007e3f8d7204fe80239836a4f0d3ab5ba4a9b073d86073a"
    }
};

export function ecdsaHostSignatures() {
    const out = {};
    for (const [name, { jwk, hash, sig }] of Object.entries(ECDSA_HOST_SIGNATURES)) {
        const key = createPublicKey({ key: jwk, format: 'jwk' });
        const bytes = Buffer.from(sig, 'hex');
        out[name] = verify(hash, Buffer.from('message'), key, bytes);
        out[name + 'OtherMessage'] = verify(hash, Buffer.from('messagf'), key, bytes);
        const own = generateKeyPairSync('ec', { namedCurve: jwk.crv });
        const ownSig = sign(hash, Buffer.from('message'), own.privateKey);
        // A prehash signature over sha(message) cannot verify as a signature over sha(sha(message)).
        out[name + 'OwnNotDoubleHashed'] = !verify(hash, createHash(hash).update('message').digest(), own.publicKey, ownSig) &&
            verify(hash, Buffer.from('message'), own.publicKey, ownSig);
    }
    return JSON.stringify(out);
}

// One host Node.js (OpenSSL) secp256k1 signature over "message" in low-S and high-S DER form,
// plus invalid-scalar and malformed-encoding variants of it.
const K256_SIGNATURES = {
    "jwk": {
        "kty": "EC",
        "x": "kJH08M_qq-ha8FW5otd1Fu4IBwKG2nucztp-FUCF5qQ",
        "y": "51zUYZxSezUqJtxgF5-WavUi25SlSIN7Ic-EHAFDt04",
        "crv": "secp256k1"
    },
    "otherJwk": {
        "kty": "EC",
        "x": "EUsBO78Oxf0ZaedwF-cMc3oXqLuDoZmiBHTSaRaVLMw",
        "y": "dy19p2wmsBJzPVBJFsuFhrFIqx3bttrDUOJJ_OEUx2o",
        "crv": "secp256k1"
    },
    "lowDer": "304502210091b69f4cbfd9f59a0c3164b293ece0d086f4280980f2dd79842ce4005f265eec022037f47e354aade8fef2296dae69a82b606e0b73ddf2d2ce3b5bd1fe1379f2c70c",
    "highDer": "304602210091b69f4cbfd9f59a0c3164b293ece0d086f4280980f2dd79842ce4005f265eec022100c80b81cab55217010dd692519657d49e4ca36908bc75d2006400607956437a35",
    "zeroS": "302602210091b69f4cbfd9f59a0c3164b293ece0d086f4280980f2dd79842ce4005f265eec020100",
    "sEqualsN": "304602210091b69f4cbfd9f59a0c3164b293ece0d086f4280980f2dd79842ce4005f265eec022100fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
    "sPlusN": "304602210091b69f4cbfd9f59a0c3164b293ece0d086f4280980f2dd79842ce4005f265eec02210137f47e354aade8fef2296dae69a82b5f28ba50c4a21b6e771ba45ca04a29084d",
    "zeroR": "3025020100022037f47e354aade8fef2296dae69a82b606e0b73ddf2d2ce3b5bd1fe1379f2c70c",
    "trailingByte": "304602210091b69f4cbfd9f59a0c3164b293ece0d086f4280980f2dd79842ce4005f265eec022100c80b81cab55217010dd692519657d49e4ca36908bc75d2006400607956437a3500"
};

export function k256SignatureForms() {
    const key = createPublicKey({ key: K256_SIGNATURES.jwk, format: 'jwk' });
    const other = createPublicKey({ key: K256_SIGNATURES.otherJwk, format: 'jwk' });
    const v = (k, message, name) => {
        try {
            return verify('sha256', Buffer.from(message), k, Buffer.from(K256_SIGNATURES[name], 'hex'));
        } catch (e) {
            return 'err:' + (e.code || e.message);
        }
    };
    return JSON.stringify({
        lowDer: v(key, 'message', 'lowDer'),
        highDer: v(key, 'message', 'highDer'),
        highOtherMessage: v(key, 'messagf', 'highDer'),
        highWrongKey: v(other, 'message', 'highDer'),
        zeroS: v(key, 'message', 'zeroS'),
        sEqualsN: v(key, 'message', 'sEqualsN'),
        sPlusN: v(key, 'message', 'sPlusN'),
        zeroR: v(key, 'message', 'zeroR'),
        trailingByte: v(key, 'message', 'trailingByte'),
    });
}

// DSA and ECDSA signatures over "message" made by host Node.js (OpenSSL) in DER and IEEE P1363
// form, and ECDSA signatures from host WebCrypto.
const DSA_ENCODING_FIXTURE = {
    "p256": {
        "spki": "3059301306072a8648ce3d020106082a8648ce3d03010703420004d4fd232a58951c026d3ed10d1e628f46ccfe12955fb8034637b5529d0c6c85f650651ca929de9380c81b808ece90688a50e37f4101ae4ad77950f276f8d147ae",
        "hash": "sha256",
        "der": "3045022100a0cf3e8a58f94cfa6d2f040858dc606e46762ac8d8dd045c94372d2d952ceb0202205cdd9d608901c83e8fac6e8e49407a9e3875472e20443ff2b2118fc27a8a8b8e",
        "p1363": "5bf2fe1af3d2ecbf0a100c27bb7d7ba826cfd0645226260e691ca871a0cc947aae69c67e023b2b682e3ac0f3b051992e834da25756303372d06ce5e99b9b9d68"
    },
    "p384": {
        "spki": "3076301006072a8648ce3d020106052b810400220362000491a8b6e4cd98f944c96b48577c71f3085affddd7cd8324349d207e7358c7c66b0f5b40fbc28e49014989121cbf2c806ca15b16d21c7c4a793c2d4dacb79a8a60bb4a6f98b47d4b9dff912392f99d2ee1718bbbdaa6d98392bd2eef8a91c4ff10",
        "hash": "sha384",
        "der": "3066023100a7ca609856fd532aefd5117223a0eb19cf93b9598345aa7e5955ba10ff0c562ffc4fe4b59c6f1b0db5d3941c89695ec4023100f25267ebb021e9965c0364c01c01456283b7fcba68989520781f310d1232d2460a87b6d26f342aa43e7f606d6531399c",
        "p1363": "5fa7f8f56a470edef145b60461f0260cd291a9c2cd7188395565096b6e4e59d9b1e74cd13933493ddde5158faac1ce4ddda6cf88a67804b8e0b2bf0546e0a4d2b7baf22be6eb8d5d05167f131858817802ab453190e4b571f4935ef234f35df3"
    },
    "p521": {
        "spki": "30819b301006072a8648ce3d020106052b81040023038186000400eebea5385d1631aff938ced043e0b540ecd12a3c52b847d52783e2dfc32d2139b20659519d50feb0b423e156fe723bf81958d6d55af904980f71e8b037475f01f401f5d975f4b2e581f1d0aed0f40afe25115325f5b741c63dbd37560194cf0aa8c79f729a9506f9adc326464aa287aa2c1d9b5b181245bdb2185921fbb9e19c97cc23",
        "hash": "sha512",
        "der": "30818702413092d09dae6a613040424bc1ca408b129e805e826048eddb77b173100552317b33a8d5ed20227b60d487b321a12aa02af75f37eb92773f37cc80d4d542410d26e8024201be15de727b6764c32f0e51034f45fd6e412657d92bcfa24fb815c6fba2e64ac0707dda05232d0b367ec0b4b7bde939755f2cf4185ef6adfe8de508d074b67d5224",
        "p1363": "002697a9ada46db1db476105c4e9229242af71d7942e797e7db317996946a26e42f8d4cb795ade809472a9df1afe23524cb15abb2490700154ef7bcf73b8aca6cbde0114de1bf55aa9a3f4e11d8415b00af906c99363d79c111299d864ab201d8120807cbe73e9e281df5add5c7e5ddbafc8232b46ac493195a76ef31fb6bc0054f6e873"
    },
    "k256": {
        "spki": "3056301006072a8648ce3d020106052b8104000a034200043eac65eaf0c15fad60b7408208b45c1b584e09072f21b59e8dc341829bfcd7f6234a658a0b142042f5807eefdbbfd62568774daf9c12132196eb978559498346",
        "hash": "sha256",
        "der": "30440220445e54480868251d1d036759cbff7182f7de43d60e94a05b06f4442dfac4fd35022006dafaf4bb8fc13269a6c29084287ed4af18c69f0f35f46b4d6398363b9a9b31",
        "p1363": "9eead409422771ddf3c0295023aaff0594149ab1d3a4ddadb05138e4338ce6fe96632286b1ffc1b86d9e2714e0e143c332d0a53418ae72863247e664c7277da7"
    },
    "dsa": {
        "spki": "308203463082023906072a8648ce3804013082022c028201010083f904dc08a907ac0a89215a5d74b045eb94266631fcd193d3a1d2269d80f046ba805535830e37811127bbec6334e68f65e7bad860e7406900a27b21f7d538cf3f515e5715aceee93562cea3a7ef77dd1ffef66c4b06f6233be813a283b10c0557fd3dbefe1ca191d4d77477b3859366398b78c51363da4fa5cb01dd6994443cccc446526aa9dcce8ca6eed4ed23772ee5cfdecda3850b52ef1894bb82c3107a04be760074b502365071a960244cc4753cc36fde080e5a7e1e688c11477aeb650d3aa803441758bc972145dd30120b242b77fc676ebb95bb6f6ef17f61988ab61c6ef117113c643f20e69a0e8197f24e6f2fc59c061a7d83c9667e06701fa797022100eaa1912085dc58f6bf3e318a16dace6e1acef1f8860f80f90460fa344cbe717d0282010042a4c1910d0724260e5c6c1bdd63e0111bd1d084e0f936c4deba847fde3a565ecbd8993eae159b545382e1a095a775614519181a070e27c4457d5ce65946028e97c8b12a2df9a20a38f4d02158f04212ed600b2609c995e79db52f933653193e7bd72b5562c5b4ddf368df8affad8f62c6f9ce3d479bcb2911d3e1d6427b8c4443f6008159c482fbc9e3551bbfba56886a2f0841effa6bbc1cd9936a8e4f0f0262130994090627f479ca579b85607d2a6fdf20a79059f89f8c483f3ce70d1d6544764fa9b7dc1e7ec2642161a712fe5282444fa9bc40cb8cc0ead7b50619d2a7fcb41166dadb406f5add7a3108e3f05fc972fcdb335e12050bda6cc058d33a110382010500028201003c492e9577f66b6e4435411d090b6dd519248a31867d126bb78bc0c1ebc8f04aac75e5b4740dd7558fdd6245388e565df41078ab79da80379359879eae2c3a4b8be0e9b65ab71f1fbfd98abc928adaaf71508d74c5d8cdc13adb5d7af290b530e321a1098a196417fe6120acde967cfb3850641eb855847880496238ea72349128ae54e0a671ab11c0944959d4b5f5c5280c2e04e9de42082753559defe593b60538d1949df129f08ef4d104571113b670123b4bcf899962f3b20a0cc56b2318eb7b765c8120346d90c2a1b280be4b778fb6ac292a3a927a74360ea434accab9ee5c5e6c62ba1936a15c4bb87d55c427fb2ff35c5d1a2aaf98bb734c2378162b",
        "hash": "sha256",
        "der": "304402206a254439fae3c7d472de2d3ee3fafa63137a9c1c82267f98a4fdc95a118be7b502205a5f34640c17baa915765dde810ee434c2d2954cff629c0e92663dc46a982f6d",
        "p1363": "462419659368e7d77f9126c156a64393f416972433f8f76f387d6f1ee6cf6cd3d7e20e79b727806eb8fff56502ab21f006d474b281d4995f4fdb1ea8a9e49109"
    },
    "webP256": {
        "curve": "P-256",
        "hash": "SHA-256",
        "spki": "3059301306072a8648ce3d020106082a8648ce3d030107034200047930279789e311719f8213e982194474fabd38ecdfad4acfc6a5f290398eb9b2e0d21d86e7075b0af4c7bd52192cb3fdb085ed9dd3e8d698e07e808178210b0d",
        "sig": "ba7c87b0b47579bc5b4307ec71ad261702658b654689bca179b5ac5a83293d17c1b179b3a2ebe3c3669a19d5870b96cf9b2de078524fd21ce5c1c2e5a2998216"
    },
    "webP384": {
        "curve": "P-384",
        "hash": "SHA-384",
        "spki": "3076301006072a8648ce3d020106052b810400220362000418f396456719996cee0e920eab71d755fdd4f6c73a452e8a26ffffa682ff580428966c4133f620e9ed2af26ed3f782170a6362604210dea76223169b8e8a6939105575faa7d59a438276fa8f1d46d2c156fde35f8db8912e389250918fd76138",
        "sig": "f366f5b5e2f390e9075937bf194bfdff92ce76cb1ba191494c585e90a74dfcdafe533c8529bf162a9799c205c4249e3750d015bca002af724e9ed88bb8c532739c8d3768d564ee01070b714cbde8d57cc819edebcaf9f47c3d8eba4f308b4c53"
    },
    "webP521": {
        "curve": "P-521",
        "hash": "SHA-512",
        "spki": "30819b301006072a8648ce3d020106052b81040023038186000400ad3da6aadff1589a81fc72b38d34b351c4e728dc5c810d741c87025f93eb80e13e8c8b8ae7cf3bbd55f8aff78cf9ebde2d085fe74fe2b86003111488690d17fb7e0126225003f36b411f86c14a7233ff463480321748a6941550eac925c8b6bb1b144a14a2895a12ffe7447b6036ddba039a487d4d9ce61c6a11f7b3d9ef14ff5a94f2",
        "sig": "00f24d136a7c6b2fe0cde04c98c41cce6bce21fc9a4678a6983fed75f87e1fa21cab635325d0d3bb439aebcf68f211f16209fc2eee8495ae5bb2ff22227f80a05011011b5ee010a0dcaf2e5eeea61c65f1aefbba48310bf8123a14e93c57440dbc098a4b4ba61e6694f828396a813a929cf31e9b7fbdf511c139135f10ae150e2d77aa12"
    }
};

export async function dsaEncodingForms() {
    const h = (s) => Buffer.from(s, 'hex');
    const msg = Buffer.from('message');
    const viaCallback = (fn) => new Promise((resolve, reject) => {
        fn((error, value) => error ? reject(error) : resolve(value));
    });
    const run = (fn) => {
        try {
            return fn();
        } catch (e) {
            return 'err:' + (e.code || e.message);
        }
    };
    const out = {};
    for (const [name, { spki, hash, der, p1363 }] of Object.entries(DSA_ENCODING_FIXTURE)) {
        if (name.startsWith('web')) {
            continue;
        }
        const key = createPublicKey({ key: h(spki), format: 'der', type: 'spki' });
        const raw = { key, dsaEncoding: 'ieee-p1363' };
        const width = h(p1363).length / 2;
        const altered = h(p1363);
        altered[width - 1] ^= 1;
        out[name] = {
            der: verify(hash, msg, key, h(der)),
            derExplicit: verify(hash, msg, { key, dsaEncoding: 'der' }, h(der)),
            p1363: verify(hash, msg, raw, h(p1363)),
            p1363Callback: await viaCallback((cb) => verify(hash, msg, raw, h(p1363), cb)),
            p1363AlteredCallback: await viaCallback((cb) => verify(hash, msg, raw, altered, cb)),
            p1363AsDer: verify(hash, msg, key, h(p1363)),
            derAsP1363: verify(hash, msg, raw, h(der)),
            p1363OtherMessage: verify(hash, Buffer.from('messagf'), raw, h(p1363)),
            p1363Altered: verify(hash, msg, raw, altered),
            p1363Short: verify(hash, msg, raw, h(p1363).subarray(1)),
            p1363Zero: verify(hash, msg, raw, Buffer.alloc(2 * width)),
            p1363AllOnes: verify(hash, msg, raw, Buffer.alloc(2 * width, 0xff)),
        };
    }
    out.invalidEncoding = run(() => verify('sha256', msg, { key: createPublicKey({ key: h(DSA_ENCODING_FIXTURE.p256.spki), format: 'der', type: 'spki' }), dsaEncoding: 'p1363' }, h(DSA_ENCODING_FIXTURE.p256.der)));
    for (const [name, curve, hash] of [['p256', 'P-256', 'sha256'], ['p521', 'P-521', 'sha512']]) {
        const own = generateKeyPairSync('ec', { namedCurve: curve });
        const sig = sign(hash, msg, { key: own.privateKey, dsaEncoding: 'ieee-p1363' });
        const callbackSig = await viaCallback((cb) => sign(hash, msg, { key: own.privateKey, dsaEncoding: 'ieee-p1363' }, cb));
        own.privateKey.dsaEncoding = 'ieee-p1363';
        out['own' + name] = {
            length: sig.length,
            p1363: verify(hash, msg, { key: own.publicKey, dsaEncoding: 'ieee-p1363' }, sig),
            asDer: verify(hash, msg, own.publicKey, sig),
            streaming: createVerify(hash).update(msg).verify({ key: own.publicKey, dsaEncoding: 'ieee-p1363' },
                createSign(hash).update(msg).sign({ key: own.privateKey, dsaEncoding: 'ieee-p1363' })),
            callbackLength: callbackSig.length,
            callbackSignature: verify(hash, msg, { key: own.publicKey, dsaEncoding: 'ieee-p1363' }, callbackSig),
            directKeyCallbackLength: (await viaCallback((cb) => sign(hash, msg, own.privateKey, cb))).length,
            invalidSignCallback: run(() => {
                sign(hash, msg, { key: own.privateKey, dsaEncoding: 'p1363' }, () => {});
                return 'did not throw';
            }),
            invalidVerifyCallback: run(() => {
                verify(hash, msg, { key: own.publicKey, dsaEncoding: 'p1363' }, sig, () => {});
                return 'did not throw';
            }),
        };
    }
    const subtle = crypto.subtle;
    for (const name of ['webP256', 'webP384', 'webP521']) {
        const { curve, hash, spki, sig } = DSA_ENCODING_FIXTURE[name];
        const key = await subtle.importKey('spki', h(spki), { name: 'ECDSA', namedCurve: curve }, true, ['verify']);
        const altered = h(sig);
        altered[3] ^= 1;
        const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: curve }, true, ['sign', 'verify']);
        const ownSig = Buffer.from(await subtle.sign({ name: 'ECDSA', hash }, pair.privateKey, msg));
        out[name] = {
            hostSignature: await subtle.verify({ name: 'ECDSA', hash }, key, h(sig), msg),
            hostSignatureAltered: await subtle.verify({ name: 'ECDSA', hash }, key, altered, msg),
            ownLength: ownSig.length,
            own: await subtle.verify({ name: 'ECDSA', hash }, pair.publicKey, ownSig, msg),
        };
    }
    return JSON.stringify(out);
}
