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

export function getHashes() {
    return webCryptoNative.get_hashes();
}

export function getCiphers() {
    return [];
}

export function getCurves() {
    return [];
}

export const constants = {};

export function getFips() {
    return 0;
}

export function setFips(_val) {
    const err = new Error('Cannot set FIPS mode in a WASM environment');
    err.code = 'ERR_CRYPTO_FIPS_FORCED';
    throw err;
}

export const fips = false;

export const subtle = {};
export const webcrypto = { getRandomValues, subtle };
