declare module 'agentic-ts' {
  export function runTsc(args: string[], timeoutMs: bigint): Promise<string>;
  export function runEntry(path: string): Promise<string>;
  export function runGenerated(path: string): Promise<string>;
  export function runCpu(): Promise<string>;
  export function runIo(): Promise<string>;
  export function runConcurrent(): Promise<string>;
  export function probeTimeout(): Promise<string>;
  export function probeCancellation(): Promise<string>;
}
