declare module 'crypto' {
  export function newUuids(): Promise<[string, string]>;
  export function randomS8(count: number): Promise<number[]>;
  export function randomU32(count: number): Promise<number[]>;
}
