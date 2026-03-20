declare module 'buffer-utils' {
  export function testIsAscii(): Promise<boolean>;
  export function testIsUtf8(): Promise<boolean>;
}
