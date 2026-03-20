declare module 'response-constructor' {
  export namespace responseConstructorExports {
    export function testStringBody(): Promise<TestResult>;
    export function testStatusAndStatusText(): Promise<TestResult>;
    export function testHeaders(): Promise<TestResult>;
    export function testOkProperty(): Promise<TestResult>;
    export function testJsonParse(): Promise<TestResult>;
    export function testNullBody(): Promise<TestResult>;
    export function testArrayBufferBody(): Promise<TestResult>;
    export function testClone(): Promise<TestResult>;
    export function testBodyStream(): Promise<TestResult>;
    export function testDefaultValues(): Promise<TestResult>;
    export function testMockFetchPattern(): Promise<TestResult>;
    export function testHeadersIteration(): Promise<TestResult>;
    export type TestResult = {
      name: string;
      passed: boolean;
      error: string;
    };
  }
}
