declare module 'example2' {
  export function version(): Promise<string>;
  export module exp1 {
    export function hello(name: string): Promise<string>;
    export function getConst(): Promise<bigint>;
  }
  export module exp2 {
    export function asyncHello(name: string): Promise<string>;
  }
}
