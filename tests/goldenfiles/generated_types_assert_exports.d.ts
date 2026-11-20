declare module 'assert' {
  export function testOk(): boolean;
  export function testEqual(): boolean;
  export function testStrictEqual(): boolean;
  export function testDeepEqual(): boolean;
  export function testDeepStrictEqual(): boolean;
  export function testThrows(): boolean;
  export function testDoesNotThrow(): boolean;
  export function testIfError(): boolean;
  export function testMatch(): boolean;
  export function testFail(): boolean;
  export function testRejects(): boolean;
  export function testStrictMode(): boolean;
  export function testAssertionError(): boolean;
  export function testEvalGeneratedMessage(): boolean;
}
