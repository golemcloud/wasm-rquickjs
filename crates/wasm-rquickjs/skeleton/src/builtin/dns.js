// node:dns stub implementation
// All functions throw errors as DNS resolution is not supported in WASM environment

const NOT_SUPPORTED_ERROR = new Error('dns is not supported in WebAssembly environment');

// Error codes
export const NODATA = 'ENODATA';
export const FORMERR = 'EFORMERR';
export const SERVFAIL = 'ESERVFAIL';
export const NOTFOUND = 'ENOTFOUND';
export const NOTIMP = 'ENOTIMP';
export const REFUSED = 'EREFUSED';
export const BADQUERY = 'EBADQUERY';
export const BADNAME = 'EBADNAME';
export const BADFAMILY = 'EBADFAMILY';
export const BADRESP = 'EBADRESP';
export const CONNREFUSED = 'ECONNREFUSED';
export const TIMEOUT = 'ETIMEOUT';
export const EOF = 'EOF';
export const FILE = 'EFILE';
export const NOMEM = 'ENOMEM';
export const DESTRUCTION = 'EDESTRUCTION';
export const BADSTR = 'EBADSTR';
export const BADFLAGS = 'EBADFLAGS';
export const NONAME = 'ENONAME';
export const BADHINTS = 'EBADHINTS';
export const NOTINITIALIZED = 'ENOTINITIALIZED';
export const LOADIPHLPAPI = 'ELOADIPHLPAPI';
export const ADDRGETNETWORKPARAMS = 'EADDRGETNETWORKPARAMS';
export const CANCELLED = 'ECANCELLED';
export const ADDRCONFIG = 'EADDRCONFIG';

// Callback-style functions
export function lookup(hostname, options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function lookupService(address, port, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolve(hostname, rrtype, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolve4(hostname, options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolve6(hostname, options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveAny(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveCname(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveCaa(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveMx(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveNaptr(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveNs(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolvePtr(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveSoa(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveSrv(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function resolveTxt(hostname, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function reverse(ip, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function setServers(servers) {
    throw NOT_SUPPORTED_ERROR;
}

export function getServers() {
    throw NOT_SUPPORTED_ERROR;
}

export function setDefaultResultOrder(order) {
    throw NOT_SUPPORTED_ERROR;
}

export function getDefaultResultOrder() {
    throw NOT_SUPPORTED_ERROR;
}

// Resolver class
export class Resolver {
    constructor() {}
    cancel() { throw NOT_SUPPORTED_ERROR; }
    getServers() { throw NOT_SUPPORTED_ERROR; }
    setServers() { throw NOT_SUPPORTED_ERROR; }
    resolve(hostname, rrtype, callback) { throw NOT_SUPPORTED_ERROR; }
    resolve4(hostname, options, callback) { throw NOT_SUPPORTED_ERROR; }
    resolve6(hostname, options, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveAny(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveCname(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveCaa(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveMx(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveNaptr(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveNs(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolvePtr(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveSoa(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveSrv(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    resolveTxt(hostname, callback) { throw NOT_SUPPORTED_ERROR; }
    reverse(ip, callback) { throw NOT_SUPPORTED_ERROR; }
    setLocalAddress(ipv4, ipv6) { throw NOT_SUPPORTED_ERROR; }
    lookup(hostname, options, callback) { throw NOT_SUPPORTED_ERROR; }
}

// Promise-based API
export const promises = {
    lookup(hostname, options) { throw NOT_SUPPORTED_ERROR; },
    lookupService(address, port) { throw NOT_SUPPORTED_ERROR; },
    resolve(hostname, rrtype) { throw NOT_SUPPORTED_ERROR; },
    resolve4(hostname, options) { throw NOT_SUPPORTED_ERROR; },
    resolve6(hostname, options) { throw NOT_SUPPORTED_ERROR; },
    resolveAny(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveCname(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveCaa(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveMx(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveNaptr(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveNs(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolvePtr(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveSoa(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveSrv(hostname) { throw NOT_SUPPORTED_ERROR; },
    resolveTxt(hostname) { throw NOT_SUPPORTED_ERROR; },
    reverse(ip) { throw NOT_SUPPORTED_ERROR; },
    setServers(servers) { throw NOT_SUPPORTED_ERROR; },
    getServers() { throw NOT_SUPPORTED_ERROR; },
    setDefaultResultOrder(order) { throw NOT_SUPPORTED_ERROR; },
    getDefaultResultOrder() { throw NOT_SUPPORTED_ERROR; },
    Resolver: class Resolver {
        constructor() {}
        cancel() { throw NOT_SUPPORTED_ERROR; }
        resolve(hostname, rrtype) { throw NOT_SUPPORTED_ERROR; }
        resolve4(hostname, options) { throw NOT_SUPPORTED_ERROR; }
        resolve6(hostname, options) { throw NOT_SUPPORTED_ERROR; }
        resolveAny(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveCname(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveCaa(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveMx(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveNaptr(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveNs(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolvePtr(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveSoa(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveSrv(hostname) { throw NOT_SUPPORTED_ERROR; }
        resolveTxt(hostname) { throw NOT_SUPPORTED_ERROR; }
        reverse(ip) { throw NOT_SUPPORTED_ERROR; }
        setLocalAddress(ipv4, ipv6) { throw NOT_SUPPORTED_ERROR; }
    },
};

export default {
    lookup,
    lookupService,
    resolve,
    resolve4,
    resolve6,
    resolveAny,
    resolveCname,
    resolveCaa,
    resolveMx,
    resolveNaptr,
    resolveNs,
    resolvePtr,
    resolveSoa,
    resolveSrv,
    resolveTxt,
    reverse,
    setServers,
    getServers,
    setDefaultResultOrder,
    getDefaultResultOrder,
    Resolver,
    promises,
    NODATA,
    FORMERR,
    SERVFAIL,
    NOTFOUND,
    NOTIMP,
    REFUSED,
    BADQUERY,
    BADNAME,
    BADFAMILY,
    BADRESP,
    CONNREFUSED,
    TIMEOUT,
    EOF,
    FILE,
    NOMEM,
    DESTRUCTION,
    BADSTR,
    BADFLAGS,
    NONAME,
    BADHINTS,
    NOTINITIALIZED,
    LOADIPHLPAPI,
    ADDRGETNETWORKPARAMS,
    CANCELLED,
    ADDRCONFIG,
};