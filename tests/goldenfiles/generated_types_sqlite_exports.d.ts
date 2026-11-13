declare module 'sqlite' {
  export function testChangesetInputDetachedInCallback(): boolean;
  export function testMemoryRoundtrip(): boolean;
  export function testFileRoundtrip(): boolean;
  export function testUdfSurvivesRestore(): boolean;
  export function testConstructorOverwritten(): boolean;
  export function testOpenTransactionDetected(): boolean;
  export function testReadOnlyRejected(): boolean;
  export function testWalModeSnapshot(): boolean;
  export function testAutocommitTracking(): boolean;
  export function testTypeValidation(): boolean;
}
