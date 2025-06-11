function helloImpl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}! (${this.something})`;
}

async function asyncHelloImpl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}! (${this.something})`;
}

export const something = 123;

export const hello = helloImpl;

export const asyncHello = asyncHelloImpl;
