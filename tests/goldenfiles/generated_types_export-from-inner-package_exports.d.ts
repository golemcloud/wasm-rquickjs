declare module 'export-from-inner-package' {
  export namespace exp1 {
    export function hello(name: string): Promise<string>;
    export function getConst(): Promise<bigint>;
  }
  export namespace exp2 {
    export function asyncHello(name: string): Promise<string>;
  }
}
