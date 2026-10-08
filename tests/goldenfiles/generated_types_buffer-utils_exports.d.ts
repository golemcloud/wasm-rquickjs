declare module 'buffer-utils' {
  export function testIsAscii(): Promise<boolean>;
  export function testIsUtf8(): Promise<boolean>;
  export function testUtf8Encoding(): Promise<boolean>;
  export function testUtf8TrailingSurrogates(): Promise<boolean>;
}
