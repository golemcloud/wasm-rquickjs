import * as http from 'node:http';
import * as https from 'node:https';
import * as net from 'node:net';
import { EventEmitter } from 'node:events';

// Test 1: http.get - use await on the _endPromise to let the runtime drive it
export async function httpGet(port) {
    console.log('node:http test 1 - http.get');

    const req = http.get(`http://localhost:${port}/todos`, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`StatusMessage: ${res.statusMessage}`);
        console.log(`HttpVersion: ${res.httpVersion}`);

        let body = '';
        res.on('data', (chunk) => {
            body += chunk.toString();
        });
        res.on('end', () => {
            console.log(`Body: ${body}`);
            console.log(`Complete: ${res.complete}`);
        });
    });

    req.on('error', (err) => {
        console.log(`Error: ${err.message}`);
    });

    await req._endPromise;
}

// Test 2: http.request POST with JSON body
export async function httpPostJson(port) {
    console.log('node:http test 2 - http.request POST');

    const postData = JSON.stringify({
        title: 'foo',
        body: 'bar',
        userId: 1,
    });

    const options = {
        hostname: 'localhost',
        port: port,
        path: '/todos',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);

        let body = '';
        res.on('data', (chunk) => {
            body += chunk.toString();
        });
        res.on('end', () => {
            const parsed = JSON.parse(body);
            console.log(`Response title: ${parsed.title}`);
            console.log(`Response userId: ${parsed.userId}`);
        });
    });

    req.on('error', (err) => {
        console.log(`Error: ${err.message}`);
    });

    req.write(postData);
    req.end();
    await req._endPromise;
}

// Test 3: http.request with custom headers and header inspection
export async function httpRequestWithHeaders(port) {
    console.log('node:http test 3 - headers');

    const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/todos',
        method: 'GET',
        headers: {
            'X-Custom-Header': 'test-value',
            'Accept': 'application/json',
        },
    }, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`content-type header: ${res.headers['content-type']}`);
        console.log(`rawHeaders length: ${res.rawHeaders.length}`);

        let body = '';
        res.on('data', (chunk) => {
            body += chunk.toString();
        });
        res.on('end', () => {
            console.log(`Body received: ${body.length > 0}`);
        });
    });

    // Test header methods
    req.setHeader('X-Another', 'value');
    console.log(`hasHeader X-Another: ${req.hasHeader('X-Another')}`);
    console.log(`getHeader X-Another: ${req.getHeader('X-Another')}`);
    req.removeHeader('X-Another');
    console.log(`hasHeader X-Another after remove: ${req.hasHeader('X-Another')}`);

    req.on('error', (err) => {
        console.log(`Error: ${err.message}`);
    });

    req.end();
    await req._endPromise;
}

// Test 5: self-connecting HTTP (server + client in same component)
export async function httpSelfConnect() {
    console.log('node:http test 5 - self-connect');

    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            console.log('Server received request');
            res.end();
        });

        server.listen(0, () => {
            const port = server.address().port;
            console.log('Server listening on port ' + port);

            const options = {
                agent: null,
                port: port
            };

            http.get(options, (res) => {
                console.log('Got response, status: ' + res.statusCode);
                res.resume();
                server.close(() => {
                    console.log('server closed');
                    resolve();
                });
            }).on('error', (err) => {
                console.log('Error: ' + err.message);
                reject(err);
            });
        });
    });
}

// Test 4: static constants and validation
export function httpConstants() {
    console.log('node:http test 4 - constants');

    // METHODS
    console.log(`METHODS is array: ${Array.isArray(http.METHODS)}`);
    console.log(`METHODS includes GET: ${http.METHODS.includes('GET')}`);
    console.log(`METHODS includes POST: ${http.METHODS.includes('POST')}`);

    // STATUS_CODES
    console.log(`STATUS_CODES[200]: ${http.STATUS_CODES[200]}`);
    console.log(`STATUS_CODES[404]: ${http.STATUS_CODES[404]}`);
    console.log(`STATUS_CODES[500]: ${http.STATUS_CODES[500]}`);

    // maxHeaderSize
    console.log(`maxHeaderSize: ${http.maxHeaderSize}`);

    // Agent
    const agent = new http.Agent({ keepAlive: true });
    console.log(`Agent keepAlive: ${agent.keepAlive}`);
    console.log(`Agent maxSockets: ${agent.maxSockets}`);
    console.log(`Agent options prototype is null: ${Object.getPrototypeOf(agent.options) === null}`);
    console.log(`Agent options has scheduling: ${Object.hasOwn(agent.options, 'scheduling')}`);
    console.log(`Agent options path is null: ${agent.options.path === null}`);
    console.log(`Agent options noDelay defaults true: ${agent.options.noDelay === true}`);
    console.log(`Agent options preserve noDelay false: ${new http.Agent({ noDelay: false }).options.noDelay === false}`);
    agent.timeout = 1234;
    console.log(`Agent timeout assignment: ${agent.timeout}`);
    console.log(`globalAgent exists: ${http.globalAgent !== null}`);

    // validateHeaderName
    try {
        http.validateHeaderName('Valid-Name');
        console.log('validateHeaderName valid: passed');
    } catch (e) {
        console.log(`validateHeaderName valid: failed - ${e.message}`);
    }

    try {
        http.validateHeaderName('Invalid Name');
        console.log('validateHeaderName invalid: should have thrown');
    } catch (e) {
        console.log('validateHeaderName invalid: correctly threw');
    }

    // createServer should work
    try {
        const server = http.createServer();
        console.log('createServer: succeeded, type: ' + (typeof server));
    } catch (e) {
        console.log('createServer: unexpectedly threw');
    }
}

// Test 6: self-connecting HTTP POST with body
export async function httpSelfConnectPost() {
    console.log('node:http test 6 - self-connect POST');

    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            console.log('Server received ' + req.method + ' request');
            let body = '';
            req.setEncoding('utf8');
            req.on('data', (chunk) => {
                console.log('Server got chunk: ' + JSON.stringify(chunk));
                body += chunk;
            });
            req.on('end', () => {
                console.log('Server body complete: ' + JSON.stringify(body));
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            });
        });

        server.listen(0, () => {
            const port = server.address().port;
            console.log('Server listening on port ' + port);

            const req = http.request({
                port: port,
                method: 'POST',
                path: '/'
            }, (res) => {
                console.log('Got response, status: ' + res.statusCode);
                let responseBody = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    console.log('Response body: ' + responseBody);
                    server.close(() => {
                        console.log('server closed');
                        resolve();
                    });
                });
            });

            req.on('error', (err) => {
                console.log('Client error: ' + err.message);
                reject(err);
            });

            req.write('hello');
            req.end();
        });
    });
}

export async function httpAbortIsolation() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            const userHeaderPreserved =
                req.headers['x-wasm-rquickjs-internal-request-id'] === 'user-value';
            const unrelated = http.request({
                hostname: 'remote.example',
                port: server.address().port,
                path: '/unrelated',
            });
            unrelated.on('error', () => {});
            unrelated.destroy(new Error('intentional remote abort'));

            setImmediate(() => {
                if (!res.destroyed && userHeaderPreserved) {
                    res.end('ok');
                }
            });
        });
        let rawRequest = '';
        server.on('connection', (socket) => {
            socket.on('data', (chunk) => {
                rawRequest += chunk.toString();
            });
        });

        server.listen(0, () => {
            const req = http.get({
                hostname: '127.0.0.1',
                port: server.address().port,
                headers: {
                    'x-wasm-rquickjs-internal-request-id': 'user-value',
                },
            }, (res) => {
                res.resume();
                res.on('end', () => {
                    const hasUserHeader =
                        /x-wasm-rquickjs-internal-request-id: user-value/i.test(rawRequest);
                    const hasInjectedHeader =
                        /x-wasm-rquickjs-internal-request-id-[^:]*:/i.test(rawRequest);
                    server.close(() => resolve(hasUserHeader && !hasInjectedHeader));
                });
            });
            req.on('error', () => server.close(() => resolve(false)));
        });
    });
}

export function httpResponseLifecycle() {
    const request = {
        method: 'GET',
        httpVersionMajor: 1,
        httpVersionMinor: 1,
        socket: null,
    };
    const response = new http.ServerResponse(request);
    const order = [];
    response.on('finish', () => order.push('listener'));
    response.end('body', () => order.push('callback'));

    if (order.length !== 0) {
        return false;
    }

    const wire = [];
    const socket = new EventEmitter();
    socket.destroyed = false;
    socket.cork = () => {};
    socket.uncork = () => {};
    socket.write = (chunk, callback) => {
        wire.push(Buffer.from(chunk));
        if (typeof callback === 'function') callback();
        return true;
    };
    response.assignSocket(socket);

    const writeResponse = new http.ServerResponse(request);
    const writeOrder = [];
    writeResponse.write('chunk', () => writeOrder.push('callback'));
    writeOrder.push('after-write');
    if (writeOrder.join(',') !== 'after-write') {
        return false;
    }
    const writeSocket = new EventEmitter();
    writeSocket.destroyed = false;
    writeSocket.cork = () => {};
    writeSocket.uncork = () => {};
    writeSocket.write = (_chunk, callback) => {
        if (typeof callback === 'function') callback();
        return true;
    };
    writeResponse.assignSocket(writeSocket);

    const throwingResponse = new http.ServerResponse(request);
    let throwingCallbackCount = 0;
    throwingResponse.write('queued', () => {
        throwingCallbackCount++;
    });
    const throwingSocket = new EventEmitter();
    let throwingCorkCount = 0;
    let throwingUncorkCount = 0;
    throwingSocket.destroyed = false;
    throwingSocket.cork = () => {
        throwingCorkCount++;
    };
    throwingSocket.uncork = () => {
        throwingUncorkCount++;
    };
    throwingSocket.write = () => {
        throw new Error('socket write failed');
    };
    let throwingMessage;
    try {
        throwingResponse.assignSocket(throwingSocket);
    } catch (error) {
        throwingMessage = error.message;
    }

    let nullCode;
    try {
        response.write(null);
    } catch (error) {
        nullCode = error.code;
    }
    let typeCode;
    try {
        response.write(42);
    } catch (error) {
        typeCode = error.code;
    }

    return Buffer.concat(wire).toString().endsWith('\r\n\r\nbody') &&
        order.join(',') === 'listener,callback' &&
        writeOrder.join(',') === 'after-write,callback' &&
        throwingMessage === 'socket write failed' &&
        throwingCallbackCount === 0 &&
        throwingCorkCount === 1 &&
        throwingUncorkCount === 0 &&
        nullCode === 'ERR_STREAM_NULL_VALUES' &&
        typeCode === 'ERR_INVALID_ARG_TYPE';
}

export async function httpResponsePostCloseWrites() {
    const detachedRequest = {
        method: 'GET',
        httpVersionMajor: 1,
        httpVersionMinor: 1,
        socket: null,
    };
    const afterEnd = new http.ServerResponse(detachedRequest);
    const afterEndEvents = [];
    let afterEndReturn;
    let afterEndCallbackWasAsync = false;
    let afterEndSynchronous = true;
    afterEnd.on('error', (error) => {
        afterEndEvents.push('error:' + error.code);
    });
    afterEnd.end();
    afterEndReturn = afterEnd.write('after-end', (error) => {
        afterEndEvents.push('callback:' + error.code);
        afterEndCallbackWasAsync = !afterEndSynchronous;
    });
    afterEndSynchronous = false;
    await new Promise((resolve) => setImmediate(resolve));
    if (
        afterEndReturn !== false ||
        !afterEndCallbackWasAsync ||
        afterEndEvents.join(',') !==
            'callback:ERR_STREAM_WRITE_AFTER_END,error:ERR_STREAM_WRITE_AFTER_END'
    ) {
        return false;
    }

    const destroyedBeforeDelivery = new http.ServerResponse(detachedRequest);
    let destroyedCallbackCount = 0;
    let destroyedCallbackCode;
    let destroyedCallbackWasAsync = false;
    let destroyedErrorCount = 0;
    let destroyedSynchronous = true;
    destroyedBeforeDelivery.on('error', () => {
        destroyedErrorCount++;
    });
    destroyedBeforeDelivery.end();
    const destroyedWriteReturn = destroyedBeforeDelivery.write(
        'destroyed-before-delivery',
        (error) => {
            destroyedCallbackCount++;
            destroyedCallbackCode = error && error.code;
            destroyedCallbackWasAsync = !destroyedSynchronous;
        }
    );
    destroyedBeforeDelivery.destroy();
    destroyedSynchronous = false;
    await new Promise((resolve) => setImmediate(resolve));
    if (
        destroyedWriteReturn !== false ||
        !destroyedBeforeDelivery.destroyed ||
        destroyedCallbackCount !== 1 ||
        destroyedCallbackCode !== 'ERR_STREAM_WRITE_AFTER_END' ||
        !destroyedCallbackWasAsync ||
        destroyedErrorCount !== 0
    ) {
        return false;
    }

    const beforeClose = await new Promise((resolve) => {
        let settled = false;
        let writeCallbackCount = 0;
        let writeCallbackError;
        let callbackBeforeClose = false;
        let finishCount = 0;
        let closeCount = 0;
        let destroyedAtClose = false;
        let afterCloseWriteReturn;
        const server = http.createServer((_req, res) => {
            res.on('error', () => finish(false));
            res.on('finish', () => {
                finishCount++;
            });
            res.on('close', () => {
                closeCount++;
                destroyedAtClose = res.destroyed;
                afterCloseWriteReturn = res.write('after-finish-and-close');
                setImmediate(() => {
                    finish(
                        writeCallbackCount === 1 &&
                        writeCallbackError == null &&
                        callbackBeforeClose &&
                        finishCount === 1 &&
                        closeCount === 1 &&
                        destroyedAtClose &&
                        afterCloseWriteReturn === false
                    );
                });
            });
            res.write('before-close', (error) => {
                writeCallbackCount++;
                writeCallbackError = error;
                callbackBeforeClose = closeCount === 0;
            });
            res.end();
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            server.closeAllConnections();
            server.close();
            resolve(result);
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET / HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    'Connection: close\r\n\r\n'
                );
            });
            socket.on('data', () => {});
            socket.on('error', () => finish(false));
        });
    });

    if (!beforeClose) return false;

    return new Promise((resolve) => {
        let settled = false;
        let firstCloseCount = 0;
        let secondCloseCount = 0;
        let finishCount = 0;
        let responseErrorCount = 0;
        let queuedCallbackCount = 0;
        let postCloseCallbackCount = 0;
        let postCloseCallbackCode;
        let postCloseCallbackWasAsync = false;
        let postCloseReturn;
        let postCloseValidationCode;
        let firstDestroyedAtClose = false;
        let secondDestroyedAtClose = false;
        const server = http.createServer((req, res) => {
            res.on('error', () => {
                responseErrorCount++;
            });
            res.on('finish', () => {
                finishCount++;
            });

            if (req.url === '/first') {
                res.on('close', () => {
                    firstCloseCount++;
                    firstDestroyedAtClose = res.destroyed;
                });
                setTimeout(() => res.destroy(), 25);
                return;
            }

            res.write('queued-during-close', () => {
                queuedCallbackCount++;
            });
            res.on('close', () => {
                secondCloseCount++;
                secondDestroyedAtClose = res.destroyed;
                try {
                    res.write(null);
                } catch (error) {
                    postCloseValidationCode = error.code;
                }
                let synchronous = true;
                postCloseReturn = res.write('after-close', (error) => {
                    postCloseCallbackCount++;
                    postCloseCallbackCode = error && error.code;
                    postCloseCallbackWasAsync = !synchronous;
                });
                synchronous = false;

                setImmediate(() => {
                    finish(
                        firstCloseCount === 1 &&
                        secondCloseCount === 1 &&
                        finishCount === 0 &&
                        responseErrorCount === 0 &&
                        queuedCallbackCount === 0 &&
                        postCloseReturn === false &&
                        postCloseValidationCode === 'ERR_STREAM_NULL_VALUES' &&
                        postCloseCallbackCount === 1 &&
                        postCloseCallbackCode === 'ERR_STREAM_DESTROYED' &&
                        postCloseCallbackWasAsync &&
                        firstDestroyedAtClose &&
                        secondDestroyedAtClose
                    );
                });
            });
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            server.closeAllConnections();
            server.close();
            resolve(result);
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /second HTTP/1.1\r\nHost: localhost\r\n\r\n'
                );
            });
            socket.on('error', () => {});
        });
    });
}

function runHttpActiveDrainScenario() {
    return new Promise((resolve) => {
        const requestCount = 8;
        const body = Buffer.alloc(4096, 'b');
        let settled = false;
        let socket;
        let requestsSeen = 0;
        let bodyBytes = 0;
        let bodyCompleted = false;
        let requestSocketPausedAfterWrite = true;
        let laterRequestBeforeDrain = false;
        let falseWrites = 0;
        let drainCount = 0;
        let finishCount = 0;
        let lengthAtFalse = 0;
        let lengthAtDrain = -1;
        let needDrainAtDrain = true;
        let highWaterMark = 0;
        let noBodyWriteResult = false;
        let noBodyCallbackCount = 0;
        let noBodyDrainCount = 0;
        let noBodyNeedDrain = true;
        const chunk = Buffer.alloc(8 * 1024, 'a');
        let activeDrained = false;
        const sendBodyAndRemainingRequests = () => {
            let requests =
                'HEAD /head HTTP/1.1\r\nHost: localhost\r\n\r\n';
            for (let index = 2; index < requestCount; index++) {
                requests +=
                    `GET /${index} HTTP/1.1\r\n` +
                    'Host: localhost\r\n' +
                    (index === requestCount - 1
                        ? 'Connection: close\r\n'
                        : '') +
                    '\r\n';
            }
            socket.write(Buffer.concat([body.subarray(1), Buffer.from(requests)]));
        };
        const server = http.createServer((req, res) => {
            const index = requestsSeen++;
            res.on('error', () => finish(false));
            res.on('finish', () => {
                finishCount++;
            });

            if (index !== 0) {
                if (!activeDrained) laterRequestBeforeDrain = true;
                if (req.method === 'HEAD') {
                    res.on('drain', () => noBodyDrainCount++);
                    noBodyWriteResult = res.write('ignored', () => {
                        noBodyCallbackCount++;
                    });
                    noBodyNeedDrain = res.writableNeedDrain;
                }
                res.end(index === requestCount - 1 ? 'last' : 'next');
                return;
            }

            req.on('data', (data) => {
                bodyBytes += data.length;
            });
            req.on('end', () => {
                bodyCompleted = bodyBytes === body.length;
                setImmediate(() => socket.resume());
            });
            for (let writes = 0; writes < 32; writes++) {
                if (!res.write(chunk)) {
                    falseWrites++;
                    lengthAtFalse = res.writableLength;
                    highWaterMark = res.writableHighWaterMark;
                    requestSocketPausedAfterWrite = req.socket.isPaused();
                    res.once('drain', () => {
                        activeDrained = true;
                        drainCount++;
                        lengthAtDrain = res.writableLength;
                        needDrainAtDrain = res.writableNeedDrain;
                        res.end();
                    });
                    setImmediate(sendBodyAndRemainingRequests);
                    return;
                }
            }
            finish(false);
        });
        server.on('error', () => finish(false));

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => {
                const observation = {
                    result,
                    falseWrites,
                    drainCount,
                    finishCount,
                    requestsSeen,
                    bodyBytes,
                    bodyCompleted,
                    requestSocketPausedAfterWrite,
                    laterRequestBeforeDrain,
                    lengthAtFalse,
                    lengthAtDrain,
                    needDrainAtDrain,
                    highWaterMark,
                    noBodyWriteResult,
                    noBodyCallbackCount,
                    noBodyDrainCount,
                    noBodyNeedDrain,
                };
                const valid = result &&
                    falseWrites === 1 &&
                    drainCount === 1 &&
                    finishCount === requestCount &&
                    requestsSeen === requestCount &&
                    bodyBytes === body.length &&
                    bodyCompleted &&
                    !requestSocketPausedAfterWrite &&
                    !laterRequestBeforeDrain &&
                    lengthAtFalse >= highWaterMark &&
                    !needDrainAtDrain &&
                    noBodyWriteResult &&
                    noBodyCallbackCount === 1 &&
                    noBodyDrainCount === 0 &&
                    !noBodyNeedDrain;
                if (!valid) console.log('active drain failure', JSON.stringify(observation));
                resolve(valid);
            });
        };
        const timeout = setTimeout(() => finish(false), 5000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.pause();
                socket.write(
                    'POST /active HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    `Content-Length: ${body.length}\r\n\r\n` +
                    body.subarray(0, 1).toString('latin1')
                );
            });
            socket.on('data', () => {});
            socket.on('end', () => setImmediate(() => finish(true)));
            socket.on('error', () => finish(false));
        });
    });
}

function runHttpBlockedDrainAndBodyScenario() {
    return new Promise((resolve) => {
        const body = Buffer.alloc(4096, 'b');
        const payload = Buffer.alloc(80 * 1024, 'p');
        const responses = [];
        const finishOrder = [];
        const callbackOrder = [];
        let settled = false;
        let socket;
        let firstResponse;
        let thirdResponse;
        let bodyBytes = 0;
        let bodyCompletedBeforeRelease = false;
        let requestsBeforeFirstRelease = 0;
        let blockedWriteResult = true;
        let requestSocketPausedAfterWrite = true;
        let blockedDrainCount = 0;
        let endedBlockedWriteResult = true;
        let endedBlockedDrainCount = 0;

        const server = http.createServer((req, res) => {
            const index = responses.length;
            responses.push(res);
            res.on('error', () => finish(false));
            res.on('finish', () => finishOrder.push(index));

            if (index === 0) {
                firstResponse = res;
                return;
            }

            res.setHeader('Content-Length', payload.length);
            if (index === 1) {
                req.on('data', (chunk) => {
                    bodyBytes += chunk.length;
                });
                req.on('end', () => {
                    bodyCompletedBeforeRelease = true;
                    setImmediate(() => {
                        socket.write(
                            'GET /third HTTP/1.1\r\nHost: localhost\r\n\r\n'
                        );
                        setTimeout(() => socket.write(
                            'GET /ended HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'
                        ), 1);
                        setTimeout(() => {
                            requestsBeforeFirstRelease = responses.length;
                            firstResponse.end('first');
                        }, 10);
                    });
                });
                res.on('drain', () => {
                    blockedDrainCount++;
                    res.end();
                });
                blockedWriteResult = res.write(payload, () => {
                    callbackOrder.push(index);
                });
                requestSocketPausedAfterWrite = req.socket.isPaused();
                setImmediate(() => socket.write(body.subarray(1)));
                return;
            }

            if (index === 2) {
                thirdResponse = res;
                res.removeHeader('Content-Length');
                setImmediate(() => thirdResponse.end('third'));
                return;
            }

            res.on('drain', () => endedBlockedDrainCount++);
            endedBlockedWriteResult = res.write(payload, () => {
                callbackOrder.push(index);
            });
            res.end();
        });
        server.on('error', () => finish(false));

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => {
                const orderedFinishes = finishOrder.length === 4 &&
                    finishOrder.every((value, index) => value === index);
                const observation = {
                    result,
                    responseCount: responses.length,
                    bodyBytes,
                    bodyCompletedBeforeRelease,
                    requestsBeforeFirstRelease,
                    blockedWriteResult,
                    requestSocketPausedAfterWrite,
                    blockedDrainCount,
                    endedBlockedWriteResult,
                    endedBlockedDrainCount,
                    callbackOrder,
                    finishOrder,
                };
                const valid = result &&
                    responses.length === 4 &&
                    bodyBytes === body.length &&
                    bodyCompletedBeforeRelease &&
                    requestsBeforeFirstRelease >= 2 &&
                    requestsBeforeFirstRelease <= 3 &&
                    !blockedWriteResult &&
                    !requestSocketPausedAfterWrite &&
                    blockedDrainCount === 1 &&
                    !endedBlockedWriteResult &&
                    endedBlockedDrainCount === 0 &&
                    callbackOrder.length === 2 &&
                    callbackOrder[0] === 1 &&
                    callbackOrder[1] === 3 &&
                    orderedFinishes;
                if (!valid) console.log('blocked drain failure', JSON.stringify(observation));
                resolve(valid);
            });
        };
        const timeout = setTimeout(() => finish(false), 10000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    `POST /body HTTP/1.1\r\nHost: localhost\r\nContent-Length: ${body.length}\r\n\r\n` +
                    body.subarray(0, 1).toString('latin1')
                );
            });
            socket.on('data', () => {});
            socket.on('end', () => setImmediate(() => finish(true)));
            socket.on('error', () => finish(false));
        });
    });
}

function runHttpPausedAbortScenario() {
    return new Promise((resolve) => {
        const payload = Buffer.alloc(80 * 1024, 'x');
        let settled = false;
        let socket;
        let requestsSeen = 0;
        let secondWriteResult = true;
        let writeCallbackErrors = 0;
        let responseCloseCount = 0;

        const server = http.createServer((req, res) => {
            const index = requestsSeen++;
            res.on('error', () => {});
            res.on('close', () => {
                responseCloseCount++;
                setImmediate(() => finish(true));
            });
            if (index === 0) return;

            res.setHeader('Content-Length', payload.length);
            secondWriteResult = res.write(payload, (error) => {
                if (error) writeCallbackErrors++;
            });
            const responseSocket = req.socket;
            res.end();
            setImmediate(() => responseSocket.destroy());
        });
        server.on('error', () => finish(false));

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => {
                const observation = {
                    result,
                    requestsSeen,
                    secondWriteResult,
                    writeCallbackErrors,
                    responseCloseCount,
                };
                const valid = result &&
                    requestsSeen === 2 &&
                    !secondWriteResult &&
                    responseCloseCount >= 1;
                if (!valid) console.log('paused abort failure', JSON.stringify(observation));
                resolve(valid);
            });
        };
        const timeout = setTimeout(() => finish(false), 5000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /abort HTTP/1.1\r\nHost: localhost\r\n\r\n'
                );
            });
            socket.on('data', () => {});
            socket.on('error', () => {});
        });
    });
}

export async function httpPipelineBackpressure() {
    const activeDrain = await runHttpActiveDrainScenario();
    if (!activeDrain) return false;

    const blockedDrainAndBody = await runHttpBlockedDrainAndBodyScenario();
    if (!blockedDrainAndBody) return false;

    const pausedAbort = await runHttpPausedAbortScenario();
    if (!pausedAbort) return false;

    const profile = await runHttpPipelineBackpressureScenario(false);
    return validateHttpPipelineBackpressureProfile(profile);
}

function validateHttpPipelineBackpressureProfile(profile) {
    return profile.ok &&
        profile.admittedBeforeRelease >= 2 &&
        profile.admittedBeforeRelease < profile.requestCount &&
        !profile.blockedFinishedBeforeRelease &&
        profile.finishCount === profile.requestCount &&
        profile.callbackCount === profile.requestCount &&
        profile.ordered &&
        profile.highWaterMark > 0 &&
        profile.queuedBytesBeforeRelease > profile.highWaterMark &&
        profile.queuedBytesBeforeRelease <=
            profile.highWaterMark + profile.payloadBytes + 1024;
}

function runHttpPipelineBackpressureScenario(captureWriteProfile, requestCount = 32) {
    return new Promise((resolve) => {
        const payload = Buffer.alloc(20 * 1024, 'p');
        const responses = [];
        const finishOrder = [];
        const callbackOrder = [];
        let settled = false;
        let socket;
        let firstResponse;
        let admittedBeforeRelease = 0;
        let queuedBytesBeforeRelease = 0;
        let blockedFinishedBeforeRelease = false;
        let highWaterMark = 0;
        const startedAt = Date.now();
        const memoryBefore = process.memoryUsage();
        let heapUsedHighWater = memoryBefore.heapUsed;

        const sampleHeap = () => {
            heapUsedHighWater = Math.max(
                heapUsedHighWater,
                process.memoryUsage().heapUsed
            );
        };

        const server = http.createServer((_req, res) => {
            sampleHeap();
            const index = responses.length;
            responses.push(res);
            res.setHeader('Content-Length', payload.length);
            res.on('finish', () => {
                finishOrder.push(index);
                if (finishOrder.length === requestCount) {
                    setImmediate(() => finish(true));
                }
            });
            res.on('error', () => finish(false));

            if (index === 0) {
                firstResponse = res;
                setImmediate(() => {
                    admittedBeforeRelease = responses.length;
                    blockedFinishedBeforeRelease = finishOrder.length !== 0;
                    highWaterMark = responses[1] && responses[1].writableHighWaterMark;
                    queuedBytesBeforeRelease = responses
                        .slice(1)
                        .reduce((total, response) => total + response.writableLength, 0);
                    firstResponse.write(payload, () => callbackOrder.push(0));
                    firstResponse.end();
                });
                return;
            }

            res.write(payload, () => callbackOrder.push(index));
            res.end();
            sampleHeap();
        });
        server.on('error', () => finish(false));

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            sampleHeap();
            const memoryAfter = process.memoryUsage();
            let writeProfile = null;
            const handle = firstResponse && firstResponse.socket && firstResponse.socket._handle;
            if (captureWriteProfile && handle && typeof handle.get_write_profile === 'function') {
                writeProfile = handle.get_write_profile();
            }
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => {
                const ordered = finishOrder.every((value, index) => value === index) &&
                    callbackOrder.every((value, index) => value === index);
                resolve({
                    ok: result,
                    requestCount,
                    payloadBytes: payload.length,
                    admittedBeforeRelease,
                    queuedBytesBeforeRelease,
                    blockedFinishedBeforeRelease,
                    finishCount: finishOrder.length,
                    callbackCount: callbackOrder.length,
                    ordered,
                    highWaterMark,
                    wallMs: Date.now() - startedAt,
                    memory: {
                        before: memoryBefore,
                        after: memoryAfter,
                        heapUsedHighWater,
                    },
                    writeProfile,
                });
            });
        };
        const timeout = setTimeout(() => finish(false), 10000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                let requests = '';
                for (let index = 0; index < requestCount; index++) {
                    requests +=
                        `GET /${index} HTTP/1.1\r\n` +
                        'Host: localhost\r\n' +
                        '\r\n';
                }
                socket.write(requests);
            });
            socket.on('data', () => {});
            socket.on('error', () => finish(false));
        });
    });
}

export async function httpPipelineBackpressureProfile() {
    const activeDrain = await runHttpActiveDrainScenario();
    if (!activeDrain) {
        return JSON.stringify({ valid: false, activeDrain: false });
    }
    const profile = await runHttpPipelineBackpressureScenario(true, 64);
    profile.activeDrain = true;
    profile.valid = validateHttpPipelineBackpressureProfile(profile);
    return JSON.stringify(profile);
}

export async function httpRequestTrailers() {
    const primaryValid = await new Promise((resolve) => {
        let settled = false;
        let socket;
        let socketErrorCode;
        let wire = '';
        const validUrls = [];
        let emptyTrailersValid = false;
        let populatedTrailersValid = false;
        let cachedDistinctValid = false;
        let fragmentedTrailersValid = false;

        const server = http.createServer((req, res) => {
            validUrls.push(req.url);
            if (req.url === '/empty') {
                req.on('end', () => {
                    const parsedDistinct = req.trailersDistinct;
                    const assignedDistinct = { assigned: ['value'] };
                    req.trailersDistinct = assignedDistinct;
                    emptyTrailersValid = req.complete &&
                        Object.keys(req.trailers).length === 0 &&
                        Object.keys(parsedDistinct).length === 0 &&
                        Object.getPrototypeOf(parsedDistinct) === null &&
                        req.trailersDistinct === assignedDistinct &&
                        req.rawTrailers.length === 0;
                    res.end('empty');
                });
                req.resume();
                return;
            }

            if (req.url === '/trailers') {
                const trailers = req.trailers;
                const fieldsEmptyBeforeEnd = Object.keys(trailers).length === 0;
                const requestHeadersValid =
                    Object.getPrototypeOf(req.headersDistinct) === null &&
                    Object.prototype.hasOwnProperty.call(
                        req.headersDistinct,
                        '__proto__',
                    ) &&
                    req.headersDistinct.__proto__.join(',') === 'request' &&
                    !Object.prototype.hasOwnProperty.call(
                        req.headers,
                        '__proto__',
                    );
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    const trailersDistinct = req.trailersDistinct;
                    const rawTrailers = req.rawTrailers;
                    populatedTrailersValid = fieldsEmptyBeforeEnd &&
                        requestHeadersValid &&
                        req.complete &&
                        req.trailers === trailers &&
                        body === pipelineBody + 'abc' &&
                        trailers['x-mixed'] === 'one' &&
                        trailers['x-dupe'] === 'first, second' &&
                        trailers.cookie === 'a=1; b=2' &&
                        Array.isArray(trailers['set-cookie']) &&
                        trailers['set-cookie'].join(',') === 'c=1,d=2' &&
                        trailers['content-type'] === 'text/plain' &&
                        trailersDistinct['x-dupe'].join(',') === 'first,second' &&
                        trailersDistinct['content-type'].join(',') ===
                            'text/plain,ignored' &&
                        Object.prototype.hasOwnProperty.call(
                            trailers,
                            'constructor',
                        ) &&
                        trailers.constructor === 'safe' &&
                        trailersDistinct.constructor.join(',') === 'safe' &&
                        Object.getPrototypeOf(trailersDistinct) === null &&
                        !Object.prototype.hasOwnProperty.call(
                            trailers,
                            '__proto__',
                        ) &&
                        Object.prototype.hasOwnProperty.call(
                            trailersDistinct,
                            '__proto__',
                        ) &&
                        trailersDistinct.__proto__.join(',') === 'ignored' &&
                        trailers['x-obs-text'] === '\xa0value\xa0' &&
                        JSON.stringify(rawTrailers) === JSON.stringify([
                            'X-Mixed', 'one',
                            'X-Dupe', 'first',
                            'x-dupe', 'second',
                            'Cookie', 'a=1',
                            'cookie', 'b=2',
                            'Set-Cookie', 'c=1',
                            'Set-Cookie', 'd=2',
                            'Content-Type', 'text/plain',
                            'content-type', 'ignored',
                            'constructor', 'safe',
                            '__proto__', 'ignored',
                            'X-Obs-Text', '\xa0value\xa0',
                        ]);
                    res.end('trailers');
                });
                return;
            }

            if (req.url === '/cached-distinct') {
                const trailers = req.trailers;
                const trailersDistinct = req.trailersDistinct;
                const rawTrailers = req.rawTrailers;
                req.on('end', () => {
                    cachedDistinctValid = req.complete &&
                        req.trailers === trailers &&
                        req.trailers['x-cached'] === 'one' &&
                        req.trailersDistinct === trailersDistinct &&
                        Object.keys(trailersDistinct).length === 0 &&
                        Object.getPrototypeOf(trailersDistinct) === null &&
                        req.rawTrailers !== rawTrailers &&
                        JSON.stringify(req.rawTrailers) ===
                            JSON.stringify(['X-Cached', 'one']);
                    res.end('cached-distinct');
                });
                req.resume();
                return;
            }

            if (req.url === '/fragmented') {
                req.on('end', () => {
                    fragmentedTrailersValid = req.complete &&
                        req.trailers['x-fragmented'] === 'bytewise' &&
                        req.trailersDistinct['x-fragmented'][0] === 'bytewise';
                    res.end('fragmented');
                });
                req.resume();
                return;
            }

            res.end('next');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (!result) {
                console.log(JSON.stringify({
                    emptyTrailersValid,
                    populatedTrailersValid,
                    cachedDistinctValid,
                    fragmentedTrailersValid,
                    socketErrorCode,
                    validUrls,
                    wire,
                }));
            }
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 10000);
        const writeBytewise = (buffer, done, index = 0) => {
            if (index === buffer.length) {
                done();
                return;
            }
            socket.write(buffer.subarray(index, index + 1), () => {
                setImmediate(() => writeBytewise(buffer, done, index + 1));
            });
        };

        const pipelineBody = 'p'.repeat(17 * 1024);
        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'POST /empty HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    'Transfer-Encoding: chunked\r\n\r\n' +
                    '0\r\n\r',
                    () => {
                        setImmediate(() => {
                            const request = Buffer.from(
                                '\nPOST /trailers HTTP/1.1\r\n' +
                                'Host: localhost\r\n' +
                                '__proto__: request\r\n' +
                                'Transfer-Encoding: chunked\r\n\r\n' +
                                pipelineBody.length.toString(16) + '\r\n' +
                                pipelineBody + '\r\n' +
                                '3\r\nabc\r\n' +
                                '0\r\n' +
                                'X-Mixed: one\r\n' +
                                'X-Dupe: first\r\n' +
                                'x-dupe: second\r\n' +
                                'Cookie: a=1\r\n' +
                                'cookie: b=2\r\n' +
                                'Set-Cookie: c=1\r\n' +
                                'Set-Cookie: d=2\r\n' +
                                'Content-Type: text/plain\r\n' +
                                'content-type: ignored\r\n' +
                                'constructor: safe\r\n' +
                                '__proto__: ignored\r\n' +
                                'X-Obs-Text: \xa0value\xa0\r\n\r',
                                'latin1',
                            );
                            socket.write(
                                request,
                                () => {
                                    setImmediate(() => {
                                        socket.write(
                                            '\nPOST /cached-distinct HTTP/1.1\r\n' +
                                            'Host: localhost\r\n' +
                                            'Transfer-Encoding: chunked\r\n\r\n' +
                                            '0\r\nX-Cached: one\r\n\r\n' +
                                            'POST /fragmented HTTP/1.1\r\n' +
                                            'Host: localhost\r\n' +
                                            'Transfer-Encoding: chunked\r\n\r\n' +
                                            '0\r\n',
                                            () => writeBytewise(
                                                Buffer.from(
                                                    'X-Fragmented: bytewise\r\n\r\n',
                                                ),
                                                () => socket.write(
                                                    'GET /next HTTP/1.1\r\n' +
                                                    'Host: localhost\r\n' +
                                                    'Connection: close\r\n\r\n',
                                                ),
                                            ),
                                        );
                                    });
                                },
                            );
                        });
                    },
                );
            });
            const evaluate = () => {
                const empty = wire.indexOf('empty');
                const trailers = wire.indexOf('trailers', empty + 1);
                const cached = wire.indexOf('cached-distinct', trailers + 1);
                const fragmented = wire.indexOf('fragmented', cached + 1);
                const next = wire.indexOf('next', fragmented + 1);
                if (
                    emptyTrailersValid &&
                    populatedTrailersValid &&
                    cachedDistinctValid &&
                    fragmentedTrailersValid &&
                    validUrls.join(',') ===
                        '/empty,/trailers,/cached-distinct,/fragmented,/next' &&
                    empty !== -1 &&
                    trailers > empty &&
                    cached > trailers &&
                    fragmented > cached &&
                    next > fragmented
                ) {
                    finish(true);
                }
            };
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                evaluate();
            });
            socket.on('error', (error) => {
                socketErrorCode = error.code;
            });
            const evaluateTerminal = () => {
                evaluate();
                if (!settled) finish(false);
            };
            socket.on('end', evaluateTerminal);
            socket.on('close', evaluateTerminal);
        });
    });
    if (!primaryValid) return false;

    const joinedValid = await new Promise((resolve) => {
        let settled = false;
        let socket;
        let requestValid = false;
        let wire = '';
        const server = http.createServer(
            { joinDuplicateHeaders: true },
            (req, res) => {
                requestValid = req.headers['content-type'] === 'first, second' &&
                    req.headersDistinct['content-type'].join(',') ===
                        'first,second';
                req.on('end', () => {
                    requestValid = requestValid && req.complete &&
                        req.trailers['content-type'] === 'third, fourth' &&
                        req.trailersDistinct['content-type'].join(',') ===
                            'third,fourth';
                    res.end('joined');
                });
                req.resume();
            },
        );
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 5000);
        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => socket.write(
                'POST /join HTTP/1.1\r\n' +
                'Host: localhost\r\n' +
                'Content-Type: first\r\n' +
                'content-type: second\r\n' +
                'Transfer-Encoding: chunked\r\n' +
                'Connection: close\r\n\r\n' +
                '0\r\n' +
                'Content-Type: third\r\n' +
                'content-type: fourth\r\n\r\n',
            ));
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('error', () => finish(false));
            socket.on('close', () => finish(
                requestValid && wire.includes('joined'),
            ));
        });
    });
    if (!joinedValid) return false;

    return new Promise((resolve) => {
        let settled = false;
        let request;
        const server = http.createServer((_req, res) => {
            res.setHeader('__proto__', 'proto-value');
            res.setHeader('constructor', 'constructor-value');
            res.end('client-distinct');
        });
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (request) request.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 5000);
        server.listen(0, () => {
            request = http.get({ port: server.address().port }, (res) => {
                const headersValid =
                    Object.getPrototypeOf(res.headersDistinct) === null &&
                    Object.prototype.hasOwnProperty.call(
                        res.headersDistinct,
                        '__proto__',
                    ) &&
                    res.headersDistinct.__proto__.join(',') === 'proto-value' &&
                    Object.prototype.hasOwnProperty.call(
                        res.headersDistinct,
                        'constructor',
                    ) &&
                    res.headersDistinct.constructor.join(',') ===
                        'constructor-value' &&
                    !Object.prototype.hasOwnProperty.call(
                        res.headers,
                        '__proto__',
                    ) &&
                    Object.prototype.hasOwnProperty.call(
                        res.headers,
                        'constructor',
                    ) &&
                    res.headers.constructor === 'constructor-value';
                res.on('end', () => finish(headersValid));
                res.resume();
            });
            request.on('error', () => finish(false));
        });
    });
}

export async function httpRequestTrailerErrors() {
    let activeSocket;
    let currentCase;
    let lastParserError;
    let validSplitTrailers;
    const requests = {};
    const lifecycles = {};

    const server = http.createServer((req, res) => {
        const key = currentCase;
        if (!requests[key]) requests[key] = [];
        requests[key].push(req.url);
        const lifecycle = {
            req,
            end: 0,
            aborted: 0,
            error: 0,
            errorCode: undefined,
            close: 0,
        };
        lifecycles[key] = lifecycle;
        req.on('end', () => lifecycle.end++);
        req.on('aborted', () => lifecycle.aborted++);
        req.on('error', (error) => {
            lifecycle.error++;
            lifecycle.errorCode = error.code;
        });
        req.on('close', () => lifecycle.close++);
        if (key === 'boundary-ok') {
            req.on('end', () => res.end('boundary-ok'));
        } else if (key === 'valid-final-crlf-split') {
            req.on('end', () => {
                validSplitTrailers = req.complete === true &&
                    req.trailers['x-split'] === 'value' &&
                    req.trailersDistinct['x-split'].join(',') === 'value' &&
                    req.rawTrailers.join(',') === 'X-Split,value';
                res.end('valid-final-crlf-split');
            });
        } else if (key === 'started-response') {
            res.write('prefix');
        }
        req.resume();
    });

    const onClientError = (error, socket) => {
        const lifecycle = lifecycles[currentCase];
        lastParserError = {
            code: error.code,
            reason: error.reason,
            bytesParsed: error.bytesParsed,
            hasRawPacket: error.rawPacket instanceof Buffer,
            rawPacket: error.rawPacket && error.rawPacket.toString('latin1'),
            abortedAtCallback: lifecycle && lifecycle.req.aborted,
            completeAtCallback: lifecycle && lifecycle.req.complete,
        };
        socket.destroy();
    };
    server.on('clientError', onClientError);

    const exchange = (payload, endAfterWrite = false) => new Promise((resolve) => {
        let settled = false;
        let wire = '';
        let socketErrorCode;
        const finish = (timedOut) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve({ wire, socketErrorCode, timedOut });
        };
        const timeout = setTimeout(() => {
            if (activeSocket) activeSocket.destroy();
            finish(true);
        }, 10000);
        const socket = net.connect({ port: server.address().port });
        activeSocket = socket;
        socket.on('connect', () => {
            const parts = Array.isArray(payload) ? payload : [payload];
            const writePart = (index) => {
                if (socket.destroyed) return;
                const isLast = index === parts.length - 1;
                if (isLast && endAfterWrite) {
                    socket.end(parts[index]);
                    return;
                }
                socket.write(parts[index], () => {
                    if (!isLast && !socket.destroyed) {
                        setTimeout(() => writePart(index + 1), 50);
                    }
                });
            };
            writePart(0);
        });
        socket.on('data', (chunk) => {
            wire += chunk.toString('latin1');
        });
        socket.on('error', (error) => {
            socketErrorCode = error.code;
        });
        socket.on('close', () => finish(false));
    });

    const exchangeAfterResponse = (before, after) =>
        new Promise((resolve) => {
            let settled = false;
            let sentAfter = false;
            let wire = '';
            let socketErrorCode;
            const finish = (timedOut) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                resolve({ wire, socketErrorCode, timedOut });
            };
            const timeout = setTimeout(() => {
                if (activeSocket) activeSocket.destroy();
                finish(true);
            }, 10000);
            activeSocket = net.connect({ port: server.address().port });
            activeSocket.on('connect', () => activeSocket.write(before));
            activeSocket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentAfter) {
                    sentAfter = true;
                    activeSocket.write(after);
                }
            });
            activeSocket.on('error', (error) => {
                socketErrorCode = error.code;
            });
            activeSocket.on('close', () => finish(false));
        });

    const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
    const settleLifecycle = async () => {
        await nextTurn();
        await nextTurn();
        await nextTurn();
    };
    const waitForLifecycleClose = async (key) => {
        const lifecycle = lifecycles[key];
        if (!lifecycle || lifecycle.close > 0) return;
        await new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                resolve();
            };
            const timeout = setTimeout(finish, 2000);
            lifecycle.req.once('close', finish);
        });
    };
    const lifecycleIsAborted = (key) => {
        const lifecycle = lifecycles[key];
        return lifecycle && lifecycle.req.complete === false &&
            lifecycle.end === 0 && lifecycle.aborted === 1 &&
            lifecycle.error === 1 && lifecycle.errorCode === 'ECONNRESET' &&
            lifecycle.close === 1;
    };
    const lifecycleIsComplete = (key) => {
        const lifecycle = lifecycles[key];
        return lifecycle && lifecycle.req.complete === true &&
            lifecycle.end === 1 && lifecycle.aborted === 0 &&
            lifecycle.error === 0 && lifecycle.close === 1;
    };
    const handledErrorIsValid = (
        code,
        reason,
        bytesParsed,
        rawPacket,
    ) =>
        lastParserError && lastParserError.code === code &&
        lastParserError.reason === reason &&
        lastParserError.bytesParsed === bytesParsed &&
        lastParserError.hasRawPacket === (rawPacket !== undefined) &&
        lastParserError.rawPacket === rawPacket &&
        lastParserError.abortedAtCallback === false &&
        lastParserError.completeAtCallback === false;

    const runHandled = async (key, payload, endAfterWrite = false) => {
        currentCase = key;
        lastParserError = undefined;
        const result = await exchange(payload, endAfterWrite);
        await settleLifecycle();
        await waitForLifecycleClose(key);
        return result;
    };

    const closeServer = () => new Promise((resolve) => {
        if (activeSocket) activeSocket.destroy();
        server.closeAllConnections();
        server.close(resolve);
    });

    let failure;
    try {
        await new Promise((resolve) => server.listen(0, resolve));

        const validSplitPrefix = Buffer.from(
            'POST /valid-final-crlf-split HTTP/1.1\r\n' +
            'Host: localhost\r\nConnection: close\r\n' +
            'Transfer-Encoding: chunked\r\n\r\n' +
            '0\r\nX-Split: value\r\n\r',
            'latin1',
        );
        const validSplitSuffix = Buffer.from('\n', 'latin1');
        let result = await runHandled(
            'valid-final-crlf-split',
            [validSplitPrefix, validSplitSuffix],
        );
        if (result.timedOut ||
            !result.wire.includes('valid-final-crlf-split') ||
            lastParserError !== undefined ||
            validSplitTrailers !== true ||
            !lifecycleIsComplete('valid-final-crlf-split')) {
            failure = 'valid-final-crlf-split';
        }

        const vtPayload = Buffer.from(
            'POST /bad-vt HTTP/1.1\r\n' +
            'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
            '0\r\nX-Bad:\x0bvalue\r\n\r\n' +
            'GET /smuggled HTTP/1.1\r\nHost: localhost\r\n\r\n',
            'latin1',
        );
        result = await runHandled('vt', vtPayload);
        if (result.timedOut || result.wire !== '' ||
            requests.vt.join(',') !== '/bad-vt' ||
            !handledErrorIsValid(
                'HPE_INVALID_HEADER_TOKEN',
                'Invalid header value char',
                vtPayload.indexOf(0x0b),
                vtPayload.toString('latin1'),
            ) || !lifecycleIsAborted('vt')) {
            failure = 'vertical-tab';
        }

        if (!failure) {
            const ffPrefix = Buffer.from(
                'POST /bad-ff HTTP/1.1\r\n' +
                'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
                '0\r\n',
                'latin1',
            );
            const ffSuffix = Buffer.from(
                'X-Bad:\x0cvalue\r\n\r\n',
                'latin1',
            );
            result = await runHandled('ff', [ffPrefix, ffSuffix]);
            if (result.timedOut || result.wire !== '' ||
                !handledErrorIsValid(
                    'HPE_INVALID_HEADER_TOKEN',
                    'Invalid header value char',
                    ffSuffix.indexOf(0x0c),
                    ffSuffix.toString('latin1'),
                ) || !lifecycleIsAborted('ff')) {
                failure = 'form-feed';
            }
        }

        const invalidTrailerPrefix = (key) =>
            'POST /' + key + ' HTTP/1.1\r\n' +
            'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
            '0\r\n';
        for (const invalidCase of [
            {
                key: 'no-colon',
                suffix: 'foo\r\n\r\n',
                code: 'HPE_INVALID_HEADER_TOKEN',
                reason: 'Invalid header token',
                offset(payload) {
                    return payload.indexOf('foo\r\n') + 3;
                },
            },
            {
                key: 'invalid-name-before-cr',
                suffix: 'fo o\r',
                code: 'HPE_INVALID_HEADER_TOKEN',
                reason: 'Invalid header token',
                offset(payload) {
                    return payload.indexOf('fo o') + 2;
                },
            },
            {
                key: 'invalid-name',
                suffix: 'a b\r\n\r\n',
                code: 'HPE_INVALID_HEADER_TOKEN',
                reason: 'Invalid header token',
                offset(payload) {
                    return payload.indexOf('a b') + 1;
                },
            },
            {
                key: 'obs-fold',
                suffix: ' value\r\n\r\n',
                code: 'HPE_INVALID_HEADER_TOKEN',
                reason: 'Invalid header token',
                offset(payload) {
                    return payload.indexOf(' value');
                },
            },
            {
                key: 'empty-name',
                suffix: ': value\r\n\r\n',
                code: 'HPE_INVALID_HEADER_TOKEN',
                reason: 'Invalid header token',
                offset(payload) {
                    return payload.indexOf(': value');
                },
            },
            {
                key: 'bare-lf',
                suffix: 'X: value\nY: okay\r\n\r\n',
                code: 'HPE_CR_EXPECTED',
                reason: 'Missing expected CR after header value',
                offset(payload) {
                    return payload.indexOf('\nY');
                },
            },
            {
                key: 'bare-cr',
                suffix: 'X: value\rY: okay\r\n\r\n',
                code: 'HPE_LF_EXPECTED',
                reason: 'Missing expected LF after header value',
                offset(payload) {
                    return payload.indexOf('\rY') + 1;
                },
            },
        ]) {
            if (failure) break;
            const payload = Buffer.from(
                invalidTrailerPrefix(invalidCase.key) + invalidCase.suffix,
                'latin1',
            );
            result = await runHandled(invalidCase.key, payload);
            if (result.timedOut || result.wire !== '' ||
                !handledErrorIsValid(
                    invalidCase.code,
                    invalidCase.reason,
                    invalidCase.offset(payload),
                    payload.toString('latin1'),
                ) || !lifecycleIsAborted(invalidCase.key)) {
                failure = invalidCase.key;
            }
        }

        if (!failure) {
            const splitPrefix = Buffer.from(
                invalidTrailerPrefix('split-no-colon') + 'foo',
                'latin1',
            );
            const splitSuffix = Buffer.from('\r\n\r\n', 'latin1');
            result = await runHandled(
                'split-no-colon',
                [splitPrefix, splitSuffix],
            );
            if (result.timedOut || result.wire !== '' ||
                !handledErrorIsValid(
                    'HPE_INVALID_HEADER_TOKEN',
                    'Invalid header token',
                    0,
                    splitSuffix.toString('latin1'),
                ) || lastParserError.bytesParsed < 0 ||
                !lifecycleIsAborted('split-no-colon')) {
                failure = 'split-no-colon';
            }
        }

        if (!failure) {
            const splitPrefix = Buffer.from(
                invalidTrailerPrefix('split-no-colon-cr') + 'foo\r',
                'latin1',
            );
            const splitSuffix = Buffer.from('\n\r\n', 'latin1');
            result = await runHandled(
                'split-no-colon-cr',
                [splitPrefix, splitSuffix],
            );
            if (result.timedOut || result.wire !== '' ||
                !handledErrorIsValid(
                    'HPE_INVALID_HEADER_TOKEN',
                    'Invalid header token',
                    splitPrefix.length - 1,
                    splitPrefix.toString('latin1'),
                ) || !lifecycleIsAborted('split-no-colon-cr')) {
                failure = 'split-no-colon-cr';
            }
        }

        if (!failure) {
            const splitPrefix = Buffer.from(
                invalidTrailerPrefix('split-bare-cr') + 'X: value\r',
                'latin1',
            );
            const splitSuffix = Buffer.from('Y: okay\r\n\r\n', 'latin1');
            result = await runHandled(
                'split-bare-cr',
                [splitPrefix, splitSuffix],
            );
            if (result.timedOut || result.wire !== '' ||
                !handledErrorIsValid(
                    'HPE_LF_EXPECTED',
                    'Missing expected LF after header value',
                    0,
                    splitSuffix.toString('latin1'),
                ) || !lifecycleIsAborted('split-bare-cr')) {
                failure = 'split-bare-cr';
            }
        }

        for (const [key, suffix] of [
            ['empty-eof', ''],
            ['partial-eof', 'X-Test: value\r\n'],
        ]) {
            if (failure) break;
            result = await runHandled(key,
                'POST /' + key + ' HTTP/1.1\r\n' +
                'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
                '0\r\n' + suffix,
                true,
            );
            if (result.timedOut || result.wire !== '' ||
                !handledErrorIsValid(
                    'HPE_INVALID_EOF_STATE',
                    'Invalid EOF state',
                    0,
                    undefined,
                ) || !lifecycleIsAborted(key)) {
                failure = key;
            }
        }

        if (!failure) {
            server.removeListener('clientError', onClientError);
            currentCase = 'default';
            result = await exchange(
                'POST /default HTTP/1.1\r\n' +
                'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
                '0\r\nBad Name: value\r\n\r\n' +
                'GET /smuggled HTTP/1.1\r\nHost: localhost\r\n\r\n',
            );
            await settleLifecycle();
            await waitForLifecycleClose('default');
            if (result.timedOut ||
                result.wire !== 'HTTP/1.1 400 Bad Request\r\n' +
                    'Connection: close\r\n\r\n' ||
                requests.default.join(',') !== '/default' ||
                !lifecycleIsAborted('default')) {
                failure = { phase: 'default-handler', result };
            }
        }

        if (!failure) {
            currentCase = 'boundary-ok';
            result = await exchange(
                'POST /boundary-ok HTTP/1.1\r\n' +
                'Host: localhost\r\nTransfer-Encoding: chunked\r\n' +
                'Connection: close\r\n\r\n' +
                '0\r\nX: ' + 'a'.repeat(16382) + '\r\n\r\n',
            );
            await settleLifecycle();
            await waitForLifecycleClose('boundary-ok');
            if (result.timedOut || !result.wire.includes('boundary-ok') ||
                !lifecycleIsComplete('boundary-ok')) {
                failure = { phase: 'boundary-ok', result };
            }
        }

        if (!failure) {
            currentCase = 'overflow';
            result = await exchange(
                'POST /overflow HTTP/1.1\r\n' +
                'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
                '0\r\nX: ' + 'a'.repeat(16383) + '\r\n\r\n',
            );
            await settleLifecycle();
            await waitForLifecycleClose('overflow');
            if (result.timedOut ||
                result.wire !==
                    'HTTP/1.1 431 Request Header Fields Too Large\r\n' +
                    'Connection: close\r\n\r\n' ||
                !lifecycleIsAborted('overflow')) {
                failure = { phase: 'overflow', result };
            }
        }

        if (!failure) {
            currentCase = 'started-response';
            result = await exchangeAfterResponse(
                'POST /started-response HTTP/1.1\r\n' +
                'Host: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
                '0\r\n',
                'Bad Name: value\r\n\r\n',
            );
            await settleLifecycle();
            await waitForLifecycleClose('started-response');
            if (result.timedOut || !result.wire.includes('prefix') ||
                result.wire.includes('400 Bad Request') ||
                result.wire.includes('431 Request Header Fields Too Large') ||
                result.wire.split('HTTP/1.1').length !== 2 ||
                !lifecycleIsAborted('started-response')) {
                failure = { phase: 'started-response', result };
            }
        }
    } catch (error) {
        failure = error && (error.stack || error.message) || String(error);
    } finally {
        await closeServer();
    }

    if (failure) {
        console.log(JSON.stringify({
            failure,
            lastParserError,
            requests,
            lifecycles: Object.fromEntries(Object.entries(lifecycles).map(
                ([key, value]) => [key, {
                    complete: value.req.complete,
                    end: value.end,
                    aborted: value.aborted,
                    error: value.error,
                    errorCode: value.errorCode,
                    close: value.close,
                }],
            )),
        }));
    }
    return !failure;
}

export async function httpPipelinedResponseOrder() {
    return new Promise((resolve) => {
        let settled = false;
        let informationalCallbacks = 0;
        let informationalCallbackError = false;
        let informationalCallbackArity = 0;
        const informationalCallbackValues = [];
        let continueReturn;
        let processingReturn;
        let sent100Before;
        let sent100AfterContinue;
        let sent100AfterProcessing;
        const server = http.createServer((req, res) => {
            if (req.url === '/first') {
                setTimeout(() => res.end('first'), 25);
                return;
            }

            sent100Before = res._sent100;
            continueReturn = res.writeContinue(function (error) {
                informationalCallbacks++;
                informationalCallbackArity += arguments.length;
                informationalCallbackValues.push(error);
                informationalCallbackError ||= !!error;
            });
            sent100AfterContinue = res._sent100;
            processingReturn = res.writeProcessing(function (error) {
                informationalCallbacks++;
                informationalCallbackArity += arguments.length;
                informationalCallbackValues.push(error);
                informationalCallbackError ||= !!error;
            });
            sent100AfterProcessing = res._sent100;
            res.writeEarlyHints({ link: '</asset.js>; rel=preload' });
            res.end('second');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            server.close(() => resolve(result));
        };

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            let wire = '';
            const timeout = setTimeout(() => {
                socket.destroy();
                finish(false);
            }, 2000);

            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /second HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('error', () => {
                clearTimeout(timeout);
                finish(false);
            });
            socket.on('end', () => {
                clearTimeout(timeout);
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const firstBody = wire.indexOf('first', firstStatus);
                const continued = wire.indexOf('HTTP/1.1 100 Continue', firstBody);
                const processing = wire.indexOf('HTTP/1.1 102 Processing', continued);
                const earlyHints = wire.indexOf('HTTP/1.1 103 Early Hints', processing);
                const secondStatus = wire.indexOf('HTTP/1.1 200', firstStatus + 1);
                const secondBody = wire.indexOf('second', secondStatus);
                finish(firstStatus !== -1 &&
                    firstBody > firstStatus &&
                    continued > firstBody &&
                    processing > continued &&
                    earlyHints > processing &&
                    secondStatus > earlyHints &&
                    secondBody > secondStatus &&
                    informationalCallbacks === 2 &&
                    informationalCallbackArity === 2 &&
                    informationalCallbackValues.every((value) => value === null) &&
                    continueReturn === undefined &&
                    processingReturn === undefined &&
                    sent100Before === false &&
                    sent100AfterContinue === true &&
                    sent100AfterProcessing === true &&
                    !informationalCallbackError);
            });
        });
    });
}

export async function httpExpectContinueFlow() {
    const listen = (server) => new Promise((resolve) => server.listen(0, resolve));
    const close = async (server) => {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    };
    const exchange = async (server, initialRequest, onWire) => {
        await listen(server);
        let socket;
        try {
            return await new Promise((resolve) => {
                let settled = false;
                let wire = '';
                const finish = (result) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timeout);
                    if (socket) socket.destroy();
                    resolve(result);
                };
                const timeout = setTimeout(() => finish({ timedOut: true, wire }), 2000);
                socket = net.connect({ port: server.address().port });
                socket.on('connect', () => socket.write(initialRequest));
                socket.on('data', (chunk) => {
                    wire += chunk.toString('latin1');
                    if (onWire) onWire(wire, socket);
                });
                socket.on('error', (error) => finish({ error: error.message, wire }));
                socket.on('end', () => finish({ wire }));
                socket.on('close', () => finish({ wire }));
            });
        } finally {
            await close(server);
        }
    };

    let autoRequests = 0;
    let autoBody = '';
    let autoExpect;
    let autoSent100;
    let autoEnd = 0;
    let autoClose = 0;
    const autoServer = http.createServer((req, res) => {
        autoRequests++;
        autoExpect = res._expect_continue;
        autoSent100 = res._sent100;
        req.on('data', (chunk) => {
            autoBody += chunk.toString();
        });
        req.on('end', () => {
            autoEnd++;
            res.end('auto');
        });
        req.on('close', () => autoClose++);
    });
    let autoBodySent = false;
    const auto = await exchange(
        autoServer,
        'POST /auto HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Expect: other, 100-Continue\r\n' +
        'Content-Length: 4\r\n' +
        'Connection: close\r\n\r\n',
        (wire, socket) => {
            if (!autoBodySent && wire.includes('HTTP/1.1 100 Continue\r\n\r\n')) {
                autoBodySent = true;
                socket.write('body');
            }
        },
    );
    const autoContinue = auto.wire.indexOf('HTTP/1.1 100 Continue');
    const autoFinal = auto.wire.indexOf('HTTP/1.1 200 OK');
    if (auto.timedOut || auto.error || autoRequests !== 1 ||
        autoExpect !== true || autoSent100 !== true ||
        autoBody !== 'body' || autoEnd !== 1 || autoClose !== 1 ||
        autoContinue === -1 || autoFinal <= autoContinue ||
        !auto.wire.includes('\r\n\r\nauto')) {
        console.log(JSON.stringify({ phase: 'automatic', auto, autoRequests,
            autoExpect, autoSent100, autoBody, autoEnd, autoClose }));
        return false;
    }

    const explicitRequests = [];
    let checkContinue = 0;
    let explicitBody = '';
    let explicitBefore;
    let explicitAfter;
    let explicitExpect;
    let continueCallbacks = 0;
    let continueCallbackError;
    const explicitServer = http.createServer((req, res) => {
        explicitRequests.push(req.url);
        res.end('next');
    });
    explicitServer.on('checkContinue', (req, res) => {
        checkContinue++;
        explicitExpect = res._expect_continue;
        explicitBefore = res._sent100;
        res.writeContinue((error) => {
            continueCallbacks++;
            continueCallbackError = error;
        });
        explicitAfter = res._sent100;
        req.on('data', (chunk) => {
            explicitBody += chunk.toString();
        });
        req.on('end', () => res.end('explicit'));
    });
    let explicitBodySent = false;
    const explicit = await exchange(
        explicitServer,
        'POST /explicit HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Expect: 100-continue\r\n' +
        'Content-Length: 4\r\n\r\n',
        (wire, socket) => {
            if (!explicitBodySent && wire.includes('HTTP/1.1 100 Continue\r\n\r\n')) {
                explicitBodySent = true;
                socket.write(
                    'data' +
                    'GET /next HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    'Connection: close\r\n\r\n',
                );
            }
        },
    );
    const explicitContinue = explicit.wire.indexOf('HTTP/1.1 100 Continue');
    const explicitFinal = explicit.wire.indexOf('HTTP/1.1 200 OK');
    const explicitNext = explicit.wire.indexOf('HTTP/1.1 200 OK', explicitFinal + 1);
    if (explicit.timedOut || explicit.error ||
        explicitRequests.join(',') !== '/next' ||
        checkContinue !== 1 || explicitExpect !== true ||
        explicitBefore !== false || explicitAfter !== true ||
        continueCallbacks !== 1 || continueCallbackError !== null ||
        explicitBody !== 'data' || explicitContinue === -1 ||
        explicitFinal <= explicitContinue || explicitNext <= explicitFinal ||
        !explicit.wire.slice(explicitFinal, explicitNext)
            .includes('Connection: keep-alive') ||
        !explicit.wire.includes('\r\n\r\nexplicit') ||
        !explicit.wire.includes('\r\n\r\nnext')) {
        console.log(JSON.stringify({ phase: 'explicit', explicit,
            explicitRequests, checkContinue, explicitExpect, explicitBefore,
            explicitAfter, continueCallbacks, continueCallbackError,
            explicitBody }));
        return false;
    }

    let unansweredRequests = 0;
    let unansweredCheckContinue = 0;
    let unansweredEnd = 0;
    const unansweredServer = http.createServer(() => unansweredRequests++);
    unansweredServer.on('checkContinue', (req, res) => {
        unansweredCheckContinue++;
        req.on('end', () => unansweredEnd++);
        req.resume();
        res.statusCode = 417;
        res.end('rejected');
    });
    unansweredServer.maxRequestsPerSocket = 1;
    const unanswered = await exchange(
        unansweredServer,
        'POST /rejected HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Expect: 100-continue\r\n' +
        'Content-Length: 4\r\n\r\nbody',
    );
    if (unanswered.timedOut || unanswered.error || unansweredRequests !== 0 ||
        unansweredCheckContinue !== 1 || unansweredEnd !== 1 ||
        unanswered.wire.includes('100 Continue') ||
        !unanswered.wire.includes('HTTP/1.1 417 Expectation Failed') ||
        !unanswered.wire.includes('Connection: close') ||
        !unanswered.wire.includes('\r\n\r\nrejected')) {
        console.log(JSON.stringify({ phase: 'unanswered-continue', unanswered,
            unansweredRequests, unansweredCheckContinue, unansweredEnd }));
        return false;
    }

    const overrideRequests = [];
    let overrideCheckContinue = 0;
    const overrideServer = http.createServer((req, res) => {
        overrideRequests.push(req.url);
        res.end('after');
    });
    overrideServer.on('checkContinue', (req, res) => {
        overrideCheckContinue++;
        req.resume();
        res.setHeader('Connection', 'keep-alive');
        res.statusCode = 417;
        res.end('override');
    });
    const override = await exchange(
        overrideServer,
        'POST /override HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Expect: 100-continue\r\n' +
        'Content-Length: 4\r\n\r\nbody' +
        'GET /after HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Connection: close\r\n\r\n',
    );
    const overrideFailed = override.wire.indexOf('HTTP/1.1 417 Expectation Failed');
    const overrideAfter = override.wire.indexOf('HTTP/1.1 200 OK', overrideFailed + 1);
    if (override.timedOut || override.error || overrideCheckContinue !== 1 ||
        overrideRequests.join(',') !== '/after' ||
        override.wire.includes('100 Continue') || overrideFailed === -1 ||
        overrideAfter <= overrideFailed ||
        !override.wire.slice(overrideFailed, overrideAfter)
            .includes('Connection: keep-alive') ||
        !override.wire.includes('\r\n\r\noverride') ||
        !override.wire.includes('\r\n\r\nafter')) {
        console.log(JSON.stringify({ phase: 'expect-connection-override',
            override, overrideRequests, overrideCheckContinue }));
        return false;
    }

    const defaultRequests = [];
    const defaultServer = http.createServer((req, res) => {
        defaultRequests.push(req.url);
        res.end('next');
    });
    const defaultResult = await exchange(
        defaultServer,
        'POST /unsupported HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Expect: meoww\r\n' +
        'Content-Length: 4\r\n\r\n' +
        'body' +
        'GET /next HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Connection: close\r\n\r\n',
    );
    const expectationFailed = defaultResult.wire.indexOf(
        'HTTP/1.1 417 Expectation Failed',
    );
    const nextResponse = defaultResult.wire.indexOf(
        'HTTP/1.1 200 OK',
        expectationFailed + 1,
    );
    if (defaultResult.timedOut || defaultResult.error ||
        defaultRequests.join(',') !== '/next' ||
        expectationFailed === -1 || nextResponse <= expectationFailed ||
        !defaultResult.wire.includes('\r\n\r\nnext')) {
        console.log(JSON.stringify({ phase: 'default-expectation',
            defaultResult, defaultRequests }));
        return false;
    }

    let expectationRequests = 0;
    let checkExpectation = 0;
    let expectationComplete;
    const expectationServer = http.createServer(() => expectationRequests++);
    expectationServer.on('checkExpectation', (req, res) => {
        checkExpectation++;
        req.on('end', () => {
            expectationComplete = req.complete;
            res.statusCode = 417;
            res.end('custom');
        });
        req.resume();
    });
    const expectation = await exchange(
        expectationServer,
        'POST /custom HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Expect: custom\r\n' +
        'Content-Length: 4\r\n' +
        'Connection: close\r\n\r\ndata',
    );
    if (expectation.timedOut || expectation.error || expectationRequests !== 0 ||
        checkExpectation !== 1 || expectationComplete !== true ||
        !expectation.wire.includes('HTTP/1.1 417 Expectation Failed') ||
        !expectation.wire.includes('\r\n\r\ncustom')) {
        console.log(JSON.stringify({ phase: 'custom-expectation', expectation,
            expectationRequests, checkExpectation, expectationComplete }));
        return false;
    }

    let legacyRequests = 0;
    let legacyCheckContinue = 0;
    let legacyCheckExpectation = 0;
    const legacyServer = http.createServer((_req, res) => {
        legacyRequests++;
        res.end('legacy');
    });
    legacyServer.on('checkContinue', () => legacyCheckContinue++);
    legacyServer.on('checkExpectation', () => legacyCheckExpectation++);
    const legacy = await exchange(
        legacyServer,
        'GET /legacy HTTP/1.0\r\n' +
        'Expect: custom\r\n' +
        'Connection: close\r\n\r\n',
    );
    if (legacy.timedOut || legacy.error || legacyRequests !== 1 ||
        legacyCheckContinue !== 0 || legacyCheckExpectation !== 0 ||
        legacy.wire.includes('100 Continue') ||
        legacy.wire.includes('417 Expectation Failed') ||
        !legacy.wire.includes('\r\n\r\nlegacy')) {
        console.log(JSON.stringify({ phase: 'http-1.0', legacy, legacyRequests,
            legacyCheckContinue, legacyCheckExpectation }));
        return false;
    }

    let skippedHintCallbacks = 0;
    let earlyHintCallbacks = 0;
    let earlyHintCallbackError;
    const earlyHintsServer = http.createServer((_req, res) => {
        res.writeEarlyHints({ test: 'missing-link' }, () => skippedHintCallbacks++);
        res.writeEarlyHints(
            { link: undefined, test: 'undefined-link' },
            () => skippedHintCallbacks++,
        );
        res.writeEarlyHints({ link: [] }, () => skippedHintCallbacks++);
        res.writeEarlyHints({
            link: '</lower.js>; rel=preload',
            Link: '</upper.js>; rel=preload',
            test: 'included',
        }, (error) => {
            earlyHintCallbacks++;
            earlyHintCallbackError = error;
        });
        res.writeEarlyHints({
            link: [{
                toString() {
                    return '</coerced.js>; rel=preload';
                },
            }],
        }, (error) => {
            earlyHintCallbacks++;
            earlyHintCallbackError ||= error;
        });
        res.end('hints');
    });
    const earlyHints = await exchange(
        earlyHintsServer,
        'GET /hints HTTP/1.1\r\n' +
        'Host: localhost\r\n' +
        'Connection: close\r\n\r\n',
    );
    const expectedEarlyHints =
        'HTTP/1.1 103 Early Hints\r\n' +
        'Link: </lower.js>; rel=preload\r\n' +
        'Link: </upper.js>; rel=preload\r\n' +
        'test: included\r\n\r\n' +
        'HTTP/1.1 103 Early Hints\r\n' +
        'Link: </coerced.js>; rel=preload\r\n\r\n';
    if (earlyHints.timedOut || earlyHints.error || skippedHintCallbacks !== 0 ||
        earlyHintCallbacks !== 2 || earlyHintCallbackError !== null ||
        earlyHints.wire.split('HTTP/1.1 103 Early Hints').length !== 3 ||
        !earlyHints.wire.includes(expectedEarlyHints) ||
        earlyHints.wire.includes('missing-link') ||
        earlyHints.wire.includes('undefined-link') ||
        !earlyHints.wire.includes('\r\n\r\nhints')) {
        console.log(JSON.stringify({ phase: 'early-hints', earlyHints,
            skippedHintCallbacks, earlyHintCallbacks,
            earlyHintCallbackError }));
        return false;
    }

    return true;
}

export async function httpHalfOpenPipelinedRequests() {
    return new Promise((resolve) => {
        let settled = false;
        let handled = 0;
        let aborted = 0;
        let truncatedWasComplete;
        let wire = '';
        let socket;
        const server = http.createServer((req, res) => {
            handled++;
            req.on('aborted', () => {
                aborted++;
                if (req.url === '/truncated') {
                    truncatedWasComplete = req.complete;
                }
            });
            setTimeout(() => {
                if (req.url === '/truncated') {
                    res.end('unexpected');
                    return;
                }
                if (req.aborted) {
                    finish(false);
                    return;
                }
                res.end(req.url);
            }, 25);
        });
        server.httpAllowHalfOpen = true;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        const runTruncatedRequest = () => {
            wire = '';
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.end(
                    'POST /truncated HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    'Content-Length: 10\r\n\r\nabc'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('error', () => finish(false));
            socket.on('end', () => {
                finish(
                    handled === 3 &&
                    aborted === 1 &&
                    truncatedWasComplete === false &&
                    !wire.includes('HTTP/1.1')
                );
            });
        };

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.end(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /second HTTP/1.1\r\nHost: localhost\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('error', () => finish(false));
            socket.on('end', () => {
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const firstBody = wire.indexOf('/first', firstStatus);
                const secondStatus = wire.indexOf('HTTP/1.1 200', firstStatus + 1);
                const secondBody = wire.indexOf('/second', secondStatus);
                if (
                    handled === 2 &&
                    aborted === 0 &&
                    firstStatus !== -1 &&
                    firstBody > firstStatus &&
                    secondStatus > firstBody &&
                    secondBody > secondStatus
                ) {
                    runTruncatedRequest();
                } else {
                    finish(false);
                }
            });
        });
    });
}

export async function httpPipelinedCloseLifecycle() {
    return new Promise((resolve) => {
        let settled = false;
        const events = [];
        let wire = '';
        const server = http.createServer((req, res) => {
            if (req.url === '/first') {
                setTimeout(() => res.destroy(), 25);
                return;
            }

            res.on('error', () => events.push('error'));
            res.on('finish', () => events.push('finish'));
            res.on('close', () => {
                events.push('close');
                setImmediate(() => finish(
                    events.join(',') === 'close' &&
                    !wire.includes('second')
                ));
            });
            res.end('second');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            server.close(() => resolve(result));
        };

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            const timeout = setTimeout(() => {
                socket.destroy();
                finish(false);
            }, 2000);
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /second HTTP/1.1\r\nHost: localhost\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('error', () => {});
            socket.on('close', () => clearTimeout(timeout));
        });
    });
}

export async function httpPipelinedConnectionClose() {
    return new Promise((resolve) => {
        let settled = false;
        let wire = '';
        let handled = 0;
        let sentLateRequest = false;
        const server = http.createServer((req, res) => {
            handled++;
            res.on('error', () => finish(false));
            if (req.url === '/first') {
                res.setHeader('Connection', 'close');
                res.end('first');
                return;
            }
            res.end('must-not-reach-wire');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /second HTTP/1.1\r\nHost: localhost\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentLateRequest && wire.includes('first')) {
                    sentLateRequest = true;
                    socket.write(
                        'GET /late HTTP/1.1\r\nHost: localhost\r\n\r\n',
                        () => {},
                    );
                }
            });
            socket.on('error', () => finish(false));
            socket.on('end', () => {
                finish(
                    handled === 2 &&
                    sentLateRequest &&
                    (wire.match(/HTTP\/1\.1 200/g) || []).length === 1 &&
                    wire.includes('\r\nConnection: close\r\n') &&
                    wire.includes('first') &&
                    !wire.includes('must-not-reach-wire')
                );
            });
        });
    });
}

export async function httpPipelinedActiveTimeout() {
    return new Promise((resolve) => {
        let settled = false;
        let wire = '';
        let socket;
        const server = http.createServer((req, res) => {
            if (req.url === '/first') {
                res.end('first');
                return;
            }
            setTimeout(() => res.end('second'), 75);
        });
        server.keepAliveTimeout = 20;
        server.timeout = 500;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /second HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('end', () => {
                const first = wire.indexOf('first');
                const secondStatus = wire.indexOf('HTTP/1.1 200', first);
                const second = wire.indexOf('second', secondStatus);
                finish(first !== -1 && secondStatus > first && second > secondStatus);
            });
            socket.on('error', () => finish(false));
        });
    });
}

export async function httpCloseIdleConnections() {
    return new Promise((resolve) => {
        let settled = false;
        let partialSocket;
        let idleSocket;
        let partialResponse = '';
        let idleResponse = '';
        let observedPartialRequest = '';
        let handled = 0;
        let sentLateRequest = false;
        const server = http.createServer((_req, res) => {
            handled++;
            res.on('finish', () => {
                setImmediate(() => server.closeIdleConnections());
            });
            res.end('ok');
        });
        server.keepAliveTimeout = 0;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (partialSocket) partialSocket.destroy();
            if (idleSocket) idleSocket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        let partialObserved = false;
        server.on('connection', (socket) => {
            socket.on('data', (chunk) => {
                if (partialObserved) return;
                observedPartialRequest += chunk.toString('latin1');
                if (observedPartialRequest.includes('GET /partial HTTP/1.1')) {
                    partialObserved = true;
                    idleSocket = net.connect({ port: server.address().port });
                    idleSocket.on('connect', () => {
                        idleSocket.write('GET /idle HTTP/1.1\r\nHost: localhost\r\n\r\n');
                    });
                    idleSocket.on('data', (idleChunk) => {
                        idleResponse += idleChunk.toString('latin1');
                        if (!sentLateRequest && idleResponse.includes('\r\n\r\nok')) {
                            sentLateRequest = true;
                            idleSocket.write(
                                'GET /late HTTP/1.1\r\nHost: localhost\r\n\r\n',
                                () => {},
                            );
                        }
                    });
                    idleSocket.on('close', () => {
                        if (!idleResponse.includes('HTTP/1.1 200') ||
                            !idleResponse.includes('\r\n\r\nok') ||
                            idleResponse.includes('\r\nKeep-Alive:')) {
                            finish(false);
                            return;
                        }
                        partialSocket.write('\r\n\r\n');
                    });
                    idleSocket.on('error', () => finish(false));
                }
            });
        });

        server.listen(0, () => {
            const port = server.address().port;
            partialSocket = net.connect({ port });
            partialSocket.on('connect', () => {
                partialSocket.write(
                    'GET /partial HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    'Connection: close'
                );
            });
            partialSocket.on('data', (chunk) => {
                partialResponse += chunk.toString('latin1');
            });
            partialSocket.on('close', () => {
                finish(
                    handled === 2 &&
                    sentLateRequest &&
                    partialResponse.includes('HTTP/1.1 200') &&
                    partialResponse.includes('\r\n\r\nok')
                );
            });
            partialSocket.on('error', () => finish(false));
        });
    });
}

function getConnectionCount(server) {
    return new Promise((resolve, reject) => {
        server.getConnections((error, count) => {
            if (error) reject(error);
            else resolve(count);
        });
    });
}

function waitForConnectionCount(server, expected, attempts = 25) {
    return new Promise((resolve) => {
        const check = () => {
            server.getConnections((error, count) => {
                if (error || count === expected || attempts-- === 0) {
                    resolve(!error && count === expected);
                } else {
                    setTimeout(check, 20);
                }
            });
        };
        check();
    });
}

export async function httpIdleResourceReclamation() {
    const sockets = new Set();
    let handled = 0;
    const server = http.createServer((_req, res) => {
        handled++;
        res.end('ok');
    });
    server.keepAliveTimeout = 40;

    const closeServer = () =>
        new Promise((resolve) => {
            for (const socket of sockets) socket.destroy();
            server.closeAllConnections();
            if (server.listening) server.close(resolve);
            else resolve();
        });

    try {
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, resolve);
        });

        const runBatch = async (batchSize) => {
            const port = server.address().port;
            await Promise.all(
                Array.from(
                    { length: batchSize },
                    () =>
                        new Promise((resolve, reject) => {
                            let wire = '';
                            let settled = false;
                            const socket = net.connect({ port });
                            sockets.add(socket);
                            const timeout = setTimeout(
                                () => finish(new Error('idle connection did not close')),
                                1500
                            );
                            const finish = (error) => {
                                if (settled) return;
                                settled = true;
                                clearTimeout(timeout);
                                sockets.delete(socket);
                                if (error) reject(error);
                                else resolve();
                            };
                            socket.on('connect', () => {
                                socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
                            });
                            socket.on('data', (chunk) => {
                                wire += chunk.toString('latin1');
                            });
                            socket.on('close', () => {
                                const responseComplete =
                                    wire.includes('HTTP/1.1 200') &&
                                    wire.includes('\r\nConnection: keep-alive\r\n') &&
                                    wire.includes('\r\n\r\n') &&
                                    wire.includes('ok');
                                finish(
                                    responseComplete
                                        ? undefined
                                        : new Error('incomplete keep-alive response')
                                );
                            });
                            socket.on('error', finish);
                        })
                )
            );
            return (await getConnectionCount(server)) === 0;
        };

        const firstReclaimed = await runBatch(6);
        const secondReclaimed = firstReclaimed && (await runBatch(6));
        return firstReclaimed && secondReclaimed && handled === 12;
    } catch (_error) {
        return false;
    } finally {
        await closeServer();
    }
}

export async function httpZeroKeepAliveTimeout() {
    return new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let handled = 0;
        let secondRequestScheduled = false;
        let explicitCleanupRequested = false;
        let closedBeforeExplicitCleanup = false;
        const server = http.createServer((_req, res) => {
            handled++;
            if (handled === 2) {
                res.on('finish', () => {
                    explicitCleanupRequested = true;
                    setImmediate(() => server.closeIdleConnections());
                });
            }
            res.end(`ok-${handled}`);
        });
        server.keepAliveTimeout = 0;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(overallTimeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            const complete = () => resolve(result);
            if (server.listening) server.close(complete);
            else complete();
        };
        const overallTimeout = setTimeout(() => finish(false), 2500);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write('GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n');
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!secondRequestScheduled && handled === 1 && wire.includes('ok-1')) {
                    secondRequestScheduled = true;
                    setTimeout(() => {
                        if (socket.destroyed) {
                            closedBeforeExplicitCleanup = true;
                            finish(false);
                            return;
                        }
                        socket.write('GET /second HTTP/1.1\r\nHost: localhost\r\n\r\n');
                    }, 120);
                }
            });
            socket.on('end', () => {
                if (!explicitCleanupRequested) closedBeforeExplicitCleanup = true;
            });
            socket.on('close', () => {
                const connectionHeaders = wire.match(/\r\nConnection: keep-alive\r\n/g) || [];
                waitForConnectionCount(server, 0).then((countReachedZero) => {
                    finish(
                        countReachedZero &&
                            handled === 2 &&
                            !closedBeforeExplicitCleanup &&
                            connectionHeaders.length === 2 &&
                            !wire.includes('\r\nKeep-Alive:') &&
                            wire.includes('ok-1') &&
                            wire.includes('ok-2')
                    );
                });
            });
            socket.on('error', () => finish(false));
        });
    });
}

export async function httpUnreadRequestBodyDisposal() {
    const runCycle = () => new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let handled = 0;
        let resumed = false;
        let listenerRemoved = false;
        let dumpedBody = '';
        let sentBodyAndNextRequest = false;
        const requestBody = 'unread-body!';
        const server = http.createServer((req, res) => {
            handled++;
            if (req.url === '/early') {
                const ignoredDataListener = () => {};
                req.pause();
                req.on('data', ignoredDataListener);
                req.on('resume', () => {
                    resumed = true;
                    listenerRemoved = req.listenerCount('data') === 0;
                    req.on('data', (chunk) => {
                        dumpedBody += chunk.toString();
                    });
                });
                res.end('early');
                return;
            }
            res.end('next');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 3000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'POST /early HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    `Content-Length: ${Buffer.byteLength(requestBody)}\r\n\r\n`
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentBodyAndNextRequest && wire.includes('early')) {
                    sentBodyAndNextRequest = true;
                    socket.write(
                        requestBody +
                        'GET /next HTTP/1.1\r\n' +
                        'Host: localhost\r\n' +
                        'Connection: close\r\n\r\n'
                    );
                }
            });
            socket.on('end', () => {
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const earlyBody = wire.indexOf('early', firstStatus);
                const secondStatus = wire.indexOf('HTTP/1.1 200', earlyBody);
                const nextBody = wire.indexOf('next', secondStatus);
                finish(
                    handled === 2 &&
                    resumed &&
                    listenerRemoved &&
                    dumpedBody === requestBody &&
                    firstStatus !== -1 &&
                    earlyBody > firstStatus &&
                    secondStatus > earlyBody &&
                    nextBody > secondStatus
                );
            });
            socket.on('error', () => finish(false));
        });
    });

    for (let cycle = 0; cycle < 3; cycle++) {
        if (!await runCycle()) return false;
    }
    return true;
}

export async function httpServerRequestDestroy() {
    const runIncomplete = (
        withError,
        listenForError = withError,
        attachErrorListenerAfterDestroy = false,
        attachErrorListenerOnNextTick = false
    ) => new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let events = [];
        let erroredMatches = false;
        let socketErrorMatches = !withError;
        let socketClosed = false;
        const expectedError = new Error('destroy incomplete request');
        const server = http.createServer((req, _res) => {
            req.socket.on('error', (error) => {
                socketErrorMatches = error === expectedError;
                events.push('socket-error');
            });
            req.socket.on('close', () => {
                socketClosed = true;
                events.push('socket-close');
            });
            req.on('aborted', () => events.push('aborted'));
            const onRequestError = (error) => {
                erroredMatches = error === expectedError;
                events.push(attachErrorListenerOnNextTick ?
                    'nexttick-error' :
                    attachErrorListenerAfterDestroy ? 'late-error' : 'error');
            };
            if (listenForError && !attachErrorListenerAfterDestroy) {
                req.on('error', onRequestError);
            }
            req.on('close', () => {
                events.push('close');
            });
            req.destroy(withError ? expectedError : undefined);
            if (listenForError && attachErrorListenerAfterDestroy) {
                if (attachErrorListenerOnNextTick) {
                    process.nextTick(() => req.on('error', onRequestError));
                } else {
                    req.on('error', onRequestError);
                }
            }
            if (!listenForError) {
                erroredMatches = withError ?
                    req.errored === expectedError : req.errored === null;
            }
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'POST /incomplete HTTP/1.1\r\n' +
                    'Host: localhost\r\nContent-Length: 5\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('close', () => {
                setImmediate(() => {
                    server.getConnections((error, count) => {
                        const errorEvent = attachErrorListenerOnNextTick ?
                            'nexttick-error' :
                            attachErrorListenerAfterDestroy ? 'late-error' : 'error';
                        const terminalEvents = withError ?
                            events.filter((event) => event !== 'socket-close') : events;
                        const expectedEvents = withError ?
                            listenForError ?
                                `aborted,socket-error,${errorEvent},close` :
                                'aborted,socket-error,close' :
                            'aborted,socket-close,close';
                        finish(
                            !error &&
                            count === 0 &&
                            wire === '' &&
                            erroredMatches &&
                            socketErrorMatches &&
                            socketClosed &&
                            terminalEvents.join(',') === expectedEvents
                        );
                    });
                });
            });
            socket.on('error', () => {});
        });
    });

    const runCompletedError = () => new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let handled = 0;
        let connections = 0;
        let completeAtDestroy = false;
        let errorObserved = false;
        let requestClosed = false;
        let requestAborted = false;
        let sentSecond = false;
        const expectedError = new Error('destroy completed request');
        const server = http.createServer((req, res) => {
            handled++;
            if (req.url === '/first') {
                req.on('aborted', () => {
                    requestAborted = true;
                });
                req.on('error', (error) => {
                    errorObserved = error === expectedError;
                });
                req.on('close', () => {
                    requestClosed = true;
                });
                req.on('end', () => {
                    completeAtDestroy = req.complete && req.readableEnded;
                    req.destroy(expectedError);
                    res.end('first');
                });
                req.resume();
                return;
            }
            res.end('second');
        });
        server.on('connection', () => {
            connections++;
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 3000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write('GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n');
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentSecond && wire.includes('first')) {
                    sentSecond = true;
                    socket.write(
                        'GET /second HTTP/1.1\r\n' +
                        'Host: localhost\r\nConnection: close\r\n\r\n'
                    );
                }
            });
            socket.on('end', () => {
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const firstBody = wire.indexOf('first', firstStatus);
                const secondStatus = wire.indexOf('HTTP/1.1 200', firstBody);
                const secondBody = wire.indexOf('second', secondStatus);
                finish(
                    handled === 2 &&
                    connections === 1 &&
                    completeAtDestroy &&
                    errorObserved &&
                    requestClosed &&
                    !requestAborted &&
                    firstStatus !== -1 &&
                    firstBody > firstStatus &&
                    secondStatus > firstBody &&
                    secondBody > secondStatus
                );
            });
            socket.on('error', () => finish(false));
        });
    });

    return await runIncomplete(true) &&
        await runIncomplete(true, true, true) &&
        await runIncomplete(true, true, true, true) &&
        await runIncomplete(true, false) &&
        await runIncomplete(false) &&
        await runCompletedError();
}

export async function httpPartiallyConsumedRequestBody() {
    return new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let handled = 0;
        let partialRequest;
        let firstChunk = '';
        let unexpectedResume = false;
        let sentRemainderAndNext = false;
        const firstPart = 'part-';
        const remainder = 'body!';
        const server = http.createServer((req, res) => {
            handled++;
            if (req.url === '/partial') {
                partialRequest = req;
                req.once('data', (chunk) => {
                    firstChunk = chunk.toString();
                    req.pause();
                    req.on('resume', () => {
                        unexpectedResume = true;
                    });
                    res.end('early');
                });
                return;
            }
            res.end('next');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 3000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'POST /partial HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    `Content-Length: ${Buffer.byteLength(firstPart + remainder)}\r\n\r\n` +
                    firstPart
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentRemainderAndNext && wire.includes('early')) {
                    sentRemainderAndNext = true;
                    socket.write(
                        remainder +
                        'GET /next HTTP/1.1\r\n' +
                        'Host: localhost\r\n' +
                        'Connection: close\r\n\r\n'
                    );
                }
            });
            socket.on('end', () => {
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const earlyBody = wire.indexOf('early', firstStatus);
                const secondStatus = wire.indexOf('HTTP/1.1 200', earlyBody);
                const nextBody = wire.indexOf('next', secondStatus);
                finish(
                    handled === 2 &&
                    firstChunk === firstPart &&
                    partialRequest.complete &&
                    !unexpectedResume &&
                    firstStatus !== -1 &&
                    earlyBody > firstStatus &&
                    secondStatus > earlyBody &&
                    nextBody > secondStatus
                );
            });
            socket.on('error', () => finish(false));
        });
    });
}

export async function httpResumeScheduledRequestBody() {
    return new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let handled = 0;
        let listenerPreserved = false;
        let receivedBody = '';
        let sentBodyAndNextRequest = false;
        const requestBody = 'scheduled-body';
        const server = http.createServer((req, res) => {
            handled++;
            if (req.url === '/scheduled') {
                req.on('data', (chunk) => {
                    receivedBody += chunk.toString();
                });
                req.resume();
                res.end('early');
                listenerPreserved = req.listenerCount('data') === 1;
                return;
            }
            res.end('next');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 3000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'POST /scheduled HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    `Content-Length: ${Buffer.byteLength(requestBody)}\r\n\r\n`
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentBodyAndNextRequest && wire.includes('early')) {
                    sentBodyAndNextRequest = true;
                    socket.write(
                        requestBody +
                        'GET /next HTTP/1.1\r\n' +
                        'Host: localhost\r\n' +
                        'Connection: close\r\n\r\n'
                    );
                }
            });
            socket.on('end', () => {
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const earlyBody = wire.indexOf('early', firstStatus);
                const secondStatus = wire.indexOf('HTTP/1.1 200', earlyBody);
                const nextBody = wire.indexOf('next', secondStatus);
                finish(
                    handled === 2 &&
                    listenerPreserved &&
                    receivedBody === requestBody &&
                    firstStatus !== -1 &&
                    earlyBody > firstStatus &&
                    secondStatus > earlyBody &&
                    nextBody > secondStatus
                );
            });
            socket.on('error', () => finish(false));
        });
    });
}

export async function httpCompleteUnreadRequestBody() {
    return new Promise((resolve) => {
        let settled = false;
        let socket;
        let wire = '';
        let handled = 0;
        let completeBeforeResponse = false;
        let resumed = false;
        let listenerRemoved = false;
        let dumpedBody = '';
        const requestBody = 'buffered-body';
        const server = http.createServer((req, res) => {
            handled++;
            if (req.url === '/buffered') {
                req.pause();
                req.on('data', () => {});
                req.on('resume', () => {
                    resumed = true;
                    listenerRemoved = req.listenerCount('data') === 0;
                    req.on('data', (chunk) => {
                        dumpedBody += chunk.toString();
                    });
                });
                setImmediate(() => {
                    completeBeforeResponse = req.complete;
                    res.end('early');
                });
                return;
            }
            res.end('next');
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 3000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'POST /buffered HTTP/1.1\r\n' +
                    'Host: localhost\r\n' +
                    `Content-Length: ${Buffer.byteLength(requestBody)}\r\n\r\n` +
                    requestBody +
                    'GET /next HTTP/1.1\r\n' +
                    'Host: localhost\r\nConnection: close\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('end', () => {
                const firstStatus = wire.indexOf('HTTP/1.1 200');
                const earlyBody = wire.indexOf('early', firstStatus);
                const secondStatus = wire.indexOf('HTTP/1.1 200', earlyBody);
                const nextBody = wire.indexOf('next', secondStatus);
                finish(
                    handled === 2 &&
                    completeBeforeResponse &&
                    resumed &&
                    listenerRemoved &&
                    dumpedBody === requestBody &&
                    firstStatus !== -1 &&
                    earlyBody > firstStatus &&
                    secondStatus > earlyBody &&
                    nextBody > secondStatus
                );
            });
            socket.on('error', () => finish(false));
        });
    });
}

export async function httpClientResponseOwnership() {
    const server = http.createServer((_req, res) => {
        res.end('response-body');
    });
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const unownedDisposed = await new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(result);
        };
        const timeout = setTimeout(() => finish(false), 3000);
        const req = http.request({ port, path: '/unowned' });
        req.on('error', () => finish(false));
        req.on('close', () => {
            const response = req._response;
            const checkComplete = (attempts) => {
                if (response && response.complete) {
                    finish(response._dumped === true);
                } else if (attempts > 0) {
                    setTimeout(() => checkComplete(attempts - 1), 10);
                } else {
                    finish(false);
                }
            };
            checkComplete(50);
        });
        req.end();
    });

    const ownedDelayed = await new Promise((resolve) => {
        let settled = false;
        let body = '';
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(result);
        };
        const timeout = setTimeout(() => finish(false), 3000);
        const req = http.request({ port, path: '/owned' }, (res) => {
            const untouched = res._dumped === false && res.readableFlowing === null;
            setTimeout(() => {
                res.on('data', (chunk) => {
                    body += chunk.toString();
                });
                res.on('end', () => {
                    finish(untouched && body === 'response-body');
                });
            }, 25);
        });
        req.on('error', () => finish(false));
        req.end();
    });

    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    return unownedDisposed && ownedDelayed;
}

export async function httpInformationalWriteAfterClose() {
    return new Promise((resolve) => {
        let settled = false;
        let callbackCount = 0;
        let finishCount = 0;
        let closeCount = 0;
        const server = http.createServer((_req, res) => {
            res.on('finish', () => {
                finishCount++;
            });
            res.socket.once('close', () => {
                closeCount++;
                setTimeout(() => {
                    finish(
                        callbackCount === 0 &&
                        finishCount === 0 &&
                        closeCount === 1
                    );
                }, 30);
            });

            res.socket.destroy();
            res.writeEarlyHints(
                { link: '</after-close.js>; rel=preload' },
                () => {
                    callbackCount++;
                }
            );
            res.end('unwritten', () => {
                callbackCount++;
            });
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
            });
            socket.on('error', () => {});
        });
    });
}

export async function httpMaxRequestsClosesSocket() {
    return new Promise((resolve) => {
        let settled = false;
        let wire = '';
        let socket;
        let requestCount = 0;
        let dropped = 0;
        let sentOverflow = false;
        const server = http.createServer((_req, res) => {
            requestCount++;
            res.end('only');
        });
        server.maxRequestsPerSocket = 1;
        server.keepAliveTimeout = 1000;
        server.on('dropRequest', () => {
            dropped++;
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                if (!sentOverflow &&
                    wire.includes('HTTP/1.1 200') &&
                    wire.includes('\r\n\r\nonly')) {
                    sentOverflow = true;
                    socket.write('GET /overflow HTTP/1.1\r\nHost: localhost\r\n\r\n');
                }
            });
            socket.on('error', () => finish(false));
            socket.on('end', () => {
                const first = wire.indexOf('HTTP/1.1 200');
                const overflow = wire.indexOf('HTTP/1.1 503 Service Unavailable', first + 1);
                const closeHeader = wire.toLowerCase().indexOf('connection: close', first);
                const overflowHeadersEnd = wire.indexOf('\r\n\r\n', overflow);
                const overflowHeaders = wire.slice(overflow, overflowHeadersEnd);
                const overflowBody = wire.slice(overflowHeadersEnd + 4);
                finish(
                    sentOverflow &&
                    requestCount === 1 &&
                    dropped === 1 &&
                    first !== -1 &&
                    closeHeader > first &&
                    closeHeader < overflow &&
                    wire.indexOf('only', first) > first &&
                    overflow > first &&
                    /Transfer-Encoding: chunked/i.test(overflowHeaders) &&
                    !/Content-Length:/i.test(overflowHeaders) &&
                    overflowBody === '0\r\n\r\n'
                );
            });
        });
    });
}

export async function netWritevBoundaries() {
    const runBatch = (sizes) => new Promise((resolve) => {
        const expected = sizes.map((size, index) =>
            Buffer.alloc(size, 65 + index)
        );
        const expectedWire = Buffer.concat(expected);
        let received = Buffer.alloc(0);
        let callbackCount = 0;
        let settled = false;

        const server = net.createServer((socket) => {
            socket.on('data', (chunk) => {
                received = Buffer.concat([received, chunk]);
            });
            socket.on('end', () => {
                socket.end();
            });
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            const socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.cork();
                for (const buffer of expected) {
                    socket.write(buffer, (error) => {
                        callbackCount++;
                        if (error) finish(false);
                    });
                }
                socket.end();
            });
            socket.on('close', () => {
                clearTimeout(timeout);
                finish(
                    callbackCount === expected.length &&
                    received.equals(expectedWire)
                );
            });
            socket.on('error', () => finish(false));
        });
    });

    return await runBatch([32 * 1024, 32 * 1024]) &&
        await runBatch([32 * 1024, 32 * 1024, 1]);
}

export async function netWriteTimeoutLifecycle() {
    const wait = (msecs) => new Promise((resolve) => setTimeout(resolve, msecs));

    // Node ignores all timeout arguments after destruction. On a live socket,
    // it replaces the timer before validating the optional listener.
    const destroyed = new net.Socket();
    destroyed.destroy();
    let destroyedOrdering = false;
    try {
        destroyedOrdering = destroyed.setTimeout('invalid', 'invalid') === destroyed;
    } catch (_) {}

    const live = new net.Socket();
    let scheduledTimeouts = 0;
    let invalidCallbackCode;
    live.on('timeout', () => { scheduledTimeouts++; });
    try {
        live.setTimeout(5, 'invalid');
    } catch (error) {
        invalidCallbackCode = error.code;
    }
    await wait(20);
    live.destroy();
    const validationOrdering = destroyedOrdering &&
        invalidCallbackCode === 'ERR_INVALID_ARG_TYPE' && scheduledTimeouts === 1;

    const invalidTypeSocket = new net.Socket();
    let invalidTypeCode;
    try {
        invalidTypeSocket.setTimeout('invalid');
    } catch (error) {
        invalidTypeCode = error.code;
    }
    const invalidRangeSocket = new net.Socket();
    let invalidRangeCode;
    try {
        invalidRangeSocket.setTimeout(Infinity);
    } catch (error) {
        invalidRangeCode = error.code;
    }
    const invalidValueOrdering = invalidTypeCode === 'ERR_INVALID_ARG_TYPE' &&
        invalidTypeSocket.timeout === 'invalid' &&
        invalidRangeCode === 'ERR_OUT_OF_RANGE' &&
        invalidRangeSocket.timeout === Infinity;
    invalidTypeSocket.destroy();
    invalidRangeSocket.destroy();

    // Socket timeouts share the timer duration normalizer, while retaining the
    // unmodified public value.
    let overflowWarning;
    const originalEmitWarning = process.emitWarning;
    const overflowSocket = new net.Socket();
    try {
        process.emitWarning = (message, type) => { overflowWarning = { message, type }; };
        overflowSocket.setTimeout(2 ** 31);
    } finally {
        process.emitWarning = originalEmitWarning;
    }
    const normalizedOverflow = overflowSocket.timeout === 2 ** 31 &&
        overflowWarning?.type === 'TimeoutOverflowWarning' &&
        overflowWarning.message.includes('truncated to 2147483647');
    overflowSocket.setTimeout(0);
    overflowSocket.destroy();

    if (!validationOrdering || !invalidValueOrdering || !normalizedOverflow) {
        throw new Error(`socket timeout validation: ${JSON.stringify({
            destroyedOrdering, invalidCallbackCode, scheduledTimeouts,
            invalidTypeCode, invalidRangeCode, invalidValueOrdering, normalizedOverflow,
        })}`);
    }

    // Keep the exact queue-size policy deterministic as a supplement to the
    // public TCP lifecycle below: any changed sample, including an increase or
    // draining to zero, denotes write activity and buys another interval;
    // only an unchanged sample emits.
    const policySocket = new net.Socket();
    let policyPending = 64;
    let policyResets = 0;
    let policyTimeouts = 0;
    policySocket._handle = {
        writeQueueSize: 64,
        _writeInFlight: true,
        write_queue_size: () => policyPending,
        close() {},
    };
    policySocket._lastWriteQueueSize = 64;
    policySocket._resetTimeout = () => { policyResets++; };
    policySocket.on('timeout', () => { policyTimeouts++; });
    policyPending = 96;
    policySocket._onTimeout();
    const increasingProgress = policyResets === 1 && policyTimeouts === 0 &&
        policySocket._lastWriteQueueSize === 96;
    policyPending = 32;
    policySocket._onTimeout();
    policyPending = 0;
    policySocket._onTimeout();
    policySocket._onTimeout();
    const progressPolicy = increasingProgress &&
        policyResets === 3 && policyTimeouts === 1 &&
        policySocket._lastWriteQueueSize === 0;
    policySocket.destroy();
    if (!progressPolicy) {
        throw new Error(`socket timeout progress policy: ${JSON.stringify({
            increasingProgress, policyResets, policyTimeouts, policyPending,
        })}`);
    }

    // Start with no timeout, then enable, disable, replace, and shorten it after
    // a real native write is pending. A stalled timeout is advisory; the first
    // event must leave the socket open, and a listener may explicitly rearm it.
    const stalledWrite = await new Promise((resolve) => {
        let client;
        let writer;
        let fallback;
        let settled = false;
        let firstWriteCallbacks = 0;
        let secondWriteCallbacks = 0;
        let writeErrors = 0;
        let firstWriteCallbacksBeforeDestroy;
        let secondWriteCallbacksBeforeDestroy;
        let writeErrorsBeforeDestroy;
        let timeoutCount = 0;
        let uncaughtTimeouts = 0;
        let openAtFirstTimeout = false;
        let firstTimeoutElapsed = 0;
        let secondTimeoutElapsed = 0;
        let rearmedAt = 0;
        let resumedBytes = 0;
        let resumedThenPaused = false;
        let writerClosed = false;
        let writesSettled = false;
        let settlementCheckScheduled = false;
        const timeoutListenerError = new Error('GOL-389 timeout listener');
        const onUncaughtException = (error) => {
            if (error === timeoutListenerError) uncaughtTimeouts++;
        };
        process.once('uncaughtException', onUncaughtException);
        const server = net.createServer((socket) => {
            writer = socket;
            const configuredAt = Date.now();
            socket.on('error', () => {});
            socket.on('close', () => {
                writerClosed = true;
                maybeFinish();
            });
            socket.on('timeout', () => {
                timeoutCount++;
                if (timeoutCount === 1) {
                    openAtFirstTimeout = !socket.destroyed;
                    firstTimeoutElapsed = Date.now() - configuredAt;
                    // Widen the window in which the JS timer wins the race with
                    // the native P2 deadline, then replace that native deadline.
                    const rearmAt = Date.now() + 50;
                    while (Date.now() < rearmAt) {
                        // Keep the listener active until the old native deadline is due.
                    }
                    client.resume();
                    rearmedAt = Date.now();
                    socket.setTimeout(750);
                } else {
                    secondTimeoutElapsed = Date.now() - rearmedAt;
                    firstWriteCallbacksBeforeDestroy = firstWriteCallbacks;
                    secondWriteCallbacksBeforeDestroy = secondWriteCallbacks;
                    writeErrorsBeforeDestroy = writeErrors;
                    socket.destroy();
                }
            });
            socket.once('timeout', () => { throw timeoutListenerError; });
            const chunk = Buffer.alloc(64 * 1024 * 1024);
            const onFirstWrite = (error) => {
                firstWriteCallbacks++;
                if (error) writeErrors++;
                writesSettled = firstWriteCallbacks > 0 && secondWriteCallbacks > 0;
                maybeFinish();
            };
            const onSecondWrite = (error) => {
                secondWriteCallbacks++;
                if (error) writeErrors++;
                writesSettled = firstWriteCallbacks > 0 && secondWriteCallbacks > 0;
                maybeFinish();
            };
            socket.write(chunk, onFirstWrite);
            socket.write(chunk, onSecondWrite);
            socket.setTimeout(5);
            socket.setTimeout(0);
            socket.setTimeout(100);
            socket.setTimeout(25);
        });
        function maybeFinish() {
            if (!writerClosed || !writesSettled || settlementCheckScheduled) return;
            settlementCheckScheduled = true;
            setTimeout(() => {
                finish({
                    timeoutCount,
                    openAtFirstTimeout,
                    firstTimeoutElapsed,
                    secondTimeoutElapsed,
                    resumedBytes,
                    resumedThenPaused,
                    firstWriteCallbacks,
                    secondWriteCallbacks,
                    writeErrors,
                    firstWriteCallbacksBeforeDestroy,
                    secondWriteCallbacksBeforeDestroy,
                    writeErrorsBeforeDestroy,
                    uncaughtTimeouts,
                });
            }, 10);
        }
        function finish(result) {
            if (settled) return;
            settled = true;
            process.removeListener('uncaughtException', onUncaughtException);
            clearTimeout(fallback);
            if (writer) writer.destroy();
            if (client) client.destroy();
            server.close(() => resolve(result));
        }
        server.once('error', () => finish({ error: 'server' }));
        server.listen(0, '127.0.0.1', () => {
            client = net.connect(server.address().port, '127.0.0.1');
            client.on('data', (chunk) => {
                if (timeoutCount !== 1) return;
                resumedBytes += chunk.length;
                if (!resumedThenPaused && resumedBytes >= 64 * 1024) {
                    resumedThenPaused = true;
                    client.pause();
                }
            });
            client.pause();
            client.once('error', () => finish({ error: 'client' }));
            fallback = setTimeout(() => finish({
                error: 'fallback',
                timeoutCount,
                openAtFirstTimeout,
                firstTimeoutElapsed,
                secondTimeoutElapsed,
                resumedBytes,
                resumedThenPaused,
                firstWriteCallbacks,
                secondWriteCallbacks,
                writeErrors,
                firstWriteCallbacksBeforeDestroy,
                secondWriteCallbacksBeforeDestroy,
                writeErrorsBeforeDestroy,
                uncaughtTimeouts,
                writerClosed,
                writesSettled,
            }), 10000);
        });
    });

    const stalledWritePassed = stalledWrite.timeoutCount === 2 &&
        stalledWrite.openAtFirstTimeout &&
        stalledWrite.firstTimeoutElapsed >= 50 &&
        stalledWrite.secondTimeoutElapsed >= 650 &&
        stalledWrite.resumedBytes >= 64 * 1024 &&
        stalledWrite.resumedThenPaused &&
        stalledWrite.firstWriteCallbacks === 1 &&
        stalledWrite.secondWriteCallbacks === 1 &&
        stalledWrite.firstWriteCallbacksBeforeDestroy +
            stalledWrite.secondWriteCallbacksBeforeDestroy < 2 &&
        stalledWrite.secondWriteCallbacksBeforeDestroy === 0 &&
        stalledWrite.writeErrorsBeforeDestroy === 0 &&
        stalledWrite.writeErrors >= 1 &&
        stalledWrite.uncaughtTimeouts === 1 &&
        stalledWrite.error === undefined;
    if (!stalledWritePassed) {
        throw new Error(`socket timeout stalled write: ${JSON.stringify(stalledWrite)}`);
    }

    // After a real write drains, ordinary idle timeout semantics resume.
    const drainedWrite = await new Promise((resolve) => {
        let client;
        let writer;
        let fallback;
        let settled = false;
        let writeComplete = false;
        let timeoutDuringWrite = false;
        const server = net.createServer((socket) => {
            writer = socket;
            socket.setTimeout(100);
            socket.on('error', () => finish({ ok: false, reason: 'writer-error' }));
            socket.on('timeout', () => {
                if (!writeComplete) timeoutDuringWrite = true;
                finish({
                    ok: writeComplete && !timeoutDuringWrite && !socket.destroyed,
                    reason: 'timeout',
                    writeComplete,
                    timeoutDuringWrite,
                    destroyed: socket.destroyed,
                });
            });
            socket.write(Buffer.alloc(1024 * 1024), (error) => {
                if (error) return finish({ ok: false, reason: 'write-callback' });
                writeComplete = true;
            });
        });
        function finish(result) {
            if (settled) return;
            settled = true;
            clearTimeout(fallback);
            if (writer) writer.destroy();
            if (client) client.destroy();
            server.close(() => resolve(result));
        }
        server.once('error', () => finish({ ok: false, reason: 'server-error' }));
        server.listen(0, '127.0.0.1', () => {
            client = net.connect(server.address().port, '127.0.0.1');
            client.on('data', () => {
                client.pause();
                setTimeout(() => client.resume(), 1);
            });
            client.once('error', () => finish({ ok: false, reason: 'client-error' }));
            fallback = setTimeout(() => finish({
                ok: false,
                reason: 'fallback',
                writeComplete,
                timeoutDuringWrite,
            }), 10000);
        });
    });

    if (!drainedWrite.ok) {
        throw new Error(`socket timeout drained write: ${JSON.stringify(drainedWrite)}`);
    }
    const result = validationOrdering && normalizedOverflow && progressPolicy && drainedWrite.ok &&
        stalledWritePassed;
    return result;
}

export async function netWriteProfile(chunkSize, chunkCount, corked) {
    const startedAt = Date.now();
    const expectedBytes = chunkSize * chunkCount;
    let receivedBytes = 0;
    let falseWrites = 0;
    let snapshot = null;
    let receiver = null;

    const server = net.createServer((socket) => {
        socket.on('data', (chunk) => {
            receivedBytes += chunk.length;
            if (!receiver && receivedBytes >= expectedBytes) {
                receiver = socket._handle.get_write_profile();
            }
        });
        socket.on('end', () => socket.end());
    });

    await new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(0, resolve);
    });

    const socket = net.connect({ port: server.address().port });
    await new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('error', reject);
    });

    const writeOnce = (buffer) => new Promise((resolve, reject) => {
        if (!socket.write(buffer, (error) => error ? reject(error) : resolve())) {
            falseWrites++;
        }
    });

    if (corked) {
        socket.cork();
        const writes = [];
        for (let index = 0; index < chunkCount; index++) {
            writes.push(writeOnce(Buffer.alloc(chunkSize, 65 + (index % 26))));
        }
        socket.uncork();
        await Promise.all(writes);
    } else {
        for (let index = 0; index < chunkCount; index++) {
            await writeOnce(Buffer.alloc(chunkSize, 65 + (index % 26)));
        }
    }

    snapshot = socket._handle.get_write_profile();
    socket.end();
    await new Promise((resolve, reject) => {
        socket.once('close', resolve);
        socket.once('error', reject);
    });
    await new Promise((resolve) => server.close(resolve));

    return JSON.stringify({
        chunkSize,
        chunkCount,
        corked,
        expectedBytes,
        receivedBytes,
        falseWrites,
        wallMs: Date.now() - startedAt,
        receiver,
        ...snapshot,
    });
}

export async function httpPipelinedMaxRequests() {
    return new Promise((resolve) => {
        let settled = false;
        let wire = '';
        let socket;
        const server = http.createServer((_req, res) => res.end('first'));
        let dropped = 0;
        let droppedTypesValid = true;
        server.maxRequestsPerSocket = 1;
        server.on('dropRequest', (req, droppedSocket) => {
            dropped++;
            droppedTypesValid = droppedTypesValid &&
                req instanceof http.IncomingMessage &&
                droppedSocket instanceof net.Socket &&
                req.client === droppedSocket &&
                req.connection === droppedSocket &&
                Array.isArray(req.rawTrailers) &&
                req.rawTrailers.length === 0;
        });

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            server.close(() => resolve(result));
        };
        const timeout = setTimeout(() => finish(false), 2000);

        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(
                    'GET /first HTTP/1.1\r\nHost: localhost\r\n\r\n' +
                    'GET /overflow HTTP/1.1\r\nHost: localhost\r\n\r\n'
                );
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
            });
            socket.on('error', () => finish(false));
            socket.on('end', () => {
                const first = wire.indexOf('HTTP/1.1 200');
                const firstBody = wire.indexOf('first', first);
                const overflow = wire.indexOf('HTTP/1.1 503 Service Unavailable');
                const overflowHeadersEnd = wire.indexOf('\r\n\r\n', overflow);
                const overflowHeaders = wire.slice(overflow, overflowHeadersEnd);
                const overflowBody = wire.slice(overflowHeadersEnd + 4);
                finish(
                    dropped === 1 &&
                    droppedTypesValid &&
                    first !== -1 &&
                    firstBody > first &&
                    overflow > firstBody &&
                    !wire.includes('first', overflow) &&
                    /Transfer-Encoding: chunked/i.test(overflowHeaders) &&
                    !/Content-Length:/i.test(overflowHeaders) &&
                    overflowBody === '0\r\n\r\n'
                );
            });
        });
    });
}

export async function httpCustomConnectionRejected() {
    const rejectsAsynchronously = await new Promise((resolve) => {
        let hookCalled = false;
        let responseReceived = false;
        let errorCode = null;
        const req = http.request({
            hostname: 'example.invalid',
            createConnection() {
                hookCalled = true;
                throw new Error('custom connection hook must not run');
            },
        }, () => {
            responseReceived = true;
        });
        const initiallyDestroyed = req.destroyed;
        req.on('error', (error) => {
            errorCode = error.code;
        });
        req.on('close', () => {
            resolve(
                !initiallyDestroyed &&
                errorCode === 'ENOSYS' &&
                !hookCalled &&
                !responseReceived
            );
        });
        req.end();
    });

    const destroyBeforeRejection = await new Promise((resolve) => {
        let hookCalled = false;
        let errorReceived = false;
        const req = new http.ClientRequest({
            createConnection() {
                hookCalled = true;
            },
        });
        req.on('error', () => {
            errorReceived = true;
        });
        req.on('close', () => {
            resolve(!hookCalled && !errorReceived);
        });
        if (req.destroy() !== req) {
            resolve(false);
        }
    });

    const agentHookIgnoredExplicitly = await new Promise((resolve) => {
        let hookCalls = 0;
        let warningCount = 0;
        let closedCount = 0;
        class CustomAgent extends http.Agent {
            createConnection() {
                hookCalls += 1;
                throw new Error('agent custom connection hook must not run');
            }
        }
        const ownHookAgent = new http.Agent();
        ownHookAgent.createConnection = () => {
            hookCalls += 1;
            throw new Error('agent own custom connection hook must not run');
        };
        const onWarning = (warning) => {
            if (
                warning.code === 'WASM_RQUICKJS_HTTP_AGENT_TRANSPORT' &&
                warning.message.includes('outbound requests use wasi:http')
            ) {
                warningCount += 1;
            }
        };
        process.on('warning', onWarning);
        for (const agent of [new CustomAgent(), ownHookAgent]) {
            const req = http.request({
                hostname: 'example.invalid',
                agent,
            });
            req.on('error', () => {});
            req.on('close', () => {
                closedCount += 1;
                if (closedCount === 2) {
                    process.nextTick(() => {
                        process.removeListener('warning', onWarning);
                        resolve(hookCalls === 0 && warningCount === 1);
                    });
                }
            });
            req.destroy();
        }
    });

    const connectDoesNotOpenSocket = await new Promise((resolve) => {
        let hookCalled = false;
        let errorReceived = false;
        const req = new http.ClientRequest({
            method: 'CONNECT',
            createConnection() {
                hookCalled = true;
            },
        });
        const initiallySocketless = req.socket === null;
        req.on('error', () => {
            errorReceived = true;
        });
        req.on('close', () => {
            resolve(initiallySocketless && req.socket === null && !hookCalled && !errorReceived);
        });
        req.destroy();
    });

    const plainConnectRejected = await new Promise((resolve) => {
        let connectReceived = false;
        let rejectedAsUnsupported = false;
        const req = new http.ClientRequest({
            method: 'CONNECT',
            hostname: 'example.invalid',
        });
        const initiallySocketless = req.socket === null;
        req.on('connect', () => {
            connectReceived = true;
        });
        req.on('error', (error) => {
            rejectedAsUnsupported = error.code === 'ENOSYS' &&
                error.message.includes('outbound requests use wasi:http');
        });
        req.on('close', () => {
            resolve(
                initiallySocketless &&
                req.socket === null &&
                !connectReceived &&
                rejectedAsUnsupported
            );
        });
        req.end();
    });

    return rejectsAsynchronously && agentHookIgnoredExplicitly && destroyBeforeRejection &&
        connectDoesNotOpenSocket && plainConnectRejected;
}

export async function httpResponsePersistence() {
    const runCase = (options) => new Promise((resolve) => {
        let settled = false;
        let wire = '';
        let responseComplete = false;
        let serverBehaviorMatch = true;
        let socketEnded = false;
        let socket;
        const server = http.createServer((_req, res) => {
            if (options.serverCloseBeforeCommit) {
                server.close();
            }
            for (const [name, value] of options.headers || []) {
                res.setHeader(name, value);
            }
            if (options.removeConnection) {
                res.removeHeader('Connection');
            }
            if (options.removeFraming) {
                res.removeHeader('Connection');
                res.removeHeader('Content-Length');
                res.removeHeader('Transfer-Encoding');
            }
            if (options.writeHeadFirst) {
                res.writeHead(options.statusCode || 200);
            }
            if (options.mutateAfterWriteHead) {
                let mutationErrors = 0;
                try {
                    res.setHeader('X-Late', 'rejected');
                } catch (error) {
                    mutationErrors += error.code === 'ERR_HTTP_HEADERS_SENT' ? 1 : 0;
                }
                try {
                    res.removeHeader('Connection');
                } catch (error) {
                    mutationErrors += error.code === 'ERR_HTTP_HEADERS_SENT' ? 1 : 0;
                }
                options.headers[0][1].push('close');
                serverBehaviorMatch = mutationErrors === 2;
            }
            res.end(options.noBody ? undefined : 'ok');
        });
        if (Object.hasOwn(options, 'keepAliveTimeout')) {
            server.keepAliveTimeout = options.keepAliveTimeout;
        }
        if (Object.hasOwn(options, 'maxRequestsPerSocket')) {
            server.maxRequestsPerSocket = options.maxRequestsPerSocket;
        }

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (socket) socket.destroy();
            server.closeAllConnections();
            if (server.listening) {
                server.close(() => resolve(result));
            } else {
                resolve(result);
            }
        };

        const headerValues = (name) => {
            const headerEnd = wire.indexOf('\r\n\r\n');
            if (headerEnd === -1) return [];
            const prefix = name.toLowerCase() + ':';
            return wire.slice(0, headerEnd).split('\r\n')
                .filter((line) => line.toLowerCase().startsWith(prefix))
                .map((line) => line.slice(line.indexOf(':') + 1).trim());
        };

        const headersMatch = () => {
            const primaryMatch = JSON.stringify(headerValues('connection')) ===
                JSON.stringify(options.connection || []) &&
            JSON.stringify(headerValues('keep-alive')) ===
                JSON.stringify(options.keepAlive || []);
            const contentLengthMatch = !Object.hasOwn(options, 'contentLength') ||
                JSON.stringify(headerValues('content-length')) ===
                    JSON.stringify(options.contentLength);
            const transferEncodingMatch = !Object.hasOwn(options, 'transferEncoding') ||
                JSON.stringify(headerValues('transfer-encoding')) ===
                    JSON.stringify(options.transferEncoding);
            const noChunkTerminatorMatch = !options.noChunkTerminator ||
                !wire.slice(wire.indexOf('\r\n\r\n') + 4).includes('0\r\n\r\n');
            return serverBehaviorMatch && primaryMatch && contentLengthMatch &&
                transferEncodingMatch && noChunkTerminatorMatch;
        };

        const timeout = setTimeout(() => finish(false), 1500);
        server.listen(0, () => {
            socket = net.connect({ port: server.address().port });
            socket.on('connect', () => {
                socket.write(options.request ||
                    'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
            });
            socket.on('data', (chunk) => {
                wire += chunk.toString('latin1');
                const body = wire.slice(wire.indexOf('\r\n\r\n') + 4);
                if (!responseComplete &&
                    wire.includes('\r\n\r\n') &&
                    (options.noBody || body.includes('ok'))) {
                    responseComplete = true;
                    if (!options.expectEnd) {
                        setTimeout(() => finish(headersMatch() && !socketEnded), 30);
                    }
                }
            });
            socket.on('end', () => {
                socketEnded = true;
                if (options.expectEnd) {
                    finish(responseComplete && headersMatch());
                } else {
                    finish(false);
                }
            });
            socket.on('error', () => finish(false));
        });
    });

    const cases = [
        { connection: ['keep-alive'], keepAlive: ['timeout=5'] },
        { keepAliveTimeout: 0, connection: ['keep-alive'] },
        { keepAliveTimeout: null, connection: ['keep-alive'] },
        { keepAliveTimeout: undefined, connection: ['keep-alive'] },
        { keepAliveTimeout: NaN, connection: ['keep-alive'] },
        { keepAliveTimeout: -1, connection: ['keep-alive'], keepAlive: ['timeout=-1'] },
        { keepAliveTimeout: 500, connection: ['keep-alive'], keepAlive: ['timeout=0'] },
        { keepAliveTimeout: 1500, connection: ['keep-alive'], keepAlive: ['timeout=1'] },
        { headers: [['Connection', 'keep-alive']], connection: ['keep-alive'] },
        { headers: [['Connection', 'close']], connection: ['close'], expectEnd: true },
        { headers: [['Connection', ['close']]], connection: ['close'], expectEnd: true },
        {
            headers: [['Connection', ['keep-alive', 'close']]],
            connection: ['keep-alive', 'close'],
            expectEnd: true,
        },
        {
            headers: [['Connection', ['keep-alive', 'upgrade']]],
            connection: ['keep-alive', 'upgrade'],
        },
        {
            headers: [['Connection', 'Keep-Alive, ClOsE']],
            connection: ['Keep-Alive, ClOsE'],
            expectEnd: true,
        },
        {
            headers: [['Connection', 'upgrade'], ['Keep-Alive', 'custom=1']],
            connection: ['upgrade'],
            keepAlive: ['custom=1'],
        },
        {
            headers: [['Keep-Alive', 'custom=2']],
            connection: ['keep-alive'],
            keepAlive: ['custom=2'],
        },
        {
            headers: [['Connection', ['keep-alive']]],
            writeHeadFirst: true,
            mutateAfterWriteHead: true,
            connection: ['keep-alive'],
        },
        {
            headers: [['Transfer-Encoding', 'chunked']],
            statusCode: 204,
            writeHeadFirst: true,
            connection: ['close'],
            transferEncoding: ['chunked'],
            noBody: true,
            noChunkTerminator: true,
            expectEnd: true,
        },
        {
            headers: [['Transfer-Encoding', 'chunked']],
            statusCode: 304,
            writeHeadFirst: true,
            connection: ['close'],
            transferEncoding: ['chunked'],
            noBody: true,
            noChunkTerminator: true,
            expectEnd: true,
        },
        { removeConnection: true },
        {
            removeFraming: true,
            contentLength: [],
            transferEncoding: [],
            expectEnd: true,
        },
        {
            request: 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n',
            connection: ['close'],
            expectEnd: true,
        },
        {
            request: 'GET / HTTP/1.0\r\n\r\n',
            writeHeadFirst: true,
            connection: ['close'],
            expectEnd: true,
        },
        { maxRequestsPerSocket: 1, connection: ['close'] },
        {
            serverCloseBeforeCommit: true,
            connection: ['keep-alive'],
            keepAlive: ['timeout=5'],
            expectEnd: true,
        },
    ];

    for (const options of cases) {
        if (!await runCase(options)) return false;
    }
    return true;
}

export async function httpFalsyPortUsesProtocolDefault() {
    const httpAgent = new http.Agent();
    httpAgent.defaultPort = 8081;
    const httpsAgent = new https.Agent();
    httpsAgent.defaultPort = 8443;
    const cases = [
        [http.request({ hostname: 'example.invalid', port: '' }), 80],
        [https.request({ hostname: 'example.invalid', port: '' }), 443],
        [http.request({ hostname: 'example.invalid', port: 0 }), 80],
        [https.request({ hostname: 'example.invalid', port: 0 }), 443],
        [http.request({ hostname: 'example.invalid', port: null }), 80],
        [http.request({ hostname: 'example.invalid', port: false }), 80],
        [http.request({ hostname: 'example.invalid', port: NaN }), 80],
        [http.request({ hostname: 'example.invalid', port: '0' }), 0],
        [https.request({ hostname: 'example.invalid', port: '0' }), 0],
        [http.request({ hostname: 'example.invalid', port: '', defaultPort: 8080 }), 8080],
        [http.request({ hostname: 'example.invalid', port: '', agent: httpAgent }), 8081],
        [https.request({ hostname: 'example.invalid', port: '', agent: httpsAgent }), 8443],
    ];

    const matches = cases.every(([request, expectedPort]) => request.port === expectedPort);
    await Promise.all(cases.map(([request]) => new Promise((resolve) => {
        request.on('error', () => {});
        request.once('close', resolve);
        request.destroy();
    })));
    return matches;
}
