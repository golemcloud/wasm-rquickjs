declare module 'structured-clone' {
  export function testPrimitives(): Promise<string>;
  export function testObjects(): Promise<string>;
  export function testArrays(): Promise<string>;
  export function testCollections(): Promise<string>;
  export function testSpecialTypes(): Promise<string>;
  export function testCircularRefs(): Promise<string>;
}
