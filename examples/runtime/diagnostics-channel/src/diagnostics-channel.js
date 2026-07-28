import dc from 'node:diagnostics_channel';
import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export async function test() {
    const results = {};
    const errors = [];

    // === Basic Channel pub/sub ===
    try {
        const ch = dc.channel('test:basic');
        results.channelCreated = ch instanceof dc.Channel;
        results.channelName = ch.name === 'test:basic';
        results.noSubscribers = !ch.hasSubscribers;

        let received = null;
        const sub = (msg, name) => { received = { msg, name }; };
        ch.subscribe(sub);
        results.hasSubscribers = ch.hasSubscribers;

        ch.publish({ hello: 'world' });
        results.receivedMessage = received !== null && received.msg.hello === 'world';
        results.receivedName = received !== null && received.name === 'test:basic';

        ch.unsubscribe(sub);
        results.unsubscribed = !ch.hasSubscribers;
    } catch (e) {
        errors.push('basic: ' + e.message);
    }

    // === Module-level subscribe/unsubscribe ===
    try {
        let called = false;
        const sub = () => { called = true; };
        dc.subscribe('test:module', sub);
        results.moduleHasSubscribers = dc.hasSubscribers('test:module');
        dc.channel('test:module').publish({});
        results.moduleCalled = called;
        dc.unsubscribe('test:module', sub);
        results.moduleUnsubscribed = !dc.hasSubscribers('test:module');
    } catch (e) {
        errors.push('module: ' + e.message);
    }

    // === Symbol-named channels ===
    try {
        const sym = Symbol('test:symbol');
        const ch = dc.channel(sym);
        let symReceived = null;
        ch.subscribe((msg, name) => { symReceived = name; });
        ch.publish({});
        results.symbolChannel = symReceived === sym;
    } catch (e) {
        errors.push('symbol: ' + e.message);
    }

    // === Error code on subscribe with non-function ===
    try {
        dc.channel('test:err').subscribe(null);
        results.subscribeError = false;
    } catch (e) {
        results.subscribeError = e.code === 'ERR_INVALID_ARG_TYPE';
    }

    // === Subscriber error isolation ===
    try {
        const ch = dc.channel('test:error-isolation');
        let secondCalled = false;
        ch.subscribe(() => { throw new Error('boom'); });
        ch.subscribe(() => { secondCalled = true; });
        ch.publish({});
        results.errorIsolation = secondCalled;
    } catch (e) {
        errors.push('errorIsolation: ' + e.message);
    }

    // === bindStore / runStores ===
    try {
        const ch = dc.channel('test:stores');
        const store = new AsyncLocalStorage();
        ch.bindStore(store);

        results.storeBeforeRun = store.getStore() === undefined;

        let insideStore = undefined;
        ch.runStores({ val: 42 }, function() {
            insideStore = store.getStore();
        });
        results.storeInsideRun = insideStore !== undefined && insideStore.val === 42;
        results.storeAfterRun = store.getStore() === undefined;

        // bindStore with transform
        const store2 = new AsyncLocalStorage();
        ch.bindStore(store2, (data) => ({ transformed: data.val * 2 }));
        let transformedVal = undefined;
        ch.runStores({ val: 10 }, function() {
            transformedVal = store2.getStore();
        });
        results.storeTransform = transformedVal !== undefined && transformedVal.transformed === 20;

        // unbindStore
        results.unbindStore = ch.unbindStore(store2);
        results.unbindStoreFalse = !ch.unbindStore(store2);
    } catch (e) {
        errors.push('stores: ' + e.message);
    }

    // === TracingChannel ===
    try {
        const tc = dc.tracingChannel('test:tracing');
        results.tracingChannelStart = tc.start.name === 'tracing:test:tracing:start';
        results.tracingChannelEnd = tc.end.name === 'tracing:test:tracing:end';
        results.tracingChannelAsyncStart = tc.asyncStart.name === 'tracing:test:tracing:asyncStart';
        results.tracingChannelAsyncEnd = tc.asyncEnd.name === 'tracing:test:tracing:asyncEnd';
        results.tracingChannelError = tc.error.name === 'tracing:test:tracing:error';
    } catch (e) {
        errors.push('tracingChannel: ' + e.message);
    }

    // === traceSync ===
    try {
        const tc = dc.tracingChannel('test:sync');
        const events = [];
        tc.subscribe({
            start: (ctx) => events.push('start'),
            end: (ctx) => events.push('end:' + ctx.result),
            asyncStart: () => events.push('asyncStart'),
            asyncEnd: () => events.push('asyncEnd'),
            error: (ctx) => events.push('error:' + ctx.error.message),
        });

        const result = tc.traceSync(function(a, b) {
            return a + b;
        }, {}, null, 3, 4);

        results.traceSyncResult = result === 7;
        results.traceSyncEvents = events.join(',') === 'start,end:7';
    } catch (e) {
        errors.push('traceSync: ' + e.message);
    }

    // === traceSync with error ===
    try {
        const tc = dc.tracingChannel('test:sync-err');
        const events = [];
        tc.subscribe({
            start: () => events.push('start'),
            end: () => events.push('end'),
            error: (ctx) => events.push('error:' + ctx.error.message),
        });

        let caught = false;
        try {
            tc.traceSync(() => { throw new Error('sync-fail'); });
        } catch (e) {
            caught = e.message === 'sync-fail';
        }
        results.traceSyncError = caught;
        results.traceSyncErrorEvents = events.join(',') === 'start,error:sync-fail,end';
    } catch (e) {
        errors.push('traceSyncError: ' + e.message);
    }

    // === traceSync early exit (no subscribers) ===
    try {
        const tc = dc.tracingChannel('test:sync-early');
        const result = tc.traceSync(() => 'fast', {});
        results.traceSyncEarlyExit = result === 'fast';
    } catch (e) {
        errors.push('traceSyncEarlyExit: ' + e.message);
    }

    // === traceSync with runStores ===
    try {
        const tc = dc.tracingChannel('test:sync-stores');
        const store = new AsyncLocalStorage();
        const context = { val: 'hello' };

        tc.start.bindStore(store, () => context);

        let storeVal = undefined;
        tc.subscribe({ start: () => {} });
        tc.traceSync(() => {
            storeVal = store.getStore();
        });
        results.traceSyncRunStores = storeVal === context;
    } catch (e) {
        errors.push('traceSyncRunStores: ' + e.message);
    }

    // === TracingChannel hasSubscribers ===
    try {
        const tc = dc.tracingChannel('test:has-sub');
        results.tracingNoSubs = !tc.hasSubscribers;
        const handlers = { start: () => {} };
        tc.subscribe(handlers);
        results.tracingHasSubs = tc.hasSubscribers;
        tc.unsubscribe(handlers);
        results.tracingNoSubsAfter = !tc.hasSubscribers;
    } catch (e) {
        errors.push('tracingHasSubscribers: ' + e.message);
    }

    // === traceCallback ===
    try {
        const tc = dc.tracingChannel('test:callback');
        const events = [];
        tc.subscribe({
            start: (ctx) => events.push('start'),
            end: (ctx) => events.push('end'),
            asyncStart: (ctx) => events.push('asyncStart:' + (ctx.error ? 'err' : ctx.result)),
            asyncEnd: (ctx) => events.push('asyncEnd'),
            error: (ctx) => events.push('error'),
        });

        tc.traceCallback(function(cb, val) {
            setImmediate(cb, null, val);
        }, 0, {}, null, function(err, result) {
            // This fires asynchronously via setImmediate
            events.push('cb:' + result);
        }, null, 'hello');

        results.traceCallbackSync = events.join(',') === 'start,end';
        // Note: async events fire later via setImmediate
    } catch (e) {
        errors.push('traceCallback: ' + e.message);
    }

    // === traceCallback with non-function arg throws ===
    try {
        const tc = dc.tracingChannel('test:callback-err');
        tc.subscribe({ start: () => {} });
        tc.traceCallback(() => {}, 0, {}, null, 42);
        results.traceCallbackThrows = false;
    } catch (e) {
        results.traceCallbackThrows = e.code === 'ERR_INVALID_ARG_TYPE';
    }

    // === TracingChannel with channel objects ===
    try {
        const tc = new dc.TracingChannel({
            start: dc.channel('custom:start'),
            end: dc.channel('custom:end'),
            asyncStart: dc.channel('custom:asyncStart'),
            asyncEnd: dc.channel('custom:asyncEnd'),
            error: dc.channel('custom:error'),
        });
        results.customTracingChannel = tc.start.name === 'custom:start';
    } catch (e) {
        errors.push('customTracingChannel: ' + e.message);
    }

    // === TracingChannel constructor error ===
    try {
        new dc.TracingChannel(42);
        results.tracingChannelCtorError = false;
    } catch (e) {
        results.tracingChannelCtorError = e.code === 'ERR_INVALID_ARG_TYPE';
    }

    // === module.require tracing ===
    try {
        const fixture = '/diagnostics-channel-module-require.cjs';
        fs.writeFileSync(fixture, 'module.exports = function () { return require("http"); };');
        const trace = dc.tracingChannel('module.require');
        const events = [];
        let lastEvent;
        trace.subscribe({
            start: (event) => {
                if (event.id !== 'http') return;
                lastEvent = event;
                events.push({ name: 'start', id: event.id, parentFilename: event.parentFilename });
            },
            end: (event) => {
                if (event.id !== 'http') return;
                results.moduleRequireSameObject = event === lastEvent;
                events.push({ name: 'end', id: event.id, parentFilename: event.parentFilename, hasResult: !!event.result });
            },
        });
        const result = require(fixture)();
        results.moduleRequireResult = result && typeof result.request === 'function';
        results.moduleRequireTrace = events.length === 2 &&
            events[0].name === 'start' &&
            events[1].name === 'end' &&
            events[0].id === 'http' &&
            events[1].id === 'http' &&
            events[0].parentFilename === fixture &&
            events[1].hasResult;
    } catch (e) {
        errors.push('moduleRequireTrace: ' + e.message);
    }

    // === module.import tracing from CJS ===
    try {
        const fixture = '/diagnostics-channel-module-import.cjs';
        fs.writeFileSync(fixture, 'module.exports = async function () { return import("http"); };');
        const trace = dc.tracingChannel('module.import');
        const events = [];
        let lastEvent;
        trace.subscribe({
            start: (event) => {
                lastEvent = event;
                events.push({ name: 'start', url: event.url, parentURL: event.parentURL });
            },
            end: (event) => {
                results.moduleImportEndSameObject = event === lastEvent;
                events.push({ name: 'end', url: event.url, parentURL: event.parentURL });
            },
            asyncStart: (event) => {
                results.moduleImportAsyncStartSameObject = event === lastEvent;
                events.push({ name: 'asyncStart', url: event.url, parentURL: event.parentURL, hasResult: !!event.result });
            },
            asyncEnd: (event) => {
                results.moduleImportAsyncEndSameObject = event === lastEvent;
                events.push({ name: 'asyncEnd', url: event.url, parentURL: event.parentURL, hasResult: !!event.result });
            },
        });
        const result = await require(fixture)();
        const expectedParentURL = pathToFileURL(fixture).href;
        results.moduleImportResult = result && result.default && typeof result.default.request === 'function';
        results.moduleImportTrace = events.map((event) => event.name).join(',') === 'start,end,asyncStart,asyncEnd' &&
            events.every((event) => event.url === 'http' && event.parentURL === expectedParentURL) &&
            events[2].hasResult &&
            events[3].hasResult;
    } catch (e) {
        errors.push('moduleImportTrace: ' + e.message);
    }

    // === nested module.require tracing ===
    try {
        const parentFixture = '/diagnostics-channel-module-require-parent.cjs';
        const childFixture = '/diagnostics-channel-module-require-child.cjs';
        fs.writeFileSync(childFixture, 'module.exports = require("http");');
        fs.writeFileSync(parentFixture, 'module.exports = require(' + JSON.stringify(childFixture) + ');');
        const trace = dc.tracingChannel('module.require');
        const ids = new Set([parentFixture, childFixture, 'http']);
        const events = [];
        const starts = new Map();
        trace.subscribe({
            start: (event) => {
                if (!ids.has(event.id)) return;
                starts.set(event.id, event);
                events.push({ name: 'start', id: event.id, parentFilename: event.parentFilename });
            },
            end: (event) => {
                if (!ids.has(event.id)) return;
                events.push({ name: 'end', id: event.id, sameObject: event === starts.get(event.id), hasResult: !!event.result });
            },
        });
        const result = require(parentFixture);
        const expectedOuterParentFilename = fileURLToPath(import.meta.url);
        results.moduleRequireNestedResult = result && typeof result.request === 'function';
        results.moduleRequireNestedTrace = events.map((event) => event.name + ':' + event.id).join(',') ===
            'start:' + parentFixture + ',start:' + childFixture + ',start:http,end:http,end:' + childFixture + ',end:' + parentFixture &&
            events[0].parentFilename === expectedOuterParentFilename &&
            events[1].parentFilename === parentFixture &&
            events[2].parentFilename === childFixture &&
            events.filter((event) => event.name === 'end').every((event) => event.sameObject && event.hasResult);
    } catch (e) {
        errors.push('moduleRequireNestedTrace: ' + e.message);
    }

    // === module.import specifier coercion happens once ===
    try {
        const fixture = '/diagnostics-channel-module-import-coerce.cjs';
        fs.writeFileSync(fixture, [
            'module.exports = async function () {',
            '  let calls = 0;',
            '  const spec = { toString() { calls++; return calls === 1 ? "http" : "fs"; } };',
            '  const result = await import(spec);',
            '  return { calls, result };',
            '};',
        ].join('\n'));
        const expectedParentURL = pathToFileURL(fixture).href;
        const trace = dc.tracingChannel('module.import');
        const events = [];
        trace.subscribe({
            start: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'start', url: event.url }); },
            end: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'end', url: event.url }); },
            asyncStart: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'asyncStart', url: event.url, hasResult: !!event.result }); },
            asyncEnd: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'asyncEnd', url: event.url, hasResult: !!event.result }); },
        });
        const result = await require(fixture)();
        results.moduleImportCoerceOnce = result.calls === 1 &&
            result.result && result.result.default && typeof result.result.default.request === 'function' &&
            events.map((event) => event.name).join(',') === 'start,end,asyncStart,asyncEnd' &&
            events.every((event) => event.url === 'http') &&
            events[2].hasResult &&
            events[3].hasResult;
    } catch (e) {
        errors.push('moduleImportCoerceOnce: ' + e.message);
    }

    // === module.import parentURL ignores local __filename shadowing ===
    try {
        const fixture = '/diagnostics-channel-module-import-shadow.cjs';
        fs.writeFileSync(fixture, 'module.exports = async function (__filename) { return import("http"); };');
        const expectedParentURL = pathToFileURL(fixture).href;
        const trace = dc.tracingChannel('module.import');
        const events = [];
        trace.subscribe({
            start: (event) => { if (event.url === 'http') events.push({ name: 'start', parentURL: event.parentURL }); },
            end: (event) => { if (event.url === 'http') events.push({ name: 'end', parentURL: event.parentURL }); },
            asyncStart: (event) => { if (event.url === 'http') events.push({ name: 'asyncStart', parentURL: event.parentURL, hasResult: !!event.result }); },
            asyncEnd: (event) => { if (event.url === 'http') events.push({ name: 'asyncEnd', parentURL: event.parentURL, hasResult: !!event.result }); },
        });
        const result = await require(fixture)('shadowed-filename');
        const ownEvents = events.filter((event) => event.parentURL === expectedParentURL);
        results.moduleImportShadowParentResult = result && result.default && typeof result.default.request === 'function';
        results.moduleImportShadowParent = ownEvents.map((event) => event.name).join(',') === 'start,end,asyncStart,asyncEnd' &&
            ownEvents.every((event) => event.parentURL === expectedParentURL) &&
            ownEvents[2].hasResult &&
            ownEvents[3].hasResult;
    } catch (e) {
        errors.push('moduleImportShadowParent: ' + e.message);
    }

    // === invalid import() options are rejected before module.import tracing ===
    try {
        const fixture = '/diagnostics-channel-module-import-invalid-options.cjs';
        fs.writeFileSync(fixture, 'module.exports = async function () { return import("http", null); };');
        const expectedParentURL = pathToFileURL(fixture).href;
        const trace = dc.tracingChannel('module.import');
        const events = [];
        trace.subscribe({
            start: (event) => { if (event.parentURL === expectedParentURL) events.push('start'); },
            end: (event) => { if (event.parentURL === expectedParentURL) events.push('end'); },
            error: (event) => { if (event.parentURL === expectedParentURL) events.push('error'); },
            asyncStart: (event) => { if (event.parentURL === expectedParentURL) events.push('asyncStart'); },
            asyncEnd: (event) => { if (event.parentURL === expectedParentURL) events.push('asyncEnd'); },
        });
        let rejected = false;
        try {
            await require(fixture)();
        } catch (e) {
            rejected = e instanceof TypeError;
        }
        results.moduleImportInvalidOptionsTrace = rejected && events.length === 0;
    } catch (e) {
        errors.push('moduleImportInvalidOptionsTrace: ' + e.message);
    }

    // === semantic import attribute errors reject through async module.import tracing ===
    try {
        const fixture = '/diagnostics-channel-module-import-unsupported-attr.cjs';
        fs.writeFileSync(fixture, 'module.exports = async function () { return import("http", { with: { unsupported: "x" } }); };');
        const expectedParentURL = pathToFileURL(fixture).href;
        const trace = dc.tracingChannel('module.import');
        const events = [];
        let lastEvent;
        trace.subscribe({
            start: (event) => {
                if (event.parentURL !== expectedParentURL) return;
                lastEvent = event;
                events.push({ name: 'start', url: event.url });
            },
            end: (event) => {
                if (event.parentURL !== expectedParentURL) return;
                events.push({ name: 'end', url: event.url, sameObject: event === lastEvent, hasError: !!event.error });
            },
            error: (event) => {
                if (event.parentURL !== expectedParentURL) return;
                events.push({ name: 'error', url: event.url, sameObject: event === lastEvent, code: event.error && event.error.code });
            },
            asyncStart: (event) => {
                if (event.parentURL !== expectedParentURL) return;
                events.push({ name: 'asyncStart', url: event.url, sameObject: event === lastEvent, code: event.error && event.error.code });
            },
            asyncEnd: (event) => {
                if (event.parentURL !== expectedParentURL) return;
                events.push({ name: 'asyncEnd', url: event.url, sameObject: event === lastEvent, code: event.error && event.error.code });
            },
        });
        let rejected = false;
        try {
            await require(fixture)();
        } catch (e) {
            rejected = e && e.code === 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED';
        }
        results.moduleImportUnsupportedAttrTrace = rejected &&
            events.map((event) => event.name).join(',') === 'start,end,error,asyncStart,asyncEnd' &&
            events.every((event) => event.url === 'http') &&
            events[1].sameObject &&
            !events[1].hasError &&
            events.slice(2).every((event) => event.sameObject && event.code === 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
    } catch (e) {
        errors.push('moduleImportUnsupportedAttrTrace: ' + e.message);
    }

    // === unsupported import attributes take priority over type semantic errors ===
    try {
        const fixture = '/diagnostics-channel-module-import-mixed-attrs.cjs';
        fs.writeFileSync(fixture, 'module.exports = async function () { return import("/mixed-attrs-target.mjs", { with: { unsupported: "x", type: "json" } }); };');
        fs.writeFileSync('/mixed-attrs-target.mjs', 'export default 1;');
        const expectedParentURL = pathToFileURL(fixture).href;
        const trace = dc.tracingChannel('module.import');
        const events = [];
        trace.subscribe({
            start: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'start', code: event.error && event.error.code }); },
            end: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'end', code: event.error && event.error.code }); },
            error: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'error', code: event.error && event.error.code, message: event.error && event.error.message }); },
            asyncStart: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'asyncStart', code: event.error && event.error.code }); },
            asyncEnd: (event) => { if (event.parentURL === expectedParentURL) events.push({ name: 'asyncEnd', code: event.error && event.error.code }); },
        });
        let rejected = false;
        try {
            await require(fixture)();
        } catch (e) {
            rejected = e && e.code === 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' &&
                e.message.indexOf('unsupported') !== -1;
        }
        results.moduleImportMixedAttrPriority = rejected &&
            events.map((event) => event.name).join(',') === 'start,end,error,asyncStart,asyncEnd' &&
            events[0].code === undefined &&
            events[1].code === undefined &&
            events.slice(2).every((event) => event.code === 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED') &&
            events[2].message.indexOf('unsupported') !== -1;
    } catch (e) {
        errors.push('moduleImportMixedAttrPriority: ' + e.message);
    }

    results.errors = errors;
    return JSON.stringify(results);
}
