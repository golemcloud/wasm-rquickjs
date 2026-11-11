declare module 'buffer-utils' {
  export function testIsAscii(): boolean;
  export function testIsUtf8(): boolean;
  export function testUtf8Encoding(): boolean;
  export function testUtf8TrailingSurrogates(): boolean;
}
