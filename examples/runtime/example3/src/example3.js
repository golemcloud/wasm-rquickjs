let stashedHello;

class Hello {
    constructor(name) {
        this.name = name;
    }

    async getName() {
        return this.name;
    }

    compareWith(other) {
        return Hello.compare(this, other);
    }

    static compare(h1, h2) {
        if (h1.name === h2.name) {
            return 0;
        } else if (h1.name < h2.name) {
            return -1;
        } else {
            return 1;
        }
    }

    static merge(h1, h2) {
        return new Hello(`${h1.name} & ${h2.name}`);
    }

    static async identity(value) {
        await Promise.resolve();
        return value;
    }

    static alias(value) {
        return value;
    }

    static duplicate(value) {
        return [value, value];
    }

    static stash(value) {
        Object.freeze(value);
        stashedHello = value;
    }

    static stashAndFail(value) {
        Object.freeze(value);
        stashedHello = value;
        throw "expected failure";
    }

    static async stashAndFailAsync(value) {
        Object.freeze(value);
        stashedHello = value;
        await Promise.resolve();
        throw "expected async failure";
    }

    static take() {
        const value = stashedHello;
        stashedHello = undefined;
        return value;
    }

    static resourceCount() {
        return Object.keys(globalThis.__wasm_rquickjs_resources).length;
    }
}

class HelloWithStaticCreate {
    static create(name) {
        let hello = new HelloWithStaticCreate()
        hello.name = name;
        return hello;
    }

    async getName() {
        return this.name;
    }

    static compare(h1, h2) {
        if (h1.name === h2.name) {
            return 0;
        } else if (h1.name < h2.name) {
            return -1;
        } else {
            return 1;
        }
    }

    static merge(h1, h2) {
        return new Hello(`${h1.name} & ${h2.name}`);
    }
}

export const iface = {
    Hello: Hello,
    HelloWithStaticCreate: HelloWithStaticCreate,
    dump: (optHello) => {
        if (optHello === undefined) {
            return "?";
        } else {
            return optHello.getName();
        }
    },
    dumpAll: async (lstHello) => {
        const items = await Promise.all(lstHello.map(h => h.getName())).then(names => names.join(", "));
        return `[${items}]`;
    }
};
