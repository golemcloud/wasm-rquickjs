// node:http implementation
import { NodeHttpClientRequest } from '__wasm_rquickjs_builtin/node_http_native';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';

import { channel } from 'node:diagnostics_channel';
import { kOutHeaders } from '__wasm_rquickjs_builtin/internal/http';
import {
    ERR_HTTP_HEADERS_SENT,
    ERR_HTTP_INVALID_HEADER_VALUE,
    ERR_INVALID_ARG_TYPE,
    ERR_INVALID_HTTP_TOKEN,
    ERR_METHOD_NOT_IMPLEMENTED,
    ERR_UNESCAPED_CHARACTERS,
} from '__wasm_rquickjs_builtin/internal/errors';

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
const HTTP_TOKEN_REGEX = /^[!#$%&'*+\-.^_`|~A-Za-z0-9]+$/;
const INVALID_PATH_REGEX = /[^\u0021-\u00ff]/;

function isValidHttpToken(value) {
    return typeof value === 'string' && HTTP_TOKEN_REGEX.test(value);
}

export function validateHeaderName(name, label = 'Header name') {
    if (typeof name !== 'string' || name.length === 0) {
        throw new ERR_INVALID_HTTP_TOKEN(label, name);
    }
    if (INVALID_HEADER_NAME_REGEX.test(name)) {
        throw new ERR_INVALID_HTTP_TOKEN(label, name);
    }
}

export function validateHeaderValue(name, value) {
    if (value === undefined) {
        throw new ERR_HTTP_INVALID_HEADER_VALUE(value, name);
    }
    if (INVALID_HEADER_CHAR_REGEX.test(value)) {
        const err = new TypeError('Invalid character in header content ["' + name + '"]');
        err.code = 'ERR_INVALID_CHAR';
        throw err;
    }
}

function validateHostOption(options, propertyName) {
    const value = options[propertyName];
    if (value !== undefined && value !== null && typeof value !== 'string') {
        throw new ERR_INVALID_ARG_TYPE(
            `options.${propertyName}`,
            ['string', 'undefined', 'null'],
            value
        );
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
        this._activeRequestCount = {};
        this._requestQueue = {};
    }

    destroy() {
        this._activeRequestCount = {};
        this._requestQueue = {};
    }

    _scheduleRequest(name, execute) {
        const maxConcurrent = this.maxSockets;

        if (!Number.isFinite(maxConcurrent)) {
            return execute();
        }

        const key = name || 'default';
        const currentActive = this._activeRequestCount[key] || 0;

        return new Promise((resolve, reject) => {
            const run = () => {
                this._activeRequestCount[key] = (this._activeRequestCount[key] || 0) + 1;

                Promise.resolve()
                    .then(execute)
                    .then(resolve, reject)
                    .finally(() => {
                        const remaining = (this._activeRequestCount[key] || 1) - 1;
                        if (remaining > 0) {
                            this._activeRequestCount[key] = remaining;
                        } else {
                            delete this._activeRequestCount[key];
                        }

                        const queue = this._requestQueue[key];
                        if (queue && queue.length > 0) {
                            const next = queue.shift();
                            if (queue.length === 0) {
                                delete this._requestQueue[key];
                            }
                            next();
                        }
                    });
            };

            if (currentActive < maxConcurrent) {
                run();
                return;
            }

            if (!this._requestQueue[key]) {
                this._requestQueue[key] = [];
            }
            this._requestQueue[key].push(run);
        });
    }

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
    let parsed;
    try {
        parsed = new URL(urlString);
    } catch {
        const err = new TypeError('Invalid URL');
        err.code = 'ERR_INVALID_URL';
        err.input = urlString;
        throw err;
    }
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

function isLoopbackHostname(hostname) {
    const normalized = String(hostname || '').toLowerCase();
    return normalized === 'localhost' ||
        normalized === '127.0.0.1' ||
        normalized === '::1' ||
        normalized === '[::1]';
}

function consumeCapturedResponseMetadata(hostname, port, statusCode) {
    if (!isLoopbackHostname(hostname)) {
        return undefined;
    }

    const normalizedPort = Number(port);
    if (!Number.isFinite(normalizedPort) || normalizedPort <= 0) {
        return undefined;
    }

    const takeResponseMetadata = globalThis.__wasm_rquickjs_take_http_response_metadata;
    if (typeof takeResponseMetadata === 'function') {
        const metadata = takeResponseMetadata(normalizedPort, statusCode);
        if (metadata && typeof metadata === 'object') {
            return metadata;
        }
    }

    const takeStatusMessage = globalThis.__wasm_rquickjs_take_http_status_message;
    if (typeof takeStatusMessage !== 'function') {
        return undefined;
    }

    const statusMessage = takeStatusMessage(normalizedPort, statusCode);
    if (statusMessage === undefined) {
        return undefined;
    }

    return { statusMessage };
}

function consumeCapturedResponseSequence(hostname, port, expectedFinalStatusCode) {
    if (!isLoopbackHostname(hostname)) {
        return { informational: [], final: undefined };
    }

    const normalizedPort = Number(port);
    if (!Number.isFinite(normalizedPort) || normalizedPort <= 0) {
        return { informational: [], final: undefined };
    }

    const takeResponseSequence = globalThis.__wasm_rquickjs_take_http_response_sequence;
    if (typeof takeResponseSequence === 'function') {
        const sequence = takeResponseSequence(normalizedPort, expectedFinalStatusCode);
        if (sequence && typeof sequence === 'object') {
            const informational = Array.isArray(sequence.informational) ? sequence.informational : [];
            const final = sequence.final && typeof sequence.final === 'object'
                ? sequence.final
                : undefined;
            return { informational, final };
        }
    }

    const takeResponseMetadata = globalThis.__wasm_rquickjs_take_http_response_metadata;
    if (typeof takeResponseMetadata !== 'function') {
        return {
            informational: [],
            final: consumeCapturedResponseMetadata(hostname, port, expectedFinalStatusCode),
        };
    }

    const informational = [];
    let final;

    for (let i = 0; i < 64; i++) {
        const metadata = takeResponseMetadata(normalizedPort);
        if (!metadata || typeof metadata !== 'object') {
            break;
        }

        const statusCode = Number(metadata.statusCode);
        if (statusCode >= 100 && statusCode < 200 && statusCode !== 101) {
            informational.push(metadata);
            continue;
        }

        final = metadata;
        break;
    }

    if (!final) {
        final = consumeCapturedResponseMetadata(hostname, port, expectedFinalStatusCode);
    }

    return { informational, final };
}

function toInformationalHeaders(rawHeaders, fallbackHeaders) {
    if (fallbackHeaders && typeof fallbackHeaders === 'object') {
        return fallbackHeaders;
    }

    const headers = {};
    if (!Array.isArray(rawHeaders)) {
        return headers;
    }

    for (let i = 0; i < rawHeaders.length - 1; i += 2) {
        const name = String(rawHeaders[i]);
        const value = String(rawHeaders[i + 1]);
        const lower = name.toLowerCase();
        if (headers[lower] === undefined) {
            headers[lower] = value;
        } else {
            headers[lower] += ', ' + value;
        }
    }

    return headers;
}

function emitInformationEvent(request, metadata) {
    if (!metadata || typeof metadata !== 'object') {
        return;
    }

    const statusCode = Number(metadata.statusCode);
    if (!Number.isFinite(statusCode) || statusCode < 100 || statusCode >= 200 || statusCode === 101) {
        return;
    }

    const statusMessage = typeof metadata.statusMessage === 'string'
        ? metadata.statusMessage
        : (STATUS_CODES[statusCode] || '');
    const httpVersion = normalizeHttpVersion(metadata.httpVersion);
    const [majorPart, minorPart] = httpVersion.split('.');
    const rawHeaders = Array.isArray(metadata.rawHeaders) ? metadata.rawHeaders : [];
    const headers = toInformationalHeaders(rawHeaders, metadata.headers);

    if (statusCode === 100) {
        request.emit('continue');
    }

    request.emit('information', {
        statusCode,
        statusMessage,
        httpVersion,
        httpVersionMajor: Number(majorPart) || 1,
        httpVersionMinor: Number(minorPart) || 1,
        headers,
        rawHeaders,
    });
}

function normalizeHttpVersion(httpVersion) {
    if (typeof httpVersion === 'string' && /^\d+\.\d+$/.test(httpVersion)) {
        return httpVersion;
    }
    return '1.1';
}

function applyHttpVersion(message, httpVersion) {
    const normalized = normalizeHttpVersion(httpVersion);
    const parts = normalized.split('.');
    message.httpVersion = normalized;
    message.httpVersionMajor = Number(parts[0]) || 1;
    message.httpVersionMinor = Number(parts[1]) || 1;
}

function connectionHeaderTokens(value) {
    if (Array.isArray(value)) {
        const tokens = [];
        for (const entry of value) {
            tokens.push(...connectionHeaderTokens(entry));
        }
        return tokens;
    }
    if (value === undefined || value === null) {
        return [];
    }
    return String(value)
        .split(',')
        .map(token => token.trim().toLowerCase())
        .filter(token => token.length > 0);
}

function hasConnectionToken(value, token) {
    return connectionHeaderTokens(value).includes(token);
}

function shouldKeepAliveFromResponse(httpVersion, connectionHeader) {
    if (hasConnectionToken(connectionHeader, 'close')) {
        return false;
    }
    if (hasConnectionToken(connectionHeader, 'keep-alive')) {
        return true;
    }
    return normalizeHttpVersion(httpVersion) !== '1.0';
}

function isCookieHeader(name) {
    return typeof name === 'string' && name.toLowerCase() === 'cookie';
}

function stringifyHeaderValue(value) {
    return String(value);
}

function expandHeaderValuesForWire(name, value) {
    if (!Array.isArray(value)) {
        return [stringifyHeaderValue(value)];
    }

    const values = value.map(stringifyHeaderValue);
    if (values.length < 2 || !isCookieHeader(name)) {
        return values;
    }

    return [values.join('; ')];
}

function headerValueForNative(name, value) {
    const values = expandHeaderValuesForWire(name, value);
    if (values.length === 0) {
        return '';
    }
    if (values.length === 1) {
        return values[0];
    }
    return values.join(', ');
}

function shouldSkipNativeHeader(name, value) {
    if (typeof name !== 'string') {
        return false;
    }
    const lower = name.toLowerCase();
    if (lower === 'host') {
        // wasi:http controls authority separately from headers and rejects manual Host overrides.
        return true;
    }
    if (lower !== 'accept') {
        return false;
    }
    const values = expandHeaderValuesForWire(name, value);
    return values.length === 1 && values[0] === '*/*';
}

function normalizeRawHeaderPairs(headers) {
    const pairs = [];
    if (!Array.isArray(headers)) {
        return pairs;
    }

    if (headers.length === 0) {
        return pairs;
    }

    if (Array.isArray(headers[0])) {
        for (const entry of headers) {
            if (!Array.isArray(entry) || entry.length < 2) {
                continue;
            }
            pairs.push([String(entry[0]), entry[1]]);
        }
        return pairs;
    }

    for (let i = 0; i < headers.length - 1; i += 2) {
        pairs.push([String(headers[i]), headers[i + 1]]);
    }

    return pairs;
}

function mergeCookieHeaderValues(existingValue, nextValue) {
    const merged = [];
    const existingValues = Array.isArray(existingValue) ? existingValue : [existingValue];
    for (const value of existingValues) {
        merged.push(stringifyHeaderValue(value));
    }

    const nextValues = Array.isArray(nextValue) ? nextValue : [nextValue];
    for (const value of nextValues) {
        merged.push(stringifyHeaderValue(value));
    }

    return merged;
}

// ===== IncomingMessage =====

const SET_COOKIE_HEADER = 'set-cookie';
const COOKIE_HEADER = 'cookie';
const NO_DUPLICATE_HEADERS = new Set([
    'age',
    'authorization',
    'content-length',
    'content-type',
    'etag',
    'expires',
    'from',
    'host',
    'if-modified-since',
    'if-unmodified-since',
    'last-modified',
    'location',
    'max-forwards',
    'proxy-authorization',
    'referer',
    'retry-after',
    'server',
    'user-agent',
]);

function normalizeIncomingRawPairs(nativeRes, responseMetadata) {
    if (responseMetadata && Array.isArray(responseMetadata.rawHeaders)) {
        const capturedPairs = normalizeRawHeaderPairs(responseMetadata.rawHeaders);
        if (capturedPairs.length > 0) {
            return capturedPairs;
        }
    }

    if (nativeRes && Array.isArray(nativeRes.headers)) {
        return normalizeRawHeaderPairs(nativeRes.headers);
    }

    return [];
}

function parseIncomingHeaders(rawPairs) {
    const rawHeaders = [];
    const headers = {};
    const headersDistinct = {};

    for (const pair of rawPairs) {
        const name = String(pair[0]);
        const lower = name.toLowerCase();
        const values = Array.isArray(pair[1]) ? pair[1] : [pair[1]];

        for (const value of values) {
            const valueString = String(value);
            rawHeaders.push(name, valueString);

            if (!headersDistinct[lower]) {
                headersDistinct[lower] = [];
            }
            headersDistinct[lower].push(valueString);

            if (lower === SET_COOKIE_HEADER) {
                if (Array.isArray(headers[lower])) {
                    headers[lower].push(valueString);
                } else if (headers[lower] !== undefined) {
                    headers[lower] = [headers[lower], valueString];
                } else {
                    headers[lower] = [valueString];
                }
                continue;
            }

            if (lower === COOKIE_HEADER) {
                if (headers[lower] !== undefined) {
                    headers[lower] += '; ' + valueString;
                } else {
                    headers[lower] = valueString;
                }
                continue;
            }

            if (NO_DUPLICATE_HEADERS.has(lower)) {
                if (headers[lower] === undefined) {
                    headers[lower] = valueString;
                }
                continue;
            }

            if (headers[lower] !== undefined) {
                headers[lower] += ', ' + valueString;
            } else {
                headers[lower] = valueString;
            }
        }
    }

    return { rawHeaders, headers, headersDistinct };
}

export class IncomingMessage extends EventEmitter {
    constructor(nativeRes, statusMessageOverride, httpVersionOverride, responseMetadata) {
        super();
        const hasNativeResponse = nativeRes !== null &&
            typeof nativeRes === 'object' &&
            typeof nativeRes.status === 'number' &&
            Array.isArray(nativeRes.headers);

        this._nativeRes = hasNativeResponse ? nativeRes : null;
        this.statusCode = hasNativeResponse ? nativeRes.status : null;
        if (hasNativeResponse) {
            if (statusMessageOverride !== undefined) {
                this.statusMessage = statusMessageOverride;
            } else if (typeof nativeRes.statusMessage === 'string') {
                this.statusMessage = nativeRes.statusMessage;
            } else {
                this.statusMessage = STATUS_CODES[nativeRes.status] || 'Unknown';
            }
            applyHttpVersion(this, httpVersionOverride);
        } else {
            this.statusMessage = null;
            this.httpVersion = null;
            this.httpVersionMajor = null;
            this.httpVersionMinor = null;
        }
        this.complete = false;
        this.method = hasNativeResponse ? undefined : null;
        this.url = hasNativeResponse ? undefined : '';
        this.socket = hasNativeResponse ? null : nativeRes;
        this.client = this.socket;
        this.trailers = {};
        this.trailersDistinct = {};
        this.destroyed = false;
        this._timeout = null;
        this._encoding = null;

        const parsedHeaders = parseIncomingHeaders(
            hasNativeResponse ? normalizeIncomingRawPairs(nativeRes, responseMetadata) : []
        );
        this.rawHeaders = parsedHeaders.rawHeaders;
        this.headers = parsedHeaders.headers;
        this.headersDistinct = parsedHeaders.headersDistinct;
    }

    get connection() {
        return this.socket;
    }

    set connection(value) {
        this.socket = value;
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

    _hasNoBody() {
        if ((this.statusCode >= 100 && this.statusCode < 200) ||
            this.statusCode === 204 ||
            this.statusCode === 304) {
            return true;
        }

        const contentLength = this.headers['content-length'];
        if (contentLength === undefined) {
            return false;
        }

        const parsed = Number(contentLength);
        return Number.isFinite(parsed) && parsed <= 0;
    }

    async _startReading() {
        if (!this._nativeRes || typeof this._nativeRes.readBodyChunk !== 'function') {
            this.complete = true;
            this.emit('end');
            return;
        }

        if (this._hasNoBody()) {
            if (this._nativeRes && typeof this._nativeRes.discardBody === 'function') {
                this._nativeRes.discardBody();
            }
            this.complete = true;
            this.emit('end');
            return;
        }

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

export class OutgoingMessage extends EventEmitter {
    constructor(options = {}) {
        super();
        this[kOutHeaders] = null;
        this.outputData = [];
        this.outputSize = 0;
        this.writable = true;
        this.destroyed = false;
        this.finished = false;
        this._writableEnded = false;
        this._writableFinished = false;
        this.headersSent = false;
        this._header = null;
        this._socket = null;
        this._highWaterMark = Number.isFinite(options && options.highWaterMark)
            ? options.highWaterMark
            : 16 * 1024;
    }

    get socket() {
        return this._socket;
    }

    set socket(value) {
        this._socket = value;
    }

    get connection() {
        return this._socket;
    }

    set connection(value) {
        this._socket = value;
    }

    get writableEnded() {
        return this._writableEnded;
    }

    get writableFinished() {
        return this._writableFinished;
    }

    get writableHighWaterMark() {
        return this._highWaterMark;
    }

    get writableLength() {
        return this.outputSize;
    }

    get writableObjectMode() {
        return false;
    }

    _implicitHeader() {
        throw new ERR_METHOD_NOT_IMPLEMENTED('_implicitHeader()');
    }

    _renderHeaders() {
        if (this._header) {
            throw new ERR_HTTP_HEADERS_SENT('render');
        }

        const headersMap = this[kOutHeaders];
        const headers = {};

        if (headersMap !== null) {
            for (const key of Object.keys(headersMap)) {
                headers[headersMap[key][0]] = headersMap[key][1];
            }
        }

        return headers;
    }

    _writeToSocket(chunk, encoding, callback) {
        const socket = this._socket;
        if (socket && typeof socket.write === 'function') {
            return socket.write(chunk, encoding, callback);
        }

        const bufferedChunk = typeof chunk === 'string'
            ? Buffer.from(chunk, encoding)
            : Buffer.from(chunk);
        this.outputData.push({ data: bufferedChunk, encoding, callback });
        this.outputSize += bufferedChunk.length;
        if (typeof callback === 'function') {
            callback();
        }
        return this.outputSize < this._highWaterMark;
    }

    write(chunk, encoding, callback) {
        if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }

        if (!this._header) {
            this._implicitHeader();
        }

        if (chunk === null) {
            const err = new TypeError('May not write null values to stream');
            err.code = 'ERR_STREAM_NULL_VALUES';
            throw err;
        }

        if (chunk === undefined) {
            const err = new TypeError(
                'The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received undefined'
            );
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }

        if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) {
            const err = new TypeError(
                'The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received type ' +
                typeof chunk + ' (' + String(chunk) + ')'
            );
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }

        return this._writeToSocket(chunk, encoding, callback);
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

        if (!this._header) {
            this._implicitHeader();
        }

        if (data !== undefined && data !== null) {
            this.write(data, encoding);
        }

        this._writeToSocket('', 'latin1', () => {
            this.finished = true;
            this._writableEnded = true;
            this._writableFinished = true;
            this.outputData = [];
            this.outputSize = 0;
            if (typeof callback === 'function') {
                callback();
            }
            this.emit('finish');
        });

        return this;
    }

    destroy(error) {
        if (this.destroyed) {
            return this;
        }
        this.destroyed = true;
        if (error) {
            this.emit('error', error);
        }
        this.emit('close');
        return this;
    }
}

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

        validateHostOption(options, 'hostname');
        validateHostOption(options, 'host');

        if (options.method && !isValidHttpToken(options.method)) {
            throw new ERR_INVALID_HTTP_TOKEN('Method', options.method);
        }

        if (options.path) {
            const path = String(options.path);
            if (INVALID_PATH_REGEX.test(path)) {
                throw new ERR_UNESCAPED_CHARACTERS('Request path');
            }
        }

        this.method = (options.method || 'GET').toUpperCase();
        this.protocol = options.protocol || 'http:';

        const hostname = options.hostname || options.host || 'localhost';
        const port = options.port;
        this.path = options.path || '/';
        this.hostname = hostname;
        this.port = port === undefined ? (this.protocol === 'https:' ? 443 : 80) : Number(port);
        if (port) {
            this.host = hostname + ':' + port;
        } else {
            this.host = hostname;
        }

        const url = this.protocol + '//' + this.host + this.path;

        this.agent = options.agent === undefined ? globalAgent : options.agent;
        this._agentName = null;
        if (this.agent && this.agent !== false && typeof this.agent.getName === 'function') {
            this._agentName = this.agent.getName(options);
        }

        this._headers = {};
        this._rawHeaderPairs = null;
        this._usedWrite = false;
        this._bodyLength = 0;
        this._bodyChunks = [];

        const inputHeaders = options.headers;
        if (Array.isArray(inputHeaders)) {
            this._rawHeaderPairs = normalizeRawHeaderPairs(inputHeaders);
            for (const [name, value] of this._rawHeaderPairs) {
                this._mergeHeader(name, value);
            }
        } else if (inputHeaders && typeof inputHeaders === 'object') {
            for (const name of Object.keys(inputHeaders)) {
                this._headers[name.toLowerCase()] = { name, value: inputHeaders[name] };
            }
        }

        this.shouldKeepAlive = true;
        this._defaultKeepAlive = true;
        this._last = false;
        this._refreshShouldKeepAlive();

        this._nativeReq = new NodeHttpClientRequest(this.method, url, {});
        for (const key of Object.keys(this._headers)) {
            const entry = this._headers[key];
            if (shouldSkipNativeHeader(entry.name, entry.value)) {
                continue;
            }
            this._nativeReq.setHeader(entry.name, headerValueForNative(entry.name, entry.value));
        }

        this.headersSent = false;
        this.destroyed = false;
        this._writableEnded = false;
        this._writableFinished = false;
        this.socket = null;
        this._timeout = null;
        this._header = null;

        if (this._rawHeaderPairs !== null) {
            this._refreshHeaderString();
        }

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

    _mergeHeader(name, value) {
        const lower = String(name).toLowerCase();
        const existing = this._headers[lower];

        if (isCookieHeader(name) && existing) {
            this._headers[lower] = {
                name: existing.name,
                value: mergeCookieHeaderValues(existing.value, value),
            };
            return;
        }

        this._headers[lower] = { name: String(name), value };
    }

    _refreshHeaderString() {
        let rendered = `${this.method} ${this.path} HTTP/1.1\r\n`;

        if (Array.isArray(this._rawHeaderPairs)) {
            for (const [name, rawValue] of this._rawHeaderPairs) {
                const wireValues = expandHeaderValuesForWire(name, rawValue);
                for (const value of wireValues) {
                    rendered += `${name}: ${value}\r\n`;
                }
            }
        } else {
            for (const key of Object.keys(this._headers)) {
                const entry = this._headers[key];
                const wireValues = expandHeaderValuesForWire(entry.name, entry.value);
                for (const value of wireValues) {
                    rendered += `${entry.name}: ${value}\r\n`;
                }
            }
        }

        rendered += '\r\n';
        this._header = rendered;
    }

    _computeShouldKeepAliveFromAgent() {
        if (this.agent === false) {
            return false;
        }
        return true;
    }

    _refreshShouldKeepAlive() {
        this.shouldKeepAlive = this._computeShouldKeepAliveFromAgent();
        this._last = !this.shouldKeepAlive;

        const connectionHeader = this.getHeader('connection');
        if (hasConnectionToken(connectionHeader, 'close')) {
            this.shouldKeepAlive = false;
            this._last = true;
        } else if (hasConnectionToken(connectionHeader, 'keep-alive')) {
            this.shouldKeepAlive = true;
            this._last = false;
        }
    }

    _applyDefaultBodyHeaders() {
        if (this.hasHeader('content-length') || this.hasHeader('transfer-encoding')) {
            return;
        }

        if (this._bodyLength > 0) {
            // The native wasi:http bridge sends the aggregated body payload and does not
            // expose chunk framing control, so default to Content-Length there.
            if (this._useLoopbackTransport && this._usedWrite) {
                this.setHeader('Transfer-Encoding', 'chunked');
            } else {
                this.setHeader('Content-Length', String(this._bodyLength));
            }
            return;
        }

        if (this.method !== 'GET' && this.method !== 'HEAD') {
            this.setHeader('Content-Length', '0');
        }
    }

    setHeader(name, value) {
        const lower = name.toLowerCase();
        this._headers[lower] = { name, value };
        if (shouldSkipNativeHeader(name, value)) {
            this._nativeReq.removeHeader(name);
        } else {
            this._nativeReq.setHeader(name, headerValueForNative(name, value));
        }
        this._rawHeaderPairs = null;
        this._refreshShouldKeepAlive();
        this._refreshHeaderString();
    }

    getHeader(name) {
        const entry = this._headers[name.toLowerCase()];
        return entry ? entry.value : undefined;
    }

    removeHeader(name) {
        const lower = name.toLowerCase();
        delete this._headers[lower];
        this._nativeReq.removeHeader(name);
        this._rawHeaderPairs = null;
        this._refreshShouldKeepAlive();
        this._refreshHeaderString();
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

    flushHeaders() {
        this._refreshHeaderString();
    }

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

        this._usedWrite = true;

        let bodyChunk;

        if (typeof chunk === 'string') {
            bodyChunk = Buffer.from(chunk, encoding || 'utf8');
        } else if (chunk instanceof Uint8Array) {
            bodyChunk = Buffer.from(chunk);
        } else if (Buffer.isBuffer(chunk)) {
            bodyChunk = chunk;
        } else if (chunk != null) {
            const chunkString = String(chunk);
            bodyChunk = Buffer.from(chunkString, 'utf8');
        }

        if (bodyChunk) {
            this._bodyLength += bodyChunk.length;
            this._bodyChunks.push(bodyChunk);
            if (!this._useLoopbackTransport) {
                this._nativeReq.write(new Uint8Array(bodyChunk));
            }
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
            let bodyChunk;
            if (typeof data === 'string') {
                bodyChunk = Buffer.from(data, encoding || 'utf8');
            } else if (data instanceof Uint8Array) {
                bodyChunk = Buffer.from(data);
            } else if (Buffer.isBuffer(data)) {
                bodyChunk = data;
            } else {
                const dataString = String(data);
                bodyChunk = Buffer.from(dataString, 'utf8');
            }

            if (bodyChunk) {
                this._bodyLength += bodyChunk.length;
                this._bodyChunks.push(bodyChunk);
                if (!this._useLoopbackTransport) {
                    this._nativeReq.write(new Uint8Array(bodyChunk));
                }
            }
        }

        this._applyDefaultBodyHeaders();

        this._endCallback = callback;
        this._endPromise = this._sendThroughAgent();
        return this;
    }

    _sendThroughAgent() {
        if (this.agent && this.agent !== false && typeof this.agent._scheduleRequest === 'function') {
            return this.agent._scheduleRequest(this._agentName, () => this._doSend());
        }
        return this._doSend();
    }

    async _doSend() {
        try {
            if (onClientRequestStart.hasSubscribers) {
                onClientRequestStart.publish({ request: this });
            }

            this._refreshHeaderString();
            await this._nativeReq.end(undefined);
            const nativeRes = this._nativeReq.getResponse();

            this.headersSent = true;
            this._writableEnded = true;
            this._writableFinished = true;
            this.emit('finish');

            if (nativeRes) {
                const metadataSequence = consumeCapturedResponseSequence(
                    this.hostname,
                    this.port,
                    nativeRes.status
                );
                for (const informational of metadataSequence.informational) {
                    emitInformationEvent(this, informational);
                }

                const responseMetadata = metadataSequence.final;
                const res = new IncomingMessage(
                    nativeRes,
                    responseMetadata && responseMetadata.statusMessage,
                    responseMetadata && responseMetadata.httpVersion,
                    responseMetadata
                );

                const responseConnectionHeader = res.headers.connection !== undefined
                    ? res.headers.connection
                    : (responseMetadata && responseMetadata.connectionHeader);

                const responseShouldKeepAlive = shouldKeepAliveFromResponse(
                    res.httpVersion,
                    responseConnectionHeader
                );
                if (this.shouldKeepAlive && !responseShouldKeepAlive) {
                    this.shouldKeepAlive = false;
                    this._last = true;
                }

                if (onClientResponseFinish.hasSubscribers) {
                    onClientResponseFinish.publish({ request: this, response: res });
                }
                this.emit('response', res);

                const shouldReadResponseBody =
                    res.listenerCount('data') > 0 ||
                    res.listenerCount('end') > 0 ||
                    res.listenerCount('readable') > 0;

                if (shouldReadResponseBody) {
                    // Start streaming the response body asynchronously. Waiting here can
                    // block the agent queue when wasi:http pollables stall on empty bodies.
                    void res._startReading();
                } else if (res._nativeRes && typeof res._nativeRes.discardBody === 'function') {
                    res._nativeRes.discardBody();
                    res.complete = true;
                }
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
    OutgoingMessage,
    ClientRequest,
    IncomingMessage,
    Server,
    ServerResponse,
    createServer,
    request,
    get,
};
