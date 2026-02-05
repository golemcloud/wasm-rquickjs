import * as webCryptoNative from '__wasm_rquickjs_builtin/web_crypto_native'

class Hash {
    constructor(algorithm) {
        if (algorithm !== 'sha256') {
            throw new Error(`Digest method not supported: ${algorithm}`);
        }
        this._algorithm = algorithm;
        this._data = [];
        this._finalized = false;
    }

    update(data, inputEncoding) {
        if (this._finalized) {
            throw new Error('Digest already called');
        }
        
        let bytes;
        if (typeof data === 'string') {
            const encoder = new TextEncoder();
            bytes = encoder.encode(data);
        } else if (data instanceof Uint8Array) {
            bytes = data;
        } else if (ArrayBuffer.isView(data)) {
            bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else if (data instanceof ArrayBuffer) {
            bytes = new Uint8Array(data);
        } else {
            throw new TypeError('Data must be a string, Buffer, TypedArray, or ArrayBuffer');
        }
        
        this._data.push(bytes);
        return this;
    }

    digest(encoding) {
        if (this._finalized) {
            throw new Error('Digest already called');
        }
        this._finalized = true;
        
        const totalLength = this._data.reduce((acc, arr) => acc + arr.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of this._data) {
            combined.set(arr, offset);
            offset += arr.length;
        }
        
        const hashBytes = webCryptoNative.sha256_digest(combined);
        const result = new Uint8Array(hashBytes);
        
        if (encoding === 'hex') {
            return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        } else if (encoding === 'base64') {
            let binary = '';
            for (let i = 0; i < result.length; i++) {
                binary += String.fromCharCode(result[i]);
            }
            return btoa(binary);
        } else if (encoding === 'latin1' || encoding === 'binary') {
            let str = '';
            for (let i = 0; i < result.length; i++) {
                str += String.fromCharCode(result[i]);
            }
            return str;
        } else {
            return result;
        }
    }

    copy() {
        if (this._finalized) {
            throw new Error('Digest already called');
        }
        const newHash = new Hash(this._algorithm);
        newHash._data = this._data.map(arr => new Uint8Array(arr));
        return newHash;
    }
}

export function createHash(algorithm) {
    return new Hash(algorithm);
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
