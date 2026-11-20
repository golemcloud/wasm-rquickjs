declare module 'agentic-ts' {
  export function runTsc(args: string[], timeoutMs: bigint): string;
  export function profileTsc(timeoutMs: bigint): string;
  export function runEntry(path: string): string;
  export function runGenerated(path: string): string;
  export function runCpu(): string;
  export function runIo(): string;
  export function runConcurrent(): string;
  export function probeTimeout(): string;
  export function probeCancellation(): string;
}
