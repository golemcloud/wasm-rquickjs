declare module 'errors' {
  export function fun1(name: string): string;
  export function fun3(): string;
  export function fun4(a: number, b: number): string;
  export function fun5(a: number, b: string): string;
  export function fun6(): number;
  export namespace api {
    export function fun2(name: string): string;
  }
  export namespace api2 {
    export function fun7(): string;
  }
  export namespace api3 {
    export class Res1 {
      constructor(name: string);
    }
    export class Res2 {
      constructor();
    }
    export class Res3 {
      constructor();
      m1(): string;
      m2(a: number, b: number): string;
      m3(): number;
    }
  }
}
