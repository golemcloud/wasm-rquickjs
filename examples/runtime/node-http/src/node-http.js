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
