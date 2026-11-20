declare module 'v8-stack-trace' {
  export function benchmarkErrorStack(path: string, iterations: number): number;
  export function testCaptureStackTraceExists(): boolean;
  export function testCaptureStackTraceBasic(): boolean;
  export function testPrepareStackTrace(): boolean;
  export function testCallSiteMethods(): boolean;
  export function testLatePrepareStackTrace(): boolean;
  export function testDefaultErrorStackHeaders(): boolean;
  export function testErrorInspectUsesCurrentName(): boolean;
  export function testAssertionListenerStackFrame(): string;
  export function testCjsCallSiteLineOffset(): string;
  export function testPrepareStackTraceDescriptors(): boolean;
  export function testProxyStackHolderEngineBoundary(): boolean;
  export function testConstructorOpt(): boolean;
  export function testStackTraceLimit(): boolean;
  export function testDepdPattern(): boolean;
  export function testPreparedStackCacheDoesNotRetainErrors(): boolean;
  export function testPreparedStackCacheDoesNotRetainCustomCycles(): boolean;
  export function testPrivateWeakCollectionsBypassPublicPrototypes(): boolean;
}
