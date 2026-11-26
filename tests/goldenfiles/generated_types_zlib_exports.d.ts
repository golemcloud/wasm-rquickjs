declare module 'zlib' {
  export function testByteTransfer(): boolean;
  export function testZstd(): boolean;
  export function testZstdDisabled(): boolean;
  export function testTrailingInput(): boolean;
}
