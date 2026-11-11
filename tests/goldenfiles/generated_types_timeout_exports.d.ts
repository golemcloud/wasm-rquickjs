declare module 'timeout' {
  export function run(): void;
  export function parallel(): void;
  export function useNextTick(): void;
  export function awaitRuntimeIdle(): void;
}
