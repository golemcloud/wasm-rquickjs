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

### Integration Tests (Docker / MailHog)

### test-integration-01-send.js — SMTP send via MailHog, verify messageId
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-verify.js — SMTP verify + HTML send with Buffer attachment
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### Running integration tests

```bash
cd tests/libraries/nodemailer
docker compose up -d --wait
npx rollup -c rollup.config.mjs
# Node.js
timeout 30 node run-node.mjs ./dist/test-integration-01-send.bundle.js
timeout 30 node run-node.mjs ./dist/test-integration-02-verify.bundle.js
# wasm-rquickjs (from repo root)
# generate-wrapper-crate + cargo-component build + wasmtime run with:
#   -S cli -S http -S inherit-network -S allow-ip-name-lookup
# Use default = ["full-no-logging"] to avoid wasi:logging linker errors
docker compose down
```

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 2/2 in wasm-rquickjs (2/2 in Node.js)
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None
