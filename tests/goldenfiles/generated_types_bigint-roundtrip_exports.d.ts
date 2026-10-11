declare module 'bigint-roundtrip' {
  export function roundtripU64(v: bigint): Promise<bigint>;
  export function roundtripS64(v: bigint): Promise<bigint>;
  export function sampleHrtime(): Promise<bigint>;
  export function restoreHrtime(value: bigint): Promise<void>;
  export function elapsedHrtime(): Promise<bigint>;
  export function sampleHrtimeTuple(): Promise<[bigint, number]>;
  export function elapsedHrtimeTuple(seconds: bigint, nanos: number): Promise<[bigint, number]>;
}
