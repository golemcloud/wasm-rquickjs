import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

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

export const test7 = () => {
     // Test URL constructor with a URL object as base (coercion via toString)
     const base = new URL("https://example.com/a/b/");
     const url = new URL("x", base);
     console.log('test7 href:', url.href);
     return url.href === "https://example.com/a/b/x";
};

export const test8 = () => {
     // Test canParse and parse with a URL object as base
     const base = new URL("https://example.com/a/b/");
     const canParse = URL.canParse("x", base);
     console.log('test8 canParse:', canParse);
     if (!canParse) return false;

     const parsed = URL.parse("x", base);
     console.log('test8 parsed:', parsed ? parsed.href : null);
     if (!parsed) return false;
     if (parsed.href !== "https://example.com/a/b/x") return false;

     // Verify canParse returns false for invalid inputs
     if (URL.canParse("://invalid")) return false;

     return true;
};

export const test9 = () => {
     // Test setter coercion: assigning objects with toString to URL properties
     const url = new URL("https://example.com/old?old=1#oldhash");

     url.pathname = { toString: () => '/v1' };
     console.log('test9 pathname:', url.pathname);
     if (url.pathname !== '/v1') return false;

     url.hash = { toString: () => '#newhash' };
     console.log('test9 hash:', url.hash);
     if (url.hash !== '#newhash') return false;

     url.search = { toString: () => '?key=value' };
     console.log('test9 search:', url.search);
     if (url.search !== '?key=value') return false;

     url.protocol = { toString: () => 'http:' };
     console.log('test9 protocol:', url.protocol);
     if (url.protocol !== 'http:') return false;

     url.username = { toString: () => 'user' };
     console.log('test9 username:', url.username);
     if (url.username !== 'user') return false;

     url.password = { toString: () => 'pass' };
     console.log('test9 password:', url.password);
     if (url.password !== 'pass') return false;

     url.hostname = { toString: () => 'other.com' };
     console.log('test9 hostname:', url.hostname);
     if (url.hostname !== 'other.com') return false;

     url.port = { toString: () => '8080' };
     console.log('test9 port:', url.port);
     if (url.port !== '8080') return false;

     url.href = { toString: () => 'https://final.example.com/' };
     console.log('test9 href:', url.href);
     if (url.href !== 'https://final.example.com/') return false;

     url.host = { toString: () => 'host.example.com:9090' };
     console.log('test9 host:', url.host);
     if (url.host !== 'host.example.com:9090') return false;

     return true;
};

export const test10 = () => {
     const url = require('node:url');

     const domainPairs = [
         ['ıíd', 'xn--d-iga7r'],
         ['يٴ', 'xn--mhb8f'],
         ['www.ϧƽəʐ.com', 'www.xn--cja62apfr6c.com'],
         ['новини.com', 'xn--b1amarcd.com'],
         ['名がドメイン.com', 'xn--v8jxj3d1dzdz08w.com'],
         ['افغانستا.icom.museum', 'xn--mgbaal8b0b9b2b.icom.museum'],
         ['الجزائر.icom.fake', 'xn--lgbbat1ad8j.icom.fake'],
         ['भारत.org', 'xn--h2brj9c.org'],
     ];
     for (const [domain, ascii] of domainPairs) {
         if (url.domainToASCII(domain) !== ascii) return false;
         if (url.domainToUnicode(ascii) !== domain) return false;
     }
     if (url.domainToASCII('fail⁇fail.com') !== '') return false;
     if (url.domainToUnicode('fail⁇fail.com') !== '') return false;
     if (url.domainToASCII('') !== '') return false;
     if (url.domainToUnicode('') !== '') return false;
     if (url.domainToASCII('.') !== '.') return false;
     if (url.domainToUnicode('.') !== '.') return false;
     if (url.domainToASCII('example.com.') !== 'example.com.') return false;
     if (url.domainToUnicode('example.com.') !== 'example.com.') return false;
     if (url.domainToASCII('%65xample.com') !== 'example.com') return false;
     if (url.domainToUnicode('%65xample.com') !== 'example.com') return false;
     if (url.domainToASCII('[::1]') !== '[::1]') return false;
     if (url.domainToUnicode('[::1]') !== '[::1]') return false;
     for (const surrogate of ['\uD800', '\uDC00']) {
         if (url.domainToASCII(surrogate) !== '') return false;
         if (url.domainToUnicode(surrogate) !== '') return false;
         if (url.domainToASCII(`foo${surrogate}`) !== '') return false;
         if (url.domainToUnicode(`foo${surrogate}`) !== '') return false;
         if (url.domainToASCII(`${surrogate}.com`) !== '') return false;
         if (url.domainToUnicode(`${surrogate}.com`) !== '') return false;
         if (url.domainToASCII(`foo/${surrogate}`) !== 'foo') return false;
         if (url.domainToUnicode(`foo/${surrogate}`) !== 'foo') return false;
     }
     if (url.domainToASCII(undefined) !== 'undefined') return false;
     if (url.domainToASCII(null) !== 'null') return false;
     if (url.domainToASCII(123) !== '0.0.0.123') return false;
     for (const separator of ['/', '?', '#', '\\']) {
         if (url.domainToASCII(`foo${separator}bar`) !== 'foo') return false;
         if (url.domainToUnicode(`foo${separator}bar`) !== 'foo') return false;
     }
     if (url.domainToASCII('foo\tbar\nbaz') !== 'foobarbaz') return false;
     if (url.domainToUnicode('foo\tbar\nbaz') !== 'foobarbaz') return false;
     if (url.domainToASCII('example.com:80') !== '') return false;
     if (url.domainToUnicode('user@example.com') !== '') return false;

     try {
         url.domainToASCII();
         return false;
     } catch (error) {
         if (error.code !== 'ERR_MISSING_ARGS') return false;
     }

     try {
         url.domainToUnicode(Symbol('domain'));
         return false;
     } catch (error) {
         if (!(error instanceof TypeError)) return false;
     }

     const whatwg = new URL('https://user:pass@faß.ExAmPlE:8443/p?q=1#h');
     if (whatwg.href !== 'https://user:pass@xn--fa-hia.example:8443/p?q=1#h') return false;
     if (whatwg.hostname !== 'xn--fa-hia.example') return false;
     if (whatwg.origin !== 'https://xn--fa-hia.example:8443') return false;
     if (url.format(whatwg) !== whatwg.href) return false;
     if (url.format(whatwg, { unicode: false }) !== whatwg.href) return false;
     if (url.format(whatwg, { unicode: 0 }) !== whatwg.href) return false;
     if (url.format(whatwg, { unicode: '' }) !== whatwg.href) return false;
     if (url.format(whatwg, { unicode: true }) !== 'https://user:pass@faß.example:8443/p?q=1#h') return false;
     if (url.format(whatwg, { unicode: 1 }) !== 'https://user:pass@faß.example:8443/p?q=1#h') return false;
     if (url.format(whatwg, { unicode: {} }) !== 'https://user:pass@faß.example:8443/p?q=1#h') return false;

     const legacy = url.parse('https://faß.ExAmPlE:8443/p');
     if (legacy.hostname !== 'xn--fa-hia.example') return false;
     if (legacy.host !== 'xn--fa-hia.example:8443') return false;
     if (legacy.href !== 'https://xn--fa-hia.example:8443/p') return false;

     const numericLegacyHosts = [
         ['http://123/', '123'],
         ['http://127.1/', '127.1'],
         ['http://0X7F000001/', '0x7f000001'],
         ['http://１２７．１/', '127.1'],
     ];
     for (const [input, hostname] of numericLegacyHosts) {
         const parsed = url.parse(input);
         if (parsed.hostname !== hostname) return false;
     }

     const emptyPort = url.parse('http://example.com:');
     if (emptyPort.hostname !== 'example.com') return false;
     if (emptyPort.port !== null) return false;
     if (emptyPort.href !== 'http://example.com/') return false;

     const ipv6 = url.parse('http://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/');
     if (ipv6.hostname !== 'fedc:ba98:7654:3210:fedc:ba98:7654:3210') return false;
     if (ipv6.host !== '[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80') return false;
     if (ipv6.href !== 'http://[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/') return false;

     const dottedIpv6 = url.parse('http://[::192.9.5.5]/');
     if (dottedIpv6.hostname !== '::192.9.5.5') return false;
     if (dottedIpv6.host !== '[::192.9.5.5]') return false;
     if (dottedIpv6.href !== 'http://[::192.9.5.5]/') return false;

     const noncanonicalBracketHost = url.parse('http://[BAD]/');
     if (noncanonicalBracketHost.hostname !== 'bad') return false;
     if (noncanonicalBracketHost.host !== '[bad]') return false;
     if (noncanonicalBracketHost.href !== 'http://[bad]/') return false;

     const bracketedSurrogate = url.parse('http://[::\uD800]/');
     if (bracketedSurrogate.hostname !== '::\uD800') return false;
     if (bracketedSurrogate.host !== '[::\uD800]') return false;
     if (bracketedSurrogate.href !== 'http://[::\uD800]/') return false;

     const emptyIpv6Port = url.parse('http://[::1]:/');
     if (emptyIpv6Port.hostname !== '::1') return false;
     if (emptyIpv6Port.port !== null) return false;
     if (emptyIpv6Port.host !== '[::1]') return false;
     if (emptyIpv6Port.href !== 'http://[::1]/') return false;

     for (const invalid of [
         'http://[::1]:abc/path',
         'http://[::1]extra/path',
         'http://\uD800.com/',
         'http://foo\uD800/',
     ]) {
         try {
             url.parse(invalid);
             return false;
         } catch (error) {
             if (error.code !== 'ERR_INVALID_URL') return false;
         }
     }

     const invalidPort = url.parse('http://faß.example:abc/');
     if (invalidPort.hostname !== 'xn--fa-hia.example') return false;
     if (invalidPort.pathname !== '/:abc/') return false;
     if (invalidPort.href !== 'http://xn--fa-hia.example/:abc/') return false;

     const multiColon = url.parse('http://faß.example:abc:def/path');
     if (multiColon.hostname !== 'xn--fa-hia.example') return false;
     if (multiColon.pathname !== '/:abc:def/path') return false;
     if (multiColon.href !== 'http://xn--fa-hia.example/:abc:def/path') return false;

     const multiColonWithPort = url.parse('http://example.com::80/path');
     if (multiColonWithPort.hostname !== 'example.com') return false;
     if (multiColonWithPort.port !== '80') return false;
     if (multiColonWithPort.pathname !== '/:/path') return false;
     if (multiColonWithPort.href !== 'http://example.com:80/:/path') return false;

     const slashesHost = url.parse('//example.com/path', false, true);
     if (slashesHost.hostname !== 'example.com') return false;
     if (slashesHost.pathname !== '/path') return false;
     if (slashesHost.href !== '//example.com/path') return false;
     if (url.resolve('http://base.example/a', '//example.com/path') !== 'http://example.com/path') return false;

     try {
         url.parse('https://fail⁇fail.com/');
         return false;
     } catch (error) {
         if (error.code !== 'ERR_INVALID_URL') return false;
     }

     return true;
};
