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