let stashedCounter;

class Counter {
    constructor(value) {
        this.value = value;
    }

    get() {
        return this.value;
    }

    static async identity(value) {
        // A queued resource drop runs concurrently with this referenced I/O.
        // Its drain must release the context lock so the timer can close it.
        await new Promise((resolve, reject) => {
            const server = createServer();
            server.on('error', reject);
            server.listen(0, () => setTimeout(() => server.close(resolve), 5));
        });
        return value;
    }

    static async stashAndFail(value) {
        Object.freeze(value);
        stashedCounter = value;
        await Promise.resolve();
        throw 'expected async failure';
    }

    static take() {
        const value = stashedCounter;
        stashedCounter = undefined;
        return value;
    }

    static resourceCount() {
        return Object.keys(globalThis.__wasm_rquickjs_resources).length;
    }
}

export const api = { Counter };
import { createServer } from 'node:net';
