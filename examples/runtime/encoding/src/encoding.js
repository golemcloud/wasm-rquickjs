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
                controller.enqueue(new Uint8Array(buf.slice(offset, offset + chunkSize)));
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

export const test3 = async () => {
    const check = (condition, message) => {
        if (!condition) throw new Error(message);
    };

    try {
        const decoder = new TextDecoder('utf-8', {fatal: true});
        check(decoder.fatal === true, 'fatal getter should be true');
        check(
            decoder.decode(new Uint8Array([0xe2, 0x82, 0xac])) === '€',
            'valid UTF-8 should decode',
        );

        const invalids = {
            'lone 0xff': [0xff],
            'truncated multibyte': [0xe2, 0x82],
            'overlong NUL': [0xc0, 0x80],
            'lone surrogate': [0xed, 0xa0, 0x80],
            'above U+10FFFF': [0xf4, 0x90, 0x80, 0x80],
        };
        for (const [name, bytes] of Object.entries(invalids)) {
            let error;
            try {
                new TextDecoder('utf-8', {fatal: true}).decode(new Uint8Array(bytes));
            } catch (caught) {
                error = caught;
            }
            check(error !== undefined, `fatal decode should throw for ${name}`);
            check(
                error.code === 'ERR_ENCODING_INVALID_ENCODED_DATA',
                `wrong error code for ${name}: ${error.code}`,
            );
            new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        }

        const bomAndA = new Uint8Array([0xef, 0xbb, 0xbf, 0x61]);
        check(
            new TextDecoder('utf-8', {fatal: true, ignoreBOM: false}).decode(bomAndA) === 'a',
            'ignoreBOM:false should strip the BOM',
        );
        check(
            new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bomAndA) === '\ufeffa',
            'ignoreBOM:true should preserve the BOM',
        );

        const streaming = new TextDecoder('utf-8', {fatal: true});
        const first = streaming.decode(new Uint8Array([0xe2, 0x82]), {stream: true});
        const second = streaming.decode(new Uint8Array([0xac]), {stream: true});
        check(first + second === '€', 'split streaming sequence should decode');

        const truncated = new TextDecoder('utf-8', {fatal: true});
        truncated.decode(new Uint8Array([0xe2, 0x82]), {stream: true});
        let flushError;
        try {
            truncated.decode();
        } catch (caught) {
            flushError = caught;
        }
        check(flushError !== undefined, 'truncated sequence should fail on final decode');
        check(
            flushError.code === 'ERR_ENCODING_INVALID_ENCODED_DATA',
            `wrong final decode error: ${flushError.code}`,
        );

        const stream = new TextDecoderStream('utf-8', {fatal: true});
        check(stream.fatal === true, 'TextDecoderStream fatal getter should be true');

        let streamError;
        try {
            const invalidStream = new TextDecoderStream('utf-8', {fatal: true});
            const writer = invalidStream.writable.getWriter();
            const reader = invalidStream.readable.getReader();
            const drain = (async () => {
                while (!(await reader.read()).done) {}
            })();
            await writer.write(new Uint8Array([0xff]));
            await writer.close();
            await drain;
        } catch (caught) {
            streamError = caught;
        }
        check(streamError !== undefined, 'fatal TextDecoderStream should reject invalid input');

        return true;
    } catch (error) {
        console.log('test3 failure:', error?.message);
        return false;
    }
};

export const test4 = async () => {
    const check = (condition, message) => {
        if (!condition) throw new Error(message);
    };
    try {
        const vectors = [
            ['shift_jis', [0x82, 0xa0], 'あ'],
            ['gbk', [0xc4, 0xe3], '你'],
            ['big5', [0xa7, 0x41], '你'],
            ['euc-jp', [0xa4, 0xa2], 'あ'],
        ];
        for (const [encoding, bytes, expected] of vectors) {
            const decoder = new TextDecoder(encoding, {fatal: true});
            check(decoder.decode(new Uint8Array(bytes.slice(0, 1)), {stream: true}) === '',
                `${encoding} should buffer its lead byte`);
            check(decoder.decode(new Uint8Array(bytes.slice(1)), {stream: true}) === expected,
                `${encoding} should complete a split character`);
            check(decoder.decode() === '', `${encoding} final flush should be empty`);
        }

        const fatal = new TextDecoder('shift_jis', {fatal: true});
        fatal.decode(new Uint8Array([0x82]), {stream: true});
        let fatalError;
        try {
            fatal.decode();
        } catch (error) {
            fatalError = error;
        }
        check(fatalError?.code === 'ERR_ENCODING_INVALID_ENCODED_DATA',
            'fatal truncated Shift_JIS should fail on flush');

        const replacement = new TextDecoder('shift_jis');
        check(replacement.decode(new Uint8Array([0x82]), {stream: true}) === '',
            'nonfatal Shift_JIS should buffer its lead byte');
        check(replacement.decode() === '\ufffd',
            'nonfatal truncated Shift_JIS should replace on flush');

        const decoded = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array([0x82]));
                controller.enqueue(new Uint8Array([0xa0]));
                controller.close();
            },
        }).pipeThrough(new TextDecoderStream('shift_jis', {fatal: true}));
        const reader = decoded.getReader();
        let streamed = '';
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            streamed += value;
        }
        check(streamed === 'あ', 'TextDecoderStream should complete split Shift_JIS');
        return true;
    } catch (error) {
        console.log('test4 failure:', error?.message);
        return false;
    }
};
