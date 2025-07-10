
import * as iface from 'quickjs:example3/iface';

export const test = (input) => {
    let hello = new iface.Hello(input);
    let world = new iface.Hello('World');

    let comparison1 = iface.Hello.compare(hello, world);
    let comparison2 = iface.Hello.compare(world, hello);

    console.log(`Comparison 1: ${comparison1}`);
    console.log(`Comparison 2: ${comparison2}`);

    const dump1 = iface.dump(hello);
    console.log(`Dump 1: ${dump1}`);
    const dump2 = iface.dump(undefined);
    console.log(`Dump 2: ${dump2}`);

    let merged = iface.Hello.merge(hello, world);

    const dump3 = iface.dumpAll([merged]);
    console.log(`Dump 3: ${dump3}`);

    return merged.getName();
};
