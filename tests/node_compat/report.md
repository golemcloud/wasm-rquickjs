# Node.js v22.14.0 Compatibility Inventory

Generated: 2026-06-17 | Source: `tests/node_compat/config.jsonc` | Engine: wasm-rquickjs (QuickJS)

This report is generated from `config.jsonc` only. It does **not** run the vendored tests itself. Entries classified as `runnable` are reported as passing because the `node_compat` PR test executes runnable entries and fails CI if any of them fail.

## Summary

Primary compatibility is measured over the public API surface we can provide: CI-enforced passing (`runnable`) plus `known-gap`. WASI-impossible tests, engine differences, unevaluated tests, and Node.js-internals tests are acknowledged separately and excluded from the primary percentage.

**Primary compatibility (CI-enforced):** 3099/4295 (72.2%)

| Classification | Count | Primary % | Public inventory % | All listed % |
|----------------|-------|-----------|--------------------|--------------|
| ✅ passing (runnable) | 3099 | 72.2% | 55.2% | 46.0% |
| 🧩 known gap | 1196 | 27.8% | 21.3% | 17.8% |
| 🚫 WASI-impossible (excluded) | 1153 | — | 20.6% | 17.1% |
| ⚙️ engine difference (excluded) | 162 | — | 2.9% | 2.4% |
| ❔ unevaluated (excluded) | 0 | — | 0.0% | 0.0% |
| 🔒 Node.js internals (excluded) | 1121 | — | — | 16.7% |
| **Total** | **6731** |  |  | **100.0%** |

Secondary full-public compatibility, including public tests that are currently excluded from primary: **3099/5610 (55.2%)**.

## Inventory by Module

| Module | Total | Passing | Gap | WASI-impossible | Engine diff | Unevaluated | Internals | Primary % | Public compatibility % |
|--------|-------|----------|-----|-----------------|-------------|-------------|-----------|-----------|--------------------|
| abort | 28 | 26 | 0 | 1 | 0 | 0 | 1 | 100.0% | 96.3% |
| assert | 95 | 95 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| async_hooks | 38 | 4 | 28 | 4 | 0 | 0 | 2 | 12.5% | 11.1% |
| blob | 24 | 2 | 0 | 0 | 0 | 0 | 22 | 100.0% | 100.0% |
| buffer | 180 | 172 | 0 | 1 | 1 | 0 | 6 | 100.0% | 98.9% |
| child_process | 208 | 42 | 58 | 93 | 0 | 0 | 15 | 42.0% | 21.8% |
| cli | 32 | 9 | 21 | 0 | 0 | 0 | 2 | 30.0% | 30.0% |
| cluster | 87 | 0 | 0 | 85 | 0 | 0 | 2 | 0.0% | 0.0% |
| common | 9 | 1 | 8 | 0 | 0 | 0 | 0 | 11.1% | 11.1% |
| compile | 15 | 0 | 0 | 0 | 15 | 0 | 0 | 0.0% | 0.0% |
| console | 31 | 29 | 1 | 0 | 0 | 0 | 1 | 96.7% | 96.7% |
| crypto | 239 | 204 | 11 | 8 | 0 | 0 | 16 | 94.9% | 91.5% |
| dgram | 118 | 23 | 74 | 7 | 0 | 0 | 14 | 23.7% | 22.1% |
| diagnostics_channel | 33 | 18 | 12 | 1 | 2 | 0 | 0 | 60.0% | 54.5% |
| dns | 42 | 2 | 27 | 0 | 0 | 0 | 13 | 6.9% | 6.9% |
| domain | 61 | 28 | 20 | 12 | 0 | 0 | 1 | 58.3% | 46.7% |
| encoding | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| errors | 46 | 0 | 1 | 1 | 0 | 0 | 44 | 0.0% | 0.0% |
| eslint | 24 | 0 | 0 | 0 | 0 | 0 | 24 | 0.0% | 0.0% |
| events | 93 | 59 | 2 | 0 | 0 | 0 | 32 | 96.7% | 96.7% |
| fetch | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| fs | 482 | 374 | 12 | 20 | 5 | 0 | 71 | 96.9% | 91.0% |
| global | 11 | 4 | 5 | 0 | 0 | 0 | 2 | 44.4% | 44.4% |
| heap | 22 | 0 | 0 | 15 | 7 | 0 | 0 | 0.0% | 0.0% |
| http | 898 | 243 | 306 | 267 | 2 | 0 | 80 | 44.3% | 29.7% |
| inspector | 95 | 1 | 0 | 93 | 0 | 0 | 1 | 100.0% | 1.1% |
| internal | 53 | 1 | 0 | 0 | 0 | 0 | 52 | 100.0% | 100.0% |
| module | 184 | 120 | 44 | 7 | 1 | 0 | 12 | 73.2% | 69.8% |
| net | 223 | 147 | 39 | 19 | 1 | 0 | 17 | 79.0% | 71.4% |
| node | 8 | 0 | 0 | 1 | 0 | 0 | 7 | 0.0% | 0.0% |
| os | 6 | 5 | 0 | 0 | 0 | 0 | 1 | 100.0% | 100.0% |
| other | 469 | 101 | 92 | 83 | 11 | 0 | 182 | 52.3% | 35.2% |
| path | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| perf_hooks | 41 | 3 | 34 | 2 | 0 | 0 | 2 | 8.1% | 7.7% |
| permission | 55 | 4 | 38 | 9 | 2 | 0 | 2 | 9.5% | 7.5% |
| process | 93 | 45 | 34 | 4 | 0 | 0 | 10 | 57.0% | 54.2% |
| promises | 23 | 1 | 15 | 0 | 7 | 0 | 0 | 6.2% | 4.3% |
| querystring | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| readline | 101 | 0 | 22 | 0 | 0 | 0 | 79 | 0.0% | 0.0% |
| repl | 85 | 1 | 2 | 72 | 0 | 0 | 10 | 33.3% | 1.3% |
| shadow_realm | 11 | 0 | 0 | 0 | 11 | 0 | 0 | 0.0% | 0.0% |
| signal | 5 | 1 | 0 | 3 | 0 | 0 | 1 | 100.0% | 25.0% |
| snapshot | 57 | 0 | 0 | 0 | 57 | 0 | 0 | 0.0% | 0.0% |
| sqlite | 39 | 36 | 3 | 0 | 0 | 0 | 0 | 92.3% | 92.3% |
| stdio | 23 | 14 | 7 | 1 | 0 | 0 | 1 | 66.7% | 63.6% |
| stream | 753 | 713 | 31 | 2 | 0 | 0 | 7 | 95.8% | 95.6% |
| string_decoder | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| test_runner | 157 | 93 | 34 | 21 | 1 | 0 | 8 | 73.2% | 62.4% |
| timers | 97 | 47 | 4 | 0 | 0 | 0 | 46 | 92.2% | 92.2% |
| tls | 207 | 4 | 7 | 185 | 0 | 0 | 11 | 36.4% | 2.0% |
| trace_events | 35 | 15 | 10 | 6 | 0 | 0 | 4 | 60.0% | 48.4% |
| tty | 5 | 0 | 3 | 0 | 0 | 0 | 2 | 0.0% | 0.0% |
| url | 29 | 28 | 0 | 0 | 0 | 0 | 1 | 100.0% | 100.0% |
| util | 174 | 90 | 8 | 0 | 0 | 0 | 76 | 91.8% | 91.8% |
| v8 | 45 | 14 | 1 | 0 | 30 | 0 | 0 | 93.3% | 31.1% |
| vm | 121 | 25 | 84 | 3 | 9 | 0 | 0 | 22.9% | 20.7% |
| webcrypto | 107 | 43 | 21 | 1 | 0 | 0 | 42 | 67.2% | 66.2% |
| webstreams | 68 | 67 | 0 | 0 | 0 | 0 | 1 | 100.0% | 100.0% |
| whatwg | 261 | 54 | 21 | 0 | 0 | 0 | 186 | 72.0% | 72.0% |
| worker_threads | 189 | 4 | 51 | 126 | 0 | 0 | 8 | 7.3% | 2.2% |
| zlib | 61 | 52 | 5 | 0 | 0 | 0 | 4 | 91.2% | 91.2% |

## Split Test Summary

| File | Subtests | Passing | Gap | WASI-impossible | Engine diff | Unevaluated | Internals |
|------|----------|----------|-----|-----------------|-------------|-------------|-----------|
| `test-esm-loader-modulemap.js` | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| `test-require-module-conditional-exports.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-cjs-esm-esm.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-cjs-esm.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-esm-cjs-esm-esm.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-esm-cjs-esm.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-require-module-defined-esmodule.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-module-tla.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-require-module-with-detection.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-module.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-abortcontroller.js` | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| `test-aborted-util.js` | 5 | 4 | 0 | 1 | 0 | 0 | 0 |
| `test-abortsignal-cloneable.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-accessor-properties.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-assert-async.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-calltracker-calls.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-calltracker-getCalls.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-deep-with-error.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-deep.js` | 39 | 39 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-fail-deprecation.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-fail.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-if-error.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-assert-typedarray-deepequal.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-assert.js` | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| `test-blob.js` | 22 | 0 | 0 | 0 | 0 | 0 | 22 |
| `test-blocklist.js` | 17 | 17 | 0 | 0 | 0 | 0 | 0 |
| `test-broadcastchannel-custom-inspect.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-buffer-alloc.js` | 53 | 53 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-arraybuffer.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-badhex.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-copy.js` | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-fill.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-buffer-from.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-indexof.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-prototype-inspect.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-readint.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-readuint.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-slice.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-swap.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-tojson.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-write.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-writeint.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-buffer-writeuint.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-child-process-bad-stdio.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-child-process-constructor.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-child-process-cwd.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-child-process-exec-abortcontroller-promisified.js` | 8 | 0 | 0 | 8 | 0 | 0 | 0 |
| `test-child-process-exec-maxbuf.js` | 11 | 9 | 0 | 2 | 0 | 0 | 0 |
| `test-child-process-execFile-promisified-abortController.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-child-process-execfile-maxbuf.js` | 8 | 6 | 1 | 1 | 0 | 0 | 0 |
| `test-child-process-execfile.js` | 8 | 5 | 2 | 1 | 0 | 0 | 0 |
| `test-child-process-execfilesync-maxbuf.js` | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-execsync-maxbuf.js` | 4 | 0 | 3 | 1 | 0 | 0 | 0 |
| `test-child-process-fork-abort-signal.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-child-process-fork-args.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-child-process-fork-timeout-kill-signal.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-promisified.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-child-process-send-returns-boolean.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-spawn-controller.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-child-process-spawn-timeout-kill-signal.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-spawnsync-maxbuf.js` | 4 | 2 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-spawnsync-validation-errors.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-child-process-spawnsync.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-child-process-stdio.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-validate-stdio.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-child-process-windows-hide.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-cli-eval.js` | 5 | 2 | 3 | 0 | 0 | 0 | 0 |
| `test-cli-permission-deny-fs.js` | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| `test-cli-permission-multiple-allow.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-common-gc.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-common.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-compression-decompression-stream.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-console-group.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-console-instance.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-authenticated.js` | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-certificate.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-cipheriv-decipheriv.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-dh-constructor.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-dh.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-ecb.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-encoding-validation-error.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-gcm-explicit-short-tag.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-hash.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-hmac.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-key-objects-to-crypto-key.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-key-objects.js` | 18 | 17 | 1 | 0 | 0 | 0 | 0 |
| `test-crypto-keygen.js` | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-prime.js` | 10 | 0 | 0 | 1 | 0 | 0 | 9 |
| `test-crypto-random.js` | 22 | 22 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-rsa-dsa.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-scrypt.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-crypto-secret-keygen.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-sign-verify.js` | 19 | 16 | 2 | 1 | 0 | 0 | 0 |
| `test-crypto-x509.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dgram-address.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-dgram-bind-fd-error.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-dgram-blocklist.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-close-signal.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-create-socket-handle-fd.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dgram-create-socket-handle.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dgram-createSocket-type.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-dgram-custom-lookup.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-membership.js` | 12 | 2 | 10 | 0 | 0 | 0 | 0 |
| `test-dgram-multicast-loopback.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-dgram-multicast-set-interface.js` | 8 | 5 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-setBroadcast.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-dgram-socket-buffer-size.js` | 6 | 1 | 5 | 0 | 0 | 0 | 0 |
| `test-dgram-unref.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-diagnostics-channel-tracing-channel-has-subscribers.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-dns-lookup.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dns-setlocaladdress.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-dns-setservers-type-check.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dns.js` | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| `test-domain-intercept.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-domain-promise.js` | 10 | 4 | 6 | 0 | 0 | 0 | 0 |
| `test-domexception-cause.js` | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| `test-error-aggregateTwoErrors.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-errors-aborterror.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-errors-hide-stack-frames.js` | 11 | 0 | 0 | 0 | 0 | 0 | 11 |
| `test-errors-systemerror.js` | 15 | 0 | 0 | 0 | 0 | 0 | 15 |
| `test-event-emitter-add-listeners.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-event-emitter-check-listener-leaks.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-event-emitter-listeners.js` | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| `test-event-emitter-remove-all-listeners.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-event-emitter-remove-listeners.js` | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| `test-events-customevent.js` | 26 | 0 | 0 | 0 | 0 | 0 | 26 |
| `test-events-getmaxlisteners.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-events-static-geteventlisteners.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-eventtarget-memoryleakwarning.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-eventtarget.js` | 61 | 0 | 0 | 0 | 0 | 0 | 61 |
| `test-file.js` | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| `test-fixed-queue.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-freeze-intrinsics.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-fs-access.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-fs-append-file-flush.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-append-file.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-copyfile-respect-permissions.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-fs-error-messages.js` | 31 | 0 | 0 | 0 | 0 | 0 | 31 |
| `test-fs-mkdir-recursive-eaccess.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-fs-mkdir.js` | 21 | 21 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-mkdtemp.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-opendir.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-options-immutable.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-promises.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-promisified.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-read-stream-double-close.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-read-stream-inherit.js` | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-read-stream.js` | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-readfile-flags.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-readfile.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-readv-sync.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-readv.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-rm.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-fs-rmdir-recursive-throws-not-found.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-rmdir-recursive-throws-on-file.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-rmdir-recursive.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-fs-stat-bigint.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-stat.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-statfs.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-stream-construct-compat-graceful-fs.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-stream-construct-compat-old-node.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-stream-destroy-emit-error.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-stream-fs-options.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-stream-options.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-truncate-clear-file-zero.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-truncate.js` | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-util-validateoffsetlength.js` | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| `test-fs-utils-get-dirents.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-fs-utimes.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-watch-abort-signal.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-fs-watch-encoding.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-watch-enoent.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-fs-write-buffer.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-file-flush.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-file-sync.js` | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| `test-fs-write-file.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-stream-double-close.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-stream-end.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-stream-flush.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-stream-fs.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write-stream.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-write.js` | 5 | 0 | 0 | 0 | 5 | 0 | 0 |
| `test-fs-writefile-with-fd.js` | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| `test-fs-writev-sync.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-writev.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-handle-wrap-hasref.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-heap-prof-invalid-args.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-http-1.0.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-aborted.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-agent-timeout.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-http-chunk-extensions-limit.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-client-abort-destroy.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-http-client-abort3.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-client-aborted-event.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http-client-defaults.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-client-res-destroyed.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-dummy-characters-smuggling.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-http-early-hints.js` | 6 | 2 | 4 | 0 | 0 | 0 | 0 |
| `test-http-generic-streams.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| `test-http-head-throw-on-response-body-write.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-insecure-parser-per-stream.js` | 5 | 3 | 2 | 0 | 0 | 0 | 0 |
| `test-http-max-header-size-per-stream.js` | 4 | 2 | 2 | 0 | 0 | 0 | 0 |
| `test-http-missing-header-separator-cr.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http-missing-header-separator-lf.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http-outgoing-destroyed.js` | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| `test-http-outgoing-internal-headernames-getter.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-outgoing-internal-headers.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-http-outgoing-message-capture-rejection.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http-outgoing-properties.js` | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
| `test-http-outgoing-proto.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-outgoing-renderHeaders.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-http-outgoing-settimeout.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-parser.js` | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| `test-http-req-res-close.js` | 3 | 1 | 0 | 0 | 0 | 0 | 2 |
| `test-http-request-host-header.js` | 2 | 1 | 0 | 1 | 0 | 0 | 0 |
| `test-http-request-join-authorization-headers.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-response-close.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-response-multi-content-length.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http-response-setheaders.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-http-server-capture-rejections.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http-server-connection-list-when-close.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-http-server-non-utf8-header.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-server-options-highwatermark.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-http-server-timeouts-validation.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-http-transfer-encoding-smuggling.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-write-head-2.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-http2-alpn.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-capture-rejection.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-http2-client-destroy.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-http2-client-setLocalWindowSize.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-http2-compat-expect-continue.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-compat-serverrequest-headers.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-compat-serverresponse-end.js` | 10 | 0 | 0 | 10 | 0 | 0 | 0 |
| `test-http2-compat-serverresponse-write.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-http2-compat-serverresponse-writehead-array.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-http2-compat-write-early-hints.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-http2-connect.js` | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| `test-http2-create-client-connect.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-getpackedsettings.js` | 11 | 0 | 0 | 11 | 0 | 0 | 0 |
| `test-http2-https-fallback.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-invalidheaderfield.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-http2-origin.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-http2-perform-server-handshake.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-server-errors.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-server-settimeout-no-callback.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-server-startup.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-http2-too-many-settings.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-util-headers-list.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-http2-util-update-options-buffer.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-https-agent-create-connection.js` | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| `test-https-argument-of-creating.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-https-insecure-parse-per-stream.js` | 5 | 3 | 0 | 2 | 0 | 0 | 0 |
| `test-https-max-header-size-per-stream.js` | 4 | 2 | 0 | 2 | 0 | 0 | 0 |
| `test-icu-data-dir.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-icu-transcode.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| `test-internal-error-original-names.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-internal-errors.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-internal-fs-syncwritestream.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-internal-fs.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-internal-socket-list-receive.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-internal-socket-list-send.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-internal-util-objects.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-internal-validators-validateoneof.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-module-create-require-multibyte.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-module-multi-extensions.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-module-setsourcemapssupport.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-module-strip-types.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-net-allow-half-open.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-net-autoselectfamily-default.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-net-autoselectfamily.js` | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| `test-net-better-error-messages-path.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-net-blocklist.js` | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| `test-net-bytes-written-large.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-net-connect-options-port.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-net-normalize-args.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-net-perf_hooks.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-net-server-call-listen-multiple-times.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-net-server-listen-handle.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-net-server-listen-options-signal.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-net-server-listen-options.js` | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| `test-net-server-listen-path.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-net-socket-write-after-close.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-nodeeventtarget.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `test-perf-hooks-histogram.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-perf-hooks-resourcetiming.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| `test-perf-hooks-usertiming.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-performance-function.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-performance-gc.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-performanceobserver.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-permission-allow-child-process-cli.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-allow-wasi-cli.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-allow-worker-cli.js` | 2 | 0 | 1 | 1 | 0 | 0 | 0 |
| `test-permission-child-process-cli.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-fs-read.js` | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| `test-permission-fs-require.js` | 4 | 2 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-fs-symlink-target-write.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-fs-symlink.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-permission-fs-traversal-path.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-permission-fs-wildcard.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-fs-windows-path.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-permission-fs-write-report.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-fs-write-v8.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-permission-has.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-permission-inspector-brk.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-permission-inspector.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-primordials-apply.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-primordials-promise.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-primordials-regexp.js` | 11 | 0 | 0 | 0 | 0 | 0 | 11 |
| `test-priority-queue.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-process-env-allowed-flags.js` | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| `test-process-env-windows-error-reset.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-process-env.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-process-getactiveresources-track-timer-lifetime.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-process-uncaught-exception-monitor.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-querystring.js` | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| `test-queue-microtask.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-readline-emit-keypress-events.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-readline-interface.js` | 42 | 0 | 0 | 0 | 0 | 0 | 42 |
| `test-readline-promises-interface.js` | 33 | 0 | 0 | 0 | 0 | 0 | 33 |
| `test-readline-tab-complete.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-readline.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-release-changelog.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-repl-context.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-repl-require.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-repl-tab-complete-import.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-repl-tab-complete.js` | 5 | 0 | 0 | 5 | 0 | 0 | 0 |
| `test-require-cache.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-node-prefix.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-resolve-opts-paths-relative.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-require-resolve.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-assert.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-runner-cli-concurrency.js` | 5 | 0 | 0 | 5 | 0 | 0 | 0 |
| `test-runner-cli-timeout.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-runner-cli.js` | 11 | 0 | 0 | 11 | 0 | 0 | 0 |
| `test-runner-concurrency.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-runner-coverage.js` | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-custom-assertions.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-error-reporter.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-runner-extraneous-async-activity.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-runner-force-exit-flush.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-runner-mocking.js` | 43 | 42 | 0 | 0 | 1 | 0 | 0 |
| `test-runner-module-mocking.js` | 19 | 15 | 4 | 0 | 0 | 0 | 0 |
| `test-runner-no-isolation-filtering.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-runner-snapshot-file-tests.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-runner-snapshot-tests.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-runner-test-filepath.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-test-fullname.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-wait-for.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-set-http-max-http-headers.js` | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| `test-set-incoming-message-header.js` | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| `test-shadow-realm-prepare-stack-trace.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-single-executable-blob-config-errors.js` | 11 | 0 | 0 | 11 | 0 | 0 | 0 |
| `test-single-executable-blob-config.js` | 5 | 0 | 0 | 5 | 0 | 0 | 0 |
| `test-snapshot-api.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-argv1.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-basic.js` | 4 | 0 | 0 | 0 | 4 | 0 | 0 |
| `test-snapshot-child-process-sync.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-cjs-main.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-config.js` | 4 | 0 | 0 | 0 | 4 | 0 | 0 |
| `test-snapshot-console.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-coverage.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-cwd.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-dns-lookup-localhost-promise.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-dns-lookup-localhost.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-dns-resolve-localhost-promise.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-dns-resolve-localhost.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-error.js` | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| `test-snapshot-eval.js` | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| `test-snapshot-gzip.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-incompatible.js` | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| `test-snapshot-net.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-stack-trace-limit.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-typescript.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-umd.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-snapshot-warning.js` | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| `test-source-map-api.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-source-map-enable.js` | 23 | 23 | 0 | 0 | 0 | 0 | 0 |
| `test-sqlite-database-sync.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-sqlite-session.js` | 14 | 13 | 1 | 0 | 0 | 0 | 0 |
| `test-sqlite-statement-sync.js` | 9 | 8 | 1 | 0 | 0 | 0 | 0 |
| `test-sqlite.js` | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| `test-startup-empty-regexp-statics.js` | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| `test-startup-large-pages.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-stream-add-abort-signal.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-stream-auto-destroy.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-catch-rejections.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-compose-operator.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-compose.js` | 22 | 21 | 1 | 0 | 0 | 0 | 0 |
| `test-stream-construct.js` | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-consumers.js` | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-destroy.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-drop-take.js` | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| `test-stream-duplex-destroy.js` | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-duplex-end.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-duplex-from.js` | 23 | 22 | 1 | 0 | 0 | 0 | 0 |
| `test-stream-duplex-props.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-duplex-readable-writable.js` | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| `test-stream-duplex-writable-finished.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-duplex.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-duplexpair.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-error-once.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-event-names.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-filter.js` | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-finished.js` | 42 | 35 | 7 | 0 | 0 | 0 | 0 |
| `test-stream-flatMap.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-forEach.js` | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-map.js` | 17 | 15 | 2 | 0 | 0 | 0 | 0 |
| `test-stream-objectmode-undefined.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-once-readable-pipe.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-pipe-error-handling.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-pipe-flow.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-pipe-same-destination-twice.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-pipe-unpipe-streams.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-pipeline.js` | 80 | 78 | 1 | 1 | 0 | 0 | 0 |
| `test-stream-promises.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-aborted.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-async-iterators.js` | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| `test-stream-readable-default-encoding.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-destroy.js` | 23 | 23 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-didRead.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-emit-readable-short-stream.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-ended.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-event.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-no-unneeded-readable.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-object-multi-push-async.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-pause-and-resume.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-readable.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-reading-readingMore.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-resumeScheduled.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-setEncoding-existing-buffers.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-strategy-option.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-readable-unshift.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-reduce.js` | 8 | 7 | 1 | 0 | 0 | 0 | 0 |
| `test-stream-toArray.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-transform-destroy.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-transform-split-highwatermark.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-typedarray.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-uint8array.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-unpipe-event.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-wrap-encoding.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-stream-writable-aborted.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-destroy.js` | 28 | 28 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-end-cb-error.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-finish-destroyed.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-finished.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-null.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-writable.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-write-cb-error.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-write-cb-twice.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-stream-writable-write-writev-finish.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-basic.js` | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-objects.js` | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-pipe-error-handling.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-readable-wrap-destroy.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-readable-wrap-error.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-set-encoding.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-transform.js` | 17 | 17 | 0 | 0 | 0 | 0 | 0 |
| `test-stream2-writable.js` | 24 | 24 | 0 | 0 | 0 | 0 | 0 |
| `test-streams-highwatermark.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-stringbytes-external.js` | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| `test-tick-processor-version-check.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-timers-immediate-promisified.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-timers-interval-promisified.js` | 12 | 0 | 0 | 0 | 0 | 0 | 12 |
| `test-timers-refresh.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-timers-timeout-promisified.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-timers-to-primitive.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-timers-unenroll-unref-interval.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-timers-unref.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-timers-user-call.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-timers-zero-timeout.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-tls-basic-validations.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-tls-connect-allow-half-open-option.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-tls-external-accessor.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-server-parent-constructor-options.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-socket-allow-half-open-option.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-tls-translate-peer-certificate.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-url-fileurltopath.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-url-format-whatwg.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-url-parse-format.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-url-pathtofileurl.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-util-callbackify.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-util-deprecate.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-util-format.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| `test-util-getcallsites.js` | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| `test-util-inspect-getters-accessing-this.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-util-inspect.js` | 99 | 49 | 2 | 0 | 0 | 0 | 48 |
| `test-util-isDeepStrictEqual.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-util-promisify.js` | 19 | 0 | 0 | 0 | 0 | 0 | 19 |
| `test-util-types.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-uv-unmapped-exception.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-v8-collect-gc-profile-exit-before-stop.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-v8-coverage.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-v8-query-objects.js` | 5 | 0 | 0 | 0 | 5 | 0 | 0 |
| `test-v8-serdes.js` | 14 | 0 | 0 | 0 | 14 | 0 | 0 |
| `test-validators.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `test-vm-basic.js` | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| `test-vm-codegen.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-vm-context-dont-contextify.js` | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| `test-vm-measure-memory-lazy.js` | 4 | 0 | 0 | 0 | 4 | 0 | 0 |
| `test-vm-module-basic.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-vm-new-script-new-context.js` | 8 | 6 | 2 | 0 | 0 | 0 | 0 |
| `test-webcrypto-constructors.js` | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-derivebits.js` | 4 | 0 | 2 | 0 | 0 | 0 | 2 |
| `test-webcrypto-derivekey.js` | 6 | 0 | 3 | 0 | 0 | 0 | 3 |
| `test-webcrypto-encrypt-decrypt-aes.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-encrypt-decrypt.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-export-import-ec.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-webcrypto-export-import.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-keygen.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-webcrypto-random.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-sign-verify.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-webidl.js` | 28 | 0 | 0 | 0 | 0 | 0 | 28 |
| `test-webstorage.js` | 8 | 1 | 7 | 0 | 0 | 0 | 0 |
| `test-webstreams-abort-controller.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-webstreams-compose.js` | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| `test-webstreams-finished.js` | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| `test-webstreams-pipeline.js` | 17 | 17 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-encoding-custom-fatal-streaming.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-whatwg-encoding-custom-interop.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-whatwg-encoding-custom-textdecoder.js` | 12 | 11 | 1 | 0 | 0 | 0 | 0 |
| `test-whatwg-events-add-event-listener-options-passive.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-whatwg-events-add-event-listener-options-signal.js` | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-events-customevent.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-readablebytestream.js` | 11 | 0 | 0 | 0 | 0 | 0 | 11 |
| `test-whatwg-readablestream.js` | 82 | 0 | 0 | 0 | 0 | 0 | 82 |
| `test-whatwg-transformstream.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `test-whatwg-url-custom-searchparams-constructor.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-custom-searchparams-delete.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-custom-searchparams-stringifier.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-custom-setters.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-properties.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-whatwg-webstreams-adapters-streambase.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-whatwg-webstreams-adapters-to-readablestream.js` | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| `test-whatwg-webstreams-adapters-to-readablewritablepair.js` | 12 | 0 | 0 | 0 | 0 | 0 | 12 |
| `test-whatwg-webstreams-adapters-to-streamduplex.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-whatwg-webstreams-adapters-to-streamreadable.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-whatwg-webstreams-adapters-to-streamwritable.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-whatwg-webstreams-adapters-to-writablestream.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-whatwg-webstreams-encoding.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-whatwg-webstreams-transfer.js` | 13 | 0 | 0 | 0 | 0 | 0 | 13 |
| `test-whatwg-writablestream.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `test-worker-broadcastchannel-wpt.js` | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| `test-worker-broadcastchannel.js` | 9 | 0 | 0 | 9 | 0 | 0 | 0 |
| `test-worker-eval-typescript.js` | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| `test-worker-execargv-invalid.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-worker-message-channel.js` | 3 | 1 | 1 | 1 | 0 | 0 | 0 |
| `test-worker-message-event.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-worker-message-mark-as-uncloneable.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-worker-message-port-close.js` | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| `test-worker-message-port-transfer-duplicate.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-worker-message-port-transfer-native.js` | 2 | 0 | 1 | 0 | 0 | 0 | 1 |
| `test-worker-message-port-wasm-threads.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-worker-message-port.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-worker-message-transfer-port-mark-as-untransferable.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-worker-unsupported-path.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-worker-workerdata-messageport.js` | 5 | 0 | 2 | 3 | 0 | 0 | 0 |
| `test-wrap-js-stream-destroy.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-wrap-js-stream-duplex.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-x509-escaping.js` | 8 | 0 | 5 | 3 | 0 | 0 | 0 |
| `test-zlib-brotli.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-create-raw.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-destroy.js` | 2 | 1 | 0 | 0 | 0 | 0 | 1 |
| `test-zlib-dictionary-fail.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-failed-init.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-zero-windowBits.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-async-wrap-getasyncid.js` | 18 | 0 | 0 | 0 | 0 | 0 | 18 |
| `test-child-process-execsync.js` | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| `test-cpu-prof-invalid-options.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-crypto-timing-safe-equal.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-diagnostic-dir-cpu-prof.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-diagnostic-dir-heap-prof.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-error-serdes.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-fs-opendir-recursive.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-readdir-recursive.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-watch.js` | 6 | 3 | 3 | 0 | 0 | 0 | 0 |
| `test-heapdump.js` | 4 | 0 | 0 | 0 | 4 | 0 | 0 |
| `test-init.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-module-loading.js` | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| `test-net-server-address.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-net-server-bind.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-perf-hooks.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-performance-eventloopdelay.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-single-executable-application-assets.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-single-executable-application-snapshot.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-connect.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |

## Classified Non-Runnable Tests

### known gap (1196)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| node:http2 public API is a stub in WebAssembly runtime | 106 | `parallel/test-http2-head-request.js`, `parallel/test-http2-info-headers.js`, `parallel/test-http2-invalidargtypes-errors.js`, ... (+103) |
| stream edge case not yet handled | 22 | `parallel/test-stream-compose.js#block_17_block_17`, `parallel/test-stream-drop-take.js#block_01_don_t_wait_for_next_item_in_the_original_stream_when_already`, `parallel/test-stream-duplex-from.js#block_17_block_17`, ... (+19) |
| process.permission and --permission CLI semantics are incomplete in execPath emulation | 18 | `parallel/test-cli-permission-deny-fs.js#block_00_block_00`, `parallel/test-cli-permission-deny-fs.js#block_01_block_01`, `parallel/test-cli-permission-deny-fs.js#block_02_block_02`, ... (+15) |
| wasi:sockets UDP implementation crashes in wasmtime | 14 | `parallel/test-dgram-connect-send-callback-buffer.js`, `parallel/test-dgram-connect-send-callback-multi-buffer.js`, `parallel/test-dgram-connect-send-default-host.js`, ... (+11) |
| domain module depends on async_hooks, not fully working | 13 | `parallel/test-domain-promise.js#block_00_block_00`, `parallel/test-domain-promise.js#block_01_block_01`, `parallel/test-domain-promise.js#block_03_block_03`, ... (+10) |
| inherited: dns.getServers()/setServers default-server behavior and validation are not Node-compatible | 12 | `parallel/test-dns.js#block_00_verify_that_setservers_handles_arrays_with_holes_and_other_o`, `parallel/test-dns.js#block_01_block_01`, `parallel/test-dns.js#block_02_block_02`, ... (+9) |
| node:readline module is not yet supported in WebAssembly environment | 12 | `parallel/test-readline-keys.js`, `parallel/test-readline-position.js`, `parallel/test-readline-reopen.js`, ... (+9) |
| full script module-loading test still exposes incomplete main-module/cache/package-main edge semantics | 11 | `sequential/test-module-loading.js#block_00_block_00`, `sequential/test-module-loading.js#block_01_block_01`, `sequential/test-module-loading.js#block_02_block_02`, ... (+8) |
| inherited: process.permission and --permission CLI semantics are incomplete in execPath emulation | 11 | `parallel/test-permission-allow-child-process-cli.js#block_00_guarantee_the_initial_state`, `parallel/test-permission-allow-child-process-cli.js#block_01_to_spawn_unless_allow_child_process_is_sent`, `parallel/test-permission-allow-wasi-cli.js#block_00_guarantee_the_initial_state`, ... (+8) |
| net.js TCP implementation incomplete - needs event handling and API fixes | 11 | `parallel/test-net-connect-nodelay.js`, `parallel/test-net-connect-paused-connection.js`, `parallel/test-net-during-close.js`, ... (+8) |
| remaining failures run through spawnSync(process.execPath, ...) and assert exact child-process status/stderr cycle diagnostics; direct node modules app same-process module graph coverage lives in tests/node_modules_apps | 11 | `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_00_a_mjs_b_cjs_c_mjs_a_mjs`, `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_01_b_cjs_c_mjs_a_mjs_b_cjs`, `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_02_c_mjs_a_mjs_b_cjs_c_mjs`, ... (+8) |
| wasi:sockets UDP implementation hangs in wasmtime | 11 | `parallel/test-dgram-implicit-bind.js`, `parallel/test-dgram-multicast-set-interface.js#block_00_block_00`, `parallel/test-dgram-multicast-set-interface.js#block_02_block_02`, ... (+8) |
| dgram multicast membership APIs are not implemented (ENOSYS) | 10 | `parallel/test-dgram-membership.js#block_02_addmembership_with_no_argument_should_throw`, `parallel/test-dgram-membership.js#block_03_dropmembership_with_no_argument_should_throw`, `parallel/test-dgram-membership.js#block_04_addmembership_with_invalid_multicast_address_should_throw`, ... (+7) |
| async_hooks not fully implemented | 9 | `parallel/test-async-hooks-destroy-on-gc.js`, `parallel/test-async-hooks-disable-during-promise.js`, `parallel/test-async-hooks-disable-gc-tracking.js`, ... (+6) |
| module SourceMap/findSourceMap API is not fully implemented | 9 | `parallel/test-source-map-api.js#block_00_it_should_throw_with_invalid_args`, `parallel/test-source-map-api.js#block_01_findsourcemap_should_return_undefined_when_no_source_map_is_`, `parallel/test-source-map-api.js#block_02_non_exceptional_case`, ... (+6) |
| spawn() AbortSignal handling is incomplete (exit code/signal/error semantics differ from Node) | 9 | `parallel/test-child-process-spawn-controller.js#block_00_block_00`, `parallel/test-child-process-spawn-controller.js#block_01_block_01`, `parallel/test-child-process-spawn-controller.js#block_02_block_02`, ... (+6) |
| spawnSync() returns ENOSYS for non-execPath commands; Node expects ENOENT after option validation | 9 | `parallel/test-child-process-spawnsync-validation-errors.js#block_00_block_00`, `parallel/test-child-process-spawnsync-validation-errors.js#block_01_block_01`, `parallel/test-child-process-spawnsync-validation-errors.js#block_02_block_02`, ... (+6) |
| stripTypeScriptTypes requires Amaro support, which is not implemented | 9 | `parallel/test-module-strip-types.js#test_00_striptypescripttypes`, `parallel/test-module-strip-types.js#test_01_striptypescripttypes_explicit`, `parallel/test-module-strip-types.js#test_02_striptypescripttypes_code_is_not_a_string`, ... (+6) |
| vm.SourceTextModule/SyntheticModule behavior is incomplete (status transitions, validation, and timeout handling) | 9 | `parallel/test-vm-module-basic.js#block_00_check_inspection_of_the_instance`, `parallel/test-vm-module-basic.js#block_01_block_01`, `parallel/test-vm-module-basic.js#block_02_check_dependencies_getter_returns_same_object_every_time`, ... (+6) |
| Intl is not available in current runtime | 8 | `parallel/test-intl-v8BreakIterator.js`, `parallel/test-intl.js`, `parallel/test-whatwg-encoding-custom-textdecoder-fatal.js`, ... (+5) |
| process unhandledRejection/rejectionHandled/warning mode behavior is incomplete | 8 | `parallel/test-promise-unhandled-silent-no-hook.js`, `parallel/test-promise-unhandled-silent.js`, `parallel/test-promise-unhandled-warn-no-hook.js`, ... (+5) |
| vm.constants.DONT_CONTEXTIFY and vanilla-context behavior are not implemented | 8 | `parallel/test-vm-context-dont-contextify.js#block_00_block_00`, `parallel/test-vm-context-dont-contextify.js#block_01_block_01`, `parallel/test-vm-context-dont-contextify.js#block_02_block_02`, ... (+5) |
| common-shim spawnPromisified child emulation does not support --experimental-webstorage/--localstorage-file flags | 7 | `parallel/test-webstorage.js#test_01_emits_a_warning_when_used`, `parallel/test-webstorage.js#test_02_storage_instances_cannot_be_created_in_userland`, `parallel/test-webstorage.js#test_03_sessionstorage_is_not_persisted`, ... (+4) |
| inherited: Intl is not available in current runtime | 7 | `parallel/test-icu-transcode.js#block_00_block_00`, `parallel/test-icu-transcode.js#block_01_block_01`, `parallel/test-icu-transcode.js#block_02_test_that_uint8array_arguments_are_okay`, ... (+4) |
| WebAssembly global is missing in current runtime | 6 | `es-module/test-wasm-memory-out-of-bound.js`, `es-module/test-wasm-simple.js`, `es-module/test-wasm-web-api.js`, ... (+3) |
| fork() AbortSignal handling is incomplete (exit code/signal/error semantics differ from Node) | 6 | `parallel/test-child-process-fork-abort-signal.js#block_00_block_00`, `parallel/test-child-process-fork-abort-signal.js#block_01_block_01`, `parallel/test-child-process-fork-abort-signal.js#block_02_block_02`, ... (+3) |
| inherited: common.canCreateSymLink shim always returns false, so symlink permission tests are skipped | 6 | `parallel/test-permission-fs-symlink-target-write.js#block_00_block_00`, `parallel/test-permission-fs-symlink-target-write.js#block_01_block_01`, `parallel/test-permission-fs-symlink.js#block_00_block_00`, ... (+3) |
| inherited: perf_hooks createHistogram/monitorEventLoopDelay are not implemented | 6 | `parallel/test-perf-hooks-histogram.js#block_00_block_00`, `parallel/test-perf-hooks-histogram.js#block_01_block_01`, `parallel/test-perf-hooks-histogram.js#block_02_block_02`, ... (+3) |
| inherited: performance.timerify function entries are not implemented | 6 | `parallel/test-performance-function.js#block_00_block_00`, `parallel/test-performance-function.js#block_01_block_01`, `parallel/test-performance-function.js#block_02_block_02`, ... (+3) |
| IPv6 sockets are not available in this runtime (common.hasIPv6=false) | 5 | `parallel/test-dgram-ipv6only.js`, `parallel/test-dgram-udp6-link-local-address.js`, `parallel/test-dgram-udp6-send-default-host.js`, ... (+2) |
| http.request({ createConnection }) generic duplex stream semantics are incomplete (request dispatch, keep-alive, and clientError paths) | 5 | `parallel/test-http-generic-streams.js#block_00_test_1_simple_http_test_no_keep_alive`, `parallel/test-http-generic-streams.js#block_01_test_2_keep_alive_for_2_requests`, `parallel/test-http-generic-streams.js#block_02_test_3_connection_close_request_response_with_chunked`, ... (+2) |
| inherited: perf_hooks PerformanceResourceTiming/markResourceTiming behavior is incomplete | 5 | `parallel/test-perf-hooks-resourcetiming.js#block_00_performanceresourcetiming_should_not_be_initialized_external`, `parallel/test-perf-hooks-resourcetiming.js#block_01_using_performance_getentries`, `parallel/test-perf-hooks-resourcetiming.js#block_02_default_values`, ... (+2) |
| node:readline createInterface/async iterator API is not implemented | 5 | `parallel/test-readline-async-iterators-backpressure.js`, `parallel/test-readline-async-iterators-destroy.js`, `parallel/test-readline-async-iterators.js`, ... (+2) |
| process.getActiveResourcesInfo() is not implemented | 5 | `parallel/test-process-getactiveresources-track-active-handles.js`, `parallel/test-process-getactiveresources-track-active-requests.js`, `parallel/test-process-getactiveresources-track-interval-lifetime.js`, ... (+2) |
| util.format output formatting differences | 5 | `parallel/test-util-format.js#block_00_block_00`, `parallel/test-util-format.js#block_01_string_format_specifier_including_tostring_properties_on_the`, `parallel/test-util-format.js#block_02_symbol_toprimitive_handling_for_string_format_specifier`, ... (+2) |
| WASM child emulation does not support Node.js --test CLI output behavior | 4 | `parallel/test-runner-extraneous-async-activity.js#block_00_block_00`, `parallel/test-runner-extraneous-async-activity.js#block_01_block_01`, `parallel/test-runner-extraneous-async-activity.js#block_02_block_02`, ... (+1) |
| crypto.scrypt/scryptSync support is missing (test reports 'no scrypt support') | 4 | `parallel/test-crypto-scrypt.js#block_00_block_00`, `parallel/test-crypto-scrypt.js#block_01_block_01`, `parallel/test-crypto-scrypt.js#block_02_block_02`, ... (+1) |
| inherited: --frozen-intrinsics flag semantics are not implemented | 4 | `parallel/test-freeze-intrinsics.js#block_00_ensure_we_can_extend_console`, `parallel/test-freeze-intrinsics.js#block_01_ensure_we_can_write_override_object_prototype_properties_on_`, `parallel/test-freeze-intrinsics.js#block_02_ensure_we_can_not_override_globalthis`, ... (+1) |
| inherited: common-shim mustCall()/mustCallAtLeast() argument validation differs from Node's test harness | 4 | `parallel/test-common.js#block_00_test_for_leaked_global_detection`, `parallel/test-common.js#block_01_test_for_disabling_leaked_global_detection`, `parallel/test-common.js#block_02_test_tmpdir`, ... (+1) |
| inherited: net.connect option validation/coercion for port and hints is not Node-compatible | 4 | `parallel/test-net-connect-options-port.js#block_00_test_wrong_type_of_ports`, `parallel/test-net-connect-options-port.js#block_01_test_out_of_range_ports`, `parallel/test-net-connect-options-port.js#block_02_test_invalid_hints`, ... (+1) |
| isMarkedAsUntransferable() and related mark/query behavior are incomplete | 4 | `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_00_block_00`, `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_01_block_01`, `parallel/test-worker-message-transfer-port-mark-as-untransferable.js#block_02_block_02`, ... (+1) |
| markAsUncloneable and DataCloneError semantics are incomplete | 4 | `parallel/test-worker-message-mark-as-uncloneable.js#block_00_uncloneables_cannot_be_cloned_during_message_posting`, `parallel/test-worker-message-mark-as-uncloneable.js#block_01_uncloneables_cannot_be_cloned_during_structured_cloning`, `parallel/test-worker-message-mark-as-uncloneable.js#block_02_markasuncloneable_cannot_affect_arraybuffer`, ... (+1) |
| promisified exec()/execFile() contract is incomplete (promise.child is not a ChildProcess instance) | 4 | `parallel/test-child-process-promisified.js#block_00_block_00`, `parallel/test-child-process-promisified.js#block_01_block_01`, `parallel/test-child-process-promisified.js#block_02_block_02`, ... (+1) |
| remaining failures run through spawnSync(process.execPath, ...) and assert exact child-process status/stdout/stderr diagnostics; one TLA/dynamic-import sequencing case can still hit a QuickJS linker assert through process.execPath emulation, but direct same-process node modules app coverage passes | 4 | `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_00_a_mjs_b_mjs_c_mjs_d_mjs_c_mjs`, `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_01_b_mjs_c_mjs_d_mjs_c_mjs`, `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_02_c_mjs_d_mjs_c_mjs`, ... (+1) |
| timeout enforcement with microtaskMode='afterEvaluate' is incomplete | 4 | `parallel/test-vm-timeout-escape-promise-2.js`, `parallel/test-vm-timeout-escape-promise-module.js`, `parallel/test-vm-timeout-escape-promise.js`, ... (+1) |
| unhandled-rejection mode and uncaughtException bridging semantics are incomplete | 4 | `parallel/test-promise-unhandled-default.js`, `parallel/test-promise-unhandled-error.js`, `parallel/test-promise-unhandled-throw-handler.js`, ... (+1) |
| wasi:http client does not surface 103 Early Hints as 'information' events | 4 | `parallel/test-http-early-hints.js#block_00_block_00`, `parallel/test-http-early-hints.js#block_01_block_01`, `parallel/test-http-early-hints.js#block_03_block_03`, ... (+1) |
| DOMException options bag ({ name, cause }) is not implemented | 3 | `parallel/test-domexception-cause.js#block_01_block_01`, `parallel/test-domexception-cause.js#block_02_block_02`, `parallel/test-domexception-cause.js#block_03_block_03` |
| MessagePort close callback, close-state checks, and closed-port errors are incomplete | 3 | `parallel/test-worker-message-port-close.js#block_00_block_00`, `parallel/test-worker-message-port-close.js#block_01_block_01`, `parallel/test-worker-message-port-close.js#block_02_block_02` |
| WASM child emulation does not support Node.js --test TAP filtering behavior | 3 | `parallel/test-runner-no-isolation-filtering.js#test_00_works_with_test_only`, `parallel/test-runner-no-isolation-filtering.js#test_01_works_with_test_name_pattern`, `parallel/test-runner-no-isolation-filtering.js#test_02_works_with_test_skip_pattern` |
| WASM child emulation does not support Node.js --test reporter destination flushing | 3 | `parallel/test-runner-force-exit-flush.js#test_00_junit_reporter`, `parallel/test-runner-force-exit-flush.js#test_01_spec_reporter`, `parallel/test-runner-force-exit-flush.js#test_02_tap_reporter` |
| child_process spawn() stdio stream compatibility (e.g. pipe) is incomplete in execPath emulation | 3 | `parallel/test-cwd-enoent-preload.js`, `parallel/test-cwd-enoent.js`, `parallel/test-preload.js` |
| child_process.spawn pipe mode does not provide functional child.stdin | 3 | `parallel/test-stdin-pipe-large.js`, `parallel/test-stdin-pipe-resume.js`, `parallel/test-stdin-script-child-option.js` |
| common.canCreateSymLink shim always returns false, so symlink tests are skipped | 3 | `parallel/test-fs-symlink-buffer-path.js`, `parallel/test-fs-symlink-dir.js`, `parallel/test-fs-symlink.js` |
| common/gc async_hooks-based GC tracking is not implemented in the WASM test shim | 3 | `sequential/test-gc-http-client-onerror.js`, `sequential/test-gc-http-client-timeout.js`, `sequential/test-gc-http-client.js` |
| context marker Symbol(vm.context) leaks into sandbox property enumeration | 3 | `parallel/test-vm-ownkeys.js`, `parallel/test-vm-ownpropertynames.js`, `parallel/test-vm-ownpropertysymbols.js` |
| crypto.X509Certificate API is not implemented | 3 | `parallel/test-x509-escaping.js#block_01_test_escaping_rules_for_subject_alternative_names`, `parallel/test-x509-escaping.js#block_02_test_escaping_rules_for_authority_info_access`, `parallel/test-x509-escaping.js#block_03_test_escaping_rules_for_the_subject_field` |
| dgram send() callback overload path has JS/native argument conversion bugs | 3 | `parallel/test-dgram-send-callback-buffer-length-empty-address.js`, `parallel/test-dgram-send-callback-buffer-length.js`, `parallel/test-dgram-send-callback-buffer.js` |
| dgram socket buffer size APIs may hang | 3 | `parallel/test-dgram-socket-buffer-size.js#block_02_block_02`, `parallel/test-dgram-socket-buffer-size.js#block_04_block_04`, `parallel/test-dgram-socket-buffer-size.js#block_05_block_05` |
| global MessageEvent constructor/validation/inheritance semantics are not Node-compatible | 3 | `parallel/test-worker-message-event.js#block_00_block_00`, `parallel/test-worker-message-event.js#block_01_block_01`, `parallel/test-worker-message-event.js#block_02_block_02` |
| inherited: common.canCreateSymLink shim always returns false, so traversal+symlink permission tests are skipped | 3 | `parallel/test-permission-fs-traversal-path.js#block_00_block_00`, `parallel/test-permission-fs-traversal-path.js#block_01_block_01`, `parallel/test-permission-fs-traversal-path.js#block_02_block_02` |
| inherited: dgram AbortSignal validation and close semantics are incomplete | 3 | `parallel/test-dgram-close-signal.js#block_00_block_00`, `parallel/test-dgram-close-signal.js#block_01_block_01`, `parallel/test-dgram-close-signal.js#block_02_block_02` |
| inherited: missing AbortSignal validation for listen | 3 | `parallel/test-net-server-listen-options-signal.js#block_00_block_00`, `parallel/test-net-server-listen-options-signal.js#block_01_block_01`, `parallel/test-net-server-listen-options-signal.js#block_02_block_02` |
| inherited: perf_hooks user timing classes and methods are incomplete | 3 | `parallel/test-perf-hooks-usertiming.js#block_00_block_00`, `parallel/test-perf-hooks-usertiming.js#block_01_block_01`, `parallel/test-perf-hooks-usertiming.js#block_02_block_02` |
| inherited: readline.emitKeypressEvents behavior is not implemented | 3 | `parallel/test-readline-emit-keypress-events.js#block_00_block_00`, `parallel/test-readline-emit-keypress-events.js#block_01_block_01`, `parallel/test-readline-emit-keypress-events.js#block_02_block_02` |
| inherited: server parser accepts bare-CR header separators instead of replying 400 and closing | 3 | `parallel/test-http-missing-header-separator-cr.js#block_00_block_00`, `parallel/test-http-missing-header-separator-cr.js#block_01_block_01`, `parallel/test-http-missing-header-separator-cr.js#block_02_block_02` |
| inherited: server parser accepts bare-LF header separators instead of replying 400 and closing | 3 | `parallel/test-http-missing-header-separator-lf.js#block_00_block_00`, `parallel/test-http-missing-header-separator-lf.js#block_01_block_01`, `parallel/test-http-missing-header-separator-lf.js#block_02_block_02` |
| inherited: setServers argument validation (ERR_INVALID_ARG_TYPE details) is incomplete for dns and dns/promises | 3 | `parallel/test-dns-setservers-type-check.js#block_00_block_00`, `parallel/test-dns-setservers-type-check.js#block_01_block_01`, `parallel/test-dns-setservers-type-check.js#block_02_this_test_for_dns_promises` |
| net edge case not yet handled | 3 | `parallel/test-net-autoselectfamily.js#block_01_test_that_only_the_last_successful_connection_is_established`, `parallel/test-net-connect-reset.js`, `parallel/test-net-pingpong.js` |
| node:readline Interface constructor/options are not implemented | 3 | `parallel/test-readline-interface-escapecodetimeout.js`, `parallel/test-readline-interface-no-trailing-newline.js`, `parallel/test-readline-interface-recursive-writes.js` |
| node:test concurrency scheduling/completion semantics are incomplete | 3 | `parallel/test-runner-concurrency.js#test_00_concurrency_option_boolean_true`, `parallel/test-runner-concurrency.js#test_01_concurrency_option_boolean_false`, `parallel/test-runner-concurrency.js#test_02_concurrency_true_implies_infinity` |
| node_compat common shim is missing ../common/wpt harness | 3 | `parallel/test-whatwg-events-event-constructors.js`, `parallel/test-whatwg-events-eventtarget-this-of-listener.js`, `parallel/test-whatwg-url-custom-searchparams-sort.js` |
| perf_hooks incomplete | 3 | `parallel/test-performance-gc.js#block_00_adding_an_observer_should_force_at_least_one_gc_to_appear`, `parallel/test-performance-measure-detail.js`, `parallel/test-performance-measure.js` |
| perf_hooks.monitorEventLoopDelay is not implemented | 3 | `sequential/test-performance-eventloopdelay.js#block_00_block_00`, `sequential/test-performance-eventloopdelay.js#block_01_block_01`, `sequential/test-performance-eventloopdelay.js#block_02_block_02` |
| setUncaughtExceptionCaptureCallback does not fully intercept thrown uncaught exceptions | 3 | `parallel/test-process-exception-capture-should-abort-on-uncaught-setflagsfromstring.js`, `parallel/test-process-exception-capture-should-abort-on-uncaught.js`, `parallel/test-process-exception-capture.js` |
| spawn() stdio validation/pipe semantics are not Node-compatible in WASM emulation | 3 | `parallel/test-child-process-stdio.js#block_00_test_stdio_piping`, `parallel/test-child-process-stdio.js#block_02_asset_options_invariance`, `parallel/test-child-process-stdio.js#block_03_test_stdout_buffering` |
| test runner edge case | 3 | `parallel/test-runner-filetest-location.js`, `parallel/test-runner-root-after-with-refed-handles.js`, `parallel/test-runner-todo-skip-tests.js` |
| CLI/NODE_OPTIONS max-http-header-size propagation in child process emulation is incomplete | 2 | `parallel/test-set-http-max-http-headers.js#test_01_test_01`, `parallel/test-set-http-max-http-headers.js#test_02_same_checks_using_node_options_if_it_is_supported` |
| DSA keygen currently supports only modern key sizes; legacy 512-bit variant fails | 2 | `parallel/test-crypto-keygen-async-dsa-key-object.js`, `parallel/test-crypto-keygen-async-dsa.js` |
| HTTP keep-alive socket identity reuse across sequential requests is not implemented | 2 | `parallel/test-http-keepalive-client.js`, `parallel/test-http-keepalive-request.js` |
| IncomingMessage 'aborted' event is not emitted when the server destroys a keep-alive response | 2 | `parallel/test-http-client-aborted-event.js#block_00_block_00`, `parallel/test-http-client-aborted-event.js#block_01_block_01` |
| TextDecoderStream invalid-encoding errors are not Node-compatible yet | 2 | `parallel/test-whatwg-webstreams-encoding.js#block_00_block_00`, `parallel/test-whatwg-webstreams-encoding.js#block_01_block_01` |
| WASM child emulation does not support Node.js --test CLI reporter execution | 2 | `parallel/test-runner-error-reporter.js#test_00_all_tests_failures_reported_without_fail_fast_flag`, `parallel/test-runner-error-reporter.js#test_01_fail_fast_stops_test_execution_after_first_failure` |
| async_hooks createHook callback validation is incomplete | 2 | `parallel/test-async-hooks-constructor.js`, `parallel/test-async-wrap-constructor.js` |
| async_hooks executionAsyncResource propagation is incomplete under node:http server/client callbacks | 2 | `parallel/test-async-hooks-execution-async-resource-await.js`, `parallel/test-async-hooks-execution-async-resource.js` |
| child_process execPath emulation does not fully match spawnSync({ encoding }) behavior for --check stdin runs | 2 | `parallel/test-cli-syntax-piped-bad.js`, `parallel/test-cli-syntax-piped-good.js` |
| child_process execPath emulation does not implement --trace-require-module warning output | 2 | `es-module/test-require-module-warning.js`, `es-module/test-require-node-modules-warning.js` |
| child_process.spawn emulation does not support --interactive REPL sessions | 2 | `parallel/test-repl-array-prototype-tempering.js`, `sequential/test-repl-timeout-throw.js` |
| common-shim gc helper does not provide V8-style collectability checks used by this leak test | 2 | `es-module/test-vm-source-text-module-leak.js`, `es-module/test-vm-synthetic-module-leak.js` |
| crypto.X509Certificate.checkHost is not available | 2 | `parallel/test-x509-escaping.js#block_06_the_subject_must_be_ignored_if_a_dnsname_subject_alternative`, `parallel/test-x509-escaping.js#block_07_exists_even_if_other_subject_alternative_names_exist` |
| dgram send() callback does not report bytes correctly for multi-buffer payloads | 2 | `parallel/test-dgram-send-callback-multi-buffer.js`, `parallel/test-dgram-send-multi-buffer-copy.js` |
| dgram socket buffer size APIs do not match Node error semantics | 2 | `parallel/test-dgram-socket-buffer-size.js#block_00_block_00`, `parallel/test-dgram-socket-buffer-size.js#block_01_block_01` |
| diagnostics_channel tracing for module.import events is incomplete | 2 | `parallel/test-diagnostics-channel-module-import-error.js`, `parallel/test-diagnostics-channel-module-import.js` |
| diagnostics_channel tracing for module.require events is incomplete | 2 | `parallel/test-diagnostics-channel-module-require-error.js`, `parallel/test-diagnostics-channel-module-require.js` |
| dns.resolveAny/Resolver.resolveAny protocol handling is not implemented | 2 | `parallel/test-dns-resolveany-bad-ancount.js`, `parallel/test-dns-resolveany.js` |
| domain/setUncaughtExceptionCaptureCallback interaction is incomplete | 2 | `parallel/test-domain-load-after-set-uncaught-exception-capture.js`, `parallel/test-domain-set-uncaught-exception-capture-after-load.js` |
| execPath child emulation does not yet support trace-events CLI arg parsing used by -e runs | 2 | `parallel/test-trace-events-fs-async.js`, `parallel/test-trace-events-fs-sync.js` |
| fork() timeout/killSignal behavior is not Node-compatible in WASM emulation | 2 | `parallel/test-child-process-fork-timeout-kill-signal.js#block_00_block_00`, `parallel/test-child-process-fork-timeout-kill-signal.js#block_01_block_01` |
| fork()/spawn() IPC send() boolean/backpressure semantics are not implemented | 2 | `parallel/test-child-process-send-returns-boolean.js#block_00_block_00`, `parallel/test-child-process-send-returns-boolean.js#block_01_block_01` |
| http edge case not yet handled | 2 | `parallel/test-http-agent-close.js`, `parallel/test-http-insecure-parser.js` |
| inherited: dgram multicast loopback API is not implemented (ENOSYS) | 2 | `parallel/test-dgram-multicast-loopback.js#block_00_block_00`, `parallel/test-dgram-multicast-loopback.js#block_01_block_01` |
| inherited: dgram setBroadcast API is not implemented (ENOSYS) | 2 | `parallel/test-dgram-setBroadcast.js#block_00_block_00`, `parallel/test-dgram-setBroadcast.js#block_01_block_01` |
| inherited: listen(options) argument validation/error semantics are not fully Node-compatible | 2 | `parallel/test-net-server-listen-options.js#block_01_block_01`, `parallel/test-net-server-listen-options.js#block_02_block_02` |
| inherited: process.getActiveResourcesInfo() is not implemented | 2 | `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_00_block_00`, `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_01_block_01` |
| inherited: queueMicrotask argument validation/error codes are incomplete | 2 | `parallel/test-queue-microtask.js#block_00_block_00`, `parallel/test-queue-microtask.js#block_01_block_01` |
| inherited: requires perf_hooks.PerformanceObserver with net detail | 2 | `parallel/test-net-perf_hooks.js#block_00_block_00`, `parallel/test-net-perf_hooks.js#block_01_block_01` |
| native rquickjs URL accessor descriptor function names are empty instead of Web IDL names like `get href` | 2 | `parallel/test-whatwg-url-properties.js#block_00_block_00`, `parallel/test-whatwg-url-properties.js#block_01_block_01` |
| perf_hooks performance.timeOrigin/nodeTiming semantics are not Node-compatible | 2 | `sequential/test-perf-hooks.js#block_00_block_00`, `sequential/test-perf-hooks.js#block_01_block_01` |
| perf_hooks resource timing buffer/full-event behavior is incomplete | 2 | `parallel/test-performance-resourcetimingbufferfull.js`, `parallel/test-performance-resourcetimingbuffersize.js` |
| process API incomplete | 2 | `parallel/test-process-beforeexit-throw-exit.js`, `parallel/test-process-beforeexit.js` |
| process.allowedNodeEnvironmentFlags behavior is incomplete | 2 | `parallel/test-process-env-allowed-flags.js#block_00_assert_legit_flags_are_allowed_and_bogus_flags_are_disallowe`, `parallel/test-process-env-allowed-flags.js#block_02_assert_immutability_of_process_allowednodeenvironmentflags` |
| process.permission worker-thread restrictions are incomplete | 2 | `parallel/test-permission-dc-worker-threads.js`, `parallel/test-permission-worker-threads-cli.js` |
| process.report.writeReport and permission-model integration are missing | 2 | `parallel/test-permission-fs-write-report.js#block_00_block_00`, `parallel/test-permission-fs-write-report.js#block_01_block_01` |
| promisified exec()/execFile() rejection errors miss stdout/stderr fields | 2 | `parallel/test-child-process-promisified.js#block_04_block_04`, `parallel/test-child-process-promisified.js#block_05_block_05` |
| spawn() timeout/killSignal behavior is not Node-compatible in WASM emulation | 2 | `parallel/test-child-process-spawn-timeout-kill-signal.js#block_00_block_00`, `parallel/test-child-process-spawn-timeout-kill-signal.js#block_01_block_01` |
| tls.connect() stub throws instead of constructing a TLSSocket for allowHalfOpen option checks | 2 | `parallel/test-tls-connect-allow-half-open-option.js#block_00_block_00`, `parallel/test-tls-connect-allow-half-open-option.js#block_01_block_01` |
| uncaughtExceptionMonitor event behavior in child_process flows is incomplete | 2 | `parallel/test-process-uncaught-exception-monitor.js#block_00_block_00`, `parallel/test-process-uncaught-exception-monitor.js#block_01_block_01` |
| vm timeout interrupt is surfaced as a wasm trap instead of ERR_SCRIPT_EXECUTION_TIMEOUT | 2 | `parallel/test-vm-timeout.js`, `sequential/test-vm-timeout-rethrow.js` |
| wasi:http client path does not surface HPE_UNEXPECTED_CONTENT_LENGTH parse errors | 2 | `parallel/test-http-response-multi-content-length.js#block_00_test_adding_an_extra_content_length_header_using_setheader`, `parallel/test-http-response-multi-content-length.js#block_01_test_adding_an_extra_content_length_header_using_writehead` |
| wasi:http request body is not finalized/sent until end(), so write()-only request flow diverges from Node | 2 | `parallel/test-http-outgoing-destroyed.js#block_00_block_00`, `parallel/test-http-outgoing-destroyed.js#block_01_block_01` |
| --disable-proto=delete semantics differ in QuickJS (__proto__ yields null) | 1 | `parallel/test-disable-proto-delete.js` |
| --disable-proto=throw flag semantics are not implemented | 1 | `parallel/test-disable-proto-throw.js` |
| --disallow-code-generation-from-strings flag semantics are not implemented | 1 | `parallel/test-eval-disallow-code-generation-from-strings.js` |
| --input-type=module eval emulation is incomplete for cwd-relative static/dynamic imports | 1 | `parallel/test-cli-eval.js#block_04_block_04` |
| --no-experimental-global-customevent flag is not honored | 1 | `parallel/test-global-customevent-disabled.js` |
| --no-experimental-global-webcrypto flag is not honored | 1 | `parallel/test-global-webcrypto-disbled.js` |
| --no-experimental-websocket flag is not honored | 1 | `parallel/test-websocket-disabled.js` |
| --trace-env diagnostics are not implemented in execPath emulation | 1 | `parallel/test-trace-env.js` |
| --trace-env-{js,native}-stack diagnostics are not implemented in execPath emulation | 1 | `parallel/test-trace-env-stack.js` |
| --trace-exit stack diagnostics are incomplete in execPath emulation | 1 | `parallel/test-trace-exit-stack-limit.js` |
| --trace-exit warning behavior across process/worker variants is incomplete | 1 | `parallel/test-trace-exit.js` |
| --trace-sync-io diagnostics are not implemented in execPath emulation | 1 | `parallel/test-sync-io-option.js` |
| 100-continue flow with synchronous socket write errors does not match Node | 1 | `parallel/test-http-sync-write-error-during-continue.js` |
| AbortSignal handling in Agent.createConnection/http.get is incomplete | 1 | `parallel/test-http-agent-abort-controller.js` |
| Agent free-socket bookkeeping and destroyed-socket reuse handling is incomplete | 1 | `parallel/test-http-agent-destroyed-socket.js` |
| Agent keep-alive queue/socket bookkeeping across concurrent requests is not Node-compatible | 1 | `parallel/test-http-keep-alive.js` |
| Agent queued-request abort cleanup is incomplete | 1 | `parallel/test-http-abort-queued.js` |
| Agent socket lifecycle/error handling under concurrent requests is incomplete | 1 | `parallel/test-http-agent.js` |
| Agent.createConnection override and keep-alive socket reuse semantics are incomplete | 1 | `parallel/test-http-client-abort-keep-alive-destroy-res.js` |
| Agent.createConnection override path is incomplete (base Agent lacks createConnection) | 1 | `parallel/test-http-client-abort-unix-socket.js` |
| Agent.createConnection override path is incomplete (base Agent lacks createConnection), and queued keep-alive abort semantics diverge | 1 | `parallel/test-http-client-abort-keep-alive-queued-tcp-socket.js` |
| Agent.createConnection override path is incomplete (base Agent lacks createConnection), so queued keep-alive abort flow fails | 1 | `parallel/test-http-client-abort-keep-alive-queued-unix-socket.js` |
| Agent.keepSocketAlive()/reuseSocket override hook semantics are not Node-compatible | 1 | `parallel/test-http-keepalive-override.js` |
| Agent/request timeout handling under concurrency can double-fire and hang | 1 | `parallel/test-http-client-timeout-agent.js` |
| Agent/socket bookkeeping on 'Connection: close' responses is not Node-compatible | 1 | `parallel/test-http-keep-alive-close-on-header.js` |
| Array-form request headers are not translated Node-compatibly (Host/auth suppression and duplicate-cookie handling differ) | 1 | `parallel/test-http-client-headers-array.js` |
| ArrayBuffer duplicate transfer entries report a non-Node duplicate-transfer error message | 1 | `parallel/test-worker-message-port-transfer-duplicate.js#block_01_block_01` |
| ArrayBuffer transfer detachment semantics are incomplete | 1 | `parallel/test-worker-message-port.js#block_06_block_06` |
| AsyncLocalStorage context propagation across async boundaries is incomplete | 1 | `parallel/test-async-local-storage-contexts.js` |
| AsyncLocalStorage context propagation across concurrent node:http client/server callbacks is incomplete | 1 | `parallel/test-async-local-storage-http-multiclients.js` |
| AsyncLocalStorage deep nesting/recursion handling is unstable | 1 | `parallel/test-async-local-storage-deep-stack.js` |
| AsyncLocalStorage.bind argument validation is incomplete | 1 | `parallel/test-async-local-storage-bind.js` |
| AsyncLocalStorage.snapshot is missing or incomplete | 1 | `parallel/test-async-local-storage-snapshot.js` |
| CLI --security-revert behavior in child_process spawnSync is not fully implemented | 1 | `parallel/test-security-revert-unknown.js` |
| CLI --title flag does not update process.title | 1 | `parallel/test-process-title-cli.js` |
| CLI --unhandled-rejections flag parsing/validation is incomplete | 1 | `parallel/test-promise-unhandled-flag.js` |
| CLI option precedence and NODE_OPTIONS merging are incomplete in execPath emulation | 1 | `parallel/test-cli-options-precedence.js` |
| CLI warning/negation behavior in execPath emulation is incomplete | 1 | `parallel/test-cli-options-negation.js` |
| ClientRequest abort/request completion lifecycle can hang | 1 | `parallel/test-http-client-abort.js` |
| ClientRequest createConnection option argument normalization is incompatible (missing/incorrect port/path for net.connect) | 1 | `parallel/test-http-client-with-create-connection.js` |
| ClientRequest default header generation is not Node-compatible (Connection/Content-Length defaults differ by method) | 1 | `parallel/test-http-client-default-headers-exist.js` |
| ClientRequest destroyed state/lifecycle on response close with keep-alive Agent is not Node-compatible | 1 | `parallel/test-http-client-agent-end-close-event.js` |
| ClientRequest timeout-event + end/destroy sequencing is not Node-compatible | 1 | `parallel/test-http-client-timeout-event.js` |
| ClientRequest.flushHeaders() does not reliably complete request/response lifecycle | 1 | `parallel/test-http-flush-headers.js` |
| ClientRequest.setTimeout and socket-timeout interaction is incomplete | 1 | `parallel/test-http-client-set-timeout.js` |
| ClientRequest.setTimeout callback path does not reliably destroy/close the request | 1 | `parallel/test-http-client-timeout.js` |
| ClientRequest.shouldKeepAlive handling for HTTP/1.0 and Connection headers is not fully Node-compatible | 1 | `parallel/test-http-should-keep-alive.js` |
| Custom lookup error path is incomplete (request error events are not emitted correctly) | 1 | `parallel/test-http-client-req-error-dont-double-fire.js` |
| Date timezone changes via process.env.TZ are not implemented | 1 | `parallel/test-process-env-tz.js` |
| ECDH key import/deriveBits compatibility for test vectors is incomplete | 1 | `parallel/test-webcrypto-derivebits-ecdh.js` |
| ECDH key import/deriveKey compatibility for test vectors is incomplete | 1 | `parallel/test-webcrypto-derivekey-ecdh.js` |
| ECDSA key import/sign/verify compatibility for test vectors is incomplete | 1 | `parallel/test-webcrypto-sign-verify-ecdsa.js` |
| ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG behavior is not implemented | 1 | `parallel/test-vm-dynamic-import-callback-missing-flag.js` |
| ESM directory import errors do not match Node ERR_UNSUPPORTED_DIR_IMPORT behavior | 1 | `parallel/test-directory-import.js` |
| EdDSA sign/verify vector compatibility is incomplete | 1 | `parallel/test-webcrypto-sign-verify-eddsa.js` |
| Error.prepareStackTrace default behavior is incomplete | 1 | `parallel/test-error-prepare-stack-trace.js` |
| EventEmitter captureRejections option validation/behavior is incomplete | 1 | `parallel/test-event-capture-rejections.js` |
| EventEmitter error -> uncaughtException stack handling is incomplete | 1 | `parallel/test-events-uncaught-exception-stack.js` |
| EventSource global is not implemented (experimental SSE API) | 1 | `parallel/test-eventsource.js` |
| Expect header handling is incomplete (default 417/checkExpectation paths diverge) | 1 | `parallel/test-http-expect-handling.js` |
| Expect: 100-continue flow (checkContinue/continue events) is incomplete | 1 | `parallel/test-http-expect-continue.js` |
| FileHandle clone/transfer behavior over MessagePort is incomplete | 1 | `parallel/test-worker-message-port-transfer-filehandle.js` |
| FileHandle createReadStream close/abort lifecycle is incomplete | 1 | `parallel/test-fs-read-stream-file-handle.js` |
| HKDF deriveBits argument validation/error codes do not match Node | 1 | `parallel/test-webcrypto-derivebits-hkdf.js` |
| HMAC sign/verify wrong-key error semantics do not match Node | 1 | `parallel/test-webcrypto-sign-verify-hmac.js` |
| HTTP CONNECT tunnel socket detachment/data-forwarding semantics are incomplete | 1 | `parallel/test-http-connect.js` |
| HTTP CONNECT tunnel socket detachment/lifecycle semantics are incomplete | 1 | `parallel/test-http-connect-req-res.js` |
| HTTP client response readable/end event ordering differs from Node | 1 | `parallel/test-stream2-httpclient-response-end.js` |
| HTTP header-name validation/request lifecycle behavior can hang | 1 | `parallel/test-http-invalidheaderfield.js` |
| HTTP parser accepts invalid chunk extensions and mishandles smuggling-style input | 1 | `parallel/test-http-chunked-smuggling.js` |
| HTTP parser clientError handling does not produce Node-compatible parse error response bytes | 1 | `parallel/test-http-server-client-error.js` |
| HTTP parser clientError/error-listener lifecycle for repeated invalid data is incomplete | 1 | `parallel/test-http-socket-error-listeners.js` |
| HTTP parser does not emit Node-compatible HPE_INVALID_TRANSFER_ENCODING clientError semantics | 1 | `parallel/test-http-server-reject-chunked-with-content-length.js` |
| HTTP parser handling for blank request headers and 400 response framing is incomplete | 1 | `parallel/test-http-blank-header.js` |
| HTTP parser/clientError path does not reject duplicate Content-Length with HPE_UNEXPECTED_CONTENT_LENGTH | 1 | `parallel/test-http-double-content-length.js` |
| HTTP request piping into a raw TCP stream with large payloads can hang in current net/http stream backpressure handling | 1 | `sequential/test-pipe.js` |
| HTTP request piping with constrained agent sockets can stall queued requests | 1 | `parallel/test-http-pipe-fs.js` |
| HTTP request streaming/pipe backpressure behavior is not fully Node-compatible | 1 | `parallel/test-pipe-file-to-http.js` |
| HTTP response serialization/header ordering differs from Node for first-chunk single-byte encodings | 1 | `parallel/test-http-outgoing-first-chunk-singlebyte-encoding.js` |
| HTTP server close/reopen ECONNREFUSED sequencing is not Node-compatible | 1 | `sequential/test-http-econnrefused.js` |
| HTTP server duplicate request-header coalescing for allowed/forbidden header sets is not Node-compatible | 1 | `parallel/test-http-server-multiheaders2.js` |
| HTTP server duplicate request-header coalescing/deduplication is not Node-compatible | 1 | `parallel/test-http-server-multiheaders.js` |
| HTTP server flood-prevention backpressure behavior (socket cork/uncork) is not Node-compatible | 1 | `parallel/test-http-pipeline-flood.js` |
| HTTP server incorrectly emits chunked terminator semantics for 204/304 responses | 1 | `parallel/test-http-chunked-304.js` |
| HTTP server parser does not emit Node-compatible HPE_HEADER_OVERFLOW/431 behavior for oversized headers | 1 | `parallel/test-http-header-overflow.js` |
| HTTP server socket.setEncoding('') error path (ERR_HTTP_SOCKET_ENCODING) is not Node-compatible | 1 | `parallel/test-http-socket-encoding-error.js` |
| HTTP/1.0 keep-alive client/server framing is not Node-compatible; consistently fails on CI even with retries | 1 | `parallel/test-http-1.0-keep-alive.js` |
| HTTP/1.0 keep-alive response connection-closing semantics are not Node-compatible | 1 | `parallel/test-http-wget.js` |
| Happy Eyeballs autoSelectFamily over custom dual-stack DNS is not wired through wasi:http transport | 1 | `parallel/test-http-autoselectfamily.js` |
| Host header generation ignores globalAgent.defaultPort and incorrectly includes the port | 1 | `parallel/test-http-default-port.js` |
| Host header generation/handling in node:http is not fully Node-compatible | 1 | `parallel/test-http-host-headers.js` |
| IncomingBody lifecycle on extra response data can trap in wasi:http integration | 1 | `parallel/test-http-extra-response.js` |
| IncomingMessage.destroy(err) close/errored state transitions are not Node-compatible | 1 | `parallel/test-http-client-incomingmessage-destroy.js` |
| IncomingMessage.setTimeout() does not schedule/emit response timeout events | 1 | `parallel/test-http-client-response-timeout.js` |
| Intl (including process.versions.tz expectations) is not available in current runtime | 1 | `parallel/test-tz-version.js` |
| Keep-alive request queue/release-before-finish semantics are incomplete | 1 | `parallel/test-http-client-keep-alive-release-before-finish.js` |
| MessageEvent.target/ports fields are incomplete | 1 | `parallel/test-worker-message-port.js#block_02_block_02` |
| MessagePort EventTarget API integration is incomplete | 1 | `parallel/test-worker-message-port.js#block_01_block_01` |
| MessagePort async delivery can recurse too aggressively and starve loop turn boundaries | 1 | `parallel/test-worker-message-port-infinite-message-loop.js` |
| MessagePort close callback behavior is not Node-compatible | 1 | `parallel/test-worker-message-port.js#block_00_block_00` |
| MessagePort close events are not emitted with Node-compatible timing/behavior | 1 | `parallel/test-worker-message-channel.js#block_01_block_01` |
| MessagePort does not reliably deliver queued messages when listeners are attached later | 1 | `parallel/test-worker-message-port.js#block_03_block_03` |
| MessagePort duplicate transfer entries report a generic non-transferable error | 1 | `parallel/test-worker-message-port-transfer-duplicate.js#block_00_block_00` |
| MessagePort listener queueing semantics are incomplete | 1 | `parallel/test-worker-message-port.js#block_04_block_04` |
| MessagePort prototype surface differs from Node.js | 1 | `parallel/test-worker-message-port.js#block_08_block_08` |
| MessagePort source-port transfer validation and DataCloneError message are not Node-compatible | 1 | `parallel/test-worker-message-port-transfer-self.js` |
| MessagePort transfer of closed/detached ports returns non-Node DataCloneError message/handling | 1 | `parallel/test-worker-message-port-transfer-closed.js` |
| MessagePort transfer-list DataCloneError details for detached ArrayBuffer are incomplete | 1 | `parallel/test-worker-message-port-arraybuffer.js` |
| MessagePort transfer-list handling does not support transferring nested MessagePort values | 1 | `parallel/test-worker-message-port-message-port-transferring.js` |
| MessagePort util.inspect output/shape is not Node-compatible | 1 | `parallel/test-worker-message-port-inspect-during-init-hook.js` |
| MessagePort/MessageChannel constructor error codes are not Node-compatible | 1 | `parallel/test-worker-message-port-constructor.js` |
| NODE_OPTIONS behavior via --env-file is incomplete in execPath child emulation | 1 | `parallel/test-dotenv-node-options.js` |
| NODE_V8_COVERAGE warning behavior in child_process execPath emulation is incomplete | 1 | `parallel/test-coverage-with-inspector-disabled.js` |
| OKP (Ed/X) key import/export compatibility is incomplete | 1 | `parallel/test-webcrypto-export-import-cfrg.js` |
| OutgoingMessage implicit Content-Length/Transfer-Encoding and Connection header behavior is not Node-compatible | 1 | `parallel/test-http-content-length.js` |
| OutgoingMessage.getHeaders() shape is not Node-compatible (null-prototype object expected) | 1 | `parallel/test-http-mutable-headers.js` |
| Overridden globalAgent socket bookkeeping (agent.sockets/close lifecycle) is not Node-compatible | 1 | `parallel/test-http-client-override-global-agent.js` |
| QuickJS stack frame formatting differs for Error objects whose name is a non-string object | 1 | `parallel/test-util-inspect.js#block_97_block_97` |
| RSA imported-key algorithm metadata compatibility is incomplete | 1 | `parallel/test-webcrypto-encrypt-decrypt-rsa.js` |
| RSA key import/export metadata compatibility is incomplete | 1 | `parallel/test-webcrypto-export-import-rsa.js` |
| RSA private-key parsing/signing path is incomplete (Failed to parse private key) | 1 | `parallel/test-crypto-sign-verify.js#block_12_block_12` |
| RSA sign/verify error mapping does not match Node | 1 | `parallel/test-webcrypto-sign-verify-rsa.js` |
| Readable async iterator pending next() resolution can hang on destroy/end paths | 1 | `parallel/test-stream-readable-async-iterators.js#block_05_block_05` |
| Readable unpipe()+resume() transform/end event flow is not fully Node-compatible | 1 | `parallel/test-stream-readable-unpipe-resume.js` |
| Readable.from() iterator close/return() semantics are incomplete | 1 | `parallel/test-readable-from-iterator-closing.js` |
| Readable.map()/reduce() lazy evaluation callback ordering differs from Node | 1 | `parallel/test-stream-reduce.js#block_02_block_02` |
| Readable.toWeb() with crypto randomBytes pressure can trap in web_crypto random_bytes | 1 | `parallel/test-stream-readable-to-web.js` |
| ReadableStream BYOB controller respond()/Buffer interaction is not fully WHATWG-compatible | 1 | `parallel/test-whatwg-readablebytestreambyob.js` |
| Request abort vs normal completion event ordering (aborted/error/end) is not Node-compatible | 1 | `parallel/test-http-client-spurious-aborted.js` |
| Request timeout behavior during response body transfer is not Node-compatible | 1 | `parallel/test-http-client-timeout-with-data.js` |
| Resolver timeout option validation and timeout behavior are incomplete | 1 | `parallel/test-dns-channel-timeout.js` |
| Resolver#setServers custom per-resolver DNS server routing is not implemented | 1 | `parallel/test-dns-multi-channel.js` |
| Resolver#setServers does not throw ERR_DNS_SET_SERVERS_FAILED while queries are pending | 1 | `parallel/test-dns-setserver-when-querying.js` |
| Resolver.cancel() behavior for in-flight reverse lookups is not implemented | 1 | `parallel/test-dns-cancel-reverse-lookup.js` |
| Resolver.cancel() for callback-based in-flight queries is not implemented | 1 | `parallel/test-dns-channel-cancel.js` |
| Resolver.cancel() for promise-based in-flight queries is not implemented | 1 | `parallel/test-dns-channel-cancel-promise.js` |
| Script.runInNewContext this-binding/type validation behavior does not match Node | 1 | `parallel/test-vm-new-script-new-context.js#block_07_block_07` |
| ServerResponse.addTrailers()/IncomingMessage.trailers behavior is incomplete | 1 | `parallel/test-http-set-trailers.js` |
| ServerResponse.end() repeated-call error/callback behavior is not Node-compatible | 1 | `parallel/test-http-outgoing-end-multiple.js` |
| ServerResponse.getHeaders() returns a plain object instead of a null-prototype object | 1 | `parallel/test-http-set-header-chain.js` |
| ServerResponse.writableLength byte accounting is not Node-compatible | 1 | `parallel/test-http-outgoing-properties.js#block_02_block_02` |
| ServerResponse.write() after end does not callback with ERR_STREAM_WRITE_AFTER_END | 1 | `parallel/test-http-server-write-after-end.js` |
| ServerResponse.write() after end does not follow Node-compatible ERR_STREAM_WRITE_AFTER_END behavior | 1 | `parallel/test-http-res-write-after-end.js` |
| ServerResponse.writeEarlyHints() argument validation is incomplete (missing expected ERR_INVALID_ARG_VALUE throws) | 1 | `parallel/test-http-early-hints-invalid-argument.js` |
| ServerResponse.writeHead() does not throw ERR_HTTP_TRAILER_INVALID when Trailer is set with Content-Length | 1 | `parallel/test-http-server-de-chunked-trailer.js` |
| SourceTextModule import.meta initialization hook is not implemented | 1 | `parallel/test-vm-module-import-meta.js` |
| SourceTextModule linker/dependency parsing semantics are incomplete (imports, cycles, and attributes) | 1 | `parallel/test-vm-module-link.js` |
| Timeout listener bookkeeping on keep-alive sockets is not Node-compatible | 1 | `parallel/test-http-client-timeout-option-listeners.js` |
| WASI UDP ping-pong over loopback does not reliably deliver datagrams in the local runtime despite Node-compatible hostname resolution | 1 | `sequential/test-dgram-pingpong.js` |
| WASM child emulation does not support --experimental-test-module-mocks CLI flag | 1 | `parallel/test-runner-module-mocking.js#test_11_node_modules_can_be_used_by_both_module_systems` |
| WASM child emulation does not support --experimental-test-module-mocks/--experimental-default-type flags | 1 | `parallel/test-runner-module-mocking.js#test_16_wrong_import_syntax_should_throw_error_after_module_mocking` |
| WASM child emulation does not support --no-experimental-sqlite CLI flag | 1 | `parallel/test-sqlite.js#test_00_accessing_the_node_sqlite_module` |
| WASM child emulation does not support --permission/--allow-worker/--experimental-test-module-mocks flags | 1 | `parallel/test-runner-module-mocking.js#test_18_should_work_when_allow_worker_is_passed_and_permission_model` |
| WASM child emulation does not support --permission/--experimental-test-module-mocks flags | 1 | `parallel/test-runner-module-mocking.js#test_17_should_throw_err_access_denied_when_permission_model_is_enab` |
| WASM child emulation does not support --test CLI flag | 1 | `parallel/test-runner-concurrency.js#test_03_test_multiple_files` |
| WASM child emulation does not support --test-reporter in spawnPromisified | 1 | `parallel/test-runner-root-duration.js` |
| WASM child emulation does not support Node.js --test CLI behavior | 1 | `parallel/test-runner-exit-code.js` |
| WASM child emulation does not support Node.js --test force-exit reporter behavior | 1 | `parallel/test-runner-force-exit-failure.js` |
| WASM child emulation does not support Node.js --test reporter CLI behavior | 1 | `parallel/test-runner-reporters.js` |
| WebAssembly global is missing in VM contexts | 1 | `parallel/test-vm-codegen.js#block_00_block_00` |
| WebCrypto AES-GCM short-ciphertext OperationError message does not match Node | 1 | `parallel/test-crypto-webcrypto-aes-decrypt-tag-too-small.js` |
| WebCrypto ECDH P-521 deriveBits is not implemented | 1 | `parallel/test-webcrypto-derivebits.js#block_00_test_ecdh_bit_derivation` |
| WebCrypto ECDH P-521 deriveKey/deriveBits is not implemented | 1 | `parallel/test-webcrypto-derivekey.js#block_00_test_ecdh_key_derivation` |
| WebCrypto X25519/X448 deriveBits is not implemented | 1 | `parallel/test-webcrypto-derivebits.js#block_03_test_x25519_and_x448_bit_derivation` |
| WebCrypto X25519/X448 deriveKey/deriveBits is not implemented | 1 | `parallel/test-webcrypto-derivekey.js#block_05_test_x25519_and_x448_key_derivation` |
| WebCrypto wrapKey()/unwrapKey usage validation and algorithm handling are incomplete | 1 | `parallel/test-webcrypto-wrap-unwrap.js` |
| Worker URL-scheme validation does not throw expected ERR_INVALID_URL_SCHEME | 1 | `parallel/test-worker-unsupported-path.js#block_02_block_02` |
| Worker constructor argument validation is not Node-compatible (missing ERR_INVALID_ARG_TYPE throws) | 1 | `parallel/test-worker-type-check.js` |
| Worker constructor argv option validation/stringification is not Node-compatible | 1 | `parallel/test-worker-process-argv.js` |
| Worker constructor does not enforce DataCloneError for unserializable workerData | 1 | `parallel/test-worker-invalid-workerdata.js` |
| Worker message delivery does not preserve SharedArrayBuffer shared-memory semantics | 1 | `parallel/test-worker-message-channel-sharedarraybuffer.js` |
| Worker options.env validation and env-isolation semantics are incomplete | 1 | `parallel/test-worker-process-env.js` |
| Worker path error-message wording for file:/data: wrapping guidance is not Node-compatible | 1 | `parallel/test-worker-unsupported-path.js#block_01_block_01` |
| Worker path validation does not throw expected ERR_WORKER_PATH/TypeError | 1 | `parallel/test-worker-unsupported-path.js#block_00_block_00` |
| Worker transferList ArrayBuffer detachment semantics are incomplete | 1 | `parallel/test-worker-workerdata-messageport.js#block_02_block_02` |
| Worker transferList missing-port DataCloneError is not enforced | 1 | `parallel/test-worker-workerdata-messageport.js#block_03_block_03` |
| X25519/X448 deriveBits vector compatibility is incomplete | 1 | `parallel/test-webcrypto-derivebits-cfrg.js` |
| X25519/X448 deriveKey compatibility is incomplete | 1 | `parallel/test-webcrypto-derivekey-cfrg.js` |
| addAbortListener lacks argument validation and already-aborted/stopImmediatePropagation handling | 1 | `parallel/test-events-add-abort-listener.mjs` |
| async handler rejection after partial body write does not follow Node-compatible close semantics | 1 | `parallel/test-http-server-capture-rejections.js#block_01_block_01` |
| async handler rejection after writeHead(200) does not emit expected ECONNRESET path | 1 | `parallel/test-http-server-capture-rejections.js#block_02_block_02` |
| async handler rejection before response commit does not produce Node-compatible 500 response lifecycle | 1 | `parallel/test-http-server-capture-rejections.js#block_00_block_00` |
| async_hooks HTTPINCOMINGMESSAGE/HTTPCLIENTREQUEST destroy lifecycle tracking is incomplete | 1 | `parallel/test-async-hooks-http-parser-destroy.js` |
| async_hooks Immediate resource tracking semantics are incomplete | 1 | `parallel/test-async-hooks-top-level-clearimmediate.js` |
| async_hooks argument/error validation for AsyncResource is incomplete | 1 | `parallel/test-async-hooks-asyncresource-constructor.js` |
| async_hooks callback invocation/error path behavior is incomplete | 1 | `parallel/test-async-hooks-fatal-error.js` |
| async_hooks destroy queue semantics are incomplete | 1 | `parallel/test-async-hooks-close-during-destroy.js` |
| async_hooks lifecycle events for microtasks are not implemented | 1 | `parallel/test-queue-microtask-uncaught-asynchooks.js` |
| async_hooks promise before/after tracking is incomplete | 1 | `parallel/test-async-hooks-enable-before-promise-resolve.js` |
| async_hooks promise executionAsyncId tracking is incomplete | 1 | `parallel/test-async-hooks-enable-disable-enable.js` |
| async_hooks promise hook switching behavior is incomplete | 1 | `parallel/test-async-hooks-correctly-switch-promise-hook.js` |
| async_hooks promise init resource/trigger tracking is incomplete | 1 | `parallel/test-async-hooks-promise.js` |
| async_hooks promise init/enable/disable tracking is incomplete | 1 | `parallel/test-async-hooks-promise-enable-disable.js` |
| async_hooks promise lifecycle/context propagation is incomplete | 1 | `parallel/test-async-hooks-async-await.js` |
| async_hooks promise triggerAsyncId tracking is incomplete | 1 | `parallel/test-async-hooks-promise-triggerid.js` |
| async_hooks runInAsyncScope triggerAsyncId stack behavior is incomplete | 1 | `parallel/test-async-hooks-recursive-stack-runInAsyncScope.js` |
| captureRejections propagation from outgoing-message drain to socket/request errors is not Node-compatible | 1 | `parallel/test-http-outgoing-message-capture-rejection.js#block_00_block_00` |
| checkContinue/write callback ordering and completion semantics are incomplete | 1 | `parallel/test-http-write-callbacks.js` |
| child_process -p/process.title behavior is incomplete in WASM child emulation | 1 | `sequential/test-process-title.js` |
| child_process exec/spawn emulation does not fully match --help process behavior | 1 | `parallel/test-cli-node-print-help.js` |
| child_process execPath emulation does not honor --allow-addons/node-addons resolution | 1 | `parallel/test-permission-allow-addons-cli.js` |
| child_process execPath emulation does not implement --completion-bash output | 1 | `parallel/test-bash-completion.js` |
| child_process execPath emulation does not implement --experimental-print-required-tla diagnostics output | 1 | `es-module/test-require-module-tla.js#block_01_block_01` |
| child_process execPath emulation does not yet match Node CLI argument validation/exit codes | 1 | `parallel/test-cli-bad-options.js` |
| child_process execPath emulation does not yet support this ESM/CJS fixture runner path; direct CJS named export interop is covered by test-require-module.js | 1 | `es-module/test-esm-cjs-exports.js` |
| child_process execPath emulation has incomplete --require preload/argv handling | 1 | `parallel/test-preload-print-process-argv.js` |
| child_process execPath emulation lacks full --import/--require preload semantics | 1 | `es-module/test-require-module-preload.js` |
| child_process execPath emulation lacks full NODE_OPTIONS and CLI flag semantics | 1 | `parallel/test-cli-node-options.js` |
| child_process fork IPC/stdout stream behavior is incomplete | 1 | `parallel/test-process-external-stdio-close.js` |
| child_process spawn IPC/stdout stream behavior is incomplete | 1 | `parallel/test-process-external-stdio-close-spawn.js` |
| child_process spawn stdio/event behavior is incomplete in execPath emulation | 1 | `parallel/test-tracing-no-crash.js` |
| child_process spawnSync does not preserve stdout for symlinked execPath runs | 1 | `parallel/test-process-execpath.js` |
| child_process stdio pipe lifecycle/destroy semantics are incomplete | 1 | `parallel/test-stdio-undestroy.js` |
| child_process.exec does not expose live stderr/stdout streams on ChildProcess | 1 | `parallel/test-stdout-close-catch.js` |
| child_process.exec shell pipeline/stdin-stdout behavior is incomplete in WASM child emulation | 1 | `parallel/test-stream-pipeline-process.js` |
| child_process.spawnSync(process.execPath, ...) inline runner has cwd/module-resolution mismatches for relative test scripts | 1 | `parallel/test-http-debug.js` |
| client does not emit information event for 100 Continue on custom createConnection streams | 1 | `parallel/test-http-parser-multiple-execute.js` |
| clientError does not expose Node-compatible parse error details (missing code HPE_INVALID_TRANSFER_ENCODING) | 1 | `parallel/test-http-invalid-te.js` |
| codeGeneration.wasm enforcement is incomplete and WebAssembly is unavailable in the context | 1 | `parallel/test-vm-codegen.js#block_02_block_02` |
| common shim is missing ../common/fixtures.mjs and child_process execPath emulation does not fully support the ESM CLI modes this test exercises (--input-type/--import) | 1 | `es-module/test-esm-import-meta-resolve.mjs` |
| common-shim expectWarning() behavior is not implemented | 1 | `parallel/test-common-expect-warning.js` |
| common-shim mustCall/countdown failure output differs from Node in child-process emulation | 1 | `parallel/test-common-countdown.js` |
| common-shim mustNotCall() error formatting differs from Node's test harness | 1 | `parallel/test-common-must-not-call.js` |
| common-shim onGC() is a no-op; GC callback tracking is not implemented | 1 | `parallel/test-common-gc.js#block_00_block_00` |
| common-shim onGC() is a no-op; HTTP server GC leak checks cannot be observed | 1 | `parallel/test-http-server-connections-checking-leak.js` |
| common-shim onGC() is a no-op; keep-alive request GC verification cannot be observed | 1 | `parallel/test-http-server-keepalive-req-gc.js` |
| common-shim spawnPromisified child emulation does not support --no-experimental-require-module | 1 | `es-module/test-cjs-esm-warn.js` |
| common.canCreateSymLink shim always returns false, so symlink dirent test is skipped | 1 | `parallel/test-fs-readdir-types-symlinks.js` |
| common.spawnPromisified shim does not support --permission CLI flag | 1 | `parallel/test-permission-sqlite-load-extension.js` |
| common/gc onGC callback tracking is not implemented in the WASM test shim | 1 | `parallel/test-primitive-timer-leak.js` |
| console.* does not publish diagnostics_channel events yet | 1 | `parallel/test-console-diagnostics-channels.js` |
| contextCodeGeneration/codeGeneration options do not block string eval with the expected EvalError | 1 | `parallel/test-vm-codegen.js#block_01_block_01` |
| contextified assignment semantics for strict/non-strict writes to non-writable globals are incorrect | 1 | `parallel/test-vm-strict-assign.js` |
| contextified global proxy identity/property fallback semantics are incomplete | 1 | `parallel/test-vm-property-not-on-sandbox.js` |
| createContext does not preserve non-enumerable/non-writable sandbox property descriptors | 1 | `parallel/test-vm-preserves-property.js` |
| createContext incorrectly triggers Proxy getOwnPropertyDescriptor traps | 1 | `parallel/test-vm-proxy-failure-CP.js` |
| custom ESM loader hooks (--experimental-loader) and assertionless JSON import behavior are not implemented | 1 | `es-module/test-esm-assertionless-json-import.js` |
| decoding empty-passphrase encrypted PEM traps in the WASM crypto backend | 1 | `parallel/test-crypto-keygen-empty-passphrase-no-prompt.js` |
| deep async recursion intended to exercise V8 stack recovery can trap the QuickJS/WASM runtime before JavaScript can catch and log the RangeError | 1 | `parallel/test-ttywrap-stack.js` |
| default clientError path does not send/close with Node-compatible 400 Bad Request behavior | 1 | `parallel/test-http-server-destroy-socket-on-client-error.js` |
| defining global accessor properties in vm contexts does not round-trip to the sandbox correctly | 1 | `parallel/test-vm-global-define-property.js` |
| depends on WebCrypto ECDH P-521 deriveKey support | 1 | `parallel/test-webcrypto-derivekey.js#block_03_test_default_key_lengths` |
| destroying zlib Transform with in-flight pipe data has callback/event ordering differences | 1 | `parallel/test-zlib-destroy-pipe.js` |
| dgram bind path does not invoke default dns.lookup | 1 | `parallel/test-dgram-custom-lookup.js#block_01_block_01` |
| dgram bind path does not invoke the custom options.lookup callback | 1 | `parallel/test-dgram-custom-lookup.js#block_00_block_00` |
| dgram close() callback-argument ignoring / close-event timing is incomplete | 1 | `parallel/test-dgram-close-is-not-callback.js` |
| dgram close-before-lookup race handling is incomplete | 1 | `parallel/test-dgram-bind-socket-close-before-lookup.js` |
| dgram does not validate options.lookup type | 1 | `parallel/test-dgram-custom-lookup.js#block_02_block_02` |
| dgram implementation incomplete | 1 | `parallel/test-dgram-oob-buffer.js` |
| dgram listening->close event sequencing is incomplete | 1 | `parallel/test-dgram-close-in-listening.js` |
| dgram reusePort handling is incomplete and support probing can hang | 1 | `parallel/test-dgram-reuseport.js` |
| dgram send callback does not return bytes length correctly (and can hang) | 1 | `parallel/test-dgram-bytes-length.js` |
| dgram send() address argument validation is incomplete for non-string values | 1 | `parallel/test-dgram-send-address-types.js` |
| dgram send() does not surface EMSGSIZE callback error details correctly | 1 | `parallel/test-dgram-msgsize.js` |
| dgram unref() is effectively a no-op for bound UDP sockets | 1 | `parallel/test-dgram-unref.js#block_00_block_00` |
| diagnostics_channel integration for dgram udp.socket events is missing | 1 | `parallel/test-diagnostics-channel-udp.js` |
| diagnostics_channel integration for http events is incomplete | 1 | `parallel/test-diagnostics-channel-http.js` |
| diagnostics_channel integration for http.server.* events is incomplete | 1 | `parallel/test-diagnostics-channel-http-server-start.js` |
| diagnostics_channel integration for net events is incomplete | 1 | `parallel/test-diagnostics-channel-net.js` |
| diagnostics_channel integration for worker_threads events is missing in the worker shim | 1 | `parallel/test-diagnostics-channel-worker-threads.js` |
| diagnostics_channel runStores transformer-error propagation is incomplete | 1 | `parallel/test-diagnostics-channel-bind-store.js` |
| diagnostics_channel subscriber-throw path does not surface uncaughtException handling like Node.js | 1 | `parallel/test-diagnostics-channel-safe-subscriber-errors.js` |
| dns perf_hooks integration not implemented | 1 | `parallel/test-dns-perf_hooks.js` |
| dns.promises.lookupService is not implemented (returns ENOTIMP) | 1 | `parallel/test-dns-lookupService-promises.js` |
| domain error propagation across node:http server/client callbacks is incomplete | 1 | `parallel/test-domain-multi.js` |
| domain error/nextTick behavior depends on async_hooks semantics that are incomplete | 1 | `sequential/test-next-tick-error-spin.js` |
| domain implicit binding across nested fs/timer callback chains is incomplete | 1 | `parallel/test-domain-implicit-fs.js` |
| domain implicit binding across nextTick/timers/fs callbacks is incomplete | 1 | `parallel/test-domain-implicit-binding.js` |
| domain integration with node:http server/client async error handling is incomplete | 1 | `parallel/test-domain-http-server.js` |
| domain/async_hooks integration for AsyncResource domain tracking and async-id map behavior is incomplete | 1 | `parallel/test-domain-async-id-map-leak.js` |
| dotenv CLI --env-file parsing is incomplete | 1 | `parallel/test-dotenv.js` |
| dotenv CLI flags are incomplete in execPath child emulation | 1 | `parallel/test-dotenv-edge-cases.js` |
| duplicate Set-Cookie response header handling/lifecycle is not fully Node-compatible | 1 | `parallel/test-http-set-cookies.js` |
| dynamic import callback handling does not correctly support module namespace return values | 1 | `parallel/test-vm-module-dynamic-namespace.js` |
| emulated child_process inline eval does not keep the child alive for dynamic import() resolution | 1 | `parallel/test-runner-import-no-scheme.js` |
| events.EventEmitterAsyncResource API and ERR_INVALID_THIS branding are incomplete | 1 | `parallel/test-eventemitter-asyncresource.js` |
| events.once() with EventTarget does not handle sequential waits correctly | 1 | `parallel/test-eventtarget-once-twice.js` |
| exceptions thrown in client response callbacks do not follow Node uncaughtException flow | 1 | `parallel/test-http-uncaught-from-request-callback.js` |
| execFile() does not expose child.stdout/child.stderr streams for encoding:null | 1 | `parallel/test-child-process-execfile-maxbuf.js#block_07_block_07` |
| execFile() signal option type validation is incomplete (missing ERR_INVALID_ARG_TYPE) | 1 | `parallel/test-child-process-execfile.js#block_05_block_05` |
| execFile/execFileSync emulation does not execute non-execPath commands like echo | 1 | `parallel/test-child-process-execfile.js#block_07_verify_the_execfile_stdout_is_the_same_as_execfilesync` |
| execFileSync default maxBuffer overflow behavior is not Node-compatible | 1 | `parallel/test-child-process-execfilesync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024` |
| execFileSync maxBuffer overflow ENOBUFS error semantics are not implemented | 1 | `parallel/test-child-process-execfilesync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed` |
| execPath child emulation does not support --trace-atomics-wait CLI behavior | 1 | `parallel/test-trace-atomic-deprecation.js` |
| execPath child-process emulation runs recursive async stack-overflow tests in-process, which can trap the WASM runtime instead of isolating the child stack | 1 | `parallel/test-async-wrap-pop-id-during-load.js` |
| execSync is ENOSYS-stubbed in WASM child_process emulation | 1 | `parallel/test-child-process-execsync-maxbuf.js#block_01_verify_that_a_maxbuffer_size_of_infinity_works` |
| execSync is ENOSYS-stubbed; default maxBuffer behavior is unimplemented | 1 | `parallel/test-child-process-execsync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024` |
| execSync is ENOSYS-stubbed; maxBuffer overflow ENOBUFS behavior is unimplemented | 1 | `parallel/test-child-process-execsync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed` |
| fork() IPC child.send/process.send emulation is not implemented | 1 | `parallel/test-cli-eval.js#block_03_regression_test_for_https_github_com_nodejs_node_issues_1194` |
| fork() abort-listener lifecycle for timeout+signal is incomplete | 1 | `parallel/test-child-process-fork-timeout-kill-signal.js#block_03_block_03` |
| fork() args/options parsing and ERR_INVALID_ARG_TYPE behavior are incomplete | 1 | `parallel/test-child-process-fork-args.js#block_01_correctly_if_args_is_undefined_or_null` |
| fork() argument type validation is not Node-compatible | 1 | `parallel/test-child-process-fork-args.js#block_00_and_be_of_type_string` |
| fork() child output/event-loop lifetime is incomplete in execPath eval emulation | 1 | `parallel/test-cli-eval.js#block_01_regression_test_for_https_github_com_nodejs_node_issues_3574` |
| fork() third-argument validation is not Node-compatible | 1 | `parallel/test-child-process-fork-args.js#block_02_ensure_that_the_third_argument_should_be_type_of_object_if_p` |
| fork() timeout option validation is incomplete | 1 | `parallel/test-child-process-fork-timeout-kill-signal.js#block_02_block_02` |
| forked child emulation does not honor --redirect-warnings | 1 | `parallel/test-process-redirect-warnings.js` |
| forked child emulation does not honor NODE_REDIRECT_WARNINGS | 1 | `parallel/test-process-redirect-warnings-env.js` |
| fs permission coverage tables are out of sync with exposed fs API surface | 1 | `parallel/test-permission-fs-supported.js` |
| fs symlink permission checks are incomplete | 1 | `parallel/test-permission-fs-symlink-relative.js` |
| fs.constants includes Linux-only O_NOATIME even when common.isLinux is false in WASM | 1 | `parallel/test-process-constants-noatime.js` |
| fs.globSync API is not implemented | 1 | `parallel/test-icu-env.js` |
| fs.watch directory watcher filename/null and event delivery semantics are not Node-compatible | 1 | `sequential/test-fs-watch.js#block_02_block_02` |
| fs.watch emits duplicate change events for a single write | 1 | `sequential/test-fs-watch.js#block_00_block_00` |
| fs.watch path watcher emits duplicate change events | 1 | `sequential/test-fs-watch.js#block_01_block_01` |
| fs.watchFile polling/change notifications can hang | 1 | `parallel/test-fs-watchfile.js` |
| fs.writeFile(fd, ...) on read-only descriptor does not callback with EBADF | 1 | `parallel/test-fs-writefile-with-fd.js#block_02_test_read_only_file_descriptor` |
| fs.writeFileSync accepts invalid data types instead of ERR_INVALID_ARG_TYPE | 1 | `parallel/test-fs-write-file-sync.js#block_05_test_writefilesync_with_an_invalid_input` |
| fs/promises FileHandle.readableWebStream support is missing or incomplete | 1 | `parallel/test-filehandle-readablestream.js` |
| function declaration/global binding semantics in vm contexts are incomplete | 1 | `parallel/test-vm-function-declaration.js` |
| function declarations are not persisted correctly across vm.runInContext calls | 1 | `parallel/test-vm-function-redefinition.js` |
| global performance object lacks Node perf_hooks API surface | 1 | `parallel/test-performance-global.js` |
| global process/Buffer accessor setter semantics are incomplete | 1 | `parallel/test-global-setters.js` |
| global property descriptor/interceptor behavior in vm contexts is incomplete | 1 | `parallel/test-vm-global-property-interceptors.js` |
| global web streams and node:stream/web exports are inconsistent | 1 | `parallel/test-global-webstreams.js` |
| globalThis shape differs from Node.js | 1 | `parallel/test-global.js` |
| half-open/pipelined HTTP/1.1 server behavior is not fully Node-compatible | 1 | `parallel/test-http-server.js` |
| hidden TextDecoder inspect output exposes Node/V8 internal decoder handles that are not represented in this runtime | 1 | `parallel/test-whatwg-encoding-custom-textdecoder.js#block_05_test_textdecoder_inspect_with_hidden_fields` |
| http client request lifecycle can hang in method-token validation scenario | 1 | `parallel/test-http-client-check-http-token.js` |
| http.Agent keepAlive maxSockets/maxFreeSockets pooling semantics are not Node-compatible | 1 | `sequential/test-http-keepalive-maxsockets.js` |
| http.Agent maxSockets enforcement and abort lifecycle can hang | 1 | `parallel/test-http-agent-maxsockets-respected.js` |
| http.Agent maxSockets queueing/release behavior stalls under concurrent requests | 1 | `parallel/test-http-max-sockets.js` |
| http.Agent maxTotalSockets bookkeeping is not Node-compatible | 1 | `parallel/test-http-agent-maxtotalsockets.js` |
| http.Agent socket bookkeeping/close cleanup is not Node-compatible | 1 | `parallel/test-http-client-agent.js` |
| http.IncomingMessage internal _addHeaderLines helper is not implemented | 1 | `parallel/test-set-incoming-message-header.js#block_02_addheaderlines_function_set_a_header_correctly` |
| http.Server({ ServerResponse }) custom response class option is not fully supported | 1 | `parallel/test-http-server-options-server-response.js` |
| http.createServer({ IncomingMessage }) custom request class option is not fully supported | 1 | `parallel/test-http-server-options-incoming-message.js` |
| http.get({ createConnection }) callback/return-value and async error propagation semantics are incomplete | 1 | `parallel/test-http-createConnection.js` |
| http.request host header formatting for IPv6 literals is incorrect (missing [::1]:port form) | 1 | `parallel/test-http-host-header-ipv6-fail.js` |
| https socket lifecycle/unref semantics over wasi:http are incomplete | 1 | `parallel/test-https-agent-unref-socket.js` |
| importModuleDynamically callback and error semantics are incomplete for vm.Script and vm.SourceTextModule | 1 | `parallel/test-vm-module-dynamic-import.js` |
| importing scrypt-encrypted PKCS#8 keys traps in the WASM crypto backend | 1 | `parallel/test-crypto-key-objects.js#block_05_block_05` |
| indexed property definitions on vm globals do not propagate to the sandbox | 1 | `parallel/test-vm-indexed-properties.js` |
| inherited: Resolver#setLocalAddress validation/error behavior is not implemented | 1 | `parallel/test-dns-setlocaladdress.js#block_01_verify_that_setlocaladdress_throws_if_called_with_an_invalid` |
| invalid EC private keys do not raise Node-compatible DataError | 1 | `parallel/test-webcrypto-export-import-ec.js#block_01_bad_private_keys` |
| invalid repeated Transfer-Encoding handling differs from Node | 1 | `parallel/test-http-transfer-encoding-repeated-chunked.js` |
| keep-alive free-socket lifecycle (free event + req.destroyed transitions) is not Node-compatible | 1 | `parallel/test-http-keepalive-free.js` |
| keep-alive request sequencing with unread request bodies has non-Node lifecycle behavior | 1 | `parallel/test-http-no-read-no-dump.js` |
| keep-alive socket reuse plus drain/backpressure behavior for corked responses is not Node-compatible | 1 | `parallel/test-http-outgoing-end-cork.js` |
| keep-alive socket timeout/reuse race handling is not Node-compatible | 1 | `parallel/test-http-keep-alive-timeout-race-condition.js` |
| large raw pipelined request load (10k) exhausts current WASM/runtime resources | 1 | `parallel/test-http-pipeline-requests-connection-leak.js` |
| legacy punycode builtin is not wired into CommonJS module resolution | 1 | `parallel/test-punycode.js` |
| maxRequestsPerSocket keep-alive header behavior (Keep-Alive/Connection framing) is not Node-compatible | 1 | `parallel/test-http-keep-alive-max-requests.js` |
| missing importModuleDynamically callback does not raise ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING | 1 | `parallel/test-vm-no-dynamic-import-callback.js` |
| mixed headersTimeout/requestTimeout handling is not Node-compatible | 1 | `sequential/test-http-server-request-timeouts-mixed.js` |
| module cache behavior with circular symlinked dependencies is not Node-compatible | 1 | `parallel/test-module-circular-symlinks.js` |
| moveMessagePortToContext cross-context object/prototype semantics are incomplete | 1 | `parallel/test-worker-message-port-move.js` |
| native rquickjs URL accessors report Rust conversion errors for invalid receivers before JS can normalize them to V8/Web IDL private-member messages | 1 | `parallel/test-whatwg-url-invalidthis.js` |
| native rquickjs URL class property enumeration order does not match Web IDL order and descriptors are not fully configurable from JS | 1 | `parallel/test-whatwg-url-custom-properties.js` |
| net reusePort listen option/support probing is incomplete | 1 | `parallel/test-net-reuseport.js` |
| net write backpressure/drain handling for repeated large Buffer writes can hang in the WASM socket implementation | 1 | `parallel/test-net-write-fully-async-buffer.js` |
| net.BlockList with autoSelectFamily and multiple lookup addresses does not yet raise ERR_IP_BLOCKED before connection attempts | 1 | `parallel/test-net-blocklist.js#block_03_connect_with_autoselectfamily_and_multiple_ips` |
| net.Server blockList enforcement is incomplete | 1 | `parallel/test-net-server-blocklist.js` |
| net.Server captureRejections async error propagation is incomplete | 1 | `parallel/test-net-server-capture-rejection.js` |
| node-compat runner drainAsync() relies on global setTimeout after this test deletes timer globals | 1 | `parallel/test-timers-api-refs.js` |
| node:http abort/destroy response lifecycle (aborted/error/close ordering) is incomplete | 1 | `parallel/test-http-abort-client.js` |
| node:http client path does not honor/verify net.Socket connect noDelay semantics like Node | 1 | `parallel/test-http-nodelay.js` |
| node:http client socketPath flow used by this domain test is incomplete (request/response never completes) | 1 | `parallel/test-http-client-response-domain.js` |
| node:http client socketPath transport flow is incomplete (unix-socket request hangs) | 1 | `parallel/test-http-client-pipe-end.js` |
| node:https Agent constructor compatibility is incomplete (call without new) | 1 | `parallel/test-https-agent-constructor.js` |
| node:https Agent#getName TLS option keying is incomplete | 1 | `parallel/test-https-agent-getname.js` |
| node:module.findPackageJSON API behavior is incomplete | 1 | `parallel/test-find-package-json.js` |
| node:sqlite applyChangeset conflict-resolution behavior is incomplete | 1 | `parallel/test-sqlite-session.js#test_05_conflict_resolution` |
| node:sqlite rejects mixed named+positional parameters where Node accepts them | 1 | `parallel/test-sqlite-statement-sync.js#test_06_statementsync_prototype_expandedsql` |
| node:test mock timers Date behavior is incomplete | 1 | `parallel/test-runner-mock-timers-date.js` |
| node:test mock timers scheduler.wait behavior is incomplete | 1 | `parallel/test-runner-mock-timers-scheduler.js` |
| node:test standalone runner output/cancellation summary differs in WASM child emulation | 1 | `parallel/test-runner-misc.js` |
| node:test t.assert.fileSnapshot validation behavior is incomplete | 1 | `parallel/test-runner-snapshot-file-tests.js#test_00_t_assert_filesnapshot_validation` |
| node:test t.assert.ok does not preserve Node-compatible assertion stack formatting | 1 | `parallel/test-runner-assert.js#test_01_t_assert_ok_correctly_parses_the_stacktrace` |
| node:vm does not yet support importModuleDynamically/SyntheticModule semantics used by this dynamic import lifetime test | 1 | `es-module/test-dynamic-import-script-lifetime.js` |
| node_compat harness copies only the target test file, so required sibling ./test-tls-destroy-stream.js is missing | 1 | `parallel/test-tls-destroy-stream-12.js` |
| node_compat harness copies only the target test file, so required sibling ./test-tls-net-socket-keepalive.js is missing | 1 | `parallel/test-tls-net-socket-keepalive-12.js` |
| node_compat harness does not provide ../common/shared-lib-util for this test setup | 1 | `parallel/test-module-loading-globalpaths.js` |
| node_compat test fixture module ../common/process-exit-code-cases is not resolved in this runtime | 1 | `parallel/test-process-exit-code.js` |
| non-writable global property semantics in vm contexts are incomplete | 1 | `parallel/test-vm-global-non-writable-properties.js` |
| options.agent validation/lifecycle is not fully Node-compatible | 1 | `parallel/test-http-client-reject-unexpected-agent.js` |
| passive listener semantics are incomplete (test currently self-skips) | 1 | `parallel/test-whatwg-events-add-event-listener-options-passive.js#block_01_block_01` |
| per-context Symbol/global binding behavior is incomplete in vm contexts | 1 | `parallel/test-vm-harmony-symbols.js` |
| perf_hooks HTTP PerformanceEntry emission/detail fields are incomplete | 1 | `parallel/test-http-perf_hooks.js` |
| perf_hooks nodeTiming milestones/duration semantics are incomplete | 1 | `parallel/test-performance-nodetiming.js` |
| perf_hooks nodeTiming.uvMetricsInfo is missing | 1 | `parallel/test-performance-nodetiming-uvmetricsinfo.js` |
| perf_hooks performance.toJSON() does not expose nodeTiming yet | 1 | `parallel/test-tojson-perf_hooks.js` |
| performance.timerify function entries are not implemented | 1 | `parallel/test-performance-function-async.js` |
| permission mode does not yet honor --allow-addons/node-addons export-condition semantics | 1 | `parallel/test-permission-no-addons.js` |
| permission security-warning emission for --allow-* flags is incomplete | 1 | `parallel/test-permission-warning-flags.js` |
| pipe/net edge case | 1 | `parallel/test-pipe-writev.js` |
| pipelined responses with forced socket destroy trigger unhandled readable-stream rejection | 1 | `parallel/test-http-many-ended-pipelines.js` |
| postMessage function cloning should throw DataCloneError | 1 | `parallel/test-worker-message-port-transfer-native.js#block_00_block_00` |
| postMessage transferList argument validation is not Node-compatible yet | 1 | `parallel/test-worker-message-port.js#block_05_block_05` |
| posting a port to its target and channel-loss warning semantics are incomplete | 1 | `parallel/test-worker-message-port-transfer-target.js` |
| preload module handling edge case | 1 | `parallel/test-preload-self-referential.js` |
| process 'multipleResolves' event semantics are not implemented | 1 | `parallel/test-promise-swallowed-event.js` |
| process object tagging differs from Node (Object.prototype.toString.call(process)) | 1 | `parallel/test-vm-basic.js#block_02_vm_runinthiscontext` |
| process prototype chain is not fully Node-compatible (prototype is not EventEmitter-based) | 1 | `parallel/test-process-prototype.js` |
| process uncaughtException handling inside http client callbacks is incomplete | 1 | `parallel/test-http-catch-uncaughtexception.js` |
| process unhandledRejection/warning semantics are incomplete | 1 | `parallel/test-promise-handled-rejection-no-warning.js` |
| process.assert() is not implemented | 1 | `parallel/test-process-assert.js` |
| process.env defaults are incomplete (PATH is missing in VM context) | 1 | `parallel/test-vm-access-process-env.js` |
| process.exitCode validation and coercion semantics are incomplete | 1 | `parallel/test-process-exit-code-validation.js` |
| process.loadEnvFile() behavior is incomplete | 1 | `parallel/test-process-load-env-file.js` |
| process.on('uncaughtException') handling during top-level module errors is incomplete | 1 | `parallel/test-exception-handler2.js` |
| process.ppid is stubbed and not wired to parent process IDs | 1 | `parallel/test-process-ppid.js` |
| process.ref()/process.unref() are not implemented | 1 | `parallel/test-process-ref-unref.js` |
| process.resourceUsage() is not implemented | 1 | `parallel/test-resource-usage.js` |
| process.seteuid()/process.setegid() are stubbed and do not mutate credentials | 1 | `parallel/test-process-euid-egid.js` |
| process.setuid()/process.setgid() are stubbed and do not mutate credentials | 1 | `parallel/test-process-uid-gid.js` |
| process.stdin.destroy() is not implemented | 1 | `parallel/test-net-listen-after-destroying-stdin.js` |
| process.stdout is not yet a full stream.Writable implementation | 1 | `parallel/test-stdout-pipeline-destroy.js` |
| rawHeaders/rawTrailers casing and duplicate-header preservation differ from Node semantics | 1 | `parallel/test-http-raw-headers.js` |
| rawHeaders/rawTrailers duplicate-header ordering and casing are not Node-compatible | 1 | `parallel/test-http-multiple-headers.js` |
| receiveBlockList filtering/close behavior is incomplete | 1 | `parallel/test-dgram-blocklist.js#block_02_block_02` |
| receiveMessageOnPort() behavior and argument validation are not implemented | 1 | `parallel/test-worker-message-port-receive-message.js` |
| removing hop-by-hop/framing headers is not serialized with Node-compatible behavior | 1 | `parallel/test-http-remove-header-stays-removed.js` |
| req.connection.setTimeout timeout/error flow on server-side connections is incomplete | 1 | `parallel/test-http-set-timeout.js` |
| req.destroy() on server-side IncomingMessage does not propagate Node-compatible ECONNRESET client behavior | 1 | `parallel/test-http-server-incomingmessage-destroy.js` |
| req.setTimeout() handling for actively consumed request bodies is not Node-compatible | 1 | `parallel/test-http-server-consumed-timeout.js` |
| request auto-dump/resume when response ends early is incomplete, causing the request/response lifecycle to hang | 1 | `parallel/test-http-dump-req-when-res-ends.js` |
| request drain captureRejections path hangs when request is never finalized with end() under wasi:http | 1 | `parallel/test-http-outgoing-message-capture-rejection.js#block_01_block_01` |
| request header population/normalization (for example Accept) is incomplete | 1 | `parallel/test-http.js` |
| request/response pause-resume flow control does not complete with Node-compatible behavior | 1 | `parallel/test-http-pause.js` |
| requires ERR_INVALID_ARG_TYPE validation on resolve methods (not yet implemented) | 1 | `parallel/test-dns-resolvens-typeerror.js` |
| requires HTTP server functionality, we only support clients | 1 | `parallel/test-diagnostic-channel-http-response-created.js` |
| requires Intl/timezone data support that is not available in the current runtime | 1 | `parallel/test-datetime-change-notify.js` |
| requires V8-style GC/finalization behavior for rapidly churned HTTP client requests; current QuickJS/WASM runtime does not collect all watched request objects reliably | 1 | `parallel/test-gc-http-client-connaborted.js` |
| requires V8-style GC/finalization behavior for rapidly churned net sockets with timeouts; current QuickJS/WASM runtime does not collect all watched socket objects reliably | 1 | `parallel/test-gc-net-timeout.js` |
| requires actual TCP socket reuse with remotePort identity tracking via server; wasi:http creates new connections per request | 1 | `parallel/test-http-agent-scheduling.js` |
| requires createConnection to forward keepAlive/keepAliveInitialDelay options; wasi:http does not use Agent.createConnection for outbound requests | 1 | `parallel/test-http-agent-keepalive-delay.js` |
| requires fd option for listen | 1 | `parallel/test-net-listen-fd0.js` |
| requires net.createServer with pauseOnConnect and socket.localPort; wasi:http does not expose socket-level properties | 1 | `parallel/test-http-agent-reuse-drained-socket-only.js` |
| requires onread option with buffer/callback | 1 | `parallel/test-net-onread-static-buffer.js` |
| requires raw TCP response with obsolete HTTP line-folded headers; wasi:http rejects them | 1 | `parallel/test-http-multi-line-headers.js` |
| requires remote server close detection on idle keep-alive sockets and socket hang up errors; wasi:http creates independent connections per request with no shared socket lifecycle | 1 | `parallel/test-http-agent-keepalive.js` |
| response writable state around aborted proxy close is not Node-compatible | 1 | `parallel/test-http-writable-true-after-close.js` |
| response write + socket-error path does not preserve the expected truncated raw HTTP ending | 1 | `parallel/test-http-header-badrequest.js` |
| runInContext does not preserve symbol/prototype property access on contextified objects | 1 | `parallel/test-vm-symbols.js` |
| runInNewContext assignment with Proxy sandbox does not match Node trap behavior | 1 | `parallel/test-vm-set-property-proxy.js` |
| runInNewContext does not propagate global writes back to the sandbox correctly | 1 | `parallel/test-vm-new-script-new-context.js#block_04_block_04` |
| runInNewContext own-vs-inherited property assignment semantics are incomplete | 1 | `parallel/test-vm-inherited_properties.js` |
| runInNewContext sandbox binding and write-back semantics are incomplete | 1 | `parallel/test-vm-run-in-new-context.js` |
| runInThisContext/runInContext sloppy-mode var/delete semantics are incorrect | 1 | `parallel/test-vm-not-strict.js` |
| same-component node:http client->server calls via wasi:http can deadlock in this scenario | 1 | `parallel/test-http-write-head-after-set-header.js` |
| sendBlockList connect path can crash in WASI UDP implementation | 1 | `parallel/test-dgram-blocklist.js#block_00_block_00` |
| sendBlockList send() callback path is not Node-compatible and can hang | 1 | `parallel/test-dgram-blocklist.js#block_01_block_01` |
| sequential path is stale in vendored suite; equivalent Upgrade timeout-disabling semantics are not Node-compatible | 1 | `sequential/test-http-server-request-timeout-upgrade.js` |
| sequential path is stale in vendored suite; equivalent maxSockets queueing/release behavior is not Node-compatible | 1 | `sequential/test-http-max-sockets.js` |
| sequential path is stale in vendored suite; equivalent server.requestTimeout keep-alive handling is not Node-compatible | 1 | `sequential/test-http-server-request-timeout-keepalive.js` |
| sequential path is stale in vendored suite; equivalent server.requestTimeout pipelining handling is not Node-compatible | 1 | `sequential/test-http-server-request-timeout-pipelining.js` |
| server listen/close race with async DNS lookup is not Node-compatible | 1 | `parallel/test-net-server-close-before-calling-lookup-callback.js` |
| server option insecureHTTPParser:true is ignored for incoming invalid headers | 1 | `parallel/test-http-insecure-parser-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header` |
| server option maxHeaderSize is ignored for incoming oversized headers | 1 | `parallel/test-http-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other` |
| server parser accepts malformed chunk framing smuggling payloads instead of rejecting with 400/clientError | 1 | `parallel/test-http-dummy-characters-smuggling.js#block_01_block_01` |
| server parser does not emit Node-compatible clientError (HPE_INVALID_EOF_STATE) on truncated headers | 1 | `parallel/test-http-parser-finish-error.js` |
| server-side Upgrade event/error propagation is incomplete | 1 | `parallel/test-http-upgrade-server2.js` |
| server.close() idle-socket shutdown semantics differ from Node (idle connection is not closed as expected) | 1 | `parallel/test-http-server-close-idle.js` |
| server.closeAllConnections() does not close active and idle HTTP sockets with Node-compatible behavior | 1 | `parallel/test-http-server-close-all.js` |
| server.closeIdleConnections() while waiting for a response does not fire expected callbacks | 1 | `parallel/test-http-server-close-idle-wait-response.js` |
| server.headersTimeout 408 behavior for delayed header start is incomplete | 1 | `parallel/test-http-server-headers-timeout-delayed-headers.js` |
| server.headersTimeout 408 behavior for interrupted header lines is incomplete | 1 | `parallel/test-http-server-headers-timeout-interrupted-headers.js` |
| server.headersTimeout handling across keep-alive requests is not Node-compatible | 1 | `parallel/test-http-server-headers-timeout-keepalive.js` |
| server.headersTimeout handling for pipelined requests is not Node-compatible | 1 | `parallel/test-http-server-headers-timeout-pipelining.js` |
| server.maxRequestsPerSocket/dropRequest behavior is not fully implemented | 1 | `parallel/test-http-keep-alive-drop-requests.js` |
| server.requestTimeout 408 behavior for delayed header start is incomplete | 1 | `parallel/test-http-server-request-timeout-delayed-headers.js` |
| server.requestTimeout 408 behavior for delayed request body is incomplete | 1 | `parallel/test-http-server-request-timeout-delayed-body.js` |
| server.requestTimeout 408 behavior for interrupted request body is incomplete | 1 | `parallel/test-http-server-request-timeout-interrupted-body.js` |
| server.requestTimeout 408 behavior for interrupted request headers is incomplete | 1 | `parallel/test-http-server-request-timeout-interrupted-headers.js` |
| server.requestTimeout handling across keep-alive requests is not Node-compatible | 1 | `parallel/test-http-server-request-timeout-keepalive.js` |
| server.requestTimeout handling for pipelined requests is not Node-compatible | 1 | `parallel/test-http-server-request-timeout-pipelining.js` |
| server.requestTimeout is not disabled with Node-compatible semantics after Upgrade | 1 | `parallel/test-http-server-request-timeout-upgrade.js` |
| server/client maxHeadersCount limits are not enforced with Node-compatible header counts | 1 | `parallel/test-http-max-headers-count.js` |
| server/request/response timeout semantics (including keep-alive/idle cases) are not fully Node-compatible | 1 | `parallel/test-http-set-timeout-server.js` |
| setDefaultHeaders:false + setHost:true header casing/default behavior is not Node-compatible | 1 | `parallel/test-http-dont-set-default-headers-with-setHost.js` |
| setDefaultHeaders:false does not preserve raw-header ordering/duplicates and still injects defaults | 1 | `parallel/test-http-dont-set-default-headers.js` |
| setDefaultHeaders:false still injects/default-normalizes headers (Host/Content-Length/casing/duplicates) | 1 | `parallel/test-http-dont-set-default-headers-with-set-header.js` |
| setImmediate queue turn semantics are unstable and can trap in the timeout scheduler | 1 | `parallel/test-timers-immediate-queue.js` |
| setInterval scheduling incorrectly includes callback execution time | 1 | `sequential/test-timers-set-interval-excludes-callback-duration.js` |
| snapshot update/read flow via node:test is incomplete in WASM child emulation | 1 | `parallel/test-runner-snapshot-file-tests.js#test_01_t_assert_filesnapshot_update_read_flow` |
| source-map cache eviction via findSourceMap()/GC is incomplete | 1 | `parallel/test-source-map-cjs-require-cache.js` |
| spawn() stdio handling is incomplete: non-requested stderr stream is still created | 1 | `sequential/test-child-process-exit.js` |
| spawn() timeout validation path hangs in WASM child emulation | 1 | `parallel/test-child-process-spawn-timeout-kill-signal.js#block_02_block_02` |
| spawn() timeout+AbortSignal cleanup path hangs in WASM child emulation | 1 | `parallel/test-child-process-spawn-timeout-kill-signal.js#block_03_block_03` |
| spawn({ stdio: 'ignore' }) does not null out stdio streams like Node | 1 | `parallel/test-child-process-stdio.js#block_01_test_stdio_ignoring` |
| spawnSync() default maxBuffer (1MiB) limit is not enforced | 1 | `parallel/test-child-process-spawnsync-maxbuf.js#block_02_default_maxbuffer_size_is_1024_1024` |
| spawnSync() maxBuffer limit is not enforced in WASM child emulation | 1 | `parallel/test-child-process-spawnsync-maxbuf.js#block_00_verify_that_an_error_is_returned_if_maxbuffer_is_surpassed` |
| spawned process does not honor --max-http-header-size (http.maxHeaderSize mismatch) | 1 | `parallel/test-http-max-header-size.js` |
| stack-overflow recovery around vm.runInThisContext/runInNewContext traps in WASM | 1 | `parallel/test-vm-low-stack-space.js` |
| stdout redirection to file not implemented | 1 | `parallel/test-stdout-to-file.js` |
| stream.finished hangs in destroyed-stream callback ordering path | 1 | `parallel/test-stream-finished.js#block_34_block_34` |
| stream.finished() behavior for destroyed IncomingMessage is not Node-compatible | 1 | `parallel/test-http-client-finished.js` |
| stream.write()/console.log tick scheduling is not fully Node-compatible | 1 | `parallel/test-stream-writable-samecb-singletick.js` |
| stream/web compression constructor error codes are not Node-compatible yet | 1 | `parallel/test-whatwg-webstreams-compression.js` |
| strict-mode assignment semantics in vm contexts differ from Node | 1 | `parallel/test-vm-strict-mode.js` |
| subtle.digest unsupported-algorithm error semantics do not match Node | 1 | `parallel/test-webcrypto-digest.js` |
| timeout option does not reliably emit request timeout before close | 1 | `parallel/test-http-client-timeout-option.js` |
| timers/promises scheduler constructor and error-code semantics are not fully Node-compatible | 1 | `parallel/test-timers-promises-scheduler.js` |
| tls.checkServerIdentity() is a stub that throws instead of performing hostname/certificate matching | 1 | `parallel/test-tls-check-server-identity.js` |
| tls.connect() stub throws before running createSecureContext/DEFAULT_CIPHERS plumbing | 1 | `parallel/test-tls-client-default-ciphers.js` |
| tls.createSecureContext() stub throws before Node-style clientCertEngine argument validation | 1 | `parallel/test-tls-clientcertengine-invalid-arg-type.js` |
| trace_events dynamic file output for node.async_hooks is incomplete | 1 | `parallel/test-trace-events-async-hooks-dynamic.js` |
| trace_events node.console category output is incomplete | 1 | `parallel/test-trace-events-console.js` |
| trace_events node.environment category output is incomplete | 1 | `parallel/test-trace-events-environment.js` |
| tracingChannel({}) argument-validation behavior differs from Node.js (message/throw shape mismatch) | 1 | `parallel/test-diagnostics-channel-tracing-channel-args-types.js` |
| transferability checks and DataCloneError behavior are incomplete | 1 | `parallel/test-worker-message-port.js#block_07_block_07` |
| tty stdin stream/event-emitter compatibility is incomplete | 1 | `parallel/test-tty-stdin-end.js` |
| uncaught exception handling in HTTP request callbacks does not recover/terminate like Node and hangs | 1 | `parallel/test-http-exceptions.js` |
| uncaughtException handling after response end can stall socket cleanup | 1 | `parallel/test-http-end-throw-socket-handling.js` |
| uncaughtException rethrow exit-code semantics are incomplete | 1 | `parallel/test-unhandled-exception-rethrow-error.js` |
| uses V8 native %GetUndetectable() syntax which QuickJS cannot evaluate | 1 | `parallel/test-util-inspect.js#block_83_https_github_com_nodejs_node_issues_31889` |
| util.MIMEType parsing API is not implemented | 1 | `parallel/test-mime-whatwg.js` |
| util.MIMEType/util.MIMEParams are not implemented | 1 | `parallel/test-mime-api.js` |
| util.debuglog formatting/callback behavior is not fully Node-compatible | 1 | `sequential/test-util-debug.js` |
| v8.setFlagsFromString argument validation error fidelity is incomplete | 1 | `parallel/test-v8-flag-type-check.js` |
| valid EC key vectors fail to import | 1 | `parallel/test-webcrypto-export-import-ec.js#block_00_block_00` |
| verify() returns non-Node error code/message for unsupported key types | 1 | `parallel/test-crypto-sign-verify.js#block_18_block_18` |
| vm context does not preserve sandbox getter descriptors on the global object | 1 | `parallel/test-vm-getters.js` |
| vm context global object identity/proxy semantics differ from Node | 1 | `parallel/test-vm-global-identity.js` |
| vm context global property enumeration includes unexpected runtime globals | 1 | `parallel/test-vm-global-property-enumerator.js` |
| vm context property descriptor behavior is incomplete for sandbox accessors | 1 | `parallel/test-vm-attributes-property-not-on-sandbox.js` |
| vm context property forwarding and indexed descriptor behavior are incomplete | 1 | `parallel/test-vm-context-property-forwarding.js` |
| vm context prototype chain and own-property lookup semantics are incomplete | 1 | `parallel/test-vm-global-property-prototype.js` |
| vm contextification does not propagate var/global writes correctly | 1 | `parallel/test-vm-create-and-run-in-context.js` |
| vm contextification write-back and runInContext semantics are incomplete | 1 | `parallel/test-vm-context.js` |
| vm contexts do not provide the expected per-context Proxy behavior | 1 | `parallel/test-vm-proxies.js` |
| vm global getter/setter descriptors are not exposed correctly on contextified objects | 1 | `parallel/test-vm-global-setter.js` |
| vm run* filename option does not set stack trace file locations correctly | 1 | `parallel/test-vm-basic.js#block_05_run_script_with_filename` |
| vm.Module/SourceTextModule state machine and Node-compatible error validation are incomplete | 1 | `parallel/test-vm-module-errors.js` |
| vm.Script constructor/run option validation and error codes are incomplete | 1 | `parallel/test-vm-options-validation.js` |
| vm.Script.sourceMapURL parsing for //# sourceMappingURL comments is not implemented | 1 | `parallel/test-vm-source-map-url.js` |
| vm.SyntheticModule API behavior is missing/incomplete | 1 | `parallel/test-vm-module-synthetic.js` |
| vm.USE_MAIN_CONTEXT_DEFAULT_LOADER behavior for dynamic import resolution is incomplete | 1 | `es-module/test-vm-main-context-default-loader.js` |
| vm.compileFunction options range validation (lineOffset/columnOffset) is incomplete | 1 | `es-module/test-vm-compile-function-lineoffset.js` |
| vm.compileFunction validation, options handling, and error fidelity are incomplete | 1 | `parallel/test-vm-basic.js#block_06_vm_compilefunction` |
| vm.createContext argument type validation and error codes are incomplete | 1 | `parallel/test-vm-create-context-arg.js` |
| vm.createContext argument validation and error codes are incomplete | 1 | `parallel/test-vm-basic.js#block_04_vm_createcontext` |
| vm.createContext does not preserve sandbox accessor properties during evaluation | 1 | `parallel/test-vm-create-context-accessors.js` |
| vm.createContext options argument validation and error fidelity are incomplete | 1 | `parallel/test-vm-basic.js#block_03_vm_runinnewcontext` |
| vm.isContext argument validation and TypeError behavior are incomplete | 1 | `parallel/test-vm-is-context.js` |
| vm.runInContext contextification/write-back semantics are incomplete | 1 | `parallel/test-vm-basic.js#block_01_vm_runincontext` |
| vm.runInNewContext does not propagate global writes back to the sandbox object | 1 | `parallel/test-vm-basic.js#block_00_vm_runinnewcontext` |
| wasi module and --permission integration are incomplete | 1 | `parallel/test-permission-wasi.js` |
| wasi:http client does not surface HPE_INVALID_TRANSFER_ENCODING parse errors from raw TCP responses | 1 | `parallel/test-http-client-reject-chunked-with-content-length.js` |
| wasi:http client does not surface HPE_LF_EXPECTED parse errors from raw TCP responses | 1 | `parallel/test-http-client-reject-cr-no-lf.js` |
| wasi:http client does not surface informational 1xx responses as 'information' events | 1 | `parallel/test-http-information-processing.js` |
| wasi:http client does not surface informational 1xx responses with Node-compatible status/raw headers | 1 | `parallel/test-http-information-headers.js` |
| wasi:http client does not surface llhttp parse errors/rawPacket for malformed raw TCP responses | 1 | `parallel/test-http-client-error-rawbytes.js` |
| wasi:http client does not surface llhttp parser errors for malformed raw TCP responses | 1 | `parallel/test-http-client-parse-error.js` |
| wasi:http response header filtering strips headers like Host/Proxy-Authorization, so duplicate-header expectations diverge | 1 | `parallel/test-http-response-multiheaders.js` |
| wasi:http strips forbidden hop-by-hop headers like Connection, so automatic response headers differ | 1 | `parallel/test-http-automatic-headers.js` |
| wasi:http strips hop-by-hop response headers, so 'Keep-Alive' is not visible to node:http clients | 1 | `parallel/test-http-keep-alive-timeout-custom.js` |
| wasi:http strips hop-by-hop response headers, so computed Keep-Alive timeout headers are not visible to clients | 1 | `parallel/test-http-keep-alive-timeout.js` |
| wasi:sockets UDP connect/send callback path crashes in wasmtime | 1 | `parallel/test-dgram-connect-send-callback-buffer-length.js` |
| wasi:sockets UDP implementation crashes on dgram close in this scenario | 1 | `parallel/test-dgram-send-cb-quelches-error.js` |
| wasi:sockets UDP resource-drop path crashes during repeated bind errors | 1 | `parallel/test-dgram-bind-error-repeat.js` |
| without insecureHTTPParser, invalid headers do not follow the expected clientError path | 1 | `parallel/test-http-insecure-parser-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_` |
| without maxHeaderSize override, oversized headers do not follow the expected clientError path | 1 | `parallel/test-http-max-header-size-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_` |
| write-after-remote-close error propagation (ECONNRESET/EPIPE) and cleanup are incomplete | 1 | `parallel/test-http-destroyed-socket-write2.js` |
| zlib decompressor handling of trailing garbage/premature end differs from Node | 1 | `parallel/test-zlib-premature-end.js` |
| zlib flush() interaction with writable needDrain/backpressure differs from Node | 1 | `parallel/test-zlib-flush-drain-longblock.js` |
| zlib invalid compressed input error event/callback behavior differs from Node | 1 | `parallel/test-zlib-invalid-input.js` |
| zlib stream bytesWritten/bytesRead accounting and end/data callbacks differ from Node | 1 | `parallel/test-zlib-bytes-read.js` |

### WASI-impossible (1153)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| tls/https is not supported in WebAssembly environment | 182 | `parallel/test-https-agent-create-connection.js#block_00_use_option_connect`, `parallel/test-https-agent-create-connection.js#block_01_use_port_and_option_connect`, `parallel/test-https-agent-create-connection.js#block_02_use_port_and_host_and_option_connect`, ... (+179) |
| inspector/debugger is not available in WASM | 104 | `parallel/test-debugger-backtrace.js`, `parallel/test-debugger-break.js`, `parallel/test-debugger-breakpoint-exists.js`, ... (+101) |
| cluster requires process forking, not available in WASM | 96 | `parallel/test-cluster-advanced-serialization.js`, `parallel/test-cluster-basic.js`, `parallel/test-cluster-bind-privileged-port.js`, ... (+93) |
| [manual] http2/https not implemented | 89 | `parallel/test-http2-allow-http1.js`, `parallel/test-http2-altsvc.js`, `parallel/test-http2-async-local-storage.js`, ... (+86) |
| requires worker_threads which is not available in WASM | 68 | `parallel/test-async-hooks-worker-asyncfn-terminate-1.js`, `parallel/test-async-hooks-worker-asyncfn-terminate-2.js`, `parallel/test-async-hooks-worker-asyncfn-terminate-3.js`, ... (+65) |
| node:http2 is a stub in WebAssembly runtime | 59 | `parallel/test-http2-compat-serverresponse-end.js#block_00_block_00`, `parallel/test-http2-compat-serverresponse-end.js#block_01_block_01`, `parallel/test-http2-compat-serverresponse-end.js#block_02_block_02`, ... (+56) |
| requires child_process which is not available in WASM | 54 | `parallel/test-child-process-advanced-serialization-largebuffer.js`, `parallel/test-child-process-advanced-serialization-splitted-length-field.js`, `parallel/test-child-process-advanced-serialization.js`, ... (+51) |
| worker_threads is not supported in WASM | 47 | `parallel/test-worker-broadcastchannel-wpt.js#block_00_block_00`, `parallel/test-worker-broadcastchannel-wpt.js#block_01_block_01`, `parallel/test-worker-broadcastchannel-wpt.js#block_02_block_02`, ... (+44) |
| REPL requires interactive terminal, not available in WASM | 44 | `parallel/test-repl-clear-immediate-crash.js`, `parallel/test-repl-cli-eval.js`, `parallel/test-repl-colors.js`, ... (+41) |
| requires https.createServer/TLS server behavior, unsupported by WASI transport | 32 | `parallel/test-https-byteswritten.js`, `parallel/test-https-client-checkServerIdentity.js`, `parallel/test-https-client-get-url.js`, ... (+29) |
| Node.js SEA packaging, not available in WASM | 28 | `parallel/test-single-executable-blob-config-errors.js#block_00_block_00`, `parallel/test-single-executable-blob-config-errors.js#block_01_block_01`, `parallel/test-single-executable-blob-config-errors.js#block_02_block_02`, ... (+25) |
| inherited: requires child_process which is not available in WASM | 21 | `parallel/test-child-process-constructor.js#block_00_block_00`, `parallel/test-child-process-constructor.js#block_01_block_01`, `parallel/test-child-process-constructor.js#block_02_block_02`, ... (+18) |
| repl is not supported in WASM | 21 | `parallel/test-repl-autolibs.js`, `parallel/test-repl-domain.js`, `parallel/test-repl-editor.js`, ... (+18) |
| tls is not supported in WebAssembly environment | 16 | `parallel/test-double-tls-client.js`, `parallel/test-double-tls-server.js`, `parallel/test-gc-tls-external-memory.js`, ... (+13) |
| http2 is not supported in WebAssembly environment | 15 | `parallel/test-h2-large-header-cause-client-to-hangup.js`, `parallel/test-h2leak-destroy-session-on-socket-ended.js`, `parallel/test-http2-alpn.js#block_00_block_00`, ... (+12) |
| requires TLS-enabled HTTP/2 server (createSecureServer), unsupported in WASI runtime | 15 | `parallel/test-http2-https-fallback-http-server-options.js`, `parallel/test-http2-https-fallback.js#block_00_http_2_http_1_1_server`, `parallel/test-http2-https-fallback.js#block_01_http_2_only_server`, ... (+12) |
| V8 profiling, not available in WASM | 12 | `sequential/test-cpu-prof-default.js`, `sequential/test-cpu-prof-dir-absolute.js`, `sequential/test-cpu-prof-dir-and-name.js`, ... (+9) |
| requires spawning a real Node.js CLI process with `--test` | 11 | `parallel/test-runner-cli.js#block_00_block_00`, `parallel/test-runner-cli.js#block_01_block_01`, `parallel/test-runner-cli.js#block_02_block_02`, ... (+8) |
| inspector/heap profiler is not available in WASM | 10 | `parallel/test-heap-prof-basic.js`, `parallel/test-heap-prof-dir-absolute.js`, `parallel/test-heap-prof-dir-name.js`, ... (+7) |
| requires --abort-on-uncaught-exception child-process abort behavior | 10 | `parallel/test-domain-no-error-handler-abort-on-uncaught-0.js`, `parallel/test-domain-no-error-handler-abort-on-uncaught-1.js`, `parallel/test-domain-no-error-handler-abort-on-uncaught-2.js`, ... (+7) |
| requires child_process IPC/fork which is not available in WASM | 8 | `parallel/test-child-process-fork-close.js`, `parallel/test-child-process-fork-net-server.js`, `parallel/test-child-process-fork-net-socket.js`, ... (+5) |
| requires spawning a real `node --test` child process and inspecting CLI diagnostics | 8 | `parallel/test-runner-cli-concurrency.js#test_00_default_concurrency`, `parallel/test-runner-cli-concurrency.js#test_01_concurrency_of_one`, `parallel/test-runner-cli-concurrency.js#test_02_concurrency_of_two`, ... (+5) |
| inherited: child_process is not supported in WebAssembly environment | 7 | `sequential/test-child-process-execsync.js#block_00_block_00`, `sequential/test-child-process-execsync.js#block_01_block_01`, `sequential/test-child-process-execsync.js#block_02_block_02`, ... (+4) |
| https is not supported in WebAssembly environment | 5 | `parallel/test-https-insecure-parse-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`, `parallel/test-https-insecure-parse-per-stream.js#block_03_test_4_the_same_as_test_3_except_without_the_option_to_make_`, `parallel/test-https-max-header-size-per-stream.js#block_02_test_3_the_client_sends_larger_headers_than_what_would_other`, ... (+2) |
| inherited: repl is not supported in WebAssembly environment | 5 | `parallel/test-repl-context.js#block_00_test_context_when_useglobal_is_false`, `parallel/test-repl-context.js#block_01_test_for_context_side_effects`, `parallel/test-repl-tab-complete-import.js#block_00_block_00`, ... (+2) |
| requires https.Server/TLS server behavior, unsupported by WASI transport | 5 | `parallel/test-https-agent-additional-options.js`, `parallel/test-https-agent-servername.js`, `parallel/test-https-agent-sockets-leak.js`, ... (+2) |
| requires non-root POSIX permission semantics; process.getuid() is always 0 in WASM | 5 | `parallel/test-fs-copyfile-respect-permissions.js#block_00_test_synchronous_api`, `parallel/test-fs-copyfile-respect-permissions.js#block_01_test_promises_api`, `parallel/test-fs-copyfile-respect-permissions.js#block_02_test_callback_api`, ... (+2) |
| wasi:http does not support HTTP Upgrade/101 socket takeover for node:http clients | 5 | `parallel/test-http-upgrade-advertise.js`, `parallel/test-http-upgrade-agent.js`, `parallel/test-http-upgrade-binary.js`, ... (+2) |
| inherited: Windows UNC path behavior is not applicable to the WASI runtime | 4 | `parallel/test-permission-fs-windows-path.js#block_00_block_00`, `parallel/test-permission-fs-windows-path.js#block_01_block_01`, `parallel/test-permission-fs-windows-path.js#block_02_block_02`, ... (+1) |
| inherited: requires worker_threads.BroadcastChannel, unavailable without threads in WASM | 4 | `parallel/test-broadcastchannel-custom-inspect.js#block_00_block_00`, `parallel/test-broadcastchannel-custom-inspect.js#block_01_block_01`, `parallel/test-broadcastchannel-custom-inspect.js#block_02_block_02`, ... (+1) |
| inherited: inspector/heap profiler is not available in WASM | 3 | `parallel/test-heap-prof-invalid-args.js#block_00_tests_heap_prof_name_without_heap_prof`, `parallel/test-heap-prof-invalid-args.js#block_01_tests_heap_prof_dir_without_heap_prof`, `parallel/test-heap-prof-invalid-args.js#block_02_tests_heap_prof_interval_without_heap_prof` |
| requires HTTPS server TLS session behavior, unsupported by WASI transport | 3 | `parallel/test-https-agent-disable-session-reuse.js`, `parallel/test-https-agent-session-injection.js`, `parallel/test-https-agent-session-reuse.js` |
| Linux abstract UNIX sockets are not available in WASI | 2 | `parallel/test-pipe-abstract-socket-http.js`, `parallel/test-pipe-abstract-socket.js` |
| Linux-specific filesystem behavior is not applicable in WASI | 2 | `parallel/test-fs-read-file-sync-hostname.js`, `parallel/test-fs-readdir-ucs2.js` |
| V8 heap features, not available in WASM | 2 | `parallel/test-heapsnapshot-near-heap-limit-by-api-in-worker.js`, `parallel/test-heapsnapshot-near-heap-limit-worker.js` |
| Windows-specific long-path behavior is not applicable in WASI | 2 | `parallel/test-fs-long-path.js`, `parallel/test-require-long-path.js` |
| breakOnSigint requires SIGINT delivery/handler semantics unavailable in WASI | 2 | `parallel/test-vm-sigint-existing-handler.js`, `parallel/test-vm-sigint.js` |
| child_process is not supported in WebAssembly environment | 2 | `sequential/test-child-process-emfile.js`, `sequential/test-child-process-pass-fd.js` |
| inspector NodeTracing domain is unavailable in WASM | 2 | `parallel/test-trace-events-dynamic-enable-workers-disabled.js`, `parallel/test-trace-events-dynamic-enable.js` |
| inspector is not available in WASM | 2 | `parallel/test-set-process-debug-port.js`, `parallel/test-worker-name.js` |
| repl requires interactive terminal | 2 | `parallel/test-repl-programmatic-history.js`, `parallel/test-repl.js` |
| requires OpenSSL 3-specific behavior unavailable in WASM runtime | 2 | `parallel/test-crypto-no-algorithm.js`, `parallel/test-crypto-publicDecrypt-fails-first-time.js` |
| requires POSIX FIFOs via mkfifo, unavailable in WASI Preview 2 | 2 | `parallel/test-http2-respond-file-error-pipe-offset.js`, `parallel/test-http2-respond-file-with-pipe.js` |
| requires TLS session resumption behavior, unavailable in WASI transport | 2 | `parallel/test-https-client-resume.js`, `parallel/test-https-resume-after-renew.js` |
| requires Unix domain sockets (`socketPath`/`common.PIPE`), unavailable in WASI Preview 2 | 2 | `parallel/test-http-unix-socket-keep-alive.js`, `parallel/test-http-unix-socket.js` |
| requires detached child_process with inherited listening socket fd | 2 | `parallel/test-listen-fd-detached-inherit.js`, `parallel/test-listen-fd-detached.js` |
| requires https.createServer (TLS server), unsupported by WASI transport | 2 | `parallel/test-https-abortcontroller.js`, `parallel/test-https-agent-abort-controller.js` |
| requires inspector/CPU profiling | 2 | `sequential/test-diagnostic-dir-cpu-prof.js#block_00_block_00`, `sequential/test-diagnostic-dir-cpu-prof.js#block_01_block_01` |
| requires inspector/heap profiling | 2 | `sequential/test-diagnostic-dir-heap-prof.js#block_00_test_diagnostic_dir_changes_the_default_for_cpu_prof`, `sequential/test-diagnostic-dir-heap-prof.js#block_01_test_heap_prof_dir_overwrites_diagnostic_dir` |
| requires spawning an interactive Node REPL subprocess (--interactive) and driving it via stdin; unsupported in this WASI environment | 2 | `es-module/test-esm-repl-imports.js`, `es-module/test-esm-repl.js` |
| requires spawning an interactive REPL subprocess (-i), unsupported in WASM | 2 | `parallel/test-force-repl-with-eval.js`, `parallel/test-force-repl.js` |
| requires spawning external OS commands (sleep/pwd), unavailable in WASM | 2 | `parallel/test-child-process-spawnsync.js#block_00_block_00`, `parallel/test-child-process-spawnsync.js#block_01_block_01` |
| requires worker_threads | 2 | `parallel/test-unhandled-exception-with-worker-inuse.js`, `parallel/test-worker-messaging.js` |
| test coverage reporting depends on inspector/V8 coverage, unavailable in WASM | 2 | `parallel/test-runner-coverage-source-map.js`, `parallel/test-runner-coverage-thresholds.js` |
| tests that worker's process.exit() interrupts subsequent worker code; requires real worker_threads execution which is not available in single-threaded WASM | 2 | `parallel/test-worker-voluntarily-exit-followed-by-addition.js`, `parallel/test-worker-voluntarily-exit-followed-by-throw.js` |
| tls.checkServerIdentity is unavailable in the WASM tls stub | 2 | `parallel/test-x509-escaping.js#block_04_the_internal_parsing_logic_must_match_the_json_specification`, `parallel/test-x509-escaping.js#block_05_correctly_i_e_not_simply_split_at_commas` |
| Linux-specific recursive fs.watch behavior is not applicable in WASI | 1 | `parallel/test-fs-watch-recursive-linux-parallel-remove.js` |
| Windows named-pipe enumeration behavior is not available in WASI | 1 | `parallel/test-fs-readdir-pipe.js` |
| Windows subst-drive behavior is not applicable in WASI | 1 | `parallel/test-fs-realpath-on-substed-drive.js` |
| Windows-only OOM/exitcode behavior is not available on WASI | 1 | `parallel/test-windows-failed-heap-allocation.js` |
| Windows-only abort/exitcode behavior is not available on WASI | 1 | `parallel/test-windows-abort-exitcode.js` |
| Windows-only named pipe/cmd shell behavior is not available in WASI | 1 | `parallel/test-spawn-cmd-named-pipe.js` |
| Windows-specific filesystem behavior is not applicable in WASI | 1 | `parallel/test-fs-readfilesync-enoent.js` |
| Windows-specific path validation behavior is not applicable in WASI | 1 | `parallel/test-fs-write-file-invalid-path.js` |
| Windows-specific process._debugProcess behavior is not available in WASI | 1 | `parallel/test-debug-process.js` |
| Windows-specific readonly-module filesystem behavior is not applicable in WASI | 1 | `parallel/test-module-readonly.js` |
| [manual] This test fundamentally requires `child_process.spawn()` with IPC communication and OS signal handling (`SIGKILL`), which are impossible in a WebAssembly sandbox. The entire test logic dep... | 1 | `parallel/test-net-child-process-connect-reset.js` |
| [manual] This test requires `http2.createServer()` (TCP server listening on a port) and `http2.connect()` (full HTTP/2 protocol client), neither of which are available in the WebAssembly/WASI envir... | 1 | `parallel/test-stream-pipeline-http2.js` |
| asserts via Worker 'exit' event, which is not emitted without real worker_threads execution in single-threaded WASM | 1 | `parallel/test-permission-allow-worker-cli.js#block_01_to_spawn_unless_allow_worker_is_sent` |
| child process signal termination semantics are not available in WASI | 1 | `parallel/test-signal-unregister.js` |
| cluster requires process forking and fd passing between processes | 1 | `parallel/test-listen-fd-cluster.js` |
| depends on Worker actually loading and executing a .ts file as TypeScript, which requires real worker_threads execution that is not available in single-threaded WASM | 1 | `parallel/test-worker-load-file-with-extension-other-than-js.js` |
| depends on real worker_threads execution (HAS_STARTED_WORKER round-trip and parentPort.onmessage setter side effects), not available in single-threaded WASM | 1 | `parallel/test-worker-onmessage-not-a-function.js` |
| depends on real worker_threads execution + node:vm runInContext inside the worker, neither available in single-threaded WASM | 1 | `parallel/test-worker-workerdata-messageport.js#block_04_block_04` |
| depends on real worker_threads execution for cryptographic round-trip, which is not available in single-threaded WASM | 1 | `parallel/test-crypto-worker-thread.js` |
| depends on real worker_threads execution to read the transferred FileHandle in a separate context, which is not available in single-threaded WASM | 1 | `parallel/test-fs-promises-file-handle-read-worker.js` |
| depends on real worker_threads exit semantics which require a separate JS context (not available in single-threaded WASM) | 1 | `parallel/test-worker-cleanexit-with-moduleload.js` |
| depends on real worker_threads exit-event behavior across a separate JS context, which is not available in single-threaded WASM | 1 | `parallel/test-worker-on-process-exit.js` |
| depends on real worker_threads terminate() interrupting an in-flight DNS query, which is not available in single-threaded WASM | 1 | `parallel/test-worker-dns-terminate-during-query.js` |
| depends on worker_threads-based event loop utilization behavior | 1 | `parallel/test-performance-eventlooputil.js` |
| host signal delivery and SIGINT interruption semantics are not available in WASI | 1 | `parallel/test-sigint-infinite-loop.js` |
| http2 is not implemented | 1 | `parallel/test-http2-compat-client-upload-reject.js` |
| https.createServer (TLS server) is not supported in WebAssembly environment | 1 | `sequential/test-https-connect-localport.js` |
| inspector Runtime.evaluate side-effect checks are unavailable in WASM | 1 | `parallel/test-process-env-sideeffects.js` |
| macOS-only lchmod behavior is not applicable in WASI | 1 | `parallel/test-fs-lchmod.js` |
| macOS-specific directory entry behavior is not applicable in WASI | 1 | `parallel/test-fs-readdir-buffer.js` |
| native addons/.node loading via process.dlopen is not supported in WASM | 1 | `parallel/test-process-dlopen-error-message-crash.js` |
| process.kill signal delivery is not supported in WASI | 1 | `parallel/test-signal-args.js` |
| process.kill signal handling is not supported in WASI | 1 | `parallel/test-signal-handler.js` |
| requires >32-bit address space/large allocations unavailable in wasm32 | 1 | `parallel/test-fs-write-buffer-large.js` |
| requires >32-bit buffer index range behavior unavailable in wasm32 | 1 | `parallel/test-buffer-tostring-range.js` |
| requires Atomics.wait tracing across worker threads | 1 | `parallel/test-trace-atomics-wait.js` |
| requires Atomics/SharedArrayBuffer support, unavailable without threads in WASM | 1 | `parallel/test-atomics-wake.js` |
| requires FIPS-enabled OpenSSL build | 1 | `parallel/test-dsa-fips-invalid-key.js` |
| requires HTTP Upgrade socket takeover plus tls.TLSSocket, unavailable in WASI | 1 | `parallel/test-http-upgrade-reconsume-stream.js` |
| requires HTTP/0.9 raw TCP responses (no headers), which wasi:http cannot represent | 1 | `parallel/test-http-response-no-headers.js` |
| requires HTTPS server-side SNI behavior, unsupported by WASI transport | 1 | `parallel/test-https-agent-sni.js` |
| requires Linux abstract UNIX socket tracing | 1 | `parallel/test-trace-events-net-abstract-socket.js` |
| requires Linux strace syscall tracing | 1 | `parallel/test-strace-openat-openssl.js` |
| requires POSIX RLIMIT_FSIZE/SIGXFSZ behavior via /bin/sh ulimit | 1 | `parallel/test-fs-write-sigxfsz.js` |
| requires TLS keylog/server socket behavior, unsupported by WASI transport | 1 | `parallel/test-https-agent-keylog.js` |
| requires TLS protocol/session negotiation on HTTPS server, unsupported by WASI transport | 1 | `parallel/test-https-agent-session-eviction.js` |
| requires TLS renegotiation/session behavior, unavailable in WASI transport | 1 | `parallel/test-https-client-renegotiation-limit.js` |
| requires TLS server functionality | 1 | `parallel/test-tls-socket-close.js` |
| requires TLS socket wrapping over raw net sockets | 1 | `parallel/test-socket-writes-before-passed-to-tls-socket.js` |
| requires Unix domain sockets (`common.PIPE`), unavailable in WASI Preview 2 | 1 | `parallel/test-http2-pipe-named-pipe.js` |
| requires Worker threads with structured clone of CryptoKey | 1 | `parallel/test-webcrypto-cryptokey-workers.js` |
| requires a real subprocess with independent stack-size overflow handling | 1 | `parallel/test-stack-size-limit.js` |
| requires child_process IPC with inherited listening socket fd | 1 | `parallel/test-listen-fd-server.js` |
| requires child_process.exec of external 'ab' binary | 1 | `parallel/test-http-full-response.js` |
| requires child_process.exec subprocess behavior | 1 | `parallel/test-error-reporting.js` |
| requires child_process.exec which is not available in WASM | 1 | `parallel/test-child-process-exec-cwd.js` |
| requires child_process.execSync which is not available in WASM | 1 | `parallel/test-domain-abort-on-uncaught.js` |
| requires child_process.fork(), which is unavailable in WASI | 1 | `parallel/test-http-server-stale-close.js` |
| requires child_process.spawn of a separate Node process to reproduce stack-overflow behavior | 1 | `sequential/test-fs-stat-sync-overflow.js` |
| requires child_process.spawn of a separate server process | 1 | `sequential/test-net-response-size.js` |
| requires child_process.spawn to run a subprocess | 1 | `parallel/test-aborted-util.js#test_04_does_not_hang_forever` |
| requires cluster module which is not available in WASM | 1 | `parallel/test-cluster-bind-twice.js` |
| requires cluster workers and tls support, which are unavailable in WASM | 1 | `parallel/test-tls-ticket-cluster.js` |
| requires cluster.fork/process forking | 1 | `sequential/test-dgram-bind-shared-ports.js` |
| requires cluster.fork/process forking for shared-port behavior | 1 | `sequential/test-net-listen-shared-ports.js` |
| requires cluster/process forking, not available in WASM | 1 | `parallel/test-dgram-exclusive-implicit-bind.js` |
| requires execSync/ps subprocess behavior not available in WASM | 1 | `parallel/test-setproctitle.js` |
| requires external OpenSSL CLI via child_process.exec | 1 | `parallel/test-crypto-sign-verify.js#block_13_early_if_no_openssl_binary_is_found` |
| requires external shell pipeline and cat subprocess via child_process | 1 | `parallel/test-http-chunk-problem.js` |
| requires external shell pipeline tooling (e.g. head), unavailable in WASM | 1 | `parallel/test-pipe-head.js` |
| requires external touch/date commands via child_process.spawnSync | 1 | `parallel/test-fs-utimes-y2K38.js` |
| requires full-duplex HTTP request/response streaming semantics not provided by wasi:http | 1 | `parallel/test-stream-pipeline.js#block_08_block_08` |
| requires https.createServer not supported | 1 | `parallel/test-http-request-agent.js` |
| requires https.createServer/TLS server support, unavailable in WASI runtime | 1 | `parallel/test-http-url.parse-https.request.js` |
| requires https.createServer/TLSSocket server support, unavailable in WebAssembly | 1 | `parallel/test-async-wrap-tlssocket-asyncreset.js` |
| requires libuv threadpool trace categories | 1 | `parallel/test-trace-events-threadpool.js` |
| requires macOS App Sandbox and codesign tooling outside WASI | 1 | `parallel/test-macos-app-sandbox.js` |
| requires raw TLS handshake/protocol-mismatch behavior (HTTPS client to HTTP server), unavailable with wasi:http | 1 | `parallel/test-https-connecting-to-http.js` |
| requires real child_process for fork/event-loop-exit semantics | 1 | `parallel/test-pipe-unref.js` |
| requires real child_process.spawn concurrency for server/client subprocesses | 1 | `sequential/test-net-GH-5504.js` |
| requires real worker_threads execution (HAS_STARTED_WORKER round-trip) which is not available in single-threaded WASM | 1 | `parallel/test-crypto-key-objects-messageport.js` |
| requires spawning an interactive Node REPL subprocess (--interactive) and driving it via stdin | 1 | `parallel/test-cwd-enoent-repl.js` |
| requires spawning node subprocesses to run package scripts | 1 | `parallel/test-node-run.js` |
| requires spawning node subprocesses to validate CLI CA flags | 1 | `parallel/test-openssl-ca-options.js` |
| requires tls APIs that are unsupported in WASM | 1 | `parallel/test-crypto.js` |
| requires tls server/client APIs, which are unsupported in WASM | 1 | `parallel/test-crypto-verify-failure.js` |
| requires tls.Server/TLS socket APIs, unsupported in WebAssembly environment | 1 | `parallel/test-https-eof-for-eom.js` |
| requires tls.createServer/tls.connect, which are unsupported in WASM | 1 | `parallel/test-x509-escaping.js#block_00_test_that_all_certificate_chains_provided_by_the_reporter_ar` |
| requires worker_threads and child-process symlink behavior not available in WASI | 1 | `parallel/test-require-symlink.js` |
| requires worker_threads isolate/execArgv behavior not available in WASM | 1 | `parallel/test-no-addons-resolution-condition.js` |
| requires worker_threads plus V8 --harmony-struct SharedArray feature | 1 | `parallel/test-experimental-shared-value-conveyor.js` |
| requires worker_threads stdout/execArgv behavior not available in WASM | 1 | `parallel/test-process-exec-argv.js` |
| requires worker_threads to flood invalid frames; worker_threads is unavailable in WASM | 1 | `parallel/test-http2-reset-flood.js` |
| requires worker_threads to interrupt generatePrime; worker_threads is unavailable in WASM | 1 | `parallel/test-crypto-prime.js#block_09_block_09` |
| requires worker_threads trace propagation | 1 | `parallel/test-trace-events-async-hooks-worker.js` |
| requires worker_threads, which are unavailable in WASM | 1 | `sequential/test-vm-break-on-sigint.js` |
| sending host process signals is not supported in WASI | 1 | `parallel/test-process-kill-null.js` |
| test is gated to Linux/macOS/Windows shell behavior and excludes WASI | 1 | `parallel/test-stdin-from-file-spawn.js` |
| tests Worker terminate() during http2.respondWithFile() in the worker; requires real worker_threads execution which is not available in single-threaded WASM | 1 | `parallel/test-worker-terminate-http2-respond-with-file.js` |
| tests that a worker-side stack overflow surfaces as RangeError on the 'error' event; requires real worker_threads execution and error propagation | 1 | `parallel/test-worker-stack-overflow.js` |
| tests that an uncaught error from a nested worker propagates as 'error' on the outer worker; requires real worker_threads execution / error propagation | 1 | `parallel/test-worker-nested-uncaught.js` |
| tests the race between transferring a MessagePort to a real worker and worker.terminate(); meaningless without real worker_threads execution | 1 | `parallel/test-worker-message-port-transfer-terminate.js` |
| tests worker.unref() interaction with worker exit-event scheduling, which requires real worker_threads execution that is not available in single-threaded WASM | 1 | `parallel/test-worker-ref-onexit.js` |
| verifies that Worker receives multiple transferList'd MessagePorts in workerData; requires real worker_threads execution | 1 | `parallel/test-worker-workerdata-messageport.js#block_01_block_01` |
| verifies that Worker receives transferList'd MessagePort in workerData; requires real worker_threads execution | 1 | `parallel/test-worker-workerdata-messageport.js#block_00_block_00` |
| wasi:http always derives/sends Host from URL authority, so an HTTP/1.1 request without Host cannot be expressed | 1 | `parallel/test-http-request-host-header.js#block_00_block_00` |
| wasi:http does not expose HTTP reason phrases (`statusMessage`) | 1 | `parallel/test-http-status-reason-invalid-chars.js` |
| wasi:http does not expose custom HTTP reason phrases (status messages) | 1 | `parallel/test-http-response-status-message.js` |
| wasi:http normalizes response header names, so raw header case preservation assertions cannot be satisfied | 1 | `parallel/test-http-write-head.js` |

### engine difference (162)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| depends on V8 startup snapshot APIs and --build-snapshot behavior unavailable in QuickJS | 57 | `parallel/test-snapshot-api.js#block_00_block_00`, `parallel/test-snapshot-api.js#block_01_block_01`, `parallel/test-snapshot-argv1.js#block_00_block_00`, ... (+54) |
| inherited: v8.Serializer/Deserializer and v8.serialize/deserialize are V8-specific and unavailable in QuickJS | 14 | `parallel/test-v8-serdes.js#block_00_block_00`, `parallel/test-v8-serdes.js#block_01_block_01`, `parallel/test-v8-serdes.js#block_02_block_02`, ... (+11) |
| ShadowRealm is not available in QuickJS | 11 | `parallel/test-shadow-realm-allowed-builtin-modules.js`, `parallel/test-shadow-realm-custom-loaders.js`, `parallel/test-shadow-realm-gc-module.js`, ... (+8) |
| module compile-cache API is V8-specific and unavailable in QuickJS | 8 | `parallel/test-compile-cache-api-env.js`, `parallel/test-compile-cache-api-error.js`, `parallel/test-compile-cache-api-flush.js`, ... (+5) |
| NODE_COMPILE_CACHE depends on V8 code cache behavior unavailable in QuickJS | 7 | `parallel/test-compile-cache-dynamic-import.js`, `parallel/test-compile-cache-esm.js`, `parallel/test-compile-cache-existing-directory.js`, ... (+4) |
| v8.promiseHooks is V8-specific and not available in QuickJS | 6 | `parallel/test-promise-hook-create-hook.js`, `parallel/test-promise-hook-exceptions.js`, `parallel/test-promise-hook-on-after.js`, ... (+3) |
| vm.measureMemory depends on V8 heap introspection APIs unavailable in QuickJS | 6 | `parallel/test-vm-measure-memory-lazy.js#block_00_or_otherwise_these_may_not_resolve`, `parallel/test-vm-measure-memory-lazy.js#block_01_block_01`, `parallel/test-vm-measure-memory-lazy.js#block_02_block_02`, ... (+3) |
| inherited: v8.queryObjects is a V8-specific heap introspection API unavailable in QuickJS | 5 | `parallel/test-v8-query-objects.js#block_00_block_00`, `parallel/test-v8-query-objects.js#block_01_block_01`, `parallel/test-v8-query-objects.js#block_02_block_02`, ... (+2) |
| requires V8 --expose_externalize_string globals | 5 | `parallel/test-fs-write.js#block_00_block_00`, `parallel/test-fs-write.js#block_01_block_01`, `parallel/test-fs-write.js#block_02_block_02`, ... (+2) |
| v8.GCProfiler is V8-specific and unavailable in QuickJS | 4 | `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_00_test_if_it_makes_the_process_crash`, `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_01_block_01`, `parallel/test-v8-collect-gc-profile-in-worker.js`, ... (+1) |
| v8.writeHeapSnapshot/getHeapSnapshot are V8-specific APIs and unavailable in QuickJS | 4 | `sequential/test-heapdump.js#block_00_block_00`, `sequential/test-heapdump.js#block_01_block_01`, `sequential/test-heapdump.js#block_02_block_02`, ... (+1) |
| QuickJS does not mirror V8's legacy RegExp static properties initialization | 3 | `parallel/test-startup-empty-regexp-statics.js#block_00_block_00`, `parallel/test-startup-empty-regexp-statics.js#block_01_block_01`, `parallel/test-startup-empty-regexp-statics.js#block_02_block_02` |
| targets V8 external string internals/limits that QuickJS does not replicate | 3 | `parallel/test-stringbytes-external.js#block_00_block_00`, `parallel/test-stringbytes-external.js#block_01_block_01`, `parallel/test-stringbytes-external.js#block_02_https_github_com_nodejs_node_issues_1024` |
| --heapsnapshot-signal depends on V8 heap snapshot support, unavailable in QuickJS | 2 | `sequential/test-heapdump-flag-custom-dir.js`, `sequential/test-heapdump-flag.js` |
| --use-largepages is a V8 startup flag not applicable to QuickJS/WASM | 2 | `parallel/test-startup-large-pages.js#block_00_block_00`, `parallel/test-startup-large-pages.js#block_01_block_01` |
| v8.getHeapSnapshot is V8-specific and unavailable in QuickJS | 2 | `parallel/test-heapdump-async-hooks-init-promise.js`, `parallel/test-v8-getheapsnapshot-twice.js` |
| v8.serialize/deserialize are V8-specific and unavailable in QuickJS | 2 | `parallel/test-v8-deserialize-buffer.js`, `parallel/test-v8-serialize-leak.js` |
| v8.writeHeapSnapshot is a V8-specific API and is unavailable in QuickJS | 2 | `parallel/test-permission-fs-write-v8.js#block_00_block_00`, `parallel/test-permission-fs-write-v8.js#block_01_block_01` |
| GC observability used by common/gc.onGC is not available in the QuickJS/WASM runtime | 1 | `parallel/test-net-connect-memleak.js` |
| QuickJS await/promise-hook semantics differ from V8, so AsyncLocalStorage runStores context is lost across await boundaries | 1 | `parallel/test-diagnostics-channel-tracing-channel-promise-run-stores.js` |
| QuickJS private-field TypeError message text differs from V8 | 1 | `parallel/test-runner-mocking.js#test_21_mocks_a_constructor` |
| SourceTextModule cachedData depends on V8 code cache internals unavailable in QuickJS | 1 | `parallel/test-vm-module-cached-data.js` |
| asserts V8-specific syntax error stderr text/format that differs in QuickJS | 1 | `es-module/test-require-module-errors.js` |
| depends on V8 --prof/--prof-process tick-processor tooling | 1 | `parallel/test-tick-processor-arguments.js` |
| depends on V8 PromiseRejectCallback stack-overflow behavior | 1 | `parallel/test-promise-reject-callback-exception.js` |
| depends on V8 native syntax and runtime flags not available in QuickJS | 1 | `parallel/test-v8-flags.js` |
| depends on engine-specific ArrayBuffer OOM RangeError message text in skip path | 1 | `sequential/test-buffer-creation-regression.js` |
| expects V8 heap space statistics that QuickJS does not expose | 1 | `parallel/test-v8-stats.js` |
| uses V8 natives syntax intrinsics (`%DebugPrint`, `%HaveSameMap`, `%CollectGarbage`) unavailable in QuickJS | 1 | `parallel/test-http-same-map.js` |
| uses common/gc checkIfCollectableByCounting, which depends on V8-only v8.queryObjects | 1 | `parallel/test-diagnostics-channel-memory-leak.js` |
| uses v8.getHeapSnapshot, which is V8-specific and unavailable in QuickJS | 1 | `parallel/test-http2-ping-settings-heapdump.js` |
| v8.cachedDataVersionTag depends on V8 internals unavailable in QuickJS | 1 | `parallel/test-v8-version-tag.js` |
| v8.getHeapSnapshot heap-introspection behavior is V8-specific and unavailable in QuickJS | 1 | `sequential/test-get-heapsnapshot-options.js` |
| v8.startupSnapshot is V8 snapshot machinery unavailable in QuickJS | 1 | `parallel/test-v8-startup-snapshot-api.js` |
| v8.writeHeapSnapshot heap-introspection behavior is V8-specific and unavailable in QuickJS | 1 | `sequential/test-write-heapsnapshot-options.js` |
| vm.Script cachedData/produceCachedData relies on V8 code cache format unavailable in QuickJS | 1 | `parallel/test-vm-cached-data.js` |
| vm.Script.createCachedData relies on V8 code cache internals unavailable in QuickJS | 1 | `parallel/test-vm-createcacheddata.js` |

### unevaluated (0)

_No entries._

### Node.js internals (1121)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| requires --expose-internals and internal/webstreams/readablestream | 82 | `parallel/test-whatwg-readablestream.js#block_00_block_00`, `parallel/test-whatwg-readablestream.js#block_01_block_01`, `parallel/test-whatwg-readablestream.js#block_02_block_02`, ... (+79) |
| requires internal/util/inspect via --expose-internals | 78 | `parallel/test-readline-interface.js#block_00_block_00`, `parallel/test-readline-interface.js#block_01_block_01`, `parallel/test-readline-interface.js#block_02_block_02`, ... (+75) |
| requires --expose-internals and internal/webstreams/adapters | 60 | `parallel/test-whatwg-webstreams-adapters-streambase.js#block_00_block_00`, `parallel/test-whatwg-webstreams-adapters-streambase.js#block_01_block_01`, `parallel/test-whatwg-webstreams-adapters-streambase.js#block_02_block_02`, ... (+57) |
| inherited: requires --expose-internals, inspect integration, and internal EventTarget APIs | 57 | `parallel/test-eventtarget.js#block_00_first_test_event`, `parallel/test-eventtarget.js#block_01_block_01`, `parallel/test-eventtarget.js#block_02_block_02`, ... (+54) |
| requires --expose-internals plus internal/test/binding internalBinding('js_stream'/'util') | 48 | `parallel/test-util-inspect.js#block_00_special_function_inspection`, `parallel/test-util-inspect.js#block_01_block_01`, `parallel/test-util-inspect.js#block_02_block_02`, ... (+45) |
| uses --expose-internals with internal/test/binding (internalBinding('uv')) | 32 | `parallel/test-fs-copyfile.js`, `parallel/test-fs-error-messages.js#block_00_stat`, `parallel/test-fs-error-messages.js#block_01_lstat`, ... (+29) |
| validates Node repository ESLint tooling/rules under tools/, not runtime API | 24 | `parallel/test-eslint-alphabetize-errors.js`, `parallel/test-eslint-alphabetize-primordials.js`, `parallel/test-eslint-async-iife-no-unused-result.js`, ... (+21) |
| inherited: requires --expose-internals and internal/event_target | 23 | `parallel/test-nodeeventtarget.js#block_00_block_00`, `parallel/test-nodeeventtarget.js#block_01_block_01`, `parallel/test-nodeeventtarget.js#block_02_block_02`, ... (+20) |
| Tests use internal/webstreams/util kState symbol to inspect web stream internals | 22 | `parallel/test-blob.js#block_00_block_00`, `parallel/test-blob.js#block_01_block_01`, `parallel/test-blob.js#block_02_block_02`, ... (+19) |
| missing reason | 21 | `parallel/test-cli-node-options-disallowed.js`, `parallel/test-crypto-prime.js#block_00_block_00`, `parallel/test-crypto-prime.js#block_01_block_01`, ... (+18) |
| depends on internal/util.customPromisifyArgs symbol | 19 | `parallel/test-util-promisify.js#block_00_block_00`, `parallel/test-util-promisify.js#block_01_block_01`, `parallel/test-util-promisify.js#block_02_block_02`, ... (+16) |
| inherited: requires internal/event_target, ERR_INVALID_ARG_TYPE validation, returnValue/cancelBubble/srcElement properties | 19 | `parallel/test-events-customevent.js#block_00_block_00`, `parallel/test-events-customevent.js#block_02_block_02`, `parallel/test-events-customevent.js#block_03_block_03`, ... (+16) |
| requires --expose-internals and internal/crypto/webidl | 19 | `parallel/test-webcrypto-webidl.js#block_00_required_arguments_length`, `parallel/test-webcrypto-webidl.js#block_01_boolean`, `parallel/test-webcrypto-webidl.js#block_02_https_webidl_spec_whatwg_org_abstract_opdef_converttoint`, ... (+16) |
| requires internalBinding('async_wrap') | 18 | `sequential/test-async-wrap-getasyncid.js#block_00_make_sure_that_all_providers_are_tested`, `sequential/test-async-wrap-getasyncid.js#block_01_block_01`, `sequential/test-async-wrap-getasyncid.js#block_02_block_02`, ... (+15) |
| requires --expose-internals and internal/event_target | 15 | `parallel/test-events-on-async-iterator.js`, `parallel/test-eventtarget-brandcheck.js`, `parallel/test-global-customevent.js`, ... (+12) |
| requires --expose-internals and internal/worker/js_transferable | 15 | `parallel/test-whatwg-transformstream.js#block_00_block_00`, `parallel/test-whatwg-transformstream.js#block_01_block_01`, `parallel/test-whatwg-transformstream.js#block_02_block_02`, ... (+12) |
| uses --expose-internals plus internal/errors and internal/util/inspect | 15 | `parallel/test-errors-systemerror.js#block_00_block_00`, `parallel/test-errors-systemerror.js#block_01_block_01`, `parallel/test-errors-systemerror.js#block_02_block_02`, ... (+12) |
| inherited: requires --expose-internals and internal/validators | 13 | `parallel/test-internal-validators-validateoneof.js#block_00_block_00`, `parallel/test-internal-validators-validateoneof.js#block_01_block_01`, `parallel/test-internal-validators-validateoneof.js#block_02_block_02`, ... (+10) |
| requires --expose-internals and internal/webstreams/* modules | 13 | `parallel/test-whatwg-webstreams-transfer.js#block_00_block_00`, `parallel/test-whatwg-webstreams-transfer.js#block_01_block_01`, `parallel/test-whatwg-webstreams-transfer.js#block_02_block_02`, ... (+10) |
| inherited: requires --expose-internals and internal/event_target (kWeakHandler) | 12 | `parallel/test-events-static-geteventlisteners.js#block_00_test_geteventlisteners_on_eventemitter`, `parallel/test-events-static-geteventlisteners.js#block_01_test_geteventlisteners_on_eventtarget`, `parallel/test-events-static-geteventlisteners.js#block_02_block_02`, ... (+9) |
| requires --expose-internals and internal/child_process | 12 | `parallel/test-child-process-bad-stdio.js#test_00_normal_execution_of_a_child_process_is_handled`, `parallel/test-child-process-bad-stdio.js#test_01_execution_with_an_error_event_is_handled`, `parallel/test-child-process-bad-stdio.js#test_02_execution_with_a_killed_process_is_handled`, ... (+9) |
| inherited: requires --expose-internals and internal/errors | 11 | `parallel/test-internal-error-original-names.js#block_00_block_00`, `parallel/test-internal-error-original-names.js#block_01_block_01`, `parallel/test-internal-error-original-names.js#block_02_block_02`, ... (+8) |
| inherited: uses --expose-internals with internal/test/binding primordials and internal/util | 11 | `parallel/test-primordials-regexp.js#block_00_block_00`, `parallel/test-primordials-regexp.js#block_01_block_01`, `parallel/test-primordials-regexp.js#block_02_block_02`, ... (+8) |
| requires --expose-internals and internal/webstreams/util (kState) | 11 | `parallel/test-whatwg-readablebytestream.js#block_00_block_00`, `parallel/test-whatwg-readablebytestream.js#block_01_block_01`, `parallel/test-whatwg-readablebytestream.js#block_02_block_02`, ... (+8) |
| uses --expose-internals and internal/errors/internal/validators | 11 | `parallel/test-errors-hide-stack-frames.js#block_00_block_00`, `parallel/test-errors-hide-stack-frames.js#block_01_block_01`, `parallel/test-errors-hide-stack-frames.js#block_02_block_02`, ... (+8) |
| inherited: requires --expose-internals and internal/socket_list | 10 | `parallel/test-internal-socket-list-receive.js#block_00_verify_that_the_message_won_t_be_sent_when_child_is_not_conn`, `parallel/test-internal-socket-list-receive.js#block_01_verify_that_a_node_socket_all_closed_message_will_be_sent`, `parallel/test-internal-socket-list-receive.js#block_02_verify_that_a_node_socket_count_message_will_be_sent`, ... (+7) |
| inherited: requires --expose-internals and internal/crypto/webidl | 9 | `parallel/test-webcrypto-webidl.js#block_19_hmackeygenparams_hmacimportparams`, `parallel/test-webcrypto-webidl.js#block_20_aeskeygenparams_aesderivedkeyparams`, `parallel/test-webcrypto-webidl.js#block_21_hkdfparams`, ... (+6) |
| requires internal/http2/util and internalBinding('http2') constants | 9 | `parallel/test-http2-util-headers-list.js#block_00_block_00`, `parallel/test-http2-util-headers-list.js#block_01_block_01`, `parallel/test-http2-util-headers-list.js#block_02_block_02`, ... (+6) |
| requires internal/http2/util kSocket and internal HTTP2 state | 9 | `parallel/test-http2-client-destroy.js#block_00_block_00`, `parallel/test-http2-client-destroy.js#block_01_test_destroy_before_client_operations`, `parallel/test-http2-client-destroy.js#block_02_test_destroy_before_goaway`, ... (+6) |
| inherited: requires --expose-internals and internal/fs/sync_write_stream | 8 | `parallel/test-internal-fs-syncwritestream.js#block_00_verify_constructing_the_instance_with_default_options`, `parallel/test-internal-fs-syncwritestream.js#block_01_verify_constructing_the_instance_with_specified_options`, `parallel/test-internal-fs-syncwritestream.js#block_02_verify_that_the_file_will_be_written_synchronously`, ... (+5) |
| inherited: uses --expose-internals and internal/test/binding primordials | 8 | `parallel/test-primordials-apply.js#block_00_block_00`, `parallel/test-primordials-apply.js#block_01_block_01`, `parallel/test-primordials-apply.js#block_02_block_02`, ... (+5) |
| requires internal/crypto/util | 8 | `parallel/test-webcrypto-keygen.js#block_00_test_invalid_algorithms`, `parallel/test-webcrypto-keygen.js#block_01_test_bad_usages`, `parallel/test-webcrypto-keygen.js#block_02_test_rsa_key_generation`, ... (+5) |
| uses --expose-internals and internal/errors | 8 | `parallel/test-error-aggregateTwoErrors.js#block_00_block_00`, `parallel/test-error-aggregateTwoErrors.js#block_01_block_01`, `parallel/test-error-aggregateTwoErrors.js#block_02_block_02`, ... (+5) |
| uses --expose-internals and require('internal/repl') | 8 | `parallel/test-repl-autocomplete.js`, `parallel/test-repl-envvars.js`, `parallel/test-repl-history-navigation.js`, ... (+5) |
| requires --expose-internals and internal/js_stream_socket | 7 | `parallel/test-wrap-js-stream-destroy.js#block_00_close_events_and_vice_versa`, `parallel/test-wrap-js-stream-destroy.js#block_01_destroy_the_streamwrap_and_test_again`, `parallel/test-wrap-js-stream-destroy.js#block_02_destroy_the_client_socket_and_test_again`, ... (+4) |
| requires --expose-internals and internalBinding('cares_wrap') | 7 | `parallel/test-dns-default-order-ipv4.js`, `parallel/test-dns-default-order-ipv6.js`, `parallel/test-dns-default-order-verbatim.js`, ... (+4) |
| requires internal/event_target, ERR_INVALID_ARG_TYPE validation, returnValue/cancelBubble/srcElement properties | 7 | `parallel/test-events-customevent.js#block_01_block_01`, `parallel/test-events-customevent.js#block_13_block_13`, `parallel/test-events-customevent.js#block_14_block_14`, ... (+4) |
| requires internal/http kOutHeaders symbol | 7 | `parallel/test-http-outgoing-internal-headers.js#block_00_block_00`, `parallel/test-http-outgoing-internal-headers.js#block_01_block_01`, `parallel/test-http-outgoing-internal-headers.js#block_02_block_02`, ... (+4) |
| uses --expose-internals and require('internal/http2/util') | 7 | `parallel/test-http2-client-socket-destroy.js`, `parallel/test-http2-create-client-secure-session.js`, `parallel/test-http2-server-http1-client.js`, ... (+4) |
| inherited: uses --expose-internals, internal/test/binding, and internal/dgram handle internals | 6 | `parallel/test-handle-wrap-hasref.js#block_00_child_process`, `parallel/test-handle-wrap-hasref.js#block_01_dgram_ipv4`, `parallel/test-handle-wrap-hasref.js#block_02_dgram_ipv6`, ... (+3) |
| requires --expose-internals and internal/test_runner/snapshot | 6 | `parallel/test-runner-snapshot-tests.js#test_00_snapshotmanager`, `parallel/test-runner-snapshot-tests.js#test_01_t_assert_snapshot_validation`, `parallel/test-runner-snapshot-tests.js#test_02_setresolvesnapshotpath`, ... (+3) |
| requires internal/timers | 6 | `parallel/test-timers-refresh.js#block_00_unref_d_timer`, `parallel/test-timers-refresh.js#block_01_should_throw_with_non_functions`, `parallel/test-timers-refresh.js#block_02_unref_pooled_timer`, ... (+3) |
| uses --expose-internals and internal/errors SystemError | 6 | `parallel/test-errors-systemerror-frozen-intrinsics.js`, `parallel/test-errors-systemerror-stackTraceLimit-custom-setter.js`, `parallel/test-errors-systemerror-stackTraceLimit-deleted-and-Error-sealed.js`, ... (+3) |
| directly tests internal/fs/utils validateOffsetLength* helpers | 5 | `parallel/test-fs-util-validateoffsetlength.js#block_00_block_00`, `parallel/test-fs-util-validateoffsetlength.js#block_01_block_01`, `parallel/test-fs-util-validateoffsetlength.js#block_02_block_02`, ... (+2) |
| imports internal/modules/esm/{loader,module_map,module_job,create_dynamic_module} | 5 | `es-module/test-esm-loader-modulemap.js#block_00_are_stored_in_the_map`, `es-module/test-esm-loader-modulemap.js#block_01_values_as_url_argument`, `es-module/test-esm-loader-modulemap.js#block_02_values_or_the_kasserttype_symbol_as_type_argument`, ... (+2) |
| requires --expose-internals and internal/util | 5 | `parallel/test-internal-util-assertCrypto.js`, `parallel/test-internal-util-classwrapper.js`, `parallel/test-internal-util-helpers.js`, ... (+2) |
| requires --expose-internals, internal/fs/utils, and internal/test/binding constants.fs | 5 | `parallel/test-fs-utils-get-dirents.js#block_04_block_04`, `parallel/test-fs-utils-get-dirents.js#block_05_getdirent`, `parallel/test-fs-utils-get-dirents.js#block_06_block_06`, ... (+2) |
| requires private _http_server.kConnectionsCheckingInterval internals | 5 | `parallel/test-http-server-async-dispose.js`, `parallel/test-http-server-clear-timer.js`, `parallel/test-http-server-close-destroy-timeout.js`, ... (+2) |
| uses --expose-internals with internalBinding('http2') and internal/http2/util | 5 | `parallel/test-http2-client-onconnect-errors.js`, `parallel/test-http2-info-headers-errors.js`, `parallel/test-http2-respond-nghttperrors.js`, ... (+2) |
| imports internal/fs/utils validateRmOptionsSync | 4 | `parallel/test-fs-rm.js#block_00_test_the_asynchronous_version`, `parallel/test-fs-rm.js#block_01_test_the_synchronous_version`, `parallel/test-fs-rm.js#block_02_test_input_validation`, ... (+1) |
| imports internal/fs/utils validateRmdirOptions | 4 | `parallel/test-fs-rmdir-recursive.js#block_00_test_the_asynchronous_version`, `parallel/test-fs-rmdir-recursive.js#block_01_test_the_synchronous_version`, `parallel/test-fs-rmdir-recursive.js#block_02_test_input_validation`, ... (+1) |
| inherited: requires --expose-internals and internal/priority_queue | 4 | `parallel/test-priority-queue.js#block_02_block_02`, `parallel/test-priority-queue.js#block_03_block_03`, `parallel/test-priority-queue.js#block_04_block_04`, ... (+1) |
| requires --expose-internals and internal/util customInspectSymbol | 4 | `parallel/test-whatwg-encoding-custom-interop.js#block_00_test_textencoder`, `parallel/test-whatwg-encoding-custom-interop.js#block_01_block_01`, `parallel/test-whatwg-encoding-custom-interop.js#block_02_block_02`, ... (+1) |
| requires --expose-internals, inspect integration, and internal EventTarget APIs | 4 | `parallel/test-eventtarget.js#block_13_block_13`, `parallel/test-eventtarget.js#block_14_block_14`, `parallel/test-eventtarget.js#block_15_block_15`, ... (+1) |
| requires internal/test/binding and internalBinding('uv') | 4 | `parallel/test-fs-access.js#block_00_block_00`, `parallel/test-fs-access.js#block_01_block_01`, `parallel/test-fs-access.js#block_02_block_02`, ... (+1) |
| requires internal/util.sleep | 4 | `parallel/test-timers-nested.js`, `parallel/test-timers-next-tick.js`, `parallel/test-util-sleep.js`, ... (+1) |
| uses --expose-internals and internal/dgram kStateSymbol | 4 | `parallel/test-dgram-close-during-bind.js`, `parallel/test-dgram-close.js`, `parallel/test-dgram-recv-error.js`, ... (+1) |
| uses --expose-internals with internal/errors and internal/test/binding | 4 | `parallel/test-buffer-fill.js#block_00_block_00`, `parallel/test-buffer-fill.js#block_01_block_01`, `parallel/test-buffer-fill.js#block_02_symbol_toprimitive`, ... (+1) |
| directly tests internal/fs/utils getDirents with internal constants | 3 | `parallel/test-fs-utils-get-dirents.js#block_00_block_00`, `parallel/test-fs-utils-get-dirents.js#block_01_getdirents`, `parallel/test-fs-utils-get-dirents.js#block_02_block_02` |
| explicitly tests private timers._unrefActive()/enroll()/unenroll() behavior | 3 | `parallel/test-timers-unref-active.js`, `parallel/test-timers-unref-remove-other-unref-timers-only-one-fires.js`, `parallel/test-timers-unref-remove-other-unref-timers.js` |
| inherited: requires --expose-internals and internal/crypto/x509 | 3 | `parallel/test-crypto-x509.js#block_00_block_00`, `parallel/test-crypto-x509.js#block_01_block_01`, `parallel/test-crypto-x509.js#block_02_block_02` |
| inherited: requires --expose-internals and internal/fixed_queue | 3 | `parallel/test-fixed-queue.js#block_00_block_00`, `parallel/test-fixed-queue.js#block_01_block_01`, `parallel/test-fixed-queue.js#block_02_block_02` |
| inherited: requires --expose-internals and internalBinding('cares_wrap') to stub getaddrinfo | 3 | `parallel/test-dns-lookup.js#block_00_block_00`, `parallel/test-dns-lookup.js#block_01_block_01`, `parallel/test-dns-lookup.js#block_02_block_02` |
| inherited: uses --expose-internals with dgram._createSocketHandle and internal/test/binding | 3 | `parallel/test-dgram-create-socket-handle-fd.js#block_00_return_a_negative_number_if_the_existing_fd_is_invalid`, `parallel/test-dgram-create-socket-handle-fd.js#block_01_return_a_negative_number_if_the_type_of_fd_is_not_udp`, `parallel/test-dgram-create-socket-handle-fd.js#block_02_create_a_bound_handle` |
| requires --expose-internals and internal/options | 3 | `parallel/test-options-binding.js`, `parallel/test-pending-deprecation.js`, `parallel/test-worker-cli-options.js` |
| requires internal/test/binding and internalBinding('js_stream') | 3 | `parallel/test-util-types.js#block_00_block_00`, `parallel/test-util-types.js#block_01_block_01`, `parallel/test-util-types.js#block_02_block_02` |
| requires internal/test/binding internalBinding('tcp_wrap') | 3 | `parallel/test-tcp-wrap-connect.js`, `parallel/test-tcp-wrap-listen.js`, `parallel/test-tcp-wrap.js` |
| uses --expose-internals and internal/errors AbortError | 3 | `parallel/test-errors-aborterror.js#block_00_block_00`, `parallel/test-errors-aborterror.js#block_01_block_01`, `parallel/test-errors-aborterror.js#block_02_block_02` |
| uses --expose-internals and internalBinding('trace_events') | 3 | `parallel/test-trace-events-api.js`, `parallel/test-trace-events-category-used.js`, `parallel/test-trace-events-get-category-enabled-buffer.js` |
| uses --expose-internals and internalBinding('uv') | 3 | `parallel/test-ttywrap-invalid-fd.js`, `parallel/test-uv-errmap.js`, `parallel/test-uv-errno.js` |
| asserts private req._readableState and exact req/res close ordering | 2 | `parallel/test-http-req-res-close.js#block_00_after_res`, `parallel/test-http-req-res-close.js#block_01_req_should_emit_close_after_res` |
| asserts private req.socket.parser.free lifecycle from Node internals | 2 | `parallel/test-http-server-connection-list-when-close.js#block_00_block_00`, `parallel/test-http-server-connection-list-when-close.js#block_01_block_01` |
| checks Node source-tree release changelog files, not runtime API | 2 | `parallel/test-release-changelog.js#block_00_check_changelog_v_md`, `parallel/test-release-changelog.js#block_01_main_changelog_md_checks` |
| depends on Node's internal JSTransferable protocol (messaging_transfer_symbol) | 2 | `parallel/test-worker-message-port-transfer-fake-js-transferable-internal.js`, `parallel/test-worker-message-port-transfer-fake-js-transferable.js` |
| inherited: exercises non-public listen(handle/_handle/fd) paths via internal tcp/pipe bindings | 2 | `parallel/test-net-server-listen-handle.js#block_00_not_a_public_api_used_by_child_process`, `parallel/test-net-server-listen-handle.js#block_01_block_01` |
| inherited: requires --expose-internals and internal/fs/utils | 2 | `parallel/test-internal-fs.js#block_00_test_junction_symlinks`, `parallel/test-internal-fs.js#block_01_test_none_junction_symlinks` |
| inherited: requires --expose-internals and internal/test/binding internalBinding('performance') | 2 | `parallel/test-performanceobserver.js#block_00_block_00`, `parallel/test-performanceobserver.js#block_01_test_non_buffered` |
| inherited: requires internal/net.normalizedArgsSymbol and private net._normalizeArgs | 2 | `parallel/test-net-normalize-args.js#block_00_connecting_to_the_server_should_fail_with_a_standard_array`, `parallel/test-net-normalize-args.js#block_01_connecting_to_the_server_should_succeed_with_a_normalized_ar` |
| inherited: uses --expose-internals and internal/test/binding (internalBinding('config')) | 2 | `parallel/test-icu-data-dir.js#block_00_block_00`, `parallel/test-icu-data-dir.js#block_01_block_01` |
| inherited: uses --expose-internals and internal/test/binding internalBinding() | 2 | `parallel/test-accessor-properties.js#test_00_should_throw_instead_of_raise_assertions`, `parallel/test-accessor-properties.js#test_01_there_are_accessor_properties_in_crypto_too` |
| inherited: uses --expose-internals and internal/util customInspectSymbol | 2 | `parallel/test-compression-decompression-stream.js#test_00_decompressionstream_kinspect_method`, `parallel/test-compression-decompression-stream.js#test_01_compressionstream_kinspect_method` |
| inherited: uses --expose-internals with internal/dgram and internal/test/binding | 2 | `parallel/test-dgram-bind-fd-error.js#block_00_throw_when_the_fd_is_occupied_according_to_https_github_com_`, `parallel/test-dgram-bind-fd-error.js#block_01_throw_when_the_type_of_fd_is_not_udp` |
| patches internal/fs/promises FileHandle fd/close internals | 2 | `parallel/test-fs-promises-file-handle-aggregate-errors.js`, `parallel/test-fs-promises-file-handle-close-errors.js` |
| requires --expose-internals and internal/error_serdes | 2 | `sequential/test-error-serdes.js#block_00_block_00`, `sequential/test-error-serdes.js#block_01_block_01` |
| requires --expose-internals and internal/priority_queue | 2 | `parallel/test-priority-queue.js#block_00_block_00`, `parallel/test-priority-queue.js#block_01_block_01` |
| requires --expose-internals and internal/timers | 2 | `parallel/test-child-process-http-socket-leak.js`, `parallel/test-tls-wrap-timeout.js` |
| requires --expose-internals and node:internal/modules/esm/resolve | 2 | `es-module/test-cjs-legacyMainResolve-permission.js`, `es-module/test-cjs-legacyMainResolve.js` |
| requires --expose-internals and require('internal/js_stream_socket') | 2 | `parallel/test-stream-wrap-encoding.js#block_00_block_00`, `parallel/test-stream-wrap-encoding.js#block_01_block_01` |
| requires --expose-internals plus internal/js_stream_socket and internalBinding('stream_wrap') | 2 | `parallel/test-stream-wrap-drain.js`, `parallel/test-stream-wrap.js` |
| requires internal _tls_common module | 2 | `parallel/test-tls-translate-peer-certificate.js#block_00_block_00`, `parallel/test-tls-translate-peer-certificate.js#block_01_block_01` |
| requires internal/http2/util.updateOptionsBuffer and internalBinding('http2').optionsBuffer | 2 | `parallel/test-http2-util-update-options-buffer.js#block_00_block_00`, `parallel/test-http2-util-update-options-buffer.js#block_01_block_01` |
| requires internal/quic/quic classes (non-public API) | 2 | `parallel/test-quic-internal-endpoint-listen-defaults.js`, `parallel/test-quic-internal-endpoint-options.js` |
| requires internal/streams/add-abort-signal helper | 2 | `parallel/test-stream-add-abort-signal.js#block_00_block_00`, `parallel/test-stream-add-abort-signal.js#block_01_block_01` |
| requires internal/test/binding internalBinding('timers') | 2 | `parallel/test-timers-now.js`, `parallel/test-timers-ordering.js` |
| requires internal/v8_prof_polyfill | 2 | `parallel/test-tick-processor-version-check.js#block_00_block_00`, `parallel/test-tick-processor-version-check.js#block_01_block_01` |
| requires private modules _http_outgoing and internal/streams/state | 2 | `parallel/test-http-server-options-highwatermark.js#block_00_block_00`, `parallel/test-http-server-options-highwatermark.js#block_01_block_01` |
| uses --expose-internals and internal/async_hooks symbols | 2 | `parallel/test-async-hooks-http-agent-destroy.js`, `parallel/test-async-hooks-http-agent.js` |
| uses --expose-internals and internal/http2/core | 2 | `parallel/test-http2-invalid-last-stream-id.js`, `parallel/test-http2-options-max-headers-exceeds-nghttp2.js` |
| uses --expose-internals and internal/test/binding | 2 | `parallel/test-process-binding.js`, `parallel/test-worker-message-port-transfer-native.js#block_01_block_01` |
| uses --expose-internals and internal/test/binding internalBinding('http2') | 2 | `parallel/test-http2-binding.js`, `parallel/test-http2-respond-errors.js` |
| uses --expose-internals and require('internal/timers') | 2 | `parallel/test-http2-compat-socket.js`, `parallel/test-http2-socket-proxy.js` |
| uses --expose-internals to monkey-patch internalBinding('crypto').SecureContext | 2 | `parallel/test-tls-clientcertengine-unsupported.js`, `parallel/test-tls-keyengine-unsupported.js` |
| uses --expose-internals with internal/dgram _createSocketHandle and internal/test/binding | 2 | `parallel/test-dgram-create-socket-handle.js#block_00_block_00`, `parallel/test-dgram-create-socket-handle.js#block_01_block_01` |
| uses --expose-internals with internal/test/binding and V8 native syntax | 2 | `parallel/test-buffer-write-fast.js`, `parallel/test-debug-v8-fast-api.js` |
| uses --expose-internals with internalBinding('tls_wrap') | 2 | `parallel/test-tls-enable-trace-cli.js`, `parallel/test-tls-enable-trace.js` |
| uses common/net.hasMultiLocalhost(), which depends on internalBinding('tcp_wrap') | 2 | `parallel/test-http-localaddress.js`, `parallel/test-https-localaddress.js` |
| uses internal/test/binding UV constants and watcher._handle internals | 2 | `parallel/test-fs-watch-enoent.js#block_00_block_00`, `parallel/test-fs-watch-enoent.js#block_01_block_01` |
| uses private server/socket _handle internals | 2 | `parallel/test-net-server-keepalive.js`, `parallel/test-net-server-nodelay.js` |
| Windows-only test that also imports node:internal/modules/esm/resolve and internal/modules/run_main | 1 | `es-module/test-esm-long-path-win.js` |
| asserts deprecated timers.active() behavior and private _idle* timer fields | 1 | `parallel/test-timers-active.js` |
| asserts exact process.moduleLoadList bootstrap internals | 1 | `parallel/test-bootstrap-modules.js` |
| asserts internal socket.parser lifecycle around HTTP upgrade | 1 | `parallel/test-http-parser-freed-before-upgrade.js` |
| asserts internal zlib native-handle weak-reference/external-memory behavior | 1 | `parallel/test-zlib-unused-weak.js` |
| asserts private Resolver._handle behavior | 1 | `parallel/test-dns-get-server.js` |
| asserts private Timer._destroyed state on timeout/interval objects | 1 | `parallel/test-timers-destroyed.js` |
| asserts private internal/http kOutHeaders state | 1 | `parallel/test-http-correct-hostname.js` |
| asserts private req._dumped internal state | 1 | `parallel/test-http-pause-no-dump.js` |
| asserts private req.socket.parser.incoming lifecycle after keep-alive request end | 1 | `parallel/test-http-server-keepalive-end.js` |
| asserts private zlib stream _closed state after error | 1 | `parallel/test-zlib-close-after-error.js` |
| asserts private zlib stream _handle cleanup semantics | 1 | `parallel/test-zlib-destroy.js#block_00_block_00` |
| checks Node source-tree deps/corepack package metadata, not runtime API | 1 | `parallel/test-corepack-version.js` |
| checks Node source-tree deps/npm package.json artifact, not runtime API | 1 | `parallel/test-npm-version.js` |
| checks bundled deps/npm release artifact in Node source tree, not runtime API | 1 | `parallel/test-release-npm.js` |
| depends on ChildProcess internalMessage event semantics | 1 | `parallel/test-child-process-internal.js` |
| depends on Node benchmark sources (benchmark/_cli.js), not public runtime API | 1 | `parallel/test-benchmark-cli.js` |
| depends on Node source tree files under tools/icu and deps/v8 | 1 | `parallel/test-icu-minimum-version.js` |
| depends on Node source-tree config.gypi build artifact | 1 | `parallel/test-process-config.js` |
| depends on Node source-tree deps/* package metadata and process.config build internals | 1 | `parallel/test-process-versions.js` |
| depends on experimental Module._stat and CommonJS loader implementation details | 1 | `parallel/test-vfs.js` |
| depends on net.Server internal _handle.getsockname behavior | 1 | `parallel/test-socket-address.js` |
| depends on non-public net.Socket handle injection semantics | 1 | `parallel/test-net-socket-setnodelay.js` |
| depends on private process.stdin._handle close/unref internals | 1 | `parallel/test-stdout-close-unref.js` |
| directly tests internal/fs/utils getDirent with internal constants | 1 | `parallel/test-fs-utils-get-dirents.js#block_03_block_03` |
| directly tests internal/fs/utils stringToFlags | 1 | `parallel/test-fs-open-flags.js` |
| directly tests internal/http2/util helpers via --expose-internals | 1 | `parallel/test-http2-misc-util.js` |
| directly tests internal/url.isURL | 1 | `parallel/test-url-is-url-internal.js` |
| directly tests internal/util.emitExperimentalWarning() | 1 | `parallel/test-util-emit-experimental-warning.js` |
| directly tests internal/util.normalizeEncoding() | 1 | `parallel/test-internal-util-normalizeencoding.js` |
| imports internal/modules/esm/assert (Node internal module) | 1 | `es-module/test-esm-import-attributes-validation.js` |
| imports internal/modules/esm/resolve (Node internal module) | 1 | `es-module/test-esm-loader-search.js` |
| inherited: requires --expose-internals and internal/util | 1 | `parallel/test-internal-util-objects.js#block_00_block_00` |
| invokes private req.client._events.close handlers directly | 1 | `parallel/test-http-req-close-robust-from-tampering.js` |
| monkey-patches internalBinding('http_parser') and uses _http_common internals | 1 | `parallel/test-http-parser-lazy-loaded.js` |
| monkey-patches internalBinding('os') | 1 | `parallel/test-os-checked-function.js` |
| monkey-patches internalBinding('tcp_wrap').TCP prototype | 1 | `parallel/test-net-persistent-nodelay.js` |
| monkey-patches internalBinding('tcp_wrap').TCP ref/unref internals | 1 | `parallel/test-net-persistent-ref-unref.js` |
| mutates Agent.freeSockets/addRequest with synthetic socket internals | 1 | `parallel/test-http-agent-uninitialized.js` |
| mutates Agent.freeSockets/addRequest with synthetic socket._handle internals | 1 | `parallel/test-http-agent-uninitialized-with-handle.js` |
| patches internal/fs/promises FileHandle fd internals | 1 | `parallel/test-fs-promises-file-handle-op-errors.js` |
| patches internalBinding('fs') internals via internal/test/binding | 1 | `parallel/test-fs-sync-fd-leak.js` |
| patches internalBinding('fs') via internal/test/binding | 1 | `parallel/test-fs-promises-readfile.js` |
| patches internalBinding('fs').readdir and uses UV_DIRENT internals | 1 | `parallel/test-fs-readdir-types.js` |
| relies on common/gc onGC tracking of internal zlib handle lifetime | 1 | `parallel/test-zlib-invalid-input-memory.js` |
| requires --expose-internals and child_process IPC to validate internal module visibility | 1 | `parallel/test-internal-module-require.js` |
| requires --expose-internals and internal/assert | 1 | `parallel/test-internal-assert.js` |
| requires --expose-internals and internal/cluster/round_robin_handle | 1 | `parallel/test-cluster-accept-fail.js` |
| requires --expose-internals and internal/crypto/util | 1 | `parallel/test-webcrypto-util.js` |
| requires --expose-internals and internal/crypto/webcrypto | 1 | `parallel/test-global-webcrypto-classes.js` |
| requires --expose-internals and internal/dgram | 1 | `sequential/test-dgram-implicit-bind-failure.js` |
| requires --expose-internals and internal/encoding | 1 | `parallel/test-whatwg-encoding-custom-internals.js` |
| requires --expose-internals and internal/errors + internal/test/binding | 1 | `parallel/test-dns-memory-error.js` |
| requires --expose-internals and internal/errors AbortError | 1 | `parallel/test-webstream-readablestream-pipeto.js` |
| requires --expose-internals and internal/event_target (kEvents) | 1 | `parallel/test-events-once.js` |
| requires --expose-internals and internal/event_target (kWeakHandler) | 1 | `parallel/test-abortcontroller-internal.js` |
| requires --expose-internals and internal/freelist | 1 | `parallel/test-freelist.js` |
| requires --expose-internals and internal/navigator | 1 | `parallel/test-navigator.js` |
| requires --expose-internals and internal/test/binding | 1 | `parallel/test-internal-only-binding.js` |
| requires --expose-internals and internal/test/binding + internal/worker/io | 1 | `parallel/test-worker-message-not-serializable.js` |
| requires --expose-internals and internal/test/transfer | 1 | `parallel/test-messaging-marktransfermode.js` |
| requires --expose-internals and internal/util/inspect | 1 | `parallel/test-icu-stringwidth.js` |
| requires --expose-internals and internal/validators | 1 | `parallel/test-internal-validators-validateport.js` |
| requires --expose-internals and internal/webidl | 1 | `parallel/test-internal-webidl-converttoint.js` |
| requires --expose-internals and internal/webstreams/util | 1 | `parallel/test-whatwg-webstreams-coverage.js` |
| requires --expose-internals and internal/worker | 1 | `parallel/test-worker-environmentdata.js` |
| requires --expose-internals and internalBinding('cares_wrap') to stub getaddrinfo | 1 | `parallel/test-dns-lookup-promises.js` |
| requires --expose-internals and internalBinding('module_wrap') | 1 | `parallel/test-internal-module-wrap.js` |
| requires --expose-internals internalBinding('fs').internalModuleStat | 1 | `parallel/test-permission-fs-internal-module-stat.js` |
| requires --expose-internals, internal/util, and internal/test/binding | 1 | `parallel/test-internal-util-decorate-error-stack.js` |
| requires deprecated private _stream_wrap module | 1 | `parallel/test-warn-stream-wrap.js` |
| requires internal/child_process via --expose-internals | 1 | `parallel/test-child-process-recv-handle.js` |
| requires internal/dgram and internal/test/binding | 1 | `parallel/test-dgram-create-socket-handle.js#block_02_block_02` |
| requires internal/errors | 1 | `parallel/test-util.js` |
| requires internal/fs/utils BigIntStats | 1 | `parallel/test-fs-watchfile-bigint.js` |
| requires internal/js_stream_socket and --expose-internals | 1 | `parallel/test-http-agent-domain-reused-gc.js` |
| requires internal/linkedlist | 1 | `parallel/test-timers-linked-list.js` |
| requires internal/options.getOptionValue('--max-http-header-size') | 1 | `parallel/test-http-max-http-headers.js` |
| requires internal/quic/quic and internal/quic/symbols | 1 | `parallel/test-quic-internal-endpoint-stats-state.js` |
| requires internal/readline/utils via --expose-internals | 1 | `parallel/test-readline-csi.js` |
| requires internal/socketaddress and internal/test/binding | 1 | `parallel/test-socketaddress.js` |
| requires internal/streams/state.getDefaultHighWaterMark() | 1 | `parallel/test-http-outgoing-buffer.js` |
| requires internal/test/binding and credentials internalBinding | 1 | `parallel/test-safe-get-env.js` |
| requires internal/test/binding and internalBinding('contextify') | 1 | `parallel/test-util-sigint-watchdog.js` |
| requires internal/test/binding signal_wrap internalBinding | 1 | `parallel/test-signal-safety.js` |
| requires internal/test/binding('uv') and internal/async_hooks symbols | 1 | `parallel/test-http-client-immediate-error.js` |
| requires internal/test_runner/utils.convertStringToRegExp | 1 | `parallel/test-runner-string-to-regexp.js` |
| requires internal/timers TIMEOUT_MAX | 1 | `parallel/test-runner-mock-timers.js` |
| requires internal/timers kTimeout symbol | 1 | `parallel/test-http-client-timeout-on-connect.js` |
| requires internalBinding('js_stream').JSStream | 1 | `parallel/test-js-stream-call-properties.js` |
| requires internalBinding('pipe_wrap') to construct raw Pipe handles | 1 | `parallel/test-net-connect-options-fd.js` |
| requires internalBinding('quic').setCallbacks | 1 | `parallel/test-quic-internal-setcallbacks.js` |
| requires internalBinding('tcp_wrap') handle APIs (plus cluster path) | 1 | `parallel/test-net-listen-handle-in-cluster-2.js` |
| requires internalBinding('trace_events') | 1 | `parallel/test-trace-events-binding.js` |
| requires internalBinding('tty_wrap').TTY | 1 | `parallel/test-stream-base-prototype-accessors-enumerability.js` |
| requires internalBinding('util').getProxyDetails | 1 | `parallel/test-util-inspect-proxy.js` |
| requires internalBinding('util').privateSymbols | 1 | `parallel/test-util-internal.js` |
| requires internalBinding('uv') and internalBinding('stream_wrap') | 1 | `parallel/test-net-end-close.js` |
| requires private core module _http_outgoing | 1 | `parallel/test-outgoing-message-pipe.js` |
| second block asserts private EventEmitter kCapture symbol initialization details | 1 | `parallel/test-domain-ee.js` |
| tests deprecated internal timers.enroll() validation/error paths | 1 | `parallel/test-timers-enroll-invalid-msecs.js` |
| uses --expose-internals and imports node:internal/modules/esm/get_format | 1 | `es-module/test-esm-url-extname.js` |
| uses --expose-internals and internal/errors formatList | 1 | `parallel/test-error-format-list.js` |
| uses --expose-internals and internal/http2/util | 1 | `parallel/test-http2-misbehaving-multiplex.js` |
| uses --expose-internals and internal/http2/util internals | 1 | `parallel/test-http2-client-http1-server.js` |
| uses --expose-internals and internal/http2/{util,core} | 1 | `parallel/test-http2-server-sessionerror.js` |
| uses --expose-internals and internal/options | 1 | `parallel/test-unicode-node-options.js` |
| uses --expose-internals and internal/test/binding async_wrap | 1 | `parallel/test-async-wrap-destroyid.js` |
| uses --expose-internals and internal/test/binding internalBinding('builtins') | 1 | `parallel/test-code-cache.js` |
| uses --expose-internals and internal/test/binding internalBinding('constants') | 1 | `parallel/test-binding-constants.js` |
| uses --expose-internals and internal/test/binding internalBinding('process_methods') | 1 | `parallel/test-dummy-stdio.js` |
| uses --expose-internals and internal/test/binding internalBinding('udp_wrap') | 1 | `parallel/test-dgram-bind-fd.js` |
| uses --expose-internals and internal/test/binding udp_wrap/tcp_wrap | 1 | `parallel/test-env-newprotomethod-remove-unnecessary-prototypes.js` |
| uses --expose-internals and internal/util/debuglog | 1 | `parallel/test-console-formatTime.js` |
| uses --expose-internals and internalBinding('tls_wrap') | 1 | `parallel/test-tls-wrap-no-abort.js` |
| uses --expose-internals and internalBinding('tty_wrap') | 1 | `parallel/test-tty-backwards-api.js` |
| uses --expose-internals and require('internal/data_url') | 1 | `parallel/test-data-url.js` |
| uses --expose-internals and require('internal/repl/await') | 1 | `parallel/test-repl-preprocess-top-level-await.js` |
| uses --expose-internals and require('internal/util/inspect') | 1 | `parallel/test-repl-top-level-await.js` |
| uses --expose-internals and require('internal/util/inspector') | 1 | `parallel/test-inspector-has-inspector-false.js` |
| uses --expose-internals plus Node internals (require('internal/...'), process.binding('natives')) | 1 | `es-module/test-loaders-hidden-from-users.js` |
| uses --expose-internals with internal/test/binding (internalBinding('crypto')) | 1 | `parallel/test-crypto-fips.js` |
| uses --expose-internals with internal/test/binding (internalBinding('udp_wrap')) | 1 | `parallel/test-cluster-dgram-bind-fd.js` |
| uses --expose-internals with internal/test/binding (internalBinding('util')) | 1 | `parallel/test-buffer-backing-arraybuffer.js` |
| uses --expose-internals with internal/test/binding and internal worker message types | 1 | `parallel/test-worker-message-type-unknown.js` |
| uses --expose-internals with internalBinding('cares_wrap').canonicalizeIP | 1 | `parallel/test-tls-canonical-ip.js` |
| uses --expose-internals with internalBinding('stream_wrap').ShutdownWrap | 1 | `parallel/test-tls-close-notify.js` |
| uses --expose-internals with require('internal/net') | 1 | `parallel/test-tls-reinitialize-listeners.js` |
| uses ../common/net helper which depends on internal/test/binding tcp_wrap internals | 1 | `parallel/test-http2-connect-options.js` |
| uses _http_common.HTTPParser and socket.parser internals | 1 | `parallel/test-http-parser-memory-retention.js` |
| uses deprecated process.binding('uv') internal API | 1 | `parallel/test-err-name-deprecation.js` |
| uses internal process.binding API semantics | 1 | `parallel/test-permission-processbinding.js` |
| uses internal process.binding allowlist modules | 1 | `parallel/test-process-binding-internalbinding-allowlist.js` |
| uses internal process.binding('http_parser') HTTPParser internals | 1 | `parallel/test-http-parser-timeout-reset.js` |
| uses internal process.binding('util') API | 1 | `parallel/test-process-binding-util.js` |
| uses internal/test/binding and internal/fs/utils internals | 1 | `parallel/test-fs-filehandle.js` |
| uses internalBinding('constants') which is a Node.js internal API | 1 | `parallel/test-constants.js` |
| uses private `_http_common.parsers.max` internals | 1 | `parallel/test-http-set-max-idle-http-parser.js` |
| uses private `_http_common.parsers` and `HTTPParser` internals | 1 | `sequential/test-http-regr-gh-2928.js` |
| uses undocumented process._getActiveHandles() | 1 | `parallel/test-process-getactivehandles.js` |
| uses undocumented process._getActiveRequests() | 1 | `parallel/test-process-getactiverequests.js` |
| uses undocumented process._rawDebug() | 1 | `parallel/test-process-raw-debug.js` |
| uses undocumented process.binding('module_wrap') | 1 | `parallel/test-internal-process-binding.js` |
| uses undocumented process.reallyExit internal hook | 1 | `parallel/test-process-really-exit.js` |
| validates Node repository docs/source files (doc/api and src/node_options.cc) | 1 | `parallel/test-cli-node-options-docs.js` |
| validates Node source tree documentation file doc/api/cli.md | 1 | `parallel/test-process-env-allowed-flags-are-documented.js` |

## Config Hygiene

21 non-runnable entries are missing a reason.

<details>
<summary>Entries missing reasons</summary>

- `parallel/test-cli-node-options-disallowed.js` (Node.js internals)
- `parallel/test-crypto-prime.js#block_00_block_00` (Node.js internals)
- `parallel/test-crypto-prime.js#block_01_block_01` (Node.js internals)
- `parallel/test-crypto-prime.js#block_02_block_02` (Node.js internals)
- `parallel/test-crypto-prime.js#block_03_block_03` (Node.js internals)
- `parallel/test-crypto-prime.js#block_04_block_04` (Node.js internals)
- `parallel/test-crypto-prime.js#block_05_block_05` (Node.js internals)
- `parallel/test-crypto-prime.js#block_06_block_06` (Node.js internals)
- `parallel/test-crypto-prime.js#block_07_block_07` (Node.js internals)
- `parallel/test-crypto-prime.js#block_08_block_08` (Node.js internals)
- `parallel/test-fs-syncwritestream.js` (Node.js internals)
- `parallel/test-fs-watch-abort-signal.js#block_00_block_00` (Node.js internals)
- `parallel/test-fs-watch-abort-signal.js#block_01_block_01` (Node.js internals)
- `parallel/test-webcrypto-derivebits.js#block_01_test_hkdf_bit_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivebits.js#block_02_test_pbkdf2_bit_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivekey.js#block_01_test_hkdf_key_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivekey.js#block_02_test_pbkdf2_key_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivekey.js#block_04_block_04` (Node.js internals)
- `sequential/test-crypto-timing-safe-equal.js#block_00_block_00` (Node.js internals)
- `sequential/test-crypto-timing-safe-equal.js#block_01_block_01` (Node.js internals)
- `sequential/test-crypto-timing-safe-equal.js#block_02_block_02` (Node.js internals)

</details>
