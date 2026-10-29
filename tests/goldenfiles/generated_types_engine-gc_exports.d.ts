declare module 'engine-gc' {
  export function regexpSets(): Promise<boolean>;
  export function embeddedAttributes(): Promise<boolean>;
  export function registeredJsonAttributes(): Promise<boolean>;
  export function accounting(): Promise<string>;
  export function cycleStress(): Promise<string>;
  export function asyncRoots(): Promise<boolean>;
  export function ownedRuntimes(): Promise<boolean>;
  export function registryRetention(): Promise<string>;
  export function retainedHeap(): Promise<string>;
  export function failedImports(): Promise<boolean>;
  export function sharedBodyErrors(): Promise<boolean>;
  export function typedBuffers(): Promise<boolean>;
}
