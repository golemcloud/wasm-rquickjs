import * as http from 'node:http';
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
        const server = http.createServer((req, res) => {
            handled++;
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
            });
            socket.on('error', () => finish(false));
            socket.on('end', () => {
                finish(
                    handled === 2 &&
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
        const server = http.createServer((_req, res) => {
            res.on('finish', () => {
                setImmediate(() => server.closeIdleConnections());
            });
            res.end('ok');
        });

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
                    });
                    idleSocket.on('close', () => {
                        if (!idleResponse.includes('HTTP/1.1 200') ||
                            !idleResponse.includes('\r\n\r\nok')) {
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
                    partialResponse.includes('HTTP/1.1 200') &&
                    partialResponse.includes('\r\n\r\nok')
                );
            });
            partialSocket.on('error', () => finish(false));
        });
    });
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
