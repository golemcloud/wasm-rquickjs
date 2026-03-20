declare module 'streams' {
  export function test1(): Promise<void>;
  export function testNodeStream1(): Promise<string>;
  export function testConsumersText(): Promise<string>;
  export function testConsumersJson(): Promise<string>;
  export function testConsumersBuffer(): Promise<number>;
  export function testConsumersArraybuffer(): Promise<number>;
  export function testReadableFromWeb(): Promise<string>;
  export function testReadableToWeb(): Promise<string>;
  export function testWritableFromWeb(): Promise<string>;
  export function testWritableToWeb(): Promise<string>;
  export function testDuplexFromWeb(): Promise<string>;
}
