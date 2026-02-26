import * as http from 'node:http';

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
