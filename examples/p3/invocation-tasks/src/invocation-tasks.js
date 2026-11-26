import { note, effect, handOver } from 'test:invocation-tasks/effects';

let resolveSignal;
const signal = new Promise((resolve) => {
    resolveSignal = resolve;
});

export async function background(name, delayMs) {
    note(`${name}:sync`);
    Promise.resolve().then(() => note(`${name}:job`));
    queueMicrotask(() => note(`${name}:microtask`));
    process.nextTick(() => note(`${name}:tick`));
    setTimeout(() => {
        note(`${name}:timer`);
        Promise.resolve().then(() => note(`${name}:timer-job`));
    }, delayMs);
    for (let round = 0; round < 5; round++) {
        await effect(`${name}:effect-${round}`, delayMs);
        note(`${name}:after-await-${round}`);
    }
    return name;
}

export async function waitForSignal(name) {
    note(`${name}:waiting`);
    const sender = await signal;
    note(`${name}:continued-from-${sender}`);
    await Promise.resolve();
    note(`${name}:continued-job`);
    return `${name}:${sender}`;
}

export async function sendSignal(name, delayMs) {
    await effect(`${name}:effect`, delayMs);
    note(`${name}:send`);
    resolveSignal(name);
    await Promise.resolve();
    note(`${name}:sent`);
    return name;
}

export async function startTimer(name, delayMs) {
    setTimeout(() => {
        note(`${name}:timer`);
        Promise.resolve().then(() => note(`${name}:timer-job`));
    }, delayMs);
    note(`${name}:returning`);
    return name;
}

export const drained = { startTimer };

export async function quick(name) {
    note(`${name}:quick`);
    return name;
}

export async function throwing(name, delayMs) {
    queueMicrotask(() => {
        throw new Error(`${name} microtask failure`);
    });
    setTimeout(() => {
        throw new Error(`${name} timer failure`);
    }, delayMs);
    Promise.resolve().then(() => note(`${name}:after-microtask`));
    setTimeout(() => note(`${name}:later-timer`), delayMs * 2);
    await effect(`${name}:effect`, delayMs);
    note(`${name}:after-await`);
    return name;
}

export function syncTimer(name, delayMs) {
    note(`${name}:sync`);
    setTimeout(() => {
        note(`${name}:timer`);
        resolveSignal(name);
    }, delayMs);
}

export function syncHandOver(name, delayMs) {
    note(`${name}:sync`);
    async function* bytes() {
        for (let i = 1; i <= 3; i++) {
            await Promise.resolve();
            yield i;
        }
    }
    setTimeout(async () => {
        note(`${name}:timer`);
        await handOver(`${name}:stream`, bytes());
        note(`${name}:handed-over`);
    }, delayMs);
}

export async function contextFlow(name, value, delayMs) {
    const store = globalThis.__wasm_rquickjs_test_context_store;
    store.enable();
    store.set(value);
    await effect(`${name}:effect-1`, delayMs);
    note(`${name}:after-first:${store.get()}`);
    await effect(`${name}:effect-2`, delayMs);
    note(`${name}:after-second:${store.get()}`);
    return `${name}:${store.get()}`;
}
