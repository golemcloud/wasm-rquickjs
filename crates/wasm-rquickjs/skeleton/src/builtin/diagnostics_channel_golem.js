// Golem Context integration for diagnostics_channel
// Registers internal subscribers that create Golem spans for TracingChannel operations
import { start_span, set_span_attribute, finish_span } from '__wasm_rquickjs_builtin/diagnostics_channel_native';
import { channel } from 'node:diagnostics_channel';

// Internal registry to correlate context objects with span handles
const _contextSpans = new WeakMap();

// Helper to create a Golem-integrated subscriber set for any TracingChannel
export function _installGolemTracing(channelName) {
    const startCh = channel(`tracing:${channelName}:start`);
    const endCh = channel(`tracing:${channelName}:end`);
    const errorCh = channel(`tracing:${channelName}:error`);
    const asyncEndCh = channel(`tracing:${channelName}:asyncEnd`);

    startCh.subscribe((context) => {
        try {
            const handle = start_span(channelName);
            _contextSpans.set(context, { handle, hasAsync: false });
            for (const [key, value] of Object.entries(context)) {
                if (key !== 'result' && key !== 'error' && value !== undefined && value !== null) {
                    try {
                        set_span_attribute(handle, key, String(value));
                    } catch (_) {}
                }
            }
        } catch (_) {}
    });

    errorCh.subscribe((context) => {
        try {
            const entry = _contextSpans.get(context);
            if (entry) {
                set_span_attribute(entry.handle, 'error', 'true');
                if (context.error) {
                    set_span_attribute(entry.handle, 'error.message', String(context.error.message || context.error));
                }
            }
        } catch (_) {}
    });

    endCh.subscribe((context) => {
        try {
            const entry = _contextSpans.get(context);
            if (entry && !entry.hasAsync) {
                // For sync-only traces, finish span on end
                // For async traces, asyncEnd will finish it
                if (context.result !== undefined) {
                    set_span_attribute(entry.handle, 'result', String(context.result));
                }
                finish_span(entry.handle);
                _contextSpans.delete(context);
            }
        } catch (_) {}
    });

    asyncEndCh.subscribe((context) => {
        try {
            const entry = _contextSpans.get(context);
            if (entry) {
                if (context.result !== undefined) {
                    set_span_attribute(entry.handle, 'result', String(context.result));
                }
                finish_span(entry.handle);
                _contextSpans.delete(context);
            }
        } catch (_) {}
    });

    // Mark contexts as async when asyncStart fires
    const asyncStartCh = channel(`tracing:${channelName}:asyncStart`);
    asyncStartCh.subscribe((context) => {
        try {
            const entry = _contextSpans.get(context);
            if (entry) {
                entry.hasAsync = true;
            }
        } catch (_) {}
    });
}
