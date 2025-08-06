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

export async function test2() {
    console.log("fetch test 2");
    const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    const data = await response.arrayBuffer();
    console.log(`Response body as ArrayBuffer:`, data);
}

export async function test3() {
    console.log("fetch test 3");
    const response = await fetch("https://postman-echo.com/stream/100");
    for await (const chunk of response.body) {
        // Do something with each "chunk"
        console.log(`Received chunk: ${chunk}`);
    }
}

export async function test4() {
    console.log("fetch test 4");
    const response1 = await fetch("https://postman-echo.com/stream/10");
    const response2 = await fetch("https://postman-echo.com/post", {
        method: "POST",
        body: response1.body
    });

    await dumpResponse(response2);
}

export async function test4Buffered() {
    console.log("fetch test 4");
    const response1 = await fetch("https://postman-echo.com/stream/10");
    let body1 = await response1.bytes();

    const response2 = await fetch("https://postman-echo.com/post", {
        method: "POST",
        body: body1
    });

    await dumpResponse(response2);
}

export async function test5() {
    async function test(i) {
        let response = await fetch(`https://jsonplaceholder.typicode.com/todos/${i}`);
        let json = await response.json();
        console.log(response.status, JSON.stringify(json));
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

export async function test6() {
    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const stream = new ReadableStream(new SlowRequestBodySource(body));
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
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

export async function test8() {
    let body = new Uint8Array([123, 34, 116, 105, 116, 108, 101, 34, 58, 34, 102, 111, 111, 34, 44, 34, 98, 111, 100, 121, 34, 58, 34, 98, 97, 114, 34, 44, 34, 117, 115, 101, 114, 73, 100, 34, 58, 49, 125]);
    const blob = new Blob([body], {type: "application/json"});
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: blob
    });
    await dumpResponse(response);
}

export async function test9() {
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
    const response = await fetch('https://httpbin.org/post', {method: 'POST', body: formData});
    await dumpResponse(response);
}
