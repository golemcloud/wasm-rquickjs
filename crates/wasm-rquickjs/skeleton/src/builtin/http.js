import * as httpNative from '__wasm_rquickjs_builtin/http_native'
import {formDataToBlob} from '__wasm_rquickjs_builtin/http_form_data';

// Partially based on the implementation in wasmedge-quickjs
// Partially based on https://github.com/JakeChampion/fetch/blob/main/fetch.js
// Depends on https://github.com/jimmywarting/FormData and https://github.com/node-fetch/fetch-blob

export async function fetch(resource, options = {}) {
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

    // TODO: options.mode
    // TODO: options.referer
    // TODO: options.credentials
    // TODO: options.cache

    let request = new httpNative.HttpRequest(
        resource,
        method,
        rawHeaders,
        version
    )

    // TODO: DataView support
    // TODO: URLSearchParams support

    let body = options.body || '';

    if (body instanceof ReadableStream) {
        return await streamingRequest(request, resource, body);
    } else if (body instanceof FormData) {
        const blob = formDataToBlob(body);
        return await blobRequestBody(request, resource, blob);
    } else if (body instanceof Blob) {
        return await blobRequestBody(request, resource, body);
    } else {
        if (body instanceof ArrayBuffer) {
            request.arrayBufferBody(body);
        } else if (body instanceof Uint8Array) {
            request.uint8ArrayBody(body);
        } else if (typeof body === 'string' || body instanceof String) {
            request.stringBody(body);
        } else {
            console.warn('Unsupported body type');
        }

        const nativeResponse = await request.simpleSend();
        return new Response(nativeResponse, resource);
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
        new Uint8Array(await this.arrayBuffer())
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
