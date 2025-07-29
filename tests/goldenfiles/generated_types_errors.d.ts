declare module 'errors' {
  export function fun1(name: string): Promise<string>;
  export function fun3(): Promise<string>;
  export function fun4(a: number, b: number): Promise<string>;
  export function fun5(a: number, b: string): Promise<string>;
  export function fun6(): Promise<number>;
  export module api {
    export function fun2(name: string): Promise<string>;
  }
  export module api2 {
    export function fun7(): Promise<string>;
  }
  export module api3 {
    export class Res1 {
      constructor(name: string);
    }
    export class Res2 {
      constructor();
    }
    export class Res3 {
      constructor();
      async m1(): Promise<string>;
      async m2(a: number, b: number): Promise<string>;
      async m3(): Promise<number>;
    }
  }
}
