declare module 'streams' {
  export function test1(): void;
  export function testNodeStream1(): string;
  export function testConsumersText(): string;
  export function testConsumersJson(): string;
  export function testConsumersBuffer(): number;
  export function testConsumersArraybuffer(): number;
  export function testReadableFromWeb(): string;
  export function testReadableToWeb(): string;
  export function testWritableFromWeb(): string;
  export function testWritableToWeb(): string;
  export function testDuplexFromWeb(): string;
}
