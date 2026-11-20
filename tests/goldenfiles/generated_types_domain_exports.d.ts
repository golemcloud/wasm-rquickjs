declare module 'domain' {
  export function testEventEmitterConstructorIdentity(): boolean;
  export function testCreate(): boolean;
  export function testRun(): boolean;
  export function testBind(): boolean;
  export function testIntercept(): boolean;
  export function testAddRemove(): boolean;
  export function testEnterExit(): boolean;
  export function testEmitterErrorRouting(): boolean;
  export function testErrorDecoration(): boolean;
  export function testDispose(): boolean;
  export function testNested(): boolean;
}
