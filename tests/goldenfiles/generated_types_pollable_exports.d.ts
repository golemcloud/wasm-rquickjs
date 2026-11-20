declare module 'pollable' {
  export function test(): bigint;
  export function testAbortableAlreadyAborted(): void;
  export function testAbortableNotAborted(): void;
  export function testAbortableMidWait(): void;
  export function testAbortableRace(): void;
}
