// Web Crypto algorithm names supported by KeyObject#toCryptoKey, keyed by their
// upper-case spelling for case-insensitive lookup.
export const TO_CRYPTO_KEY_ALGORITHM_NAMES = {
    'AES-CTR': 'AES-CTR',
    'AES-CBC': 'AES-CBC',
    'AES-GCM': 'AES-GCM',
    'AES-KW': 'AES-KW',
    'PBKDF2': 'PBKDF2',
    'HKDF': 'HKDF',
    'HMAC': 'HMAC',
    'ED25519': 'Ed25519',
    'ED448': 'Ed448',
    'X25519': 'X25519',
    'X448': 'X448',
    'RSASSA-PKCS1-V1_5': 'RSASSA-PKCS1-v1_5',
    'RSA-PSS': 'RSA-PSS',
    'RSA-OAEP': 'RSA-OAEP',
    'ECDH': 'ECDH',
    'ECDSA': 'ECDSA',
};

// Mirrors the shape of Node's internal/crypto/util kSupportedAlgorithms for the
// operations exposed here: each operation maps a supported algorithm name to null.
function namesOf(names) {
    const table = { __proto__: null };
    for (const name of names) table[name] = null;
    return table;
}

export const kSupportedAlgorithms = {
    digest: namesOf(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']),
    importKey: namesOf(Object.values(TO_CRYPTO_KEY_ALGORITHM_NAMES)),
};
