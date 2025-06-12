
export const types = {
    f1: (a, b) => {
        // a: list<f32>
        // b: list<string>
        console.log(`a: ${a}`);
        console.log(`b: ${b}`);
        // return: list<string>
        return a.map((item, index) => `${item} - ${b[index]}`);
    },
    f2: (a) => {
        // a: option<string>
        console.log(`a: ${a}`);
        // return: option<u32>
        return a ? a.length : undefined;
    },
    f3: (a, b, c, d, e, f, g, h, i, j, k, l, m) => {
        // a: bool
        // b: s8
        // c: s16
        // d: s32
        // e: s64
        // f: u8
        // g: u16
        // h: u32
        // i: u64
        // j: f32
        // k: f64
        // l: char
        // m: string
        console.log(`a: ${a}`);
        console.log(`b: ${b}`);
        console.log(`c: ${c}`);
        console.log(`d: ${d}`);
        console.log(`e: ${e}`);
        console.log(`f: ${f}`);
        console.log(`g: ${g}`);
        console.log(`h: ${h}`);
        console.log(`i: ${i}`);
        console.log(`j: ${j}`);
        console.log(`k: ${k}`);
        console.log(`l: ${l}`);
        console.log(`m: ${m}`);
        // return: tuple
        return [a, b, c, d, e, f, g, h, i, j, k, l, m];
    },
    f4: (a) => {
        // a: result<s32, string>
        console.log(`a: ${a}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result<s32, string>
        return a;
    },
    f5: (a) => {
        // a: result<_, string>
        console.log(`a: ${a}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result<_, string>
        return a;
    },
    f6: (a) => {
        // a: result<string>
        console.log(`a: ${a}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result<string>
        return a;
    },
    f7: (a) => {
        // a: result
        console.log(`a: ${a}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result
        return a;
    },
    f8: (a) => {
        // a: tuple<string, u32, f32>
        console.log(`a: ${a}`);
        // return: ()
    },
    f9: (a) => {
        // a: rec1
        console.log(`a: ${a}`);
        // return: option<rec1>
        if (a.b != 0) {
            return a;
        } else {
            return undefined;
        }
    },
    f10: (a) => {
        // a: var1
        console.log(`a: ${a}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: var1
        return a;
    },
    f11: (a) => {
        // a: color
        console.log(`a: ${a}`);
        // return: string
        return `the color is ${a}`;
    },
    f12: (a) => {
        // a: string
        console.log(`a: ${a}`);
        // return: option<color>
        if (a === 'red' || a === 'green' || a === 'blue') {
            return a;
        } else {
            return undefined;
        }
    },
    f13: (a) => {
        // a: permissions
        console.log(`a: ${a}`);
        // return: permissions
        return a;
    }
};