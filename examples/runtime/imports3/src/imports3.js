import * as types from 'quickjs:types-in-exports/types';

function as_result(f) {
    try {
        const result = f();
        return { tag: 'ok', val: result };
    } catch (error) {
        return { tag: 'err', val: error };
    }
}

export const test = () => {
    // f1: func(a: list<f32>, b: list-of-strings, c: list<string>) -> list<string>;
    console.log(`f1: ${types.f1([0.1, 0.2, 0.3], ["a", "b"], ["c", "d"])}`);
    // f2: func(a: option<string>) -> option<u32>;
    console.log(`f2: ${types.f2("hello world")}`);
    // f3: func(a: bool, b: s8, c: s16, d: s32, e: s64, f: u8, g: u16, h: u32, i: u64, j: f32, k: f64, l: char, m: string)
    console.log(`f3: ${types.f3(true, -8, -16, -32, -64n, 8, 16, 32, 64n, 3.14, 2.718281828459045, 'c', "hello world")}`);
    // f4: func(a: result<s32, string>) -> result<s32, string>;
    console.log(`f4: ${JSON.stringify(as_result(() => types.f4({tag: 'ok', val: 42})))}`);
    // f5: func(a: result<_, string>) -> result<_, string>;
    console.log(`f5: ${JSON.stringify(as_result(() => types.f5({tag: 'err', val: 'error message'})))}`);
    // f6: func(a: result<string>) -> result<string>;
    console.log(`f6: ${JSON.stringify(as_result(() => types.f6({tag: 'ok', val: 'success'})))}`);
    // f7: func(a: result) -> result;
    console.log(`f7: ${JSON.stringify(as_result(() => types.f7({tag: 'ok'})))}`);
    // f8: func(a: tuple<string, u32, f32>);
    console.log(`f8: ${types.f8(['example', 123, 4.56])}`);
    // f9: func(a: rec1) -> option<rec1>;
    // record rec1 {
    //     a: string,
    //     b: u32,
    //     c: f32,
    //     d: rec2,
    //     e: option<rec2>,
    //     f: result<u32, string>,
    //     g: list<rec2>,
    //     h: list-of-strings,
    //     i: tuple<string, u32, f32>,
    // }
    const f9 = types.f9({
        a: "test",
        b: 42,
        c: 3.14,
        d: {x: 1, y: 2},
        e: undefined,
        f: {tag: 'ok', val: 100},
        g: [],
        h: ['one', 'two'],
        i: ['tuple', 1, 2.5]
    });
    console.log(`f9: ${JSON.stringify(f9)}`);
    // f10: func(a: var1) -> var1;
    //   variant var1 {
    //     none,
    //     any,
    //     specific(string),
    //     many(list<rec1>),
    //     wrapped-tuple(tuple<string, u32, f32>),
    //     wrapped-result(result<u32, string>),
    // }
    const f10 = types.f10({
        tag: 'specific',
        val: 'example'
    });
    console.log(`f10: ${JSON.stringify(f10)}`);
    // f11: func(a: color) -> string;
    // enum color {
    //     red,
    //     green,
    //     blue,
    // }
    const f11 = types.f11('blue');
    console.log(`f11: ${f11}`);
    // f12: func(a: string) -> option<color>;
    const f12 = types.f12('green');
    console.log(`f12: ${JSON.stringify(f12)}`);
    // f13: func(a: permissions) -> permissions;
    // flags permissions {
    //   read,
    //   write,
    //   execute,
    // }
    const f13 = types.f13({read: true, write: false, execute: true});
    console.log(`f13: ${JSON.stringify(f13)}`);
    // f14: func(a: u64) -> u64;
    const f14 = types.f14(1234567890n);
    console.log(`f14: ${f14}`);
    // f15: func(bytes: list<u8>) -> list<u8>
    const f15 = types.f15(new Uint8Array([1, 2, 3, 4, 5]));
    console.log(`f15: ${f15}`);
    if (f15 instanceof Uint8Array) {
        console.log(`f15 is a Uint8Array with length: ${f15.length}`);
    }
};
