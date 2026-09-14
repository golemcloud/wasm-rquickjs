declare module 'typescript-transform-latency' {
  export function measureCase(kind: string, sourceBytes: bigint, sample: bigint): Promise<string>;
  export function probeControls(sourceBytes: bigint): Promise<string>;
  export function probeConcurrency(sourceBytes: bigint): Promise<string>;
}
