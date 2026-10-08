export function initializeIncomingMessage(message, socket) {
    message.complete = false;
    message.socket = socket;
    message.connection = socket;
    message.client = socket;
    message.trailers = {};
    Object.defineProperties(message, {
        _trailersDistinct: {
            configurable: true,
            writable: true,
            value: undefined,
        },
        _pendingTrailersDistinct: {
            configurable: true,
            writable: true,
            value: Object.create(null),
        },
    });
    Object.defineProperty(message, 'trailersDistinct', {
        configurable: true,
        enumerable: true,
        get() {
            if (this._trailersDistinct === undefined) {
                this._trailersDistinct = this._pendingTrailersDistinct;
            }
            return this._trailersDistinct;
        },
        set(value) {
            this._trailersDistinct = value;
        },
    });
    message.rawTrailers = [];
    message.aborted = false;
    message._consuming = false;
    message._dumped = false;
    message._timeout = null;
}
