import { URL } from '__wasm_rquickjs_builtin/url_native';
import * as querystring from 'node:querystring';
import { ERR_INVALID_ARG_TYPE, ERR_MISSING_ARGS } from '__wasm_rquickjs_builtin/internal/errors';

// Based on https://github.com/jerrybendy/url-search-params-polyfill
/**!
 * url-search-params-polyfill
 *
 * @author Jerry Bendy (https://github.com/jerrybendy)
 * @licence MIT
 */

const __URLSearchParams__ = "__URLSearchParams__";

function URLSearchParamsPolyfill(search) {
    search = search || "";

    if (search instanceof URLSearchParams || search instanceof URLSearchParamsPolyfill) {
        search = search.toString();
    }
    this [__URLSearchParams__] = parseToDict(search);
}

const prototype = URLSearchParamsPolyfill.prototype;

prototype.append = function (name, value) {
    appendTo(this [__URLSearchParams__], name, value);
};

prototype['delete'] = function (name) {
    delete this [__URLSearchParams__] [name];
};

prototype.get = function (name) {
    const dict = this [__URLSearchParams__];
    return this.has(name) ? dict[name][0] : null;
};

prototype.getAll = function (name) {
    const dict = this [__URLSearchParams__];
    return this.has(name) ? dict [name].slice(0) : [];
};

prototype.has = function (name, value) {
    if (hasOwnProperty(this [__URLSearchParams__], name)) {
        if (value === undefined) {
            return true;
        }
        const dict = this [__URLSearchParams__];
        for (let i = 0; i < dict[name].length; i++) {
            if (dict[name][i] === value) {
                return true;
            }
        }
        return false;
    }
    return false;
};

prototype.set = function set(name, value) {
    this [__URLSearchParams__][name] = ['' + value];
};

prototype.toString = function () {
    const dict = this[__URLSearchParams__];
    const query = [];
    for (const key in dict) {
        const name = encode(key);
        const value = dict[key];
        for (let i = 0; i < value.length; i++) {
            query.push(name + '=' + encode(value[i]));
        }
    }
    return query.join('&');
};

export const URLSearchParams = URLSearchParamsPolyfill;

// Define searchParams getter on URL.prototype
Object.defineProperty(URL.prototype, "searchParams", {
    get() { return new URLSearchParams(this.search); },
    enumerable: true,
    configurable: true
});

// Wrap createObjectURL to validate Blob argument with proper error code
const _origCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function createObjectURL(obj) {
    if (!obj || typeof obj !== 'object' ||
        (typeof obj.arrayBuffer !== 'function' && typeof obj.stream !== 'function')) {
        throw new ERR_INVALID_ARG_TYPE('object', 'Blob', obj);
    }
    return _origCreateObjectURL.call(this, obj);
};

// Match Node.js behavior: throw ERR_MISSING_ARGS when no URL was passed.
const _origRevokeObjectURL = URL.revokeObjectURL;
URL.revokeObjectURL = function revokeObjectURL(url) {
    if (arguments.length === 0) {
        throw new ERR_MISSING_ARGS('url');
    }
    return _origRevokeObjectURL.call(this, url);
};

const USPProto = URLSearchParams.prototype;

USPProto[Symbol.toStringTag] = 'URLSearchParams';

USPProto.forEach = function (callback, thisArg) {
    const dict = parseToDict(this.toString());
    Object.getOwnPropertyNames(dict).forEach(function (name) {
        dict[name].forEach(function (value) {
            callback.call(thisArg, value, name, this);
        }, this);
    }, this);
};

USPProto.sort = function () {
    const dict = parseToDict(this.toString());
    const keys = [];
    for (const k in dict) {
        keys.push(k);
    }
    keys.sort();

    for (let i = 0; i < keys.length; i++) {
        this['delete'](keys[i]);
    }
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const values = dict[key];
        for (let j = 0; j < values.length; j++) {
            this.append(key, values[j]);
        }
    }
};

USPProto.keys = function () {
    const items = [];
    this.forEach(function (item, name) {
        items.push(name);
    });
    return makeIterator(items);
};

USPProto.values = function () {
    const items = [];
    this.forEach(function (item) {
        items.push(item);
    });
    return makeIterator(items);
};

USPProto.entries = function () {
    const items = [];
    this.forEach(function (item, name) {
        items.push([name, item]);
    });
    return makeIterator(items);
};

USPProto[Symbol.iterator] = USPProto.entries;

Object.defineProperty(USPProto, 'size', {
    get: function () {
        const dict = parseToDict(this.toString());
        if (USPProto === this) {
            throw new TypeError('Illegal invocation at URLSearchParams.invokeGetter');
        }
        return Object.keys(dict).reduce(function (prev, cur) {
            return prev + dict[cur].length;
        }, 0);
    }
});

const ENCODE_REPLACE = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
};

function encode(str) {
    return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, function (match) {
        return ENCODE_REPLACE[match];
    });
}

function decode(str) {
    return str
        .replace(/[ +]/g, '%20')
        .replace(/(%[a-f0-9]{2})+/ig, function (match) {
            return decodeURIComponent(match);
        });
}

function makeIterator(arr) {
    const iterator = {
        next: function () {
            const value = arr.shift();
            return {done: value === undefined, value: value};
        }
    };

    iterator[Symbol.iterator] = function () {
        return iterator;
    };

    return iterator;
}

function parseToDict(search) {
    const dict = {};

    if (typeof search === "object") {
        if (Array.isArray(search)) {
            for (let i = 0; i < search.length; i++) {
                const item = search[i];
                if (Array.isArray(item) && item.length === 2) {
                    appendTo(dict, item[0], item[1]);
                } else {
                    throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                }
            }
        } else {
            for (const key in search) {
                if (hasOwnProperty(search, key)) {
                    appendTo(dict, key, search[key]);
                }
            }
        }
    } else {
        if (search.indexOf("?") === 0) {
            search = search.slice(1);
        }

        const pairs = search.split("&");
        for (let j = 0; j < pairs.length; j++) {
            const value = pairs[j];
            const index = value.indexOf('=');

            if (-1 < index) {
                appendTo(dict, decode(value.slice(0, index)), decode(value.slice(index + 1)));
            } else {
                if (value) {
                    appendTo(dict, decode(value), '');
                }
            }
        }
    }

    return dict;
}

function appendTo(dict, name, value) {
    const val = typeof value === 'string' ? value : (
        value !== null && value !== undefined && typeof value.toString === 'function' ? value.toString() : JSON.stringify(value)
    );

    if (hasOwnProperty(dict, name)) {
        dict[name].push(val);
    } else {
        dict[name] = [val];
    }
}

function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

// --- node:url module APIs ---

export { URL };

function makeNodeError(code, Type, message) {
    const err = new Type(message);
    err.code = code;
    return err;
}

function makeInvalidUrlError(input) {
    const err = makeNodeError('ERR_INVALID_URL', TypeError, 'Invalid URL');
    err.input = input;
    return err;
}

const FORBIDDEN_HOST_CHARS = /[\0\t\n\r #%/<>?@\\^|]/;
const WARN_INVALID_HOSTNAME_KEY = '__wasm_rquickjs_url_warned_invalid_hostname';

if (globalThis[WARN_INVALID_HOSTNAME_KEY] === undefined) {
    globalThis[WARN_INVALID_HOSTNAME_KEY] = false;
}

function validateHostName(hostname, ipv6Host, input) {
    if (!hostname) {
        return;
    }
    if (FORBIDDEN_HOST_CHARS.test(hostname)) {
        throw makeInvalidUrlError(input);
    }
}

function emitInvalidUrlDeprecation(input) {
    if (globalThis[WARN_INVALID_HOSTNAME_KEY]) {
        return;
    }
    globalThis[WARN_INVALID_HOSTNAME_KEY] = true;

    const warningMessage = `The URL ${input} is invalid. Future versions of Node.js will throw an error.`;

    if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
        process.emitWarning(warningMessage, {
            type: 'DeprecationWarning',
            code: 'DEP0170',
        });
    }

    if (typeof process !== 'undefined' &&
        process.stderr &&
        typeof process.stderr.write === 'function') {
        process.stderr.write(`[DEP0170] DeprecationWarning: ${warningMessage}\n`);
    }
}

const ENCODE_CHARS_RE = /[\x00-\x1F\x20"#%?<>{}|\\^`~\[\]\x7F]/g;

function percentEncode(char) {
    const code = char.charCodeAt(0);
    if (code < 0x10) return '%0' + code.toString(16).toUpperCase();
    return '%' + code.toString(16).toUpperCase();
}

export function fileURLToPath(url, options) {
    const windows = options && options.windows === true;

    if (typeof url === 'string') {
        url = new URL(url);
    } else if (!(url instanceof URL)) {
        throw makeNodeError(
            'ERR_INVALID_ARG_TYPE',
            TypeError,
            'The "url" argument must be of type string or an instance of URL'
        );
    }

    if (url.protocol !== 'file:') {
        throw makeNodeError(
            'ERR_INVALID_URL_SCHEME',
            TypeError,
            'The URL must be of scheme file'
        );
    }

    if (windows) {
        const hostname = url.hostname;
        let pathname = url.pathname;

        if (hostname) {
            pathname = '\\\\' + hostname + pathname.replace(/\//g, '\\');
            return decodeURIComponent(pathname);
        }

        const match = pathname.match(/^\/([A-Za-z])(?:[:|])(\/.*)?$/);
        if (match) {
            const drive = match[1].toUpperCase();
            const rest = match[2] || '\\';
            return drive + ':' + decodeURIComponent(rest).replace(/\//g, '\\');
        }

        return decodeURIComponent(pathname).replace(/\//g, '\\');
    }

    if (url.hostname) {
        throw makeNodeError(
            'ERR_INVALID_FILE_URL_HOST',
            TypeError,
            'File URL host must be "localhost" or empty on the current platform'
        );
    }

    const pathname = url.pathname;
    if (pathname.indexOf('%2F') !== -1 || pathname.indexOf('%2f') !== -1) {
        throw makeNodeError(
            'ERR_INVALID_FILE_URL_PATH',
            TypeError,
            'File URL path must not include encoded / characters'
        );
    }

    return decodeURIComponent(pathname);
}

export function pathToFileURL(path, options) {
    if (typeof path !== 'string') {
        throw makeNodeError(
            'ERR_INVALID_ARG_TYPE',
            TypeError,
            'The "path" argument must be of type string'
        );
    }

    const windows = options && options.windows === true;

    if (windows) {
        let resolved = path.replace(/\\/g, '/');

        const extLocalMatch = resolved.match(/^\/\/\?\/([A-Za-z]:)(\/.*)?$/);
        if (extLocalMatch) {
            const drive = extLocalMatch[1][0].toUpperCase();
            const rest = extLocalMatch[2] || '/';
            return new URL('file:///' + drive + ':' + rest.replace(ENCODE_CHARS_RE, percentEncode));
        }

        const extUncMatch = resolved.match(/^\/\/\?\/UNC\/([^/]+)(\/.*)?$/);
        if (extUncMatch) {
            const host = extUncMatch[1];
            const rest = extUncMatch[2] || '/';
            return new URL('file://' + host + rest.replace(ENCODE_CHARS_RE, percentEncode));
        }

        if (resolved.startsWith('//')) {
            const rest = resolved.slice(2);
            if (rest.startsWith('/') || rest === '') {
                throw makeNodeError(
                    'ERR_INVALID_ARG_VALUE',
                    TypeError,
                    'The argument \'path\' must be a string. Received ' + JSON.stringify(path)
                );
            }
            const slashIdx = rest.indexOf('/');
            if (slashIdx === -1) {
                throw makeNodeError(
                    'ERR_INVALID_ARG_VALUE',
                    TypeError,
                    'The argument \'path\' must be a string. Received ' + JSON.stringify(path)
                );
            }
            const host = rest.slice(0, slashIdx);
            const pathPart = rest.slice(slashIdx);
            return new URL('file://' + host + pathPart.replace(ENCODE_CHARS_RE, percentEncode));
        }

        const driveMatch = resolved.match(/^([A-Za-z]):(\/.*)?$/);
        if (driveMatch) {
            const drive = driveMatch[1].toUpperCase();
            const rest = driveMatch[2] || '/';
            return new URL('file:///' + drive + ':' + rest.replace(ENCODE_CHARS_RE, percentEncode));
        }

        if (!resolved.startsWith('/')) {
            resolved = '/' + resolved;
        }
        return new URL('file://' + resolved.replace(ENCODE_CHARS_RE, percentEncode));
    }

    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    const encoded = path.replace(ENCODE_CHARS_RE, percentEncode);
    return new URL('file://' + encoded);
}

export function urlToHttpOptions(url) {
    const options = {
        protocol: url.protocol,
        hostname: typeof url.hostname === 'string' && url.hostname.startsWith('[')
            ? url.hostname.slice(1, -1)
            : url.hostname,
    };

    if (url.port !== '') {
        options.port = Number(url.port);
    }

    if (url.username || url.password) {
        options.auth = url.password
            ? url.username + ':' + url.password
            : url.username;
    }

    options.pathname = url.pathname;
    options.search = url.search;
    options.hash = url.hash;
    options.href = url.href;
    options.path = (url.pathname || '') + (url.search || '');

    return options;
}

export function format(urlObject, options) {
    if (typeof urlObject === 'string') {
        return formatLegacy(legacyParse(urlObject));
    }

    if (typeof urlObject !== 'object' || urlObject === null) {
        throw makeNodeError(
            'ERR_INVALID_ARG_TYPE',
            TypeError,
            'The "urlObject" argument must be one of type object or string'
        );
    }

    if (urlObject instanceof URL ||
        (typeof urlObject.href === 'string' &&
         typeof urlObject.protocol === 'string' &&
         typeof urlObject.hostname === 'string' &&
         !('slashes' in urlObject))) {
        if (options !== undefined && options !== null && typeof options !== 'object') {
            throw makeNodeError(
                'ERR_INVALID_ARG_TYPE',
                TypeError,
                'The "options" argument must be of type object'
            );
        }

        const opts = options || {};
        const auth = opts.auth !== undefined ? opts.auth : true;
        const fragment = opts.fragment !== undefined ? opts.fragment : true;
        const search = opts.search !== undefined ? opts.search : true;

        let result = urlObject.protocol;

        if (urlObject.host !== undefined && urlObject.host !== '') {
            result += '//';
            if (auth && (urlObject.username || urlObject.password)) {
                result += urlObject.username;
                if (urlObject.password) {
                    result += ':' + urlObject.password;
                }
                result += '@';
            }
            result += urlObject.host;
        } else if (urlObject.protocol === 'file:') {
            result += '//';
        }

        result += urlObject.pathname || '';

        if (search && urlObject.search) {
            result += urlObject.search;
        }

        if (fragment && urlObject.hash) {
            result += urlObject.hash;
        }

        return result;
    }

    return formatLegacy(urlObject);
}

function formatLegacy(urlObject) {
    let result = '';
    const protocol = urlObject.protocol || '';
    let pathname = urlObject.pathname || '';
    let host = '';

    if (urlObject.host) {
        host = urlObject.host;
    } else if (urlObject.hostname) {
        host = urlObject.hostname.indexOf(':') !== -1
            ? '[' + urlObject.hostname + ']'
            : urlObject.hostname;
        if (urlObject.port) {
            host += ':' + urlObject.port;
        }
    }

    if (urlObject.auth) {
        host = urlObject.auth + '@' + host;
    }

    if (protocol) {
        result += protocol;
    }

    if (urlObject.slashes || isSlashedProtocol(protocol)) {
        if (urlObject.slashes || host) {
            if (pathname && pathname.charAt(0) !== '/') {
                pathname = '/' + pathname;
            }
            result += '//';
        } else if (protocol.toLowerCase().startsWith('file')) {
            result += '//';
        }
    }

    result += host;
    result += pathname;

    if (urlObject.search) {
        result += urlObject.search;
    } else if (urlObject.query && typeof urlObject.query === 'object') {
        result += '?' + querystring.stringify(urlObject.query);
    }

    if (urlObject.hash) {
        result += urlObject.hash;
    }

    return result;
}

const SLASHED_PROTOCOLS = {
    'http:': true, 'https:': true, 'ftp:': true, 'gopher:': true, 'file:': true,
    'http': true, 'https': true, 'ftp': true, 'gopher': true, 'file': true,
    'ws:': true, 'wss:': true,
    'ws': true, 'wss': true,
};

const HOSTLESS_PROTOCOLS = {
    'javascript:': true,
    'javascript': true,
};

function isSlashedProtocol(protocol) {
    return typeof protocol === 'string' && SLASHED_PROTOCOLS[protocol.toLowerCase()] === true;
}

export function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.host = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.query = null;
    this.pathname = null;
    this.path = null;
    this.href = null;
}

Url.prototype.parse = function parseUrl(urlString, parseQueryString, slashesDenoteHost) {
    const parsed = parse(urlString, parseQueryString, slashesDenoteHost);
    Object.assign(this, parsed);
    return this;
};

Url.prototype.format = function formatUrl() {
    return formatLegacy(this);
};

Url.prototype.resolve = function resolveUrl(relative) {
    return this.resolveObject(relative).format();
};

Url.prototype.resolveObject = function resolveUrlObject(relative) {
    const rel = typeof relative === 'string' ? parse(relative, false, true) : relative;

    const result = new Url();
    Object.assign(result, this);

    // Hash is always overridden, even for empty relatives.
    result.hash = rel.hash;

    if (rel.href === '') {
        result.href = result.format();
        return result;
    }

    if (rel.slashes && !rel.protocol) {
        Object.keys(rel).forEach((key) => {
            if (key !== 'protocol') {
                result[key] = rel[key];
            }
        });

        if (isSlashedProtocol(result.protocol) && result.hostname && !result.pathname) {
            result.path = result.pathname = '/';
        }

        result.href = result.format();
        return result;
    }

    if (rel.protocol && rel.protocol !== result.protocol) {
        if (!isSlashedProtocol(rel.protocol)) {
            Object.assign(result, rel);
            result.href = result.format();
            return result;
        }

        result.protocol = rel.protocol;
        if (!rel.host && !/^file:?$/.test(rel.protocol) && !HOSTLESS_PROTOCOLS[rel.protocol]) {
            const relPath = (rel.pathname || '').split('/');
            while (relPath.length && !(rel.host = relPath.shift()));

            rel.host = rel.host || '';
            rel.hostname = rel.hostname || '';

            if (relPath[0] !== '') {
                relPath.unshift('');
            }
            if (relPath.length < 2) {
                relPath.unshift('');
            }

            result.pathname = relPath.join('/');
        } else {
            result.pathname = rel.pathname;
        }

        result.search = rel.search;
        result.query = rel.query;
        result.host = rel.host || '';
        result.auth = rel.auth;
        result.hostname = rel.hostname || rel.host;
        result.port = rel.port;

        if (result.pathname || result.search) {
            result.path = (result.pathname || '') + (result.search || '');
        }

        result.slashes = result.slashes || rel.slashes;
        result.href = result.format();
        return result;
    }

    const isSourceAbs = result.pathname && result.pathname.charAt(0) === '/';
    const isRelAbs = rel.host || (rel.pathname && rel.pathname.charAt(0) === '/');
    let mustEndAbs = isRelAbs || isSourceAbs || (result.host && rel.pathname);
    const removeAllDots = mustEndAbs;
    let srcPath = (result.pathname && result.pathname.split('/')) || [];
    const relPath = (rel.pathname && rel.pathname.split('/')) || [];
    const noLeadingSlashes = result.protocol && !isSlashedProtocol(result.protocol);

    if (noLeadingSlashes) {
        result.hostname = '';
        result.port = null;

        if (result.host) {
            if (srcPath[0] === '') {
                srcPath[0] = result.host;
            } else {
                srcPath.unshift(result.host);
            }
        }

        result.host = '';

        if (rel.protocol) {
            rel.hostname = null;
            rel.port = null;
            result.auth = null;

            if (rel.host) {
                if (relPath[0] === '') {
                    relPath[0] = rel.host;
                } else {
                    relPath.unshift(rel.host);
                }
            }

            rel.host = null;
        }

        mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
    }

    if (isRelAbs) {
        if (rel.host || rel.host === '') {
            if (result.host !== rel.host) {
                result.auth = null;
            }
            result.host = rel.host;
            result.port = rel.port;
        }

        if (rel.hostname || rel.hostname === '') {
            if (result.hostname !== rel.hostname) {
                result.auth = null;
            }
            result.hostname = rel.hostname;
        }

        result.search = rel.search;
        result.query = rel.query;
        srcPath = relPath;
    } else if (relPath.length) {
        srcPath = srcPath || [];
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        result.search = rel.search;
        result.query = rel.query;
    } else if (rel.search !== null && rel.search !== undefined) {
        if (noLeadingSlashes) {
            result.hostname = result.host = srcPath.shift();

            const authInHost =
                result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;
            if (authInHost) {
                result.auth = authInHost.shift();
                result.host = result.hostname = authInHost.shift();
            }
        }

        result.search = rel.search;
        result.query = rel.query;

        if (result.pathname !== null || result.search !== null) {
            result.path = (result.pathname ? result.pathname : '') +
                (result.search ? result.search : '');
        }

        result.href = result.format();
        return result;
    }

    if (!srcPath.length) {
        result.pathname = null;
        if (result.search) {
            result.path = '/' + result.search;
        } else {
            result.path = null;
        }

        result.href = result.format();
        return result;
    }

    let last = srcPath[srcPath.length - 1];
    const hasTrailingSlash = (
        ((result.host || rel.host || srcPath.length > 1) &&
            (last === '.' || last === '..')) ||
        last === ''
    );

    let up = 0;
    for (let i = srcPath.length - 1; i >= 0; i--) {
        last = srcPath[i];
        if (last === '.') {
            srcPath.splice(i, 1);
        } else if (last === '..') {
            srcPath.splice(i, 1);
            up++;
        } else if (up) {
            srcPath.splice(i, 1);
            up--;
        }
    }

    if (!mustEndAbs && !removeAllDots) {
        while (up--) {
            srcPath.unshift('..');
        }
    }

    if (mustEndAbs && srcPath[0] !== '' && (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
        srcPath.unshift('');
    }

    if (hasTrailingSlash && srcPath.join('/').slice(-1) !== '/') {
        srcPath.push('');
    }

    const isAbsolute = srcPath[0] === '' || (srcPath[0] && srcPath[0].charAt(0) === '/');

    if (noLeadingSlashes) {
        result.hostname = result.host = isAbsolute ? '' : srcPath.length ? srcPath.shift() : '';

        const authInHost = result.host && result.host.indexOf('@') > 0 ?
            result.host.split('@') : false;
        if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
        }
    }

    mustEndAbs = mustEndAbs || (result.host && srcPath.length);

    if (mustEndAbs && !isAbsolute) {
        srcPath.unshift('');
    }

    if (!srcPath.length) {
        result.pathname = null;
        result.path = null;
    } else {
        result.pathname = srcPath.join('/');
    }

    if (result.pathname !== null || result.search !== null) {
        result.path = (result.pathname ? result.pathname : '') +
            (result.search ? result.search : '');
    }

    result.auth = rel.auth || result.auth;
    result.slashes = result.slashes || rel.slashes;
    result.href = result.format();
    return result;
};

function legacyParse(urlString, parseState) {
    const u = new Url();
    let shouldWarnInvalidHost = false;

    if (typeof urlString !== 'string') {
        return u;
    }

    let rest = urlString.trim();
    u.href = rest;

    const hashIdx = rest.indexOf('#');
    if (hashIdx !== -1) {
        u.hash = rest.slice(hashIdx);
        rest = rest.slice(0, hashIdx);
    }

    const qIdx = rest.indexOf('?');
    if (qIdx !== -1) {
        u.search = rest.slice(qIdx);
        u.query = rest.slice(qIdx + 1);
        rest = rest.slice(0, qIdx);
    }

    const protoMatch = rest.match(/^([a-zA-Z][a-zA-Z0-9.+\-]*:)/);
    if (protoMatch) {
        u.protocol = protoMatch[1].toLowerCase();
        rest = rest.slice(protoMatch[1].length);
    }

    if (rest.startsWith('//')) {
        u.slashes = true;
        rest = rest.slice(2);

        const authHostPath = rest;
        let pathStart = authHostPath.indexOf('/');
        if (pathStart === -1) pathStart = authHostPath.length;

        const authHost = authHostPath.slice(0, pathStart);
        rest = authHostPath.slice(pathStart);

        const atIdx = authHost.lastIndexOf('@');
        if (atIdx !== -1) {
            u.auth = decodeURIComponent(authHost.slice(0, atIdx));
            const hostPart = authHost.slice(atIdx + 1);
            shouldWarnInvalidHost = parseHostPort(u, hostPart, urlString) || shouldWarnInvalidHost;
        } else {
            shouldWarnInvalidHost = parseHostPort(u, authHost, urlString) || shouldWarnInvalidHost;
        }
    } else if (u.protocol && !isSlashedProtocol(u.protocol) && !HOSTLESS_PROTOCOLS[u.protocol]) {
        let pathStart = rest.indexOf('/');
        if (pathStart === -1) {
            pathStart = rest.length;
        }

        const authHost = rest.slice(0, pathStart);
        rest = rest.slice(pathStart);

        const atIdx = authHost.lastIndexOf('@');
        if (atIdx !== -1) {
            u.auth = decodeURIComponent(authHost.slice(0, atIdx));
            const hostPart = authHost.slice(atIdx + 1);
            shouldWarnInvalidHost = parseHostPort(u, hostPart, urlString) || shouldWarnInvalidHost;
        } else {
            shouldWarnInvalidHost = parseHostPort(u, authHost, urlString) || shouldWarnInvalidHost;
        }
    }

    if (rest) {
        u.pathname = rest;
    } else if (u.slashes && u.protocol && isSlashedProtocol(u.protocol) && u.host !== '') {
        u.pathname = '/';
    }

    if (u.pathname !== null || u.search !== null) {
        u.path = (u.pathname || '') + (u.search || '');
    } else {
        u.path = null;
    }
    u.href = formatLegacy(u);

    if (parseState && shouldWarnInvalidHost) {
        parseState.shouldWarnInvalidHost = true;
    }

    return u;
}

function parseHostPort(u, hostStr, input) {
    if (!hostStr) {
        u.host = '';
        u.hostname = '';
        return false;
    }

    let isIpv6Host = false;
    let shouldWarnInvalidHost = false;
    if (hostStr.startsWith('[')) {
        const bracketEnd = hostStr.indexOf(']');
        if (bracketEnd !== -1) {
            isIpv6Host = true;
            u.hostname = hostStr.slice(1, bracketEnd);
            const remaining = hostStr.slice(bracketEnd + 1);
            if (remaining.startsWith(':')) {
                u.port = remaining.slice(1) || null;
            }
        } else {
            u.hostname = hostStr;
        }
    } else {
        const colonIdx = hostStr.lastIndexOf(':');
        if (colonIdx !== -1) {
            const maybPort = hostStr.slice(colonIdx + 1);
            if (/^\d+$/.test(maybPort)) {
                u.hostname = hostStr.slice(0, colonIdx);
                u.port = maybPort;
            } else {
                u.hostname = hostStr;
                shouldWarnInvalidHost = true;
            }
        } else {
            u.hostname = hostStr;
        }
    }

    validateHostName(u.hostname, isIpv6Host, input);

    u.host = u.hostname;
    if (u.port) {
        u.host += ':' + u.port;
    }

    return shouldWarnInvalidHost;
}

export function parse(urlString, parseQueryString, slashesDenoteHost) {
    if (urlString instanceof Url) {
        return urlString;
    }

    if (typeof urlString !== 'string') {
        throw new ERR_INVALID_ARG_TYPE('url', 'string', urlString);
    }

    const parseState = { shouldWarnInvalidHost: false };
    const u = legacyParse(urlString, parseState);
    let shouldWarnInvalidHost = parseState.shouldWarnInvalidHost;

    if (slashesDenoteHost && !u.protocol) {
        let rest = urlString.trim();
        u.href = rest;

        const hashIdx = rest.indexOf('#');
        if (hashIdx !== -1) {
            u.hash = rest.slice(hashIdx);
            rest = rest.slice(0, hashIdx);
        }

        const qIdx = rest.indexOf('?');
        if (qIdx !== -1) {
            u.search = rest.slice(qIdx);
            u.query = rest.slice(qIdx + 1);
            rest = rest.slice(0, qIdx);
        }

        if (rest.startsWith('//')) {
            u.slashes = true;
            rest = rest.slice(2);
            const pathStart = rest.indexOf('/');
            if (pathStart === -1) {
                shouldWarnInvalidHost = parseHostPort(u, rest, urlString) || shouldWarnInvalidHost;
                rest = '';
            } else {
                shouldWarnInvalidHost = parseHostPort(u, rest.slice(0, pathStart), urlString) || shouldWarnInvalidHost;
                rest = rest.slice(pathStart);
            }
        }

        u.pathname = rest || null;
        if (u.pathname !== null || u.search !== null) {
            u.path = (u.pathname || '') + (u.search || '');
        } else {
            u.path = null;
        }
        u.href = formatLegacy(u);
    }

    if (shouldWarnInvalidHost) {
        emitInvalidUrlDeprecation(urlString);
    }

    if (parseQueryString) {
        const qs = u.query || '';
        const parsed = querystring.parse(qs);
        Object.setPrototypeOf(parsed, null);
        u.query = parsed;
    }

    return u;
}

export function resolve(from, to) {
    return parse(from, false, true).resolve(to);
}

export function resolveObject(source, relative) {
    if (!source) {
        return relative;
    }

    return parse(source, false, true).resolveObject(relative);
}

export function domainToASCII(domain) {
    return domain;
}

export function domainToUnicode(domain) {
    return domain;
}

export default {
    URL,
    URLSearchParams,
    fileURLToPath,
    pathToFileURL,
    urlToHttpOptions,
    format,
    parse,
    resolve,
    resolveObject,
    Url,
    domainToASCII,
    domainToUnicode,
};
