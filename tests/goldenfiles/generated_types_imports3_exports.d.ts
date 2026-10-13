declare module 'imports3' {
  export function test(): Promise<void>;
  export function nestedVariants(warmParent: boolean): Promise<string>;
}
