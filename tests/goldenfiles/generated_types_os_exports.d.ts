declare module 'os' {
  export function test(): Promise<string>;
  export function testPerformanceClock(): Promise<string>;
}
