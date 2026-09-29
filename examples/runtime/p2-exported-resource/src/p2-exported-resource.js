let stashedCounter;

class Counter {
    constructor(value) {
        this.value = value;
    }

    get() {
        return this.value;
    }

    static async identity(value) {
        await Promise.resolve();
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
