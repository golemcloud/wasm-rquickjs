# GraphQL Subscriptions Compatibility Test Results

**Package:** `graphql-subscriptions`
**Version:** `3.0.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — PubSub publish/subscribe delivers payloads in order
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-unsubscribe.js — PubSub unsubscribe removes active listener
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-async-iterator.js — asyncIterableIterator receives events from multiple triggers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-iterator-return.js — iterator return() closes stream
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-with-filter.js — withFilter supports sync and async predicates
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None observed
- Behavioral differences: None observed in tested APIs
- Blockers: None
