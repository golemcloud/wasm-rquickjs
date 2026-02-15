// Compatibility shim for Node.js test/common/crypto module.
// Provides crypto-related helpers in WASM/QuickJS environment.

'use strict';

var common = require('./index');
if (!common.hasCrypto) {
  common.skip('missing crypto');
}

var assert = require('assert');
var crypto = require('crypto');

// The values below (modp2buf) are for a 1024 bits long prime from
// RFC 2412 E.2, see https://tools.ietf.org/html/rfc2412.
var modp2buf = Buffer.from([
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc9, 0x0f,
  0xda, 0xa2, 0x21, 0x68, 0xc2, 0x34, 0xc4, 0xc6, 0x62, 0x8b,
  0x80, 0xdc, 0x1c, 0xd1, 0x29, 0x02, 0x4e, 0x08, 0x8a, 0x67,
  0xcc, 0x74, 0x02, 0x0b, 0xbe, 0xa6, 0x3b, 0x13, 0x9b, 0x22,
  0x51, 0x4a, 0x08, 0x79, 0x8e, 0x34, 0x04, 0xdd, 0xef, 0x95,
  0x19, 0xb3, 0xcd, 0x3a, 0x43, 0x1b, 0x30, 0x2b, 0x0a, 0x6d,
  0xf2, 0x5f, 0x14, 0x37, 0x4f, 0xe1, 0x35, 0x6d, 0x6d, 0x51,
  0xc2, 0x45, 0xe4, 0x85, 0xb5, 0x76, 0x62, 0x5e, 0x7e, 0xc6,
  0xf4, 0x4c, 0x42, 0xe9, 0xa6, 0x37, 0xed, 0x6b, 0x0b, 0xff,
  0x5c, 0xb6, 0xf4, 0x06, 0xb7, 0xed, 0xee, 0x38, 0x6b, 0xfb,
  0x5a, 0x89, 0x9f, 0xa5, 0xae, 0x9f, 0x24, 0x11, 0x7c, 0x4b,
  0x1f, 0xe6, 0x49, 0x28, 0x66, 0x51, 0xec, 0xe6, 0x53, 0x81,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
]);

function assertApproximateSize(key, expectedSize) {
  var u = typeof key === 'string' ? 'chars' : 'bytes';
  var min = Math.floor(0.9 * expectedSize);
  var max = Math.ceil(1.1 * expectedSize);
  assert(key.length >= min,
         'Key (' + key.length + ' ' + u + ') is shorter than expected (' + min + ' ' + u + ')');
  assert(key.length <= max,
         'Key (' + key.length + ' ' + u + ') is longer than expected (' + max + ' ' + u + ')');
}

function testEncryptDecrypt() {
  common.skip('publicEncrypt/privateDecrypt not supported in WASM');
}

function testSignVerify() {
  common.skip('sign/verify not supported in WASM');
}

function getRegExpForPEM(label, cipher) {
  var head = '\\-\\-\\-\\-\\-BEGIN ' + label + '\\-\\-\\-\\-\\-';
  var rfc1421Header = cipher == null ? '' :
    '\nProc-Type: 4,ENCRYPTED\nDEK-Info: ' + cipher + ',[^\n]+\n';
  var body = '([a-zA-Z0-9\\+/=]{64}\n)*[a-zA-Z0-9\\+/=]{1,64}';
  var end = '\\-\\-\\-\\-\\-END ' + label + '\\-\\-\\-\\-\\-';
  return new RegExp('^' + head + rfc1421Header + '\n' + body + '\n' + end + '\n$');
}

var pkcs1PubExp = getRegExpForPEM('RSA PUBLIC KEY');
var pkcs1PrivExp = getRegExpForPEM('RSA PRIVATE KEY');
var pkcs1EncExp = function(cipher) { return getRegExpForPEM('RSA PRIVATE KEY', cipher); };
var spkiExp = getRegExpForPEM('PUBLIC KEY');
var pkcs8Exp = getRegExpForPEM('PRIVATE KEY');
var pkcs8EncExp = getRegExpForPEM('ENCRYPTED PRIVATE KEY');
var sec1Exp = getRegExpForPEM('EC PRIVATE KEY');
var sec1EncExp = function(cipher) { return getRegExpForPEM('EC PRIVATE KEY', cipher); };

// hasOpenSSL always returns false in WASM — we have no OpenSSL
var hasOpenSSL = function() { return false; };

module.exports = {
  modp2buf: modp2buf,
  assertApproximateSize: assertApproximateSize,
  testEncryptDecrypt: testEncryptDecrypt,
  testSignVerify: testSignVerify,
  pkcs1PubExp: pkcs1PubExp,
  pkcs1PrivExp: pkcs1PrivExp,
  pkcs1EncExp: pkcs1EncExp,
  spkiExp: spkiExp,
  pkcs8Exp: pkcs8Exp,
  pkcs8EncExp: pkcs8EncExp,
  sec1Exp: sec1Exp,
  sec1EncExp: sec1EncExp,
  hasOpenSSL: hasOpenSSL,
  get hasOpenSSL3() {
    return false;
  },
  get opensslCli() {
    return false;
  },
};
