import { Buffer, isAscii, isUtf8 } from 'node:buffer';

export function testUtf8Encoding() {
  for (const [unit, expected] of [
    ['abc', '616263'], ['é日', 'c3a9e697a5'],
    ['\ud800a', 'efbfbd61'], ['\udc00', 'efbfbd'],
    ['😀', 'f09f9880'], ['\ud800a\udc00', 'efbfbd61efbfbd'],
  ]) {
    for (const count of [1, 9000]) {
      const text = unit.repeat(count);
      for (const encoding of [undefined, '', 'utf8', 'utf-8', 'UTF8', 'UTF-8']) {
        const actual = Buffer.from(text, encoding);
        if (actual.toString('hex') !== expected.repeat(count)) throw new Error(`encoding mismatch: ${JSON.stringify(unit)} x ${count}, ${encoding}: ${actual.toString('hex').slice(0, 60)}`);
        if (Buffer.byteLength(text, encoding) !== actual.length) throw new Error('length mismatch');
        if (!Buffer.isBuffer(actual)) throw new Error('not a Buffer');
        const independent = Buffer.from(text, encoding);
        actual[0] ^= 0xff;
        if (actual[0] === independent[0]) throw new Error('aliased allocation');
      }
    }
  }
  if (Buffer.from('').length !== 0 || Buffer.byteLength('') !== 0) return false;
  if (Buffer.byteLength('é', 'unknown') !== 2) return false;
  for (const [text, expectedBackingLength] of [
    ['a'.repeat(4095), Buffer.poolSize],
    ['é'.repeat(2047) + 'a', Buffer.poolSize],
    ['a'.repeat(4096), 4096],
    ['é'.repeat(2048), 4096],
  ]) {
    const result = Buffer.from(text, 'UTF-8');
    if (result.length !== Buffer.byteLength(text) || result.buffer.byteLength !== expectedBackingLength) throw new Error('UTF-8 pool boundary');
  }
  const originalToLowerCase = String.prototype.toLowerCase;
  try {
    String.prototype.toLowerCase = () => { throw new Error('overridden toLowerCase called'); };
    if (!Buffer.isEncoding('UTF-8')) throw new Error('mutable encoding normalizer');
    if (Buffer.from('é', 'UTF-8').toString('hex') !== 'c3a9') throw new Error('mutable from encoding normalizer');
    if (Buffer.byteLength('é', 'UTF-8') !== 2) throw new Error('mutable byteLength encoding normalizer');
    const target = Buffer.alloc(2);
    if (target.write('é', 0, 2, 'UTF-8') !== 2 || target.toString('hex') !== 'c3a9') throw new Error('mutable write encoding normalizer');
  } finally {
    String.prototype.toLowerCase = originalToLowerCase;
  }
  const publicArrayBuffer = new ArrayBuffer(1);
  const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
  const intrinsicDescriptors = [
    [typedArrayPrototype, 'buffer'],
    [typedArrayPrototype, 'byteOffset'],
    [ArrayBuffer.prototype, 'byteLength'],
  ].map(([target, property]) => [target, property, Object.getOwnPropertyDescriptor(target, property)]);
  try {
    for (const [target, property] of intrinsicDescriptors) {
      Object.defineProperty(target, property, {
        configurable: true,
        get: () => { throw new Error(`overridden ${property} called`); },
      });
    }
    const result = Buffer.from('a'.repeat(9000));
    if (result.length !== 9000 || result[0] !== 0x61 || result[8999] !== 0x61) throw new Error('mutable typed array intrinsic');
    let observedArrayBufferGetter = false;
    try {
      Buffer.from(publicArrayBuffer);
    } catch (error) {
      if (error.message !== 'overridden byteLength called') throw error;
      observedArrayBufferGetter = true;
    }
    if (!observedArrayBufferGetter) throw new Error('ArrayBuffer byteLength getter was bypassed');
  } finally {
    for (const [target, property, descriptor] of intrinsicDescriptors) Object.defineProperty(target, property, descriptor);
  }
  return true;
}

export function testUtf8TrailingSurrogates() {
  for (const [unit, expected] of [
    ['\ud800', 'efbfbd'], ['\ud800\ud801', 'efbfbdefbfbd'],
    ['a\ud800\ud801', '61efbfbdefbfbd'], ['\ud800😀\ud801', 'efbfbdf09f9880efbfbd'],
  ]) {
    for (const count of [1, 2, 9000]) {
      const text = unit.repeat(count);
      const hex = expected.repeat(count);
      if (Buffer.from(text).toString('hex') !== hex) throw new Error('missing trailing replacement');
      if (Buffer.byteLength(text) !== hex.length / 2) throw new Error('surrogate byte length');
    }
  }
  // UTF-8 writes must never emit a partial replacement character.
  for (const size of [1, 2, 3, 4, 5, 6, 7]) {
    const offset = 2;
    const target = Buffer.alloc(12, 0x55);
    const written = target.write('\ud800\ud801', offset, size, 'utf8');
    const expected = Math.min(2, Math.floor(size / 3)) * 3;
    if (written !== expected) throw new Error('bounded surrogate write length');
    if (target.subarray(offset, offset + written).toString('hex') !== 'efbfbd'.repeat(expected / 3)) throw new Error('bounded surrogate write bytes');
    if (target.subarray(0, offset).some(byte => byte !== 0x55) ||
        target.subarray(offset + written).some(byte => byte !== 0x55)) throw new Error('partial replacement write');
  }
  for (const [text, hex] of [['¢', 'c2a2'], ['€', 'e282ac'], ['😀', 'f09f9880']]) {
    const width = hex.length / 2;
    for (const size of Array.from({length: width + 1}, (_, index) => index)) {
      for (const write of [
        (target, offset) => target.write(text, offset, size, 'utf8'),
        (target, offset) => target.utf8Write(text, offset, size),
      ]) {
        const offset = 2;
        const target = Buffer.alloc(12, 0x55);
        const written = write(target, offset);
        const expected = size < width ? 0 : width;
        if (written !== expected) throw new Error('bounded multibyte write length');
        if (target.subarray(offset, offset + written).toString('hex') !== hex.slice(0, written * 2)) throw new Error('bounded multibyte write bytes');
        if (target.subarray(0, offset).some(byte => byte !== 0x55) ||
            target.subarray(offset + written).some(byte => byte !== 0x55)) throw new Error('partial multibyte write');
      }
    }
  }
  const longTail = 'a'.repeat(1_000_000);
  for (const [text, length, expectedHex] of [
    [longTail, 1, '61'],
    ['😀' + longTail, 3, ''],
    ['😀' + longTail, 4, 'f09f9880'],
    ['\ud800' + longTail, 2, ''],
    ['\ud800' + longTail, 3, 'efbfbd'],
  ]) {
    const target = Buffer.alloc(4, 0x55);
    const written = target.write(text, 0, length, 'utf8');
    if (written !== expectedHex.length / 2 || target.subarray(0, written).toString('hex') !== expectedHex) throw new Error('bounded long UTF-8 source');
    if (target.subarray(written).some(byte => byte !== 0x55)) throw new Error('bounded long UTF-8 overwrite');
  }
  const originalSlice = String.prototype.slice;
  try {
    String.prototype.slice = () => { throw new Error('overridden slice called'); };
    const target = Buffer.alloc(1);
    if (target.write(longTail, 0, 1, 'utf8') !== 1 || target[0] !== 0x61) throw new Error('mutable slice intrinsic');
  } finally {
    String.prototype.slice = originalSlice;
  }
  const originalCharCodeAt = String.prototype.charCodeAt;
  try {
    String.prototype.charCodeAt = () => { throw new Error('zero-length write scanned input'); };
    if (Buffer.alloc(8).write('abc', 2, 0, 'utf8') !== 0) throw new Error('zero-length write');
  } finally {
    String.prototype.charCodeAt = originalCharCodeAt;
  }
  for (const length of [0, 1]) {
    for (const write of [
      (target, value) => target.write(value, 0, length, 'utf8'),
      (target, value) => target.utf8Write(value, 0, length),
    ]) {
      const target = Buffer.alloc(4);
      let coerced = false;
      const hostile = {toString() { coerced = true; throw new Error('source was coerced'); }};
      try {
        write(target, hostile);
        throw new Error('non-string UTF-8 source accepted');
      } catch (error) {
        if (error.code !== 'ERR_INVALID_ARG_TYPE') throw error;
      }
      if (coerced) throw new Error('non-string UTF-8 source was coerced');
    }
  }
  const originalTest = RegExp.prototype.test;
  const originalExec = RegExp.prototype.exec;
  const originalToWellFormed = String.prototype.toWellFormed;
  const originalIsWellFormed = String.prototype.isWellFormed;
  try {
    RegExp.prototype.test = () => { throw new Error('overridden test called'); };
    RegExp.prototype.exec = () => { throw new Error('overridden exec called'); };
    String.prototype.toWellFormed = () => { throw new Error('overridden toWellFormed called'); };
    String.prototype.isWellFormed = () => { throw new Error('overridden isWellFormed called'); };
    for (const [text, expectedLength] of [
      ['abc', 3], ['\ud800', 3], ['😀', 4], ['a'.repeat(9000), 9000],
      ['😀'.repeat(9000), 36000], ['\ud800'.repeat(9000), 27000],
    ]) {
      if (Buffer.byteLength(text) !== expectedLength || Buffer.from(text).length !== expectedLength) throw new Error('mutable UTF-8 intrinsic');
    }
  } finally {
    RegExp.prototype.test = originalTest;
    RegExp.prototype.exec = originalExec;
    String.prototype.toWellFormed = originalToWellFormed;
    String.prototype.isWellFormed = originalIsWellFormed;
  }
  return true;
}

export function testIsAscii() {
  // Pure ASCII
  if (!isAscii(Buffer.from('hello'))) return false;
  if (!isAscii(Buffer.from(''))) return false;
  if (!isAscii(new Uint8Array([0x00, 0x7f, 0x41]))) return false;

  // Non-ASCII
  if (isAscii(Buffer.from('héllo'))) return false;
  if (isAscii(Buffer.from('日本語'))) return false;
  if (isAscii(new Uint8Array([0x80]))) return false;
  if (isAscii(new Uint8Array([0xff]))) return false;

  // DataView
  const dv = new DataView(new ArrayBuffer(3));
  dv.setUint8(0, 0x41);
  dv.setUint8(1, 0x42);
  dv.setUint8(2, 0x43);
  if (!isAscii(dv)) return false;

  return true;
}

export function testIsUtf8() {
  // Valid UTF-8
  if (!isUtf8(Buffer.from('hello'))) return false;
  if (!isUtf8(Buffer.from(''))) return false;
  if (!isUtf8(Buffer.from('héllo'))) return false;
  if (!isUtf8(Buffer.from('日本語'))) return false;
  if (!isUtf8(Buffer.from('𠮷'))) return false;

  // Invalid UTF-8: lone continuation byte
  if (isUtf8(new Uint8Array([0x80]))) return false;
  // Invalid: overlong 2-byte
  if (isUtf8(new Uint8Array([0xC0, 0x80]))) return false;
  if (isUtf8(new Uint8Array([0xC1, 0xBF]))) return false;
  // Invalid: truncated 2-byte
  if (isUtf8(new Uint8Array([0xC2]))) return false;
  // Invalid: truncated 3-byte
  if (isUtf8(new Uint8Array([0xE0, 0xA0]))) return false;
  // Invalid: surrogate (U+D800)
  if (isUtf8(new Uint8Array([0xED, 0xA0, 0x80]))) return false;
  // Invalid: truncated 4-byte
  if (isUtf8(new Uint8Array([0xF0, 0x90, 0x80]))) return false;
  // Invalid: > U+10FFFF
  if (isUtf8(new Uint8Array([0xF4, 0x90, 0x80, 0x80]))) return false;
  // Invalid: 0xF5+
  if (isUtf8(new Uint8Array([0xF5, 0x80, 0x80, 0x80]))) return false;

  // Valid multi-byte sequences
  if (!isUtf8(new Uint8Array([0xC2, 0x80]))) return false; // U+0080
  if (!isUtf8(new Uint8Array([0xE0, 0xA0, 0x80]))) return false; // U+0800
  if (!isUtf8(new Uint8Array([0xF0, 0x90, 0x80, 0x80]))) return false; // U+10000
  if (!isUtf8(new Uint8Array([0xF4, 0x8F, 0xBF, 0xBF]))) return false; // U+10FFFF

  // DataView
  const ab = new ArrayBuffer(5);
  const u8 = new Uint8Array(ab);
  u8[0] = 0x68; u8[1] = 0x65; u8[2] = 0x6C; u8[3] = 0x6C; u8[4] = 0x6F; // "hello"
  const dv = new DataView(ab);
  if (!isUtf8(dv)) return false;

  return true;
}
