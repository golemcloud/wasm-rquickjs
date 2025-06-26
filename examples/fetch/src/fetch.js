async function dumpResponse(response) {
    console.log(`Response from ${response.url}: ${response.status} ${response.statusText} (ok=${response.ok})`);
    console.log(`Headers:`);
    for (const [name, value] of response.headers.entries()) {
        console.log(`  ${name}: ${value}`);
    }

    const data = await response.json();
    console.log(`Body: ${JSON.stringify(data)}`);
}

export async function test1() {
    console.log("fetch test 1");
    const response1 = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    await dumpResponse(response1);

    const response2 = await fetch("https://jsonplaceholder.typicode.com/posts", {
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