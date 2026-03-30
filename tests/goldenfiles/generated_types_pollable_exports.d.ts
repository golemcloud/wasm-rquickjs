declare module 'pollable' {
  export function test(): Promise<bigint>;
  export function testAbortableAlreadyAborted(): Promise<void>;
  export function testAbortableNotAborted(): Promise<void>;
  export function testAbortableMidWait(): Promise<void>;
  export function testAbortableRace(): Promise<void>;
}
