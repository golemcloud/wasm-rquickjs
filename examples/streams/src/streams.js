import {Readable, PassThrough} from 'stream';
import {text, json, buffer, arrayBuffer} from 'stream/consumers';

class TimestampSource {
    #interval
    #counter = 0

    start(controller) {
        this.#interval = setInterval(() => {
            const string = `${this.#counter}`
            controller.enqueue(string);
            this.#counter++;
            console.log(`Enqueued ${string}`);
        }, 1_000);

        setTimeout(() => {
            clearInterval(this.#interval);
            // Close the stream after 10s.
            controller.close();
        }, 10_000);
    }

    cancel() {
        // This is called if the reader cancels.
        clearInterval(this.#interval);
    }
}

async function concatStringStream(stream) {
    let result = '';
    const reader = stream.getReader();
    while (true) {
        // The `read()` method returns a promise that
        // resolves when a value has been received.
        const {done, value} = await reader.read();
        // Result objects contain two properties:
        // `done`  - `true` if the stream has already given you all its data.
        // `value` - Some data. Always `undefined` when `done` is `true`.
        if (done) return result;
        result += value;
        console.log(`Read ${result.length} characters so far`);
        console.log(`Most recently read chunk: ${value}`);
    }
}

async function test1Impl() {
    const stream = new ReadableStream(new TimestampSource());
    concatStringStream(stream).then((result) => console.log('Stream complete', result));
}

export const test1 = test1Impl;

export async function testNodeStream1() {
    async function readableToString2(readable) {
        let result = '';
        for await (const chunk of readable) {
            result += chunk;
        }
        return result;
    }

    const readable = Readable.from('Good morning!', {encoding: 'utf8'});
    return await readableToString2(readable);
}

export async function testConsumersText() {
    const readable = Readable.from('hello world', {encoding: 'utf8'});
    return await text(readable);
}

export async function testConsumersJson() {
    const readable = Readable.from('{"key":"value"}', {encoding: 'utf8'});
    const obj = await json(readable);
    return JSON.stringify(obj);
}

export async function testConsumersBuffer() {
    const readable = Readable.from('hello', {encoding: 'utf8'});
    const buf = await buffer(readable);
    return buf.byteLength;
}

export async function testConsumersArraybuffer() {
    const readable = Readable.from('hello', {encoding: 'utf8'});
    const ab = await arrayBuffer(readable);
    return ab.byteLength;
}