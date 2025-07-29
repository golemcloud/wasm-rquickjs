declare module 'types-in-exports' {
  import * as quickjsTypesInExportsOtherTypes from 'quickjs:types-in-exports/other-types';
  export namespace types {
    export function f1(a: number[], b: ListOfStrings, c: string[]): Promise<string[]>;
    export function f2(a: string | undefined): Promise<number | undefined>;
    export function f3(a: boolean, b: number, c: number, d: number, e: bigint, f: number, g: number, h: number, i: bigint, j: number, k: number, l: string, m: string): Promise<[boolean, number, number, number, bigint, number, number, number, bigint, number, number, string, string]>;
    export function f4(a: Result<number, string>): Promise<Result<number, string>>;
    export function f5(a: Result<void, string>): Promise<Result<void, string>>;
    export function f6(a: Result<string, Error>): Promise<Result<string, Error>>;
    export function f7(a: Result<void, Error>): Promise<Result<void, Error>>;
    export function f8(a: [string, number, number]): Promise<void>;
    export function f9(a: Rec1): Promise<Rec1 | undefined>;
    export function f10(a: Var1): Promise<Var1>;
    export function f11(a: Color): Promise<string>;
    export function f12(a: string): Promise<Color | undefined>;
    export function f13(a: Permissions): Promise<Permissions>;
    export function f14(a: bigint): Promise<bigint>;
    export type Color = quickjsTypesInExportsOtherTypes.Color;
    export type ListOfStrings = quickjsTypesInExportsOtherTypes.ListOfStrings;
    export type Rec2 = quickjsTypesInExportsOtherTypes.Rec2;
    export type Rec1 = {
      a: string;
      b: number;
      c: number;
      d: Rec2;
      e: Rec2 | undefined;
      f: Result<number, string>;
      g: Rec2[];
      h: ListOfStrings;
      i: [string, number, number];
    };
    export type Var1 = {
      tag: 'none'
    } |
    {
      tag: 'any'
    } |
    {
      tag: 'specific'
      val: string
    } |
    {
      tag: 'many'
      val: Rec1[]
    } |
    {
      tag: 'wrapped-tuple'
      val: [string, number, number]
    } |
    {
      tag: 'wrapped-result'
      val: Result<number, string>
    };
    export type Permissions = {
      read: boolean;
      write: boolean;
      execute: boolean;
    };
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
