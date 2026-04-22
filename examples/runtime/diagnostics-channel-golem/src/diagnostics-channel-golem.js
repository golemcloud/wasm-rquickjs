import dc from 'node:diagnostics_channel';

export function test() {
    const results = {};
    const errors = [];

    // The Golem wire_builtins code auto-installs tracing for 'http.client'
    // via _installGolemTracing('http.client'), which subscribes to
    // tracing:http.client:start/end/error/asyncStart/asyncEnd channels.
    //
    // Test 1: Verify the Golem tracing subscribers are installed on the http.client channels
    // Internal subscribers are hidden from hasSubscribers, so check _subscribers directly
    try {
        const startCh = dc.channel('tracing:http.client:start');
        const endCh = dc.channel('tracing:http.client:end');
        results.golemTracingInstalled = startCh._subscribers.length > 0 && endCh._subscribers.length > 0;
    } catch (e) {
        errors.push('golemTracingInstalled: ' + e.message);
    }

    // Test 2: Use traceSync on http.client to trigger span creation
    try {
        const tc = dc.tracingChannel('http.client');
        const result = tc.traceSync(function() {
            return 'traced-result';
        }, { method: 'GET', url: 'http://example.com/test' });
        results.traceSyncResult = result === 'traced-result';
    } catch (e) {
        errors.push('traceSync: ' + e.message);
    }

    // Test 3: Use traceSync with error to test error span attributes
    try {
        const tc = dc.tracingChannel('http.client');
        let caught = false;
        try {
            tc.traceSync(function() {
                throw new Error('request-failed');
            }, { method: 'POST', url: 'http://example.com/fail' });
        } catch (e) {
            caught = e.message === 'request-failed';
        }
        results.traceSyncError = caught;
    } catch (e) {
        errors.push('traceSyncError: ' + e.message);
    }

    // Test 4: Verify custom tracing channels auto-wire Golem tracing
    try {
        const customCh = dc.tracingChannel('test.custom');
        // After creation, Golem tracing should be auto-installed (internal subscribers)
        const startCh = dc.channel('tracing:test.custom:start');
        results.customGolemSubs = startCh._subscribers.length > 0;

        // traceSync on custom channel should create a Golem span
        const val = customCh.traceSync(() => 42, { operation: 'custom-op' });
        results.customTraceSync = val === 42;
    } catch (e) {
        errors.push('customTrace: ' + e.message);
    }

    results.errors = errors;
    return JSON.stringify(results);
}
