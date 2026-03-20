declare module 'v8-stack-trace' {
  export function testCaptureStackTraceExists(): Promise<boolean>;
  export function testCaptureStackTraceBasic(): Promise<boolean>;
  export function testPrepareStackTrace(): Promise<boolean>;
  export function testCallSiteMethods(): Promise<boolean>;
  export function testConstructorOpt(): Promise<boolean>;
  export function testStackTraceLimit(): Promise<boolean>;
  export function testDepdPattern(): Promise<boolean>;
}
