class Hello {
    constructor(name) {
        this.name = name;
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
