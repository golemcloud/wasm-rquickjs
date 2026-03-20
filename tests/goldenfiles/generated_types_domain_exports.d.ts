declare module 'domain' {
  export function testCreate(): Promise<boolean>;
  export function testRun(): Promise<boolean>;
  export function testBind(): Promise<boolean>;
  export function testIntercept(): Promise<boolean>;
  export function testAddRemove(): Promise<boolean>;
  export function testEnterExit(): Promise<boolean>;
  export function testEmitterErrorRouting(): Promise<boolean>;
  export function testErrorDecoration(): Promise<boolean>;
  export function testDispose(): Promise<boolean>;
  export function testNested(): Promise<boolean>;
}
