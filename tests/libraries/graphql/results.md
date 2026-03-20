# GraphQL Compatibility Test Results

**Package:** `graphql`
**Version:** `16.13.1`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — graphqlSync basic query execution
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — schema/query validation errors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-language-ast.js — parse/visit/print AST transform flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-introspection.js — introspection and schema round-trip utilities
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-custom-scalar.js — custom scalar parse/serialize behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None observed
- Behavioral differences: None observed in tested APIs
- Blockers: None
