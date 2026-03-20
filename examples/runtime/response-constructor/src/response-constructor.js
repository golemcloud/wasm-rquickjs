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
};

export { responseConstructorExports };
