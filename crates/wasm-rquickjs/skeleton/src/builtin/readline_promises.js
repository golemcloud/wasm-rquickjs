// node:readline/promises stub
const NOT_SUPPORTED = new Error('readline/promises is not yet supported in WebAssembly environment');

export function createInterface(options) {
    throw NOT_SUPPORTED;
}

export class Interface {
    constructor() {
        throw NOT_SUPPORTED;
    }
}

export default { createInterface, Interface };
