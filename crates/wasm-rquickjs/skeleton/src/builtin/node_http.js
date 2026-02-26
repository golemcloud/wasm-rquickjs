// node:http implementation
import { NodeHttpClientRequest } from '__wasm_rquickjs_builtin/node_http_native';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import { channel } from 'node:diagnostics_channel';

const onClientRequestCreated = channel('http.client.request.created');
const onClientRequestStart = channel('http.client.request.start');
const onClientRequestError = channel('http.client.request.error');
const onClientResponseFinish = channel('http.client.response.finish');

// ===== Static Data =====

export const METHODS = [
    'ACL', 'BIND', 'CHECKOUT', 'CONNECT', 'COPY', 'DELETE', 'GET', 'HEAD',
    'LINK', 'LOCK', 'M-SEARCH', 'MERGE', 'MKACTIVITY', 'MKCALENDAR', 'MKCOL',
    'MOVE', 'NOTIFY', 'OPTIONS', 'PATCH', 'POST', 'PROPFIND', 'PROPPATCH',
    'PURGE', 'PUT', 'QUERY', 'REBIND', 'REPORT', 'SEARCH', 'SOURCE', 'SUBSCRIBE',
    'TRACE', 'UNBIND', 'UNLINK', 'UNLOCK', 'UNSUBSCRIBE',
];

export const STATUS_CODES = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    103: 'Early Hints',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a Teapot",
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
};

export const maxHeaderSize = 16384;

// ===== Validation =====

const INVALID_HEADER_CHAR_REGEX = /[^\t\x20-\x7e\x80-\xff]/;
const INVALID_HEADER_NAME_REGEX = /[^!#$%&'*+\-.^_`|~A-Za-z0-9]/;

export function validateHeaderName(name) {
    if (typeof name !== 'string' || name.length === 0) {
        throw new TypeError('Header name must be a valid HTTP token ["' + name + '"]');
    }
    if (INVALID_HEADER_NAME_REGEX.test(name)) {
        throw new TypeError('Header name must be a valid HTTP token ["' + name + '"]');
    }
}

export function validateHeaderValue(name, value) {
    if (value === undefined) {
        throw new TypeError('Invalid value "undefined" for header "' + name + '"');
    }
    if (INVALID_HEADER_CHAR_REGEX.test(value)) {
        throw new TypeError('Invalid character in header content ["' + name + '"]');
    }
}

// ===== Agent =====

export class Agent {
    constructor(options = {}) {
        this.keepAlive = options.keepAlive || false;
        this.keepAliveMsecs = options.keepAliveMsecs || 1000;
        this.maxSockets = options.maxSockets || Infinity;
        this.maxTotalSockets = options.maxTotalSockets || Infinity;
        this.maxFreeSockets = options.maxFreeSockets || 256;
        this.timeout = options.timeout;
        this.scheduling = options.scheduling || 'lifo';
        this.freeSockets = {};
        this.requests = {};
        this.sockets = {};
    }

    destroy() {}

    getName(options = {}) {
        let name = options.host || 'localhost';
        name += ':';
        if (options.port) name += options.port;
        name += ':';
        if (options.localAddress) name += options.localAddress;
        if (options.socketPath) name += ':' + options.socketPath;
        if (options.family === 4 || options.family === 6) name += ':' + options.family;
        return name;
    }
}

export const globalAgent = new Agent();

// ===== Helpers =====

function parseUrl(urlString) {
    const parsed = new URL(urlString);
    return {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        path: parsed.pathname + parsed.search,
    };
}

function urlToOptions(url) {
    return {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: url.pathname + url.search,
        hash: url.hash,
    };
}

// ===== IncomingMessage =====

const MULTI_VALUE_HEADERS = new Set([
    'set-cookie',
]);

export class IncomingMessage extends EventEmitter {
    constructor(nativeRes) {
        super();
        this._nativeRes = nativeRes;
        this.statusCode = nativeRes.status;
        this.statusMessage = STATUS_CODES[nativeRes.status] || 'Unknown';
        this.httpVersion = '1.1';
        this.httpVersionMajor = 1;
        this.httpVersionMinor = 1;
        this.complete = false;
        this.method = undefined;
        this.url = undefined;
        this.socket = null;
        this.trailers = {};
        this.trailersDistinct = {};
        this.destroyed = false;
        this._timeout = null;
        this._encoding = null;

        const rawPairs = nativeRes.headers;
        this.rawHeaders = [];
        this.headers = {};
        this.headersDistinct = {};
        for (const pair of rawPairs) {
            const name = pair[0];
            const value = pair[1];
            this.rawHeaders.push(name, value);
            const lower = name.toLowerCase();
            if (MULTI_VALUE_HEADERS.has(lower)) {
                if (!this.headersDistinct[lower]) {
                    this.headersDistinct[lower] = [];
                }
                this.headersDistinct[lower].push(value);
                if (Array.isArray(this.headers[lower])) {
                    this.headers[lower].push(value);
                } else if (this.headers[lower] !== undefined) {
                    this.headers[lower] = [this.headers[lower], value];
                } else {
                    this.headers[lower] = [value];
                }
            } else {
                if (this.headers[lower] !== undefined) {
                    this.headers[lower] += ', ' + value;
                } else {
                    this.headers[lower] = value;
                }
                if (!this.headersDistinct[lower]) {
                    this.headersDistinct[lower] = [];
                }
                this.headersDistinct[lower].push(value);
            }
        }
    }

    setTimeout(ms, callback) {
        this._timeout = ms;
        if (callback) this.once('timeout', callback);
        return this;
    }

    setEncoding(encoding) {
        this._encoding = encoding;
        return this;
    }

    destroy(error) {
        this.destroyed = true;
        if (error) this.emit('error', error);
        return this;
    }

    resume() {
        return this;
    }

    pause() {
        return this;
    }

    async _startReading() {
        try {
            while (true) {
                const [chunk, done] = await this._nativeRes.readBodyChunk();
                if (done || chunk === null) {
                    this.complete = true;
                    this.emit('end');
                    break;
                }
                const buf = Buffer.from(chunk);
                if (this._encoding) {
                    this.emit('data', buf.toString(this._encoding));
                } else {
                    this.emit('data', buf);
                }
            }
        } catch (err) {
            this.emit('error', err);
        }
    }
}

// ===== ClientRequest =====

export class ClientRequest extends EventEmitter {
    constructor(options, callback) {
        super();

        if (options.method != null && typeof options.method !== 'string') {
            let received;
            if (typeof options.method === 'symbol') {
                received = ` Received type symbol (${options.method.toString()})`;
            } else if (typeof options.method === 'object') {
                const ctorName = options.method.constructor && options.method.constructor.name;
                received = ctorName ? ` Received an instance of ${ctorName}` : ` Received type object`;
            } else {
                received = ` Received type ${typeof options.method} (${String(options.method)})`;
            }
            const err = new TypeError(
                'The "options.method" property must be of type string.' + received
            );
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }

        this.method = (options.method || 'GET').toUpperCase();
        this.protocol = options.protocol || 'http:';

        const hostname = options.hostname || options.host || 'localhost';
        const port = options.port;
        this.path = options.path || '/';

        if (port) {
            this.host = hostname + ':' + port;
        } else {
            this.host = hostname;
        }

        const url = this.protocol + '//' + this.host + this.path;

        this._headers = {};
        const inputHeaders = options.headers || {};
        for (const name of Object.keys(inputHeaders)) {
            this._headers[name.toLowerCase()] = { name, value: String(inputHeaders[name]) };
        }

        const flatHeaders = {};
        for (const key of Object.keys(this._headers)) {
            flatHeaders[this._headers[key].name] = this._headers[key].value;
        }

        this._nativeReq = new NodeHttpClientRequest(this.method, url, flatHeaders);

        this.headersSent = false;
        this.destroyed = false;
        this._writableEnded = false;
        this._writableFinished = false;
        this.socket = null;
        this._timeout = null;

        if (typeof callback === 'function') {
            this.once('response', callback);
        }

        if (onClientRequestCreated.hasSubscribers) {
            onClientRequestCreated.publish({ request: this });
        }
    }

    get writableEnded() {
        return this._writableEnded;
    }

    get writableFinished() {
        return this._writableFinished;
    }

    setHeader(name, value) {
        const lower = name.toLowerCase();
        this._headers[lower] = { name, value: String(value) };
        this._nativeReq.setHeader(name, String(value));
    }

    getHeader(name) {
        const entry = this._headers[name.toLowerCase()];
        return entry ? entry.value : undefined;
    }

    removeHeader(name) {
        const lower = name.toLowerCase();
        delete this._headers[lower];
        this._nativeReq.removeHeader(name);
    }

    hasHeader(name) {
        return name.toLowerCase() in this._headers;
    }

    getHeaderNames() {
        return Object.keys(this._headers).map(k => this._headers[k].name);
    }

    getHeaders() {
        const result = {};
        for (const key of Object.keys(this._headers)) {
            result[this._headers[key].name] = this._headers[key].value;
        }
        return result;
    }

    getRawHeaderNames() {
        return Object.keys(this._headers).map(k => this._headers[k].name);
    }

    flushHeaders() {}

    setTimeout(ms, callback) {
        this._timeout = ms;
        if (callback) this.once('timeout', callback);
        return this;
    }

    setNoDelay() {
        return this;
    }

    setSocketKeepAlive() {
        return this;
    }

    write(chunk, encoding, callback) {
        if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }

        if (typeof chunk === 'string') {
            this._nativeReq.writeString(chunk);
        } else if (chunk instanceof Uint8Array) {
            this._nativeReq.write(chunk);
        } else if (Buffer.isBuffer(chunk)) {
            this._nativeReq.write(new Uint8Array(chunk));
        } else if (chunk != null) {
            this._nativeReq.writeString(String(chunk));
        }

        if (typeof callback === 'function') callback();
        return true;
    }

    end(data, encoding, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = undefined;
            encoding = undefined;
        } else if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }

        if (this._endPromise) {
            if (typeof callback === 'function') callback();
            return this;
        }

        if (data != null) {
            if (typeof data === 'string') {
                this._nativeReq.writeString(data);
            } else if (data instanceof Uint8Array) {
                this._nativeReq.write(data);
            } else if (Buffer.isBuffer(data)) {
                this._nativeReq.write(new Uint8Array(data));
            } else {
                this._nativeReq.writeString(String(data));
            }
        }

        this._endCallback = callback;
        this._endPromise = this._doSend();
        return this;
    }

    async _doSend() {
        try {
            if (onClientRequestStart.hasSubscribers) {
                onClientRequestStart.publish({ request: this });
            }

            await this._nativeReq.end(undefined);

            this.headersSent = true;
            this._writableEnded = true;
            this._writableFinished = true;
            this.emit('finish');

            const nativeRes = this._nativeReq.getResponse();
            if (nativeRes) {
                const res = new IncomingMessage(nativeRes);
                if (onClientResponseFinish.hasSubscribers) {
                    onClientResponseFinish.publish({ request: this, response: res });
                }
                this.emit('response', res);
                await res._startReading();
            }

            if (typeof this._endCallback === 'function') this._endCallback();
        } catch (err) {
            if (onClientRequestError.hasSubscribers) {
                onClientRequestError.publish({ request: this, error: err });
            }
            this.emit('error', err);
        }
        this.emit('close');
    }

    abort() {
        this._nativeReq.abort();
        this.destroyed = true;
        this.emit('abort');
        this.emit('close');
    }

    destroy(error) {
        if (this.destroyed) return this;
        this._nativeReq.abort();
        this.destroyed = true;
        if (error) this.emit('error', error);
        this.emit('close');
        return this;
    }
}

// ===== Server =====

import {
    Server as _Server,
    ServerResponse as _ServerResponse,
    createServer as _createServer,
} from '__wasm_rquickjs_builtin/node_http_server';

export const Server = _Server;
export const ServerResponse = _ServerResponse;
export const createServer = _createServer;

// ===== request / get =====

export function request(url, options, callback) {
    let opts;
    if (typeof url === 'string') {
        opts = { ...parseUrl(url), ...(typeof options === 'object' ? options : {}) };
        if (typeof options === 'function') callback = options;
    } else if (url instanceof URL) {
        opts = { ...urlToOptions(url), ...(typeof options === 'object' ? options : {}) };
        if (typeof options === 'function') callback = options;
    } else {
        opts = url;
        callback = typeof options === 'function' ? options : callback;
    }
    return new ClientRequest(opts, callback);
}

export function get(url, options, callback) {
    const req = request(url, options, callback);
    req.end();
    return req;
}

// ===== Default export =====

export default {
    METHODS,
    STATUS_CODES,
    maxHeaderSize,
    validateHeaderName,
    validateHeaderValue,
    Agent,
    globalAgent,
    ClientRequest,
    IncomingMessage,
    Server,
    ServerResponse,
    createServer,
    request,
    get,
};
