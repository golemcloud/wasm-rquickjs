const responseExports = {
    async testResponseError() {
        const response = Response.error();
        return {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            typeField: response.type,
            location: null,
        };
    },

    async testResponseRedirect() {
        const response = Response.redirect('https://example.com/new-path', 301);
        return {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            typeField: response.type,
            location: response.headers.get('location'),
        };
    },

    async testResponseRedirectDefault() {
        const response = Response.redirect('https://example.com/redirect');
        return {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            typeField: response.type,
            location: response.headers.get('location'),
        };
    },

    async testResponseJson() {
        const data = { message: 'Hello, World!', count: 42 };
        const response = Response.json(data);
        return {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            text: await response.text(),
        };
    },

    async testResponseJsonCustomStatus() {
        const data = { error: 'Not found' };
        const response = Response.json(data, { status: 404 });
        return {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            text: await response.text(),
        };
    },

    async testResponseJsonString() {
        const json = '{"name":"Alice","age":30}';
        const response = Response.json(json);
        return {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            text: await response.json(),
        };
    },

    async testResponseJsonWithHeaders() {
        const data = { message: 'Hello' };
        const headers = { 'X-Custom-Header': 'CustomValue', 'Content-Type': 'application/json' };
        const response = Response.json(data, { headers });
        return {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            text: await response.text(),
            customHeader: response.headers.get('x-custom-header'),
        };
    },

    async testResponseRedirectInvalidStatus() {
        try {
            Response.redirect('https://example.com', 200);
            return { success: false, error: 'Should have thrown RangeError' };
        } catch (e) {
            return { success: true, error: e.toString() };
        }
    }
};

export { responseExports };
