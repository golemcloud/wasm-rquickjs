async function dumpResponse(response) {
    console.log(`Response from ${response.url}: ${response.status} ${response.statusText} (ok=${response.ok})`);
    console.log(`Headers:`);
    for (const [name, value] of response.headers.entries()) {
        console.log(`  ${name}: ${value}`);
    }

    const data = await response.json();
    console.log(`Body: ${JSON.stringify(data)}`);
}

async function test1Impl() {
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

export const test1 = test1Impl;