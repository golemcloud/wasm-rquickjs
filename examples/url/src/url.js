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

export const test5 = () => {
     // Test URL constructor with undefined as second parameter
     // Should behave the same as calling new URL(absoluteUrl)
     const url = new URL("https://example.com/path?query=value#fragment", undefined);
     console.log(url.protocol); // "https:"
     console.log(url.hostname); // "example.com"
     console.log(url.pathname); // "/path"
     console.log(url.search); // "?query=value"
     console.log(url.hash); // "#fragment"
     
     return url.protocol === "https:" && 
            url.hostname === "example.com" && 
            url.pathname === "/path" &&
            url.search === "?query=value" &&
            url.hash === "#fragment";
}

export const test6 = () => {
     // Test node:url module imports
     const url = require('node:url');

     // Test fileURLToPath
     const path1 = url.fileURLToPath('file:///foo/bar');
     console.log('fileURLToPath:', path1);
     if (path1 !== '/foo/bar') return false;

     const path2 = url.fileURLToPath(new URL('file:///foo%20bar'));
     console.log('fileURLToPath URL:', path2);
     if (path2 !== '/foo bar') return false;

     // Test pathToFileURL
     const fileUrl = url.pathToFileURL('/foo/bar');
     console.log('pathToFileURL:', fileUrl.href);
     if (fileUrl.href !== 'file:///foo/bar') return false;

     const fileUrl2 = url.pathToFileURL('/foo bar');
     console.log('pathToFileURL space:', fileUrl2.href);
     if (fileUrl2.href !== 'file:///foo%20bar') return false;

     // Test urlToHttpOptions
     const opts = url.urlToHttpOptions(new URL('http://user:pass@example.com:8080/path?q=1#hash'));
     console.log('urlToHttpOptions:', JSON.stringify(opts));
     if (opts.protocol !== 'http:') return false;
     if (opts.hostname !== 'example.com') return false;
     if (opts.port !== 8080) return false;
     if (opts.auth !== 'user:pass') return false;
     if (opts.pathname !== '/path') return false;
     if (opts.path !== '/path?q=1') return false;

     // Test format (WHATWG)
     const formatted = url.format(new URL('http://user:pass@example.com/a?b=c#d'), { auth: false });
     console.log('format no auth:', formatted);
     if (formatted !== 'http://example.com/a?b=c#d') return false;

     // Test Url class and parse
     const parsed = url.parse('http://example.com/path?q=1#hash');
     console.log('parse:', parsed.protocol, parsed.hostname, parsed.pathname);
     if (parsed.protocol !== 'http:') return false;
     if (parsed.hostname !== 'example.com') return false;
     if (parsed.pathname !== '/path') return false;

     return true;
};