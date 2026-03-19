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

// --- fromWeb / toWeb tests ---

import { Writable, Duplex } from 'stream';

// Readable.fromWeb: convert a Web ReadableStream to a Node.js Readable
export async function testReadableFromWeb() {
    const webStream = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('hello '));
            controller.enqueue(new TextEncoder().encode('from web'));
            controller.close();
        }
    });

    const nodeReadable = Readable.fromWeb(webStream);
    let result = '';
    for await (const chunk of nodeReadable) {
        if (typeof chunk === 'string') {
            result += chunk;
        } else {
            result += new TextDecoder().decode(chunk);
        }
    }
    return result;
}

// Readable.toWeb: convert a Node.js Readable to a Web ReadableStream
export async function testReadableToWeb() {
    const nodeReadable = Readable.from(['hello ', 'to web'], { encoding: 'utf8' });
    const webStream = Readable.toWeb(nodeReadable);

    const reader = webStream.getReader();
    let result = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (typeof value === 'string') {
            result += value;
        } else {
            result += new TextDecoder().decode(value);
        }
    }
    return result;
}

// Writable.fromWeb: convert a Web WritableStream to a Node.js Writable
export async function testWritableFromWeb() {
    const chunks = [];
    const webStream = new WritableStream({
        write(chunk) {
            chunks.push(chunk);
        }
    });

    const nodeWritable = Writable.fromWeb(webStream);

    await new Promise((resolve, reject) => {
        nodeWritable.write('hello ', (err) => {
            if (err) reject(err);
            nodeWritable.write('from web', (err) => {
                if (err) reject(err);
                nodeWritable.end(() => resolve());
            });
        });
    });

    const decoder = new TextDecoder();
    return chunks.map(c => {
        if (typeof c === 'string') return c;
        if (c instanceof Uint8Array || ArrayBuffer.isView(c)) return decoder.decode(c);
        return String(c);
    }).join('');
}

// Writable.toWeb: convert a Node.js Writable to a Web WritableStream
export async function testWritableToWeb() {
    let result = '';
    const nodeWritable = new Writable({
        write(chunk, encoding, callback) {
            result += chunk.toString();
            callback();
        }
    });

    const webStream = Writable.toWeb(nodeWritable);
    const writer = webStream.getWriter();
    await writer.write(new TextEncoder().encode('hello '));
    await writer.write(new TextEncoder().encode('to web'));
    await writer.close();
    return result;
}

// Duplex.fromWeb: convert a Web ReadableStream/WritableStream pair to Node.js Duplex
export async function testDuplexFromWeb() {
    const written = [];
    const { readable, writable } = new TransformStream({
        transform(chunk, controller) {
            // Echo back with prefix
            const text = new TextDecoder().decode(chunk);
            controller.enqueue(new TextEncoder().encode('echo:' + text));
        }
    });

    const duplex = Duplex.fromWeb({ readable, writable });

    // Write to the duplex
    duplex.write(new TextEncoder().encode('hello'));
    duplex.end();

    // Read from the duplex
    let result = '';
    for await (const chunk of duplex) {
        if (typeof chunk === 'string') {
            result += chunk;
        } else {
            result += new TextDecoder().decode(chunk);
        }
    }
    return result;
}