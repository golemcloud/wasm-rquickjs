declare module 'bigint-roundtrip' {
  export function roundtripU64(v: bigint): bigint;
  export function roundtripS64(v: bigint): bigint;
  export function sampleHrtime(): bigint;
  export function restoreHrtime(value: bigint): void;
  export function elapsedHrtime(): bigint;
  export function sampleHrtimeTuple(): [bigint, number];
  export function elapsedHrtimeTuple(seconds: bigint, nanos: number): [bigint, number];
}
