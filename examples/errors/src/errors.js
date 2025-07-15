
export const api = {
    // supposed to be 'fun2'
    wrongFun2: (name) => {
        console.log(`wrong fun2 called with ${name}`);
        return `Hello, ${name}!`;
    }
}

// supposed to be 'fun1'
export const wrongFun1 = (name) => {
    console.log(`wrong fun1 called with ${name}`);
    return `Hello, ${name}!`;
}

// fun3 should not have any parameters
export const fun3 = (name) => {
    console.log(`fun3 called with ${name}`);
    return `Hello, ${name}!`;
}

// fun4 should take two parameters
export const fun4 = (a) => {
    console.log(`fun4 called with ${a}`);
    return `Hello, ${a}!`;
}

// fun5 assumes a and b are strings but a is a u32
export const fun5 = (a, b) => {
    const c = a.substring(0, 1);
    return `Hello, ${b} and ${c}`;
}

// fun6 is supposed to return a number
export const fun6 = () => {
    return "Hello, world!";
}

// interface should be called `api2`
export const api22 = {
    fun7: (name) => {
        console.log(`fun7 called with ${name}`);
        return `Hello, ${name}!`;
    },
}