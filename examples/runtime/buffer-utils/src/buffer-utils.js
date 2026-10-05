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
  if (Buffer.byteLength('é', 'unknown', true) !== -1) return false;
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
    const target = Buffer.alloc(size, 0x55);
    const written = target.write('\ud800\ud801', 0, size, 'utf8');
    const expected = Math.min(2, Math.floor(size / 3)) * 3;
    if (written !== expected) throw new Error('bounded surrogate write length');
    if (target.subarray(0, written).toString('hex') !== 'efbfbd'.repeat(expected / 3)) throw new Error('bounded surrogate write bytes');
    if (target.subarray(written).some(byte => byte !== 0x55)) throw new Error('partial replacement write');
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
