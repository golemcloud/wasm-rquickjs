function helloImpl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}! (${this.something})`;
}

async function asyncHelloImpl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}!`;
}

function getConstImpl() {
    return 42;
}

function versionImpl() {
    return '1.0.0';
}

export const exp1 = {
    hello: helloImpl,
    getConst: getConstImpl,
    something: 123
};

export const exp2 = {
    asyncHello: asyncHelloImpl,
};

export const version = versionImpl;