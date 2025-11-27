import { Buffer } from "buffer";

async function dumpResponse(response) {
    console.log(`Response from ${response.url}: ${response.status} ${response.statusText} (ok=${response.ok})`);
    console.log(`Headers:`);
    for (const [name, value] of response.headers.entries()) {
        console.log(`  ${name}: ${value}`);
    }

    const data = await response.json();
    console.log(`Body: ${JSON.stringify(data)}`);
}

export async function postJsonAndGet(port) {
    console.log("fetch test 1");
    const response1 = await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "foo",
            body: "bar",
            userId: 1
        })
    });

    const response2 = await fetch(`http://localhost:${port}/todos/0`);

    await dumpResponse(response1);
    await dumpResponse(response2);
}

export async function postAndGetAsArrayBuffer(port) {
    console.log("fetch test 2");

    await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "foo",
            body: "bar",
            userId: 1
        })
    });

    const response = await fetch(`http://localhost:${port}/todos/0`);
    const data = await response.arrayBuffer();
    console.log(`Response body as ArrayBuffer:`, data);
}

export async function streamingResponseBody(port) {
    console.log("fetch test 3");
    const response = await fetch(`http://localhost:${port}/todos-stream`);
    for await (const chunk of response.body) {
        // Do something with each "chunk"
        console.log(`Received chunk: ${chunk}`);
    }
}

export async function pipeResponseBodyToRequest(port) {
    console.log("fetch test 4");
    const response1 = await fetch(`http://localhost:${port}/todos-stream`);
    const response2 = await fetch(`http://localhost:${port}/echo`, {
        method: "POST",
        body: response1.body
    });

    await dumpResponse(response2);
}

export async function pipeBufferedResponseBodyToRequest(port) {
    console.log("fetch test 4 (buffered)");
    const response1 = await fetch(`http://localhost:${port}/todos-stream`);

    let body1 = await response1.bytes();

    const response2 = await fetch(`http://localhost:${port}/echo`, {
        method: "POST",
        body: body1
    });

    await dumpResponse(response2);
}

export async function concurrentPostAndGet(port) {
    async function test(i) {
        let response1 = await fetch(`http://localhost:${port}/todos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: `title_${i}`,
                body: `body_${i}`,
                userId: 1
            })
        });
        let response1Json = await response1.json()

        let response2 = await fetch(`http://localhost:${port}/todos/${response1Json.id}`);
        let response2Json = await response2.json();
        console.log(response2.status, JSON.stringify(response2Json));
    }

    let promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(test(i));
    }

    await Promise.all(promises);
}

class SlowRequestBodySource {
    #interval

    constructor(body) {
        this.body = body;
    }

    start(controller) {
        console.log(`Starting request body stream`);
        this.#interval = setInterval(() => {
            const next = this.body.slice(0, 2);
            this.body = this.body.slice(2);
            if (next.length === 0) {
                console.log(`Closing request body stream`);
                controller.close();
                clearInterval(this.#interval);
            } else {
                console.log(`Enqueuing chunk: ${next}`);
                controller.enqueue(next);
            }
        }, 100);
    }

    cancel() {
        console.log(`Cancelling request body stream`);
        clearInterval(this.#interval);
    }
}

export async function postWithSlowStreamingBody(port) {
    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const stream = new ReadableStream(new SlowRequestBodySource(body));
    const response = await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: stream
    });
    await dumpResponse(response);
}

export async function blobOperations() {
    const blob = new Blob(['hello, world'])

    const text = await blob.text();
    console.log(`Blob text: ${text}`);

    const array = await blob.arrayBuffer();
    console.log(`Blob array buffer length: ${array.byteLength}`);
    console.log(`Blob array buffer: ${array}`);

    for await (let chunk of blob.stream()) {
        console.log(`Blob stream chunk: ${chunk}`);
    }

    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const stream = new ReadableStream(new SlowRequestBodySource(body));
    const formData = new FormData()
    formData.append('f1', new File(['abc'], 'hello-world.txt'))
    formData.append('f2', {
        size: 123,
        type: '',
        name: 'cat-video.mp4',
        stream() {
            return stream
        },
        [Symbol.toStringTag]: 'File'
    });

    console.log(`FormData keys: ${JSON.stringify([...formData.keys()])}`);
    for (const pair of formData.entries()) {
        console.log(pair[0], JSON.stringify(pair[1]));
    }

    console.log("done");
}

export async function postWithBlobBody(port) {
    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const blob = new Blob([body], {type: "application/json"});
    const response = await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        body: blob
    });
    await dumpResponse(response);
}

export async function postFormDataWithFiles(port) {
    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const stream = new ReadableStream(new SlowRequestBodySource(body));
    const formData = new FormData()
    formData.append('f1', new File(['abc'], 'hello-world.txt'))
    formData.append('f2', {
        size: 123,
        type: '',
        name: 'cat-video.mp4',
        stream() {
            return stream
        },
        [Symbol.toStringTag]: 'File'
    });
    const response = await fetch(`http://localhost:${port}/echo-form`, {method: 'POST', body: formData});
    await dumpResponse(response);
}


export async function fetchWithRequestObject(port) {
    console.log("fetch test 10");
    const request1 = new Request(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "foo",
            body: "bar",
            userId: 1
        })
    });
    const response1 = await fetch(request1);

    const request2 = new Request(`http://localhost:${port}/todos/0`);
    const response2 = await fetch(request2);

    await dumpResponse(response1);
    await dumpResponse(response2);
}

export async function postWithDataViewBody(port) {
    console.log("fetch test 11 (DataView)");

    // Create a DataView from an ArrayBuffer containing JSON data
    const buffer = new ArrayBuffer(39);
    const view = new DataView(buffer);
    const jsonData = JSON.stringify({title: "foo", body: "bar", userId: 1});

    // Fill the DataView with the JSON string bytes
    for (let i = 0; i < jsonData.length; i++) {
        view.setUint8(i, jsonData.charCodeAt(i));
    }

    // Send the DataView as a request body
    const response = await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: view
    });

    await dumpResponse(response);
}

export async function postWithUrlSearchParams(port) {
    console.log("fetch test 12 (URLSearchParams)");

    // Create URLSearchParams with form data
    const params = new URLSearchParams();
    params.append('title', 'foo');
    params.append('body', 'bar');
    params.append('userId', '1');

    console.log(`URLSearchParams toString: ${params.toString()}`);

    // Send URLSearchParams as request body
    const response = await fetch(`http://localhost:${port}/form-echo`, {
        method: "POST",
        body: params
    });

    await dumpResponse(response);
}

export async function requestWithUrlSearchParams(port) {
    console.log("fetch test 13 (URLSearchParams in Request)");

    // Create URLSearchParams
    const params = new URLSearchParams();
    params.append('name', 'John');
    params.append('email', 'john@example.com');

    // Create a Request with URLSearchParams body
    const request = new Request(`http://localhost:${port}/form-echo`, {
        method: "POST",
        body: params
    });

    console.log(`Request body used: ${request.bodyUsed}`);

    // Use the request in fetch
    const response = await fetch(request);

    await dumpResponse(response);
}

export async function fetchWithReferrer(port) {
    console.log("fetch test 14 (referrer with fetch)");

    // Test 1: default referrer with default policy (about:client should not send header)
    console.log("Test 1: default referrer");
    const response1 = await fetch(`http://localhost:${port}/echo-referer`, {
        method: "POST"
    });
    const data1 = await response1.json();
    console.log(`Test 1 referer sent: '${data1.referer}'`);

    // Test 2: custom referrer with default policy (strict-origin-when-cross-origin)
    // Since this is same-origin, it should send the full referrer URL
    console.log("Test 2: custom referrer");
    const response2 = await fetch(`http://localhost:${port}/echo-referer`, {
        method: "POST",
        referrer: `http://localhost:${port}/source`
    });
    const data2 = await response2.json();
    console.log(`Test 2 referer sent: '${data2.referer}'`);

    // Test 3: empty referrer (explicitly omit header)
    console.log("Test 3: empty referrer");
    const response3 = await fetch(`http://localhost:${port}/echo-referer`, {
        method: "POST",
        referrer: ""
    });
    const data3 = await response3.json();
    console.log(`Test 3 referer sent: '${data3.referer}'`);
}

export async function fetchWithReferrerPolicy(port) {
    console.log("fetch test 15 (referrerPolicy with fetch)");

    const baseUrl = `http://localhost:${port}`;
    const sourceUrl = `${baseUrl}/source`;

    // Test 1: no-referrer policy (should never send Referer header)
    console.log("Test 1: no-referrer policy");
    const response1 = await fetch(`${baseUrl}/echo-referer`, {
        method: "POST",
        referrer: sourceUrl,
        referrerPolicy: "no-referrer"
    });
    const data1 = await response1.json();
    console.log(`Test 1 referer sent: '${data1.referer}'`);

    // Test 2: origin policy (should send origin only)
    console.log("Test 2: origin policy");
    const response2 = await fetch(`${baseUrl}/echo-referer`, {
        method: "POST",
        referrer: sourceUrl,
        referrerPolicy: "origin"
    });
    const data2 = await response2.json();
    console.log(`Test 2 referer sent: '${data2.referer}'`);

    // Test 3: origin-when-cross-origin (same-origin, so sends full)
    console.log("Test 3: origin-when-cross-origin policy (same-origin)");
    const response3 = await fetch(`${baseUrl}/echo-referer`, {
        method: "POST",
        referrer: sourceUrl,
        referrerPolicy: "origin-when-cross-origin"
    });
    const data3 = await response3.json();
    console.log(`Test 3 referer sent: '${data3.referer}'`);

    // Test 4: strict-origin-when-cross-origin (default, same-origin sends full)
    console.log("Test 4: strict-origin-when-cross-origin policy (default)");
    const response4 = await fetch(`${baseUrl}/echo-referer`, {
        method: "POST",
        referrer: sourceUrl,
        referrerPolicy: "strict-origin-when-cross-origin"
    });
    const data4 = await response4.json();
    console.log(`Test 4 referer sent: '${data4.referer}'`);
}

export async function fetchWithCredentials(port) {
    console.log("fetch test 16 (credentials option with fetch)");

    const baseUrl = `http://localhost:${port}`;

    // Test 1: credentials "omit" (should not send any credentials headers and should filter Set-Cookie)
    console.log("Test 1: credentials 'omit'");
    const request1 = new Request(`${baseUrl}/echo-credentials`, {
        method: "POST",
        credentials: "omit",
        headers: {
            "Authorization": "Bearer test-token",
            "Cookie": "session=test-session-id"
        }
    });
    console.log(`Request 1 credentials: '${request1.credentials}'`);
    const response1 = await fetch(request1);
    const data1 = await response1.json();
    console.log(`Test 1 authorization: '${data1.authorization}', cookie: '${data1.cookie}'`);
    const setCookie1 = response1.headers.get('set-cookie');
    console.log(`Test 1 set-cookie: '${setCookie1 || ''}'`);

    // Test 2: credentials "same-origin" (default, should send credentials for same-origin and preserve Set-Cookie)
    console.log("Test 2: credentials 'same-origin'");
    const request2 = new Request(`${baseUrl}/echo-credentials`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Authorization": "Bearer test-token",
            "Cookie": "session=test-session-id"
        }
    });
    console.log(`Request 2 credentials: '${request2.credentials}'`);
    const response2 = await fetch(request2);
    const data2 = await response2.json();
    console.log(`Test 2 authorization: '${data2.authorization}', cookie: '${data2.cookie}'`);
    const setCookie2 = response2.headers.get('set-cookie');
    console.log(`Test 2 set-cookie: '${setCookie2 || ''}'`);

    // Test 3: credentials "include" (should send credentials for all requests and preserve Set-Cookie)
    console.log("Test 3: credentials 'include'");
    const request3 = new Request(`${baseUrl}/echo-credentials`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Authorization": "Bearer test-token",
            "Cookie": "session=test-session-id"
        }
    });
    console.log(`Request 3 credentials: '${request3.credentials}'`);
    const response3 = await fetch(request3);
    const data3 = await response3.json();
    console.log(`Test 3 authorization: '${data3.authorization}', cookie: '${data3.cookie}'`);
    const setCookie3 = response3.headers.get('set-cookie');
    console.log(`Test 3 set-cookie: '${setCookie3 || ''}'`);
}

export async function redirectFollow(port) {
    console.log("fetch test 17 (redirect: follow)");
    const response = await fetch(`http://localhost:${port}/redirect-to?url=/todos&status=302`);
    console.log(`Status: ${response.status}`);
    console.log(`Redirected: ${response.redirected}`);
    if (response.status === 200 && response.redirected) {
        console.log("Redirect followed successfully");
    } else {
        console.log("Redirect failed");
    }
    await dumpResponse(response);
}

export async function redirectManual(port) {
    console.log("fetch test 18 (redirect: manual)");
    const response = await fetch(`http://localhost:${port}/redirect-to?url=/todos&status=302`, {
        redirect: 'manual'
    });
    console.log(`Status: ${response.status}`);
    console.log(`Redirected: ${response.redirected}`);
    if (response.status === 0 && !response.redirected) {
        console.log("Manual redirect handled correctly");
    } else {
        console.log("Manual redirect failed");
    }
}

export async function redirectError(port) {
    console.log("fetch test 19 (redirect: error)");
    try {
        await fetch(`http://localhost:${port}/redirect-to?url=/todos&status=302`, {
            redirect: 'error'
        });
        console.log("Error: Should have thrown exception");
    } catch (e) {
        console.log("Caught expected error for redirect: error");
    }
}

export async function redirectLoop(port) {
    console.log("fetch test 20 (redirect loop)");
    try {
        await fetch(`http://localhost:${port}/redirect-loop`);
        console.log("Error: Should have thrown exception for loop");
    } catch (e) {
        console.log("Caught expected error for loop");
    }
}

export async function postWithRedirect(port) {
    console.log("fetch test 21 (redirect with body)");
    const blob = new Blob(["hello world"], {type: "text/plain"});

    // Redirect using 307 to preserve POST and body
    const target = `/echo`;
    const response = await fetch(`http://localhost:${port}/redirect-to?url=${target}&status=307`, {
        method: 'POST',
        body: blob,
        redirect: 'follow'
    });

    console.log(`Status: ${response.status}`);
    console.log(`Redirected: ${response.redirected}`);

    const text = await response.text();
    console.log(`Body: ${text}`);
}

export async function responseCloneBasic(port) {
    console.log("fetch test 22 (response clone - basic)");

    // First POST to create a todo
    await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "clone test",
            body: "test body",
            userId: 1
        })
    });

    const response = await fetch(`http://localhost:${port}/todos/0`);

    console.log(`Original status: ${response.status}`);
    console.log(`Original ok: ${response.ok}`);

    try {
        const cloned = response.clone();
        console.log(`Cloned status: ${cloned.status}`);
        console.log(`Cloned ok: ${cloned.ok}`);

        // Read body from cloned response
        const clonedData = await cloned.json();
        console.log(`Cloned body id: ${clonedData.id}`);

        // Original response body can still be read
        const originalData = await response.json();
        console.log(`Original body id: ${originalData.id}`);

        if (originalData.id === clonedData.id &&
            cloned.status === response.status &&
            cloned.ok === response.ok
        ) {
            console.log("Basic clone test passed");
        }
    } catch (e) {
        console.log("Clone error:", e.message);
    }
}

export async function responseCloneStreamingBody(port) {
    console.log("fetch test 23 (response clone - streaming body)");
    const response = await fetch(`http://localhost:${port}/todos-stream`);

    console.log(`Original status: ${response.status}`);

    const cloned = response.clone();

    console.log(`Cloned status: ${cloned.status}`);

    let clonedBytesData = [];
    for await (const chunk of cloned.body) {
        for (const byte of chunk) {
            clonedBytesData.push(byte);
        }
    }

    let originalBytesData = [];
    for await (const chunk of response.body) {
        for (const byte of chunk) {
            originalBytesData.push(byte);
        }
    }

    const clonedBytes = new Uint8Array(clonedBytesData);
    const originalBytes = new Uint8Array(originalBytesData);

    console.log(`Cloned body: ${clonedBytes}`);
    console.log(`Original body: ${originalBytes}`);

    if (Buffer.compare(clonedBytes, originalBytes) === 0) {
        console.log("Streaming clone test passed");
    }
}

export async function responseCloneReuseBodies(port) {
    console.log("fetch test 24 (response clone - reuse bodies)");

    // First POST to create a todo
    await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "reuse bodies test",
            body: "test body",
            userId: 1
        })
    });

    const response = await fetch(`http://localhost:${port}/todos/0`);

    try {
        const clone1 = response.clone();
        const clone2 = response.clone();

        // Read all three bodies
        const originalBody = await response.json();
        const clone1Body = await clone1.json();
        const clone2Body = await clone2.json();

        console.log(`Original id: ${originalBody.id}`);
        console.log(`Clone1 id: ${clone1Body.id}`);
        console.log(`Clone2 id: ${clone2Body.id}`);

        if (originalBody.id === clone1Body.id && clone1Body.id === clone2Body.id) {
            console.log("All clones have matching bodies");
        }
    } catch (e) {
        console.log("Clone reuse bodies error:", e.message);
    }
}

export async function responseCloneHeaders(port) {
    console.log("fetch test 25 (response clone - headers preservation)");

    // First POST to create a todo
    await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "headers test",
            body: "test body",
            userId: 1
        })
    });

    const response = await fetch(`http://localhost:${port}/todos/0`);

    try {
        const originalContentType = response.headers.get("content-type");
        const cloned = response.clone();
        const clonedContentType = cloned.headers.get("content-type");

        console.log(`Original content-type: ${originalContentType}`);
        console.log(`Cloned content-type: ${clonedContentType}`);

        // Consume both
        await response.text();
        await cloned.text();

        if (originalContentType === clonedContentType) {
            console.log("Headers preserved in clone");
        }
    } catch (e) {
        console.log("Clone headers error:", e.message);
    }
}

export async function responseFormData(port) {
    console.log("response-form-data test");

    const response = await fetch(`http://localhost:${port}/form-response`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response Content-Type: ${response.headers.get('Content-Type')}`);

    // Parse the form data from the response
    const responseFormData = await response.formData();
    console.log(`Parsed FormData entries:`);
    for (const [name, value] of responseFormData.entries()) {
        if (value instanceof File) {
            const content = await value.text();
            console.log(`  ${name}: File(${value.name}, size=${content.length}, type=${value.type})`);
        } else {
            console.log(`  ${name}: ${value}`);
        }
    }

    console.log("response-form-data test completed");
}
