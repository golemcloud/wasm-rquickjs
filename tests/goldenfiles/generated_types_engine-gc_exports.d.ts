declare module 'engine-gc' {
  export function regexpSets(): boolean;
  export function embeddedAttributes(): boolean;
  export function registeredJsonAttributes(): boolean;
  export function accounting(): string;
  export function cycleStress(): string;
  export function asyncRoots(): boolean;
  export function ownedRuntimes(): boolean;
  export function registryRetention(): string;
  export function retainedHeap(): string;
  export function failedImports(): boolean;
  export function sharedBodyErrors(): boolean;
  export function typedBuffers(): boolean;
}
