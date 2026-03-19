
export const types = {
    f1: (a, b, c) => {
        // a: list<f32>
        // b: list<string>
        // c: list<string>
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`b: ${JSON.stringify(b)}`);
        console.log(`c: ${JSON.stringify(c)}`);
        // return: list<string>
        return a.map((item, index) => `${item} - ${b[index]} - ${c[index]}`);
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
        console.log(`a: ${a} (${typeof a})`);
        console.log(`b: ${b} (${typeof b})`);
        console.log(`c: ${c} (${typeof c})`);
        console.log(`d: ${d} (${typeof d})`);
        console.log(`e: ${e} (${typeof e})`);
        console.log(`f: ${f} (${typeof f})`);
        console.log(`g: ${g} (${typeof g})`);
        console.log(`h: ${h} (${typeof h})`);
        console.log(`i: ${i} (${typeof i})`);
        console.log(`j: ${j} (${typeof j})`);
        console.log(`k: ${k} (${typeof k})`);
        console.log(`l: ${l} (${typeof l})`);
        console.log(`m: ${m} (${typeof m})`);
        // return: tuple
        return [a, b, c, d, e, f, g, h, i, j, k, l, m];
    },
    f4: (a) => {
        // a: result<s32, string>
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result<s32, string>
        if (a.tag === 'ok') {
            return a.val;
        } else {
            throw a.val;
        }
    },
    f5: (a) => {
        // a: result<_, string>
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result<_, string>
        if (a.tag === 'ok') {
            return a.val;
        } else {
            throw a.val;
        }
    },
    f6: (a) => {
        // a: result<string>
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result<string>
        if (a.tag === 'ok') {
            return a.val;
        } else {
            throw a.val;
        }
    },
    f7: (a) => {
        // a: result
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: result
        if (a.tag === 'ok') {
            return a.val;
        } else {
            throw a.val;
        }
    },
    f8: (a) => {
        // a: tuple<string, u32, f32>
        console.log(`a: ${JSON.stringify(a)}`);
        // return: ()
    },
    f9: (a) => {
        // a: rec1
        console.log(`a: ${JSON.stringify(a)}`);
        // return: option<rec1>
        if (a.b != 0) {
            return a;
        } else {
            return undefined;
        }
    },
    f10: (a) => {
        // a: var1
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`a.tag: ${a.tag}`);
        console.log(`a.val: ${a.val}`);
        // return: var1
        return a;
    },
    f11: (a) => {
        // a: color
        console.log(`a: ${JSON.stringify(a)}`);
        // return: string
        return `the color is ${a}`;
    },
    f12: (a) => {
        // a: string
        console.log(`a: ${JSON.stringify(a)}`);
        // return: option<color>
        if (a === 'red' || a === 'green' || a === 'blue') {
            return a;
        } else {
            return undefined;
        }
    },
    f13: (a) => {
        // a: permissions
        console.log(`a: ${JSON.stringify(a)}`);
        // return: permissions
        return a;
    },
    f14: (a) => {
        // a: u64
        console.log(`a: ${a}`);
        // return: u64
        return a;
    },
    f15: (bytes) => {
        console.log(`bytes: ${bytes}`);
        return bytes;
    }
};
