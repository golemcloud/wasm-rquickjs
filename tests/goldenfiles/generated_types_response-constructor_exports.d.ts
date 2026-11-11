declare module 'response-constructor' {
  export namespace responseConstructorExports {
    export function testStringBody(): TestResult;
    export function testStatusAndStatusText(): TestResult;
    export function testHeaders(): TestResult;
    export function testOkProperty(): TestResult;
    export function testJsonParse(): TestResult;
    export function testNullBody(): TestResult;
    export function testArrayBufferBody(): TestResult;
    export function testClone(): TestResult;
    export function testBodyStream(): TestResult;
    export function testDefaultValues(): TestResult;
    export function testMockFetchPattern(): TestResult;
    export function testHeadersIteration(): TestResult;
    export function testRequestClone(): TestResult;
    export function testRequestCloneAfterConsume(): TestResult;
    export function testRequestBytesBlob(): TestResult;
    export function testResponseCloneStream(): TestResult;
    export function testTypedArrayBodies(): TestResult;
    export function testBufferSourceSnapshot(): TestResult;
    export type TestResult = {
      name: string;
      passed: boolean;
      error: string;
    };
  }
}
