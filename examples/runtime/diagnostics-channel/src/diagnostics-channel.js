import dc from 'node:diagnostics_channel';
import { AsyncLocalStorage } from 'node:async_hooks';

export function test() {
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

    results.errors = errors;
    return JSON.stringify(results);
}
