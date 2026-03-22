# Cheerio Compatibility Test Results

**Package:** `cheerio`
**Version:** `1.2.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic-load.js — HTML loading and CSS selection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-manipulation-and-forms.js — DOM manipulation and form serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-loadbuffer-and-stream.js — `loadBuffer` and `stringStream`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-from-url-html.js — `fromURL` against HTML endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: getaddrinfo ESERVFAIL localhost`
- **Root cause:** `fromURL` (via bundled `undici`) performs DNS lookup and fails to resolve `localhost` in the wasmtime CLI runtime setup. In a Golem deployment with proper networking, this would likely work.

### test-integration-02-from-url-xml-and-errors.js — `fromURL` XML load and content-type rejection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: getaddrinfo ESERVFAIL localhost`
- **Root cause:** Same DNS resolution failure; the request cannot reach the mock server.

## Summary

- Offline tests passed: 3/3 in wasm-rquickjs (3/3 in Node.js)
- Integration tests passed: 0/2 HTTP mock in wasm-rquickjs (2/2 in Node.js)
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified
- Behavioral differences: `fromURL` networking path fails in wasmtime CLI due to DNS resolution (`getaddrinfo ESERVFAIL localhost`), while all offline parsing/manipulation APIs work perfectly.
- Blockers: HTTP fetching via `fromURL` is not usable in this runtime environment; core HTML parsing and manipulation work fully.
