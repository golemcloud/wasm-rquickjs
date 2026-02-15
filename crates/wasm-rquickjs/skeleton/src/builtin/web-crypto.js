import * as webCryptoNative from '__wasm_rquickjs_builtin/web_crypto_native'

const HASH_ALIASES = {
    'md5': 'md5',
    'sha1': 'sha1',
    'sha-1': 'sha1',
    'sha224': 'sha224',
    'sha-224': 'sha224',
    'sha256': 'sha256',
    'sha-256': 'sha256',
    'sha384': 'sha384',
    'sha-384': 'sha384',
    'sha512': 'sha512',
    'sha-512': 'sha512',
    'sha3-256': 'sha3-256',
    'sha3-384': 'sha3-384',
    'sha3-512': 'sha3-512',
    'ripemd160': 'ripemd160',
    'rmd160': 'ripemd160',
};

function normalizeHashAlgorithm(algorithm) {
    if (typeof algorithm !== 'string') {
        const err = new TypeError('The "algorithm" argument must be of type string. Received ' + (algorithm === null ? 'null' : typeof algorithm));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    const normalized = HASH_ALIASES[algorithm.toLowerCase()];
    if (!normalized) {
        const err = new Error('Digest method not supported: ' + algorithm);
        err.code = 'ERR_CRYPTO_INVALID_DIGEST';
        throw err;
    }
    return normalized;
}

function toBytes(data, inputEncoding) {
    if (typeof data === 'string') {
        if (inputEncoding === 'hex') {
            const bytes = new Uint8Array(data.length / 2);
            for (let i = 0; i < data.length; i += 2) {
                bytes[i / 2] = parseInt(data.substring(i, i + 2), 16);
            }
            return bytes;
        } else if (inputEncoding === 'base64') {
            const binary = atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } else if (inputEncoding === 'latin1' || inputEncoding === 'binary') {
            const bytes = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                bytes[i] = data.charCodeAt(i) & 0xFF;
            }
            return bytes;
        } else {
            const encoder = new TextEncoder();
            return encoder.encode(data);
        }
    } else if (data instanceof Uint8Array) {
        return data;
    } else if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    } else {
        const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
}

function encodeOutput(result, encoding) {
    if (!encoding || encoding === 'buffer') {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(result.buffer, result.byteOffset, result.byteLength);
        }
        return result;
    } else if (encoding === 'hex') {
        return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (encoding === 'base64') {
        let binary = '';
        for (let i = 0; i < result.length; i++) {
            binary += String.fromCharCode(result[i]);
        }
        return btoa(binary);
    } else if (encoding === 'base64url') {
        let binary = '';
        for (let i = 0; i < result.length; i++) {
            binary += String.fromCharCode(result[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else if (encoding === 'latin1' || encoding === 'binary') {
        let str = '';
        for (let i = 0; i < result.length; i++) {
            str += String.fromCharCode(result[i]);
        }
        return str;
    } else if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(result).toString(encoding);
        }
        let str = '';
        for (let i = 0; i < result.length; i += 2) {
            const code = i + 1 < result.length ? (result[i] | (result[i + 1] << 8)) : result[i];
            str += String.fromCharCode(code);
        }
        return str;
    } else {
        if (typeof encoding === 'object' && encoding !== null && typeof encoding.toString === 'function') {
            encoding.toString();
        }
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(result).toString(encoding);
        }
        return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

class Hash {
    constructor(algorithm, options) {
        this._algorithm = normalizeHashAlgorithm(algorithm);
        const handle = webCryptoNative.hash_init(this._algorithm);
        if (handle === null || handle === undefined) {
            const err = new Error('Digest method not supported: ' + algorithm);
            err.code = 'ERR_CRYPTO_INVALID_DIGEST';
            throw err;
        }
        this._handle = handle;
        this._finalized = false;
    }

    update(data, inputEncoding) {
        if (this._finalized) {
            const err = new Error('Digest already called');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        if (data === undefined || data === null) {
            const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        const bytes = toBytes(data, inputEncoding);
        webCryptoNative.hash_update(this._handle, bytes);
        return this;
    }

    digest(encoding) {
        if (this._finalized) {
            const err = new Error('Digest already called');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        this._finalized = true;
        const hashBytes = webCryptoNative.hash_final(this._handle);
        const result = new Uint8Array(hashBytes);
        return encodeOutput(result, encoding);
    }

    copy(options) {
        if (this._finalized) {
            const err = new Error('Digest already called');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        const newHash = Object.create(Hash.prototype);
        newHash._algorithm = this._algorithm;
        newHash._handle = webCryptoNative.hash_copy(this._handle);
        newHash._finalized = false;
        return newHash;
    }
}

export { Hash };

export function createHash(algorithm, options) {
    return new Hash(algorithm, options);
}

class Hmac {
    constructor(algorithm, key, options) {
        this._algorithm = normalizeHashAlgorithm(algorithm);
        const keyBytes = toBytes(key);
        const handle = webCryptoNative.hmac_init(this._algorithm, keyBytes);
        if (handle === null || handle === undefined) {
            const err = new Error('Digest method not supported: ' + algorithm);
            err.code = 'ERR_CRYPTO_INVALID_DIGEST';
            throw err;
        }
        this._handle = handle;
        this._finalized = false;
    }

    update(data, inputEncoding) {
        if (this._finalized) {
            const err = new Error('Digest already called');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        if (data === undefined || data === null) {
            const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        const bytes = toBytes(data, inputEncoding);
        webCryptoNative.hmac_update(this._handle, bytes);
        return this;
    }

    digest(encoding) {
        if (this._finalized) {
            const err = new Error('Digest already called');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        this._finalized = true;
        const hmacBytes = webCryptoNative.hmac_final(this._handle);
        const result = new Uint8Array(hmacBytes);
        return encodeOutput(result, encoding);
    }
}

export { Hmac };

export function createHmac(algorithm, key, options) {
    return new Hmac(algorithm, key, options);
}

export function hash(algorithm, data, outputEncoding) {
    const algo = normalizeHashAlgorithm(algorithm);
    const bytes = toBytes(data);
    const hashBytes = webCryptoNative.hash_one_shot(algo, bytes);
    const result = new Uint8Array(hashBytes);

    let encoding;
    if (typeof outputEncoding === 'string') {
        encoding = outputEncoding;
    } else if (outputEncoding && typeof outputEncoding === 'object') {
        encoding = outputEncoding.outputEncoding || 'hex';
    } else {
        encoding = 'hex';
    }

    return encodeOutput(result, encoding);
}

export function getRandomValues(typedArray) {
    if (typedArray instanceof Int8Array) {
        webCryptoNative.randomize_int8_array(typedArray);
    } else if (typedArray instanceof Uint8Array) {
        webCryptoNative.randomize_uint8_array(typedArray);
    } else if (typedArray instanceof Uint8ClampedArray) {
        webCryptoNative.randomize_uint8_clamped_array(typedArray);
    } else if (typedArray instanceof Int16Array) {
        webCryptoNative.randomize_int16_array(typedArray);
    } else if (typedArray instanceof Uint16Array) {
        webCryptoNative.randomize_uint16_array(typedArray);
    } else if (typedArray instanceof Int32Array) {
        webCryptoNative.randomize_int32_array(typedArray);
    } else if (typedArray instanceof Uint32Array) {
        webCryptoNative.randomize_uint32_array(typedArray);
    } else if (typedArray instanceof BigInt64Array) {
        webCryptoNative.randomize_bigint64_array(typedArray);
    } else if (typedArray instanceof BigUint64Array) {
        webCryptoNative.randomize_biguint64_array(typedArray);
    } else {
        throw new TypeError('Unsupported TypedArray type');
    }
    return typedArray;
}

/**
 * Generate a random UUID
 * @returns A string containing a randomly generated, 36 character long v4 UUID.
 */
export function randomUUID() {
    return webCryptoNative.random_uuid_v4_string();
}

export function randomBytes(size, callback) {
    if (typeof size !== 'number' || size < 0 || !Number.isFinite(size)) {
        const err = new RangeError('The value of "size" is out of range. It must be a non-negative finite number.');
        err.code = 'ERR_OUT_OF_RANGE';
        if (callback) {
            queueMicrotask(() => callback(err));
            return;
        }
        throw err;
    }
    const bytes = webCryptoNative.random_bytes(size);
    const buf = typeof Buffer !== 'undefined' ? Buffer.from(bytes) : new Uint8Array(bytes);
    if (callback) {
        queueMicrotask(() => callback(null, buf));
        return;
    }
    return buf;
}

export function randomFillSync(buffer, offset, size) {
    if (offset === undefined) offset = 0;
    if (size === undefined) size = buffer.byteLength - offset;
    const bytes = webCryptoNative.random_bytes(size);
    const target = new Uint8Array(buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength || buffer.length);
    for (let i = 0; i < size; i++) {
        target[offset + i] = bytes[i];
    }
    return buffer;
}

export function randomFill(buffer, offset, size, callback) {
    if (typeof offset === 'function') {
        callback = offset;
        offset = 0;
        size = buffer.byteLength;
    } else if (typeof size === 'function') {
        callback = size;
        size = buffer.byteLength - offset;
    }
    try {
        randomFillSync(buffer, offset, size);
        if (callback) queueMicrotask(() => callback(null, buffer));
    } catch (err) {
        if (callback) queueMicrotask(() => callback(err));
        else throw err;
    }
}

export function randomInt(low, high, callback) {
    if (typeof high === 'function') {
        callback = high;
        high = low;
        low = 0;
    } else if (high === undefined) {
        high = low;
        low = 0;
    }

    if (!Number.isInteger(low) || !Number.isInteger(high)) {
        const err = new TypeError('Arguments must be integers');
        err.code = 'ERR_INVALID_ARG_TYPE';
        if (callback) { queueMicrotask(() => callback(err)); return; }
        throw err;
    }

    if (low >= high) {
        const err = new RangeError('The value of "max" is out of range.');
        err.code = 'ERR_OUT_OF_RANGE';
        if (callback) { queueMicrotask(() => callback(err)); return; }
        throw err;
    }

    const result = webCryptoNative.random_int_range(low, high);
    if (result === null || result === undefined) {
        const err = new RangeError('The value of "max" is out of range.');
        err.code = 'ERR_OUT_OF_RANGE';
        if (callback) { queueMicrotask(() => callback(err)); return; }
        throw err;
    }
    if (callback) {
        queueMicrotask(() => callback(null, result));
        return;
    }
    return result;
}

export function timingSafeEqual(a, b) {
    if (!(a instanceof Uint8Array || ArrayBuffer.isView(a) || a instanceof ArrayBuffer)) {
        const err = new TypeError('The "a" argument must be an instance of Buffer, TypedArray, or DataView.');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (!(b instanceof Uint8Array || ArrayBuffer.isView(b) || b instanceof ArrayBuffer)) {
        const err = new TypeError('The "b" argument must be an instance of Buffer, TypedArray, or DataView.');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    const aBytes = a instanceof Uint8Array ? a : new Uint8Array(a.buffer || a, a.byteOffset || 0, a.byteLength || a.length);
    const bBytes = b instanceof Uint8Array ? b : new Uint8Array(b.buffer || b, b.byteOffset || 0, b.byteLength || b.length);
    const result = webCryptoNative.timing_safe_equal(aBytes, bBytes);
    if (result === null || result === undefined) {
        const err = new RangeError('Input buffers must have the same byte length');
        err.code = 'ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH';
        throw err;
    }
    return result;
}

export function pbkdf2Sync(password, salt, iterations, keylen, digest) {
    const algo = normalizeHashAlgorithm(digest);
    const passwordBytes = toBytes(password);
    const saltBytes = toBytes(salt);
    const result = webCryptoNative.pbkdf2_derive(algo, passwordBytes, saltBytes, iterations, keylen);
    if (result === null || result === undefined) {
        const err = new Error('Invalid digest: ' + digest);
        err.code = 'ERR_CRYPTO_INVALID_DIGEST';
        throw err;
    }
    const buf = new Uint8Array(result);
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    return buf;
}

export function pbkdf2(password, salt, iterations, keylen, digest, callback) {
    try {
        const result = pbkdf2Sync(password, salt, iterations, keylen, digest);
        queueMicrotask(() => callback(null, result));
    } catch (err) {
        queueMicrotask(() => callback(err));
    }
}

export function scryptSync(password, salt, keylen, options) {
    const passwordBytes = toBytes(password);
    const saltBytes = toBytes(salt);
    const N = (options && (options.N || options.cost)) || 16384;
    const r = (options && (options.r || options.blockSize)) || 8;
    const p = (options && (options.p || options.parallelization)) || 1;
    const result = webCryptoNative.scrypt_derive(passwordBytes, saltBytes, N, r, p, keylen);
    if (result === null || result === undefined) {
        const err = new Error('Invalid scrypt parameters');
        err.code = 'ERR_CRYPTO_SCRYPT_INVALID_PARAMETER';
        throw err;
    }
    const buf = new Uint8Array(result);
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    return buf;
}

export function scrypt(password, salt, keylen, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    try {
        const result = scryptSync(password, salt, keylen, options);
        queueMicrotask(() => callback(null, result));
    } catch (err) {
        queueMicrotask(() => callback(err));
    }
}

export function hkdfSync(digest, ikm, salt, info, keylen) {
    const algo = normalizeHashAlgorithm(digest);
    const ikmBytes = toBytes(ikm);
    const saltBytes = toBytes(salt);
    const infoBytes = toBytes(info);
    const result = webCryptoNative.hkdf_derive(algo, ikmBytes, saltBytes, infoBytes, keylen);
    if (result === null || result === undefined) {
        const err = new Error('Invalid digest: ' + digest);
        err.code = 'ERR_CRYPTO_INVALID_DIGEST';
        throw err;
    }
    const buf = new Uint8Array(result);
    return buf.buffer;
}

export function hkdf(digest, ikm, salt, info, keylen, callback) {
    try {
        const result = hkdfSync(digest, ikm, salt, info, keylen);
        queueMicrotask(() => callback(null, result));
    } catch (err) {
        queueMicrotask(() => callback(err));
    }
}

const CIPHER_ALIASES = {
    'aes-128-cbc': 'aes-128-cbc',
    'aes-256-cbc': 'aes-256-cbc',
    'aes-128-ctr': 'aes-128-ctr',
    'aes-256-ctr': 'aes-256-ctr',
    'aes-128-gcm': 'aes-128-gcm',
    'aes-256-gcm': 'aes-256-gcm',
    'chacha20-poly1305': 'chacha20-poly1305',
};

function normalizeCipherAlgorithm(algorithm) {
    if (typeof algorithm !== 'string') {
        const err = new TypeError('The "algorithm" argument must be of type string.');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    const normalized = CIPHER_ALIASES[algorithm.toLowerCase()];
    if (!normalized) {
        const err = new Error('Unknown cipher: ' + algorithm);
        err.code = 'ERR_CRYPTO_UNKNOWN_CIPHER';
        throw err;
    }
    return normalized;
}

class Cipheriv {
    constructor(algorithm, key, iv, options) {
        this._algorithm = normalizeCipherAlgorithm(algorithm);
        const keyBytes = toBytes(key);
        const ivBytes = toBytes(iv);
        const handle = webCryptoNative.cipher_init(this._algorithm, keyBytes, ivBytes, false);
        if (handle === null || handle === undefined) {
            const err = new Error('Invalid key length or IV length for cipher: ' + algorithm);
            err.code = 'ERR_CRYPTO_INVALID_IV';
            throw err;
        }
        this._handle = handle;
        this._finalized = false;
    }

    update(data, inputEncoding, outputEncoding) {
        if (this._finalized) {
            const err = new Error('Attempting to use a finalized cipher');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        const bytes = toBytes(data, inputEncoding);
        const result = webCryptoNative.cipher_update(this._handle, bytes);
        if (result === null || result === undefined) {
            const err = new Error('Cipher update failed');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        const out = new Uint8Array(result);
        return encodeOutput(out, outputEncoding);
    }

    final(outputEncoding) {
        if (this._finalized) {
            const err = new Error('Attempting to use a finalized cipher');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        this._finalized = true;
        const result = webCryptoNative.cipher_final(this._handle);
        if (result === null || result === undefined) {
            const err = new Error('Cipher final failed');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        const out = new Uint8Array(result);
        return encodeOutput(out, outputEncoding);
    }

    setAAD(buffer, options) {
        const bytes = toBytes(buffer);
        const ok = webCryptoNative.cipher_set_aad(this._handle, bytes);
        if (!ok) {
            const err = new Error('setAAD failed: not an AEAD cipher or invalid state');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        return this;
    }

    getAuthTag() {
        const result = webCryptoNative.cipher_get_auth_tag(this._handle);
        if (result === null || result === undefined) {
            const err = new Error('getAuthTag failed: not an AEAD cipher or final not called');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        const buf = new Uint8Array(result);
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        return buf;
    }

    setAutoPadding(autoPadding) {
        webCryptoNative.cipher_set_auto_padding(this._handle, autoPadding !== false);
        return this;
    }
}

export { Cipheriv };

export function createCipheriv(algorithm, key, iv, options) {
    return new Cipheriv(algorithm, key, iv, options);
}

class Decipheriv {
    constructor(algorithm, key, iv, options) {
        this._algorithm = normalizeCipherAlgorithm(algorithm);
        const keyBytes = toBytes(key);
        const ivBytes = toBytes(iv);
        const handle = webCryptoNative.cipher_init(this._algorithm, keyBytes, ivBytes, true);
        if (handle === null || handle === undefined) {
            const err = new Error('Invalid key length or IV length for decipher: ' + algorithm);
            err.code = 'ERR_CRYPTO_INVALID_IV';
            throw err;
        }
        this._handle = handle;
        this._finalized = false;
    }

    update(data, inputEncoding, outputEncoding) {
        if (this._finalized) {
            const err = new Error('Attempting to use a finalized decipher');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        const bytes = toBytes(data, inputEncoding);
        const result = webCryptoNative.cipher_update(this._handle, bytes);
        if (result === null || result === undefined) {
            const err = new Error('Decipher update failed');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        const out = new Uint8Array(result);
        return encodeOutput(out, outputEncoding);
    }

    final(outputEncoding) {
        if (this._finalized) {
            const err = new Error('Attempting to use a finalized decipher');
            err.code = 'ERR_CRYPTO_HASH_FINALIZED';
            throw err;
        }
        this._finalized = true;
        const result = webCryptoNative.cipher_final(this._handle);
        if (result === null || result === undefined) {
            const err = new Error('Decipher final failed (possibly wrong key, IV, or auth tag)');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        const out = new Uint8Array(result);
        return encodeOutput(out, outputEncoding);
    }

    setAAD(buffer, options) {
        const bytes = toBytes(buffer);
        const ok = webCryptoNative.cipher_set_aad(this._handle, bytes);
        if (!ok) {
            const err = new Error('setAAD failed: not an AEAD cipher or invalid state');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        return this;
    }

    setAuthTag(buffer) {
        const bytes = toBytes(buffer);
        const ok = webCryptoNative.cipher_set_auth_tag(this._handle, bytes);
        if (!ok) {
            const err = new Error('setAuthTag failed: not an AEAD decipher or invalid state');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        return this;
    }

    setAutoPadding(autoPadding) {
        webCryptoNative.cipher_set_auto_padding(this._handle, autoPadding !== false);
        return this;
    }
}

export { Decipheriv };

export function createDecipheriv(algorithm, key, iv, options) {
    return new Decipheriv(algorithm, key, iv, options);
}

export function getHashes() {
    return webCryptoNative.get_hashes();
}

export function getCiphers() {
    return webCryptoNative.get_ciphers();
}

export function getCurves() {
    return ['prime256v1', 'secp384r1', 'secp256k1'];
}

export const constants = {
    OPENSSL_VERSION_NUMBER: 0,
    SSL_OP_ALL: 0,
    SSL_OP_ALLOW_NO_DHE_KEX: 0,
    SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION: 0,
    SSL_OP_CIPHER_SERVER_PREFERENCE: 0,
    SSL_OP_CISCO_ANYCONNECT: 0,
    SSL_OP_COOKIE_EXCHANGE: 0,
    SSL_OP_CRYPTOPRO_TLSEXT_BUG: 0,
    SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS: 0,
    SSL_OP_LEGACY_SERVER_CONNECT: 0,
    SSL_OP_NO_COMPRESSION: 0,
    SSL_OP_NO_ENCRYPT_THEN_MAC: 0,
    SSL_OP_NO_QUERY_MTU: 0,
    SSL_OP_NO_RENEGOTIATION: 0,
    SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION: 0,
    SSL_OP_NO_SSLv2: 0,
    SSL_OP_NO_SSLv3: 0,
    SSL_OP_NO_TICKET: 0,
    SSL_OP_NO_TLSv1: 0,
    SSL_OP_NO_TLSv1_1: 0,
    SSL_OP_NO_TLSv1_2: 0,
    SSL_OP_NO_TLSv1_3: 0,
    SSL_OP_PRIORITIZE_CHACHA: 0,
    SSL_OP_TLS_ROLLBACK_BUG: 0,
    ENGINE_METHOD_RSA: 0x0001,
    ENGINE_METHOD_DSA: 0x0002,
    ENGINE_METHOD_DH: 0x0004,
    ENGINE_METHOD_RAND: 0x0008,
    ENGINE_METHOD_EC: 0x0800,
    ENGINE_METHOD_CIPHERS: 0x0040,
    ENGINE_METHOD_DIGESTS: 0x0080,
    ENGINE_METHOD_PKEY_METHS: 0x0200,
    ENGINE_METHOD_PKEY_ASN1_METHS: 0x0400,
    ENGINE_METHOD_ALL: 0xFFFF,
    ENGINE_METHOD_NONE: 0x0000,
    DH_CHECK_P_NOT_SAFE_PRIME: 0x02,
    DH_CHECK_P_NOT_PRIME: 0x01,
    DH_UNABLE_TO_CHECK_GENERATOR: 0x04,
    DH_NOT_SUITABLE_GENERATOR: 0x08,
    RSA_PKCS1_PADDING: 1,
    RSA_SSLV23_PADDING: 2,
    RSA_NO_PADDING: 3,
    RSA_PKCS1_OAEP_PADDING: 4,
    RSA_X931_PADDING: 5,
    RSA_PKCS1_PSS_PADDING: 6,
    RSA_PSS_SALTLEN_DIGEST: -1,
    RSA_PSS_SALTLEN_MAX_SIGN: -2,
    RSA_PSS_SALTLEN_AUTO: -2,
    POINT_CONVERSION_COMPRESSED: 2,
    POINT_CONVERSION_UNCOMPRESSED: 4,
    POINT_CONVERSION_HYBRID: 6,
};

export function getFips() {
    return 0;
}

export function setFips(_val) {
    const err = new Error('Cannot set FIPS mode in a WASM environment');
    err.code = 'ERR_CRYPTO_FIPS_FORCED';
    throw err;
}

export const fips = false;

// ===== KeyObject =====

class KeyObject {
    constructor(handle, type_) {
        this._handle = handle;
        this._type = type_;
    }

    get type() {
        return this._type;
    }

    get asymmetricKeyType() {
        if (this._type === 'secret') return undefined;
        return webCryptoNative.key_asymmetric_type(this._handle);
    }

    export(options) {
        if (!options) options = {};
        if (this._type === 'secret') {
            const raw = webCryptoNative.key_export(this._handle, 'der');
            if (raw === null || raw === undefined) {
                throw new Error('Failed to export secret key');
            }
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(raw);
            }
            return new Uint8Array(raw);
        }
        const format = options.format || (options.type ? 'pem' : 'der');
        const result = webCryptoNative.key_export(this._handle, format);
        if (result === null || result === undefined) {
            throw new Error('Failed to export key');
        }
        if (format === 'pem') {
            const decoder = new TextDecoder();
            return decoder.decode(new Uint8Array(result));
        }
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(result);
        }
        return new Uint8Array(result);
    }
}

export { KeyObject };

export function createPrivateKey(key) {
    if (typeof key === 'string') {
        const handle = webCryptoNative.create_private_key_pem(key);
        if (handle === null || handle === undefined) {
            const err = new Error('Failed to parse private key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(handle, 'private');
    }
    if (key && typeof key === 'object') {
        if (key instanceof KeyObject) {
            if (key.type !== 'private') {
                throw new Error('Cannot create private key from non-private KeyObject');
            }
            return key;
        }
        if (key.key !== undefined) {
            return createPrivateKey(key.key);
        }
        const data = toBytes(key);
        const handle = webCryptoNative.create_private_key_der(data);
        if (handle === null || handle === undefined) {
            const err = new Error('Failed to parse private key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(handle, 'private');
    }
    const err = new TypeError('Invalid key argument');
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
}

export function createPublicKey(key) {
    if (typeof key === 'string') {
        const handle = webCryptoNative.create_public_key_pem(key);
        if (handle === null || handle === undefined) {
            const err = new Error('Failed to parse public key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(handle, 'public');
    }
    if (key && typeof key === 'object') {
        if (key instanceof KeyObject) {
            if (key.type === 'private') {
                const pubHandle = webCryptoNative.create_public_key_from_private_key(key._handle);
                if (pubHandle === null || pubHandle === undefined) {
                    throw new Error('Failed to derive public key from private key');
                }
                return new KeyObject(pubHandle, 'public');
            }
            if (key.type === 'public') return key;
            throw new Error('Cannot create public key from secret KeyObject');
        }
        if (key.key !== undefined) {
            if (key.key instanceof KeyObject && key.key.type === 'private') {
                const pubHandle = webCryptoNative.create_public_key_from_private_key(key.key._handle);
                if (pubHandle === null || pubHandle === undefined) {
                    throw new Error('Failed to derive public key from private key');
                }
                return new KeyObject(pubHandle, 'public');
            }
            return createPublicKey(key.key);
        }
        const data = toBytes(key);
        const handle = webCryptoNative.create_public_key_der(data);
        if (handle === null || handle === undefined) {
            const err = new Error('Failed to parse public key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(handle, 'public');
    }
    const err = new TypeError('Invalid key argument');
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
}

export function createSecretKey(key, encoding) {
    const data = toBytes(key, encoding);
    const handle = webCryptoNative.create_secret_key_native(data);
    return new KeyObject(handle, 'secret');
}

export function generateKeyPairSync(type_, options) {
    options = options || {};
    let namedCurve = null;
    let algorithm = type_;
    if (type_ === 'ec') {
        namedCurve = options.namedCurve || options.curve;
        if (!namedCurve) {
            const err = new Error('namedCurve is required for EC key generation');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
    } else if (type_ === 'ed25519') {
        algorithm = 'ed25519';
    } else {
        const err = new Error('Unsupported key type: ' + type_);
        err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
        throw err;
    }

    const result = webCryptoNative.generate_key_pair(algorithm, namedCurve);
    if (result === null || result === undefined) {
        const err = new Error('Key generation failed');
        err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
        throw err;
    }

    const privateKey = new KeyObject(result[0], 'private');
    const publicKey = new KeyObject(result[1], 'public');

    const pubFormat = options.publicKeyEncoding;
    const privFormat = options.privateKeyEncoding;

    let pub_ = publicKey;
    let priv_ = privateKey;

    if (pubFormat) {
        pub_ = publicKey.export(pubFormat);
    }
    if (privFormat) {
        priv_ = privateKey.export(privFormat);
    }

    return { publicKey: pub_, privateKey: priv_ };
}

export function generateKeyPair(type_, options, callback) {
    try {
        const result = generateKeyPairSync(type_, options);
        queueMicrotask(() => callback(null, result.publicKey, result.privateKey));
    } catch (err) {
        queueMicrotask(() => callback(err));
    }
}

// ===== Sign / Verify classes =====

class Sign {
    constructor(algorithm, options) {
        this._algorithm = algorithm ? algorithm.toLowerCase() : null;
        this._keySet = false;
        this._handle = null;
        this._algorithmNormalized = this._algorithm ? normalizeHashForSign(this._algorithm) : null;
    }

    update(data, inputEncoding) {
        if (this._handle !== null) {
            const bytes = toBytes(data, inputEncoding);
            webCryptoNative.sign_update(this._handle, bytes);
        } else {
            if (!this._pendingData) this._pendingData = [];
            this._pendingData.push({ data, inputEncoding });
        }
        return this;
    }

    sign(privateKey, outputEncoding) {
        let keyObj;
        if (privateKey instanceof KeyObject) {
            keyObj = privateKey;
        } else if (typeof privateKey === 'object' && privateKey !== null && privateKey.key !== undefined) {
            keyObj = privateKey.key instanceof KeyObject ? privateKey.key : createPrivateKey(privateKey.key);
        } else {
            keyObj = createPrivateKey(privateKey);
        }

        if (this._handle === null) {
            const handle = webCryptoNative.sign_init(this._algorithmNormalized, keyObj._handle);
            if (handle === null || handle === undefined) {
                const err = new Error('Sign init failed');
                err.code = 'ERR_CRYPTO_SIGN_KEY_REQUIRED';
                throw err;
            }
            this._handle = handle;
            if (this._pendingData) {
                for (const { data, inputEncoding } of this._pendingData) {
                    const bytes = toBytes(data, inputEncoding);
                    webCryptoNative.sign_update(this._handle, bytes);
                }
                this._pendingData = null;
            }
        }

        const result = webCryptoNative.sign_final_native(this._handle);
        this._handle = null;
        if (result === null || result === undefined) {
            const err = new Error('Sign failed');
            err.code = 'ERR_CRYPTO_SIGN_KEY_REQUIRED';
            throw err;
        }
        const sig = new Uint8Array(result);
        return encodeOutput(sig, outputEncoding);
    }
}

export { Sign };

export function createSign(algorithm) {
    return new Sign(algorithm);
}

class Verify {
    constructor(algorithm, options) {
        this._algorithm = algorithm ? algorithm.toLowerCase() : null;
        this._handle = null;
        this._algorithmNormalized = this._algorithm ? normalizeHashForSign(this._algorithm) : null;
    }

    update(data, inputEncoding) {
        if (this._handle !== null) {
            const bytes = toBytes(data, inputEncoding);
            webCryptoNative.verify_update(this._handle, bytes);
        } else {
            if (!this._pendingData) this._pendingData = [];
            this._pendingData.push({ data, inputEncoding });
        }
        return this;
    }

    verify(publicKey, signature, signatureEncoding) {
        let keyObj;
        if (publicKey instanceof KeyObject) {
            keyObj = publicKey;
        } else if (typeof publicKey === 'object' && publicKey !== null && publicKey.key !== undefined) {
            keyObj = publicKey.key instanceof KeyObject ? publicKey.key : createPublicKey(publicKey.key);
        } else {
            keyObj = createPublicKey(publicKey);
        }

        if (this._handle === null) {
            const handle = webCryptoNative.verify_init(this._algorithmNormalized, keyObj._handle);
            if (handle === null || handle === undefined) {
                const err = new Error('Verify init failed');
                err.code = 'ERR_CRYPTO_SIGN_KEY_REQUIRED';
                throw err;
            }
            this._handle = handle;
            if (this._pendingData) {
                for (const { data, inputEncoding } of this._pendingData) {
                    const bytes = toBytes(data, inputEncoding);
                    webCryptoNative.verify_update(this._handle, bytes);
                }
                this._pendingData = null;
            }
        }

        const sigBytes = toBytes(signature, signatureEncoding);
        const result = webCryptoNative.verify_final_native(this._handle, sigBytes);
        this._handle = null;
        if (result === null || result === undefined) {
            return false;
        }
        return result;
    }
}

export { Verify };

export function createVerify(algorithm) {
    return new Verify(algorithm);
}

function normalizeHashForSign(algorithm) {
    if (!algorithm) return null;
    const lower = algorithm.toLowerCase();
    const mapped = HASH_ALIASES[lower];
    if (mapped) return mapped;
    return lower;
}

class SubtleCrypto {
    async digest(algorithm, data) {
        let algoName;
        if (typeof algorithm === 'string') {
            algoName = algorithm;
        } else if (algorithm && typeof algorithm === 'object') {
            algoName = algorithm.name;
        } else {
            throw new TypeError('Algorithm must be a string or an object with a name property');
        }
        const normalized = normalizeHashAlgorithm(algoName);
        const bytes = toBytes(data);
        const hashBytes = webCryptoNative.hash_one_shot(normalized, bytes);
        return new Uint8Array(hashBytes).buffer;
    }

    async generateKey(algorithm, extractable, keyUsages) {
        let algoName;
        if (typeof algorithm === 'string') {
            algoName = algorithm;
        } else if (algorithm && typeof algorithm === 'object') {
            algoName = algorithm.name;
        } else {
            throw new TypeError('Algorithm must be a string or an object with a name property');
        }

        const name = algoName.toUpperCase();
        if (name === 'ED25519') {
            const { publicKey, privateKey } = generateKeyPairSync('ed25519');
            return {
                publicKey: new CryptoKey('public', { name: 'Ed25519' }, extractable, keyUsages.filter(u => u === 'verify'), publicKey),
                privateKey: new CryptoKey('private', { name: 'Ed25519' }, extractable, keyUsages.filter(u => u === 'sign'), privateKey),
            };
        } else if (name === 'ECDSA') {
            const curve = algorithm.namedCurve || 'P-256';
            const curveMap = { 'P-256': 'prime256v1', 'P-384': 'secp384r1', 'P-256K': 'secp256k1' };
            const nativeCurve = curveMap[curve] || curve;
            const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: nativeCurve });
            return {
                publicKey: new CryptoKey('public', { name: 'ECDSA', namedCurve: curve }, extractable, keyUsages.filter(u => u === 'verify'), publicKey),
                privateKey: new CryptoKey('private', { name: 'ECDSA', namedCurve: curve }, extractable, keyUsages.filter(u => u === 'sign'), privateKey),
            };
        } else if (name === 'HMAC') {
            const hashAlgo = algorithm.hash;
            const hashName = typeof hashAlgo === 'string' ? hashAlgo : hashAlgo.name;
            const length = algorithm.length || 256;
            const keyBytes = randomBytes(length / 8);
            const secretKey = createSecretKey(keyBytes);
            return new CryptoKey('secret', { name: 'HMAC', hash: { name: hashName }, length }, extractable, keyUsages, secretKey);
        }
        throw new Error('Unsupported algorithm: ' + algoName);
    }

    async sign(algorithm, key, data) {
        let algoName;
        if (typeof algorithm === 'string') {
            algoName = algorithm;
        } else if (algorithm && typeof algorithm === 'object') {
            algoName = algorithm.name;
        } else {
            throw new TypeError('Algorithm must be a string or an object with a name property');
        }

        const name = algoName.toUpperCase();
        const bytes = toBytes(data);

        if (name === 'ED25519') {
            const sign = createSign(null);
            sign.update(bytes);
            const sig = sign.sign(key._keyObject);
            return (sig instanceof Uint8Array ? sig : new Uint8Array(sig)).buffer;
        } else if (name === 'ECDSA') {
            const hashAlgo = algorithm.hash;
            const hashName = typeof hashAlgo === 'string' ? hashAlgo : hashAlgo.name;
            const normalized = normalizeHashAlgorithm(hashName);
            const sign = createSign(normalized);
            sign.update(bytes);
            const sig = sign.sign(key._keyObject);
            return (sig instanceof Uint8Array ? sig : new Uint8Array(sig)).buffer;
        } else if (name === 'HMAC') {
            const hashAlgo = key._algorithm.hash;
            const hashName = typeof hashAlgo === 'string' ? hashAlgo : hashAlgo.name;
            const normalized = normalizeHashAlgorithm(hashName);
            const hmac = createHmac(normalized, key._keyObject.export());
            hmac.update(bytes);
            const result = hmac.digest();
            return (result instanceof Uint8Array ? result : new Uint8Array(result)).buffer;
        }
        throw new Error('Unsupported algorithm: ' + algoName);
    }

    async verify(algorithm, key, signature, data) {
        let algoName;
        if (typeof algorithm === 'string') {
            algoName = algorithm;
        } else if (algorithm && typeof algorithm === 'object') {
            algoName = algorithm.name;
        } else {
            throw new TypeError('Algorithm must be a string or an object with a name property');
        }

        const name = algoName.toUpperCase();
        const dataBytes = toBytes(data);
        const sigBytes = toBytes(signature);

        if (name === 'ED25519') {
            const verify = createVerify(null);
            verify.update(dataBytes);
            return verify.verify(key._keyObject, sigBytes);
        } else if (name === 'ECDSA') {
            const hashAlgo = algorithm.hash;
            const hashName = typeof hashAlgo === 'string' ? hashAlgo : hashAlgo.name;
            const normalized = normalizeHashAlgorithm(hashName);
            const verify = createVerify(normalized);
            verify.update(dataBytes);
            return verify.verify(key._keyObject, sigBytes);
        } else if (name === 'HMAC') {
            const hashAlgo = key._algorithm.hash;
            const hashName = typeof hashAlgo === 'string' ? hashAlgo : hashAlgo.name;
            const normalized = normalizeHashAlgorithm(hashName);
            const hmac = createHmac(normalized, key._keyObject.export());
            hmac.update(dataBytes);
            const expected = hmac.digest();
            const expectedBytes = expected instanceof Uint8Array ? expected : new Uint8Array(expected);
            if (sigBytes.length !== expectedBytes.length) return false;
            const result = webCryptoNative.timing_safe_equal(sigBytes, expectedBytes);
            return result === true;
        }
        throw new Error('Unsupported algorithm: ' + algoName);
    }

    async importKey(format, keyData, algorithm, extractable, keyUsages) {
        let algoName;
        if (typeof algorithm === 'string') {
            algoName = algorithm;
        } else if (algorithm && typeof algorithm === 'object') {
            algoName = algorithm.name;
        } else {
            throw new TypeError('Algorithm must be a string or an object with a name property');
        }

        const name = algoName.toUpperCase();

        if (format === 'raw') {
            if (name === 'HMAC') {
                const hashAlgo = algorithm.hash;
                const hashName = typeof hashAlgo === 'string' ? hashAlgo : hashAlgo.name;
                const data = toBytes(keyData);
                const secretKey = createSecretKey(data);
                return new CryptoKey('secret', { name: 'HMAC', hash: { name: hashName }, length: data.length * 8 }, extractable, keyUsages, secretKey);
            }
        }
        throw new Error('Unsupported import format/algorithm: ' + format + '/' + algoName);
    }

    async exportKey(format, key) {
        if (format === 'raw') {
            if (key._type === 'secret') {
                const exported = key._keyObject.export();
                return (exported instanceof Uint8Array ? exported : new Uint8Array(exported)).buffer;
            }
        }
        throw new Error('Unsupported export format: ' + format);
    }
}

class CryptoKey {
    constructor(type_, algorithm, extractable, usages, keyObject) {
        this._type = type_;
        this._algorithm = algorithm;
        this._extractable = extractable;
        this._usages = usages;
        this._keyObject = keyObject;
    }

    get type() { return this._type; }
    get algorithm() { return this._algorithm; }
    get extractable() { return this._extractable; }
    get usages() { return this._usages; }
}

const subtleCrypto = new SubtleCrypto();
export { subtleCrypto as subtle };
export const webcrypto = { getRandomValues, subtle: subtleCrypto, CryptoKey };
