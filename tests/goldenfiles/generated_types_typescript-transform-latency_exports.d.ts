declare module 'typescript-transform-latency' {
  export function measureCase(kind: string, sourceBytes: bigint, sample: bigint): string;
  export function probeControls(sourceBytes: bigint): string;
  export function probeConcurrency(sourceBytes: bigint): string;
}
