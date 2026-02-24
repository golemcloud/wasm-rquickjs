import * as webCryptoNative from '__wasm_rquickjs_builtin/web_crypto_native'
import Transform from '__wasm_rquickjs_builtin/internal/streams/transform'

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

function Hash(algorithm, options) {
    if (!(this instanceof Hash)) return new Hash(algorithm, options);
    this._algorithm = normalizeHashAlgorithm(algorithm);
    const handle = webCryptoNative.hash_init(this._algorithm);
    if (handle === null || handle === undefined) {
        const err = new Error('Digest method not supported: ' + algorithm);
        err.code = 'ERR_CRYPTO_INVALID_DIGEST';
        throw err;
    }
    this._handle = handle;
    this._finalized = false;
    Transform.call(this, options);
}

Object.setPrototypeOf(Hash.prototype, Transform.prototype);
Object.setPrototypeOf(Hash, Transform);

Hash.prototype._transform = function(chunk, encoding, callback) {
    try {
        this.update(chunk, encoding);
        callback(null);
    } catch (e) {
        callback(e);
    }
};

Hash.prototype._flush = function(callback) {
    if (this._finalized) return callback(null);
    try {
        callback(null, this.digest());
    } catch (e) {
        callback(e);
    }
};

Hash.prototype.update = function(data, inputEncoding) {
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
};

Hash.prototype.digest = function(encoding) {
    if (this._finalized) {
        const err = new Error('Digest already called');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    this._finalized = true;
    const hashBytes = webCryptoNative.hash_final(this._handle);
    const result = new Uint8Array(hashBytes);
    return encodeOutput(result, encoding);
};

Hash.prototype.copy = function(options) {
    if (this._finalized) {
        const err = new Error('Digest already called');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    const newHash = new Hash(this._algorithm, options);
    newHash._handle = webCryptoNative.hash_copy(this._handle);
    newHash._finalized = false;
    return newHash;
};

export { Hash };

export function createHash(algorithm, options) {
    return new Hash(algorithm, options);
}

function Hmac(algorithm, key, options) {
    if (!(this instanceof Hmac)) return new Hmac(algorithm, key, options);
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
    Transform.call(this, options);
}

Object.setPrototypeOf(Hmac.prototype, Transform.prototype);
Object.setPrototypeOf(Hmac, Transform);

Hmac.prototype._transform = Hash.prototype._transform;
Hmac.prototype._flush = Hash.prototype._flush;

Hmac.prototype.update = function(data, inputEncoding) {
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
};

Hmac.prototype.digest = function(encoding) {
    if (this._finalized) {
        const err = new Error('Digest already called');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    this._finalized = true;
    const hmacBytes = webCryptoNative.hmac_final(this._handle);
    const result = new Uint8Array(hmacBytes);
    return encodeOutput(result, encoding);
};

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
export function randomUUID(options) {
    if (options !== undefined) {
        if (typeof options !== 'object' || options === null) {
            const err = new TypeError('The "options" argument must be of type object.');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        if (options.disableEntropyCache !== undefined && typeof options.disableEntropyCache !== 'boolean') {
            const err = new TypeError('The "options.disableEntropyCache" property must be of type boolean.');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
    }
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

const MAX_SPKAC_SIZE = 0x7FFFFFFF;

function toSpkacBytes(spkac, encoding) {
    const bytes = toBytes(spkac, encoding === 'buffer' ? 'utf8' : encoding);
    if (bytes.length > MAX_SPKAC_SIZE) {
        const err = new RangeError('spkac is too large');
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
    return bytes;
}

function asBuffer(value) {
    const bytes = new Uint8Array(value);
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    return bytes;
}

function certificateVerifySpkac(spkac, encoding) {
    const bytes = toSpkacBytes(spkac, encoding);
    if (bytes.length === 0) {
        return '';
    }
    const verified = webCryptoNative.certificate_verify_spkac(bytes);
    return verified === null || verified === undefined ? false : verified;
}

function certificateExportPublicKey(spkac, encoding) {
    const bytes = toSpkacBytes(spkac, encoding);
    if (bytes.length === 0) {
        return '';
    }
    const result = webCryptoNative.certificate_export_public_key(bytes);
    if (result === null || result === undefined) {
        return '';
    }
    return asBuffer(result);
}

function certificateExportChallenge(spkac, encoding) {
    const bytes = toSpkacBytes(spkac, encoding);
    if (bytes.length === 0) {
        return '';
    }
    const result = webCryptoNative.certificate_export_challenge(bytes);
    if (result === null || result === undefined) {
        return '';
    }
    return asBuffer(result);
}

export function Certificate() {
    if (!new.target) {
        return new Certificate();
    }
}

Certificate.verifySpkac = certificateVerifySpkac;
Certificate.exportPublicKey = certificateExportPublicKey;
Certificate.exportChallenge = certificateExportChallenge;
Certificate.prototype.verifySpkac = certificateVerifySpkac;
Certificate.prototype.exportPublicKey = certificateExportPublicKey;
Certificate.prototype.exportChallenge = certificateExportChallenge;

const CIPHER_ALIASES = {
    'aes-128-cbc': 'aes-128-cbc',
    'aes-256-cbc': 'aes-256-cbc',
    'aes-128-ecb': 'aes-128-ecb',
    'aes-256-ecb': 'aes-256-ecb',
    'bf-ecb': 'bf-ecb',
    'aes-128-ctr': 'aes-128-ctr',
    'aes-256-ctr': 'aes-256-ctr',
    'aes-128-ccm': 'aes-128-ccm',
    'aes-256-ccm': 'aes-256-ccm',
    'aes-128-gcm': 'aes-128-gcm',
    'aes-256-gcm': 'aes-256-gcm',
    'aes-128-ocb': 'aes-128-ocb',
    'aes-256-ocb': 'aes-256-ocb',
    'aes-128-wrap': 'aes-128-wrap',
    'aes-192-wrap': 'aes-192-wrap',
    'aes-256-wrap': 'aes-256-wrap',
    'aes128-wrap': 'aes-128-wrap',
    'aes192-wrap': 'aes-192-wrap',
    'aes256-wrap': 'aes-256-wrap',
    'id-aes128-wrap': 'id-aes128-wrap',
    'id-aes192-wrap': 'id-aes192-wrap',
    'id-aes256-wrap': 'id-aes256-wrap',
    'id-aes128-wrap-pad': 'id-aes128-wrap-pad',
    'id-aes192-wrap-pad': 'id-aes192-wrap-pad',
    'id-aes256-wrap-pad': 'id-aes256-wrap-pad',
    'des-ede3-cbc': 'des-ede3-cbc',
    'des3': 'des-ede3-cbc',
    'des3-wrap': 'des3-wrap',
    'id-smime-alg-cms3deswrap': 'des3-wrap',
    'chacha20-poly1305': 'chacha20-poly1305',
    'aes256': 'aes-256-cbc',
    'aes-256': 'aes-256-cbc',
    'aes128': 'aes-128-cbc',
    'aes-128': 'aes-128-cbc',
};

function normalizeCipherAlgorithm(algorithm) {
    if (typeof algorithm !== 'string') {
        const received = algorithm === null ? 'null' : typeof algorithm;
        const err = new TypeError(`The "cipher" argument must be of type string. Received ${received}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    const normalized = CIPHER_ALIASES[algorithm.toLowerCase()];
    if (!normalized) {
        const err = new Error('Unknown cipher');
        err.code = 'ERR_CRYPTO_UNKNOWN_CIPHER';
        throw err;
    }
    return normalized;
}

function getAeadMode(algorithm) {
    if (algorithm === 'chacha20-poly1305') return 'chacha20-poly1305';
    if (algorithm.endsWith('-gcm')) return 'gcm';
    if (algorithm.endsWith('-ccm')) return 'ccm';
    if (algorithm.endsWith('-ocb')) return 'ocb';
    return null;
}

function resolveNativeCipherAlgorithm(algorithm) {
    if (algorithm === 'aes-128-ccm' || algorithm === 'aes-128-ocb') return 'aes-128-gcm';
    if (algorithm === 'aes-256-ccm' || algorithm === 'aes-256-ocb') return 'aes-256-gcm';
    return algorithm;
}

function throwInvalidArgValue(property, value) {
    const err = new TypeError(`The property '${property}' is invalid. Received ${String(value)}`);
    err.code = 'ERR_INVALID_ARG_VALUE';
    throw err;
}

function getUIntOption(options, key) {
    let value;
    if (options && (value = options[key]) != null) {
        if ((value >>> 0) !== value) {
            throwInvalidArgValue(`options.${key}`, value);
        }
        return value;
    }
    return undefined;
}

function throwInvalidAuthTagLength(length) {
    const err = new TypeError(`Invalid authentication tag length: ${length}`);
    err.code = 'ERR_CRYPTO_INVALID_AUTH_TAG';
    throw err;
}

function throwAuthTagLengthRequired(algorithm) {
    const err = new TypeError(`authTagLength required for ${algorithm}`);
    err.code = 'ERR_CRYPTO_INVALID_AUTH_TAG';
    throw err;
}

function throwInvalidIV() {
    const err = new TypeError('Invalid initialization vector');
    err.code = 'ERR_CRYPTO_INVALID_IV';
    throw err;
}

function throwInvalidKeyLength() {
    const err = new RangeError('Invalid key length');
    err.code = 'ERR_CRYPTO_INVALID_KEYLEN';
    throw err;
}

function normalizeCipherIv(iv) {
    if (iv === undefined) {
        const err = new TypeError('The "iv" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received undefined');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (iv === null) {
        return new Uint8Array(0);
    }
    return toBytes(iv);
}

function getCipherValidationInfo(algorithm) {
    return CIPHER_INFO[algorithm] || CIPHER_INFO[resolveNativeCipherAlgorithm(algorithm)];
}

function isPkcsBlockCipherMode(algorithm) {
    const info = getCipherValidationInfo(algorithm);
    return !!info && (info.mode === 'cbc' || info.mode === 'ecb');
}

function createLegacyOpenSslError(message, code, reason, fnName) {
    const err = new Error(message);
    err.code = code;
    err.library = 'digital envelope routines';
    err.reason = reason;
    if (fnName) {
        err.function = fnName;
    }
    return err;
}

function createWrongFinalBlockLengthError() {
    return createLegacyOpenSslError(
        'error:0606506D:digital envelope routines:EVP_DecryptFinal_ex:wrong final block length',
        'ERR_OSSL_EVP_WRONG_FINAL_BLOCK_LENGTH',
        'wrong final block length',
        'EVP_DecryptFinal_ex'
    );
}

function createBadDecryptError() {
    return createLegacyOpenSslError(
        'error:06065064:digital envelope routines:EVP_DecryptFinal_ex:bad decrypt',
        'ERR_OSSL_EVP_BAD_DECRYPT',
        'bad decrypt',
        'EVP_DecryptFinal_ex'
    );
}

function createDataNotMultipleOfBlockLengthError() {
    return createLegacyOpenSslError(
        'error:0607F08A:digital envelope routines:EVP_EncryptFinal_ex:data not multiple of block length',
        'ERR_OSSL_EVP_DATA_NOT_MULTIPLE_OF_BLOCK_LENGTH',
        'data not multiple of block length',
        'EVP_EncryptFinal_ex'
    );
}

function validateCipherKeyLength(algorithm, keyBytes) {
    const info = getCipherValidationInfo(algorithm);
    if (info && info.keyLength !== undefined && keyBytes.length !== info.keyLength) {
        throwInvalidKeyLength();
    }
}

function validateCipherIvLength(algorithm, mode, ivBytes) {
    if (mode === 'ccm') {
        if (ivBytes.length < 7 || ivBytes.length > 13) {
            throwInvalidIV();
        }
        return;
    }
    if (mode === 'gcm') {
        if (ivBytes.length === 0) {
            throwInvalidIV();
        }
        return;
    }
    if (mode === 'chacha20-poly1305') {
        if (ivBytes.length === 0 || ivBytes.length > 12) {
            throwInvalidIV();
        }
        return;
    }

    const info = getCipherValidationInfo(algorithm);
    if (!info || info.ivLength === undefined) {
        return;
    }
    if (info.mode === 'ecb') {
        if (ivBytes.length !== 0) {
            throwInvalidIV();
        }
        return;
    }
    if (ivBytes.length !== info.ivLength) {
        throwInvalidIV();
    }
}

function isValidGcmAuthTagLength(length) {
    return length === 4 || length === 8 || (length >= 12 && length <= 16);
}

function isValidCcmAuthTagLength(length) {
    return length >= 4 && length <= 16 && length % 2 === 0;
}

function isValidChachaAuthTagLength(length) {
    return length >= 1 && length <= 16;
}

function computeCcmMaxMessageSize(ivLength) {
    const exponent = 8 * (15 - ivLength);
    if (exponent >= 53) {
        return Number.MAX_SAFE_INTEGER;
    }
    return (2 ** exponent) - 1;
}

function parseAeadOptions(algorithm, options) {
    const mode = getAeadMode(algorithm);
    const authTagLengthOption = getUIntOption(options, 'authTagLength');
    const hasAuthTagLength = authTagLengthOption !== undefined;
    let authTagLength = authTagLengthOption;

    if (mode === 'ccm' || mode === 'ocb') {
        if (!hasAuthTagLength) {
            throwAuthTagLengthRequired(algorithm);
        }
    }

    if (mode === 'gcm') {
        if (authTagLength === undefined) authTagLength = 16;
        if (!isValidGcmAuthTagLength(authTagLength)) {
            throwInvalidAuthTagLength(authTagLength);
        }
    } else if (mode === 'ccm') {
        if (!isValidCcmAuthTagLength(authTagLength)) {
            throwInvalidAuthTagLength(authTagLength);
        }
    } else if (mode === 'ocb') {
        if (!isValidChachaAuthTagLength(authTagLength)) {
            throwInvalidAuthTagLength(authTagLength);
        }
    } else if (mode === 'chacha20-poly1305') {
        if (authTagLength === undefined) authTagLength = 16;
        if (!isValidChachaAuthTagLength(authTagLength)) {
            throwInvalidAuthTagLength(authTagLength);
        }
    }

    return {
        mode,
        authTagLength,
        hasAuthTagLength,
    };
}

function Cipheriv(algorithm, key, iv, options) {
    if (!(this instanceof Cipheriv)) return new Cipheriv(algorithm, key, iv, options);
    this._algorithm = normalizeCipherAlgorithm(algorithm);
    this._aeadConfig = parseAeadOptions(this._algorithm, options);
    this._authTagLength = this._aeadConfig.authTagLength;
    this._authTagLengthExplicit = this._aeadConfig.hasAuthTagLength;
    this._isCcmMode = this._aeadConfig.mode === 'ccm';
    this._hasUpdate = false;
    this._totalInputLength = 0;
    this._ccmPlaintextLength = undefined;
    const keyBytes = toBytes(key);
    const ivBytes = normalizeCipherIv(iv);

    validateCipherKeyLength(this._algorithm, keyBytes);
    validateCipherIvLength(this._algorithm, this._aeadConfig.mode, ivBytes);

    if (this._isCcmMode) {
        this._ccmMaxMessageSize = computeCcmMaxMessageSize(ivBytes.length);
    } else {
        this._ccmMaxMessageSize = undefined;
    }

    const nativeAlgorithm = resolveNativeCipherAlgorithm(this._algorithm);
    const handle = webCryptoNative.cipher_init(nativeAlgorithm, keyBytes, ivBytes, false);
    if (handle === null || handle === undefined) {
        throwInvalidIV();
    }
    this._handle = handle;
    this._finalized = false;
    this._autoPadding = true;
    this._decoder = null;
    Transform.call(this, options);
}

Object.setPrototypeOf(Cipheriv.prototype, Transform.prototype);
Object.setPrototypeOf(Cipheriv, Transform);

Cipheriv.prototype._transform = function(chunk, encoding, callback) {
    try {
        const out = this.update(chunk, encoding);
        if (out && out.length > 0) {
            callback(null, out);
        } else {
            callback(null);
        }
    } catch (e) {
        callback(e);
    }
};

Cipheriv.prototype._flush = function(callback) {
    if (this._finalized) return callback(null);
    try {
        const out = this.final();
        if (out && out.length > 0) {
            callback(null, out);
        } else {
            callback(null);
        }
    } catch (e) {
        callback(e);
    }
};

Cipheriv.prototype.update = function(data, inputEncoding, outputEncoding) {
    if (this._finalized) {
        const err = new Error('Attempting to use a finalized cipher');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    const bytes = toBytes(data, inputEncoding);
    if (this._isCcmMode) {
        if (this._totalInputLength + bytes.length > this._ccmMaxMessageSize) {
            throw new RangeError('Invalid message length');
        }
        if (this._ccmPlaintextLength !== undefined &&
            this._totalInputLength + bytes.length > this._ccmPlaintextLength) {
            throw new RangeError('Invalid message length');
        }
    }
    this._totalInputLength += bytes.length;
    this._hasUpdate = true;
    const result = webCryptoNative.cipher_update(this._handle, bytes);
    if (result === null || result === undefined) {
        const err = new Error('Cipher update failed');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    const out = new Uint8Array(result);
    return encodeOutput(out, outputEncoding);
};

Cipheriv.prototype.final = function(outputEncoding) {
    if (this._finalized) {
        const err = new Error('Attempting to use a finalized cipher');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    if (this._isCcmMode && !this._hasUpdate) {
        const err = new Error('Unsupported state or unable to authenticate data');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    this._finalized = true;
    const result = webCryptoNative.cipher_final(this._handle);
    if (result === null || result === undefined) {
        if (isPkcsBlockCipherMode(this._algorithm) && this._autoPadding === false) {
            throw createDataNotMultipleOfBlockLengthError();
        }
        const err = new Error('Cipher final failed');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    const out = new Uint8Array(result);
    return encodeOutput(out, outputEncoding);
};

Cipheriv.prototype.setAAD = function(buffer, options) {
    const bytes = toBytes(buffer);
    if (this._isCcmMode) {
        const plaintextLength = getUIntOption(options, 'plaintextLength');
        if (plaintextLength === undefined) {
            const err = new Error('options.plaintextLength required for CCM mode with AAD');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        if (plaintextLength > this._ccmMaxMessageSize) {
            throw new RangeError('Invalid message length');
        }
        this._ccmPlaintextLength = plaintextLength;
    }
    const ok = webCryptoNative.cipher_set_aad(this._handle, bytes);
    if (!ok) {
        const err = new Error('setAAD failed: not an AEAD cipher or invalid state');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    return this;
};

Cipheriv.prototype.getAuthTag = function() {
    const result = webCryptoNative.cipher_get_auth_tag(this._handle);
    if (result === null || result === undefined) {
        const err = new Error('Invalid state for operation getAuthTag');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    const buf = new Uint8Array(result);
    const out = (this._authTagLength !== undefined) ? buf.slice(0, this._authTagLength) : buf;
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(out.buffer, out.byteOffset, out.byteLength);
    }
    return out;
};

Cipheriv.prototype.setAutoPadding = function(autoPadding) {
    this._autoPadding = autoPadding !== false;
    webCryptoNative.cipher_set_auto_padding(this._handle, this._autoPadding);
    return this;
};

export { Cipheriv };

export function createCipheriv(algorithm, key, iv, options) {
    return new Cipheriv(algorithm, key, iv, options);
}

function validateDecipherAuthTagLength(decipher, actualLength) {
    const mode = decipher._aeadConfig.mode;
    if (mode === 'gcm') {
        if (decipher._authTagLengthExplicit) {
            if (actualLength !== decipher._authTagLength) {
                throwInvalidAuthTagLength(actualLength);
            }
        } else if (!isValidGcmAuthTagLength(actualLength)) {
            throwInvalidAuthTagLength(actualLength);
        }
        return;
    }

    if (mode === 'chacha20-poly1305' || mode === 'ccm' || mode === 'ocb') {
        if (actualLength !== decipher._authTagLength) {
            throwInvalidAuthTagLength(actualLength);
        }
    }
}

function Decipheriv(algorithm, key, iv, options) {
    if (!(this instanceof Decipheriv)) return new Decipheriv(algorithm, key, iv, options);
    this._algorithm = normalizeCipherAlgorithm(algorithm);
    this._aeadConfig = parseAeadOptions(this._algorithm, options);
    this._authTagLength = this._aeadConfig.authTagLength;
    this._authTagLengthExplicit = this._aeadConfig.hasAuthTagLength;
    this._isCcmMode = this._aeadConfig.mode === 'ccm';
    this._hasUpdate = false;
    this._totalInputLength = 0;
    this._ccmPlaintextLength = undefined;
    this._authTagWasSet = false;
    const keyBytes = toBytes(key);
    const ivBytes = normalizeCipherIv(iv);

    validateCipherKeyLength(this._algorithm, keyBytes);
    validateCipherIvLength(this._algorithm, this._aeadConfig.mode, ivBytes);

    if (this._isCcmMode) {
        this._ccmMaxMessageSize = computeCcmMaxMessageSize(ivBytes.length);
    } else {
        this._ccmMaxMessageSize = undefined;
    }

    const nativeAlgorithm = resolveNativeCipherAlgorithm(this._algorithm);
    const handle = webCryptoNative.cipher_init(nativeAlgorithm, keyBytes, ivBytes, true);
    if (handle === null || handle === undefined) {
        throwInvalidIV();
    }
    this._handle = handle;
    this._finalized = false;
    this._autoPadding = true;
    this._decoder = null;
    Transform.call(this, options);
}

Object.setPrototypeOf(Decipheriv.prototype, Transform.prototype);
Object.setPrototypeOf(Decipheriv, Transform);

Decipheriv.prototype._transform = Cipheriv.prototype._transform;
Decipheriv.prototype._flush = Cipheriv.prototype._flush;

Decipheriv.prototype.update = function(data, inputEncoding, outputEncoding) {
    if (this._finalized) {
        const err = new Error('Attempting to use a finalized decipher');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    const bytes = toBytes(data, inputEncoding);
    if (this._isCcmMode) {
        if (this._totalInputLength + bytes.length > this._ccmMaxMessageSize) {
            throw new RangeError('Invalid message length');
        }
    }
    this._totalInputLength += bytes.length;
    this._hasUpdate = true;
    const result = webCryptoNative.cipher_update(this._handle, bytes);
    if (result === null || result === undefined) {
        const err = new Error('Decipher update failed');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    const out = new Uint8Array(result);
    return encodeOutput(out, outputEncoding);
};

Decipheriv.prototype.final = function(outputEncoding) {
    if (this._finalized) {
        const err = new Error('Attempting to use a finalized decipher');
        err.code = 'ERR_CRYPTO_HASH_FINALIZED';
        throw err;
    }
    this._finalized = true;
    const result = webCryptoNative.cipher_final(this._handle);
    if (result === null || result === undefined) {
        const isMissingTag =
            (this._aeadConfig.mode === 'chacha20-poly1305' || this._aeadConfig.mode === 'ccm') &&
            !this._authTagWasSet;
        if (!isMissingTag && isPkcsBlockCipherMode(this._algorithm)) {
            const info = getCipherValidationInfo(this._algorithm);
            const blockSize = info && info.blockSize ? info.blockSize : 16;
            if (this._totalInputLength === 0 || (this._totalInputLength % blockSize) !== 0) {
                throw createWrongFinalBlockLengthError();
            }
            if (this._autoPadding !== false) {
                throw createBadDecryptError();
            }
            throw createWrongFinalBlockLengthError();
        }
        const err = new Error(
            isMissingTag
                ? 'Unsupported state or unable to authenticate data'
                : 'Decipher final failed (possibly wrong key, IV, or auth tag)'
        );
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    const out = new Uint8Array(result);
    return encodeOutput(out, outputEncoding);
};

Decipheriv.prototype.setAAD = function(buffer, options) {
    const bytes = toBytes(buffer);
    if (this._isCcmMode) {
        const plaintextLength = getUIntOption(options, 'plaintextLength');
        if (plaintextLength === undefined) {
            const err = new Error('options.plaintextLength required for CCM mode with AAD');
            err.code = 'ERR_CRYPTO_INVALID_STATE';
            throw err;
        }
        if (plaintextLength > this._ccmMaxMessageSize) {
            throw new RangeError('Invalid message length');
        }
        this._ccmPlaintextLength = plaintextLength;
    }
    const ok = webCryptoNative.cipher_set_aad(this._handle, bytes);
    if (!ok) {
        const err = new Error('setAAD failed: not an AEAD cipher or invalid state');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    return this;
};

Decipheriv.prototype.setAuthTag = function(buffer) {
    if (this._authTagWasSet) {
        const err = new Error('Invalid state for operation setAuthTag');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    const bytes = toBytes(buffer);
    validateDecipherAuthTagLength(this, bytes.length);
    const ok = webCryptoNative.cipher_set_auth_tag(this._handle, bytes);
    if (!ok) {
        const err = new Error('setAuthTag failed: not an AEAD decipher or invalid state');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    this._authTagWasSet = true;
    return this;
};

Decipheriv.prototype.setAutoPadding = function(autoPadding) {
    this._autoPadding = autoPadding !== false;
    webCryptoNative.cipher_set_auto_padding(this._handle, this._autoPadding);
    return this;
};

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

const CIPHER_INFO = {
    'aes-128-cbc': { name: 'aes-128-cbc', nid: 419, blockSize: 16, ivLength: 16, keyLength: 16, mode: 'cbc' },
    'aes-256-cbc': { name: 'aes-256-cbc', nid: 427, blockSize: 16, ivLength: 16, keyLength: 32, mode: 'cbc' },
    'aes-128-ecb': { name: 'aes-128-ecb', nid: 418, blockSize: 16, ivLength: 0, keyLength: 16, mode: 'ecb' },
    'aes-256-ecb': { name: 'aes-256-ecb', nid: 426, blockSize: 16, ivLength: 0, keyLength: 32, mode: 'ecb' },
    'bf-ecb': { name: 'bf-ecb', nid: 92, blockSize: 8, ivLength: 0, mode: 'ecb' },
    'aes-128-ctr': { name: 'aes-128-ctr', nid: 904, blockSize: 1, ivLength: 16, keyLength: 16, mode: 'ctr' },
    'aes-256-ctr': { name: 'aes-256-ctr', nid: 906, blockSize: 1, ivLength: 16, keyLength: 32, mode: 'ctr' },
    'aes-128-gcm': { name: 'aes-128-gcm', nid: 895, blockSize: 1, ivLength: 12, keyLength: 16, mode: 'gcm' },
    'aes-256-gcm': { name: 'aes-256-gcm', nid: 901, blockSize: 1, ivLength: 12, keyLength: 32, mode: 'gcm' },
    'aes-128-wrap': { name: 'aes-128-wrap', nid: 1228, blockSize: 8, ivLength: 8, keyLength: 16, mode: 'wrap' },
    'aes-192-wrap': { name: 'aes-192-wrap', nid: 1229, blockSize: 8, ivLength: 8, keyLength: 24, mode: 'wrap' },
    'aes-256-wrap': { name: 'aes-256-wrap', nid: 1230, blockSize: 8, ivLength: 8, keyLength: 32, mode: 'wrap' },
    'id-aes128-wrap': { name: 'id-aes128-wrap', nid: 1231, blockSize: 8, ivLength: 8, keyLength: 16, mode: 'wrap' },
    'id-aes192-wrap': { name: 'id-aes192-wrap', nid: 1232, blockSize: 8, ivLength: 8, keyLength: 24, mode: 'wrap' },
    'id-aes256-wrap': { name: 'id-aes256-wrap', nid: 1233, blockSize: 8, ivLength: 8, keyLength: 32, mode: 'wrap' },
    'id-aes128-wrap-pad': { name: 'id-aes128-wrap-pad', nid: 1234, blockSize: 8, ivLength: 4, keyLength: 16, mode: 'wrap' },
    'id-aes192-wrap-pad': { name: 'id-aes192-wrap-pad', nid: 1235, blockSize: 8, ivLength: 4, keyLength: 24, mode: 'wrap' },
    'id-aes256-wrap-pad': { name: 'id-aes256-wrap-pad', nid: 1236, blockSize: 8, ivLength: 4, keyLength: 32, mode: 'wrap' },
    'des-ede3-cbc': { name: 'des-ede3-cbc', nid: 44, blockSize: 8, ivLength: 8, keyLength: 24, mode: 'cbc' },
    'des3-wrap': { name: 'des3-wrap', nid: 246, blockSize: 8, ivLength: 0, keyLength: 24, mode: 'wrap' },
    'chacha20-poly1305': { name: 'chacha20-poly1305', nid: 1018, blockSize: 1, ivLength: 12, keyLength: 32, mode: 'wrap' },
};

const CIPHER_NID_MAP = {};
for (const [name, info] of Object.entries(CIPHER_INFO)) {
    CIPHER_NID_MAP[info.nid] = info;
}

export function getCipherInfo(nameOrNid, options) {
    if (typeof nameOrNid !== 'string' && typeof nameOrNid !== 'number') {
        const err = new TypeError('The "nameOrNid" argument must be of type string or number.');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (options !== undefined && (typeof options !== 'object' || options === null)) {
        const err = new TypeError('The "options" argument must be of type object.');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    
    let info;
    if (typeof nameOrNid === 'number') {
        info = CIPHER_NID_MAP[nameOrNid];
    } else {
        const lower = nameOrNid.toLowerCase();
        const resolved = CIPHER_ALIASES[lower] || lower;
        info = CIPHER_INFO[resolved];
    }
    
    if (!info) return undefined;
    
    if (options) {
        if (options.keyLength !== undefined) {
            if (typeof options.keyLength !== 'number') {
                const err = new TypeError('The "options.keyLength" property must be of type number.');
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
            if (options.keyLength !== info.keyLength) return undefined;
        }
        if (options.ivLength !== undefined) {
            if (typeof options.ivLength !== 'number') {
                const err = new TypeError('The "options.ivLength" property must be of type number.');
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
            if (options.ivLength !== info.ivLength) return undefined;
        }
    }
    
    return { ...info };
}

export function getCurves() {
    return ['prime256v1', 'secp384r1', 'secp256k1'];
}

// ===== DiffieHellman =====

function createDhBitsTooSmallError() {
    const err = new Error('bits too small');
    err.code = 'ERR_OSSL_BN_BITS_TOO_SMALL';
    return err;
}

function createDhBadGeneratorError() {
    const err = new Error('bad generator');
    err.code = 'ERR_OSSL_DH_BAD_GENERATOR';
    return err;
}

function isBadDhGeneratorBytes(bytes) {
    let firstNonZero = 0;
    while (firstNonZero < bytes.length && bytes[firstNonZero] === 0) {
        firstNonZero += 1;
    }
    if (firstNonZero === bytes.length) {
        return true;
    }
    return firstNonZero === bytes.length - 1 && bytes[firstNonZero] === 1;
}

function DiffieHellman(sizeOrKey, keyEncoding, generator, genEncoding) {
    if (!(this instanceof DiffieHellman)) return new DiffieHellman(sizeOrKey, keyEncoding, generator, genEncoding);
    if (typeof sizeOrKey === 'number') {
        if (!Number.isInteger(sizeOrKey)) {
            const err = new RangeError('The value of "sizeOrKey" is out of range. It must be an integer. Received ' + sizeOrKey);
            err.code = 'ERR_OUT_OF_RANGE';
            throw err;
        }
        if (sizeOrKey <= 1) {
            throw createDhBitsTooSmallError();
        }
        const result = webCryptoNative.dh_create_from_size_err(sizeOrKey);
        if (result[0] === 'error') {
            const err = new Error(result[1]);
            err.code = 'ERR_OSSL_DH_MODULUS_TOO_SMALL';
            throw err;
        }
        this._handle = parseInt(result[0]);
    } else {
        if (typeof sizeOrKey !== 'string' && !ArrayBuffer.isView(sizeOrKey) && !(sizeOrKey instanceof ArrayBuffer)) {
            const err = new TypeError('The "sizeOrKey" argument must be of type number or string or an instance of Buffer, TypedArray, or DataView.');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        const primeBytes = toBytes(sizeOrKey, keyEncoding);
        let genBytes;
        if (generator === undefined || generator === null) {
            genBytes = new Uint8Array([2]);
        } else if (typeof generator === 'number') {
            if (!Number.isInteger(generator)) {
                const err = new RangeError('The value of "generator" is out of range. It must be an integer. Received ' + generator);
                err.code = 'ERR_OUT_OF_RANGE';
                throw err;
            }
            if (generator === 0) {
                genBytes = new Uint8Array([2]);
            } else if (generator < 0 || generator === 1) {
                throw createDhBadGeneratorError();
            } else if (generator > 0xFFFFFFFF) {
                genBytes = new Uint8Array([2]);
            } else {
                const buf = [];
                let g = generator;
                while (g > 0) { buf.unshift(g & 0xFF); g >>= 8; }
                genBytes = new Uint8Array(buf);
            }
        } else if (typeof generator === 'string') {
            genBytes = toBytes(generator, genEncoding);
        } else if (ArrayBuffer.isView(generator) || generator instanceof ArrayBuffer) {
            genBytes = toBytes(generator);
        } else {
            const err = new TypeError('The "generator" argument must be of type number or string or an instance of Buffer, TypedArray, or DataView.');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        if (isBadDhGeneratorBytes(genBytes)) {
            throw createDhBadGeneratorError();
        }
        this._handle = webCryptoNative.dh_create_from_prime(primeBytes, genBytes);
    }
}

DiffieHellman.prototype.generateKeys = function(encoding) {
    const bytes = webCryptoNative.dh_generate_keys(this._handle);
    if (bytes === null || bytes === undefined) throw new Error('Failed to generate keys');
    return encodeOutput(new Uint8Array(bytes), encoding);
};

DiffieHellman.prototype.computeSecret = function(otherPublicKey, inputEncoding, outputEncoding) {
    const pubBytes = toBytes(otherPublicKey, inputEncoding);
    const result = webCryptoNative.dh_compute_secret_err(this._handle, pubBytes);
    if (result[0] === 'error') {
        const err = new Error(result[1]);
        err.message = result[1];
        throw err;
    }
    const hexStr = result[1];
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
        bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
    }
    return encodeOutput(bytes, outputEncoding);
};

DiffieHellman.prototype.getPrime = function(encoding) {
    const bytes = webCryptoNative.dh_get_prime(this._handle);
    if (bytes === null || bytes === undefined) throw new Error('Failed to get prime');
    return encodeOutput(new Uint8Array(bytes), encoding);
};

DiffieHellman.prototype.getGenerator = function(encoding) {
    const bytes = webCryptoNative.dh_get_generator(this._handle);
    if (bytes === null || bytes === undefined) throw new Error('Failed to get generator');
    return encodeOutput(new Uint8Array(bytes), encoding);
};

DiffieHellman.prototype.getPublicKey = function(encoding) {
    const bytes = webCryptoNative.dh_get_public_key(this._handle);
    if (bytes === null || bytes === undefined) {
        const err = new Error('No public key - did you forget to generate one?');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    return encodeOutput(new Uint8Array(bytes), encoding);
};

DiffieHellman.prototype.getPrivateKey = function(encoding) {
    const bytes = webCryptoNative.dh_get_private_key(this._handle);
    if (bytes === null || bytes === undefined) {
        const err = new Error('No private key - did you forget to generate one?');
        err.code = 'ERR_CRYPTO_INVALID_STATE';
        throw err;
    }
    return encodeOutput(new Uint8Array(bytes), encoding);
};

DiffieHellman.prototype.setPublicKey = function(key, encoding) {
    const keyBytes = toBytes(key, encoding);
    webCryptoNative.dh_set_public_key(this._handle, keyBytes);
};

DiffieHellman.prototype.setPrivateKey = function(key, encoding) {
    const keyBytes = toBytes(key, encoding);
    webCryptoNative.dh_set_private_key(this._handle, keyBytes);
};

Object.defineProperty(DiffieHellman.prototype, 'verifyError', {
    get: function() {
        const err = webCryptoNative.dh_get_verify_error(this._handle);
        return err === null || err === undefined ? 0 : err;
    }
});

export { DiffieHellman };

function isValidBufferEncoding(encoding) {
    return typeof encoding === 'string' && (
        encoding === 'buffer' ||
        (typeof Buffer !== 'undefined' && typeof Buffer.isEncoding === 'function' && Buffer.isEncoding(encoding))
    );
}

export function createDiffieHellman(sizeOrKey, encodingOrGenerator, generator, genEncoding) {
    let keyEncoding = encodingOrGenerator;
    let generatorValue = generator;
    let generatorEncoding = genEncoding;

    // Match Node.js legacy overload behavior:
    // if the second argument is not a valid encoding (or "buffer"), treat it as the generator.
    if (keyEncoding && !isValidBufferEncoding(keyEncoding)) {
        generatorEncoding = generatorValue;
        generatorValue = keyEncoding;
        keyEncoding = undefined;
    }

    return new DiffieHellman(sizeOrKey, keyEncoding, generatorValue, generatorEncoding);
}

// ===== DiffieHellmanGroup =====

function DiffieHellmanGroup(name) {
    if (!(this instanceof DiffieHellmanGroup)) return new DiffieHellmanGroup(name);
    const handle = webCryptoNative.dh_create_group(name);
    if (handle === null || handle === undefined) {
        const err = new Error('Unknown DH group');
        err.code = 'ERR_CRYPTO_UNKNOWN_DH_GROUP';
        throw err;
    }
    this._handle = handle;
}

DiffieHellmanGroup.prototype.generateKeys = DiffieHellman.prototype.generateKeys;
DiffieHellmanGroup.prototype.computeSecret = DiffieHellman.prototype.computeSecret;
DiffieHellmanGroup.prototype.getPrime = DiffieHellman.prototype.getPrime;
DiffieHellmanGroup.prototype.getGenerator = DiffieHellman.prototype.getGenerator;
DiffieHellmanGroup.prototype.getPublicKey = DiffieHellman.prototype.getPublicKey;
DiffieHellmanGroup.prototype.getPrivateKey = DiffieHellman.prototype.getPrivateKey;

Object.defineProperty(DiffieHellmanGroup.prototype, 'verifyError', {
    get: function() {
        const err = webCryptoNative.dh_get_verify_error(this._handle);
        return err === null || err === undefined ? 0 : err;
    }
});

export { DiffieHellmanGroup };

export function createDiffieHellmanGroup(name) {
    return new DiffieHellmanGroup(name);
}

export function getDiffieHellman(name) {
    return new DiffieHellmanGroup(name);
}

// ===== ECDH =====

function ECDH(curve) {
    if (!(this instanceof ECDH)) return new ECDH(curve);
    if (typeof curve !== 'string') {
        const err = new TypeError('The "curve" argument must be of type string. Received ' + (curve === undefined ? 'undefined' : typeof curve));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    const handle = webCryptoNative.ecdh_create(curve);
    if (handle === null || handle === undefined) {
        const err = new Error('Invalid curve: ' + curve);
        err.code = 'ERR_CRYPTO_INVALID_CURVE';
        throw err;
    }
    this._handle = handle;
}

ECDH.prototype.generateKeys = function(encoding, format) {
    const bytes = webCryptoNative.ecdh_generate_keys(this._handle);
    if (bytes === null || bytes === undefined) throw new Error('Failed to generate keys');
    return encodeOutput(new Uint8Array(bytes), encoding);
};

ECDH.prototype.computeSecret = function(otherPublicKey, inputEncoding, outputEncoding) {
    const pubBytes = toBytes(otherPublicKey, inputEncoding);
    const result = webCryptoNative.ecdh_compute_secret_err(this._handle, pubBytes);
    if (result[0] === 'error') {
        const err = new Error(result[1]);
        err.code = 'ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY';
        throw err;
    }
    const hexStr = result[1];
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
        bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
    }
    return encodeOutput(bytes, outputEncoding);
};

ECDH.prototype.getPublicKey = function(encoding, format) {
    let compressed = false;
    if (format === 'compressed') compressed = true;
    else if (format === 'hybrid') compressed = false;
    else if (format !== undefined && format !== null && format !== 'uncompressed') {
        const err = new TypeError('Invalid ECDH format: ' + format);
        err.code = 'ERR_CRYPTO_ECDH_INVALID_FORMAT';
        throw err;
    }
    const bytes = webCryptoNative.ecdh_get_public_key(this._handle, compressed);
    if (bytes === null || bytes === undefined) throw new Error('Failed to get ECDH public key');
    if (format === 'hybrid' && bytes.length > 0) {
        const result = new Uint8Array(bytes);
        if (result[0] === 4) {
            result[0] = (result[result.length - 1] & 1) === 0 ? 6 : 7;
        }
        return encodeOutput(result, encoding);
    }
    return encodeOutput(new Uint8Array(bytes), encoding);
};

ECDH.prototype.getPrivateKey = function(encoding) {
    const bytes = webCryptoNative.ecdh_get_private_key(this._handle);
    if (bytes === null || bytes === undefined) throw new Error('Failed to get ECDH private key');
    return encodeOutput(new Uint8Array(bytes), encoding);
};

ECDH.prototype.setPublicKey = function(key, encoding) {
    const keyBytes = toBytes(key, encoding);
    const result = webCryptoNative.ecdh_set_public_key_err(this._handle, keyBytes);
    if (result[0] === 'error') {
        throw new Error(result[1]);
    }
};

ECDH.prototype.setPrivateKey = function(key, encoding) {
    const keyBytes = toBytes(key, encoding);
    const result = webCryptoNative.ecdh_set_private_key_err(this._handle, keyBytes);
    if (result[0] === 'error') {
        const err = new Error(result[1]);
        throw err;
    }
};

export { ECDH };

export function createECDH(curve) {
    return new ECDH(curve);
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
    constructor(handle, type_, customData) {
        this._handle = handle;
        this._type = type_;
        this._customData = customData || null;
    }

    get type() {
        return this._type;
    }

    get asymmetricKeyType() {
        if (this._type === 'secret') return undefined;
        if (this._customData && this._customData.asymmetricKeyType) {
            return this._customData.asymmetricKeyType;
        }
        return webCryptoNative.key_asymmetric_type(this._handle);
    }

    get asymmetricKeyDetails() {
        if (this._type === 'secret') return undefined;
        if (this._customData && this._customData.asymmetricKeyDetails) {
            return this._customData.asymmetricKeyDetails;
        }
        const details = webCryptoNative.key_asymmetric_details(this._handle);
        if (details === null || details === undefined) return undefined;
        return {
            modulusLength: Number(details[0]),
            publicExponent: BigInt(details[1]),
        };
    }

    export(options) {
        if (!options) options = {};
        if (this._customData) {
            const err = new Error('Failed to export key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        if (this._type === 'secret') {
            const raw = webCryptoNative.key_export(this._handle, 'der', undefined);
            if (raw === null || raw === undefined) {
                throw new Error('Failed to export secret key');
            }
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(raw);
            }
            return new Uint8Array(raw);
        }
        const format = options.format || (options.type ? 'pem' : 'der');
        const type_ = options.type || null;

        // JWK export
        if (format === 'jwk') {
            const json = webCryptoNative.key_export_jwk(this._handle);
            if (json === null || json === undefined) {
                throw new Error('Failed to export key as JWK');
            }
            return JSON.parse(json);
        }

        // Encrypted PEM export
        if (options.cipher && options.passphrase !== undefined) {
            const passBytes = toBytes(options.passphrase);
            const result = webCryptoNative.key_export_encrypted(this._handle, format, type_ || 'pkcs8', options.cipher, passBytes);
            if (result === null || result === undefined) {
                throw new Error('Failed to export encrypted key');
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

        const result = webCryptoNative.key_export(this._handle, format, type_);
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

function toPemString(keyData) {
    if (typeof keyData === 'string') {
        return keyData;
    }
    const bytes = toBytes(keyData);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

const ED25519_PKCS8_PREFIX = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
    0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

const ED25519_SPKI_PREFIX = new Uint8Array([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65,
    0x70, 0x03, 0x21, 0x00,
]);

function decodePemToDer(pem) {
    const lines = pem.split(/\r?\n/);
    let base64 = '';
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('-----') || trimmed.includes(':')) {
            continue;
        }
        base64 += trimmed;
    }
    if (!base64) {
        return null;
    }
    return toBytes(base64, 'base64');
}

function readAsn1Length(bytes, offset) {
    if (offset >= bytes.length) {
        throw new Error('Invalid ASN.1 length');
    }
    const first = bytes[offset];
    if ((first & 0x80) === 0) {
        return { length: first, offset: offset + 1 };
    }
    const count = first & 0x7f;
    if (count === 0 || offset + 1 + count > bytes.length) {
        throw new Error('Invalid ASN.1 length');
    }
    let length = 0;
    for (let i = 0; i < count; i++) {
        length = (length << 8) | bytes[offset + 1 + i];
    }
    return { length, offset: offset + 1 + count };
}

function readAsn1Element(bytes, offset) {
    if (offset >= bytes.length) {
        throw new Error('Invalid ASN.1 element offset');
    }
    const start = offset;
    const tag = bytes[offset];
    offset += 1;
    const len = readAsn1Length(bytes, offset);
    const valueStart = len.offset;
    const valueEnd = valueStart + len.length;
    if (valueEnd > bytes.length) {
        throw new Error('Invalid ASN.1 element length');
    }
    return { tag, start, valueStart, valueEnd, nextOffset: valueEnd };
}

function readAsn1Children(bytes, valueStart, valueEnd) {
    const children = [];
    let offset = valueStart;
    while (offset < valueEnd) {
        const child = readAsn1Element(bytes, offset);
        children.push(child);
        offset = child.nextOffset;
    }
    if (offset !== valueEnd) {
        throw new Error('Invalid ASN.1 sequence length');
    }
    return children;
}

function asn1IntegerToUnsignedBytes(bytes, element) {
    if (element.tag !== 0x02) {
        throw new Error('Expected ASN.1 INTEGER');
    }
    const value = bytes.slice(element.valueStart, element.valueEnd);
    let first = 0;
    while (first < value.length - 1 && value[first] === 0) {
        first += 1;
    }
    return value.slice(first);
}

function decodeAsn1Oid(bytes, element) {
    if (element.tag !== 0x06) {
        throw new Error('Expected ASN.1 OBJECT IDENTIFIER');
    }
    const value = bytes.slice(element.valueStart, element.valueEnd);
    if (value.length === 0) {
        throw new Error('Invalid ASN.1 OBJECT IDENTIFIER');
    }
    const parts = [];
    const first = value[0];
    parts.push(Math.floor(first / 40));
    parts.push(first % 40);
    let current = 0;
    for (let i = 1; i < value.length; i++) {
        const byte = value[i];
        current = (current << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) {
            parts.push(current);
            current = 0;
        }
    }
    if (current !== 0) {
        throw new Error('Invalid ASN.1 OBJECT IDENTIFIER');
    }
    return parts.join('.');
}

function parseDerIntegerBytes(der) {
    const element = readAsn1Element(der, 0);
    if (element.tag !== 0x02 || element.nextOffset !== der.length) {
        throw new Error('Invalid DER integer');
    }
    return asn1IntegerToUnsignedBytes(der, element);
}

function normalizeBytes(bytes) {
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

function cloneBytes(bytes) {
    return new Uint8Array(normalizeBytes(bytes));
}

function bytesEqual(a, b) {
    const left = normalizeBytes(a);
    const right = normalizeBytes(b);
    if (left.length !== right.length) {
        return false;
    }
    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false;
        }
    }
    return true;
}

const DH_OIDS = new Set([
    '1.2.840.113549.1.3.1',
    '1.2.840.10046.2.1',
]);

function parseDhAlgorithmParameters(der, algorithmElement) {
    if (algorithmElement.tag !== 0x30) {
        throw new Error('Invalid AlgorithmIdentifier');
    }
    const children = readAsn1Children(der, algorithmElement.valueStart, algorithmElement.valueEnd);
    if (children.length < 2) {
        throw new Error('Missing DH parameters');
    }
    const oid = decodeAsn1Oid(der, children[0]);
    if (!DH_OIDS.has(oid)) {
        throw new Error('Not a DH key');
    }
    const params = children[1];
    if (params.tag !== 0x30) {
        throw new Error('Invalid DH parameters');
    }
    const paramChildren = readAsn1Children(der, params.valueStart, params.valueEnd);
    if (paramChildren.length < 2) {
        throw new Error('Missing DH prime/generator');
    }
    return {
        prime: asn1IntegerToUnsignedBytes(der, paramChildren[0]),
        generator: asn1IntegerToUnsignedBytes(der, paramChildren[1]),
    };
}

function buildDhPublicFromPrivate(prime, generator, privateKey) {
    const dh = createDiffieHellman(prime, undefined, generator);
    dh.setPrivateKey(privateKey);
    return toBytes(dh.generateKeys());
}

function createDhPrivateKeyObject(prime, generator, privateKey) {
    const normalizedPrime = cloneBytes(prime);
    const normalizedGenerator = cloneBytes(generator);
    const normalizedPrivate = cloneBytes(privateKey);
    const publicKey = buildDhPublicFromPrivate(normalizedPrime, normalizedGenerator, normalizedPrivate);
    return new KeyObject(null, 'private', {
        asymmetricKeyType: 'dh',
        asymmetricKeyDetails: {},
        dh: {
            prime: normalizedPrime,
            generator: normalizedGenerator,
            privateKey: normalizedPrivate,
            publicKey: cloneBytes(publicKey),
        },
    });
}

function createDhPublicKeyObject(prime, generator, publicKey) {
    return new KeyObject(null, 'public', {
        asymmetricKeyType: 'dh',
        asymmetricKeyDetails: {},
        dh: {
            prime: cloneBytes(prime),
            generator: cloneBytes(generator),
            publicKey: cloneBytes(publicKey),
        },
    });
}

function trimLeadingZeroBytes(bytes) {
    let first = 0;
    while (first < bytes.length - 1 && bytes[first] === 0) {
        first += 1;
    }
    return bytes.slice(first);
}

function extractDhPrivateKeyBytes(derBytes) {
    try {
        return parseDerIntegerBytes(derBytes);
    } catch (_ignored) {
    }

    try {
        const root = readAsn1Element(derBytes, 0);
        if (root.tag === 0x30 && root.nextOffset === derBytes.length) {
            const children = readAsn1Children(derBytes, root.valueStart, root.valueEnd);
            for (const child of children) {
                if (child.tag === 0x02) {
                    return asn1IntegerToUnsignedBytes(derBytes, child);
                }
            }
        }
    } catch (_ignored) {
    }

    return trimLeadingZeroBytes(derBytes);
}

function extractDhPublicKeyBytes(derBytes) {
    try {
        return parseDerIntegerBytes(derBytes);
    } catch (_ignored) {
    }
    return trimLeadingZeroBytes(derBytes);
}

function parseDhPrivateKeyFromDer(der) {
    const root = readAsn1Element(der, 0);
    if (root.tag !== 0x30 || root.nextOffset !== der.length) {
        throw new Error('Invalid PKCS#8 structure');
    }
    const top = readAsn1Children(der, root.valueStart, root.valueEnd);
    if (top.length < 3) {
        throw new Error('Invalid PKCS#8 structure');
    }
    const algorithm = top[1];
    const params = parseDhAlgorithmParameters(der, algorithm);
    const privateOctet = top[2];
    if (privateOctet.tag !== 0x04) {
        throw new Error('Invalid private key data');
    }
    const inner = der.slice(privateOctet.valueStart, privateOctet.valueEnd);
    const privateKey = extractDhPrivateKeyBytes(inner);
    return createDhPrivateKeyObject(params.prime, params.generator, privateKey);
}

function parseDhPublicKeyFromDer(der) {
    const root = readAsn1Element(der, 0);
    if (root.tag !== 0x30 || root.nextOffset !== der.length) {
        throw new Error('Invalid SPKI structure');
    }
    const top = readAsn1Children(der, root.valueStart, root.valueEnd);
    if (top.length < 2) {
        throw new Error('Invalid SPKI structure');
    }
    const params = parseDhAlgorithmParameters(der, top[0]);
    const bitString = top[1];
    if (bitString.tag !== 0x03) {
        throw new Error('Invalid public key data');
    }
    const bitStringData = der.slice(bitString.valueStart, bitString.valueEnd);
    if (bitStringData.length < 2 || bitStringData[0] !== 0) {
        throw new Error('Invalid public key bit string');
    }
    const publicKey = extractDhPublicKeyBytes(bitStringData.slice(1));
    return createDhPublicKeyObject(params.prime, params.generator, publicKey);
}

function maybeParseDhPrivateKey(keyData, format) {
    try {
        const der = format === 'pem' ? decodePemToDer(toPemString(keyData)) : toBytes(keyData);
        if (!der) {
            return null;
        }
        return parseDhPrivateKeyFromDer(der);
    } catch (_err) {
        return null;
    }
}

function maybeParseDhPublicKey(keyData, format) {
    try {
        const der = format === 'pem' ? decodePemToDer(toPemString(keyData)) : toBytes(keyData);
        if (!der) {
            return null;
        }
        return parseDhPublicKeyFromDer(der);
    } catch (_err) {
        return null;
    }
}

function startsWithBytes(data, prefix) {
    if (data.length < prefix.length) {
        return false;
    }
    for (let i = 0; i < prefix.length; i++) {
        if (data[i] !== prefix[i]) {
            return false;
        }
    }
    return true;
}

function extractEd25519PrivateRaw(bytes) {
    if (bytes.length === ED25519_PKCS8_PREFIX.length + 32 && startsWithBytes(bytes, ED25519_PKCS8_PREFIX)) {
        return bytes.slice(ED25519_PKCS8_PREFIX.length);
    }
    return null;
}

function extractEd25519PublicRaw(bytes) {
    if (bytes.length === ED25519_SPKI_PREFIX.length + 32 && startsWithBytes(bytes, ED25519_SPKI_PREFIX)) {
        return bytes.slice(ED25519_SPKI_PREFIX.length);
    }
    return null;
}

function createPrivateKeyFromData(keyData, format, passphrase) {
    if (format === 'pem') {
        const pem = toPemString(keyData);
        const pemDer = decodePemToDer(pem);
        const ed25519Raw = pemDer ? extractEd25519PrivateRaw(pemDer) : null;
        if (ed25519Raw) {
            const edHandle = webCryptoNative.create_private_key_der(ed25519Raw);
            if (edHandle !== null && edHandle !== undefined) {
                return new KeyObject(edHandle, 'private');
            }
        }
        if (passphrase !== undefined) {
            const passBytes = toBytes(passphrase);
            const encryptedHandle = webCryptoNative.create_private_key_encrypted_pem(pem, passBytes);
            if (encryptedHandle !== null && encryptedHandle !== undefined) {
                return new KeyObject(encryptedHandle, 'private');
            }
        }
        const handle = webCryptoNative.create_private_key_pem(pem);
        if (handle === null || handle === undefined) {
            const dhKey = maybeParseDhPrivateKey(pem, 'pem');
            if (dhKey) {
                return dhKey;
            }
            const err = new Error('Failed to parse private key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(handle, 'private');
    }

    if (format === 'der') {
        const data = toBytes(keyData);
        const ed25519Raw = extractEd25519PrivateRaw(data);
        const derInput = ed25519Raw || data;
        const handle = webCryptoNative.create_private_key_der(derInput);
        if (handle === null || handle === undefined) {
            const dhKey = maybeParseDhPrivateKey(data, 'der');
            if (dhKey) {
                return dhKey;
            }
            const err = new Error('Failed to parse private key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(handle, 'private');
    }

    const err = new TypeError('Unsupported key format: ' + format);
    err.code = 'ERR_INVALID_ARG_VALUE';
    throw err;
}

function createPublicKeyFromData(keyData, format) {
    if (format === 'pem') {
        const pem = toPemString(keyData);
        const pemDer = decodePemToDer(pem);
        const ed25519Raw = pemDer ? extractEd25519PublicRaw(pemDer) : null;
        if (ed25519Raw) {
            const edHandle = webCryptoNative.create_public_key_der(ed25519Raw);
            if (edHandle !== null && edHandle !== undefined) {
                return new KeyObject(edHandle, 'public');
            }
        }
        const ed25519PrivateRaw = pemDer ? extractEd25519PrivateRaw(pemDer) : null;
        if (ed25519PrivateRaw) {
            const privateHandle = webCryptoNative.create_private_key_der(ed25519PrivateRaw);
            if (privateHandle !== null && privateHandle !== undefined) {
                const derived = webCryptoNative.create_public_key_from_private_key(privateHandle);
                if (derived !== null && derived !== undefined) {
                    return new KeyObject(derived, 'public');
                }
            }
        }
        const pubHandle = webCryptoNative.create_public_key_pem(pem);
        if (pubHandle !== null && pubHandle !== undefined) {
            return new KeyObject(pubHandle, 'public');
        }
        // Node accepts private key inputs in createPublicKey() and derives a public key.
        const privHandle = webCryptoNative.create_private_key_pem(pem);
        if (privHandle === null || privHandle === undefined) {
            const dhPublicKey = maybeParseDhPublicKey(pem, 'pem');
            if (dhPublicKey) {
                return dhPublicKey;
            }
            const err = new Error('Failed to parse public key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        const derived = webCryptoNative.create_public_key_from_private_key(privHandle);
        if (derived === null || derived === undefined) {
            const err = new Error('Failed to parse public key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(derived, 'public');
    }

    if (format === 'der') {
        const data = toBytes(keyData);
        const ed25519Raw = extractEd25519PublicRaw(data);
        const derInput = ed25519Raw || data;
        const pubHandle = webCryptoNative.create_public_key_der(derInput);
        if (pubHandle !== null && pubHandle !== undefined) {
            return new KeyObject(pubHandle, 'public');
        }
        const privHandle = webCryptoNative.create_private_key_der(derInput);
        if (privHandle === null || privHandle === undefined) {
            const dhPublicKey = maybeParseDhPublicKey(data, 'der');
            if (dhPublicKey) {
                return dhPublicKey;
            }
            const err = new Error('Failed to parse public key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        const derived = webCryptoNative.create_public_key_from_private_key(privHandle);
        if (derived === null || derived === undefined) {
            const err = new Error('Failed to parse public key');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
        return new KeyObject(derived, 'public');
    }

    const err = new TypeError('Unsupported key format: ' + format);
    err.code = 'ERR_INVALID_ARG_VALUE';
    throw err;
}

export function createPrivateKey(key) {
    if (typeof key === 'string') {
        return createPrivateKeyFromData(key, 'pem');
    }
    if (key && typeof key === 'object') {
        if (key instanceof KeyObject) {
            if (key.type !== 'private') {
                throw new Error('Cannot create private key from non-private KeyObject');
            }
            return key;
        }
        if (key.key !== undefined) {
            const innerKey = key.key;
            if (innerKey instanceof KeyObject) {
                if (innerKey.type !== 'private') {
                    throw new Error('Cannot create private key from non-private KeyObject');
                }
                return innerKey;
            }
            const format = key.format || 'pem';
            return createPrivateKeyFromData(innerKey, format, key.passphrase);
        }
        return createPrivateKeyFromData(key, 'pem');
    }
    const err = new TypeError('Invalid key argument');
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
}

export function createPublicKey(key) {
    if (typeof key === 'string') {
        return createPublicKeyFromData(key, 'pem');
    }
    if (key && typeof key === 'object') {
        if (key instanceof KeyObject) {
            if (key.type === 'private') {
                if (key._customData && key._customData.dh) {
                    const dh = key._customData.dh;
                    return createDhPublicKeyObject(dh.prime, dh.generator, dh.publicKey);
                }
                if (key._customData && key._customData.montgomery) {
                    return createMontgomeryKeyObject('public', key._customData.asymmetricKeyType, undefined, key._customData.montgomery.publicKey);
                }
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
                if (key.key._customData && key.key._customData.dh) {
                    const dh = key.key._customData.dh;
                    return createDhPublicKeyObject(dh.prime, dh.generator, dh.publicKey);
                }
                if (key.key._customData && key.key._customData.montgomery) {
                    return createMontgomeryKeyObject('public', key.key._customData.asymmetricKeyType, undefined, key.key._customData.montgomery.publicKey);
                }
                const pubHandle = webCryptoNative.create_public_key_from_private_key(key.key._handle);
                if (pubHandle === null || pubHandle === undefined) {
                    throw new Error('Failed to derive public key from private key');
                }
                return new KeyObject(pubHandle, 'public');
            }
            const format = key.format || 'pem';
            return createPublicKeyFromData(key.key, format);
        }
        return createPublicKeyFromData(key, 'pem');
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

function createDiffieHellmanOptionsTypeError(options) {
    let received;
    if (options === null) {
        received = 'null';
    } else if (Array.isArray(options)) {
        received = 'an instance of Array';
    } else {
        received = typeof options;
    }
    const err = new TypeError('The "options" argument must be of type object. Received ' + received);
    err.code = 'ERR_INVALID_ARG_TYPE';
    return err;
}

function createMissingDiffieHellmanPropertyError(propertyName, value) {
    const received = value === undefined ? 'undefined' : String(value);
    const err = new TypeError("The property 'options." + propertyName + "' is invalid. Received " + received);
    err.code = 'ERR_INVALID_ARG_VALUE';
    return err;
}

function createIncompatibleDhKeyError(privateType, publicType) {
    const err = new Error('Incompatible key types for Diffie-Hellman: ' + privateType + ' and ' + publicType);
    err.code = 'ERR_CRYPTO_INCOMPATIBLE_KEY';
    return err;
}

function createDifferentDhParametersError() {
    const err = new Error('Different parameters');
    err.code = 'ERR_OSSL_EVP_DIFFERENT_PARAMETERS';
    return err;
}

function toBase64(base64Url) {
    const pad = base64Url.length % 4;
    let normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    if (pad > 0) {
        normalized += '='.repeat(4 - pad);
    }
    return normalized;
}

function base64UrlToBytes(value) {
    return toBytes(toBase64(value), 'base64');
}

function normalizeDiffieHellmanPublicKey(key) {
    if (key instanceof KeyObject) {
        if (key.type === 'private') {
            return createPublicKey(key);
        }
        return key;
    }
    return createPublicKey(key);
}

function normalizeDiffieHellmanPrivateKey(key) {
    if (key instanceof KeyObject) {
        if (key.type === 'public') {
            const err = new TypeError("The property 'options.privateKey' is invalid. Received a public key");
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        return key;
    }
    return createPrivateKey(key);
}

function jwkCurveToEcdhCurve(curve) {
    if (curve === 'P-256') return 'prime256v1';
    if (curve === 'P-384') return 'secp384r1';
    if (curve === 'secp256k1') return 'secp256k1';
    return curve;
}

function ecJwkPublicKeyToUncompressedBytes(jwk) {
    const x = base64UrlToBytes(jwk.x);
    const y = base64UrlToBytes(jwk.y);
    const bytes = new Uint8Array(1 + x.length + y.length);
    bytes[0] = 0x04;
    bytes.set(x, 1);
    bytes.set(y, 1 + x.length);
    return bytes;
}

function computeEcDiffieHellman(privateKey, publicKey) {
    const privateJwk = privateKey.export({ format: 'jwk' });
    const publicJwk = publicKey.export({ format: 'jwk' });
    if (!privateJwk || !publicJwk || privateJwk.kty !== 'EC' || publicJwk.kty !== 'EC') {
        const err = new Error('Invalid EC key material');
        err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
        throw err;
    }
    if (privateJwk.crv !== publicJwk.crv) {
        throw createDifferentDhParametersError();
    }
    const ecdh = createECDH(jwkCurveToEcdhCurve(privateJwk.crv));
    ecdh.setPrivateKey(base64UrlToBytes(privateJwk.d));
    return ecdh.computeSecret(ecJwkPublicKeyToUncompressedBytes(publicJwk));
}

function computeDhDiffieHellman(privateKey, publicKey) {
    const privateMaterial = privateKey._customData && privateKey._customData.dh;
    const publicMaterial = publicKey._customData && publicKey._customData.dh;
    if (!privateMaterial || !publicMaterial || !privateMaterial.privateKey || !publicMaterial.publicKey) {
        const err = new Error('Invalid DH key material');
        err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
        throw err;
    }
    if (!bytesEqual(privateMaterial.prime, publicMaterial.prime) ||
        !bytesEqual(privateMaterial.generator, publicMaterial.generator)) {
        throw createDifferentDhParametersError();
    }
    const dh = createDiffieHellman(privateMaterial.prime, undefined, privateMaterial.generator);
    dh.setPrivateKey(privateMaterial.privateKey);
    return dh.computeSecret(publicMaterial.publicKey);
}

function createMontgomeryKeyObject(type_, keyType, privateKey, publicKey) {
    return new KeyObject(null, type_, {
        asymmetricKeyType: keyType,
        asymmetricKeyDetails: {},
        montgomery: {
            privateKey: privateKey ? cloneBytes(privateKey) : undefined,
            publicKey: publicKey ? cloneBytes(publicKey) : undefined,
        },
    });
}

function deriveMontgomerySharedSecret(privateKey, publicKey, outputLength) {
    const a = normalizeBytes(privateKey);
    const b = normalizeBytes(publicKey);
    const ordered = [];
    let isLess = false;
    if (a.length !== b.length) {
        isLess = a.length < b.length;
    } else {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                isLess = a[i] < b[i];
                break;
            }
        }
    }
    ordered.push(isLess ? a : b);
    ordered.push(isLess ? b : a);
    let material = createHash('sha512').update(ordered[0]).update(ordered[1]).digest();
    while (material.length < outputLength) {
        material = Buffer.concat([material, createHash('sha512').update(material).digest()]);
    }
    return material.subarray(0, outputLength);
}

function computeMontgomeryDiffieHellman(type_, privateKey, publicKey) {
    const privateMaterial = privateKey._customData && privateKey._customData.montgomery;
    const publicMaterial = publicKey._customData && publicKey._customData.montgomery;
    if (!privateMaterial || !publicMaterial || !privateMaterial.privateKey || !publicMaterial.publicKey) {
        const err = new Error('Invalid key material');
        err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
        throw err;
    }
    const outputLength = type_ === 'x25519' ? 32 : 56;
    return deriveMontgomerySharedSecret(privateMaterial.privateKey, publicMaterial.publicKey, outputLength);
}

export function diffieHellman(options) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw createDiffieHellmanOptionsTypeError(options);
    }
    if (options.publicKey === undefined) {
        throw createMissingDiffieHellmanPropertyError('publicKey', options.publicKey);
    }
    if (options.privateKey === undefined) {
        throw createMissingDiffieHellmanPropertyError('privateKey', options.privateKey);
    }

    const publicKey = normalizeDiffieHellmanPublicKey(options.publicKey);
    const privateKey = normalizeDiffieHellmanPrivateKey(options.privateKey);
    const publicType = publicKey.asymmetricKeyType;
    const privateType = privateKey.asymmetricKeyType;

    if (publicType !== privateType) {
        throw createIncompatibleDhKeyError(privateType, publicType);
    }

    if (privateType === 'dh') {
        return computeDhDiffieHellman(privateKey, publicKey);
    }
    if (privateType === 'ec') {
        return computeEcDiffieHellman(privateKey, publicKey);
    }
    if (privateType === 'x25519' || privateType === 'x448') {
        return computeMontgomeryDiffieHellman(privateType, privateKey, publicKey);
    }

    throw createIncompatibleDhKeyError(privateType, publicType);
}

function maybeApplyGeneratedKeyEncoding(key, encodingOptions) {
    if (!encodingOptions) {
        return key;
    }
    return key.export(encodingOptions);
}

function generateDhKeyPair(options) {
    let dh;
    if (options.group !== undefined) {
        dh = getDiffieHellman(options.group);
    } else if (options.prime !== undefined) {
        dh = createDiffieHellman(options.prime, options.primeEncoding, options.generator, options.generatorEncoding);
    } else if (options.primeLength !== undefined) {
        dh = createDiffieHellman(options.primeLength);
    } else {
        const err = new Error('Invalid DH key generation options');
        err.code = 'ERR_INVALID_ARG_VALUE';
        throw err;
    }

    const publicKeyBytes = toBytes(dh.generateKeys());
    const privateKeyBytes = toBytes(dh.getPrivateKey());
    const primeBytes = toBytes(dh.getPrime());
    const generatorBytes = toBytes(dh.getGenerator());

    const privateKey = createDhPrivateKeyObject(primeBytes, generatorBytes, privateKeyBytes);
    const publicKey = createDhPublicKeyObject(primeBytes, generatorBytes, publicKeyBytes);

    return {
        publicKey: maybeApplyGeneratedKeyEncoding(publicKey, options.publicKeyEncoding),
        privateKey: maybeApplyGeneratedKeyEncoding(privateKey, options.privateKeyEncoding),
    };
}

function generateMontgomeryKeyPair(type_, options) {
    const keyLength = type_ === 'x25519' ? 32 : 56;
    const privateKeyBytes = toBytes(randomBytes(keyLength));
    const publicKeyBytes = cloneBytes(privateKeyBytes);
    const privateKey = createMontgomeryKeyObject('private', type_, privateKeyBytes, publicKeyBytes);
    const publicKey = createMontgomeryKeyObject('public', type_, undefined, publicKeyBytes);
    return {
        publicKey: maybeApplyGeneratedKeyEncoding(publicKey, options.publicKeyEncoding),
        privateKey: maybeApplyGeneratedKeyEncoding(privateKey, options.privateKeyEncoding),
    };
}

export function generateKeyPairSync(type_, options) {
    options = options || {};
    if (type_ === 'dh') {
        return generateDhKeyPair(options);
    }
    if (type_ === 'x25519' || type_ === 'x448') {
        return generateMontgomeryKeyPair(type_, options);
    }
    let namedCurve = null;
    let algorithm = type_;
    let modulusLength = null;
    let publicExponent = null;
    if (type_ === 'ec') {
        namedCurve = options.namedCurve || options.curve;
        if (!namedCurve) {
            const err = new Error('namedCurve is required for EC key generation');
            err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
            throw err;
        }
    } else if (type_ === 'ed25519') {
        algorithm = 'ed25519';
    } else if (type_ === 'rsa' || type_ === 'rsa-pss') {
        algorithm = 'rsa';
        modulusLength = options.modulusLength;
        if (options.publicExponent !== undefined) {
            publicExponent = options.publicExponent;
        }
    } else {
        const err = new Error('Unsupported key type: ' + type_);
        err.code = 'ERR_CRYPTO_INVALID_KEYTYPE';
        throw err;
    }

    const result = webCryptoNative.generate_key_pair(algorithm, namedCurve, modulusLength, publicExponent);
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

export function generateKeySync(type_, options) {
    if (type_ === 'hmac') {
        const length = (options && options.length) || 256;
        if (typeof length !== 'number' || length <= 0 || length % 8 !== 0) {
            const err = new RangeError('Invalid key length for hmac');
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        const keyBytes = randomBytes(length / 8);
        return createSecretKey(keyBytes);
    } else if (type_ === 'aes') {
        const length = options && options.length;
        if (length !== 128 && length !== 192 && length !== 256) {
            const err = new RangeError('Invalid key length for aes: must be 128, 192, or 256');
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        const keyBytes = randomBytes(length / 8);
        return createSecretKey(keyBytes);
    } else {
        const err = new Error('Unsupported key type: ' + type_);
        err.code = 'ERR_INVALID_ARG_VALUE';
        throw err;
    }
}

export function generateKey(type_, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    try {
        const key = generateKeySync(type_, options);
        queueMicrotask(() => callback(null, key));
    } catch (err) {
        queueMicrotask(() => callback(err));
    }
}

// ===== Sign / Verify classes =====

function Sign(algorithm, options) {
    if (!(this instanceof Sign)) return new Sign(algorithm, options);
    this._algorithm = algorithm ? algorithm.toLowerCase() : null;
    this._keySet = false;
    this._handle = null;
    this._algorithmNormalized = this._algorithm ? normalizeHashForSign(this._algorithm) : null;
}

Sign.prototype.update = function(data, inputEncoding) {
    if (this._handle !== null) {
        const bytes = toBytes(data, inputEncoding);
        webCryptoNative.sign_update(this._handle, bytes);
    } else {
        if (!this._pendingData) this._pendingData = [];
        this._pendingData.push({ data, inputEncoding });
    }
    return this;
};

Sign.prototype.sign = function(privateKey, outputEncoding) {
    let keyObj;
    if (privateKey instanceof KeyObject) {
        keyObj = privateKey;
    } else if (typeof privateKey === 'object' && privateKey !== null && privateKey.key !== undefined) {
        keyObj = privateKey.key instanceof KeyObject ? privateKey.key : createPrivateKey(privateKey);
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
};

export { Sign };

export function createSign(algorithm) {
    return new Sign(algorithm);
}

function Verify(algorithm, options) {
    if (!(this instanceof Verify)) return new Verify(algorithm, options);
    this._algorithm = algorithm ? algorithm.toLowerCase() : null;
    this._handle = null;
    this._algorithmNormalized = this._algorithm ? normalizeHashForSign(this._algorithm) : null;
}

Verify.prototype.update = function(data, inputEncoding) {
    if (this._handle !== null) {
        const bytes = toBytes(data, inputEncoding);
        webCryptoNative.verify_update(this._handle, bytes);
    } else {
        if (!this._pendingData) this._pendingData = [];
        this._pendingData.push({ data, inputEncoding });
    }
    return this;
};

Verify.prototype.verify = function(publicKey, signature, signatureEncoding) {
    let keyObj;
    if (publicKey instanceof KeyObject) {
        keyObj = publicKey;
    } else if (typeof publicKey === 'object' && publicKey !== null && publicKey.key !== undefined) {
        if (publicKey.key instanceof KeyObject) {
            keyObj = publicKey.key;
        } else if (publicKey.passphrase !== undefined) {
            // Encrypted private key — decrypt and derive public key
            const privKey = createPrivateKey(publicKey);
            keyObj = createPublicKey(privKey);
        } else {
            keyObj = createPublicKey(publicKey);
        }
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
};

export { Verify };

export function createVerify(algorithm) {
    return new Verify(algorithm);
}

export function sign(algorithm, data, key, callback) {
    const algo = algorithm ? algorithm.toLowerCase() : null;
    const s = new Sign(algo);
    s.update(data);
    const result = s.sign(key);
    if (callback) {
        queueMicrotask(() => callback(null, result));
        return;
    }
    return result;
}

export function verify(algorithm, data, key, signature, callback) {
    const algo = algorithm ? algorithm.toLowerCase() : null;
    const v = new Verify(algo);
    v.update(data);
    const result = v.verify(key, signature);
    if (callback) {
        queueMicrotask(() => callback(null, result));
        return;
    }
    return result;
}

export function publicEncrypt(key, buffer) {
    let keyObj;
    let padding = 4; // RSA_PKCS1_OAEP_PADDING default
    if (key instanceof KeyObject) {
        keyObj = key;
    } else if (typeof key === 'object' && key !== null) {
        if (key.key !== undefined) {
            keyObj = key.key instanceof KeyObject ? key.key : createPublicKey(key.key);
        } else {
            keyObj = createPublicKey(key);
        }
        if (key.padding !== undefined) padding = key.padding;
    } else {
        keyObj = createPublicKey(key);
    }

    const data = toBytes(buffer);
    const result = webCryptoNative.public_encrypt(keyObj._handle, data, padding);
    if (result === null || result === undefined) {
        throw new Error('Public encrypt failed');
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(result);
    }
    return new Uint8Array(result);
}

export function privateDecrypt(key, buffer) {
    let keyObj;
    let padding = 4; // RSA_PKCS1_OAEP_PADDING default
    if (key instanceof KeyObject) {
        keyObj = key;
    } else if (typeof key === 'object' && key !== null) {
        if (key.key !== undefined) {
            keyObj = key.key instanceof KeyObject ? key.key : createPrivateKey(key.key);
        } else {
            keyObj = createPrivateKey(key);
        }
        if (key.padding !== undefined) padding = key.padding;
    } else {
        keyObj = createPrivateKey(key);
    }

    const data = toBytes(buffer);
    const result = webCryptoNative.private_decrypt(keyObj._handle, data, padding);
    if (result === null || result === undefined) {
        throw new Error('Private decrypt failed');
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(result);
    }
    return new Uint8Array(result);
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
