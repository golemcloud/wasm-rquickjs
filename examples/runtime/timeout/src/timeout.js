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

export async function awaitRuntimeIdle() {
    console.log("before idle");
    setTimeout(() => {
        console.log("referenced timer");
    }, 25);
    const ignored = setInterval(() => {
        console.log("unexpected unreferenced timer");
    }, 1000);
    ignored.unref();
    await process._awaitRuntimeIdle();
    console.log("after idle");
}

export async function awaitRuntimeIdleError() {
    setTimeout(() => {
        throw new Error("delayed failure");
    }, 10);
    setTimeout(() => {
        console.log("unexpected callback after failure");
    }, 20);
    try {
        await process._awaitRuntimeIdle();
        return "unexpected resolution";
    } catch (error) {
        return String(error);
    }
}

export async function awaitRuntimeIdleExit() {
    setTimeout(() => {
        Promise.resolve().then(() => {
            console.log("unexpected promise callback after exit");
        });
        queueMicrotask(() => {
            console.log("unexpected microtask callback after exit");
        });
        process.exit(7);
    }, 10);
    setTimeout(() => {
        console.log("unexpected callback after exit");
    }, 20);
    await process._awaitRuntimeIdle();
    return process.exitCode;
}

export async function awaitRuntimeIdleExitWithPendingFetch(port) {
    let pendingRequest;
    setTimeout(() => {
        pendingRequest = fetch(`http://localhost:${port}/slow-response`).catch(() => {});
        process.exit(9);
    }, 25);
    await process._awaitRuntimeIdle();
    void pendingRequest;
    return process.exitCode;
}

export async function awaitRuntimeIdleHandledError() {
    process.once("uncaughtException", (error) => {
        console.log(`handled: ${error.message}`);
    });
    setTimeout(() => {
        throw new Error("recoverable failure");
    }, 10);
    setTimeout(() => {
        console.log("after handled failure");
    }, 20);
    await process._awaitRuntimeIdle();
}
