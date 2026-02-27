// node:http server implementation
import { Server as NetServer } from 'node:net';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import Readable from '__wasm_rquickjs_builtin/internal/streams/readable';
// STATUS_CODES is duplicated here to avoid circular dependency with node:http
const STATUS_CODES = {
    100: 'Continue', 101: 'Switching Protocols', 102: 'Processing', 103: 'Early Hints',
    200: 'OK', 201: 'Created', 202: 'Accepted', 203: 'Non-Authoritative Information',
    204: 'No Content', 205: 'Reset Content', 206: 'Partial Content', 207: 'Multi-Status',
    208: 'Already Reported', 226: 'IM Used',
    300: 'Multiple Choices', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other',
    304: 'Not Modified', 305: 'Use Proxy', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
    400: 'Bad Request', 401: 'Unauthorized', 402: 'Payment Required', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 406: 'Not Acceptable',
    407: 'Proxy Authentication Required', 408: 'Request Timeout', 409: 'Conflict', 410: 'Gone',
    411: 'Length Required', 412: 'Precondition Failed', 413: 'Payload Too Large',
    414: 'URI Too Long', 415: 'Unsupported Media Type', 416: 'Range Not Satisfiable',
    417: 'Expectation Failed', 418: "I'm a Teapot", 421: 'Misdirected Request',
    422: 'Unprocessable Entity', 423: 'Locked', 424: 'Failed Dependency', 425: 'Too Early',
    426: 'Upgrade Required', 428: 'Precondition Required', 429: 'Too Many Requests',
    431: 'Request Header Fields Too Large', 451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error', 501: 'Not Implemented', 502: 'Bad Gateway',
    503: 'Service Unavailable', 504: 'Gateway Timeout', 505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates', 507: 'Insufficient Storage', 508: 'Loop Detected',
    510: 'Not Extended', 511: 'Network Authentication Required',
};

// ===== Parser States =====

const HEADERS = 0;
const BODY_CONTENT_LENGTH = 1;
const BODY_CHUNKED = 2;
const IDLE = 3;
const AWAITING_RESPONSE = 4;

const CRLF = Buffer.from('\r\n');
const HEADER_END = Buffer.from('\r\n\r\n');

// ===== Header helpers =====

const COMMA_JOIN_HEADERS = new Set([
    'accept', 'accept-charset', 'accept-encoding', 'accept-language',
    'accept-ranges', 'access-control-allow-headers',
    'access-control-allow-methods', 'access-control-allow-origin',
    'access-control-expose-headers', 'allow', 'cache-control',
    'content-encoding', 'content-language', 'if-match', 'if-none-match',
    'link', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'vary', 'via',
    'warning',
]);

const COOKIE_HEADER = 'cookie';
const SET_COOKIE_HEADER = 'set-cookie';
const INVALID_HEADER_CHAR_REGEX = /[^\t\x20-\x7e\x80-\xff]/;

function parseHeaders(rawPairs) {
    const headers = {};
    const headersDistinct = {};
    const rawHeaders = [];

    for (let i = 0; i < rawPairs.length; i += 2) {
        const name = rawPairs[i];
        const value = rawPairs[i + 1];
        rawHeaders.push(name, value);
        const lower = name.toLowerCase();

        if (!headersDistinct[lower]) {
            headersDistinct[lower] = [];
        }
        headersDistinct[lower].push(value);

        if (lower === SET_COOKIE_HEADER) {
            if (Array.isArray(headers[lower])) {
                headers[lower].push(value);
            } else if (headers[lower] !== undefined) {
                headers[lower] = [headers[lower], value];
            } else {
                headers[lower] = [value];
            }
        } else if (lower === COOKIE_HEADER) {
            if (headers[lower] !== undefined) {
                headers[lower] += '; ' + value;
            } else {
                headers[lower] = value;
            }
        } else {
            if (headers[lower] !== undefined) {
                headers[lower] += ', ' + value;
            } else {
                headers[lower] = value;
            }
        }
    }

    return { headers, headersDistinct, rawHeaders };
}

// ===== ServerIncomingMessage (extends Readable) =====

function ServerIncomingMessage(socket, method, url, httpVersion, rawHeaderPairs) {
    if (!(this instanceof ServerIncomingMessage)) {
        return new ServerIncomingMessage(socket, method, url, httpVersion, rawHeaderPairs);
    }

    Readable.call(this, {});

    this.socket = socket;
    this.connection = socket;
    this.method = method;
    this.url = url;
    this.httpVersion = httpVersion;

    const parts = httpVersion.split('.');
    this.httpVersionMajor = parseInt(parts[0], 10) || 1;
    this.httpVersionMinor = parseInt(parts[1], 10) || 1;

    const parsed = parseHeaders(rawHeaderPairs);
    this.headers = parsed.headers;
    this.headersDistinct = parsed.headersDistinct;
    this.rawHeaders = parsed.rawHeaders;

    this.complete = false;
    this.aborted = false;
    this.trailers = {};
    this.trailersDistinct = {};
    this._timeout = null;
}

Object.setPrototypeOf(ServerIncomingMessage.prototype, Readable.prototype);
Object.setPrototypeOf(ServerIncomingMessage, Readable);

ServerIncomingMessage.prototype._read = function _read() {
    // no-op: parser pushes data via this.push()
};

ServerIncomingMessage.prototype.setTimeout = function setTimeout(ms, cb) {
    this._timeout = ms;
    if (cb) this.once('timeout', cb);
    return this;
};

// ===== Status code validation =====

function _validateStatusCode(statusCode) {
    if (statusCode === undefined) {
        const err = new RangeError('Invalid status code: undefined');
        err.code = 'ERR_HTTP_INVALID_STATUS_CODE';
        throw err;
    }
    if (typeof statusCode === 'string') {
        // Try parsing as integer
        const parsed = parseInt(statusCode, 10);
        if (isNaN(parsed) || String(parsed) !== statusCode || parsed < 100 || parsed > 999) {
            const err = new RangeError('Invalid status code: ' + statusCode);
            err.code = 'ERR_HTTP_INVALID_STATUS_CODE';
            throw err;
        }
        return parsed;
    }
    if (typeof statusCode !== 'number' || !Number.isFinite(statusCode) || statusCode < 100 || statusCode > 999 || statusCode !== (statusCode | 0)) {
        const code = typeof statusCode === 'number' ? String(statusCode) :
            (typeof statusCode === 'object' && statusCode !== null) ? (Array.isArray(statusCode) ? '[]' : '{}') :
            String(statusCode);
        const err = new RangeError('Invalid status code: ' + code);
        err.code = 'ERR_HTTP_INVALID_STATUS_CODE';
        throw err;
    }
    return statusCode;
}

function _validateStatusMessage(statusMessage) {
    const message = String(statusMessage);
    if (INVALID_HEADER_CHAR_REGEX.test(message)) {
        const err = new TypeError('Invalid character in statusMessage');
        err.code = 'ERR_INVALID_CHAR';
        throw err;
    }
    return message;
}

// ===== ServerResponse =====

function ServerResponse(req) {
    if (!(this instanceof ServerResponse)) return new ServerResponse(req);
    EventEmitter.call(this);

    this.req = req;
    this.socket = req.socket;
    this.connection = req.socket;
    this.statusCode = 200;
    this.statusMessage = undefined;
    this.sendDate = true;
    this.headersSent = false;
    this.finished = false;
    this._writableEnded = false;
    this._headers = {};
    this._headerNames = {};
    this._chunked = false;
    this._hasBody = true;
    this._keepAlive = false;
    this._sentContentLength = false;
    this._headersSentWire = false;
}

Object.setPrototypeOf(ServerResponse.prototype, EventEmitter.prototype);
Object.setPrototypeOf(ServerResponse, EventEmitter);

Object.defineProperty(ServerResponse.prototype, 'writableEnded', {
    get() { return this._writableEnded; },
});

Object.defineProperty(ServerResponse.prototype, 'writableFinished', {
    get() { return this.finished; },
});

ServerResponse.prototype.setHeader = function setHeader(name, value) {
    if (this._headersSentWire) {
        throw new Error('Cannot set headers after they are sent to the client');
    }
    if (typeof name !== 'string' || !/^[\x21-\x7e]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token ["${String(name)}"]`);
        err.code = 'ERR_INVALID_HTTP_TOKEN';
        throw err;
    }
    if (value === undefined) {
        const err = new TypeError(`Invalid value "${value}" for header "${name}"`);
        err.code = 'ERR_HTTP_INVALID_HEADER_VALUE';
        throw err;
    }
    if (INVALID_HEADER_CHAR_REGEX.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        err.code = 'ERR_INVALID_CHAR';
        throw err;
    }
    const lower = name.toLowerCase();
    this._headers[lower] = value;
    this._headerNames[lower] = name;
    return this;
};

ServerResponse.prototype.getHeader = function getHeader(name) {
    return this._headers[name.toLowerCase()];
};

ServerResponse.prototype.hasHeader = function hasHeader(name) {
    return name.toLowerCase() in this._headers;
};

ServerResponse.prototype.removeHeader = function removeHeader(name) {
    if (this._headersSentWire) {
        throw new Error('Cannot remove headers after they are sent to the client');
    }
    const lower = name.toLowerCase();
    if (lower === 'date') {
        // Match Node.js behavior: removing Date disables automatic Date generation.
        this.sendDate = false;
    }
    delete this._headers[lower];
    delete this._headerNames[lower];
};

ServerResponse.prototype.getHeaders = function getHeaders() {
    const result = {};
    for (const lower of Object.keys(this._headers)) {
        result[lower] = this._headers[lower];
    }
    return result;
};

ServerResponse.prototype.getHeaderNames = function getHeaderNames() {
    return Object.keys(this._headers);
};

ServerResponse.prototype.getRawHeaderNames = function getRawHeaderNames() {
    return Object.keys(this._headerNames).map(k => this._headerNames[k]);
};

ServerResponse.prototype.writeHead = function writeHead(statusCode, statusMessage, headers) {
    if (this.headersSent) {
        const err = new Error('Cannot render headers after they are sent to the client');
        err.code = 'ERR_HTTP_HEADERS_SENT';
        throw err;
    }

    if (typeof statusMessage === 'object' && statusMessage !== null) {
        headers = statusMessage;
        statusMessage = undefined;
    }

    // Validate status code
    statusCode = _validateStatusCode(statusCode);

    this.statusCode = statusCode;
    if (statusMessage !== undefined) {
        this.statusMessage = _validateStatusMessage(statusMessage);
    } else if (this.statusMessage === undefined) {
        this.statusMessage = STATUS_CODES[statusCode] || 'unknown';
    } else {
        this.statusMessage = _validateStatusMessage(this.statusMessage);
    }

    if (headers) {
        if (Array.isArray(headers)) {
            // Support both flat [k, v, k, v] and nested [[k, v], [k, v]] formats
            if (headers.length > 0 && Array.isArray(headers[0])) {
                for (let i = 0; i < headers.length; i++) {
                    const name = headers[i][0];
                    const value = headers[i][1];
                    const lower = name.toLowerCase();
                    // For duplicate headers (e.g., set-cookie), accumulate into array
                    if (lower in this._headers) {
                        const existing = this._headers[lower];
                        if (Array.isArray(existing)) {
                            existing.push(value);
                        } else {
                            this._headers[lower] = [existing, value];
                        }
                    } else {
                        this._headers[lower] = value;
                        this._headerNames[lower] = name;
                    }
                }
            } else {
                if (headers.length % 2 !== 0) {
                    const err = new TypeError(
                        'The argument \'headers\' is invalid. Received ' + JSON.stringify(headers)
                    );
                    err.code = 'ERR_INVALID_ARG_VALUE';
                    throw err;
                }

                // Match Node.js writeHead(array) semantics:
                // 1) remove existing values for names present in the array,
                // 2) append array values in order while preserving duplicates.
                for (let i = 0; i < headers.length; i += 2) {
                    this.removeHeader(headers[i]);
                }

                for (let i = 0; i < headers.length; i += 2) {
                    const name = headers[i];
                    const value = headers[i + 1];
                    const lower = String(name).toLowerCase();

                    if (lower in this._headers) {
                        const existing = this._headers[lower];
                        const merged = Array.isArray(existing)
                            ? [...existing, value]
                            : [existing, value];
                        this.setHeader(name, merged);
                    } else {
                        this.setHeader(name, value);
                    }
                }
            }
        } else {
            for (const name of Object.keys(headers)) {
                this.setHeader(name, headers[name]);
            }
        }
    }

    this.headersSent = true;
    return this;
};

ServerResponse.prototype._sendHeaders = function _sendHeaders() {
    if (this._headersSentWire) return;
    this._headersSentWire = true;
    this.headersSent = true;

    const statusMessage = _validateStatusMessage(
        this.statusMessage || STATUS_CODES[this.statusCode] || 'Unknown',
    );
    const httpVersion = this.req.httpVersion || '1.1';
    let head = 'HTTP/' + httpVersion + ' ' + this.statusCode + ' ' + statusMessage + '\r\n';

    const code = this.statusCode;
    const isHeadRequest = this.req.method === 'HEAD';
    const isNoBodyStatus = code === 204 || code === 304 || (code >= 100 && code < 200);
    this._hasBody = !(isNoBodyStatus || isHeadRequest);

    if (this.sendDate && !this.hasHeader('date')) {
        head += 'Date: ' + (new Date()).toUTCString() + '\r\n';
    }

    if (isNoBodyStatus) {
        // 1xx, 204, 304: no Transfer-Encoding or Content-Length
        if (this.hasHeader('transfer-encoding')) {
            const te = String(this.getHeader('transfer-encoding')).toLowerCase();
            this._chunked = te === 'chunked';
        }
    } else if (this.hasHeader('content-length')) {
        this._sentContentLength = true;
        // User set Content-Length explicitly: don't add chunked
        if (this.hasHeader('transfer-encoding')) {
            const te = String(this.getHeader('transfer-encoding')).toLowerCase();
            this._chunked = te === 'chunked';
        }
    } else if (this.hasHeader('transfer-encoding')) {
        const te = String(this.getHeader('transfer-encoding')).toLowerCase();
        this._chunked = te === 'chunked';
    } else if (!isHeadRequest) {
        // Neither Content-Length nor Transfer-Encoding set, body expected
        if (httpVersion === '1.1') {
            this._chunked = true;
            head += 'Transfer-Encoding: chunked\r\n';
        }
    }

    // Connection header
    if (!this.hasHeader('connection')) {
        if (this._keepAlive) {
            head += 'Connection: keep-alive\r\n';
        } else {
            head += 'Connection: close\r\n';
        }
    }

    for (const lower of Object.keys(this._headers)) {
        const name = this._headerNames[lower] || lower;
        const value = this._headers[lower];
        if (Array.isArray(value)) {
            for (const v of value) {
                head += name + ': ' + v + '\r\n';
            }
        } else {
            head += name + ': ' + value + '\r\n';
        }
    }

    head += '\r\n';
    this.socket.write(Buffer.from(head));
};

ServerResponse.prototype.write = function write(chunk, encoding, cb) {
    if (typeof encoding === 'function') {
        cb = encoding;
        encoding = undefined;
    }

    if (!this._headersSentWire) {
        this._sendHeaders();
    }

    if (!this._hasBody) {
        if (typeof cb === 'function') cb();
        return true;
    }

    if (typeof chunk === 'string') {
        chunk = Buffer.from(chunk, encoding || 'utf8');
    } else if (!(chunk instanceof Buffer)) {
        chunk = Buffer.from(chunk);
    }

    if (this._chunked) {
        const hex = chunk.length.toString(16);
        this.socket.write(Buffer.from(hex + '\r\n'));
        this.socket.write(chunk);
        this.socket.write(CRLF);
    } else {
        this.socket.write(chunk);
    }

    if (typeof cb === 'function') cb();
    return true;
};

ServerResponse.prototype.end = function end(data, encoding, cb) {
    if (typeof data === 'function') {
        cb = data;
        data = undefined;
        encoding = undefined;
    } else if (typeof encoding === 'function') {
        cb = encoding;
        encoding = undefined;
    }

    if (this._writableEnded) {
        if (typeof cb === 'function') cb();
        return this;
    }
    this._writableEnded = true;

    if (!this._headersSentWire) {
        if (data && !this.hasHeader('content-length') && !this.hasHeader('transfer-encoding')) {
            const body = typeof data === 'string' ? Buffer.from(data, encoding || 'utf8') : Buffer.from(data);
            this.setHeader('Content-Length', body.length);
            this._sendHeaders();
            if (this._hasBody) {
                this.socket.write(body);
            }
        } else {
            if (!data && !this.hasHeader('content-length') && !this.hasHeader('transfer-encoding')) {
                this.setHeader('Content-Length', 0);
            }
            this._sendHeaders();
            if (data) {
                this.write(data, encoding);
            }
        }
    } else {
        if (data) {
            this.write(data, encoding);
        }
    }

    if (this._chunked && this._hasBody) {
        this.socket.write(Buffer.from('0\r\n\r\n'));
    }

    this.finished = true;

    if (typeof cb === 'function') cb();

    this.emit('finish');

    return this;
};

ServerResponse.prototype.flushHeaders = function flushHeaders() {
    if (!this._headersSentWire) {
        this._sendHeaders();
    }
};

ServerResponse.prototype._writeRaw = function _writeRaw(data, encoding, callback) {
    if (typeof encoding === 'function') {
        callback = encoding;
        encoding = undefined;
    }

    if (!this.socket || this.socket.destroyed) {
        if (typeof callback === 'function') {
            callback(new Error('Socket is closed'));
        }
        return false;
    }

    let chunk;
    if (typeof data === 'string') {
        chunk = Buffer.from(data, encoding || 'latin1');
    } else if (data instanceof Buffer) {
        chunk = data;
    } else if (data instanceof Uint8Array) {
        chunk = Buffer.from(data);
    } else {
        chunk = Buffer.from(String(data), encoding || 'latin1');
    }

    if (typeof callback === 'function') {
        return this.socket.write(chunk, callback);
    }
    return this.socket.write(chunk);
};

ServerResponse.prototype.writeContinue = function writeContinue() {
    this.socket.write(Buffer.from('HTTP/1.1 100 Continue\r\n\r\n'));
};

ServerResponse.prototype.addTrailers = function addTrailers() {
    // stub
};

ServerResponse.prototype.setTimeout = function setTimeout(ms, cb) {
    if (cb) this.once('timeout', cb);
    return this;
};

ServerResponse.prototype.destroy = function destroy(err) {
    if (this.socket) this.socket.destroy(err);
    return this;
};

ServerResponse.prototype.cork = function cork() {
    if (this.socket && this.socket.cork) this.socket.cork();
};

ServerResponse.prototype.uncork = function uncork() {
    if (this.socket && this.socket.uncork) this.socket.uncork();
};

// ===== HTTP Parser =====

function createConnectionParser(server, socket) {
    const state = {
        buffer: Buffer.alloc(0),
        state: IDLE,
        socket: socket,
        req: null,
        res: null,
        contentLength: 0,
        bodyReceived: 0,
        chunkState: null,
        readableEnded: false,
        closeAfterResponse: false,
        responseFinished: false,
        shouldKeepAliveAfterResponse: false,
    };

    const keepAlive = computeKeepAlive(null, '1.1');

    // Install a single timeout handler for idle keep-alive connections
    socket.on('timeout', function onIdleTimeout() {
        const handled = server.emit('timeout', socket);
        if (!handled) {
            socket.destroy();
        }
    });

    socket.on('data', function onData(data) {
        if (typeof data === 'string') {
            data = Buffer.from(data);
        } else if (!(data instanceof Buffer)) {
            data = Buffer.from(data);
        }

        // Clear idle keep-alive timeout on new data
        socket.setTimeout(0);

        state.buffer = Buffer.concat([state.buffer, data]);
        parseLoop();

        // Track active request inactivity via server.setTimeout().
        // Keep-alive idle timeout remains managed after responses finish.
        if (state.res && !state.responseFinished) {
            socket.setTimeout(server.timeout || 0);
        }
    });

    socket.on('end', function onEnd() {
        state.readableEnded = true;

        if (state.req && !state.req.complete) {
            state.req.complete = true;
            state.req.aborted = true;
            state.req.emit('aborted');
            state.req.push(null);
        }

        if (!server.httpAllowHalfOpen) {
            socket.end();
            return;
        }

        const hasPendingResponse = state.res !== null;
        const hasBufferedRequests = state.buffer.length > 0;
        if (hasPendingResponse || hasBufferedRequests) {
            state.closeAfterResponse = true;
            if (!hasPendingResponse && state.state === IDLE && hasBufferedRequests) {
                parseLoop();
            }
            return;
        }

        socket.end();
    });

    socket.on('error', function onError(err) {
        if (state.req && !state.req.complete) {
            state.req.complete = true;
            state.req.aborted = true;
            state.req.emit('aborted');
            state.req.push(null);
            state.req.emit('error', err);
        }
    });

    socket.on('close', function onClose() {
        if (state.req && !state.req.complete) {
            state.req.complete = true;
            state.req.aborted = true;
            state.req.emit('aborted');
            state.req.push(null);
        }
        if (state.res) {
            state.res.emit('close');
        }
    });

    function maybeFinalizeResponse() {
        if (!state.responseFinished) {
            return false;
        }

        if (state.req && !state.req.complete) {
            return false;
        }

        const shouldKeepAlive = state.shouldKeepAliveAfterResponse;
        state.responseFinished = false;
        state.shouldKeepAliveAfterResponse = false;
        state.req = null;
        state.res = null;
        state.state = IDLE;

        if (!shouldKeepAlive) {
            socket.end();
            return true;
        }

        if (state.buffer.length > 0) {
            parseLoop();
            return true;
        }

        if (state.readableEnded && state.closeAfterResponse) {
            socket.end();
            return true;
        }

        // Set idle timeout for keep-alive connections
        socket.setTimeout(server.keepAliveTimeout || 5000);
        return true;
    }

    function parseLoop() {
        let progress = true;
        while (progress) {
            progress = false;

            if (state.state === IDLE || state.state === HEADERS) {
                state.state = HEADERS;
                const idx = bufferIndexOf(state.buffer, HEADER_END);
                if (idx === -1) continue;

                const headerBlock = state.buffer.slice(0, idx).toString('utf8');
                state.buffer = state.buffer.slice(idx + 4);

                const parsed = parseRequestHeaders(headerBlock);
                if (!parsed) {
                    server.emit('clientError', new Error('HPE_INVALID_REQUEST'), socket);
                    socket.write(Buffer.from('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'));
                    socket.end();
                    return;
                }

                const req = new ServerIncomingMessage(
                    socket,
                    parsed.method,
                    parsed.url,
                    parsed.httpVersion,
                    parsed.rawHeaders,
                );

                const connKeepAlive = computeKeepAlive(req.headers.connection, parsed.httpVersion);
                const res = new ServerResponse(req);
                res._keepAlive = connKeepAlive;

                state.req = req;
                state.res = res;
                state.responseFinished = false;
                state.shouldKeepAliveAfterResponse = false;

                // Set up finish handler for request sequencing
                res.on('finish', function onFinish() {
                    state.responseFinished = true;
                    state.shouldKeepAliveAfterResponse = res._keepAlive && !server._closeRequested;
                    maybeFinalizeResponse();
                });

                const cl = req.headers['content-length'];
                const te = req.headers['transfer-encoding'];
                let requestHasNoBody = false;

                if (te && te.toLowerCase().indexOf('chunked') !== -1) {
                    state.state = BODY_CHUNKED;
                    state.chunkState = 'SIZE';
                    state.contentLength = 0;
                } else if (cl !== undefined && cl !== '0') {
                    state.contentLength = parseInt(cl, 10);
                    state.bodyReceived = 0;
                    if (isNaN(state.contentLength) || state.contentLength < 0) {
                        server.emit('clientError', new Error('HPE_INVALID_CONTENT_LENGTH'), socket);
                        socket.write(Buffer.from('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'));
                        socket.end();
                        return;
                    }
                    state.state = BODY_CONTENT_LENGTH;
                } else {
                    // No body
                    req.complete = true;
                    requestHasNoBody = true;
                    // Keep parsing pipelined requests even if earlier responses
                    // have not finished yet.
                    state.state = IDLE;
                }

                server.emit('request', req, res);
                if (requestHasNoBody) {
                    // Emit EOF after request handlers had a chance to attach `end` listeners.
                    Promise.resolve().then(function () {
                        req.push(null);
                    });
                }
                progress = true;
                continue;
            }

            if (state.state === BODY_CONTENT_LENGTH) {
                if (state.buffer.length === 0) continue;
                const remaining = state.contentLength - state.bodyReceived;
                const available = Math.min(state.buffer.length, remaining);
                const chunk = state.buffer.slice(0, available);
                state.buffer = state.buffer.slice(available);
                state.bodyReceived += available;
                state.req.push(chunk);

                if (state.bodyReceived >= state.contentLength) {
                    state.req.complete = true;
                    state.req.push(null);
                    state.state = AWAITING_RESPONSE;
                    maybeFinalizeResponse();
                }
                progress = true;
                continue;
            }

            if (state.state === BODY_CHUNKED) {
                const result = parseChunked(state);
                if (result === 'progress') {
                    progress = true;
                } else if (result === 'done') {
                    state.req.complete = true;
                    state.req.push(null);
                    state.state = AWAITING_RESPONSE;
                    maybeFinalizeResponse();
                    progress = true;
                } else if (result === 'error') {
                    server.emit('clientError', new Error('HPE_INVALID_CHUNK'), socket);
                    socket.write(Buffer.from('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'));
                    socket.end();
                    return;
                }
                continue;
            }
        }
    }

    return state;
}

function parseChunked(state) {
    while (true) {
        if (state.chunkState === 'SIZE') {
            const idx = bufferIndexOf(state.buffer, CRLF);
            if (idx === -1) return 'need-data';
            const sizeLine = state.buffer.slice(0, idx).toString('utf8').trim();
            const semicolonIdx = sizeLine.indexOf(';');
            const sizeStr = semicolonIdx !== -1 ? sizeLine.substring(0, semicolonIdx) : sizeLine;
            const size = parseInt(sizeStr, 16);
            if (isNaN(size)) return 'error';
            state.buffer = state.buffer.slice(idx + 2);
            if (size === 0) {
                // Consume trailing \r\n after final chunk
                const trailIdx = bufferIndexOf(state.buffer, CRLF);
                if (trailIdx === 0) {
                    state.buffer = state.buffer.slice(2);
                }
                return 'done';
            }
            state.contentLength = size;
            state.bodyReceived = 0;
            state.chunkState = 'DATA';
            continue;
        }

        if (state.chunkState === 'DATA') {
            const remaining = state.contentLength - state.bodyReceived;
            if (state.buffer.length === 0 || remaining === 0) {
                if (remaining === 0) {
                    state.chunkState = 'TRAILER';
                    continue;
                }
                return 'need-data';
            }
            const available = Math.min(state.buffer.length, remaining);
            const chunk = state.buffer.slice(0, available);
            state.buffer = state.buffer.slice(available);
            state.bodyReceived += available;
            state.req.push(chunk);
            if (state.bodyReceived >= state.contentLength) {
                state.chunkState = 'TRAILER';
            }
            return 'progress';
        }

        if (state.chunkState === 'TRAILER') {
            if (state.buffer.length < 2) return 'need-data';
            if (state.buffer[0] === 0x0d && state.buffer[1] === 0x0a) {
                state.buffer = state.buffer.slice(2);
                state.chunkState = 'SIZE';
                continue;
            }
            return 'error';
        }

        return 'need-data';
    }
}

function bufferIndexOf(buf, search) {
    if (buf.length < search.length) return -1;
    outer: for (let i = 0; i <= buf.length - search.length; i++) {
        for (let j = 0; j < search.length; j++) {
            if (buf[i + j] !== search[j]) continue outer;
        }
        return i;
    }
    return -1;
}

function parseRequestHeaders(block) {
    const lines = block.split('\r\n');
    if (lines.length === 0) return null;

    // Be tolerant to extra CRLFs between pipelined requests.
    // Node's parser ignores these blank prefixed lines instead of treating
    // them as malformed request lines.
    let requestLineIndex = 0;
    while (requestLineIndex < lines.length && lines[requestLineIndex] === '') {
        requestLineIndex++;
    }

    if (requestLineIndex >= lines.length) return null;

    const requestLine = lines[requestLineIndex];
    const parts = requestLine.split(' ');
    if (parts.length < 2) return null;

    const method = parts[0];
    const url = parts[1];
    let httpVersion = '1.1';
    if (parts.length >= 3) {
        const versionStr = parts[2];
        if (versionStr.startsWith('HTTP/')) {
            httpVersion = versionStr.substring(5);
        }
    }

    const rawHeaders = [];
    for (let i = requestLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.length === 0) continue;
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const name = line.substring(0, colonIdx);
        const value = line.substring(colonIdx + 1).trim();
        rawHeaders.push(name, value);
    }

    return { method, url, httpVersion, rawHeaders };
}

function computeKeepAlive(connectionHeader, httpVersion) {
    if (connectionHeader) {
        const tokens = connectionHeader.toLowerCase().split(',').map(t => t.trim());
        if (tokens.includes('close')) return false;
        if (tokens.includes('keep-alive')) return true;
    }
    return httpVersion === '1.1';
}

// ===== HTTP Server (extends net.Server) =====

function Server(options, requestListener) {
    if (!(this instanceof Server)) return new Server(options, requestListener);

    if (typeof options === 'function') {
        requestListener = options;
        options = {};
    } else if (options != null && (typeof options !== 'object' || Array.isArray(options))) {
        let received;
        if (Array.isArray(options)) {
            received = ` Received an instance of Array`;
        } else {
            received = ` Received type ${typeof options} (${String(options)})`;
        }
        const err = new TypeError(
            'The "options" argument must be of type object.' + received
        );
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    options = options || {};

    NetServer.call(this, {
        ...options,
        allowHalfOpen: true,
        noDelay: options.noDelay ?? true,
    });

    this.timeout = 0;
    this.keepAliveTimeout = 5000;
    this.httpAllowHalfOpen = false;
    this.maxHeadersCount = null;
    this.headersTimeout = 60000;
    this.requestTimeout = 0;
    this.maxRequestsPerSocket = 0;
    this._httpConnections = new Set();

    if (requestListener) {
        this.on('request', requestListener);
    }

    const self = this;
    this.on('connection', function connectionListener(socket) {
        // Force-close idle connections to prevent WASI resource exhaustion.
        // In WASM, each socket consumes limited resources (pollables, streams),
        // and wasi:http clients create new connections per request.
        for (const conn of self._httpConnections) {
            if (conn.state === IDLE && conn.socket && !conn.socket.destroyed) {
                // Use force_close on the native handle to immediately release
                // WASI resources, even if async poll loops hold pollables.
                if (conn.socket._handle && conn.socket._handle.force_close) {
                    conn.socket._handle.force_close();
                }
                conn.socket.destroy();
            }
        }
        const connState = createConnectionParser(self, socket);
        self._httpConnections.add(connState);
        socket.on('close', function () {
            self._httpConnections.delete(connState);
        });
    });
}

Object.setPrototypeOf(Server.prototype, NetServer.prototype);
Object.setPrototypeOf(Server, NetServer);

Server.prototype.setTimeout = function setTimeout(ms, cb) {
    this.timeout = ms;
    if (cb) this.on('timeout', cb);
    return this;
};

Server.prototype.close = function close(cb) {
    this._closeRequested = true;
    const result = NetServer.prototype.close.call(this, cb);
    // Defer idle connection cleanup to allow in-flight responses to complete
    const self = this;
    Promise.resolve().then(function () {
        self.closeIdleConnections();
    });
    return result;
};

Server.prototype.closeAllConnections = function closeAllConnections() {
    for (const conn of this._httpConnections) {
        if (conn.socket && !conn.socket.destroyed) {
            conn.socket.destroy();
        }
    }
    this._httpConnections.clear();
};

Server.prototype.closeIdleConnections = function closeIdleConnections() {
    for (const conn of this._httpConnections) {
        if (conn.state === IDLE && conn.socket && !conn.socket.destroyed) {
            conn.socket.destroy();
        }
    }
};

// ===== createServer =====

export function createServer(options, requestListener) {
    return new Server(options, requestListener);
}

export { Server, ServerResponse, ServerIncomingMessage };
export default { Server, ServerResponse, ServerIncomingMessage, createServer };
