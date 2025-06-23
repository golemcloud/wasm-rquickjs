
import * as iface from 'quickjs:types-in-exports/iface';

export const test = (input) => {
    let hello = new iface.Hello(input);
    let world = new iface.Hello('World');

    let comparison1 = iface.Hello.compare(hello, world);
    let comparison2 = iface.Hello.compare(world, hello);

    console.log(`Comparison 1: ${comparison1}`);
    console.log(`Comparison 2: ${comparison2}`);

    let merged = iface.Hello.merge(hello, world);

    return merged.getName();
};
