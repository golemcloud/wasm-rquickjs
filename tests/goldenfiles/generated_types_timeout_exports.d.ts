declare module 'timeout' {
  export function run(): Promise<void>;
  export function parallel(): Promise<void>;
  export function useNextTick(): Promise<void>;
  export function awaitRuntimeIdle(): Promise<void>;
  export function awaitRuntimeIdleError(): Promise<string>;
  export function awaitRuntimeIdleExit(): Promise<number>;
  export function awaitRuntimeIdleExitWithPendingFetch(port: number): Promise<number>;
  export function awaitRuntimeIdleHandledError(): Promise<void>;
}
