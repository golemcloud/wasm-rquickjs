declare module 'quickjs:types-in-exports/types' {
  import * as quickjsTypesInExportsOtherTypes from 'quickjs:types-in-exports/other-types';
  export function f1(a: number[], b: ListOfStrings, c: string[]): string[];
  export function f2(a: string | undefined): number | undefined;
  export function f3(a: boolean, b: number, c: number, d: number, e: bigint, f: number, g: number, h: number, i: bigint, j: number, k: number, l: string, m: string): [boolean, number, number, number, bigint, number, number, number, bigint, number, number, string, string];
  export function f4(a: Result<number, string>): Result<number, string>;
  export function f5(a: Result<void, string>): Result<void, string>;
  export function f6(a: Result<string, Error>): Result<string, Error>;
  export function f7(a: Result<void, Error>): Result<void, Error>;
  export function f8(a: [string, number, number]): void;
  export function f9(a: Rec1): Rec1 | undefined;
  export function f10(a: Var1): Var1;
  export function f11(a: Color): string;
  export function f12(a: string): Color | undefined;
  export function f13(a: Permissions): Permissions;
  export function f14(a: bigint): bigint;
  export function f15(bytes: Uint8Array): Uint8Array;
  export function f16(in_: Rec2[] | undefined): Promise<string[] | undefined>;
  export function f17(in_: string[] | undefined): Promise<Rec2[] | undefined>;
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
