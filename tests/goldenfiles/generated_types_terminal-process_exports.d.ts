declare module 'terminal-process' {
  export function run(source: string): Promise<string>;
  export function processRun(options: string): Promise<string>;
  export function processRecovery(): Promise<string>;
}
