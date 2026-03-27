declare module 'sqlite' {
  export function testMemoryRoundtrip(): Promise<boolean>;
  export function testFileRoundtrip(): Promise<boolean>;
  export function testUdfSurvivesRestore(): Promise<boolean>;
  export function testConstructorOverwritten(): Promise<boolean>;
  export function testOpenTransactionDetected(): Promise<boolean>;
  export function testReadOnlyRejected(): Promise<boolean>;
  export function testWalModeSnapshot(): Promise<boolean>;
  export function testAutocommitTracking(): Promise<boolean>;
  export function testTypeValidation(): Promise<boolean>;
}
