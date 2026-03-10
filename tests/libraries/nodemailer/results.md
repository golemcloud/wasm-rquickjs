# Nodemailer Compatibility Test Results

**Package:** `nodemailer`
**Version:** `8.0.2`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — json transport basic message send
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — json transport skipEncoding and custom envelope override
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-stream.js — stream transport MIME buffer output with attachment
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-addresses.js — address normalization with to/cc/reply-to fields
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-attachments.js — attachment normalization in json transport output
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested offline API surface
- Behavioral differences: None observed
- Blockers: None for tested offline features
