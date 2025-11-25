async function dumpResponse(response) {
    console.log(`Response from ${response.url}: ${response.status} ${response.statusText} (ok=${response.ok})`);
    console.log(`Headers:`);
    for (const [name, value] of response.headers.entries()) {
        console.log(`  ${name}: ${value}`);
    }

    const data = await response.json();
    console.log(`Body: ${JSON.stringify(data)}`);
}

export async function test1(port) {
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

export async function test2(port) {
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

export async function test3(port) {
    console.log("fetch test 3");
    const response = await fetch(`http://localhost:${port}/todos-stream`);
    for await (const chunk of response.body) {
        // Do something with each "chunk"
        console.log(`Received chunk: ${chunk}`);
    }
}

export async function test4(port) {
    console.log("fetch test 4");
    const response1 = await fetch(`http://localhost:${port}/todos-stream`);
    const response2 = await fetch(`http://localhost:${port}/echo`, {
        method: "POST",
        body: response1.body
    });

    await dumpResponse(response2);
}

export async function test4Buffered(port) {
    console.log("fetch test 4 (buffered)");
    const response1 = await fetch(`http://localhost:${port}/todos-stream`);

    let body1 = await response1.bytes();

    const response2 = await fetch(`http://localhost:${port}/echo`, {
        method: "POST",
        body: body1
    });

    await dumpResponse(response2);
}

export async function test5(port) {
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

export async function test6(port) {
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

export async function test7() {
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

export async function test8(port) {
    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const blob = new Blob([body], {type: "application/json"});
    const response = await fetch(`http://localhost:${port}/todos`, {
        method: "POST",
        body: blob
    });
    await dumpResponse(response);
}

export async function test9(port) {
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


export async function test10(port) {
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

export async function test11(port) {
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

export async function test12(port) {
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

export async function test13(port) {
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

export async function test14(port) {
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

export async function test15(port) {
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