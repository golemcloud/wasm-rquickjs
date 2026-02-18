import dns from 'node:dns';
import { promises as dnsPromises } from 'node:dns';

export async function test() {
    const results = {};

    // Test 1: Error codes exist
    results.hasErrorCodes = (
        dns.NODATA === 'ENODATA' &&
        dns.NOTFOUND === 'ENOTFOUND' &&
        dns.SERVFAIL === 'ESERVFAIL' &&
        dns.NOTIMP === 'ENOTIMP' &&
        dns.TIMEOUT === 'ETIMEOUT'
    );

    // Test 2: Functions exist
    results.hasLookup = typeof dns.lookup === 'function';
    results.hasResolve = typeof dns.resolve === 'function';
    results.hasResolve4 = typeof dns.resolve4 === 'function';
    results.hasResolve6 = typeof dns.resolve6 === 'function';
    results.hasReverse = typeof dns.reverse === 'function';
    results.hasSetServers = typeof dns.setServers === 'function';
    results.hasGetServers = typeof dns.getServers === 'function';
    results.hasSetDefaultResultOrder = typeof dns.setDefaultResultOrder === 'function';
    results.hasGetDefaultResultOrder = typeof dns.getDefaultResultOrder === 'function';

    // Test 3: Resolver class exists
    results.hasResolver = typeof dns.Resolver === 'function';
    const resolver = new dns.Resolver();
    results.resolverHasResolve = typeof resolver.resolve === 'function';
    results.resolverHasLookup = typeof resolver.lookup === 'function';

    // Test 4: Promises API exists
    results.hasPromises = typeof dns.promises === 'object';
    results.promisesHasLookup = typeof dns.promises.lookup === 'function';
    results.promisesHasResolve = typeof dns.promises.resolve === 'function';
    results.promisesHasResolve4 = typeof dns.promises.resolve4 === 'function';
    results.promisesHasResolve6 = typeof dns.promises.resolve6 === 'function';

    // Test 5: setDefaultResultOrder / getDefaultResultOrder
    dns.setDefaultResultOrder('ipv4first');
    results.resultOrderSet = dns.getDefaultResultOrder() === 'ipv4first';
    dns.setDefaultResultOrder('verbatim');

    // Test 6: setServers / getServers
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    const servers = dns.getServers();
    results.serversSet = servers.length === 2 && servers[0] === '8.8.8.8';

    // Test 7: lookup with IP address passthrough (should work without network)
    results.ipPassthrough = await new Promise((resolve) => {
        dns.lookup('127.0.0.1', (err, address, family) => {
            resolve(!err && address === '127.0.0.1' && family === 4);
        });
    });

    // Test 8: lookup with IP passthrough (IPv6)
    results.ipv6Passthrough = await new Promise((resolve) => {
        dns.lookup('::1', (err, address, family) => {
            resolve(!err && address === '::1' && family === 6);
        });
    });

    // Test 9: lookup with null hostname returns loopback
    results.nullHostname = await new Promise((resolve) => {
        dns.lookup('', (err, address, family) => {
            resolve(!err && address === '127.0.0.1' && family === 4);
        });
    });

    // Test 10: lookup with all: true and IP passthrough
    results.lookupAll = await new Promise((resolve) => {
        dns.lookup('127.0.0.1', { all: true }, (err, addresses) => {
            resolve(!err && Array.isArray(addresses) && addresses.length === 1 &&
                addresses[0].address === '127.0.0.1' && addresses[0].family === 4);
        });
    });

    // Test 11: Promises lookup with IP passthrough
    try {
        const promiseResult = await dnsPromises.lookup('127.0.0.1');
        results.promiseLookup = promiseResult.address === '127.0.0.1' && promiseResult.family === 4;
    } catch (e) {
        results.promiseLookup = false;
    }

    // Test 12: lookup with family mismatch should error
    results.familyMismatch = await new Promise((resolve) => {
        dns.lookup('127.0.0.1', { family: 6 }, (err) => {
            resolve(err && err.code === 'ENOTFOUND');
        });
    });

    // Test 13: unsupported record types return ENOTIMP
    results.unsupportedMx = await new Promise((resolve) => {
        dns.resolveMx('example.com', (err) => {
            resolve(err && err.code === 'ENOTIMP');
        });
    });

    // Test 14: Hint flags exist
    results.hasAddrconfig = dns.ADDRCONFIG === 1024;
    results.hasV4mapped = dns.V4MAPPED === 8;
    results.hasAll = dns.ALL === 16;

    return JSON.stringify(results);
}
