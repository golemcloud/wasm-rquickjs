import assert from 'assert';
import { errors } from 'undici';

export const run = () => {
    const invalidArgument = new errors.InvalidArgumentError('bad argument');
    assert.ok(invalidArgument instanceof Error);
    assert.ok(invalidArgument instanceof errors.UndiciError);
    assert.strictEqual(invalidArgument.code, 'UND_ERR_INVALID_ARG');

    const headersTimeout = new errors.HeadersTimeoutError();
    assert.strictEqual(headersTimeout.code, 'UND_ERR_HEADERS_TIMEOUT');

    const requestAborted = new errors.RequestAbortedError();
    assert.strictEqual(requestAborted.code, 'UND_ERR_ABORTED');

    const responseExceeded = new errors.ResponseExceededMaxSizeError('too big');
    assert.strictEqual(responseExceeded.code, 'UND_ERR_RES_EXCEEDED_MAX_SIZE');

    const retryError = new errors.RequestRetryError('retry', 503, {
        headers: {'retry-after': '5'},
        data: {attempt: 2}
    });
    assert.strictEqual(retryError.code, 'UND_ERR_REQ_RETRY');
    assert.strictEqual(retryError.statusCode, 503);
    assert.strictEqual(retryError.headers['retry-after'], '5');
    assert.deepStrictEqual(retryError.data, {attempt: 2});

    return 'PASS: undici errors preserve expected class hierarchy and metadata';
};
