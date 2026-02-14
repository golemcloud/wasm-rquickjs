import { URL } from '__wasm_rquickjs_builtin/url_native';
import * as querystring from 'node:querystring';

// Based on https://github.com/jerrybendy/url-search-params-polyfill
/**!
 * url-search-params-polyfill
 *
 * @author Jerry Bendy (https://github.com/jerrybendy)
 * @licence MIT
 */

const __URLSearchParams__ = "__URLSearchParams__";

/**
 * Make a URLSearchParams instance
 *
 * @param {object|string|URLSearchParams} search
 * @constructor
 */
function URLSearchParamsPolyfill(search) {
    search = search || "";

    // support construct object with another URLSearchParams instance
    if (search instanceof URLSearchParams || search instanceof URLSearchParamsPolyfill) {
        search = search.toString();
    }
    this [__URLSearchParams__] = parseToDict(search);
}

const prototype = URLSearchParamsPolyfill.prototype;

/**
 * Appends a specified key/value pair as a new search parameter.
 *
 * @param {string} name
 * @param {string} value
 */
prototype.append = function (name, value) {
    appendTo(this [__URLSearchParams__], name, value);
};

/**
 * Deletes the given search parameter, and its associated value,
 * from the list of all search parameters.
 *
 * @param {string} name
 */
prototype['delete'] = function (name) {
    delete this [__URLSearchParams__] [name];
};

/**
 * Returns the first value associated to the given search parameter.
 *
 * @param {string} name
 * @returns {string|null}
 */
prototype.get = function (name) {
    var dict = this [__URLSearchParams__];
    return this.has(name) ? dict[name][0] : null;
};

/**
 * Returns all the values association with a given search parameter.
 *
 * @param {string} name
 * @returns {Array}
 */
prototype.getAll = function (name) {
    var dict = this [__URLSearchParams__];
    return this.has(name) ? dict [name].slice(0) : [];
};

/**
 * Returns a Boolean indicating if such a search parameter exists.
 *
 * @param {string} name
 * @returns {boolean}
 */
prototype.has = function (name, value) {
    if (hasOwnProperty(this [__URLSearchParams__], name)) {
        if (value === undefined) {
            return true;
        } else {
            var dict = this [__URLSearchParams__];
            for (var i = 0; i < dict[name].length; i++) {
                if (dict[name][i] === value) {
                    return true;
                }
            }
            return false;
        }
    } else {
        return false;
    }
};

/**
 * Sets the value associated to a given search parameter to
 * the given value. If there were several values, delete the
 * others.
 *
 * @param {string} name
 * @param {string} value
 */
prototype.set = function set(name, value) {
    this [__URLSearchParams__][name] = ['' + value];
};

/**
 * Returns a string containing a query string suitable for use in a URL.
 *
 * @returns {string}
 */
prototype.toString = function () {
    var dict = this[__URLSearchParams__], query = [], i, key, name, value;
    for (key in dict) {
        name = encode(key);
        for (i = 0, value = dict[key]; i < value.length; i++) {
            query.push(name + '=' + encode(value[i]));
        }
    }
    return query.join('&');
};

export const URLSearchParams = URLSearchParamsPolyfill;

var USPProto = URLSearchParams.prototype;

USPProto.polyfill = true;

// Fix #54, `toString.call(new URLSearchParams)` will return correct value when Proxy not used
USPProto[Symbol.toStringTag] = 'URLSearchParams';

/**
 *
 * @param {function} callback
 * @param {object} thisArg
 */
if (!('forEach' in USPProto)) {
    USPProto.forEach = function (callback, thisArg) {
        var dict = parseToDict(this.toString());
        Object.getOwnPropertyNames(dict).forEach(function (name) {
            dict[name].forEach(function (value) {
                callback.call(thisArg, value, name, this);
            }, this);
        }, this);
    };
}

/**
 * Sort all name-value pairs
 */
if (!('sort' in USPProto)) {
    USPProto.sort = function () {
        var dict = parseToDict(this.toString()), keys = [], k, i, j;
        for (k in dict) {
            keys.push(k);
        }
        keys.sort();

        for (i = 0; i < keys.length; i++) {
            this['delete'](keys[i]);
        }
        for (i = 0; i < keys.length; i++) {
            var key = keys[i], values = dict[key];
            for (j = 0; j < values.length; j++) {
                this.append(key, values[j]);
            }
        }
    };
}

/**
 * Returns an iterator allowing to go through all keys of
 * the key/value pairs contained in this object.
 *
 * @returns {function}
 */
if (!('keys' in USPProto)) {
    USPProto.keys = function () {
        var items = [];
        this.forEach(function (item, name) {
            items.push(name);
        });
        return makeIterator(items);
    };
}

/**
 * Returns an iterator allowing to go through all values of
 * the key/value pairs contained in this object.
 *
 * @returns {function}
 */
if (!('values' in USPProto)) {
    USPProto.values = function () {
        var items = [];
        this.forEach(function (item) {
            items.push(item);
        });
        return makeIterator(items);
    };
}

/**
 * Returns an iterator allowing to go through all key/value
 * pairs contained in this object.
 *
 * @returns {function}
 */
if (!('entries' in USPProto)) {
    USPProto.entries = function () {
        var items = [];
        this.forEach(function (item, name) {
            items.push([name, item]);
        });
        return makeIterator(items);
    };
}

USPProto[Symbol.iterator] = USPProto[Symbol.iterator] || USPProto.entries;

if (!('size' in USPProto)) {
    Object.defineProperty(USPProto, 'size', {
        get: function () {
            var dict = parseToDict(this.toString())
            if (USPProto === this) {
                throw new TypeError('Illegal invocation at URLSearchParams.invokeGetter')
            }
            return Object.keys(dict).reduce(function (prev, cur) {
                return prev + dict[cur].length;
            }, 0);
        }
    });
}

function encode(str) {
    var replace = {
        '!': '%21',
        "'": '%27',
        '(': '%28',
        ')': '%29',
        '~': '%7E',
        '%20': '+',
        '%00': '\x00'
    };
    return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, function (match) {
        return replace[match];
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
    var iterator = {
        next: function () {
            var value = arr.shift();
            return {done: value === undefined, value: value};
        }
    };

    iterator[Symbol.iterator] = function () {
        return iterator;
    };

    return iterator;
}

function parseToDict(search) {
    var dict = {};

    if (typeof search === "object") {
        // if `search` is an array, treat it as a sequence
        if (isArray(search)) {
            for (var i = 0; i < search.length; i++) {
                var item = search[i];
                if (isArray(item) && item.length === 2) {
                    appendTo(dict, item[0], item[1]);
                } else {
                    throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                }
            }

        } else {
            for (var key in search) {
                if (search.hasOwnProperty(key)) {
                    appendTo(dict, key, search[key]);
                }
            }
        }

    } else {
        // remove first '?'
        if (search.indexOf("?") === 0) {
            search = search.slice(1);
        }

        var pairs = search.split("&");
        for (var j = 0; j < pairs.length; j++) {
            var value = pairs [j],
                index = value.indexOf('=');

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
    var val = typeof value === 'string' ? value : (
        value !== null && value !== undefined && typeof value.toString === 'function' ? value.toString() : JSON.stringify(value)
    );

    // #47 Prevent using `hasOwnProperty` as a property name
    if (hasOwnProperty(dict, name)) {
        dict[name].push(val);
    } else {
        dict[name] = [val];
    }
}

function isArray(val) {
    return !!val && '[object Array]' === Object.prototype.toString.call(val);
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

    if (protocol) {
        result += protocol;
    }

    if (urlObject.slashes || (!protocol || isSlashedProtocol(protocol))) {
        if (urlObject.host || urlObject.hostname) {
            result += '//';
        }
    }

    if (urlObject.auth) {
        result += urlObject.auth + '@';
    }

    if (urlObject.host) {
        result += urlObject.host;
    } else {
        if (urlObject.hostname) {
            result += urlObject.hostname.indexOf(':') !== -1
                ? '[' + urlObject.hostname + ']'
                : urlObject.hostname;
        }
        if (urlObject.port) {
            result += ':' + urlObject.port;
        }
    }

    if (urlObject.pathname) {
        result += urlObject.pathname;
    }

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
};

function isSlashedProtocol(protocol) {
    return SLASHED_PROTOCOLS[protocol.toLowerCase()] === true;
}

export function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = undefined;
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

function legacyParse(urlString) {
    const u = new Url();

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
        rest = authHostPath.slice(pathStart) || '/';

        const atIdx = authHost.lastIndexOf('@');
        if (atIdx !== -1) {
            u.auth = decodeURIComponent(authHost.slice(0, atIdx));
            const hostPart = authHost.slice(atIdx + 1);
            parseHostPort(u, hostPart);
        } else {
            parseHostPort(u, authHost);
        }
    } else if (u.protocol && isSlashedProtocol(u.protocol)) {
        u.slashes = true;
        u.hostname = '';
        u.host = '';
        u.pathname = rest || '/';
        u.path = u.pathname + (u.search || '');
        return u;
    }

    if (rest) {
        u.pathname = rest;
    } else if (u.slashes) {
        u.pathname = '/';
    }

    u.path = (u.pathname || '') + (u.search || '');
    u.href = formatLegacy(u);

    return u;
}

function parseHostPort(u, hostStr) {
    if (!hostStr) {
        u.host = '';
        u.hostname = '';
        return;
    }

    if (hostStr.startsWith('[')) {
        const bracketEnd = hostStr.indexOf(']');
        if (bracketEnd !== -1) {
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
            }
        } else {
            u.hostname = hostStr;
        }
    }

    u.host = u.hostname;
    if (u.port) {
        u.host += ':' + u.port;
    }
}

export function parse(urlString, parseQueryString, slashesDenoteHost) {
    if (typeof urlString !== 'string') {
        throw makeNodeError(
            'ERR_INVALID_ARG_TYPE',
            TypeError,
            'The "url" argument must be of type string. Received type ' + typeof urlString
        );
    }

    const u = legacyParse(urlString);

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
                parseHostPort(u, rest);
                rest = '';
            } else {
                parseHostPort(u, rest.slice(0, pathStart));
                rest = rest.slice(pathStart);
            }
        }

        u.pathname = rest || null;
        u.path = (u.pathname || '') + (u.search || '');
        u.href = formatLegacy(u);
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
    return resolveObject(from, to).href;
}

export function resolveObject(source, relative) {
    if (!source) {
        return legacyParse(relative || '');
    }

    const src = typeof source === 'string' ? legacyParse(source) : source;

    if (!relative) {
        const result = new Url();
        Object.assign(result, src);
        return result;
    }

    const rel = typeof relative === 'string' ? legacyParse(relative) : relative;

    if (rel.protocol && rel.protocol !== src.protocol) {
        return rel;
    }

    if (src.href && rel.href) {
        try {
            const base = new URL(src.href);
            const resolved = new URL(rel.href, base);
            return legacyParse(resolved.href);
        } catch {
            // Fall through to manual resolution
        }
    }

    const result = new Url();
    result.protocol = src.protocol;
    result.slashes = src.slashes;
    result.auth = rel.auth !== undefined ? rel.auth : src.auth;

    if (rel.hostname || rel.host) {
        result.hostname = rel.hostname || src.hostname;
        result.host = rel.host || src.host;
        result.port = rel.port || src.port;
        result.pathname = rel.pathname || '/';
    } else {
        result.hostname = src.hostname;
        result.host = src.host;
        result.port = src.port;

        if (rel.pathname) {
            if (rel.pathname.startsWith('/')) {
                result.pathname = rel.pathname;
            } else {
                let srcPath = src.pathname || '/';
                const lastSlash = srcPath.lastIndexOf('/');
                if (lastSlash !== -1) {
                    srcPath = srcPath.slice(0, lastSlash + 1);
                }
                result.pathname = srcPath + rel.pathname;
            }
        } else {
            result.pathname = src.pathname;
        }
    }

    result.search = rel.search !== null ? rel.search : src.search;
    result.query = rel.query !== null ? rel.query : src.query;
    result.hash = rel.hash;
    result.path = (result.pathname || '') + (result.search || '');
    result.href = formatLegacy(result);

    return result;
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

