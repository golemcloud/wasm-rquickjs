declare module 'example2' {
  export function version(): string;
  export namespace exp1 {
    export function hello(name: string): string;
    export function getConst(): bigint;
  }
  export namespace exp2 {
    export function asyncHello(name: string): string;
  }
}
