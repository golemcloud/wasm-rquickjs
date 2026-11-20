// A second bundle that uses the custom invocation context module on its own.
import * as scopes from 'wasm-rquickjs:custom-invocation-context';
import {
    beginCustomDurableInvocationAsync,
    LiveCustomDurableInvocation,
} from 'golem:durability/durability@1.6.0';

export function middlewareCapture() {
    return scopes.capture();
}

export async function middlewareDurable(name, body) {
    const parent = scopes.capture();
    const live = await beginCustomDurableInvocationAsync(name);
    const child = scopes.run(parent, () => scopes.enterLive(live));
    try {
        const result = await scopes.run(child, () => body(child));
        await scopes.run(child, () => LiveCustomDurableInvocation.finishAsync(live));
        return result;
    } finally {
        scopes.run(child, () => live[Symbol.dispose]());
        scopes.close(child);
    }
}
