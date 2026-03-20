# @grpc/proto-loader Compatibility Test Results

**Package:** `@grpc/proto-loader`
**Version:** `0.8.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — `fromJSON` service/method definition creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-options.js — conversion options (`longs`, `enums`, `bytes`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-oneof-defaults.js — `oneofs`, `defaults`, `arrays` decoding behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-file-descriptor-object.js — `loadFileDescriptorSetFromObject` with message roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-load-sync.js — descriptor-buffer helpers plus bundled `loadSync` limitation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Observed limitation:** `loadSync` in bundled execution is unavailable and throws (`readFileSync` / `ENOENT` / not found path errors), while descriptor-buffer APIs work.

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested descriptor/object conversion APIs
- Behavioral differences: Bundled `loadSync` file-loading path is not usable in this execution model
- Blockers: Runtime `.proto` file loading via bundled `load`/`loadSync` is not currently practical; descriptor-based loading (`fromJSON`, `loadFileDescriptorSetFromObject`, `loadFileDescriptorSetFromBuffer`) works
