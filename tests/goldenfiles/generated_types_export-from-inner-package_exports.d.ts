declare module 'export-from-inner-package' {
  export namespace exp1 {
    export function hello(name: string): string;
    export function getConst(): bigint;
  }
  export namespace exp2 {
    export function asyncHello(name: string): string;
  }
}
