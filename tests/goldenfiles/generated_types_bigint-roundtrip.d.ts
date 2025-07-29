declare module 'bigint-roundtrip' {
  export function roundtripU64(v: bigint): Promise<bigint>;
  export function roundtripS64(v: bigint): Promise<bigint>;
}
