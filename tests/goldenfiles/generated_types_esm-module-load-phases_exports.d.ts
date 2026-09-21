declare module 'esm-module-load-phases' {
  export function measureCase(sourceBytes: bigint, sample: bigint): Promise<string>;
}
