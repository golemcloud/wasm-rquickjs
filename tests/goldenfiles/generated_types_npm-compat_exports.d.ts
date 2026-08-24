declare module 'npm-compat' {
  export function run(args: string[]): Promise<string>;
  export function runWithTimeout(args: string[], timeoutMs: number): Promise<string>;
  export function runNpx(args: string[]): Promise<string>;
  export function runInstalled(): Promise<string>;
  export function runInstalledTypescript(): Promise<string>;
  export function runRegistryInstalled(): Promise<string>;
  export function runPackageFormats(): Promise<string>;
  export function runBinDirect(): Promise<string>;
  export function probeLinkedLayouts(): Promise<string>;
  export function probeRuntime(): Promise<string>;
  export function probePrimitives(): Promise<string>;
}
