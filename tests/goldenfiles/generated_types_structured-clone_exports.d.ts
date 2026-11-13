declare module 'structured-clone' {
  export function testPolicyCase(index: number): string;
  export function testPrimitives(): string;
  export function testObjects(): string;
  export function testArrays(): string;
  export function testCollections(): string;
  export function testSpecialTypes(): string;
  export function testCircularRefs(): string;
}
