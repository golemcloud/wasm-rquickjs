import {nextTick} from "node:process";

export const run = () => {
    console.log("timeout test starts");
    const repeated = setInterval(() => {
        console.log("This is a repeated message every 250ms");
    }, 250);
    setTimeout(() => {
        console.log("This is a delayed message after 2s");
        setTimeout(() => {
            console.log("This is a followup delayed message after 1s");
            clearTimeout(repeated);
        }, 1000);
    }, 2000)
    setImmediate(() => {
        console.log("Message from setImmediate #1");
    });
    setTimeout((a, b) => {
        console.log(`This is a delayed message after 1s, with params ${a}, ${b}`);
    }, 1000, "x", 100);
    setImmediate(() => {
        console.log("Message from setImmediate #2");
    });
}

export async function parallel() {
    function test(i) {
        console.log("test", i);
    }

    for (let i = 0; i < 1000; i++) {
        setTimeout(() => {
            test(i);
        }, 100)
    }
}

export async function useNextTick() {
    console.log("start");
    nextTick(() => {
        console.log("nextTick callback 1");
    });
    nextTick(() => {
        console.log("nextTick callback 2");
    });
    setImmediate(() => {
        console.log("setImmediate callback 1");
    });
    console.log("end");
}
