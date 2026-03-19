import { Buffer, isAscii, isUtf8 } from 'node:buffer';

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
