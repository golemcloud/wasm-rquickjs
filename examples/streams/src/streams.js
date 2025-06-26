class TimestampSource {
    #interval

    start(controller) {
        this.#interval = setInterval(() => {
            const string = new Date().toLocaleTimeString();
            // Add the string to the stream.
            controller.enqueue(string);
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
        const { done, value } = await reader.read();
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