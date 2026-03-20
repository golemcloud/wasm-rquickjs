declare module 'assert' {
  export function testOk(): Promise<boolean>;
  export function testEqual(): Promise<boolean>;
  export function testStrictEqual(): Promise<boolean>;
  export function testDeepEqual(): Promise<boolean>;
  export function testDeepStrictEqual(): Promise<boolean>;
  export function testThrows(): Promise<boolean>;
  export function testDoesNotThrow(): Promise<boolean>;
  export function testIfError(): Promise<boolean>;
  export function testMatch(): Promise<boolean>;
  export function testFail(): Promise<boolean>;
  export function testRejects(): Promise<boolean>;
  export function testStrictMode(): Promise<boolean>;
  export function testAssertionError(): Promise<boolean>;
}
