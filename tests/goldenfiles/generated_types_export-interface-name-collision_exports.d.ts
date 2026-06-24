declare module 'export-interface-name-collision' {
  export namespace testA100Guest {
    export function invoke(a: string, b: string, c: string): Promise<string>;
  }
  export namespace testB100Guest {
    export function invoke(a: string, b: string, c: string, d: string, e: string): Promise<string>;
  }
}
