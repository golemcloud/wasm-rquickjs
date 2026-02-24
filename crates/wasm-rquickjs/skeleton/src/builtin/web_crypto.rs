use rand::RngCore;
use rquickjs::TypedArray;
use std::collections::HashMap;
use std::slice;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{LazyLock, Mutex};

use base64ct::Encoding;
use digest::Digest;
use hmac::{Hmac, Mac};
use md5::Md5;
use ripemd::Ripemd160;
use sha1::Sha1;
use sha2::{Sha224, Sha256, Sha384, Sha512};
use sha3::{Sha3_256, Sha3_384, Sha3_512};

use ecdsa::signature::Signer;
use ecdsa::signature::Verifier;
use ed25519_dalek::{SigningKey as Ed25519SigningKey, VerifyingKey as Ed25519VerifyingKey};
use rsa::{RsaPrivateKey, RsaPublicKey};

use num_bigint_dig::{BigUint, RandPrime};
use num_traits::{One, Zero};

enum HashContext {
    Md5(Md5),
    Sha1(Sha1),
    Sha224(Sha224),
    Sha256(Sha256),
    Sha384(Sha384),
    Sha512(Sha512),
    Sha3_256(Sha3_256),
    Sha3_384(Sha3_384),
    Sha3_512(Sha3_512),
    Ripemd160(Ripemd160),
}

impl HashContext {
    fn update(&mut self, data: &[u8]) {
        match self {
            HashContext::Md5(h) => h.update(data),
            HashContext::Sha1(h) => h.update(data),
            HashContext::Sha224(h) => h.update(data),
            HashContext::Sha256(h) => h.update(data),
            HashContext::Sha384(h) => h.update(data),
            HashContext::Sha512(h) => h.update(data),
            HashContext::Sha3_256(h) => h.update(data),
            HashContext::Sha3_384(h) => h.update(data),
            HashContext::Sha3_512(h) => h.update(data),
            HashContext::Ripemd160(h) => h.update(data),
        }
    }

    fn finalize(self) -> Vec<u8> {
        match self {
            HashContext::Md5(h) => h.finalize().to_vec(),
            HashContext::Sha1(h) => h.finalize().to_vec(),
            HashContext::Sha224(h) => h.finalize().to_vec(),
            HashContext::Sha256(h) => h.finalize().to_vec(),
            HashContext::Sha384(h) => h.finalize().to_vec(),
            HashContext::Sha512(h) => h.finalize().to_vec(),
            HashContext::Sha3_256(h) => h.finalize().to_vec(),
            HashContext::Sha3_384(h) => h.finalize().to_vec(),
            HashContext::Sha3_512(h) => h.finalize().to_vec(),
            HashContext::Ripemd160(h) => h.finalize().to_vec(),
        }
    }

    fn clone_context(&self) -> HashContext {
        match self {
            HashContext::Md5(h) => HashContext::Md5(h.clone()),
            HashContext::Sha1(h) => HashContext::Sha1(h.clone()),
            HashContext::Sha224(h) => HashContext::Sha224(h.clone()),
            HashContext::Sha256(h) => HashContext::Sha256(h.clone()),
            HashContext::Sha384(h) => HashContext::Sha384(h.clone()),
            HashContext::Sha512(h) => HashContext::Sha512(h.clone()),
            HashContext::Sha3_256(h) => HashContext::Sha3_256(h.clone()),
            HashContext::Sha3_384(h) => HashContext::Sha3_384(h.clone()),
            HashContext::Sha3_512(h) => HashContext::Sha3_512(h.clone()),
            HashContext::Ripemd160(h) => HashContext::Ripemd160(h.clone()),
        }
    }
}

fn create_hasher(algorithm: &str) -> Option<HashContext> {
    match algorithm {
        "md5" => Some(HashContext::Md5(Md5::new())),
        "sha1" => Some(HashContext::Sha1(Sha1::new())),
        "sha224" => Some(HashContext::Sha224(Sha224::new())),
        "sha256" => Some(HashContext::Sha256(Sha256::new())),
        "sha384" => Some(HashContext::Sha384(Sha384::new())),
        "sha512" => Some(HashContext::Sha512(Sha512::new())),
        "sha3-256" => Some(HashContext::Sha3_256(Sha3_256::new())),
        "sha3-384" => Some(HashContext::Sha3_384(Sha3_384::new())),
        "sha3-512" => Some(HashContext::Sha3_512(Sha3_512::new())),
        "ripemd160" => Some(HashContext::Ripemd160(Ripemd160::new())),
        _ => None,
    }
}

const SUPPORTED_HASHES: &[&str] = &[
    "md5",
    "sha1",
    "sha224",
    "sha256",
    "sha384",
    "sha512",
    "sha3-256",
    "sha3-384",
    "sha3-512",
    "ripemd160",
];

static NEXT_HANDLE: AtomicU32 = AtomicU32::new(1);
static CONTEXTS: LazyLock<Mutex<HashMap<u32, HashContext>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn next_id() -> u32 {
    NEXT_HANDLE.fetch_add(1, Ordering::Relaxed)
}

fn hash_init_impl(algorithm: &str) -> Option<u32> {
    let algo = algorithm.to_lowercase();
    create_hasher(&algo).map(|hasher| {
        let id = next_id();
        CONTEXTS.lock().unwrap().insert(id, hasher);
        id
    })
}

fn hash_update_impl(id: u32, data: &[u8]) -> bool {
    if let Some(hasher) = CONTEXTS.lock().unwrap().get_mut(&id) {
        hasher.update(data);
        true
    } else {
        false
    }
}

fn hash_final_impl(id: u32) -> Option<Vec<u8>> {
    CONTEXTS.lock().unwrap().remove(&id).map(|h| h.finalize())
}

fn hash_copy_impl(id: u32) -> Option<u32> {
    let cloned = {
        let contexts = CONTEXTS.lock().unwrap();
        contexts.get(&id).map(|hasher| hasher.clone_context())
    };
    cloned.map(|c| {
        let new_id = next_id();
        CONTEXTS.lock().unwrap().insert(new_id, c);
        new_id
    })
}

enum HmacContext {
    Md5(Hmac<Md5>),
    Sha1(Hmac<Sha1>),
    Sha224(Hmac<Sha224>),
    Sha256(Hmac<Sha256>),
    Sha384(Hmac<Sha384>),
    Sha512(Hmac<Sha512>),
    Sha3_256(Hmac<Sha3_256>),
    Sha3_384(Hmac<Sha3_384>),
    Sha3_512(Hmac<Sha3_512>),
    Ripemd160(Hmac<Ripemd160>),
}

impl HmacContext {
    fn update(&mut self, data: &[u8]) {
        match self {
            HmacContext::Md5(h) => h.update(data),
            HmacContext::Sha1(h) => h.update(data),
            HmacContext::Sha224(h) => h.update(data),
            HmacContext::Sha256(h) => h.update(data),
            HmacContext::Sha384(h) => h.update(data),
            HmacContext::Sha512(h) => h.update(data),
            HmacContext::Sha3_256(h) => h.update(data),
            HmacContext::Sha3_384(h) => h.update(data),
            HmacContext::Sha3_512(h) => h.update(data),
            HmacContext::Ripemd160(h) => h.update(data),
        }
    }

    fn finalize(self) -> Vec<u8> {
        match self {
            HmacContext::Md5(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha1(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha224(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha256(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha384(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha512(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha3_256(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha3_384(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Sha3_512(h) => h.finalize().into_bytes().to_vec(),
            HmacContext::Ripemd160(h) => h.finalize().into_bytes().to_vec(),
        }
    }
}

fn create_hmac(algorithm: &str, key: &[u8]) -> Option<HmacContext> {
    match algorithm {
        "md5" => Some(HmacContext::Md5(
            <Hmac<Md5> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha1" => Some(HmacContext::Sha1(
            <Hmac<Sha1> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha224" => Some(HmacContext::Sha224(
            <Hmac<Sha224> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha256" => Some(HmacContext::Sha256(
            <Hmac<Sha256> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha384" => Some(HmacContext::Sha384(
            <Hmac<Sha384> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha512" => Some(HmacContext::Sha512(
            <Hmac<Sha512> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha3-256" => Some(HmacContext::Sha3_256(
            <Hmac<Sha3_256> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha3-384" => Some(HmacContext::Sha3_384(
            <Hmac<Sha3_384> as Mac>::new_from_slice(key).unwrap(),
        )),
        "sha3-512" => Some(HmacContext::Sha3_512(
            <Hmac<Sha3_512> as Mac>::new_from_slice(key).unwrap(),
        )),
        "ripemd160" => Some(HmacContext::Ripemd160(
            <Hmac<Ripemd160> as Mac>::new_from_slice(key).unwrap(),
        )),
        _ => None,
    }
}

static HMAC_CONTEXTS: LazyLock<Mutex<HashMap<u32, HmacContext>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn hmac_init_impl(algorithm: &str, key: &[u8]) -> Option<u32> {
    let algo = algorithm.to_lowercase();
    create_hmac(&algo, key).map(|ctx| {
        let id = next_id();
        HMAC_CONTEXTS.lock().unwrap().insert(id, ctx);
        id
    })
}

fn hmac_update_impl(id: u32, data: &[u8]) -> bool {
    if let Some(ctx) = HMAC_CONTEXTS.lock().unwrap().get_mut(&id) {
        ctx.update(data);
        true
    } else {
        false
    }
}

fn hmac_final_impl(id: u32) -> Option<Vec<u8>> {
    HMAC_CONTEXTS
        .lock()
        .unwrap()
        .remove(&id)
        .map(|h| h.finalize())
}

fn pbkdf2_derive_impl(
    algorithm: &str,
    password: &[u8],
    salt: &[u8],
    iterations: u32,
    keylen: u32,
) -> Option<Vec<u8>> {
    let algo = algorithm.to_lowercase();
    let mut result = vec![0u8; keylen as usize];
    match algo.as_str() {
        "md5" => pbkdf2::pbkdf2_hmac::<Md5>(password, salt, iterations, &mut result),
        "sha1" => pbkdf2::pbkdf2_hmac::<Sha1>(password, salt, iterations, &mut result),
        "sha224" => pbkdf2::pbkdf2_hmac::<Sha224>(password, salt, iterations, &mut result),
        "sha256" => pbkdf2::pbkdf2_hmac::<Sha256>(password, salt, iterations, &mut result),
        "sha384" => pbkdf2::pbkdf2_hmac::<Sha384>(password, salt, iterations, &mut result),
        "sha512" => pbkdf2::pbkdf2_hmac::<Sha512>(password, salt, iterations, &mut result),
        "sha3-256" => pbkdf2::pbkdf2_hmac::<Sha3_256>(password, salt, iterations, &mut result),
        "sha3-384" => pbkdf2::pbkdf2_hmac::<Sha3_384>(password, salt, iterations, &mut result),
        "sha3-512" => pbkdf2::pbkdf2_hmac::<Sha3_512>(password, salt, iterations, &mut result),
        "ripemd160" => pbkdf2::pbkdf2_hmac::<Ripemd160>(password, salt, iterations, &mut result),
        _ => return None,
    }
    Some(result)
}

fn hkdf_derive_impl(
    algorithm: &str,
    ikm: &[u8],
    salt: &[u8],
    info: &[u8],
    keylen: u32,
) -> Option<Vec<u8>> {
    let algo = algorithm.to_lowercase();
    let mut result = vec![0u8; keylen as usize];
    macro_rules! do_hkdf {
        ($hash:ty) => {{
            let hk = hkdf::Hkdf::<$hash>::new(if salt.is_empty() { None } else { Some(salt) }, ikm);
            hk.expand(info, &mut result).ok()?;
        }};
    }
    match algo.as_str() {
        "md5" => do_hkdf!(Md5),
        "sha1" => do_hkdf!(Sha1),
        "sha224" => do_hkdf!(Sha224),
        "sha256" => do_hkdf!(Sha256),
        "sha384" => do_hkdf!(Sha384),
        "sha512" => do_hkdf!(Sha512),
        "sha3-256" => do_hkdf!(Sha3_256),
        "sha3-384" => do_hkdf!(Sha3_384),
        "sha3-512" => do_hkdf!(Sha3_512),
        "ripemd160" => do_hkdf!(Ripemd160),
        _ => return None,
    }
    Some(result)
}

fn scrypt_derive_impl(
    password: &[u8],
    salt: &[u8],
    n: u32,
    r: u32,
    p: u32,
    keylen: u32,
) -> Option<Vec<u8>> {
    // Node.js takes N directly; the Rust crate needs log2(N)
    if n == 0 || (n & (n - 1)) != 0 {
        return None; // N must be a power of 2
    }
    let log_n = (n as f64).log2() as u8;
    // scrypt crate's Params::new requires len in 10..=64 but that field is only used
    // for the password hasher, not the raw scrypt() function. We pass a valid dummy.
    let params = scrypt::Params::new(log_n, r, p, keylen.max(10) as usize).ok()?;
    let mut result = vec![0u8; keylen as usize];
    scrypt::scrypt(password, salt, &params, &mut result).ok()?;
    Some(result)
}

const AES_WRAP_DEFAULT_IV: [u8; 8] = [0xA6; 8];
const AES_WRAP_PAD_DEFAULT_IV_PREFIX: [u8; 4] = [0xA6, 0x59, 0x59, 0xA6];

fn aes_encrypt_block(key: &[u8], block: &mut [u8; 16]) -> Option<()> {
    use aes::cipher::BlockEncrypt;
    use aes::cipher::KeyInit;

    match key.len() {
        16 => {
            let cipher = aes::Aes128::new_from_slice(key).ok()?;
            let mut ga = aes::Block::default();
            ga.copy_from_slice(block);
            cipher.encrypt_block(&mut ga);
            block.copy_from_slice(&ga);
            Some(())
        }
        24 => {
            let cipher = aes::Aes192::new_from_slice(key).ok()?;
            let mut ga = aes::Block::default();
            ga.copy_from_slice(block);
            cipher.encrypt_block(&mut ga);
            block.copy_from_slice(&ga);
            Some(())
        }
        32 => {
            let cipher = aes::Aes256::new_from_slice(key).ok()?;
            let mut ga = aes::Block::default();
            ga.copy_from_slice(block);
            cipher.encrypt_block(&mut ga);
            block.copy_from_slice(&ga);
            Some(())
        }
        _ => None,
    }
}

fn aes_decrypt_block(key: &[u8], block: &mut [u8; 16]) -> Option<()> {
    use aes::cipher::BlockDecrypt;
    use aes::cipher::KeyInit;

    match key.len() {
        16 => {
            let cipher = aes::Aes128::new_from_slice(key).ok()?;
            let mut ga = aes::Block::default();
            ga.copy_from_slice(block);
            cipher.decrypt_block(&mut ga);
            block.copy_from_slice(&ga);
            Some(())
        }
        24 => {
            let cipher = aes::Aes192::new_from_slice(key).ok()?;
            let mut ga = aes::Block::default();
            ga.copy_from_slice(block);
            cipher.decrypt_block(&mut ga);
            block.copy_from_slice(&ga);
            Some(())
        }
        32 => {
            let cipher = aes::Aes256::new_from_slice(key).ok()?;
            let mut ga = aes::Block::default();
            ga.copy_from_slice(block);
            cipher.decrypt_block(&mut ga);
            block.copy_from_slice(&ga);
            Some(())
        }
        _ => None,
    }
}

fn aes_wrap_nopad_encrypt(key: &[u8], iv: [u8; 8], plaintext: &[u8]) -> Option<Vec<u8>> {
    if plaintext.len() < 16 || plaintext.len() % 8 != 0 {
        return None;
    }

    let n = plaintext.len() / 8;
    let mut a = iv;
    let mut r: Vec<[u8; 8]> = plaintext
        .chunks_exact(8)
        .map(|chunk| {
            let mut block = [0u8; 8];
            block.copy_from_slice(chunk);
            block
        })
        .collect();

    for j in 0..6 {
        for (i, ri) in r.iter_mut().enumerate() {
            let mut b = [0u8; 16];
            b[..8].copy_from_slice(&a);
            b[8..].copy_from_slice(ri);
            aes_encrypt_block(key, &mut b)?;

            let t = ((n * j) + (i + 1)) as u64;
            let t_bytes = t.to_be_bytes();
            for k in 0..8 {
                a[k] = b[k] ^ t_bytes[k];
            }
            ri.copy_from_slice(&b[8..]);
        }
    }

    let mut out = Vec::with_capacity((n + 1) * 8);
    out.extend_from_slice(&a);
    for block in r {
        out.extend_from_slice(&block);
    }
    Some(out)
}

fn aes_wrap_nopad_unwrap_raw(key: &[u8], ciphertext: &[u8]) -> Option<([u8; 8], Vec<u8>)> {
    if ciphertext.len() < 16 || ciphertext.len() % 8 != 0 {
        return None;
    }

    let n = (ciphertext.len() / 8).checked_sub(1)?;
    if n == 0 {
        return None;
    }

    let mut a = [0u8; 8];
    a.copy_from_slice(&ciphertext[..8]);
    let mut r: Vec<[u8; 8]> = ciphertext[8..]
        .chunks_exact(8)
        .map(|chunk| {
            let mut block = [0u8; 8];
            block.copy_from_slice(chunk);
            block
        })
        .collect();

    for j in (0..6).rev() {
        for i in (0..n).rev() {
            let t = ((n * j) + (i + 1)) as u64;
            let t_bytes = t.to_be_bytes();
            let mut b = [0u8; 16];
            for k in 0..8 {
                b[k] = a[k] ^ t_bytes[k];
            }
            b[8..].copy_from_slice(&r[i]);
            aes_decrypt_block(key, &mut b)?;
            a.copy_from_slice(&b[..8]);
            r[i].copy_from_slice(&b[8..]);
        }
    }

    let mut plaintext = Vec::with_capacity(n * 8);
    for block in r {
        plaintext.extend_from_slice(&block);
    }

    Some((a, plaintext))
}

fn aes_wrap_nopad_decrypt(key: &[u8], iv: [u8; 8], ciphertext: &[u8]) -> Option<Vec<u8>> {
    if ciphertext.len() < 24 || ciphertext.len() % 8 != 0 {
        return None;
    }

    let (a, plaintext) = aes_wrap_nopad_unwrap_raw(key, ciphertext)?;
    if a != iv {
        return None;
    }

    Some(plaintext)
}

fn aes_wrap_pad_encrypt(key: &[u8], iv_prefix: [u8; 4], plaintext: &[u8]) -> Option<Vec<u8>> {
    if plaintext.is_empty() {
        return None;
    }

    let mli = u32::try_from(plaintext.len()).ok()?;
    let mut aiv = [0u8; 8];
    aiv[..4].copy_from_slice(&iv_prefix);
    aiv[4..].copy_from_slice(&mli.to_be_bytes());

    if plaintext.len() <= 8 {
        let mut block = [0u8; 16];
        block[..8].copy_from_slice(&aiv);
        block[8..8 + plaintext.len()].copy_from_slice(plaintext);
        aes_encrypt_block(key, &mut block)?;
        return Some(block.to_vec());
    }

    let n = plaintext.len().div_ceil(8);
    let mut padded = Vec::with_capacity(n * 8);
    padded.extend_from_slice(plaintext);
    padded.resize(n * 8, 0);
    aes_wrap_nopad_encrypt(key, aiv, &padded)
}

fn aes_wrap_pad_decrypt(key: &[u8], iv_prefix: [u8; 4], ciphertext: &[u8]) -> Option<Vec<u8>> {
    if ciphertext.len() < 16 || ciphertext.len() % 8 != 0 {
        return None;
    }

    let (aiv, padded_plaintext) = if ciphertext.len() == 16 {
        let mut block = [0u8; 16];
        block.copy_from_slice(ciphertext);
        aes_decrypt_block(key, &mut block)?;
        let mut aiv = [0u8; 8];
        aiv.copy_from_slice(&block[..8]);
        (aiv, block[8..].to_vec())
    } else {
        aes_wrap_nopad_unwrap_raw(key, ciphertext)?
    };

    if aiv[..4] != iv_prefix {
        return None;
    }

    let mli = u32::from_be_bytes(aiv[4..8].try_into().ok()?) as usize;
    let n = padded_plaintext.len() / 8;

    if mli == 0 || mli > n * 8 || mli <= (n.saturating_sub(1) * 8) {
        return None;
    }

    if padded_plaintext[mli..].iter().any(|&b| b != 0) {
        return None;
    }

    let mut plaintext = padded_plaintext;
    plaintext.truncate(mli);
    Some(plaintext)
}

const GCM_R: u128 = 0xE100_0000_0000_0000_0000_0000_0000_0000;

fn normalize_chacha_nonce(iv: &[u8]) -> Option<[u8; 12]> {
    if iv.is_empty() || iv.len() > 12 {
        return None;
    }
    let mut nonce = [0u8; 12];
    nonce[12 - iv.len()..].copy_from_slice(iv);
    Some(nonce)
}

fn gcm_mul(mut x: u128, mut y: u128) -> u128 {
    let mut z = 0u128;
    for _ in 0..128 {
        if (x & (1u128 << 127)) != 0 {
            z ^= y;
        }
        let lsb = y & 1;
        y >>= 1;
        if lsb == 1 {
            y ^= GCM_R;
        }
        x <<= 1;
    }
    z
}

fn gcm_ghash(h: u128, aad: &[u8], ciphertext: &[u8]) -> [u8; 16] {
    let mut input = Vec::with_capacity(
        aad.len()
            + ciphertext.len()
            + (16 - (aad.len() % 16)) % 16
            + (16 - (ciphertext.len() % 16)) % 16
            + 16,
    );

    input.extend_from_slice(aad);
    if aad.len() % 16 != 0 {
        input.resize(input.len() + (16 - (aad.len() % 16)), 0);
    }

    input.extend_from_slice(ciphertext);
    if ciphertext.len() % 16 != 0 {
        input.resize(input.len() + (16 - (ciphertext.len() % 16)), 0);
    }

    input.extend_from_slice(&(aad.len() as u64 * 8).to_be_bytes());
    input.extend_from_slice(&(ciphertext.len() as u64 * 8).to_be_bytes());

    let mut y = 0u128;
    for block in input.chunks_exact(16) {
        let mut b = [0u8; 16];
        b.copy_from_slice(block);
        y ^= u128::from_be_bytes(b);
        y = gcm_mul(y, h);
    }
    y.to_be_bytes()
}

fn gcm_compute_j0(h: u128, iv: &[u8]) -> [u8; 16] {
    if iv.len() == 12 {
        let mut j0 = [0u8; 16];
        j0[..12].copy_from_slice(iv);
        j0[15] = 1;
        return j0;
    }

    let mut input = Vec::with_capacity(iv.len() + (16 - (iv.len() % 16)) % 16 + 16);
    input.extend_from_slice(iv);
    if iv.len() % 16 != 0 {
        input.resize(input.len() + (16 - (iv.len() % 16)), 0);
    }
    input.extend_from_slice(&0u64.to_be_bytes());
    input.extend_from_slice(&(iv.len() as u64 * 8).to_be_bytes());

    let mut y = 0u128;
    for block in input.chunks_exact(16) {
        let mut b = [0u8; 16];
        b.copy_from_slice(block);
        y ^= u128::from_be_bytes(b);
        y = gcm_mul(y, h);
    }
    y.to_be_bytes()
}

fn gcm_inc32(counter: &mut [u8; 16]) {
    let mut n = u32::from_be_bytes(counter[12..16].try_into().unwrap());
    n = n.wrapping_add(1);
    counter[12..16].copy_from_slice(&n.to_be_bytes());
}

fn gcm_ctr_xor(key: &[u8], j0: [u8; 16], input: &[u8]) -> Option<Vec<u8>> {
    let mut counter = j0;
    gcm_inc32(&mut counter);
    let mut output = Vec::with_capacity(input.len());

    for chunk in input.chunks(16) {
        let mut keystream = counter;
        aes_encrypt_block(key, &mut keystream)?;
        for i in 0..chunk.len() {
            output.push(chunk[i] ^ keystream[i]);
        }
        gcm_inc32(&mut counter);
    }

    Some(output)
}

fn gcm_compute_tag(key: &[u8], iv: &[u8], aad: &[u8], ciphertext: &[u8]) -> Option<[u8; 16]> {
    let mut h_block = [0u8; 16];
    aes_encrypt_block(key, &mut h_block)?;
    let h = u128::from_be_bytes(h_block);

    let j0 = gcm_compute_j0(h, iv);
    let s = gcm_ghash(h, aad, ciphertext);

    let mut e_j0 = j0;
    aes_encrypt_block(key, &mut e_j0)?;

    let mut tag = [0u8; 16];
    for i in 0..16 {
        tag[i] = e_j0[i] ^ s[i];
    }
    Some(tag)
}

fn gcm_encrypt_detached(
    key: &[u8],
    iv: &[u8],
    aad: &[u8],
    plaintext: &[u8],
) -> Option<(Vec<u8>, Vec<u8>)> {
    if iv.is_empty() {
        return None;
    }
    let mut h_block = [0u8; 16];
    aes_encrypt_block(key, &mut h_block)?;
    let h = u128::from_be_bytes(h_block);
    let j0 = gcm_compute_j0(h, iv);

    let ciphertext = gcm_ctr_xor(key, j0, plaintext)?;
    let tag = gcm_compute_tag(key, iv, aad, &ciphertext)?;
    Some((ciphertext, tag.to_vec()))
}

fn gcm_decrypt_detached(
    key: &[u8],
    iv: &[u8],
    aad: &[u8],
    ciphertext: &[u8],
    tag_prefix: &[u8],
) -> Option<Vec<u8>> {
    use subtle::ConstantTimeEq;

    if iv.is_empty() || tag_prefix.is_empty() || tag_prefix.len() > 16 {
        return None;
    }
    let computed_tag = gcm_compute_tag(key, iv, aad, ciphertext)?;
    if !bool::from(tag_prefix.ct_eq(&computed_tag[..tag_prefix.len()])) {
        return None;
    }

    let mut h_block = [0u8; 16];
    aes_encrypt_block(key, &mut h_block)?;
    let h = u128::from_be_bytes(h_block);
    let j0 = gcm_compute_j0(h, iv);
    gcm_ctr_xor(key, j0, ciphertext)
}

fn gcm_stream_xor_with_offset(
    key: &[u8],
    iv: &[u8],
    input: &[u8],
    offset: usize,
) -> Option<Vec<u8>> {
    if iv.is_empty() {
        return None;
    }

    let mut h_block = [0u8; 16];
    aes_encrypt_block(key, &mut h_block)?;
    let h = u128::from_be_bytes(h_block);
    let j0 = gcm_compute_j0(h, iv);
    let base_counter = u32::from_be_bytes(j0[12..16].try_into().unwrap());

    let mut output = Vec::with_capacity(input.len());
    let mut processed = 0usize;
    while processed < input.len() {
        let absolute = offset + processed;
        let block_index = absolute / 16;
        let in_block_offset = absolute % 16;

        let mut counter = j0;
        let counter_word = base_counter.wrapping_add((block_index as u32).wrapping_add(1));
        counter[12..16].copy_from_slice(&counter_word.to_be_bytes());

        let mut keystream = counter;
        aes_encrypt_block(key, &mut keystream)?;

        let take = std::cmp::min(16 - in_block_offset, input.len() - processed);
        for i in 0..take {
            output.push(input[processed + i] ^ keystream[in_block_offset + i]);
        }
        processed += take;
    }

    Some(output)
}

fn chacha20poly1305_encrypt_detached(
    key: &[u8; 32],
    nonce: &[u8; 12],
    aad: &[u8],
    plaintext: &[u8],
) -> Option<(Vec<u8>, Vec<u8>)> {
    use chacha20poly1305::KeyInit;
    use chacha20poly1305::aead::AeadInPlace;

    let cipher = chacha20poly1305::ChaCha20Poly1305::new_from_slice(key).ok()?;
    let mut ciphertext = plaintext.to_vec();
    let nonce = chacha20poly1305::Nonce::from_slice(nonce);
    let tag = cipher
        .encrypt_in_place_detached(nonce, aad, &mut ciphertext)
        .ok()?;

    Some((ciphertext, tag.to_vec()))
}

fn chacha20poly1305_decrypt_detached(
    key: &[u8; 32],
    nonce: &[u8; 12],
    aad: &[u8],
    ciphertext: &[u8],
    tag_prefix: &[u8],
) -> Option<Vec<u8>> {
    use subtle::ConstantTimeEq;

    if tag_prefix.is_empty() || tag_prefix.len() > 16 {
        return None;
    }

    let plaintext = chacha20_stream_xor_with_offset(key, nonce, ciphertext, 0)?;

    let (recomputed_ciphertext, recomputed_tag) =
        chacha20poly1305_encrypt_detached(key, nonce, aad, &plaintext)?;
    if recomputed_ciphertext != ciphertext {
        return None;
    }
    if !bool::from(tag_prefix.ct_eq(&recomputed_tag[..tag_prefix.len()])) {
        return None;
    }

    Some(plaintext)
}

fn chacha20_stream_xor_with_offset(
    key: &[u8; 32],
    nonce: &[u8; 12],
    input: &[u8],
    offset: usize,
) -> Option<Vec<u8>> {
    use chacha20::cipher::{KeyIvInit, StreamCipher, StreamCipherSeek};

    let mut stream = chacha20::ChaCha20::new_from_slices(key, nonce).ok()?;
    stream.seek(64u64.wrapping_add(offset as u64));
    let mut output = input.to_vec();
    stream.apply_keystream(&mut output);
    Some(output)
}

enum CipherContext {
    // AEAD encrypt
    Aes128GcmEnc {
        key: [u8; 16],
        iv: Vec<u8>,
        aad: Vec<u8>,
        processed_len: usize,
        buf: Vec<u8>,
        tag: Option<Vec<u8>>,
    },
    Aes256GcmEnc {
        key: [u8; 32],
        iv: Vec<u8>,
        aad: Vec<u8>,
        processed_len: usize,
        buf: Vec<u8>,
        tag: Option<Vec<u8>>,
    },
    ChaCha20Poly1305Enc {
        key: [u8; 32],
        nonce: [u8; 12],
        aad: Vec<u8>,
        processed_len: usize,
        buf: Vec<u8>,
        tag: Option<Vec<u8>>,
    },
    // AEAD decrypt
    Aes128GcmDec {
        key: [u8; 16],
        iv: Vec<u8>,
        aad: Vec<u8>,
        processed_len: usize,
        buf: Vec<u8>,
        expected_tag: Option<Vec<u8>>,
    },
    Aes256GcmDec {
        key: [u8; 32],
        iv: Vec<u8>,
        aad: Vec<u8>,
        processed_len: usize,
        buf: Vec<u8>,
        expected_tag: Option<Vec<u8>>,
    },
    ChaCha20Poly1305Dec {
        key: [u8; 32],
        nonce: [u8; 12],
        aad: Vec<u8>,
        processed_len: usize,
        buf: Vec<u8>,
        expected_tag: Option<Vec<u8>>,
    },
    // CBC
    Aes128CbcEnc {
        enc: cbc::Encryptor<aes::Aes128>,
        tail: Vec<u8>,
        auto_padding: bool,
    },
    Aes256CbcEnc {
        enc: cbc::Encryptor<aes::Aes256>,
        tail: Vec<u8>,
        auto_padding: bool,
    },
    Aes128CbcDec {
        dec: cbc::Decryptor<aes::Aes128>,
        tail: Vec<u8>,
        auto_padding: bool,
    },
    Aes256CbcDec {
        dec: cbc::Decryptor<aes::Aes256>,
        tail: Vec<u8>,
        auto_padding: bool,
    },
    // CTR
    Aes128CtrCtx {
        stream: ctr::Ctr128BE<aes::Aes128>,
    },
    Aes256CtrCtx {
        stream: ctr::Ctr128BE<aes::Aes256>,
    },
    // AES Key Wrap (RFC 3394)
    AesKwEnc {
        key: Vec<u8>,
        iv: [u8; 8],
    },
    AesKwDec {
        key: Vec<u8>,
        iv: [u8; 8],
    },
    // AES Key Wrap with Padding (RFC 5649)
    AesKwpEnc {
        key: Vec<u8>,
        iv_prefix: [u8; 4],
    },
    AesKwpDec {
        key: Vec<u8>,
        iv_prefix: [u8; 4],
    },
}

static CIPHER_CONTEXTS: LazyLock<Mutex<HashMap<u32, CipherContext>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn cipher_init_impl(algorithm: &str, key: &[u8], iv: &[u8], decrypt: bool) -> Option<u32> {
    use cipher::KeyIvInit;

    let ctx = match algorithm {
        "aes-128-gcm" => {
            if key.len() != 16 || iv.is_empty() {
                return None;
            }
            let mut key_bytes = [0u8; 16];
            key_bytes.copy_from_slice(key);
            if decrypt {
                CipherContext::Aes128GcmDec {
                    key: key_bytes,
                    iv: iv.to_vec(),
                    aad: Vec::new(),
                    processed_len: 0,
                    buf: Vec::new(),
                    expected_tag: None,
                }
            } else {
                CipherContext::Aes128GcmEnc {
                    key: key_bytes,
                    iv: iv.to_vec(),
                    aad: Vec::new(),
                    processed_len: 0,
                    buf: Vec::new(),
                    tag: None,
                }
            }
        }
        "aes-256-gcm" => {
            if key.len() != 32 || iv.is_empty() {
                return None;
            }
            let mut key_bytes = [0u8; 32];
            key_bytes.copy_from_slice(key);
            if decrypt {
                CipherContext::Aes256GcmDec {
                    key: key_bytes,
                    iv: iv.to_vec(),
                    aad: Vec::new(),
                    processed_len: 0,
                    buf: Vec::new(),
                    expected_tag: None,
                }
            } else {
                CipherContext::Aes256GcmEnc {
                    key: key_bytes,
                    iv: iv.to_vec(),
                    aad: Vec::new(),
                    processed_len: 0,
                    buf: Vec::new(),
                    tag: None,
                }
            }
        }
        "chacha20-poly1305" => {
            if key.len() != 32 {
                return None;
            }
            let nonce = normalize_chacha_nonce(iv)?;
            let mut key_bytes = [0u8; 32];
            key_bytes.copy_from_slice(key);
            if decrypt {
                CipherContext::ChaCha20Poly1305Dec {
                    key: key_bytes,
                    nonce,
                    aad: Vec::new(),
                    processed_len: 0,
                    buf: Vec::new(),
                    expected_tag: None,
                }
            } else {
                CipherContext::ChaCha20Poly1305Enc {
                    key: key_bytes,
                    nonce,
                    aad: Vec::new(),
                    processed_len: 0,
                    buf: Vec::new(),
                    tag: None,
                }
            }
        }
        "aes-128-cbc" => {
            if key.len() != 16 || iv.len() != 16 {
                return None;
            }
            if decrypt {
                let dec = cbc::Decryptor::<aes::Aes128>::new_from_slices(key, iv).ok()?;
                CipherContext::Aes128CbcDec {
                    dec,
                    tail: Vec::new(),
                    auto_padding: true,
                }
            } else {
                let enc = cbc::Encryptor::<aes::Aes128>::new_from_slices(key, iv).ok()?;
                CipherContext::Aes128CbcEnc {
                    enc,
                    tail: Vec::new(),
                    auto_padding: true,
                }
            }
        }
        "aes-256-cbc" => {
            if key.len() != 32 || iv.len() != 16 {
                return None;
            }
            if decrypt {
                let dec = cbc::Decryptor::<aes::Aes256>::new_from_slices(key, iv).ok()?;
                CipherContext::Aes256CbcDec {
                    dec,
                    tail: Vec::new(),
                    auto_padding: true,
                }
            } else {
                let enc = cbc::Encryptor::<aes::Aes256>::new_from_slices(key, iv).ok()?;
                CipherContext::Aes256CbcEnc {
                    enc,
                    tail: Vec::new(),
                    auto_padding: true,
                }
            }
        }
        "aes-128-ctr" => {
            if key.len() != 16 || iv.len() != 16 {
                return None;
            }
            let stream = ctr::Ctr128BE::<aes::Aes128>::new_from_slices(key, iv).ok()?;
            CipherContext::Aes128CtrCtx { stream }
        }
        "aes-256-ctr" => {
            if key.len() != 32 || iv.len() != 16 {
                return None;
            }
            let stream = ctr::Ctr128BE::<aes::Aes256>::new_from_slices(key, iv).ok()?;
            CipherContext::Aes256CtrCtx { stream }
        }
        "aes-128-wrap" | "aes-192-wrap" | "aes-256-wrap" | "id-aes128-wrap" | "id-aes192-wrap"
        | "id-aes256-wrap" => {
            let expected_key_len = match algorithm {
                "aes-128-wrap" | "id-aes128-wrap" => 16,
                "aes-192-wrap" | "id-aes192-wrap" => 24,
                "aes-256-wrap" | "id-aes256-wrap" => 32,
                _ => return None,
            };
            if key.len() != expected_key_len {
                return None;
            }
            let mut wrap_iv = AES_WRAP_DEFAULT_IV;
            if iv.is_empty() {
                // Default IV in RFC 3394 / OpenSSL for AES-KW.
            } else if iv.len() == 8 {
                wrap_iv.copy_from_slice(iv);
            } else {
                return None;
            }
            if decrypt {
                CipherContext::AesKwDec {
                    key: key.to_vec(),
                    iv: wrap_iv,
                }
            } else {
                CipherContext::AesKwEnc {
                    key: key.to_vec(),
                    iv: wrap_iv,
                }
            }
        }
        "id-aes128-wrap-pad" | "id-aes192-wrap-pad" | "id-aes256-wrap-pad" => {
            let expected_key_len = match algorithm {
                "id-aes128-wrap-pad" => 16,
                "id-aes192-wrap-pad" => 24,
                "id-aes256-wrap-pad" => 32,
                _ => return None,
            };
            if key.len() != expected_key_len {
                return None;
            }
            let mut iv_prefix = AES_WRAP_PAD_DEFAULT_IV_PREFIX;
            if iv.is_empty() {
                // Default RFC 5649 AIV prefix.
            } else if iv.len() == 4 {
                iv_prefix.copy_from_slice(iv);
            } else {
                return None;
            }
            if decrypt {
                CipherContext::AesKwpDec {
                    key: key.to_vec(),
                    iv_prefix,
                }
            } else {
                CipherContext::AesKwpEnc {
                    key: key.to_vec(),
                    iv_prefix,
                }
            }
        }
        _ => return None,
    };
    let id = next_id();
    CIPHER_CONTEXTS.lock().unwrap().insert(id, ctx);
    Some(id)
}

fn cipher_update_impl(id: u32, data: &[u8]) -> Option<Vec<u8>> {
    use cipher::BlockDecryptMut;
    use cipher::BlockEncryptMut;
    use cipher::StreamCipher;

    let mut contexts = CIPHER_CONTEXTS.lock().unwrap();
    let ctx = contexts.get_mut(&id)?;
    match ctx {
        // AEAD encrypt/decrypt stream output while keeping the full input for final tag handling.
        CipherContext::Aes128GcmEnc {
            key,
            iv,
            processed_len,
            buf,
            ..
        } => {
            let output = gcm_stream_xor_with_offset(key, iv, data, *processed_len)?;
            *processed_len += data.len();
            buf.extend_from_slice(data);
            Some(output)
        }
        CipherContext::Aes256GcmEnc {
            key,
            iv,
            processed_len,
            buf,
            ..
        } => {
            let output = gcm_stream_xor_with_offset(key, iv, data, *processed_len)?;
            *processed_len += data.len();
            buf.extend_from_slice(data);
            Some(output)
        }
        CipherContext::ChaCha20Poly1305Enc {
            key,
            nonce,
            processed_len,
            buf,
            ..
        } => {
            let output = chacha20_stream_xor_with_offset(key, nonce, data, *processed_len)?;
            *processed_len += data.len();
            buf.extend_from_slice(data);
            Some(output)
        }
        CipherContext::Aes128GcmDec {
            key,
            iv,
            processed_len,
            buf,
            ..
        } => {
            let output = gcm_stream_xor_with_offset(key, iv, data, *processed_len)?;
            *processed_len += data.len();
            buf.extend_from_slice(data);
            Some(output)
        }
        CipherContext::Aes256GcmDec {
            key,
            iv,
            processed_len,
            buf,
            ..
        } => {
            let output = gcm_stream_xor_with_offset(key, iv, data, *processed_len)?;
            *processed_len += data.len();
            buf.extend_from_slice(data);
            Some(output)
        }
        CipherContext::ChaCha20Poly1305Dec {
            key,
            nonce,
            processed_len,
            buf,
            ..
        } => {
            let output = chacha20_stream_xor_with_offset(key, nonce, data, *processed_len)?;
            *processed_len += data.len();
            buf.extend_from_slice(data);
            Some(output)
        }
        // CBC encrypt: process full blocks, keep remainder in tail
        CipherContext::Aes128CbcEnc { enc, tail, .. } => {
            tail.extend_from_slice(data);
            let block_size = 16;
            let full_blocks = tail.len() / block_size;
            if full_blocks == 0 {
                return Some(Vec::new());
            }
            let process_len = full_blocks * block_size;
            let to_process: Vec<u8> = tail.drain(..process_len).collect();
            let mut output = Vec::new();
            for chunk in to_process.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                enc.encrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
            Some(output)
        }
        CipherContext::Aes256CbcEnc { enc, tail, .. } => {
            tail.extend_from_slice(data);
            let block_size = 16;
            let full_blocks = tail.len() / block_size;
            if full_blocks == 0 {
                return Some(Vec::new());
            }
            let process_len = full_blocks * block_size;
            let to_process: Vec<u8> = tail.drain(..process_len).collect();
            let mut output = Vec::new();
            for chunk in to_process.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                enc.encrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
            Some(output)
        }
        // CBC decrypt: buffer and keep last block for final (padding)
        CipherContext::Aes128CbcDec { dec, tail, .. } => {
            tail.extend_from_slice(data);
            let block_size = 16;
            if tail.len() <= block_size {
                return Some(Vec::new());
            }
            let blocks_to_process = (tail.len() / block_size) - 1;
            if blocks_to_process == 0 {
                return Some(Vec::new());
            }
            let process_len = blocks_to_process * block_size;
            let to_process: Vec<u8> = tail.drain(..process_len).collect();
            let mut output = Vec::new();
            for chunk in to_process.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                dec.decrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
            Some(output)
        }
        CipherContext::Aes256CbcDec { dec, tail, .. } => {
            tail.extend_from_slice(data);
            let block_size = 16;
            if tail.len() <= block_size {
                return Some(Vec::new());
            }
            let blocks_to_process = (tail.len() / block_size) - 1;
            if blocks_to_process == 0 {
                return Some(Vec::new());
            }
            let process_len = blocks_to_process * block_size;
            let to_process: Vec<u8> = tail.drain(..process_len).collect();
            let mut output = Vec::new();
            for chunk in to_process.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                dec.decrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
            Some(output)
        }
        // CTR: encrypt/decrypt in-place (XOR keystream)
        CipherContext::Aes128CtrCtx { stream } => {
            let mut output = data.to_vec();
            stream.apply_keystream(&mut output);
            Some(output)
        }
        CipherContext::Aes256CtrCtx { stream } => {
            let mut output = data.to_vec();
            stream.apply_keystream(&mut output);
            Some(output)
        }
        CipherContext::AesKwEnc { key, iv } => aes_wrap_nopad_encrypt(key, *iv, data),
        CipherContext::AesKwDec { key, iv } => aes_wrap_nopad_decrypt(key, *iv, data),
        CipherContext::AesKwpEnc { key, iv_prefix } => aes_wrap_pad_encrypt(key, *iv_prefix, data),
        CipherContext::AesKwpDec { key, iv_prefix } => aes_wrap_pad_decrypt(key, *iv_prefix, data),
    }
}

fn cipher_final_impl(id: u32) -> Option<Vec<u8>> {
    use cipher::BlockDecryptMut;
    use cipher::BlockEncryptMut;

    let mut contexts = CIPHER_CONTEXTS.lock().unwrap();
    let ctx = contexts.remove(&id)?;
    match ctx {
        // AEAD encrypt: tag is computed in final, data already emitted from update.
        CipherContext::Aes128GcmEnc {
            key,
            iv,
            aad,
            processed_len,
            buf,
            ..
        } => {
            let (_, tag) = gcm_encrypt_detached(&key, &iv, &aad, &buf)?;
            let done_ctx = CipherContext::Aes128GcmEnc {
                key,
                iv,
                aad: Vec::new(),
                processed_len: 0,
                buf: Vec::new(),
                tag: Some(tag),
            };
            contexts.insert(id, done_ctx);
            let _ = processed_len;
            Some(Vec::new())
        }
        CipherContext::Aes256GcmEnc {
            key,
            iv,
            aad,
            processed_len,
            buf,
            ..
        } => {
            let (_, tag) = gcm_encrypt_detached(&key, &iv, &aad, &buf)?;
            let done_ctx = CipherContext::Aes256GcmEnc {
                key,
                iv,
                aad: Vec::new(),
                processed_len: 0,
                buf: Vec::new(),
                tag: Some(tag),
            };
            contexts.insert(id, done_ctx);
            let _ = processed_len;
            Some(Vec::new())
        }
        CipherContext::ChaCha20Poly1305Enc {
            key,
            nonce,
            aad,
            processed_len,
            buf,
            ..
        } => {
            let (_, tag) = chacha20poly1305_encrypt_detached(&key, &nonce, &aad, &buf)?;
            let done_ctx = CipherContext::ChaCha20Poly1305Enc {
                key,
                nonce,
                aad: Vec::new(),
                processed_len: 0,
                buf: Vec::new(),
                tag: Some(tag),
            };
            contexts.insert(id, done_ctx);
            let _ = processed_len;
            Some(Vec::new())
        }
        // AEAD decrypt: data already emitted from update, final only verifies the tag.
        CipherContext::Aes128GcmDec {
            key,
            iv,
            aad,
            processed_len,
            buf,
            expected_tag,
        } => {
            let tag_bytes = expected_tag?;
            gcm_decrypt_detached(&key, &iv, &aad, &buf, &tag_bytes)?;
            let _ = processed_len;
            Some(Vec::new())
        }
        CipherContext::Aes256GcmDec {
            key,
            iv,
            aad,
            processed_len,
            buf,
            expected_tag,
        } => {
            let tag_bytes = expected_tag?;
            gcm_decrypt_detached(&key, &iv, &aad, &buf, &tag_bytes)?;
            let _ = processed_len;
            Some(Vec::new())
        }
        CipherContext::ChaCha20Poly1305Dec {
            key,
            nonce,
            aad,
            processed_len,
            buf,
            expected_tag,
        } => {
            let tag_bytes = expected_tag?;
            chacha20poly1305_decrypt_detached(&key, &nonce, &aad, &buf, &tag_bytes)?;
            let _ = processed_len;
            Some(Vec::new())
        }
        // CBC encrypt final: PKCS7 pad and encrypt remaining
        CipherContext::Aes128CbcEnc {
            mut enc,
            tail,
            auto_padding,
        } => {
            if auto_padding {
                let block_size = 16;
                let pad_len = block_size - (tail.len() % block_size);
                let mut padded = tail;
                padded.extend(vec![pad_len as u8; pad_len]);
                let mut output = Vec::new();
                for chunk in padded.chunks(block_size) {
                    let mut block = aes::Block::default();
                    block.copy_from_slice(chunk);
                    enc.encrypt_block_mut(&mut block);
                    output.extend_from_slice(&block);
                }
                Some(output)
            } else {
                if !tail.is_empty() {
                    return None;
                }
                Some(Vec::new())
            }
        }
        CipherContext::Aes256CbcEnc {
            mut enc,
            tail,
            auto_padding,
        } => {
            if auto_padding {
                let block_size = 16;
                let pad_len = block_size - (tail.len() % block_size);
                let mut padded = tail;
                padded.extend(vec![pad_len as u8; pad_len]);
                let mut output = Vec::new();
                for chunk in padded.chunks(block_size) {
                    let mut block = aes::Block::default();
                    block.copy_from_slice(chunk);
                    enc.encrypt_block_mut(&mut block);
                    output.extend_from_slice(&block);
                }
                Some(output)
            } else {
                if !tail.is_empty() {
                    return None;
                }
                Some(Vec::new())
            }
        }
        // CBC decrypt final: decrypt remaining block(s) and PKCS7 unpad
        CipherContext::Aes128CbcDec {
            mut dec,
            tail,
            auto_padding,
        } => {
            let block_size = 16;
            if tail.is_empty() {
                return Some(Vec::new());
            }
            if tail.len() % block_size != 0 {
                return None;
            }
            let mut output = Vec::new();
            for chunk in tail.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                dec.decrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
            if auto_padding {
                let pad_byte = *output.last()? as usize;
                if pad_byte == 0 || pad_byte > block_size || pad_byte > output.len() {
                    return None;
                }
                if !output[output.len() - pad_byte..]
                    .iter()
                    .all(|&b| b as usize == pad_byte)
                {
                    return None;
                }
                output.truncate(output.len() - pad_byte);
            }
            Some(output)
        }
        CipherContext::Aes256CbcDec {
            mut dec,
            tail,
            auto_padding,
        } => {
            let block_size = 16;
            if tail.is_empty() {
                return Some(Vec::new());
            }
            if tail.len() % block_size != 0 {
                return None;
            }
            let mut output = Vec::new();
            for chunk in tail.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                dec.decrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
            if auto_padding {
                let pad_byte = *output.last()? as usize;
                if pad_byte == 0 || pad_byte > block_size || pad_byte > output.len() {
                    return None;
                }
                if !output[output.len() - pad_byte..]
                    .iter()
                    .all(|&b| b as usize == pad_byte)
                {
                    return None;
                }
                output.truncate(output.len() - pad_byte);
            }
            Some(output)
        }
        // CTR final: nothing to do
        CipherContext::Aes128CtrCtx { .. }
        | CipherContext::Aes256CtrCtx { .. }
        | CipherContext::AesKwEnc { .. }
        | CipherContext::AesKwDec { .. }
        | CipherContext::AesKwpEnc { .. }
        | CipherContext::AesKwpDec { .. } => Some(Vec::new()),
    }
}

fn cipher_set_aad_impl(id: u32, aad_data: &[u8]) -> bool {
    let mut contexts = CIPHER_CONTEXTS.lock().unwrap();
    if let Some(ctx) = contexts.get_mut(&id) {
        match ctx {
            CipherContext::Aes128GcmEnc { aad, .. }
            | CipherContext::Aes256GcmEnc { aad, .. }
            | CipherContext::ChaCha20Poly1305Enc { aad, .. }
            | CipherContext::Aes128GcmDec { aad, .. }
            | CipherContext::Aes256GcmDec { aad, .. }
            | CipherContext::ChaCha20Poly1305Dec { aad, .. } => {
                aad.extend_from_slice(aad_data);
                true
            }
            _ => false,
        }
    } else {
        false
    }
}

fn cipher_get_auth_tag_impl(id: u32) -> Option<Vec<u8>> {
    let contexts = CIPHER_CONTEXTS.lock().unwrap();
    match contexts.get(&id)? {
        CipherContext::Aes128GcmEnc { tag, .. } => tag.clone(),
        CipherContext::Aes256GcmEnc { tag, .. } => tag.clone(),
        CipherContext::ChaCha20Poly1305Enc { tag, .. } => tag.clone(),
        _ => None,
    }
}

fn cipher_set_auth_tag_impl(id: u32, tag_data: &[u8]) -> bool {
    let mut contexts = CIPHER_CONTEXTS.lock().unwrap();
    if let Some(ctx) = contexts.get_mut(&id) {
        match ctx {
            CipherContext::Aes128GcmDec { expected_tag, .. }
            | CipherContext::Aes256GcmDec { expected_tag, .. }
            | CipherContext::ChaCha20Poly1305Dec { expected_tag, .. } => {
                *expected_tag = Some(tag_data.to_vec());
                true
            }
            _ => false,
        }
    } else {
        false
    }
}

fn cipher_set_auto_padding_impl(id: u32, enabled: bool) -> bool {
    let mut contexts = CIPHER_CONTEXTS.lock().unwrap();
    if let Some(ctx) = contexts.get_mut(&id) {
        match ctx {
            CipherContext::Aes128CbcEnc { auto_padding, .. }
            | CipherContext::Aes256CbcEnc { auto_padding, .. }
            | CipherContext::Aes128CbcDec { auto_padding, .. }
            | CipherContext::Aes256CbcDec { auto_padding, .. } => {
                *auto_padding = enabled;
                true
            }
            _ => true,
        }
    } else {
        false
    }
}

const SUPPORTED_CIPHERS: &[&str] = &[
    "aes-128-cbc",
    "aes-128-ctr",
    "aes-128-gcm",
    "aes-128-wrap",
    "aes-192-wrap",
    "aes-256-cbc",
    "aes-256-ctr",
    "aes-256-gcm",
    "aes-256-wrap",
    "chacha20-poly1305",
    "id-aes128-wrap",
    "id-aes192-wrap",
    "id-aes256-wrap",
    "id-aes128-wrap-pad",
    "id-aes192-wrap-pad",
    "id-aes256-wrap-pad",
];

// ===== Asymmetric key types =====

enum KeyData {
    // Ed25519
    Ed25519Private(Ed25519SigningKey),
    Ed25519Public(Ed25519VerifyingKey),
    // ECDSA P-256
    EcP256Private(p256::ecdsa::SigningKey),
    EcP256Public(p256::ecdsa::VerifyingKey),
    // ECDSA P-384
    EcP384Private(p384::ecdsa::SigningKey),
    EcP384Public(p384::ecdsa::VerifyingKey),
    // ECDSA secp256k1
    EcK256Private(k256::ecdsa::SigningKey),
    EcK256Public(k256::ecdsa::VerifyingKey),
    // RSA
    RsaPrivate(RsaPrivateKey),
    RsaPublic(RsaPublicKey),
    // Symmetric (secret) key
    Secret(Vec<u8>),
}

impl KeyData {
    fn key_type(&self) -> &'static str {
        match self {
            KeyData::Ed25519Private(_)
            | KeyData::EcP256Private(_)
            | KeyData::EcP384Private(_)
            | KeyData::EcK256Private(_)
            | KeyData::RsaPrivate(_) => "private",
            KeyData::Ed25519Public(_)
            | KeyData::EcP256Public(_)
            | KeyData::EcP384Public(_)
            | KeyData::EcK256Public(_)
            | KeyData::RsaPublic(_) => "public",
            KeyData::Secret(_) => "secret",
        }
    }

    fn asymmetric_key_type(&self) -> Option<&'static str> {
        match self {
            KeyData::Ed25519Private(_) | KeyData::Ed25519Public(_) => Some("ed25519"),
            KeyData::EcP256Private(_) | KeyData::EcP256Public(_) => Some("ec"),
            KeyData::EcP384Private(_) | KeyData::EcP384Public(_) => Some("ec"),
            KeyData::EcK256Private(_) | KeyData::EcK256Public(_) => Some("ec"),
            KeyData::RsaPrivate(_) | KeyData::RsaPublic(_) => Some("rsa"),
            KeyData::Secret(_) => None,
        }
    }

    fn export_public_der(&self) -> Option<Vec<u8>> {
        use pkcs8::EncodePublicKey;
        match self {
            KeyData::Ed25519Private(sk) => {
                let pk = Ed25519VerifyingKey::from(sk);
                Some(pk.to_bytes().to_vec())
            }
            KeyData::Ed25519Public(pk) => Some(pk.to_bytes().to_vec()),
            KeyData::EcP256Private(sk) => {
                let pk = sk.verifying_key();
                pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec())
            }
            KeyData::EcP256Public(pk) => pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec()),
            KeyData::EcP384Private(sk) => {
                let pk = sk.verifying_key();
                pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec())
            }
            KeyData::EcP384Public(pk) => pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec()),
            KeyData::EcK256Private(sk) => {
                let pk = sk.verifying_key();
                pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec())
            }
            KeyData::EcK256Public(pk) => pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec()),
            KeyData::RsaPrivate(sk) => {
                let pk = sk.to_public_key();
                pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec())
            }
            KeyData::RsaPublic(pk) => pk.to_public_key_der().ok().map(|d| d.as_ref().to_vec()),
            KeyData::Secret(raw) => Some(raw.clone()),
        }
    }

    fn export_private_der(&self) -> Option<Vec<u8>> {
        use pkcs8::EncodePrivateKey;
        match self {
            KeyData::Ed25519Private(sk) => Some(sk.to_bytes().to_vec()),
            KeyData::EcP256Private(sk) => sk.to_pkcs8_der().ok().map(|d| d.as_bytes().to_vec()),
            KeyData::EcP384Private(sk) => sk.to_pkcs8_der().ok().map(|d| d.as_bytes().to_vec()),
            KeyData::EcK256Private(sk) => sk.to_pkcs8_der().ok().map(|d| d.as_bytes().to_vec()),
            KeyData::RsaPrivate(sk) => sk.to_pkcs8_der().ok().map(|d| d.as_bytes().to_vec()),
            _ => None,
        }
    }

    fn export_public_pem(&self) -> Option<String> {
        use pkcs8::EncodePublicKey;
        match self {
            KeyData::Ed25519Private(_) => None,
            KeyData::Ed25519Public(_) => None,
            KeyData::EcP256Private(sk) => sk
                .verifying_key()
                .to_public_key_pem(pkcs8::LineEnding::LF)
                .ok(),
            KeyData::EcP256Public(pk) => pk.to_public_key_pem(pkcs8::LineEnding::LF).ok(),
            KeyData::EcP384Private(sk) => sk
                .verifying_key()
                .to_public_key_pem(pkcs8::LineEnding::LF)
                .ok(),
            KeyData::EcP384Public(pk) => pk.to_public_key_pem(pkcs8::LineEnding::LF).ok(),
            KeyData::EcK256Private(sk) => sk
                .verifying_key()
                .to_public_key_pem(pkcs8::LineEnding::LF)
                .ok(),
            KeyData::EcK256Public(pk) => pk.to_public_key_pem(pkcs8::LineEnding::LF).ok(),
            KeyData::RsaPrivate(sk) => sk
                .to_public_key()
                .to_public_key_pem(pkcs8::LineEnding::LF)
                .ok(),
            KeyData::RsaPublic(pk) => pk.to_public_key_pem(pkcs8::LineEnding::LF).ok(),
            KeyData::Secret(_) => None,
        }
    }

    fn export_private_pem(&self) -> Option<String> {
        use pkcs8::EncodePrivateKey;
        match self {
            KeyData::Ed25519Private(_) => None,
            KeyData::EcP256Private(sk) => sk
                .to_pkcs8_pem(pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            KeyData::EcP384Private(sk) => sk
                .to_pkcs8_pem(pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            KeyData::EcK256Private(sk) => sk
                .to_pkcs8_pem(pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            KeyData::RsaPrivate(sk) => sk
                .to_pkcs8_pem(pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            _ => None,
        }
    }

    fn export_pkcs1_public_pem(&self) -> Option<String> {
        use rsa::pkcs1::EncodeRsaPublicKey;
        match self {
            KeyData::RsaPrivate(sk) => sk
                .to_public_key()
                .to_pkcs1_pem(rsa::pkcs1::LineEnding::LF)
                .ok(),
            KeyData::RsaPublic(pk) => pk.to_pkcs1_pem(rsa::pkcs1::LineEnding::LF).ok(),
            _ => None,
        }
    }

    fn export_pkcs1_public_der(&self) -> Option<Vec<u8>> {
        use rsa::pkcs1::EncodeRsaPublicKey;
        match self {
            KeyData::RsaPrivate(sk) => sk.to_public_key().to_pkcs1_der().ok().map(|d| d.into_vec()),
            KeyData::RsaPublic(pk) => pk.to_pkcs1_der().ok().map(|d| d.into_vec()),
            _ => None,
        }
    }

    fn export_pkcs1_private_pem(&self) -> Option<String> {
        use rsa::pkcs1::EncodeRsaPrivateKey;
        match self {
            KeyData::RsaPrivate(sk) => sk
                .to_pkcs1_pem(rsa::pkcs1::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            _ => None,
        }
    }

    fn export_pkcs1_private_der(&self) -> Option<Vec<u8>> {
        use rsa::pkcs1::EncodeRsaPrivateKey;
        match self {
            KeyData::RsaPrivate(sk) => sk.to_pkcs1_der().ok().map(|d| d.as_bytes().to_vec()),
            _ => None,
        }
    }

    fn export_sec1_private_der(&self) -> Option<Vec<u8>> {
        match self {
            KeyData::EcP256Private(sk) => {
                let secret_key = p256::SecretKey::from(sk);
                secret_key.to_sec1_der().ok().map(|d| d.to_vec())
            }
            KeyData::EcP384Private(sk) => {
                let secret_key = p384::SecretKey::from(sk);
                secret_key.to_sec1_der().ok().map(|d| d.to_vec())
            }
            KeyData::EcK256Private(sk) => {
                let secret_key = k256::SecretKey::from(sk);
                secret_key.to_sec1_der().ok().map(|d| d.to_vec())
            }
            _ => None,
        }
    }

    fn export_sec1_private_pem(&self) -> Option<String> {
        match self {
            KeyData::EcP256Private(sk) => {
                let secret_key = p256::SecretKey::from(sk);
                secret_key
                    .to_sec1_pem(sec1::LineEnding::LF)
                    .ok()
                    .map(|s| s.to_string())
            }
            KeyData::EcP384Private(sk) => {
                let secret_key = p384::SecretKey::from(sk);
                secret_key
                    .to_sec1_pem(sec1::LineEnding::LF)
                    .ok()
                    .map(|s| s.to_string())
            }
            KeyData::EcK256Private(sk) => {
                let secret_key = k256::SecretKey::from(sk);
                secret_key
                    .to_sec1_pem(sec1::LineEnding::LF)
                    .ok()
                    .map(|s| s.to_string())
            }
            _ => None,
        }
    }

    fn export_pkcs8_encrypted_pem(&self, passphrase: &[u8]) -> Option<String> {
        use pkcs8::EncodePrivateKey;
        let rng = rand_core_06::OsRng;
        match self {
            KeyData::EcP256Private(sk) => sk
                .to_pkcs8_encrypted_pem(rng, passphrase, pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            KeyData::EcP384Private(sk) => sk
                .to_pkcs8_encrypted_pem(rng, passphrase, pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            KeyData::EcK256Private(sk) => sk
                .to_pkcs8_encrypted_pem(rng, passphrase, pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            KeyData::RsaPrivate(sk) => sk
                .to_pkcs8_encrypted_pem(rng, passphrase, pkcs8::LineEnding::LF)
                .ok()
                .map(|s| s.to_string()),
            _ => None,
        }
    }

    fn export_jwk(&self) -> Option<String> {
        use base64ct::{Base64UrlUnpadded, Encoding};
        use elliptic_curve::sec1::ToEncodedPoint;
        match self {
            KeyData::EcP256Private(sk) => {
                let secret_key = p256::SecretKey::from(sk);
                let public_key = secret_key.public_key();
                let point = public_key.to_encoded_point(false);
                let x = Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice());
                let y = Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice());
                let d = Base64UrlUnpadded::encode_string(secret_key.to_bytes().as_slice());
                Some(format!(
                    r#"{{"kty":"EC","crv":"P-256","x":"{}","y":"{}","d":"{}"}}"#,
                    x, y, d
                ))
            }
            KeyData::EcP256Public(pk) => {
                let point = pk.to_encoded_point(false);
                let x = Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice());
                let y = Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice());
                Some(format!(
                    r#"{{"kty":"EC","crv":"P-256","x":"{}","y":"{}"}}"#,
                    x, y
                ))
            }
            KeyData::EcP384Private(sk) => {
                let secret_key = p384::SecretKey::from(sk);
                let public_key = secret_key.public_key();
                let point = public_key.to_encoded_point(false);
                let x = Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice());
                let y = Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice());
                let d = Base64UrlUnpadded::encode_string(secret_key.to_bytes().as_slice());
                Some(format!(
                    r#"{{"kty":"EC","crv":"P-384","x":"{}","y":"{}","d":"{}"}}"#,
                    x, y, d
                ))
            }
            KeyData::EcP384Public(pk) => {
                let point = pk.to_encoded_point(false);
                let x = Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice());
                let y = Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice());
                Some(format!(
                    r#"{{"kty":"EC","crv":"P-384","x":"{}","y":"{}"}}"#,
                    x, y
                ))
            }
            KeyData::EcK256Private(sk) => {
                let secret_key = k256::SecretKey::from(sk);
                let public_key = secret_key.public_key();
                let point = public_key.to_encoded_point(false);
                let x = Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice());
                let y = Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice());
                let d = Base64UrlUnpadded::encode_string(secret_key.to_bytes().as_slice());
                Some(format!(
                    r#"{{"kty":"EC","crv":"secp256k1","x":"{}","y":"{}","d":"{}"}}"#,
                    x, y, d
                ))
            }
            KeyData::EcK256Public(pk) => {
                let point = pk.to_encoded_point(false);
                let x = Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice());
                let y = Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice());
                Some(format!(
                    r#"{{"kty":"EC","crv":"secp256k1","x":"{}","y":"{}"}}"#,
                    x, y
                ))
            }
            KeyData::Ed25519Private(sk) => {
                let pk = Ed25519VerifyingKey::from(sk);
                let x = Base64UrlUnpadded::encode_string(pk.as_bytes());
                let d = Base64UrlUnpadded::encode_string(&sk.to_bytes());
                Some(format!(
                    r#"{{"kty":"OKP","crv":"Ed25519","x":"{}","d":"{}"}}"#,
                    x, d
                ))
            }
            KeyData::Ed25519Public(pk) => {
                let x = Base64UrlUnpadded::encode_string(pk.as_bytes());
                Some(format!(r#"{{"kty":"OKP","crv":"Ed25519","x":"{}"}}"#, x))
            }
            _ => None,
        }
    }

    fn rsa_public_key(&self) -> Option<RsaPublicKey> {
        match self {
            KeyData::RsaPrivate(sk) => Some(sk.to_public_key()),
            KeyData::RsaPublic(pk) => Some(pk.clone()),
            _ => None,
        }
    }

    fn asymmetric_key_details(&self) -> Option<(u32, u64)> {
        use rsa::traits::PublicKeyParts;
        match self {
            KeyData::RsaPrivate(sk) => {
                let pk = sk.to_public_key();
                let modulus_length = pk.n().bits() as u32;
                let public_exponent = pk.e().to_bytes_be();
                let mut val: u64 = 0;
                for &b in &public_exponent {
                    val = (val << 8) | b as u64;
                }
                Some((modulus_length, val))
            }
            KeyData::RsaPublic(pk) => {
                let modulus_length = pk.n().bits() as u32;
                let public_exponent = pk.e().to_bytes_be();
                let mut val: u64 = 0;
                for &b in &public_exponent {
                    val = (val << 8) | b as u64;
                }
                Some((modulus_length, val))
            }
            _ => None,
        }
    }
}

static KEY_STORE: LazyLock<Mutex<HashMap<u32, KeyData>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn generate_key_pair_impl(
    algorithm: &str,
    named_curve: Option<&str>,
    modulus_length: Option<u32>,
    public_exponent: Option<u32>,
) -> Option<(u32, u32)> {
    let (priv_key, pub_key) = match algorithm {
        "ed25519" => {
            let mut bytes = [0u8; 32];
            rand::rng().fill_bytes(&mut bytes);
            let sk = Ed25519SigningKey::from_bytes(&bytes);
            let pk = Ed25519VerifyingKey::from(&sk);
            (KeyData::Ed25519Private(sk), KeyData::Ed25519Public(pk))
        }
        "ec" => {
            let curve = named_curve?;
            match curve {
                "prime256v1" | "P-256" | "p256" => {
                    let mut bytes = [0u8; 32];
                    rand::rng().fill_bytes(&mut bytes);
                    let sk = p256::ecdsa::SigningKey::from_bytes((&bytes).into()).ok()?;
                    let pk = *sk.verifying_key();
                    (KeyData::EcP256Private(sk), KeyData::EcP256Public(pk))
                }
                "secp384r1" | "P-384" | "p384" => {
                    let mut bytes = [0u8; 48];
                    rand::rng().fill_bytes(&mut bytes);
                    let sk = p384::ecdsa::SigningKey::from_bytes((&bytes).into()).ok()?;
                    let pk = *sk.verifying_key();
                    (KeyData::EcP384Private(sk), KeyData::EcP384Public(pk))
                }
                "secp256k1" => {
                    let mut bytes = [0u8; 32];
                    rand::rng().fill_bytes(&mut bytes);
                    let sk = k256::ecdsa::SigningKey::from_bytes((&bytes).into()).ok()?;
                    let pk = *sk.verifying_key();
                    (KeyData::EcK256Private(sk), KeyData::EcK256Public(pk))
                }
                _ => return None,
            }
        }
        "rsa" => {
            let bits = modulus_length? as usize;
            let exp = public_exponent.unwrap_or(65537);
            let e = rsa::BigUint::from(exp);
            let mut rng = rsa::rand_core::OsRng;
            let sk = RsaPrivateKey::new_with_exp(&mut rng, bits, &e).ok()?;
            let pk = sk.to_public_key();
            (KeyData::RsaPrivate(sk), KeyData::RsaPublic(pk))
        }
        _ => return None,
    };
    let priv_id = next_id();
    let pub_id = next_id();
    let mut store = KEY_STORE.lock().unwrap();
    store.insert(priv_id, priv_key);
    store.insert(pub_id, pub_key);
    Some((priv_id, pub_id))
}

fn key_type_impl(id: u32) -> Option<String> {
    KEY_STORE
        .lock()
        .unwrap()
        .get(&id)
        .map(|k| k.key_type().to_string())
}

fn key_asymmetric_type_impl(id: u32) -> Option<String> {
    KEY_STORE
        .lock()
        .unwrap()
        .get(&id)
        .and_then(|k| k.asymmetric_key_type().map(|s| s.to_string()))
}

fn key_export_impl(id: u32, format: &str, type_: Option<&str>) -> Option<Vec<u8>> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&id)?;
    match (format, type_) {
        ("der", Some("pkcs1")) => match key.key_type() {
            "private" => key.export_pkcs1_private_der(),
            "public" => key.export_pkcs1_public_der(),
            _ => None,
        },
        ("pem", Some("pkcs1")) => match key.key_type() {
            "private" => key.export_pkcs1_private_pem().map(|s| s.into_bytes()),
            "public" => key.export_pkcs1_public_pem().map(|s| s.into_bytes()),
            _ => None,
        },
        ("der", Some("sec1")) => key.export_sec1_private_der(),
        ("pem", Some("sec1")) => key.export_sec1_private_pem().map(|s| s.into_bytes()),
        ("der", Some("pkcs8")) => key.export_private_der(),
        ("pem", Some("pkcs8")) => key.export_private_pem().map(|s| s.into_bytes()),
        ("der", Some("spki")) => key.export_public_der(),
        ("pem", Some("spki")) => key.export_public_pem().map(|s| s.into_bytes()),
        ("der", _) => match key.key_type() {
            "private" => key.export_private_der(),
            "public" => key.export_public_der(),
            "secret" => key.export_public_der(),
            _ => None,
        },
        ("pem", _) => match key.key_type() {
            "private" => key.export_private_pem().map(|s| s.into_bytes()),
            "public" => key.export_public_pem().map(|s| s.into_bytes()),
            _ => None,
        },
        _ => None,
    }
}

fn key_asymmetric_details_impl(id: u32) -> Option<(u32, u64)> {
    KEY_STORE.lock().unwrap().get(&id)?.asymmetric_key_details()
}

fn key_export_jwk_impl(id: u32) -> Option<String> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&id)?;
    key.export_jwk()
}

fn evp_bytes_to_key(
    password: &[u8],
    salt: &[u8],
    key_len: usize,
    iv_len: usize,
) -> (Vec<u8>, Vec<u8>) {
    let mut key = Vec::with_capacity(key_len);
    let mut iv = Vec::with_capacity(iv_len);
    let mut prev = Vec::new();
    while key.len() < key_len || iv.len() < iv_len {
        let mut hasher = Md5::new();
        if !prev.is_empty() {
            hasher.update(&prev);
        }
        hasher.update(password);
        hasher.update(salt);
        prev = hasher.finalize().to_vec();
        for &b in &prev {
            if key.len() < key_len {
                key.push(b);
            } else if iv.len() < iv_len {
                iv.push(b);
            }
        }
    }
    (key, iv)
}

fn encrypt_sec1_pem_traditional(
    der: &[u8],
    cipher_name: &str,
    passphrase: &[u8],
) -> Option<String> {
    use cipher::BlockEncryptMut;
    use cipher::KeyIvInit;

    let key_len = match cipher_name.to_uppercase().as_str() {
        "AES-128-CBC" => 16,
        "AES-256-CBC" => 32,
        _ => return None,
    };

    // Generate random IV
    let mut iv_bytes = [0u8; 16];
    rand::rng().fill_bytes(&mut iv_bytes);

    // Derive key using EVP_BytesToKey (salt = first 8 bytes of IV)
    let (key, _) = evp_bytes_to_key(passphrase, &iv_bytes[..8], key_len, 0);

    // PKCS#7 pad the DER data
    let block_size = 16usize;
    let pad_len = block_size - (der.len() % block_size);
    let mut padded = der.to_vec();
    padded.extend(std::iter::repeat(pad_len as u8).take(pad_len));

    // Encrypt with AES-CBC block by block
    let mut output = Vec::new();
    match key_len {
        16 => {
            let mut enc = cbc::Encryptor::<aes::Aes128>::new_from_slices(&key, &iv_bytes).ok()?;
            for chunk in padded.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                enc.encrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
        }
        32 => {
            let mut enc = cbc::Encryptor::<aes::Aes256>::new_from_slices(&key, &iv_bytes).ok()?;
            for chunk in padded.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                enc.encrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
        }
        _ => return None,
    }

    // Format as RFC 1421 PEM with Proc-Type and DEK-Info headers
    let iv_hex: String = iv_bytes.iter().map(|b| format!("{:02X}", b)).collect();
    let cipher_upper = cipher_name.to_uppercase();
    use base64ct::Encoding;
    let b64 = base64ct::Base64::encode_string(&output);

    let mut pem = format!(
        "-----BEGIN EC PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\nDEK-Info: {},{}\n\n",
        cipher_upper, iv_hex
    );
    for chunk in b64.as_bytes().chunks(64) {
        pem.push_str(std::str::from_utf8(chunk).unwrap_or(""));
        pem.push('\n');
    }
    pem.push_str("-----END EC PRIVATE KEY-----\n");

    Some(pem)
}

fn decrypt_traditional_pem(pem: &str, passphrase: &[u8]) -> Option<Vec<u8>> {
    use cipher::BlockDecryptMut;
    use cipher::KeyIvInit;

    let lines: Vec<&str> = pem.lines().collect();
    let mut cipher_name = String::new();
    let mut iv_hex = String::new();
    let mut b64_data = String::new();
    let mut in_headers = true;
    let mut past_begin = false;

    for line in &lines {
        if line.starts_with("-----BEGIN ") {
            past_begin = true;
            continue;
        }
        if line.starts_with("-----END ") {
            break;
        }
        if !past_begin {
            continue;
        }
        if in_headers {
            if line.is_empty() {
                in_headers = false;
                continue;
            }
            if line.starts_with("DEK-Info: ") {
                let info = &line["DEK-Info: ".len()..];
                let parts: Vec<&str> = info.splitn(2, ',').collect();
                if parts.len() == 2 {
                    cipher_name = parts[0].to_string();
                    iv_hex = parts[1].to_string();
                }
            }
            continue;
        }
        b64_data.push_str(line);
    }

    if cipher_name.is_empty() || iv_hex.is_empty() || b64_data.is_empty() {
        return None;
    }

    // Decode IV from hex
    let iv_bytes: Vec<u8> = (0..iv_hex.len())
        .step_by(2)
        .filter_map(|i| u8::from_str_radix(&iv_hex[i..i + 2], 16).ok())
        .collect();

    if iv_bytes.len() != 16 {
        return None;
    }

    // Decode base64 ciphertext
    use base64ct::Encoding;
    let ciphertext = base64ct::Base64::decode_vec(&b64_data).ok()?;

    let key_len = match cipher_name.to_uppercase().as_str() {
        "AES-128-CBC" => 16,
        "AES-256-CBC" => 32,
        _ => return None,
    };

    // Derive key using EVP_BytesToKey
    let (key, _) = evp_bytes_to_key(passphrase, &iv_bytes[..8], key_len, 0);

    // Decrypt block by block
    let block_size = 16;
    if ciphertext.len() % block_size != 0 {
        return None;
    }
    let mut output = Vec::new();
    match key_len {
        16 => {
            let mut dec = cbc::Decryptor::<aes::Aes128>::new_from_slices(&key, &iv_bytes).ok()?;
            for chunk in ciphertext.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                dec.decrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
        }
        32 => {
            let mut dec = cbc::Decryptor::<aes::Aes256>::new_from_slices(&key, &iv_bytes).ok()?;
            for chunk in ciphertext.chunks(block_size) {
                let mut block = aes::Block::default();
                block.copy_from_slice(chunk);
                dec.decrypt_block_mut(&mut block);
                output.extend_from_slice(&block);
            }
        }
        _ => return None,
    }

    // Remove PKCS#7 padding
    let pad_byte = *output.last()? as usize;
    if pad_byte == 0 || pad_byte > block_size || pad_byte > output.len() {
        return None;
    }
    if !output[output.len() - pad_byte..]
        .iter()
        .all(|&b| b as usize == pad_byte)
    {
        return None;
    }
    output.truncate(output.len() - pad_byte);

    Some(output)
}

fn key_export_encrypted_impl(
    id: u32,
    format: &str,
    type_: &str,
    cipher_name: &str,
    passphrase: &[u8],
) -> Option<Vec<u8>> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&id)?;
    match (format, type_) {
        ("pem", "pkcs8") => key
            .export_pkcs8_encrypted_pem(passphrase)
            .map(|s| s.into_bytes()),
        ("pem", "sec1") => {
            let der = key.export_sec1_private_der()?;
            let encrypted_pem = encrypt_sec1_pem_traditional(&der, cipher_name, passphrase)?;
            Some(encrypted_pem.into_bytes())
        }
        _ => None,
    }
}

fn create_private_key_from_sec1_der(der: &[u8]) -> Option<u32> {
    use sec1::DecodeEcPrivateKey;
    if let Ok(sk) = p256::ecdsa::SigningKey::from_sec1_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP256Private(sk));
        return Some(id);
    }
    if let Ok(sk) = p384::ecdsa::SigningKey::from_sec1_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP384Private(sk));
        return Some(id);
    }
    if let Ok(sk) = k256::ecdsa::SigningKey::from_sec1_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcK256Private(sk));
        return Some(id);
    }
    None
}

fn create_private_key_from_sec1_pem(pem: &str) -> Option<u32> {
    use sec1::DecodeEcPrivateKey;
    if let Ok(sk) = p256::ecdsa::SigningKey::from_sec1_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP256Private(sk));
        return Some(id);
    }
    if let Ok(sk) = p384::ecdsa::SigningKey::from_sec1_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP384Private(sk));
        return Some(id);
    }
    if let Ok(sk) = k256::ecdsa::SigningKey::from_sec1_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcK256Private(sk));
        return Some(id);
    }
    None
}

fn create_private_key_from_encrypted_pem(pem: &str, passphrase: &[u8]) -> Option<u32> {
    // Try PKCS#8 encrypted PEM first (-----BEGIN ENCRYPTED PRIVATE KEY-----)
    if pem.contains("ENCRYPTED PRIVATE KEY") {
        use pkcs8::DecodePrivateKey;
        if let Ok(sk) = p256::ecdsa::SigningKey::from_pkcs8_encrypted_pem(pem, passphrase) {
            let id = next_id();
            KEY_STORE
                .lock()
                .unwrap()
                .insert(id, KeyData::EcP256Private(sk));
            return Some(id);
        }
        if let Ok(sk) = p384::ecdsa::SigningKey::from_pkcs8_encrypted_pem(pem, passphrase) {
            let id = next_id();
            KEY_STORE
                .lock()
                .unwrap()
                .insert(id, KeyData::EcP384Private(sk));
            return Some(id);
        }
        if let Ok(sk) = k256::ecdsa::SigningKey::from_pkcs8_encrypted_pem(pem, passphrase) {
            let id = next_id();
            KEY_STORE
                .lock()
                .unwrap()
                .insert(id, KeyData::EcK256Private(sk));
            return Some(id);
        }
        if let Ok(sk) = RsaPrivateKey::from_pkcs8_encrypted_pem(pem, passphrase) {
            let id = next_id();
            KEY_STORE
                .lock()
                .unwrap()
                .insert(id, KeyData::RsaPrivate(sk));
            return Some(id);
        }
        return None;
    }

    // Try RFC 1421 traditional encrypted PEM (-----BEGIN EC PRIVATE KEY----- with Proc-Type header)
    if pem.contains("EC PRIVATE KEY") && pem.contains("Proc-Type: 4,ENCRYPTED") {
        let der = decrypt_traditional_pem(pem, passphrase)?;
        return create_private_key_from_sec1_der(&der);
    }

    // Try RFC 1421 traditional encrypted PEM for RSA (-----BEGIN RSA PRIVATE KEY----- with Proc-Type)
    if pem.contains("RSA PRIVATE KEY") && pem.contains("Proc-Type: 4,ENCRYPTED") {
        let der = decrypt_traditional_pem(pem, passphrase)?;
        return create_rsa_private_key_from_der(&der);
    }

    None
}

fn create_private_key_from_der(der: &[u8]) -> Option<u32> {
    use pkcs8::DecodePrivateKey;
    // Try Ed25519 first (raw 32-byte key)
    if der.len() == 32 {
        let bytes: [u8; 32] = der.try_into().ok()?;
        let sk = Ed25519SigningKey::from_bytes(&bytes);
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::Ed25519Private(sk));
        return Some(id);
    }
    // Try P-256
    if let Ok(sk) = p256::ecdsa::SigningKey::from_pkcs8_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP256Private(sk));
        return Some(id);
    }
    // Try P-384
    if let Ok(sk) = p384::ecdsa::SigningKey::from_pkcs8_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP384Private(sk));
        return Some(id);
    }
    // Try secp256k1
    if let Ok(sk) = k256::ecdsa::SigningKey::from_pkcs8_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcK256Private(sk));
        return Some(id);
    }
    None
}

fn create_private_key_from_pem(pem: &str) -> Option<u32> {
    use pkcs8::DecodePrivateKey;
    if let Ok(sk) = p256::ecdsa::SigningKey::from_pkcs8_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP256Private(sk));
        return Some(id);
    }
    if let Ok(sk) = p384::ecdsa::SigningKey::from_pkcs8_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP384Private(sk));
        return Some(id);
    }
    if let Ok(sk) = k256::ecdsa::SigningKey::from_pkcs8_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcK256Private(sk));
        return Some(id);
    }
    // Try SEC1 PEM
    if let result @ Some(_) = create_private_key_from_sec1_pem(pem) {
        return result;
    }
    None
}

fn create_public_key_from_der(der: &[u8]) -> Option<u32> {
    use pkcs8::DecodePublicKey;
    // Try Ed25519 first (raw 32-byte key)
    if der.len() == 32 {
        let bytes: [u8; 32] = der.try_into().ok()?;
        if let Ok(pk) = Ed25519VerifyingKey::from_bytes(&bytes) {
            let id = next_id();
            KEY_STORE
                .lock()
                .unwrap()
                .insert(id, KeyData::Ed25519Public(pk));
            return Some(id);
        }
    }
    if let Ok(pk) = p256::ecdsa::VerifyingKey::from_public_key_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP256Public(pk));
        return Some(id);
    }
    if let Ok(pk) = p384::ecdsa::VerifyingKey::from_public_key_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP384Public(pk));
        return Some(id);
    }
    if let Ok(pk) = k256::ecdsa::VerifyingKey::from_public_key_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcK256Public(pk));
        return Some(id);
    }
    None
}

fn create_public_key_from_pem(pem: &str) -> Option<u32> {
    use pkcs8::DecodePublicKey;
    if let Ok(pk) = p256::ecdsa::VerifyingKey::from_public_key_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP256Public(pk));
        return Some(id);
    }
    if let Ok(pk) = p384::ecdsa::VerifyingKey::from_public_key_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcP384Public(pk));
        return Some(id);
    }
    if let Ok(pk) = k256::ecdsa::VerifyingKey::from_public_key_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::EcK256Public(pk));
        return Some(id);
    }
    None
}

fn create_public_key_from_private(private_id: u32) -> Option<u32> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&private_id)?;
    let pub_key = match key {
        KeyData::Ed25519Private(sk) => KeyData::Ed25519Public(Ed25519VerifyingKey::from(sk)),
        KeyData::EcP256Private(sk) => KeyData::EcP256Public(*sk.verifying_key()),
        KeyData::EcP384Private(sk) => KeyData::EcP384Public(*sk.verifying_key()),
        KeyData::EcK256Private(sk) => KeyData::EcK256Public(*sk.verifying_key()),
        KeyData::RsaPrivate(sk) => KeyData::RsaPublic(sk.to_public_key()),
        _ => return None,
    };
    drop(store);
    let id = next_id();
    KEY_STORE.lock().unwrap().insert(id, pub_key);
    Some(id)
}

fn create_secret_key(data: &[u8]) -> u32 {
    let id = next_id();
    KEY_STORE
        .lock()
        .unwrap()
        .insert(id, KeyData::Secret(data.to_vec()));
    id
}

// ===== Sign / Verify =====

enum SignContext {
    Ed25519 {
        key: Ed25519SigningKey,
        data: Vec<u8>,
    },
    EcP256 {
        key: p256::ecdsa::SigningKey,
        hasher: Option<HashContext>,
    },
    EcP384 {
        key: p384::ecdsa::SigningKey,
        hasher: Option<HashContext>,
    },
    EcK256 {
        key: k256::ecdsa::SigningKey,
        hasher: Option<HashContext>,
    },
    Rsa {
        key: RsaPrivateKey,
        hasher: Option<HashContext>,
        hash_algo: String,
    },
}

enum VerifyContext {
    Ed25519 {
        key: Ed25519VerifyingKey,
        data: Vec<u8>,
    },
    EcP256 {
        key: p256::ecdsa::VerifyingKey,
        hasher: Option<HashContext>,
    },
    EcP384 {
        key: p384::ecdsa::VerifyingKey,
        hasher: Option<HashContext>,
    },
    EcK256 {
        key: k256::ecdsa::VerifyingKey,
        hasher: Option<HashContext>,
    },
    Rsa {
        key: RsaPublicKey,
        hasher: Option<HashContext>,
        hash_algo: String,
    },
}

static SIGN_CONTEXTS: LazyLock<Mutex<HashMap<u32, SignContext>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

static VERIFY_CONTEXTS: LazyLock<Mutex<HashMap<u32, VerifyContext>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn sign_init_impl(algorithm: Option<&str>, key_id: u32) -> Option<u32> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&key_id)?;
    let ctx = match key {
        KeyData::Ed25519Private(sk) => SignContext::Ed25519 {
            key: sk.clone(),
            data: Vec::new(),
        },
        KeyData::EcP256Private(sk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            SignContext::EcP256 {
                key: sk.clone(),
                hasher: Some(hasher),
            }
        }
        KeyData::EcP384Private(sk) => {
            let algo = algorithm.unwrap_or("sha384");
            let hasher = create_hasher(algo)?;
            SignContext::EcP384 {
                key: sk.clone(),
                hasher: Some(hasher),
            }
        }
        KeyData::EcK256Private(sk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            SignContext::EcK256 {
                key: sk.clone(),
                hasher: Some(hasher),
            }
        }
        KeyData::RsaPrivate(sk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            SignContext::Rsa {
                key: sk.clone(),
                hasher: Some(hasher),
                hash_algo: algo.to_string(),
            }
        }
        _ => return None,
    };
    drop(store);
    let id = next_id();
    SIGN_CONTEXTS.lock().unwrap().insert(id, ctx);
    Some(id)
}

fn sign_update_impl(id: u32, data: &[u8]) -> bool {
    let mut contexts = SIGN_CONTEXTS.lock().unwrap();
    if let Some(ctx) = contexts.get_mut(&id) {
        match ctx {
            SignContext::Ed25519 { data: buf, .. } => buf.extend_from_slice(data),
            SignContext::EcP256 { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
            SignContext::EcP384 { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
            SignContext::EcK256 { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
            SignContext::Rsa { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
        }
        true
    } else {
        false
    }
}

fn sign_final_impl(id: u32) -> Option<Vec<u8>> {
    let ctx = SIGN_CONTEXTS.lock().unwrap().remove(&id)?;
    match ctx {
        SignContext::Ed25519 { key, data } => {
            let sig = key.sign(&data);
            Some(sig.to_bytes().to_vec())
        }
        SignContext::EcP256 { key, hasher } => {
            let digest = hasher?.finalize();
            let sig: p256::ecdsa::DerSignature = key.sign(&digest);
            Some(sig.as_bytes().to_vec())
        }
        SignContext::EcP384 { key, hasher } => {
            let digest = hasher?.finalize();
            let sig: p384::ecdsa::DerSignature = key.sign(&digest);
            Some(sig.as_bytes().to_vec())
        }
        SignContext::EcK256 { key, hasher } => {
            let digest = hasher?.finalize();
            let sig: k256::ecdsa::DerSignature = key.sign(&digest);
            Some(sig.as_bytes().to_vec())
        }
        SignContext::Rsa {
            key,
            hasher,
            hash_algo,
        } => {
            let digest = hasher?.finalize();
            rsa_sign(&key, &digest, &hash_algo)
        }
    }
}

fn verify_init_impl(algorithm: Option<&str>, key_id: u32) -> Option<u32> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&key_id)?;
    let ctx = match key {
        KeyData::Ed25519Public(pk) => VerifyContext::Ed25519 {
            key: *pk,
            data: Vec::new(),
        },
        KeyData::Ed25519Private(sk) => {
            let pk = Ed25519VerifyingKey::from(sk);
            VerifyContext::Ed25519 {
                key: pk,
                data: Vec::new(),
            }
        }
        KeyData::EcP256Public(pk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            VerifyContext::EcP256 {
                key: *pk,
                hasher: Some(hasher),
            }
        }
        KeyData::EcP256Private(sk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            VerifyContext::EcP256 {
                key: *sk.verifying_key(),
                hasher: Some(hasher),
            }
        }
        KeyData::EcP384Public(pk) => {
            let algo = algorithm.unwrap_or("sha384");
            let hasher = create_hasher(algo)?;
            VerifyContext::EcP384 {
                key: *pk,
                hasher: Some(hasher),
            }
        }
        KeyData::EcP384Private(sk) => {
            let algo = algorithm.unwrap_or("sha384");
            let hasher = create_hasher(algo)?;
            VerifyContext::EcP384 {
                key: *sk.verifying_key(),
                hasher: Some(hasher),
            }
        }
        KeyData::EcK256Public(pk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            VerifyContext::EcK256 {
                key: *pk,
                hasher: Some(hasher),
            }
        }
        KeyData::EcK256Private(sk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            VerifyContext::EcK256 {
                key: *sk.verifying_key(),
                hasher: Some(hasher),
            }
        }
        KeyData::RsaPublic(pk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            VerifyContext::Rsa {
                key: pk.clone(),
                hasher: Some(hasher),
                hash_algo: algo.to_string(),
            }
        }
        KeyData::RsaPrivate(sk) => {
            let algo = algorithm.unwrap_or("sha256");
            let hasher = create_hasher(algo)?;
            VerifyContext::Rsa {
                key: sk.to_public_key(),
                hasher: Some(hasher),
                hash_algo: algo.to_string(),
            }
        }
        _ => return None,
    };
    drop(store);
    let id = next_id();
    VERIFY_CONTEXTS.lock().unwrap().insert(id, ctx);
    Some(id)
}

fn verify_update_impl(id: u32, data: &[u8]) -> bool {
    let mut contexts = VERIFY_CONTEXTS.lock().unwrap();
    if let Some(ctx) = contexts.get_mut(&id) {
        match ctx {
            VerifyContext::Ed25519 { data: buf, .. } => buf.extend_from_slice(data),
            VerifyContext::EcP256 { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
            VerifyContext::EcP384 { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
            VerifyContext::EcK256 { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
            VerifyContext::Rsa { hasher, .. } => {
                if let Some(h) = hasher {
                    h.update(data)
                }
            }
        }
        true
    } else {
        false
    }
}

fn verify_final_impl(id: u32, signature: &[u8]) -> Option<bool> {
    let ctx = VERIFY_CONTEXTS.lock().unwrap().remove(&id)?;
    match ctx {
        VerifyContext::Ed25519 { key, data } => {
            if signature.len() != 64 {
                return Some(false);
            }
            let mut sig_bytes = [0u8; 64];
            sig_bytes.copy_from_slice(signature);
            let sig = ed25519_dalek::Signature::from_bytes(&sig_bytes);
            Some(key.verify(&data, &sig).is_ok())
        }
        VerifyContext::EcP256 { key, hasher } => {
            let digest = hasher?.finalize();
            let sig = p256::ecdsa::DerSignature::from_bytes(signature).ok()?;
            Some(key.verify(&digest, &sig).is_ok())
        }
        VerifyContext::EcP384 { key, hasher } => {
            let digest = hasher?.finalize();
            let sig = p384::ecdsa::DerSignature::from_bytes(signature).ok()?;
            Some(key.verify(&digest, &sig).is_ok())
        }
        VerifyContext::EcK256 { key, hasher } => {
            let digest = hasher?.finalize();
            let sig = k256::ecdsa::DerSignature::from_bytes(signature).ok()?;
            Some(key.verify(&digest, &sig).is_ok())
        }
        VerifyContext::Rsa {
            key,
            hasher,
            hash_algo,
        } => {
            let digest = hasher?.finalize();
            Some(rsa_verify(&key, &digest, signature, &hash_algo))
        }
    }
}

fn rsa_sign(key: &RsaPrivateKey, digest: &[u8], hash_algo: &str) -> Option<Vec<u8>> {
    use rsa::pkcs1v15::SigningKey;
    use signature::SignatureEncoding;
    use signature::hazmat::PrehashSigner;
    match hash_algo {
        "md5" => {
            let signing_key = SigningKey::<Md5>::new(key.clone());
            let sig = signing_key.sign_prehash(digest).ok()?;
            Some(sig.to_vec())
        }
        "sha1" => {
            let signing_key = SigningKey::<Sha1>::new(key.clone());
            let sig = signing_key.sign_prehash(digest).ok()?;
            Some(sig.to_vec())
        }
        "sha256" => {
            let signing_key = SigningKey::<Sha256>::new(key.clone());
            let sig = signing_key.sign_prehash(digest).ok()?;
            Some(sig.to_vec())
        }
        "sha384" => {
            let signing_key = SigningKey::<Sha384>::new(key.clone());
            let sig = signing_key.sign_prehash(digest).ok()?;
            Some(sig.to_vec())
        }
        "sha512" => {
            let signing_key = SigningKey::<Sha512>::new(key.clone());
            let sig = signing_key.sign_prehash(digest).ok()?;
            Some(sig.to_vec())
        }
        _ => None,
    }
}

fn rsa_verify(key: &RsaPublicKey, digest: &[u8], signature: &[u8], hash_algo: &str) -> bool {
    use rsa::pkcs1v15::{Signature, VerifyingKey};
    use signature::hazmat::PrehashVerifier;
    let sig = match Signature::try_from(signature) {
        Ok(s) => s,
        Err(_) => return false,
    };
    match hash_algo {
        "md5" => {
            let verifying_key = VerifyingKey::<Md5>::new(key.clone());
            verifying_key.verify_prehash(digest, &sig).is_ok()
        }
        "sha1" => {
            let verifying_key = VerifyingKey::<Sha1>::new(key.clone());
            verifying_key.verify_prehash(digest, &sig).is_ok()
        }
        "sha256" => {
            let verifying_key = VerifyingKey::<Sha256>::new(key.clone());
            verifying_key.verify_prehash(digest, &sig).is_ok()
        }
        "sha384" => {
            let verifying_key = VerifyingKey::<Sha384>::new(key.clone());
            verifying_key.verify_prehash(digest, &sig).is_ok()
        }
        "sha512" => {
            let verifying_key = VerifyingKey::<Sha512>::new(key.clone());
            verifying_key.verify_prehash(digest, &sig).is_ok()
        }
        _ => false,
    }
}

struct DerTlv<'a> {
    tag: u8,
    full: &'a [u8],
    content: &'a [u8],
    next: usize,
}

fn parse_der_length(data: &[u8], length_offset: usize) -> Option<(usize, usize)> {
    let first = *data.get(length_offset)?;
    if first & 0x80 == 0 {
        return Some((first as usize, 1));
    }

    let count = (first & 0x7f) as usize;
    if count == 0 || count > 4 {
        return None;
    }

    let mut length = 0usize;
    for i in 0..count {
        let byte = *data.get(length_offset + 1 + i)?;
        length = length.checked_mul(256)?;
        length = length.checked_add(byte as usize)?;
    }

    Some((length, 1 + count))
}

fn parse_der_tlv_at(data: &[u8], offset: usize) -> Option<DerTlv<'_>> {
    let tag = *data.get(offset)?;
    let (length, length_bytes) = parse_der_length(data, offset + 1)?;
    let content_start = offset + 1 + length_bytes;
    let content_end = content_start.checked_add(length)?;
    if content_end > data.len() {
        return None;
    }

    Some(DerTlv {
        tag,
        full: &data[offset..content_end],
        content: &data[content_start..content_end],
        next: content_end,
    })
}

fn decode_oid(oid: &[u8]) -> Option<String> {
    let first = *oid.first()? as u32;
    let mut components = vec![(first / 40).to_string(), (first % 40).to_string()];

    let mut value = 0u32;
    for byte in &oid[1..] {
        value = value.checked_mul(128)?;
        value = value.checked_add((byte & 0x7f) as u32)?;
        if byte & 0x80 == 0 {
            components.push(value.to_string());
            value = 0;
        }
    }

    if oid.len() > 1 && oid.last()? & 0x80 != 0 {
        return None;
    }

    Some(components.join("."))
}

fn decode_spkac_der(input: &[u8]) -> Option<Vec<u8>> {
    if input.is_empty() {
        return Some(Vec::new());
    }

    let compact: Vec<u8> = input
        .iter()
        .copied()
        .filter(|byte| !byte.is_ascii_whitespace())
        .collect();

    let maybe_base64 = !compact.is_empty()
        && compact.iter().all(|byte| {
            byte.is_ascii_alphanumeric() || matches!(*byte, b'+' | b'/' | b'=')
        });

    if maybe_base64 {
        if let Ok(text) = std::str::from_utf8(&compact) {
            if let Ok(decoded) = base64ct::Base64::decode_vec(text) {
                return Some(decoded);
            }
        }
    }

    Some(input.to_vec())
}

struct ParsedSpkac {
    public_key_and_challenge_der: Vec<u8>,
    public_key_info_der: Vec<u8>,
    challenge: Vec<u8>,
    signature_algorithm_oid: String,
    signature: Vec<u8>,
}

fn parse_spkac(spkac: &[u8]) -> Option<ParsedSpkac> {
    let der = decode_spkac_der(spkac)?;
    let outer = parse_der_tlv_at(&der, 0)?;
    if outer.tag != 0x30 || outer.next != der.len() {
        return None;
    }

    let mut outer_offset = 0;
    let public_key_and_challenge = parse_der_tlv_at(outer.content, outer_offset)?;
    outer_offset = public_key_and_challenge.next;
    let signature_algorithm = parse_der_tlv_at(outer.content, outer_offset)?;
    outer_offset = signature_algorithm.next;
    let signature_bit_string = parse_der_tlv_at(outer.content, outer_offset)?;
    outer_offset = signature_bit_string.next;

    if outer_offset != outer.content.len()
        || public_key_and_challenge.tag != 0x30
        || signature_algorithm.tag != 0x30
        || signature_bit_string.tag != 0x03
    {
        return None;
    }

    let mut pkac_offset = 0;
    let public_key_info = parse_der_tlv_at(public_key_and_challenge.content, pkac_offset)?;
    pkac_offset = public_key_info.next;
    let challenge = parse_der_tlv_at(public_key_and_challenge.content, pkac_offset)?;
    pkac_offset = challenge.next;

    if public_key_info.tag != 0x30 || pkac_offset != public_key_and_challenge.content.len() {
        return None;
    }

    let mut algo_offset = 0;
    let oid = parse_der_tlv_at(signature_algorithm.content, algo_offset)?;
    algo_offset = oid.next;
    if oid.tag != 0x06 || algo_offset > signature_algorithm.content.len() {
        return None;
    }

    if signature_bit_string.content.is_empty() || signature_bit_string.content[0] != 0 {
        return None;
    }

    Some(ParsedSpkac {
        public_key_and_challenge_der: public_key_and_challenge.full.to_vec(),
        public_key_info_der: public_key_info.full.to_vec(),
        challenge: challenge.content.to_vec(),
        signature_algorithm_oid: decode_oid(oid.content)?,
        signature: signature_bit_string.content[1..].to_vec(),
    })
}

fn spkac_signature_hash_algorithm(oid: &str) -> Option<&'static str> {
    match oid {
        "1.2.840.113549.1.1.4" => Some("md5"),   // md5WithRSAEncryption
        "1.2.840.113549.1.1.5" => Some("sha1"),  // sha1WithRSAEncryption
        "1.2.840.113549.1.1.14" => Some("sha224"), // sha224WithRSAEncryption
        "1.2.840.113549.1.1.11" => Some("sha256"), // sha256WithRSAEncryption
        "1.2.840.113549.1.1.12" => Some("sha384"), // sha384WithRSAEncryption
        "1.2.840.113549.1.1.13" => Some("sha512"), // sha512WithRSAEncryption
        _ => None,
    }
}

fn certificate_verify_spkac_impl(spkac: &[u8]) -> Option<bool> {
    use pkcs8::DecodePublicKey;

    let parsed = parse_spkac(spkac)?;
    let key = RsaPublicKey::from_public_key_der(&parsed.public_key_info_der).ok()?;
    let hash_algorithm = spkac_signature_hash_algorithm(&parsed.signature_algorithm_oid)?;

    let mut hasher = create_hasher(hash_algorithm)?;
    hasher.update(&parsed.public_key_and_challenge_der);
    let digest = hasher.finalize();

    Some(rsa_verify(&key, &digest, &parsed.signature, hash_algorithm))
}

fn certificate_export_public_key_impl(spkac: &[u8]) -> Option<Vec<u8>> {
    use pkcs8::{DecodePublicKey, EncodePublicKey};

    let parsed = parse_spkac(spkac)?;
    let key = RsaPublicKey::from_public_key_der(&parsed.public_key_info_der).ok()?;
    key.to_public_key_pem(pkcs8::LineEnding::LF)
        .ok()
        .map(|pem| pem.into_bytes())
}

fn certificate_export_challenge_impl(spkac: &[u8]) -> Option<Vec<u8>> {
    parse_spkac(spkac).map(|parsed| parsed.challenge)
}

fn rsa_public_encrypt(key: &RsaPublicKey, data: &[u8], padding: u32) -> Option<Vec<u8>> {
    let mut rng = rsa::rand_core::OsRng;
    match padding {
        // RSA_PKCS1_OAEP_PADDING (4) - default
        4 => {
            let padding_scheme = rsa::Oaep::new::<Sha1>();
            key.encrypt(&mut rng, padding_scheme, data).ok()
        }
        // RSA_PKCS1_PADDING (1)
        1 => {
            let padding_scheme = rsa::Pkcs1v15Encrypt;
            key.encrypt(&mut rng, padding_scheme, data).ok()
        }
        _ => None,
    }
}

fn rsa_private_decrypt(key: &RsaPrivateKey, data: &[u8], padding: u32) -> Option<Vec<u8>> {
    match padding {
        // RSA_PKCS1_OAEP_PADDING (4) - default
        4 => {
            let padding_scheme = rsa::Oaep::new::<Sha1>();
            key.decrypt(padding_scheme, data).ok()
        }
        // RSA_PKCS1_PADDING (1)
        1 => {
            let padding_scheme = rsa::Pkcs1v15Encrypt;
            key.decrypt(padding_scheme, data).ok()
        }
        _ => None,
    }
}

fn public_encrypt_impl(key_id: u32, data: &[u8], padding: u32) -> Option<Vec<u8>> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&key_id)?;
    let pk = key.rsa_public_key()?;
    drop(store);
    rsa_public_encrypt(&pk, data, padding)
}

fn private_decrypt_impl(key_id: u32, data: &[u8], padding: u32) -> Option<Vec<u8>> {
    let store = KEY_STORE.lock().unwrap();
    let key = store.get(&key_id)?;
    match key {
        KeyData::RsaPrivate(sk) => {
            let sk = sk.clone();
            drop(store);
            rsa_private_decrypt(&sk, data, padding)
        }
        _ => None,
    }
}

fn create_rsa_private_key_from_der(der: &[u8]) -> Option<u32> {
    use pkcs8::DecodePrivateKey;
    use rsa::pkcs1::DecodeRsaPrivateKey;
    // Try PKCS#8 first
    if let Ok(sk) = RsaPrivateKey::from_pkcs8_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::RsaPrivate(sk));
        return Some(id);
    }
    // Try PKCS#1
    if let Ok(sk) = RsaPrivateKey::from_pkcs1_der(der) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::RsaPrivate(sk));
        return Some(id);
    }
    None
}

fn create_rsa_private_key_from_pem(pem: &str) -> Option<u32> {
    use pkcs8::DecodePrivateKey;
    use rsa::pkcs1::DecodeRsaPrivateKey;
    // Try PKCS#8 first
    if let Ok(sk) = RsaPrivateKey::from_pkcs8_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::RsaPrivate(sk));
        return Some(id);
    }
    // Try PKCS#1
    if let Ok(sk) = RsaPrivateKey::from_pkcs1_pem(pem) {
        let id = next_id();
        KEY_STORE
            .lock()
            .unwrap()
            .insert(id, KeyData::RsaPrivate(sk));
        return Some(id);
    }
    None
}

fn create_rsa_public_key_from_der(der: &[u8]) -> Option<u32> {
    use pkcs8::DecodePublicKey;
    use rsa::pkcs1::DecodeRsaPublicKey;
    // Try SPKI first
    if let Ok(pk) = RsaPublicKey::from_public_key_der(der) {
        let id = next_id();
        KEY_STORE.lock().unwrap().insert(id, KeyData::RsaPublic(pk));
        return Some(id);
    }
    // Try PKCS#1
    if let Ok(pk) = RsaPublicKey::from_pkcs1_der(der) {
        let id = next_id();
        KEY_STORE.lock().unwrap().insert(id, KeyData::RsaPublic(pk));
        return Some(id);
    }
    None
}

fn create_rsa_public_key_from_pem(pem: &str) -> Option<u32> {
    use pkcs8::DecodePublicKey;
    use rsa::pkcs1::DecodeRsaPublicKey;
    // Try SPKI first
    if let Ok(pk) = RsaPublicKey::from_public_key_pem(pem) {
        let id = next_id();
        KEY_STORE.lock().unwrap().insert(id, KeyData::RsaPublic(pk));
        return Some(id);
    }
    // Try PKCS#1
    if let Ok(pk) = RsaPublicKey::from_pkcs1_pem(pem) {
        let id = next_id();
        KEY_STORE.lock().unwrap().insert(id, KeyData::RsaPublic(pk));
        return Some(id);
    }
    None
}

// ===== Diffie-Hellman =====

fn pad_to_length(bytes: &[u8], len: usize) -> Vec<u8> {
    if bytes.len() >= len {
        return bytes.to_vec();
    }
    let mut result = vec![0u8; len - bytes.len()];
    result.extend_from_slice(bytes);
    result
}

struct DhState {
    p: BigUint,
    g: BigUint,
    priv_key: Option<BigUint>,
    pub_key: Option<BigUint>,
    verify_error: u32,
    p_len: usize,
    is_group: bool,
    pub_key_stale: bool,
}

static DH_CONTEXTS: LazyLock<Mutex<HashMap<u32, DhState>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn get_modp_group(name: &str) -> Option<(&'static str, u32)> {
    let (prime_hex, generator) = match name {
        "modp1" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp2" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp5" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp14" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp15" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp16" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp17" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DCC4024FFFFFFFFFFFFFFFF",
            2u32,
        ),
        "modp18" => (
            "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD922222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC8862F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A66D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC50846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E7160C980DD98EDD3DFFFFFFFFFFFFFFFF",
            2u32,
        ),
        _ => return None,
    };
    Some((prime_hex, generator))
}

fn dh_check_params(p: &BigUint, g: &BigUint) -> u32 {
    let mut error = 0u32;
    let two = BigUint::from(2u32);
    if *p <= two {
        error |= 0x01; // DH_CHECK_P_NOT_PRIME
    } else if p.is_even() {
        error |= 0x01;
    }
    if g.is_zero() || g.is_one() {
        error |= 0x08; // DH_NOT_SUITABLE_GENERATOR
    }
    error
}

trait BigUintExt {
    fn is_even(&self) -> bool;
}

impl BigUintExt for BigUint {
    fn is_even(&self) -> bool {
        self.to_bytes_le().first().map_or(true, |b| b & 1 == 0)
    }
}

fn dh_create_from_group_impl(name: &str) -> Option<u32> {
    let (prime_hex, gen_val) = get_modp_group(name)?;
    let p = BigUint::parse_bytes(prime_hex.as_bytes(), 16)?;
    let g = BigUint::from(gen_val);
    let p_len = p.to_bytes_be().len();
    let id = next_id();
    DH_CONTEXTS.lock().unwrap().insert(
        id,
        DhState {
            p,
            g,
            priv_key: None,
            pub_key: None,
            verify_error: 0,
            p_len,
            is_group: true,
            pub_key_stale: false,
        },
    );
    Some(id)
}

fn dh_create_from_prime_impl(prime_bytes: &[u8], generator_bytes: &[u8]) -> u32 {
    let p = BigUint::from_bytes_be(prime_bytes);
    let g = if generator_bytes.is_empty() || (generator_bytes.len() == 1 && generator_bytes[0] == 0)
    {
        BigUint::from(2u32) // g=0 defaults to 2 (Node.js historical behavior)
    } else {
        BigUint::from_bytes_be(generator_bytes)
    };
    let p_len = prime_bytes.len();
    let verify_error = dh_check_params(&p, &g);
    let id = next_id();
    DH_CONTEXTS.lock().unwrap().insert(
        id,
        DhState {
            p,
            g,
            priv_key: None,
            pub_key: None,
            verify_error,
            p_len,
            is_group: false,
            pub_key_stale: false,
        },
    );
    id
}

fn dh_create_from_size_impl(bits: u32) -> Result<u32, String> {
    if bits < 2 {
        return Err("modulus too small".to_string());
    }
    let mut rng = rsa::rand_core::OsRng;
    let p: BigUint = rng.gen_prime(bits as usize);
    let g = BigUint::from(2u32);
    let p_len = p.to_bytes_be().len();
    let id = next_id();
    DH_CONTEXTS.lock().unwrap().insert(
        id,
        DhState {
            p,
            g,
            priv_key: None,
            pub_key: None,
            verify_error: 0,
            p_len,
            is_group: false,
            pub_key_stale: false,
        },
    );
    Ok(id)
}

fn dh_generate_keys_impl(id: u32) -> Option<Vec<u8>> {
    let mut contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get_mut(&id)?;

    let needs_priv = state.priv_key.is_none();
    let needs_pub = state.pub_key.is_none() || state.pub_key_stale;

    if needs_priv {
        let p_minus_2 = &state.p - BigUint::from(2u32);
        let p_byte_len = state.p_len;
        let mut buf = vec![0u8; p_byte_len];
        rand::rng().fill_bytes(&mut buf);
        let candidate = BigUint::from_bytes_be(&buf);
        let priv_key = (candidate % &p_minus_2) + BigUint::from(2u32);
        state.priv_key = Some(priv_key);
    }

    if needs_priv || needs_pub {
        let priv_key = state.priv_key.as_ref().unwrap();
        let pub_key = state.g.modpow(priv_key, &state.p);
        state.pub_key = Some(pub_key);
        state.pub_key_stale = false;
    }

    let pub_bytes = state.pub_key.as_ref().unwrap().to_bytes_be();
    Some(pad_to_length(&pub_bytes, state.p_len))
}

fn dh_compute_secret_impl(id: u32, other_pub_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id).ok_or("DH context not found")?;

    let other_pub = BigUint::from_bytes_be(other_pub_bytes);
    if other_pub.is_zero() || other_pub.is_one() {
        return Err("Supplied key is too small".to_string());
    }
    if other_pub >= state.p {
        return Err("Supplied key is too large".to_string());
    }
    let priv_key = state.priv_key.as_ref().ok_or("No private key set")?;
    let secret = other_pub.modpow(priv_key, &state.p);
    let secret_bytes = secret.to_bytes_be();
    Ok(pad_to_length(&secret_bytes, state.p_len))
}

fn dh_get_prime_impl(id: u32) -> Option<Vec<u8>> {
    let contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    Some(state.p.to_bytes_be())
}

fn dh_get_generator_impl(id: u32) -> Option<Vec<u8>> {
    let contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    Some(state.g.to_bytes_be())
}

fn dh_get_public_key_impl(id: u32) -> Option<Vec<u8>> {
    let contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    let pub_key = state.pub_key.as_ref()?;
    Some(pad_to_length(&pub_key.to_bytes_be(), state.p_len))
}

fn dh_get_private_key_impl(id: u32) -> Option<Vec<u8>> {
    let contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    let priv_key = state.priv_key.as_ref()?;
    Some(priv_key.to_bytes_be())
}

fn dh_get_verify_error_impl(id: u32) -> Option<u32> {
    let contexts = DH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    Some(state.verify_error)
}

fn dh_set_public_key_impl(id: u32, key: &[u8]) -> bool {
    let mut contexts = DH_CONTEXTS.lock().unwrap();
    let Some(state) = contexts.get_mut(&id) else {
        return false;
    };
    if state.is_group {
        return false;
    }
    state.pub_key = Some(BigUint::from_bytes_be(key));
    false // returns false to indicate "not an error", but success
}

fn dh_set_private_key_impl(id: u32, key: &[u8]) -> bool {
    let mut contexts = DH_CONTEXTS.lock().unwrap();
    let Some(state) = contexts.get_mut(&id) else {
        return false;
    };
    if state.is_group {
        return false;
    }
    state.priv_key = Some(BigUint::from_bytes_be(key));
    state.pub_key_stale = true;
    true
}

fn dh_is_group_impl(id: u32) -> bool {
    let contexts = DH_CONTEXTS.lock().unwrap();
    contexts.get(&id).map_or(false, |s| s.is_group)
}

// ===== ECDH =====

enum EcdhState {
    P256 {
        sk: Option<p256::SecretKey>,
        pk: Option<p256::PublicKey>,
    },
    P384 {
        sk: Option<p384::SecretKey>,
        pk: Option<p384::PublicKey>,
    },
    K256 {
        sk: Option<k256::SecretKey>,
        pk: Option<k256::PublicKey>,
    },
}

static ECDH_CONTEXTS: LazyLock<Mutex<HashMap<u32, EcdhState>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn ecdh_create_impl(curve: &str) -> Option<u32> {
    let state = match curve {
        "prime256v1" | "P-256" | "p256" => EcdhState::P256 { sk: None, pk: None },
        "secp384r1" | "P-384" | "p384" => EcdhState::P384 { sk: None, pk: None },
        "secp256k1" | "K-256" | "k256" => EcdhState::K256 { sk: None, pk: None },
        _ => return None,
    };
    let id = next_id();
    ECDH_CONTEXTS.lock().unwrap().insert(id, state);
    Some(id)
}

fn ecdh_generate_keys_impl(id: u32) -> Option<Vec<u8>> {
    use elliptic_curve::sec1::ToEncodedPoint;

    let mut contexts = ECDH_CONTEXTS.lock().unwrap();
    let state = contexts.get_mut(&id)?;
    match state {
        EcdhState::P256 { sk, pk } => {
            let mut bytes = [0u8; 32];
            rand::rng().fill_bytes(&mut bytes);
            let secret = p256::SecretKey::from_slice(&bytes).ok()?;
            let public = secret.public_key();
            let encoded = public.to_encoded_point(false);
            *sk = Some(secret);
            *pk = Some(public);
            Some(encoded.as_bytes().to_vec())
        }
        EcdhState::P384 { sk, pk } => {
            let mut bytes = [0u8; 48];
            rand::rng().fill_bytes(&mut bytes);
            let secret = p384::SecretKey::from_slice(&bytes).ok()?;
            let public = secret.public_key();
            let encoded = public.to_encoded_point(false);
            *sk = Some(secret);
            *pk = Some(public);
            Some(encoded.as_bytes().to_vec())
        }
        EcdhState::K256 { sk, pk } => {
            let mut bytes = [0u8; 32];
            rand::rng().fill_bytes(&mut bytes);
            let secret = k256::SecretKey::from_slice(&bytes).ok()?;
            let public = secret.public_key();
            let encoded = public.to_encoded_point(false);
            *sk = Some(secret);
            *pk = Some(public);
            Some(encoded.as_bytes().to_vec())
        }
    }
}

fn ecdh_compute_secret_impl(id: u32, other_pub_bytes: &[u8]) -> Result<Vec<u8>, String> {
    use elliptic_curve::ecdh::diffie_hellman;
    use elliptic_curve::sec1::FromEncodedPoint;

    let contexts = ECDH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id).ok_or("ECDH context not found")?;

    match state {
        EcdhState::P256 { sk, .. } => {
            let secret_key = sk.as_ref().ok_or("No private key")?;
            let point = p256::EncodedPoint::from_bytes(other_pub_bytes)
                .map_err(|_| "Public key is not valid for specified curve".to_string())?;
            let public = p256::PublicKey::from_encoded_point(&point);
            if public.is_none().into() {
                return Err("Public key is not valid for specified curve".to_string());
            }
            let shared =
                diffie_hellman(secret_key.to_nonzero_scalar(), public.unwrap().as_affine());
            Ok(shared.raw_secret_bytes().to_vec())
        }
        EcdhState::P384 { sk, .. } => {
            let secret_key = sk.as_ref().ok_or("No private key")?;
            let point = p384::EncodedPoint::from_bytes(other_pub_bytes)
                .map_err(|_| "Public key is not valid for specified curve".to_string())?;
            let public = p384::PublicKey::from_encoded_point(&point);
            if public.is_none().into() {
                return Err("Public key is not valid for specified curve".to_string());
            }
            let shared =
                diffie_hellman(secret_key.to_nonzero_scalar(), public.unwrap().as_affine());
            Ok(shared.raw_secret_bytes().to_vec())
        }
        EcdhState::K256 { sk, .. } => {
            let secret_key = sk.as_ref().ok_or("No private key")?;
            let point = k256::EncodedPoint::from_bytes(other_pub_bytes)
                .map_err(|_| "Public key is not valid for specified curve".to_string())?;
            let public = k256::PublicKey::from_encoded_point(&point);
            if public.is_none().into() {
                return Err("Public key is not valid for specified curve".to_string());
            }
            let shared =
                diffie_hellman(secret_key.to_nonzero_scalar(), public.unwrap().as_affine());
            Ok(shared.raw_secret_bytes().to_vec())
        }
    }
}

fn ecdh_get_public_key_impl(id: u32, compressed: bool) -> Option<Vec<u8>> {
    use elliptic_curve::sec1::ToEncodedPoint;

    let contexts = ECDH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    match state {
        EcdhState::P256 { pk, .. } => {
            let public = pk.as_ref()?;
            Some(public.to_encoded_point(compressed).as_bytes().to_vec())
        }
        EcdhState::P384 { pk, .. } => {
            let public = pk.as_ref()?;
            Some(public.to_encoded_point(compressed).as_bytes().to_vec())
        }
        EcdhState::K256 { pk, .. } => {
            let public = pk.as_ref()?;
            Some(public.to_encoded_point(compressed).as_bytes().to_vec())
        }
    }
}

fn ecdh_get_private_key_impl(id: u32) -> Option<Vec<u8>> {
    let contexts = ECDH_CONTEXTS.lock().unwrap();
    let state = contexts.get(&id)?;
    match state {
        EcdhState::P256 { sk, .. } => {
            let secret = sk.as_ref()?;
            Some(secret.to_bytes().to_vec())
        }
        EcdhState::P384 { sk, .. } => {
            let secret = sk.as_ref()?;
            Some(secret.to_bytes().to_vec())
        }
        EcdhState::K256 { sk, .. } => {
            let secret = sk.as_ref()?;
            Some(secret.to_bytes().to_vec())
        }
    }
}

fn ecdh_set_private_key_impl(id: u32, key: &[u8]) -> Result<Vec<u8>, String> {
    use elliptic_curve::sec1::ToEncodedPoint;

    let mut contexts = ECDH_CONTEXTS.lock().unwrap();
    let state = contexts.get_mut(&id).ok_or("ECDH context not found")?;
    match state {
        EcdhState::P256 { sk, pk } => {
            let secret = p256::SecretKey::from_slice(key)
                .map_err(|_| "Private key is not valid for specified curve".to_string())?;
            let public = secret.public_key();
            let encoded = public.to_encoded_point(false);
            *pk = Some(public);
            *sk = Some(secret);
            Ok(encoded.as_bytes().to_vec())
        }
        EcdhState::P384 { sk, pk } => {
            let secret = p384::SecretKey::from_slice(key)
                .map_err(|_| "Private key is not valid for specified curve".to_string())?;
            let public = secret.public_key();
            let encoded = public.to_encoded_point(false);
            *pk = Some(public);
            *sk = Some(secret);
            Ok(encoded.as_bytes().to_vec())
        }
        EcdhState::K256 { sk, pk } => {
            let secret = k256::SecretKey::from_slice(key)
                .map_err(|_| "Private key is not valid for specified curve".to_string())?;
            let public = secret.public_key();
            let encoded = public.to_encoded_point(false);
            *pk = Some(public);
            *sk = Some(secret);
            Ok(encoded.as_bytes().to_vec())
        }
    }
}

fn ecdh_set_public_key_impl(id: u32, key: &[u8]) -> Result<(), String> {
    use elliptic_curve::sec1::FromEncodedPoint;

    let mut contexts = ECDH_CONTEXTS.lock().unwrap();
    let state = contexts.get_mut(&id).ok_or("ECDH context not found")?;
    match state {
        EcdhState::P256 { pk, .. } => {
            let point = p256::EncodedPoint::from_bytes(key)
                .map_err(|_| "Failed to convert Buffer to EC_POINT".to_string())?;
            let public = p256::PublicKey::from_encoded_point(&point);
            if public.is_none().into() {
                return Err("Failed to convert Buffer to EC_POINT".to_string());
            }
            *pk = Some(public.unwrap());
            Ok(())
        }
        EcdhState::P384 { pk, .. } => {
            let point = p384::EncodedPoint::from_bytes(key)
                .map_err(|_| "Failed to convert Buffer to EC_POINT".to_string())?;
            let public = p384::PublicKey::from_encoded_point(&point);
            if public.is_none().into() {
                return Err("Failed to convert Buffer to EC_POINT".to_string());
            }
            *pk = Some(public.unwrap());
            Ok(())
        }
        EcdhState::K256 { pk, .. } => {
            let point = k256::EncodedPoint::from_bytes(key)
                .map_err(|_| "Failed to convert Buffer to EC_POINT".to_string())?;
            let public = k256::PublicKey::from_encoded_point(&point);
            if public.is_none().into() {
                return Err("Failed to convert Buffer to EC_POINT".to_string());
            }
            *pk = Some(public.unwrap());
            Ok(())
        }
    }
}

// Native functions for the crypto implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    use rquickjs::TypedArray;

    #[rquickjs::function]
    pub fn random_uuid_v4_string() -> String {
        let uuid = uuid::Uuid::new_v4();
        uuid.to_string()
    }

    #[rquickjs::function]
    pub fn hash_init(algorithm: String) -> Option<u32> {
        super::hash_init_impl(&algorithm)
    }

    #[rquickjs::function]
    pub fn hash_update(id: u32, data: TypedArray<'_, u8>) -> bool {
        if let Some(raw) = data.as_raw() {
            let slice = unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) };
            super::hash_update_impl(id, slice)
        } else {
            false
        }
    }

    #[rquickjs::function]
    pub fn hash_final(id: u32) -> Option<Vec<u8>> {
        super::hash_final_impl(id)
    }

    #[rquickjs::function]
    pub fn hash_copy(id: u32) -> Option<u32> {
        super::hash_copy_impl(id)
    }

    #[rquickjs::function]
    pub fn hash_free(id: u32) {
        super::CONTEXTS.lock().unwrap().remove(&id);
    }

    #[rquickjs::function]
    pub fn hash_one_shot(algorithm: String, data: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let algo = algorithm.to_lowercase();
        let mut hasher = super::create_hasher(&algo)?;
        if let Some(raw) = data.as_raw() {
            let slice = unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) };
            hasher.update(slice);
        }
        Some(hasher.finalize())
    }

    #[rquickjs::function]
    pub fn hmac_init(algorithm: String, key: TypedArray<'_, u8>) -> Option<u32> {
        if let Some(raw) = key.as_raw() {
            let slice = unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) };
            super::hmac_init_impl(&algorithm, slice)
        } else {
            None
        }
    }

    #[rquickjs::function]
    pub fn hmac_update(id: u32, data: TypedArray<'_, u8>) -> bool {
        if let Some(raw) = data.as_raw() {
            let slice = unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) };
            super::hmac_update_impl(id, slice)
        } else {
            false
        }
    }

    #[rquickjs::function]
    pub fn hmac_final(id: u32) -> Option<Vec<u8>> {
        super::hmac_final_impl(id)
    }

    #[rquickjs::function]
    pub fn hmac_free(id: u32) {
        super::HMAC_CONTEXTS.lock().unwrap().remove(&id);
    }

    #[rquickjs::function]
    pub fn get_hashes() -> Vec<String> {
        super::SUPPORTED_HASHES
            .iter()
            .map(|s| s.to_string())
            .collect()
    }

    #[rquickjs::function]
    pub fn random_bytes(len: u32) -> Vec<u8> {
        use rand::RngCore;
        let mut buf = vec![0u8; len as usize];
        rand::rng().fill_bytes(&mut buf);
        buf
    }

    #[rquickjs::function]
    pub fn random_int_range(min: f64, max: f64) -> Option<f64> {
        use rand::RngCore;
        let min_i = min as i64;
        let max_i = max as i64;
        if min_i >= max_i {
            return None;
        }
        let range = (max_i - min_i) as u64;
        let mut buf = [0u8; 8];
        rand::rng().fill_bytes(&mut buf);
        let random_val = u64::from_le_bytes(buf);
        let result = min_i + (random_val % range) as i64;
        Some(result as f64)
    }

    #[rquickjs::function]
    pub fn timing_safe_equal(a: TypedArray<'_, u8>, b: TypedArray<'_, u8>) -> Option<bool> {
        let a_raw = a.as_raw()?;
        let b_raw = b.as_raw()?;
        if a_raw.len != b_raw.len {
            return None;
        }
        let a_slice = unsafe { std::slice::from_raw_parts(a_raw.ptr.as_ptr(), a_raw.len) };
        let b_slice = unsafe { std::slice::from_raw_parts(b_raw.ptr.as_ptr(), b_raw.len) };
        use subtle::ConstantTimeEq;
        Some(a_slice.ct_eq(b_slice).into())
    }

    #[rquickjs::function]
    pub fn certificate_verify_spkac(spkac: TypedArray<'_, u8>) -> Option<bool> {
        let slice = spkac
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::certificate_verify_spkac_impl(slice)
    }

    #[rquickjs::function]
    pub fn certificate_export_public_key(spkac: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let slice = spkac
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::certificate_export_public_key_impl(slice)
    }

    #[rquickjs::function]
    pub fn certificate_export_challenge(spkac: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let slice = spkac
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::certificate_export_challenge_impl(slice)
    }

    #[rquickjs::function]
    pub fn randomize_int8_array(array: TypedArray<'_, i8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint8_array(array: TypedArray<'_, u8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint8_clamped_array(array: TypedArray<'_, u8>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_int16_array(array: TypedArray<'_, i16>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint16_array(array: TypedArray<'_, u16>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_int32_array(array: TypedArray<'_, i32>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_uint32_array(array: TypedArray<'_, u32>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_bigint64_array(array: TypedArray<'_, i64>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn randomize_biguint64_array(array: TypedArray<'_, u64>) {
        super::randomize_typed_array(array);
    }

    #[rquickjs::function]
    pub fn pbkdf2_derive(
        algorithm: String,
        password: TypedArray<'_, u8>,
        salt: TypedArray<'_, u8>,
        iterations: u32,
        keylen: u32,
    ) -> Option<Vec<u8>> {
        let password_slice = password
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        let salt_slice = salt
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::pbkdf2_derive_impl(&algorithm, password_slice, salt_slice, iterations, keylen)
    }

    #[rquickjs::function]
    pub fn hkdf_derive(
        algorithm: String,
        ikm: TypedArray<'_, u8>,
        salt: TypedArray<'_, u8>,
        info: TypedArray<'_, u8>,
        keylen: u32,
    ) -> Option<Vec<u8>> {
        let ikm_slice = ikm
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        let salt_slice = salt
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        let info_slice = info
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::hkdf_derive_impl(&algorithm, ikm_slice, salt_slice, info_slice, keylen)
    }

    #[rquickjs::function]
    pub fn scrypt_derive(
        password: TypedArray<'_, u8>,
        salt: TypedArray<'_, u8>,
        n: u32,
        r: u32,
        p: u32,
        keylen: u32,
    ) -> Option<Vec<u8>> {
        let password_slice = password
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        let salt_slice = salt
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::scrypt_derive_impl(password_slice, salt_slice, n, r, p, keylen)
    }

    #[rquickjs::function]
    pub fn cipher_init(
        algorithm: String,
        key: TypedArray<'_, u8>,
        iv: TypedArray<'_, u8>,
        decrypt: bool,
    ) -> Option<u32> {
        let key_slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        let iv_slice = iv
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::cipher_init_impl(&algorithm.to_lowercase(), key_slice, iv_slice, decrypt)
    }

    #[rquickjs::function]
    pub fn cipher_update(id: u32, data: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let data_slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::cipher_update_impl(id, data_slice)
    }

    #[rquickjs::function]
    pub fn cipher_final(id: u32) -> Option<Vec<u8>> {
        super::cipher_final_impl(id)
    }

    #[rquickjs::function]
    pub fn cipher_free(id: u32) {
        super::CIPHER_CONTEXTS.lock().unwrap().remove(&id);
    }

    #[rquickjs::function]
    pub fn cipher_set_aad(id: u32, aad: TypedArray<'_, u8>) -> bool {
        let aad_slice = aad
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::cipher_set_aad_impl(id, aad_slice)
    }

    #[rquickjs::function]
    pub fn cipher_get_auth_tag(id: u32) -> Option<Vec<u8>> {
        super::cipher_get_auth_tag_impl(id)
    }

    #[rquickjs::function]
    pub fn cipher_set_auth_tag(id: u32, tag: TypedArray<'_, u8>) -> bool {
        let tag_slice = tag
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::cipher_set_auth_tag_impl(id, tag_slice)
    }

    #[rquickjs::function]
    pub fn cipher_set_auto_padding(id: u32, enabled: bool) -> bool {
        super::cipher_set_auto_padding_impl(id, enabled)
    }

    #[rquickjs::function]
    pub fn get_ciphers() -> Vec<String> {
        super::SUPPORTED_CIPHERS
            .iter()
            .map(|s| s.to_string())
            .collect()
    }

    #[rquickjs::function]
    pub fn generate_key_pair(
        algorithm: String,
        named_curve: Option<String>,
        modulus_length: Option<u32>,
        public_exponent: Option<u32>,
    ) -> Option<Vec<u32>> {
        let curve_ref = named_curve.as_deref();
        super::generate_key_pair_impl(&algorithm, curve_ref, modulus_length, public_exponent)
            .map(|(priv_id, pub_id)| vec![priv_id, pub_id])
    }

    #[rquickjs::function]
    pub fn key_type(id: u32) -> Option<String> {
        super::key_type_impl(id)
    }

    #[rquickjs::function]
    pub fn key_asymmetric_type(id: u32) -> Option<String> {
        super::key_asymmetric_type_impl(id)
    }

    #[rquickjs::function]
    pub fn key_export(id: u32, format: String, type_: Option<String>) -> Option<Vec<u8>> {
        super::key_export_impl(id, &format, type_.as_deref())
    }

    #[rquickjs::function]
    pub fn key_export_encrypted(
        id: u32,
        format: String,
        type_: String,
        cipher_name: String,
        passphrase: TypedArray<'_, u8>,
    ) -> Option<Vec<u8>> {
        let slice = passphrase
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::key_export_encrypted_impl(id, &format, &type_, &cipher_name, slice)
    }

    #[rquickjs::function]
    pub fn key_export_jwk(id: u32) -> Option<String> {
        super::key_export_jwk_impl(id)
    }

    #[rquickjs::function]
    pub fn key_asymmetric_details(id: u32) -> Option<Vec<u64>> {
        super::key_asymmetric_details_impl(id)
            .map(|(modulus_length, public_exponent)| vec![modulus_length as u64, public_exponent])
    }

    #[rquickjs::function]
    pub fn key_free(id: u32) {
        super::KEY_STORE.lock().unwrap().remove(&id);
    }

    #[rquickjs::function]
    pub fn create_private_key_der(data: TypedArray<'_, u8>) -> Option<u32> {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::create_private_key_from_der(slice)
            .or_else(|| super::create_rsa_private_key_from_der(slice))
    }

    #[rquickjs::function]
    pub fn create_private_key_pem(pem: String) -> Option<u32> {
        super::create_private_key_from_pem(&pem)
            .or_else(|| super::create_rsa_private_key_from_pem(&pem))
    }

    #[rquickjs::function]
    pub fn create_private_key_encrypted_pem(
        pem: String,
        passphrase: TypedArray<'_, u8>,
    ) -> Option<u32> {
        let slice = passphrase
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::create_private_key_from_encrypted_pem(&pem, slice)
    }

    #[rquickjs::function]
    pub fn create_public_key_der(data: TypedArray<'_, u8>) -> Option<u32> {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::create_public_key_from_der(slice)
            .or_else(|| super::create_rsa_public_key_from_der(slice))
    }

    #[rquickjs::function]
    pub fn create_public_key_pem(pem: String) -> Option<u32> {
        super::create_public_key_from_pem(&pem)
            .or_else(|| super::create_rsa_public_key_from_pem(&pem))
    }

    #[rquickjs::function]
    pub fn create_public_key_from_private_key(private_id: u32) -> Option<u32> {
        super::create_public_key_from_private(private_id)
    }

    #[rquickjs::function]
    pub fn create_secret_key_native(data: TypedArray<'_, u8>) -> u32 {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::create_secret_key(slice)
    }

    #[rquickjs::function]
    pub fn sign_init(algorithm: Option<String>, key_id: u32) -> Option<u32> {
        let algo_ref = algorithm.as_deref();
        super::sign_init_impl(algo_ref, key_id)
    }

    #[rquickjs::function]
    pub fn sign_update(id: u32, data: TypedArray<'_, u8>) -> bool {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::sign_update_impl(id, slice)
    }

    #[rquickjs::function]
    pub fn sign_final_native(id: u32) -> Option<Vec<u8>> {
        super::sign_final_impl(id)
    }

    #[rquickjs::function]
    pub fn verify_init(algorithm: Option<String>, key_id: u32) -> Option<u32> {
        let algo_ref = algorithm.as_deref();
        super::verify_init_impl(algo_ref, key_id)
    }

    #[rquickjs::function]
    pub fn verify_update(id: u32, data: TypedArray<'_, u8>) -> bool {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::verify_update_impl(id, slice)
    }

    #[rquickjs::function]
    pub fn verify_final_native(id: u32, signature: TypedArray<'_, u8>) -> Option<bool> {
        let slice = signature
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::verify_final_impl(id, slice)
    }

    #[rquickjs::function]
    pub fn public_encrypt(key_id: u32, data: TypedArray<'_, u8>, padding: u32) -> Option<Vec<u8>> {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::public_encrypt_impl(key_id, slice, padding)
    }

    #[rquickjs::function]
    pub fn private_decrypt(key_id: u32, data: TypedArray<'_, u8>, padding: u32) -> Option<Vec<u8>> {
        let slice = data
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::private_decrypt_impl(key_id, slice, padding)
    }

    // ===== DH native functions =====

    #[rquickjs::function]
    pub fn dh_create_group(name: String) -> Option<u32> {
        super::dh_create_from_group_impl(&name)
    }

    #[rquickjs::function]
    pub fn dh_create_from_prime(prime: TypedArray<'_, u8>, generator: TypedArray<'_, u8>) -> u32 {
        let prime_slice = prime
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        let gen_slice = generator
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::dh_create_from_prime_impl(prime_slice, gen_slice)
    }

    #[rquickjs::function]
    pub fn dh_create_from_size(bits: u32) -> Option<u32> {
        super::dh_create_from_size_impl(bits).ok()
    }

    #[rquickjs::function]
    pub fn dh_create_from_size_err(bits: u32) -> Vec<String> {
        match super::dh_create_from_size_impl(bits) {
            Ok(id) => vec![id.to_string()],
            Err(msg) => vec!["error".to_string(), msg],
        }
    }

    #[rquickjs::function]
    pub fn dh_generate_keys(id: u32) -> Option<Vec<u8>> {
        super::dh_generate_keys_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_compute_secret(id: u32, other_pub: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let slice = other_pub
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::dh_compute_secret_impl(id, slice).ok()
    }

    #[rquickjs::function]
    pub fn dh_compute_secret_err(id: u32, other_pub: TypedArray<'_, u8>) -> Vec<String> {
        let slice = other_pub
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        match super::dh_compute_secret_impl(id, slice) {
            Ok(bytes) => {
                let hex: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
                vec!["ok".to_string(), hex]
            }
            Err(msg) => vec!["error".to_string(), msg],
        }
    }

    #[rquickjs::function]
    pub fn dh_get_prime(id: u32) -> Option<Vec<u8>> {
        super::dh_get_prime_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_get_generator(id: u32) -> Option<Vec<u8>> {
        super::dh_get_generator_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_get_public_key(id: u32) -> Option<Vec<u8>> {
        super::dh_get_public_key_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_get_private_key(id: u32) -> Option<Vec<u8>> {
        super::dh_get_private_key_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_get_verify_error(id: u32) -> Option<u32> {
        super::dh_get_verify_error_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_set_public_key(id: u32, key: TypedArray<'_, u8>) -> bool {
        let slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::dh_set_public_key_impl(id, slice);
        true
    }

    #[rquickjs::function]
    pub fn dh_set_private_key(id: u32, key: TypedArray<'_, u8>) -> bool {
        let slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::dh_set_private_key_impl(id, slice)
    }

    #[rquickjs::function]
    pub fn dh_is_group(id: u32) -> bool {
        super::dh_is_group_impl(id)
    }

    #[rquickjs::function]
    pub fn dh_free(id: u32) {
        super::DH_CONTEXTS.lock().unwrap().remove(&id);
    }

    // ===== ECDH native functions =====

    #[rquickjs::function]
    pub fn ecdh_create(curve: String) -> Option<u32> {
        super::ecdh_create_impl(&curve)
    }

    #[rquickjs::function]
    pub fn ecdh_generate_keys(id: u32) -> Option<Vec<u8>> {
        super::ecdh_generate_keys_impl(id)
    }

    #[rquickjs::function]
    pub fn ecdh_compute_secret(id: u32, other_pub: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let slice = other_pub
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::ecdh_compute_secret_impl(id, slice).ok()
    }

    #[rquickjs::function]
    pub fn ecdh_compute_secret_err(id: u32, other_pub: TypedArray<'_, u8>) -> Vec<String> {
        let slice = other_pub
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        match super::ecdh_compute_secret_impl(id, slice) {
            Ok(bytes) => {
                let hex: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
                vec!["ok".to_string(), hex]
            }
            Err(msg) => vec!["error".to_string(), msg],
        }
    }

    #[rquickjs::function]
    pub fn ecdh_get_public_key(id: u32, compressed: bool) -> Option<Vec<u8>> {
        super::ecdh_get_public_key_impl(id, compressed)
    }

    #[rquickjs::function]
    pub fn ecdh_get_private_key(id: u32) -> Option<Vec<u8>> {
        super::ecdh_get_private_key_impl(id)
    }

    #[rquickjs::function]
    pub fn ecdh_set_private_key(id: u32, key: TypedArray<'_, u8>) -> Option<Vec<u8>> {
        let slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::ecdh_set_private_key_impl(id, slice).ok()
    }

    #[rquickjs::function]
    pub fn ecdh_set_private_key_err(id: u32, key: TypedArray<'_, u8>) -> Vec<String> {
        let slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        match super::ecdh_set_private_key_impl(id, slice) {
            Ok(bytes) => {
                let hex: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
                vec!["ok".to_string(), hex]
            }
            Err(msg) => vec!["error".to_string(), msg],
        }
    }

    #[rquickjs::function]
    pub fn ecdh_set_public_key(id: u32, key: TypedArray<'_, u8>) -> bool {
        let slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        super::ecdh_set_public_key_impl(id, slice).is_ok()
    }

    #[rquickjs::function]
    pub fn ecdh_set_public_key_err(id: u32, key: TypedArray<'_, u8>) -> Vec<String> {
        let slice = key
            .as_raw()
            .map(|raw| unsafe { std::slice::from_raw_parts(raw.ptr.as_ptr(), raw.len) })
            .unwrap_or(&[]);
        match super::ecdh_set_public_key_impl(id, slice) {
            Ok(_) => vec!["ok".to_string()],
            Err(msg) => vec!["error".to_string(), msg],
        }
    }

    #[rquickjs::function]
    pub fn ecdh_free(id: u32) {
        super::ECDH_CONTEXTS.lock().unwrap().remove(&id);
    }
}

fn randomize_typed_array<V>(array: TypedArray<V>) {
    if let Some(raw) = array.as_raw() {
        let slice = unsafe { slice::from_raw_parts_mut(raw.ptr.as_ptr(), raw.len) };
        rand::rng().fill_bytes(slice);
    }
}

// JS functions for the crypto implementation
pub const WEB_CRYPTO_JS: &str = include_str!("web-crypto.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from '__wasm_rquickjs_builtin/web_crypto';"#;

// JS code wiring the crypto module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_web_crypto from '__wasm_rquickjs_builtin/web_crypto';
        globalThis.crypto = __wasm_rquickjs_web_crypto;
    "#;
