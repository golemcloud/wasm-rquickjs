# Apollo Server Compatibility Test Results

**Package:** `@apollo/server`
**Version:** `5.4.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — `executeOperation` basic query execution
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-errors.js — resolver error formatting via `formatError`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-plugins.js — plugin lifecycle hooks around request execution
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-http-request.js — `executeHTTPGraphQLRequest` with synthetic HTTP request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-persisted-queries.js — APQ miss/register/hit flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Golem Compatibility

`@apollo/server` is primarily intended to expose GraphQL over HTTP by integrating with
server transports (for example standalone `startStandaloneServer()`/framework integrations).
In the Golem execution model, components cannot bind/listen on HTTP ports directly; they
export functions that the platform exposes.

While the offline execution APIs (`executeOperation`, `executeHTTPGraphQLRequest`) work,
this package cannot be used in its standard server-binding deployment pattern inside Golem.

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None observed in tested offline APIs
- Behavioral differences: None observed in tested offline APIs
- Blockers: Standard Apollo Server usage relies on HTTP server binding, which is Golem-incompatible
