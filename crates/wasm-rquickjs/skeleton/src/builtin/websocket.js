// Browser-standard WebSocket API implemented on top of golem:websocket/client WIT interface.
// The native module bridges rquickjs to golem_rust::bindings::golem::websocket::client,
// which is always available when the golem feature is enabled.
import { ws_connect } from '__wasm_rquickjs_builtin/websocket_native';

// readyState constants
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

// Default poll interval for the receive loop (ms)
const POLL_INTERVAL_MS = 50;

// Compute the byte length of a UTF-8 encoded string
function utf8ByteLength(str) {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code <= 0x7f) {
            len += 1;
        } else if (code <= 0x7ff) {
            len += 2;
        } else if (code >= 0xd800 && code <= 0xdbff) {
            // Surrogate pair — 4 bytes for the full code point
            len += 4;
            i++; // skip low surrogate
        } else {
            len += 3;
        }
    }
    return len;
}

// Normalize URL scheme: http:// → ws://, https:// → wss://
function normalizeWebSocketUrl(url) {
    if (url.startsWith('http://')) {
        return 'ws://' + url.slice(7);
    }
    if (url.startsWith('https://')) {
        return 'wss://' + url.slice(8);
    }
    return url;
}

class MessageEvent {
    constructor(type, data, origin) {
        this.type = type;
        this.data = data;
        this.origin = origin || '';
        this.lastEventId = '';
        this.source = null;
        this.ports = [];
    }
}

class CloseEvent {
    constructor(code, reason, wasClean) {
        this.type = 'close';
        this.code = code;
        this.reason = reason;
        this.wasClean = wasClean;
    }
}

class ErrorEvent {
    constructor(message) {
        this.type = 'error';
        this.message = message || '';
    }
}

class WebSocket {
    static CONNECTING = CONNECTING;
    static OPEN = OPEN;
    static CLOSING = CLOSING;
    static CLOSED = CLOSED;

    constructor(url, protocols) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to construct 'WebSocket': 1 argument required, but only 0 present.");
        }

        // Validate and normalize URL
        if (typeof url !== 'string') {
            url = String(url);
        }

        // Check for URL fragments — not allowed per spec
        if (url.indexOf('#') !== -1) {
            throw new DOMException(
                "Failed to construct 'WebSocket': The URL '" + url + "' contains a fragment identifier.",
                'SyntaxError'
            );
        }

        // Normalize http/https to ws/wss per spec
        url = normalizeWebSocketUrl(url);

        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
            throw new DOMException(
                "Failed to construct 'WebSocket': The URL's scheme must be either 'ws', 'wss', 'http', or 'https'. '" + url + "' is not allowed.",
                'SyntaxError'
            );
        }
        this._url = url;

        // Normalize protocols
        if (protocols === undefined || protocols === null) {
            this._protocols = [];
        } else if (typeof protocols === 'string') {
            this._protocols = [protocols];
        } else if (Array.isArray(protocols)) {
            this._protocols = protocols.slice();
        } else {
            this._protocols = [String(protocols)];
        }

        // Check for duplicate protocols per spec
        const seen = new Set();
        for (const p of this._protocols) {
            if (seen.has(p)) {
                throw new DOMException(
                    "Failed to construct 'WebSocket': The subprotocol '" + p + "' is duplicated.",
                    'SyntaxError'
                );
            }
            seen.add(p);
        }

        this._readyState = CONNECTING;
        this._binaryType = 'blob';
        this._bufferedAmount = 0;
        this._extensions = '';
        this._protocol = '';
        this._connection = null;

        // Event handlers
        this._onopen = null;
        this._onmessage = null;
        this._onerror = null;
        this._onclose = null;
        this._listeners = {};

        // Receive loop control
        this._receiveLoopRunning = false;

        // Connect asynchronously (per spec, constructor returns immediately)
        this._connectAsync();
    }

    _connectAsync() {
        Promise.resolve().then(() => {
            try {
                this._connection = ws_connect(this._url, this._protocols);
                this._readyState = OPEN;
                if (this._protocols.length > 0) {
                    this._protocol = this._protocols[0];
                }
                this._dispatch('open', { type: 'open' });
                this._startReceiveLoop();
            } catch (e) {
                this._readyState = CLOSED;
                this._dispatch('error', new ErrorEvent(e.message || String(e)));
                this._dispatch('close', new CloseEvent(1006, '', false));
            }
        });
    }

    _startReceiveLoop() {
        if (this._receiveLoopRunning) return;
        this._receiveLoopRunning = true;

        const poll = () => {
            if (this._readyState !== OPEN || !this._connection) {
                this._receiveLoopRunning = false;
                return;
            }

            try {
                // Native module returns [type, data] arrays:
                //   ["text", string]
                //   ["binary", ArrayBuffer]
                //   ["timeout", null]
                //   ["closed", { code, reason }]
                //   ["error", string]
                const result = this._connection.receive_with_timeout(POLL_INTERVAL_MS);
                const [type, data] = result;

                if (type === 'text') {
                    this._dispatch('message', new MessageEvent('message', data, this._url));
                    Promise.resolve().then(poll);
                } else if (type === 'binary') {
                    // Always deliver as ArrayBuffer; Blob is not available in QuickJS.
                    this._dispatch('message', new MessageEvent('message', data, this._url));
                    Promise.resolve().then(poll);
                } else if (type === 'timeout') {
                    // No message yet, continue polling
                    Promise.resolve().then(poll);
                } else if (type === 'closed') {
                    this._receiveLoopRunning = false;
                    if (this._readyState !== CLOSED) {
                        this._readyState = CLOSED;
                        const code = (data && data.code) || 1000;
                        const reason = (data && data.reason) || '';
                        this._dispatch('close', new CloseEvent(code, reason, true));
                    }
                } else if (type === 'error') {
                    this._receiveLoopRunning = false;
                    if (this._readyState !== CLOSED) {
                        this._readyState = CLOSED;
                        this._dispatch('error', new ErrorEvent(data || 'Unknown error'));
                        this._dispatch('close', new CloseEvent(1006, '', false));
                    }
                }
            } catch (e) {
                this._receiveLoopRunning = false;
                if (this._readyState !== CLOSED) {
                    this._readyState = CLOSED;
                    this._dispatch('error', new ErrorEvent(e.message || String(e)));
                    this._dispatch('close', new CloseEvent(1006, '', false));
                }
            }
        };

        Promise.resolve().then(poll);
    }

    get url() { return this._url; }
    get readyState() { return this._readyState; }
    get bufferedAmount() { return this._bufferedAmount; }
    get extensions() { return this._extensions; }
    get protocol() { return this._protocol; }

    get binaryType() { return this._binaryType; }
    set binaryType(value) {
        if (value === 'blob' || value === 'arraybuffer') {
            this._binaryType = value;
        }
    }

    get onopen() { return this._onopen; }
    set onopen(fn) { this._onopen = typeof fn === 'function' ? fn : null; }

    get onmessage() { return this._onmessage; }
    set onmessage(fn) { this._onmessage = typeof fn === 'function' ? fn : null; }

    get onerror() { return this._onerror; }
    set onerror(fn) { this._onerror = typeof fn === 'function' ? fn : null; }

    get onclose() { return this._onclose; }
    set onclose(fn) { this._onclose = typeof fn === 'function' ? fn : null; }

    send(data) {
        if (this._readyState === CONNECTING) {
            throw new DOMException(
                "Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.",
                'InvalidStateError'
            );
        }
        if (this._readyState !== OPEN) {
            return;
        }

        try {
            if (typeof data === 'string') {
                this._bufferedAmount += utf8ByteLength(data);
                this._connection.send_text(data);
                this._bufferedAmount = 0;
            } else if (data instanceof ArrayBuffer) {
                this._bufferedAmount += data.byteLength;
                this._connection.send_binary(new Uint8Array(data));
                this._bufferedAmount = 0;
            } else if (ArrayBuffer.isView(data)) {
                this._bufferedAmount += data.byteLength;
                this._connection.send_binary(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
                this._bufferedAmount = 0;
            } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
                // Blob support: read as ArrayBuffer and send as binary
                const reader = new FileReader();
                reader.onload = () => {
                    if (this._readyState === OPEN && this._connection) {
                        try {
                            const buf = new Uint8Array(reader.result);
                            this._bufferedAmount += buf.byteLength;
                            this._connection.send_binary(buf);
                            this._bufferedAmount = 0;
                        } catch (e2) {
                            this._bufferedAmount = 0;
                            this._readyState = CLOSED;
                            this._dispatch('error', new ErrorEvent(e2.message || String(e2)));
                            this._dispatch('close', new CloseEvent(1006, '', false));
                        }
                    }
                };
                reader.readAsArrayBuffer(data);
            } else {
                // Fallback: coerce to string per spec
                const str = String(data);
                this._bufferedAmount += utf8ByteLength(str);
                this._connection.send_text(str);
                this._bufferedAmount = 0;
            }
        } catch (e) {
            this._bufferedAmount = 0;
            this._readyState = CLOSED;
            this._dispatch('error', new ErrorEvent(e.message || String(e)));
            this._dispatch('close', new CloseEvent(1006, '', false));
        }
    }

    close(code, reason) {
        if (this._readyState === CLOSING || this._readyState === CLOSED) {
            return;
        }

        if (code !== undefined && code !== null) {
            code = Number(code);
            if (code !== 1000 && (code < 3000 || code > 4999)) {
                throw new DOMException(
                    "Failed to execute 'close' on 'WebSocket': The code must be either 1000, or between 3000 and 4999. " + code + " is neither.",
                    'InvalidAccessError'
                );
            }
        }

        if (reason !== undefined && reason !== null) {
            reason = String(reason);
            if (utf8ByteLength(reason) > 123) {
                throw new DOMException(
                    "Failed to execute 'close' on 'WebSocket': The close reason must not be greater than 123 UTF-8 bytes.",
                    'SyntaxError'
                );
            }
        }

        this._readyState = CLOSING;

        try {
            if (this._connection) {
                this._connection.close(
                    code !== undefined && code !== null ? code : undefined,
                    reason !== undefined && reason !== null ? reason : undefined
                );
            }
        } catch (_) {
            // Ignore close errors
        }

        this._readyState = CLOSED;
        this._connection = null;
        this._dispatch('close', new CloseEvent(code || 1000, reason || '', true));
    }

    addEventListener(type, listener, options) {
        if (typeof listener !== 'function') return;
        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }
        // Prevent duplicate listeners with same reference (per EventTarget spec)
        if (this._listeners[type].indexOf(listener) !== -1) return;
        this._listeners[type].push(listener);
    }

    removeEventListener(type, listener) {
        if (!this._listeners[type]) return;
        this._listeners[type] = this._listeners[type].filter(l => l !== listener);
    }

    dispatchEvent(event) {
        this._dispatch(event.type, event);
        return true;
    }

    _dispatch(type, event) {
        // Call the on<type> handler
        const handler = this['_on' + type];
        if (typeof handler === 'function') {
            try { handler.call(this, event); } catch (_) {}
        }

        // Call addEventListener listeners
        const listeners = this._listeners[type];
        if (listeners) {
            for (const listener of listeners.slice()) {
                try { listener.call(this, event); } catch (_) {}
            }
        }
    }
}

// Instance-level constants on the prototype (per spec, instances also expose these)
WebSocket.prototype.CONNECTING = CONNECTING;
WebSocket.prototype.OPEN = OPEN;
WebSocket.prototype.CLOSING = CLOSING;
WebSocket.prototype.CLOSED = CLOSED;

export { WebSocket, MessageEvent, CloseEvent, ErrorEvent };
export default WebSocket;
