declare module 'npm-compat' {
  export function run(args: string[]): string;
  export function runWithTimeout(args: string[], timeoutMs: number): string;
  export function runNpx(args: string[]): string;
  export function runInstalled(): string;
  export function runInstalledTypescript(): string;
  export function runRegistryInstalled(): string;
  export function runPackageFormats(): string;
  export function runBinDirect(): string;
  export function probeLinkedLayouts(): string;
  export function probeRuntime(): string;
  export function probePrimitives(): string;
  export function probeInlineChildModuleIsolation(): string;
}
