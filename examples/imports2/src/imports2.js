
import * as iface from 'quickjs:example3/iface';

export const test = (input) => {
    let hello = new iface.Hello(input);
    return hello.getName();
};
