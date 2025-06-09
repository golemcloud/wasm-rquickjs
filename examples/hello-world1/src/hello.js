function helloImpl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}!`;
}

async function asyncHelloImpl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}!`;
}

export const hello = helloImpl;

export const asyncHello = asyncHelloImpl;
