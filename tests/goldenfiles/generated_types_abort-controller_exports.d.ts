declare module 'abort-controller' {
  export function testAbortBasic(): Promise<void>;
  export function testAbortSignal(): Promise<void>;
  export function testAbortTimeout(): Promise<void>;
  export function testAbortEvent(): Promise<void>;
  export function testAbortReason(): Promise<void>;
  export function testAbortMultipleListeners(): Promise<void>;
  export function testThrowIfAborted(): Promise<void>;
  export function testThrowIfAbortedNotAborted(): Promise<void>;
  export function testOnabortHandler(): Promise<void>;
  export function testOnceOption(): Promise<void>;
  export function testRemoveEventListener(): Promise<void>;
  export function testAbortIdempotent(): Promise<void>;
  export function testAbortNoReason(): Promise<void>;
  export function testDuplicateListeners(): Promise<void>;
  export function testFetchAbortAlreadyAborted(): Promise<void>;
  export function testFetchAbortDuringRequest(): Promise<void>;
}
