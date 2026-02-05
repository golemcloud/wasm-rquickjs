declare module 'crypto' {
  export function newUuids(): Promise<[string, string]>;
  export function randomS8(count: number): Promise<number[]>;
  export function randomU32(count: number): Promise<number[]>;
  export function sha256Hex(input: string): Promise<string>;
  export function sha256MultiUpdate(parts: string[]): Promise<string>;
}
