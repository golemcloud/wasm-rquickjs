export const test1 = () => {
    if (URL.canParse("cats", "http://www.example.com/dogs")) {
        const url = new URL("cats", "http://www.example.com/dogs");
        console.log(url.hostname); // "www.example.com"
        console.log(url.pathname); // "/cats"

        return url.hostname === "www.example.com" && url.pathname === "/cats" && url.protocol === "http:";
    } else {
        console.log("Invalid URL");
        return false;
    }
};

export const test2 = () => {
    if (URL.canParse("../cats", "http://www.example.com/dogs")) {
        const url = new URL("../cats", "http://www.example.com/dogs");
        console.log(url.hostname); // "www.example.com"
        console.log(url.pathname); // "/cats"

        return url.hostname === "www.example.com" && url.pathname === "/cats";
    } else {
        console.log("Invalid URL");
        return false;
    }
};

export const test3 = () => {
    const paramsString = "q=URLUtils.searchParams&topic=api";
    const searchParams = new URLSearchParams(paramsString);

    // Iterating the search parameters
    for (const p of searchParams) {
        console.log(p);
    }

    console.log(searchParams.has("topic")); // true
    console.log(searchParams.has("topic", "fish")); // false
    console.log(searchParams.get("topic") === "api"); // true
    console.log(searchParams.getAll("topic")); // ["api"]
    console.log(searchParams.get("foo") === null); // true
    console.log(searchParams.append("topic", "webdev"));
    console.log(searchParams.toString()); // "q=URLUtils.searchParams&topic=api&topic=webdev"
    console.log(searchParams.set("topic", "More webdev"));
    console.log(searchParams.toString()); // "q=URLUtils.searchParams&topic=More+webdev"
    console.log(searchParams.delete("topic"));
    console.log(searchParams.toString()); // "q=URLUtils.searchParams"
}

export const test4 = () => {
    const url = new URL("https://test:pass@example.com:1234/path?query=URLUtils.searchParams&topic=api#fragment");
    console.log(url.protocol);
    console.log(url.username);
    console.log(url.password);
    console.log(url.hostname);
    console.log(url.port);
    console.log(url.pathname);
    console.log(url.hash);
    console.log(url.searchParams.get("topic"));
    console.log(url.searchParams.get("query"));
    console.log(url.href);
}