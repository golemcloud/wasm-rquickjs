function hello_impl(name) {
    console.log(`hello called with ${name}`);
    return `Hello, ${name}!`;
}

export const hello = hello_impl;
