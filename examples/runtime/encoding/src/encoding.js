class TimestampSource {
    #interval
    #counter = 0;

    start(controller) {
        this.#interval = setInterval(() => {
            const string = `[Message ${this.#counter}]`;
            this.#counter += 1;
            // Add the string to the stream.
            controller.enqueue(string);
            console.log(`Enqueued ${string}`);
        }, 1_00);

        setTimeout(() => {
            clearInterval(this.#interval);
            // Close the stream after 10s.
            controller.close();
        }, 1_000);
    }

    cancel() {
        // This is called if the reader cancels.
        clearInterval(this.#interval);
    }
}

async function test1Impl() {
    const utf8decoder = new TextDecoder();
    const encodedText = new Uint8Array([240, 160, 174, 183]);
    const decodedText = utf8decoder.decode(encodedText);
    console.log('Decoded text:', decodedText);

    const utf8encoder = new TextEncoder();
    const text = "€";
    const encodedText2 = utf8encoder.encode(text);
    console.log('Encoded array:', JSON.stringify(encodedText2));

    const encodingStream = new ReadableStream(new TimestampSource()).pipeThrough(new TextEncoderStream());
    const encodingReader = encodingStream.getReader();
    let buf = [];
    while (true) {
        // The `read()` method returns a promise that
        // resolves when a value has been received.
        const {done, value} = await encodingReader.read();
        if (done) break;
        console.log("Encoded chunk:", JSON.stringify(value));
        buf.push(...value);
    }

    console.log("Encoded buffer from stream:", JSON.stringify(buf));

    const decodingStream = new ReadableStream({
        start(controller) {
            let offset = 0;
            const chunkSize = 16;
            while (offset < buf.length) {
                controller.enqueue(buf.slice(offset, offset + chunkSize));
                offset += chunkSize;
            }
            controller.close();
        }
    }).pipeThrough(new TextDecoderStream());

    const decodingReader = decodingStream.getReader();
    let decodedString = "";
    while (true) {
        // The `read()` method returns a promise that
        // resolves when a value has been received.
        const {done, value} = await decodingReader.read();
        if (done) break;
        console.log("Decoded chunk:", JSON.stringify(value));
        decodedString += value;
    }
}

export const test1 = test1Impl;

export const test2 = () => {
    const encoder = new TextEncoder();

    // Test encode with object having toString (coercion)
    const result = encoder.encode({ toString() { return 'abc' } });
    console.log('encode coerced:', JSON.stringify(result));
    if (result[0] !== 97 || result[1] !== 98 || result[2] !== 99 || result.length !== 3) {
        return false;
    }

    // Test encode with no arguments (should return empty Uint8Array)
    const empty = encoder.encode();
    console.log('encode no-args length:', empty.length);
    if (empty.length !== 0) return false;

    // Test encodeInto works correctly
    const dest = new Uint8Array(10);
    const intoResult = encoder.encodeInto("abc", dest);
    console.log('encodeInto result:', JSON.stringify(intoResult));
    if (intoResult.read !== 3 || intoResult.written !== 3) return false;
    if (dest[0] !== 97 || dest[1] !== 98 || dest[2] !== 99) return false;

    // Test encodeInto with non-string first arg should throw TypeError
    let threw = false;
    try {
        encoder.encodeInto(42, dest);
    } catch (e) {
        threw = e instanceof TypeError;
        console.log('encodeInto TypeError:', e.message);
    }
    if (!threw) return false;

    // Test encode with number (coerced via toString)
    const numResult = encoder.encode(123);
    console.log('encode number:', JSON.stringify(numResult));
    // "123" => [49, 50, 51]
    if (numResult[0] !== 49 || numResult[1] !== 50 || numResult[2] !== 51 || numResult.length !== 3) {
        return false;
    }

    return true;
};