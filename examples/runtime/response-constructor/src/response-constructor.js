function ok(name) {
    return { name, passed: true, error: '' };
}
function fail(name, error) {
    return { name, passed: false, error: String(error) };
}

const responseConstructorExports = {
    async testStringBody() {
        const name = 'string body text()';
        try {
            const r = new Response('hello world');
            const text = await r.text();
            if (text !== 'hello world') return fail(name, `expected "hello world", got "${text}"`);
            if (r.bodyUsed !== true) return fail(name, 'bodyUsed should be true after text()');
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testStatusAndStatusText() {
        const name = 'status and statusText';
        try {
            const r = new Response('body', { status: 404, statusText: 'Not Found' });
            if (r.status !== 404) return fail(name, `expected status 404, got ${r.status}`);
            if (r.statusText !== 'Not Found') return fail(name, `expected statusText "Not Found", got "${r.statusText}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testHeaders() {
        const name = 'headers from init';
        try {
            const r = new Response('body', {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Custom': 'test-value' },
            });
            const ct = r.headers.get('content-type');
            const custom = r.headers.get('x-custom');
            if (ct !== 'application/json') return fail(name, `expected content-type "application/json", got "${ct}"`);
            if (custom !== 'test-value') return fail(name, `expected x-custom "test-value", got "${custom}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testOkProperty() {
        const name = 'ok property';
        try {
            const r200 = new Response('', { status: 200 });
            const r299 = new Response('', { status: 299 });
            const r300 = new Response('', { status: 300 });
            const r404 = new Response('', { status: 404 });
            if (!r200.ok) return fail(name, 'status 200 should be ok');
            if (!r299.ok) return fail(name, 'status 299 should be ok');
            if (r300.ok) return fail(name, 'status 300 should not be ok');
            if (r404.ok) return fail(name, 'status 404 should not be ok');
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testJsonParse() {
        const name = 'json() parsing';
        try {
            const data = { message: 'Hello, World!', count: 42 };
            const r = new Response(JSON.stringify(data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
            const parsed = await r.json();
            if (parsed.message !== 'Hello, World!') return fail(name, `expected message "Hello, World!", got "${parsed.message}"`);
            if (parsed.count !== 42) return fail(name, `expected count 42, got ${parsed.count}`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testNullBody() {
        const name = 'null body';
        try {
            const r = new Response(null, { status: 204 });
            if (r.body !== null) return fail(name, 'null body should return null from .body');
            const text = await r.text();
            if (text !== '') return fail(name, `expected empty string, got "${text}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testArrayBufferBody() {
        const name = 'ArrayBuffer body';
        try {
            const encoder = new TextEncoder();
            const buf = encoder.encode('binary data').buffer;
            const r = new Response(buf);
            const ab = await r.arrayBuffer();
            const decoded = new TextDecoder().decode(ab);
            if (decoded !== 'binary data') return fail(name, `expected "binary data", got "${decoded}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testClone() {
        const name = 'clone()';
        try {
            const r = new Response('clone me', { status: 201, headers: { 'X-Test': 'yes' } });
            const cloned = r.clone();
            if (cloned.status !== 201) return fail(name, `cloned status should be 201, got ${cloned.status}`);
            if (cloned.headers.get('x-test') !== 'yes') return fail(name, 'cloned should have x-test header');
            const text = await cloned.text();
            if (text !== 'clone me') return fail(name, `cloned text should be "clone me", got "${text}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testBodyStream() {
        const name = 'body ReadableStream';
        try {
            const r = new Response('stream me');
            const reader = r.body.getReader();
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            let totalLength = 0;
            for (const c of chunks) totalLength += c.byteLength;
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const c of chunks) {
                combined.set(new Uint8Array(c.buffer || c), offset);
                offset += c.byteLength;
            }
            const text = new TextDecoder().decode(combined);
            if (text !== 'stream me') return fail(name, `expected "stream me", got "${text}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testDefaultValues() {
        const name = 'default values';
        try {
            const r = new Response('test');
            if (r.status !== 200) return fail(name, `default status should be 200, got ${r.status}`);
            if (r.statusText !== '') return fail(name, `default statusText should be "", got "${r.statusText}"`);
            if (r.ok !== true) return fail(name, 'default ok should be true');
            if (r.redirected !== false) return fail(name, 'default redirected should be false');
            if (r.type !== 'basic') return fail(name, `default type should be "basic", got "${r.type}"`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testMockFetchPattern() {
        const name = 'mock fetch pattern (SDK-style)';
        try {
            // This is the exact pattern that SDKs use and was failing
            const mockFetch = async (url) => {
                return new Response(JSON.stringify({ version: '1.0.0' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            };

            const resp = await mockFetch('https://api.example.com/version');
            if (resp.status !== 200) return fail(name, `status should be 200, got ${resp.status}`);
            if (!resp.ok) return fail(name, 'response should be ok');

            const ct = resp.headers.get('content-type');
            if (ct !== 'application/json') return fail(name, `content-type should be "application/json", got "${ct}"`);

            const data = await resp.json();
            if (data.version !== '1.0.0') return fail(name, `expected version "1.0.0", got "${data.version}"`);

            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testHeadersIteration() {
        const name = 'headers Symbol.iterator';
        try {
            const r = new Response('body', {
                headers: { 'X-One': '1', 'X-Two': '2' },
            });
            const entries = [];
            for (const [key, value] of r.headers) {
                entries.push([key, value]);
            }
            if (entries.length !== 2) return fail(name, `expected 2 header entries, got ${entries.length}`);
            const keys = entries.map(e => e[0]).sort();
            if (keys[0] !== 'x-one' || keys[1] !== 'x-two') return fail(name, `unexpected header keys: ${JSON.stringify(keys)}`);
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testRequestClone() {
        const name = 'Request.clone() preserves bodies';
        try {
            const r = new Request('https://example.com/x', {
                method: 'POST', headers: { 'X-Test': 'yes' }, body: 'hello body',
            });
            const c = r.clone();
            if (await r.text() !== 'hello body' || await c.text() !== 'hello body') {
                return fail(name, 'buffered body was not independently readable');
            }
            if (c.url !== r.url || c.method !== 'POST' || c.headers.get('x-test') !== 'yes') {
                return fail(name, 'request metadata was not preserved');
            }
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('stream body'));
                    controller.close();
                },
            });
            const streamed = new Request('https://example.com/y', { method: 'POST', body: stream });
            const streamedClone = streamed.clone();
            if (await streamed.text() !== 'stream body' || await streamedClone.text() !== 'stream body') {
                return fail(name, 'stream body was not independently readable');
            }
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testRequestCloneAfterConsume() {
        const name = 'Request.clone() rejects consumed bodies';
        try {
            for (const wrap of [false, true]) {
                const r = new Request('https://example.com/x', { method: 'POST', body: 'abc' });
                await r.text();
                let threw = false;
                try {
                    if (wrap) new Request(r);
                    else r.clone();
                } catch (e) {
                    threw = e instanceof TypeError;
                }
                if (!threw) return fail(name, wrap ? 'new Request(consumed)' : 'clone after consume');
            }
            const bodyless = new Request('https://example.com/x');
            await bodyless.text();
            bodyless.clone();
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testRequestBytesBlob() {
        const name = 'Request.bytes() with Blob body';
        try {
            const bytes = await new Request('https://example.com/x', {
                method: 'POST', body: new Blob(['abc']),
            }).bytes();
            if (!(bytes instanceof Uint8Array) || new TextDecoder().decode(bytes) !== 'abc') {
                return fail(name, `unexpected bytes: ${bytes}`);
            }
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testResponseCloneStream() {
        const name = 'Response.clone() tees stream body';
        try {
            const backing = new Uint8Array([0, 115, 116, 114, 101, 97, 109, 0]);
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(backing.subarray(1, 4));
                    controller.enqueue(backing.subarray(4, 7));
                    controller.close();
                },
            });
            const r = new Response(stream);
            const c = r.clone();
            if (await r.text() !== 'stream' || await c.text() !== 'stream') {
                return fail(name, 'original and clone did not receive the exact stream bytes');
            }
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testTypedArrayBodies() {
        const name = 'all ArrayBuffer views are exact body sources';
        const eq = (actual, expected, what) => {
            const values = Array.from(actual);
            if (values.length !== expected.length || values.some((v, i) => v !== expected[i])) {
                throw new Error(`${what}: expected [${expected}], got [${values}]`);
            }
        };
        try {
            eq(new Uint8Array(await new Response(new Int8Array([1, 2, 3])).arrayBuffer()),
                [1, 2, 3], 'Int8Array');
            const u16 = new Uint16Array(new Uint8Array([1, 2, 3, 4]).buffer);
            eq(new Uint8Array(await new Response(u16).arrayBuffer()), [1, 2, 3, 4], 'Uint16Array');
            const dvBuf = new Uint8Array([9, 8, 7, 6]).buffer;
            eq(new Uint8Array(await new Response(new DataView(dvBuf, 1, 2)).arrayBuffer()),
                [8, 7], 'DataView');
            const sub = new Uint8Array([10, 20, 30, 40, 50]).subarray(1, 4);
            eq(new Uint8Array(await new Request('https://example.com/x', {
                method: 'POST', body: sub,
            }).arrayBuffer()), [20, 30, 40], 'Request.arrayBuffer subview');
            eq(await new Request('https://example.com/x', { method: 'POST', body: sub }).bytes(),
                [20, 30, 40], 'Request.bytes subview');
            const blob = await new Response(new Int8Array([5, 6])).blob();
            eq(new Uint8Array(await blob.arrayBuffer()), [5, 6], 'Blob');
            return ok(name);
        } catch (e) { return fail(name, e); }
    },

    async testBufferSourceSnapshot() {
        const name = 'Request and Response snapshot BufferSource bodies';
        const eq = (actual, expected, what) => {
            const values = Array.from(actual);
            if (values.length !== expected.length || values.some((v, i) => v !== expected[i])) {
                throw new Error(`${what}: expected [${expected}], got [${values}]`);
            }
        };
        try {
            const responseBacking = new Uint8Array([0, 1, 2, 3, 0]);
            const response = new Response(responseBacking.subarray(1, 4));
            const responseClone = response.clone();
            responseBacking.fill(9);
            eq(new Uint8Array(await response.arrayBuffer()), [1, 2, 3], 'Response');
            eq(new Uint8Array(await responseClone.arrayBuffer()), [1, 2, 3], 'Response clone');

            const requestBacking = new Uint8Array([0, 4, 5, 6, 0]);
            const request = new Request('https://example.com/x', {
                method: 'POST',
                body: new DataView(requestBacking.buffer, 1, 3),
            });
            const requestClone = request.clone();
            requestBacking.fill(8);
            const returnedBytes = await request.bytes();
            eq(returnedBytes, [4, 5, 6], 'Request');
            returnedBytes.fill(7);
            eq(new Uint8Array(await requestClone.arrayBuffer()), [4, 5, 6], 'Request clone');
            return ok(name);
        } catch (e) { return fail(name, e); }
    },
};

export { responseConstructorExports };
