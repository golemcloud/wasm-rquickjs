import { terminalProbe } from 'wasm-rquickjs:execution';

export async function run(source) {
    return await terminalProbe(source);
}
