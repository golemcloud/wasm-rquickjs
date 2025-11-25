import * as httpNative from '__wasm_rquickjs_builtin/http_native'
import {formDataToBlob} from '__wasm_rquickjs_builtin/http_form_data';

// Partially based on the implementation in wasmedge-quickjs
// Partially based on https://github.com/JakeChampion/fetch/blob/main/fetch.js
// Depends on https://github.com/jimmywarting/FormData and https://github.com/node-fetch/fetch-blob

export async function fetch(resource, options = {}) {
    let request;
    let body;
    let url;

    if (typeof resource === 'object' && resource instanceof Request) {
         const method = resource.method.toUpperCase();
        const headers = resource.headers;
        if (!headers.has('Accept')) {
            headers.set('Accept', '*/*');
        }
        let rawHeaders = {};
        for (const [name, value] of headers.entries()) {
            rawHeaders[name] = value;
        }
        let version = options.version || 'HTTP/1.1';
        let mode = options.mode || resource.mode;
        let referer = options.referrer || resource.referrer;
        let referrerPolicy = options.referrerPolicy || resource.referrerPolicy;
        request = new httpNative.HttpRequest(
            resource.url,
            method,
            rawHeaders,
            version,
            mode,
            referer,
            referrerPolicy
        )
        resource._bodyUsed = true;
        body = resource._body;
        url = resource.url;
    } else {
        let method = options.method || 'GET'
        method = method.toUpperCase();

        let headers = new Headers(options.headers || {});

        if (!headers.has('Accept')) {
            headers.set('Accept', '*/*');
        }

        let rawHeaders = {};
        for (const [name, value] of headers.entries()) {
            rawHeaders[name] = value;
        }

        let version = options.version || 'HTTP/1.1';
        let mode = options.mode || 'cors';
        let referrer = options.referrer || 'about:client';
        let referrerPolicy = options.referrerPolicy || 'strict-origin-when-cross-origin';

        // TODO: options.credentials
        // TODO: options.cache

        request = new httpNative.HttpRequest(
            resource,
            method,
            rawHeaders,
            version,
            mode,
            referrer,
            referrerPolicy
        )

        body = options.body || '';
        url = resource;
    }

    if (body instanceof ReadableStream) {
        return await streamingRequest(request, url, body);
    } else if (body instanceof FormData) {
        const blob = formDataToBlob(body);
        return await blobRequestBody(request, url, blob);
    } else if (body instanceof Blob) {
        return await blobRequestBody(request, url, body);
    } else {
        if (body instanceof ArrayBuffer) {
            request.arrayBufferBody(body);
        } else if (body instanceof DataView) {
            // Convert DataView to Uint8Array with the correct byte range
            request.uint8ArrayBody(new Uint8Array(body.buffer, body.byteOffset, body.byteLength));
        } else if (body instanceof Uint8Array) {
            request.uint8ArrayBody(body);
        } else if (body instanceof URLSearchParams) {
            request.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.stringBody(body.toString());
        } else if (typeof body === 'string' || body instanceof String) {
            request.stringBody(body);
        } else {
            console.warn('Unsupported body type');
        }

        const nativeResponse = await request.simpleSend();
        return new Response(nativeResponse, url);
    }
}

async function sendBody(bodyWriter, body) {
    const reader = body.getReader();
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        await bodyWriter.writeRequestBodyChunk(value);
    }
    bodyWriter.finishBody();
}

async function streamingRequest(request, resource, body) {
    request.initSend();
    const bodyWriter = request.initRequestBody();
    request.sendRequest();

    const [nativeResponse, _] = await Promise.all([request.receiveResponse(), sendBody(bodyWriter, body)]);

    return new Response(nativeResponse, resource);
}

async function blobRequestBody(request, resource, blob) {
    const stream = blob.stream();
    if (blob.type && blob.type !== '') {
        request.addHeader('Content-Type', blob.type);
    }
    return await streamingRequest(request, resource, stream);
}

export class Response {
    constructor(nativeResponse, url) {
        this.nativeResponse = nativeResponse;
        this.url = url;
        this.bodyUsed = false;
    }

    get status() {
        return this.nativeResponse.status;
    }

    get statusText() {
        return this.nativeResponse.statusText;
    }

    get body() {
        let nativeStreamSource = this.nativeResponse.stream();
        this.bodyUsed = true;
        return new ReadableStream({
            start() {
            },
            get type() {
                return "bytes";
            },
            async pull(controller) {
                // controller is https://developer.mozilla.org/en-US/docs/Web/API/ReadableByteStreamController
                const [next, err] = await nativeStreamSource.pull();
                if (err !== undefined) {
                    console.error("Error reading response body stream:", err);
                    controller.error(err);
                } else if (next === undefined) {
                    controller.close();
                } else {
                    controller.enqueue(next);
                }
            }
        });
    }

    get headers() {
        const rawHeaders = this.nativeResponse.headers;
        let result = new Headers();
        for (const [name, value] of rawHeaders) {
            result.set(name, value);
        }
        return result;
    }

    get ok() {
        return this.nativeResponse.status >= 200 && this.nativeResponse.status < 300;
    }

    get redirected() {
        return false; // TODO: support redirects
    }

    // TODO: prop type

    // TODO: static error()
    // TODO: static redirect()
    // TODO: static json()

    // TODO: clone()
    // TODO: formData()

    async arrayBuffer() {
        let result = await this.nativeResponse.arrayBuffer();
        this.bodyUsed = true;
        return result;
    }

    async blob() {
        new Blob([await this.arrayBuffer()], {type: this.headers.get('Content-Type') || ''});
    }

    async bytes() {
        return new Uint8Array(await this.arrayBuffer())
    }

    async json() {
        let result = JSON.parse(await this.text());
        this.bodyUsed = true;
        return result;
    }

    async text() {
        let result = await this.nativeResponse.text();
        this.bodyUsed = true;
        return result;
    }
}

function normalizeName(name) {
    if (typeof name !== 'string') {
        name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
        throw new TypeError('Invalid character in header field name: "' + name + '"')
    }
    return name.toLowerCase()
}

function normalizeValue(value) {
    if (typeof value !== 'string') {
        value = String(value)
    }
    return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
    var iterator = {
        next: function () {
            var value = items.shift()
            return {done: value === undefined, value: value}
        }
    }

    iterator[Symbol.iterator] = function () {
        return iterator
    }

    return iterator
}

export class Headers {
    constructor(headers) {
        this.map = {}

        if (headers instanceof Headers) {
            headers.forEach((value, name) => {
                this.append(name, value)
            })
        } else if (Array.isArray(headers)) {
            headers.forEach((header) => {
                if (header.length != 2) {
                    throw new TypeError('Headers constructor: expected name/value pair to be length 2, found' + header.length)
                }
                this.append(header[0], header[1])
            })
        } else if (headers) {
            Object.getOwnPropertyNames(headers).forEach((name) => {
                this.append(name, headers[name])
            })
        }
    }

    append(name, value) {
        name = normalizeName(name)
        value = normalizeValue(value)
        const oldValue = this.map[name]
        this.map[name] = oldValue ? oldValue + ', ' + value : value
    }

    delete(name) {
        delete this.map[normalizeName(name)]
    }

    get(name) {
        name = normalizeName(name)
        return this.has(name) ? this.map[name] : null
    }

    has(name) {
        return this.map.hasOwnProperty(normalizeName(name))
    }

    set(name, value) {
        this.map[normalizeName(name)] = normalizeValue(value)
    }

    forEach(callback, thisArg) {
        for (const name in this.map) {
            if (this.map.hasOwnProperty(name)) {
                callback.call(thisArg, this.map[name], name, this)
            }
        }
    }

    keys() {
        const items = []
        this.forEach((value, name) => {
            items.push(name)
        })
        return iteratorFor(items)
    }

    values() {
        const items = []
        this.forEach((value) => {
            items.push(value)
        })
        return iteratorFor(items)
    }

    entries() {
        const items = []
        this.forEach((value, name) => {
            items.push([name, value])
        })
        return iteratorFor(items)
    }

    [Symbol.iterator]() {
        this.entries()
    }
}

export class Request {
    constructor(input, options = {}) {
        if (input instanceof Request) {
            this._url = input._url;
            this._headers = new Headers(input._headers);
            this._bodyUsed = false;
            this._options = {
                body: input.bytes().slice(),
                ...input._options,
            };
        } else {
            this._url = input;
            this._headers = new Headers(options.headers || {});
            this._bodyUsed = false;
            this._options = {
                ...options,
            };
            this._body = options.body;
        }
    }

    get body() {
        this._bodyUsed = true;
        if (this._body instanceof ReadableStream) {
            return this._body;
        } else if (this._body instanceof FormData) {
            const blob = formDataToBlob(this._body);
            return blob.stream();
        } else if (this._body instanceof Blob) {
            return this._body.stream();
        } else if (this._body instanceof URLSearchParams) {
            const blob = new Blob([this._body.toString()]);
            return blob.stream();
        } else if (this._body instanceof ArrayBuffer) {
            const blob = new Blob([this._body]);
            return blob.stream();
        } else if (this._body instanceof DataView) {
            const blob = new Blob([this._body.buffer.slice(this._body.byteOffset, this._body.byteOffset + this._body.byteLength)]);
            return blob.stream();
        } else if (this._body instanceof Uint8Array) {
            const blob = new Blob([this._body]);
            return blob.stream();
        } else if (typeof this._body === 'string' || this._body instanceof String) {
            const blob = new Blob([this._body]);
            return blob.stream();
        } else {
            console.warn('Unsupported body type');
            return new Blob([]).stream();
        }
    }

    get bodyUsed() {
        return this._bodyUsed;
    }

    get cache() {
        return this._options.cache ?? 'default';
    }

    get credentials() {
        return this._options.credentials ?? 'same-origin';
    }

    get destination() {
        return '';
    }

    get duplex() {
        return this._options.duplex ?? 'half';
    }

    get headers() {
        return this._headers;
    }

    get integrity() {
        return this._options.integrity ?? '';
    }

    get isHistoryNavigation() {
        return false;
    }

    get keepalive() {
        return this._options.keepalive ?? false;
    }

    get method() {
        return this._options.method ?? 'GET';
    }

    get mode() {
        return this._options.mode ?? 'cors';
    }

    get redirect() {
        return this._options.redirect ?? 'follow';
    }

    get referrer() {
        return this._options.referrer ?? 'about:client';
    }

    get referrerPolicy() {
        return this._options.referrerPolicy ?? '';
    }

    get signal() {
        return this._options.signal;
    }

    get url() {
        return this._url;
    }

    async arrayBuffer() {
        this._bodyUsed = true;
        if (this._body instanceof ReadableStream) {
            return await streamToArrayBuffer(this._body);
        } else if (this._body instanceof FormData) {
            const blob = formDataToBlob(this._body);
            return blob.arrayBuffer();
        } else if (this._body instanceof Blob) {
            return this._body.arrayBuffer();
        } else if (this._body instanceof URLSearchParams) {
            return new TextEncoder().encode(this._body.toString()).buffer;
        } else if (this._body instanceof ArrayBuffer) {
            return this._body;
        } else if (this._body instanceof DataView) {
            return this._body.buffer.slice(this._body.byteOffset, this._body.byteOffset + this._body.byteLength);
        } else if (this._body instanceof Uint8Array) {
            return this._body.buffer;
        } else if (typeof this._body === 'string' || this._body instanceof String) {
            return new TextEncoder().encode(this._body).buffer;
        } else {
            console.warn('Unsupported body type');
            return new ArrayBuffer(0);
        }
    }

    async blob() {
        this._bodyUsed = true;
        if (this._body instanceof ReadableStream) {
            return await streamToBlob(this._body);
        } else if (this._body instanceof FormData) {
            const blob = formDataToBlob(this._body);
            return blob;
        } else if (this._body instanceof Blob) {
            return this._body;
        } else if (this._body instanceof URLSearchParams) {
            return new Blob([this._body.toString()]);
        } else if (this._body instanceof ArrayBuffer) {
            return new Blob([this._body]);
        } else if (this._body instanceof DataView) {
            return new Blob([this._body.buffer.slice(this._body.byteOffset, this._body.byteOffset + this._body.byteLength)]);
        } else if (this._body instanceof Uint8Array) {
            return new Blob([this._body]);
        } else if (typeof this._body === 'string' || this._body instanceof String) {
            return new Blob([this._body]);
        } else {
            console.warn('Unsupported body type');
            return new Blob([]);
        }
    }

    async bytes() {
        this._bodyUsed = true;
        if (this._body instanceof ReadableStream) {
            return new Uint8Array(await streamToArrayBuffer(this._body));
        } else if (this._body instanceof FormData) {
            const blob = formDataToBlob(this._body);
            return blob.bytes();
        } else if (this._body instanceof Blob) {
            return this._body.bytes();
        } else if (this._body instanceof URLSearchParams) {
            return new TextEncoder().encode(this._body.toString());
        } else if (this._body instanceof ArrayBuffer) {
            return new Uint8Array(this._body);
        } else if (this._body instanceof DataView) {
            return new Uint8Array(this._body.buffer, this._body.byteOffset, this._body.byteLength);
        } else if (this._body instanceof Uint8Array) {
            return this._body;
        } else if (typeof this._body === 'string' || this._body instanceof String) {
            return new TextEncoder().encode(this._body);
        } else {
            console.warn('Unsupported body type');
            return new Uint8Array(0);
        }
    }

    clone() {
        return new Response(this);
    }

    async formData() {
        this._bodyUsed = true;
        if (this._body instanceof FormData) {
            return this._body;
        } else {
            throw new Error('Body is not FormData');
        }
    }

    async json() {
        return JSON.stringify(await this.text());
    }

    async text() {
        return (await this.blob()).text();
    }
}

async function streamToArrayBuffer(stream) {
    const chunks = [];
    const reader = stream.getReader();

    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);          // value is Uint8Array
        }
    } finally {
        reader.releaseLock();
    }

    const total = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result.buffer;
}

async function streamToBlob(stream) {
    const chunks = [];
    const reader = stream.getReader();

    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    return new Blob(chunks);
}