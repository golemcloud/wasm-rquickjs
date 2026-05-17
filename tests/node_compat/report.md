# Node.js v22.14.0 Compatibility Inventory

Generated: 2026-05-17 | Source: `tests/node_compat/config.jsonc` | Engine: wasm-rquickjs (QuickJS)

This report is generated from `config.jsonc` only. It does **not** run the vendored tests itself. Entries classified as `runnable` are reported as passing because the `node_compat` PR test executes runnable entries and fails CI if any of them fail.

## Summary

Primary compatibility is measured over the public API surface we can provide: CI-enforced passing (`runnable`) plus `known-gap`. WASI-impossible tests, engine differences, unevaluated tests, and Node.js-internals tests are acknowledged separately and excluded from the primary percentage.

**Primary compatibility (CI-enforced):** 3050/4232 (72.1%)

| Classification | Count | Primary % | Public inventory % | All listed % |
|----------------|-------|-----------|--------------------|--------------|
| ✅ passing (runnable) | 3050 | 72.1% | 53.4% | 45.3% |
| 🧩 known gap | 1182 | 27.9% | 20.7% | 17.6% |
| 🚫 WASI-impossible (excluded) | 1310 | — | 22.9% | 19.5% |
| ⚙️ engine difference (excluded) | 68 | — | 1.2% | 1.0% |
| ❔ unevaluated (excluded) | 101 | — | 1.8% | 1.5% |
| 🔒 Node.js internals (excluded) | 1023 | — | — | 15.2% |
| **Total** | **6734** |  |  | **100.0%** |

Secondary full-public compatibility, including public tests that are currently excluded from primary: **3050/5711 (53.4%)**.

## Inventory by Module

| Module | Total | Passing | Gap | WASI-impossible | Engine diff | Unevaluated | Internals | Primary % | Public compatibility % |
|--------|-------|----------|-----|-----------------|-------------|-------------|-----------|-----------|--------------------|
| abort | 28 | 26 | 1 | 0 | 0 | 0 | 1 | 96.3% | 96.3% |
| assert | 95 | 95 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| async_hooks | 38 | 4 | 32 | 0 | 0 | 0 | 2 | 11.1% | 11.1% |
| blob | 24 | 2 | 0 | 0 | 0 | 0 | 22 | 100.0% | 100.0% |
| buffer | 180 | 173 | 1 | 0 | 0 | 0 | 6 | 99.4% | 99.4% |
| child_process | 208 | 18 | 87 | 94 | 0 | 0 | 9 | 17.1% | 9.0% |
| cli | 32 | 11 | 18 | 0 | 0 | 1 | 2 | 37.9% | 36.7% |
| cluster | 87 | 0 | 0 | 87 | 0 | 0 | 0 | 0.0% | 0.0% |
| common | 9 | 1 | 8 | 0 | 0 | 0 | 0 | 11.1% | 11.1% |
| compile | 15 | 0 | 0 | 15 | 0 | 0 | 0 | 0.0% | 0.0% |
| console | 31 | 29 | 1 | 0 | 0 | 0 | 1 | 96.7% | 96.7% |
| crypto | 239 | 208 | 10 | 0 | 0 | 0 | 21 | 95.4% | 95.4% |
| dgram | 118 | 19 | 75 | 5 | 0 | 6 | 13 | 20.2% | 18.1% |
| diagnostics_channel | 33 | 18 | 14 | 1 | 0 | 0 | 0 | 56.2% | 54.5% |
| dns | 42 | 2 | 28 | 0 | 0 | 0 | 12 | 6.7% | 6.7% |
| domain | 61 | 24 | 21 | 12 | 0 | 4 | 0 | 53.3% | 39.3% |
| encoding | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| errors | 46 | 0 | 1 | 1 | 0 | 2 | 42 | 0.0% | 0.0% |
| eslint | 24 | 0 | 0 | 24 | 0 | 0 | 0 | 0.0% | 0.0% |
| events | 93 | 59 | 2 | 0 | 0 | 0 | 32 | 96.7% | 96.7% |
| fetch | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| fs | 482 | 396 | 15 | 0 | 0 | 0 | 71 | 96.4% | 96.4% |
| global | 11 | 4 | 5 | 0 | 0 | 0 | 2 | 44.4% | 44.4% |
| heap | 22 | 0 | 0 | 22 | 0 | 0 | 0 | 0.0% | 0.0% |
| http | 898 | 251 | 288 | 322 | 0 | 0 | 37 | 46.6% | 29.2% |
| inspector | 95 | 1 | 0 | 94 | 0 | 0 | 0 | 100.0% | 1.1% |
| internal | 53 | 0 | 0 | 0 | 0 | 0 | 53 | 0.0% | 0.0% |
| module | 184 | 108 | 42 | 6 | 1 | 15 | 12 | 72.0% | 62.8% |
| net | 223 | 145 | 55 | 8 | 0 | 1 | 14 | 72.5% | 69.4% |
| node | 8 | 0 | 0 | 1 | 0 | 0 | 7 | 0.0% | 0.0% |
| os | 6 | 5 | 0 | 0 | 0 | 0 | 1 | 100.0% | 100.0% |
| other | 469 | 96 | 81 | 75 | 9 | 50 | 158 | 54.2% | 30.9% |
| path | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| perf_hooks | 41 | 3 | 29 | 2 | 0 | 5 | 2 | 9.4% | 7.7% |
| permission | 55 | 4 | 37 | 9 | 2 | 1 | 2 | 9.8% | 7.5% |
| process | 93 | 40 | 35 | 7 | 0 | 2 | 9 | 53.3% | 47.6% |
| promises | 23 | 1 | 15 | 0 | 7 | 0 | 0 | 6.2% | 4.3% |
| querystring | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| readline | 101 | 0 | 20 | 2 | 0 | 0 | 79 | 0.0% | 0.0% |
| repl | 85 | 1 | 5 | 79 | 0 | 0 | 0 | 16.7% | 1.2% |
| shadow_realm | 11 | 0 | 0 | 1 | 10 | 0 | 0 | 0.0% | 0.0% |
| signal | 5 | 1 | 0 | 3 | 0 | 0 | 1 | 100.0% | 25.0% |
| snapshot | 57 | 0 | 0 | 57 | 0 | 0 | 0 | 0.0% | 0.0% |
| sqlite | 39 | 36 | 3 | 0 | 0 | 0 | 0 | 92.3% | 92.3% |
| stdio | 23 | 14 | 7 | 1 | 0 | 0 | 1 | 66.7% | 63.6% |
| stream | 753 | 708 | 33 | 1 | 0 | 4 | 7 | 95.5% | 94.9% |
| string_decoder | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 100.0% | 100.0% |
| test_runner | 157 | 95 | 53 | 0 | 0 | 1 | 8 | 64.2% | 63.8% |
| timers | 97 | 47 | 9 | 0 | 0 | 1 | 40 | 83.9% | 82.5% |
| tls | 207 | 4 | 0 | 203 | 0 | 0 | 0 | 100.0% | 1.9% |
| trace_events | 35 | 15 | 10 | 6 | 0 | 0 | 4 | 60.0% | 48.4% |
| tty | 5 | 1 | 2 | 0 | 0 | 0 | 2 | 33.3% | 33.3% |
| url | 29 | 28 | 0 | 0 | 0 | 0 | 1 | 100.0% | 100.0% |
| util | 174 | 41 | 5 | 0 | 0 | 1 | 127 | 89.1% | 87.2% |
| v8 | 45 | 14 | 1 | 0 | 30 | 0 | 0 | 93.3% | 31.1% |
| vm | 121 | 25 | 82 | 3 | 9 | 2 | 0 | 23.4% | 20.7% |
| webcrypto | 107 | 43 | 16 | 9 | 0 | 0 | 39 | 72.9% | 63.2% |
| webstreams | 68 | 67 | 0 | 0 | 0 | 0 | 1 | 100.0% | 100.0% |
| whatwg | 264 | 62 | 16 | 0 | 0 | 5 | 181 | 79.5% | 74.7% |
| worker_threads | 189 | 18 | 10 | 160 | 0 | 0 | 1 | 64.3% | 9.6% |
| zlib | 61 | 52 | 9 | 0 | 0 | 0 | 0 | 85.2% | 85.2% |

## Split Test Summary

| File | Subtests | Passing | Gap | WASI-impossible | Engine diff | Unevaluated | Internals |
|------|----------|----------|-----|-----------------|-------------|-------------|-----------|
| `test-esm-loader-modulemap.js` | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| `test-require-module-conditional-exports.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-cjs-esm-esm.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-cjs-esm.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-esm-cjs-esm-esm.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-require-module-cycle-esm-esm-cjs-esm.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-require-module-defined-esmodule.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-module-tla.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-require-module-with-detection.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-require-module.js` | 6 | 0 | 2 | 0 | 0 | 4 | 0 |
| `test-abortcontroller.js` | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| `test-aborted-util.js` | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
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
| `test-blocklist.js` | 17 | 13 | 0 | 0 | 0 | 4 | 0 |
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
| `test-child-process-constructor.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-cwd.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-exec-abortcontroller-promisified.js` | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| `test-child-process-exec-maxbuf.js` | 11 | 9 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-execFile-promisified-abortController.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-execfile-maxbuf.js` | 8 | 0 | 2 | 6 | 0 | 0 | 0 |
| `test-child-process-execfile.js` | 8 | 0 | 2 | 6 | 0 | 0 | 0 |
| `test-child-process-execfilesync-maxbuf.js` | 3 | 0 | 2 | 1 | 0 | 0 | 0 |
| `test-child-process-execsync-maxbuf.js` | 4 | 0 | 3 | 1 | 0 | 0 | 0 |
| `test-child-process-fork-abort-signal.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-child-process-fork-args.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-child-process-fork-timeout-kill-signal.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-promisified.js` | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| `test-child-process-send-returns-boolean.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-spawn-controller.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-child-process-spawn-timeout-kill-signal.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-spawnsync-maxbuf.js` | 4 | 0 | 2 | 2 | 0 | 0 | 0 |
| `test-child-process-spawnsync-validation-errors.js` | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| `test-child-process-spawnsync.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-child-process-stdio.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-child-process-validate-stdio.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-child-process-windows-hide.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-cli-eval.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
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
| `test-crypto-prime.js` | 10 | 0 | 0 | 0 | 0 | 0 | 10 |
| `test-crypto-random.js` | 22 | 22 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-rsa-dsa.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-scrypt.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-crypto-secret-keygen.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-crypto-sign-verify.js` | 19 | 16 | 3 | 0 | 0 | 0 | 0 |
| `test-crypto-x509.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dgram-address.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-dgram-bind-fd-error.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-dgram-blocklist.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-close-signal.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-create-socket-handle-fd.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dgram-create-socket-handle.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dgram-createSocket-type.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-dgram-custom-lookup.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dgram-membership.js` | 12 | 0 | 10 | 0 | 0 | 2 | 0 |
| `test-dgram-multicast-loopback.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-dgram-multicast-set-interface.js` | 8 | 4 | 4 | 0 | 0 | 0 | 0 |
| `test-dgram-setBroadcast.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-dgram-socket-buffer-size.js` | 6 | 0 | 5 | 0 | 0 | 1 | 0 |
| `test-dgram-unref.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-diagnostics-channel-tracing-channel-has-subscribers.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-dns-lookup.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-dns-setlocaladdress.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-dns-setservers-type-check.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-dns.js` | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| `test-domain-intercept.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-domain-promise.js` | 10 | 0 | 6 | 0 | 0 | 4 | 0 |
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
| `test-fs-copyfile-respect-permissions.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-error-messages.js` | 31 | 0 | 0 | 0 | 0 | 0 | 31 |
| `test-fs-mkdir-recursive-eaccess.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| `test-fs-write.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
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
| `test-http-dummy-characters-smuggling.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| `test-http-req-res-close.js` | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| `test-http-request-host-header.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-http-request-join-authorization-headers.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-response-close.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-response-multi-content-length.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http-response-setheaders.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-http-server-capture-rejections.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http-server-connection-list-when-close.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http-server-non-utf8-header.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-http-server-options-highwatermark.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-http-server-timeouts-validation.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-http-transfer-encoding-smuggling.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-http-write-head-2.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-http2-alpn.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-capture-rejection.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-http2-client-destroy.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-http2-client-setLocalWindowSize.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http2-compat-expect-continue.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-compat-serverrequest-headers.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-compat-serverresponse-end.js` | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| `test-http2-compat-serverresponse-write.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http2-compat-serverresponse-writehead-array.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http2-compat-write-early-hints.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-http2-connect.js` | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| `test-http2-create-client-connect.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-getpackedsettings.js` | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| `test-http2-https-fallback.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-http2-invalidheaderfield.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-http2-origin.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-http2-perform-server-handshake.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-server-errors.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-server-settimeout-no-callback.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-server-startup.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-http2-too-many-settings.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-http2-util-headers-list.js` | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| `test-http2-util-update-options-buffer.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-https-agent-create-connection.js` | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| `test-https-argument-of-creating.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-https-insecure-parse-per-stream.js` | 5 | 0 | 0 | 5 | 0 | 0 | 0 |
| `test-https-max-header-size-per-stream.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
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
| `test-module-strip-types.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-net-allow-half-open.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-net-autoselectfamily-default.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-net-autoselectfamily.js` | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| `test-net-better-error-messages-path.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-net-blocklist.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-net-bytes-written-large.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-net-connect-options-port.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-net-normalize-args.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-net-perf_hooks.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-net-server-call-listen-multiple-times.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-net-server-listen-handle.js` | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| `test-net-server-listen-options-signal.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-net-server-listen-options.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
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
| `test-permission-allow-worker-cli.js` | 2 | 0 | 1 | 0 | 0 | 1 | 0 |
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
| `test-process-env-allowed-flags.js` | 3 | 0 | 2 | 0 | 0 | 1 | 0 |
| `test-process-env-windows-error-reset.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-process-env.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
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
| `test-repl-context.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-repl-require.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-repl-tab-complete-import.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-repl-tab-complete.js` | 5 | 0 | 0 | 5 | 0 | 0 | 0 |
| `test-require-cache.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-node-prefix.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-require-resolve-opts-paths-relative.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-require-resolve.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-assert.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-runner-cli-concurrency.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| `test-runner-cli-timeout.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-runner-cli.js` | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| `test-runner-concurrency.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-runner-coverage.js` | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-custom-assertions.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-error-reporter.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-runner-extraneous-async-activity.js` | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| `test-runner-force-exit-flush.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-runner-mocking.js` | 43 | 42 | 1 | 0 | 0 | 0 | 0 |
| `test-runner-module-mocking.js` | 19 | 15 | 4 | 0 | 0 | 0 | 0 |
| `test-runner-no-isolation-filtering.js` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `test-runner-snapshot-file-tests.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-runner-snapshot-tests.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-runner-test-filepath.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-test-fullname.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-runner-wait-for.js` | 7 | 6 | 0 | 0 | 0 | 1 | 0 |
| `test-set-http-max-http-headers.js` | 3 | 0 | 2 | 0 | 0 | 1 | 0 |
| `test-set-incoming-message-header.js` | 3 | 0 | 1 | 0 | 0 | 2 | 0 |
| `test-shadow-realm-prepare-stack-trace.js` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| `test-single-executable-blob-config-errors.js` | 11 | 0 | 0 | 11 | 0 | 0 | 0 |
| `test-single-executable-blob-config.js` | 5 | 0 | 0 | 5 | 0 | 0 | 0 |
| `test-snapshot-api.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-argv1.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-basic.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-snapshot-child-process-sync.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-cjs-main.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-config.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-snapshot-console.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-coverage.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-cwd.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-dns-lookup-localhost-promise.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-dns-lookup-localhost.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-dns-resolve-localhost-promise.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-dns-resolve-localhost.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-error.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-snapshot-eval.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-snapshot-gzip.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-incompatible.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-snapshot-net.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-stack-trace-limit.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-typescript.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-umd.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-snapshot-warning.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
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
| `test-stream-pipeline.js` | 80 | 77 | 3 | 0 | 0 | 0 | 0 |
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
| `test-streams-highwatermark.js` | 6 | 2 | 0 | 0 | 0 | 4 | 0 |
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
| `test-tls-connect-allow-half-open-option.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-external-accessor.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-server-parent-constructor-options.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-socket-allow-half-open-option.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-tls-translate-peer-certificate.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-url-fileurltopath.js` | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| `test-url-format-whatwg.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-url-parse-format.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-url-pathtofileurl.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-util-callbackify.js` | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| `test-util-deprecate.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-util-format.js` | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| `test-util-getcallsites.js` | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| `test-util-inspect-getters-accessing-this.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-util-inspect.js` | 99 | 0 | 0 | 0 | 0 | 0 | 99 |
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
| `test-webcrypto-derivebits.js` | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| `test-webcrypto-derivekey.js` | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| `test-webcrypto-encrypt-decrypt-aes.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-encrypt-decrypt.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-export-import-ec.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-webcrypto-export-import.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-keygen.js` | 8 | 0 | 0 | 8 | 0 | 0 | 0 |
| `test-webcrypto-random.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-sign-verify.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-webcrypto-webidl.js` | 28 | 0 | 0 | 0 | 0 | 0 | 28 |
| `test-webstorage.js` | 8 | 1 | 7 | 0 | 0 | 0 | 0 |
| `test-webstreams-abort-controller.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-webstreams-compose.js` | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| `test-webstreams-finished.js` | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| `test-webstreams-pipeline.js` | 17 | 17 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-encoding-custom-fatal-streaming.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-whatwg-encoding-custom-interop.js` | 4 | 0 | 0 | 0 | 0 | 3 | 1 |
| `test-whatwg-encoding-custom-textdecoder.js` | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-events-add-event-listener-options-passive.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-whatwg-events-add-event-listener-options-signal.js` | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-events-customevent.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-readablebytestream-bad-buffers-and-views.js` | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-readablebytestream.js` | 11 | 0 | 0 | 0 | 0 | 2 | 9 |
| `test-whatwg-readablestream.js` | 82 | 0 | 0 | 0 | 0 | 0 | 82 |
| `test-whatwg-transformstream.js` | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| `test-whatwg-url-custom-searchparams-constructor.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-custom-searchparams-delete.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-custom-searchparams-stringifier.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-custom-setters.js` | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `test-whatwg-url-properties.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| `test-worker-message-channel.js` | 3 | 1 | 0 | 2 | 0 | 0 | 0 |
| `test-worker-message-event.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-worker-message-mark-as-uncloneable.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-worker-message-port-close.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-worker-message-port-transfer-duplicate.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-worker-message-port-transfer-native.js` | 2 | 0 | 1 | 0 | 0 | 0 | 1 |
| `test-worker-message-port-wasm-threads.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-worker-message-port.js` | 9 | 0 | 7 | 2 | 0 | 0 | 0 |
| `test-worker-message-transfer-port-mark-as-untransferable.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-worker-unsupported-path.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-worker-workerdata-messageport.js` | 5 | 3 | 2 | 0 | 0 | 0 | 0 |
| `test-wrap-js-stream-destroy.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-wrap-js-stream-duplex.js` | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| `test-x509-escaping.js` | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| `test-zlib-brotli.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-create-raw.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-destroy.js` | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| `test-zlib-dictionary-fail.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-failed-init.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-zlib-zero-windowBits.js` | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| `test-async-wrap-getasyncid.js` | 18 | 0 | 0 | 0 | 0 | 18 | 0 |
| `test-child-process-execsync.js` | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| `test-cpu-prof-invalid-options.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-crypto-timing-safe-equal.js` | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| `test-diagnostic-dir-cpu-prof.js` | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| `test-diagnostic-dir-heap-prof.js` | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| `test-error-serdes.js` | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| `test-fs-opendir-recursive.js` | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-readdir-recursive.js` | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| `test-fs-watch.js` | 6 | 3 | 3 | 0 | 0 | 0 | 0 |
| `test-heapdump.js` | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| `test-init.js` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `test-module-loading.js` | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| `test-net-server-address.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-net-server-bind.js` | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `test-perf-hooks.js` | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| `test-performance-eventloopdelay.js` | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| `test-single-executable-application-assets.js` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| `test-single-executable-application-snapshot.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |
| `test-tls-connect.js` | 2 | 0 | 0 | 2 | 0 | 0 | 0 |

## Classified Non-Runnable Tests

### known gap (1182)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| inherited: requires child_process which is not available in WASM | 80 | `parallel/test-child-process-constructor.js#block_00_block_00`, `parallel/test-child-process-constructor.js#block_01_block_01`, `parallel/test-child-process-constructor.js#block_02_block_02`, ... (+77) |
| [manual] http2/https not implemented | 70 | `parallel/test-http2-capture-rejection.js#block_00_block_00`, `parallel/test-http2-capture-rejection.js#block_01_block_01`, `parallel/test-http2-capture-rejection.js#block_02_block_02`, ... (+67) |
| [manual] requires HTTP server (net.listen) which is unavailable in WASM | 38 | `parallel/test-http-server-async-dispose.js`, `parallel/test-http-server-capture-rejections.js#block_00_block_00`, `parallel/test-http-server-capture-rejections.js#block_01_block_01`, ... (+35) |
| http edge case not yet handled | 34 | `parallel/test-http-agent-close.js`, `parallel/test-http-agent-destroyed-socket.js`, `parallel/test-http-chunked-304.js`, ... (+31) |
| stream edge case not yet handled | 26 | `parallel/test-stream-compose.js#block_17_block_17`, `parallel/test-stream-drop-take.js#block_01_don_t_wait_for_next_item_in_the_original_stream_when_already`, `parallel/test-stream-duplex-from.js#block_17_block_17`, ... (+23) |
| wasi:sockets UDP implementation hangs in wasmtime | 21 | `parallel/test-dgram-bytes-length.js`, `parallel/test-dgram-exclusive-implicit-bind.js`, `parallel/test-dgram-implicit-bind.js`, ... (+18) |
| wasi:sockets UDP implementation crashes in wasmtime | 19 | `parallel/test-dgram-bind-error-repeat.js`, `parallel/test-dgram-blocklist.js#block_00_block_00`, `parallel/test-dgram-blocklist.js#block_01_block_01`, ... (+16) |
| process.permission and --permission CLI semantics are incomplete in execPath emulation | 18 | `parallel/test-cli-permission-deny-fs.js#block_00_block_00`, `parallel/test-cli-permission-deny-fs.js#block_01_block_01`, `parallel/test-cli-permission-deny-fs.js#block_02_block_02`, ... (+15) |
| [manual] amp fix attempt failed verification | 17 | `parallel/test-fs-writefile-with-fd.js#block_02_test_read_only_file_descriptor`, `parallel/test-http-abort-queued.js`, `parallel/test-http-agent-abort-controller.js`, ... (+14) |
| domain module depends on async_hooks, not fully working | 15 | `parallel/test-domain-implicit-binding.js`, `parallel/test-domain-implicit-fs.js`, `parallel/test-domain-promise.js#block_00_block_00`, ... (+12) |
| net.js TCP implementation incomplete - needs event handling and API fixes | 15 | `parallel/test-net-connect-nodelay.js`, `parallel/test-net-connect-paused-connection.js`, `parallel/test-net-during-close.js`, ... (+12) |
| async_hooks not fully implemented | 13 | `parallel/test-async-hooks-destroy-on-gc.js`, `parallel/test-async-hooks-disable-during-promise.js`, `parallel/test-async-hooks-disable-gc-tracking.js`, ... (+10) |
| inherited: requires dgram module, common/dns utilities, and detailed setServers validation (ERR_INVALID_IP_ADDRESS) | 12 | `parallel/test-dns.js#block_00_verify_that_setservers_handles_arrays_with_holes_and_other_o`, `parallel/test-dns.js#block_01_block_01`, `parallel/test-dns.js#block_02_block_02`, ... (+9) |
| node:readline module is not yet supported in WebAssembly environment | 12 | `parallel/test-readline-keys.js`, `parallel/test-readline-position.js`, `parallel/test-readline-reopen.js`, ... (+9) |
| requires HTTP server functionality, we only support clients | 12 | `parallel/test-async-hooks-execution-async-resource-await.js`, `parallel/test-async-hooks-execution-async-resource.js`, `parallel/test-async-hooks-http-parser-destroy.js`, ... (+9) |
| QuickJS module system does not support ESM-CJS interop cycle detection | 11 | `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_00_a_mjs_b_cjs_c_mjs_a_mjs`, `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_01_b_cjs_c_mjs_a_mjs_b_cjs`, `es-module/test-require-module-cycle-esm-cjs-esm-esm.js#block_02_c_mjs_a_mjs_b_cjs_c_mjs`, ... (+8) |
| [manual] amp batch made no code changes | 11 | `parallel/test-http-max-header-size.js`, `parallel/test-http-max-headers-count.js`, `parallel/test-http-max-sockets.js`, ... (+8) |
| [manual] amp made no code changes | 11 | `parallel/test-fs-watchfile.js`, `parallel/test-fs-write-file-sync.js#block_05_test_writefilesync_with_an_invalid_input`, `parallel/test-fs-write-sigxfsz.js`, ... (+8) |
| hangs: relies on keep-alive connection reuse not fully implemented | 11 | `parallel/test-http-client-abort-keep-alive-destroy-res.js`, `parallel/test-http-client-abort-keep-alive-queued-tcp-socket.js`, `parallel/test-http-keep-alive-close-on-header.js`, ... (+8) |
| inherited: process.permission and --permission CLI semantics are incomplete in execPath emulation | 11 | `parallel/test-permission-allow-child-process-cli.js#block_00_guarantee_the_initial_state`, `parallel/test-permission-allow-child-process-cli.js#block_01_to_spawn_unless_allow_child_process_is_sent`, `parallel/test-permission-allow-wasi-cli.js#block_00_guarantee_the_initial_state`, ... (+8) |
| dgram multicast membership APIs are not implemented (ENOSYS) | 10 | `parallel/test-dgram-membership.js#block_02_addmembership_with_no_argument_should_throw`, `parallel/test-dgram-membership.js#block_03_dropmembership_with_no_argument_should_throw`, `parallel/test-dgram-membership.js#block_04_addmembership_with_invalid_multicast_address_should_throw`, ... (+7) |
| module SourceMap/findSourceMap API is not fully implemented | 9 | `parallel/test-source-map-api.js#block_00_it_should_throw_with_invalid_args`, `parallel/test-source-map-api.js#block_01_findsourcemap_should_return_undefined_when_no_source_map_is_`, `parallel/test-source-map-api.js#block_02_non_exceptional_case`, ... (+6) |
| test runner edge case | 9 | `parallel/test-runner-assert.js#test_01_t_assert_ok_correctly_parses_the_stacktrace`, `parallel/test-runner-cli.js#block_00_block_00`, `parallel/test-runner-concurrency.js#test_00_concurrency_option_boolean_true`, ... (+6) |
| vm.SourceTextModule/SyntheticModule behavior is incomplete (status transitions, validation, and timeout handling) | 9 | `parallel/test-vm-module-basic.js#block_00_check_inspection_of_the_instance`, `parallel/test-vm-module-basic.js#block_01_block_01`, `parallel/test-vm-module-basic.js#block_02_check_dependencies_getter_returns_same_object_every_time`, ... (+6) |
| zlib edge case not yet handled | 9 | `parallel/test-zlib-bytes-read.js`, `parallel/test-zlib-close-after-error.js`, `parallel/test-zlib-destroy-pipe.js`, ... (+6) |
| Intl is not available in current runtime | 8 | `parallel/test-intl-v8BreakIterator.js`, `parallel/test-intl.js`, `parallel/test-whatwg-encoding-custom-textdecoder-fatal.js`, ... (+5) |
| [manual] batch other-1: cannot fix | 8 | `parallel/test-http-catch-uncaughtexception.js`, `parallel/test-http-createConnection.js`, `parallel/test-http-debug.js`, ... (+5) |
| process unhandledRejection/rejectionHandled/warning mode behavior is incomplete | 8 | `parallel/test-promise-unhandled-silent-no-hook.js`, `parallel/test-promise-unhandled-silent.js`, `parallel/test-promise-unhandled-warn-no-hook.js`, ... (+5) |
| vm.constants.DONT_CONTEXTIFY and vanilla-context behavior are not implemented | 8 | `parallel/test-vm-context-dont-contextify.js#block_00_block_00`, `parallel/test-vm-context-dont-contextify.js#block_01_block_01`, `parallel/test-vm-context-dont-contextify.js#block_02_block_02`, ... (+5) |
| [manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http | 7 | `parallel/test-http-connect-req-res.js`, `parallel/test-http-connect.js`, `parallel/test-http-upgrade-advertise.js`, ... (+4) |
| common-shim spawnPromisified child emulation does not support --experimental-webstorage/--localstorage-file flags | 7 | `parallel/test-webstorage.js#test_01_emits_a_warning_when_used`, `parallel/test-webstorage.js#test_02_storage_instances_cannot_be_created_in_userland`, `parallel/test-webstorage.js#test_03_sessionstorage_is_not_persisted`, ... (+4) |
| inherited: Intl is not available in current runtime | 7 | `parallel/test-icu-transcode.js#block_00_block_00`, `parallel/test-icu-transcode.js#block_01_block_01`, `parallel/test-icu-transcode.js#block_02_test_that_uint8array_arguments_are_okay`, ... (+4) |
| inherited: child_process is not supported in WebAssembly environment | 7 | `sequential/test-child-process-execsync.js#block_00_block_00`, `sequential/test-child-process-execsync.js#block_01_block_01`, `sequential/test-child-process-execsync.js#block_02_block_02`, ... (+4) |
| requires cluster | 7 | `parallel/test-net-listen-exclusive-random-ports.js`, `parallel/test-net-listen-handle-in-cluster-1.js`, `parallel/test-net-listen-twice.js`, ... (+4) |
| dgram implementation incomplete | 6 | `parallel/test-dgram-close-in-listening.js`, `parallel/test-dgram-close-is-not-callback.js`, `parallel/test-dgram-custom-lookup.js#block_00_block_00`, ... (+3) |
| dns resolver implementation incomplete | 6 | `parallel/test-dns-cancel-reverse-lookup.js`, `parallel/test-dns-channel-cancel-promise.js`, `parallel/test-dns-channel-cancel.js`, ... (+3) |
| inherited: common.canCreateSymLink shim always returns false, so symlink permission tests are skipped | 6 | `parallel/test-permission-fs-symlink-target-write.js#block_00_block_00`, `parallel/test-permission-fs-symlink-target-write.js#block_01_block_01`, `parallel/test-permission-fs-symlink.js#block_00_block_00`, ... (+3) |
| inherited: perf_hooks createHistogram/monitorEventLoopDelay are not implemented | 6 | `parallel/test-perf-hooks-histogram.js#block_00_block_00`, `parallel/test-perf-hooks-histogram.js#block_01_block_01`, `parallel/test-perf-hooks-histogram.js#block_02_block_02`, ... (+3) |
| inherited: performance.timerify function entries are not implemented | 6 | `parallel/test-performance-function.js#block_00_block_00`, `parallel/test-performance-function.js#block_01_block_01`, `parallel/test-performance-function.js#block_02_block_02`, ... (+3) |
| [manual] amp fix caused regressions | 5 | `parallel/test-http-abort-client.js`, `parallel/test-http-agent.js`, `parallel/test-http-client-timeout.js`, ... (+2) |
| [manual] requires Node.js --test-shard option validation | 5 | `parallel/test-runner-cli.js#block_03_block_03`, `parallel/test-runner-cli.js#block_04_block_04`, `parallel/test-runner-cli.js#block_05_block_05`, ... (+2) |
| inherited: perf_hooks PerformanceResourceTiming/markResourceTiming behavior is incomplete | 5 | `parallel/test-perf-hooks-resourcetiming.js#block_00_performanceresourcetiming_should_not_be_initialized_external`, `parallel/test-perf-hooks-resourcetiming.js#block_01_using_performance_getentries`, `parallel/test-perf-hooks-resourcetiming.js#block_02_default_values`, ... (+2) |
| inherited: repl is not supported in WASM | 5 | `parallel/test-repl-context.js#block_00_test_context_when_useglobal_is_false`, `parallel/test-repl-context.js#block_01_test_for_context_side_effects`, `parallel/test-repl-tab-complete-import.js#block_00_block_00`, ... (+2) |
| net edge case not yet handled | 5 | `parallel/test-net-autoselectfamily.js#block_01_test_that_only_the_last_successful_connection_is_established`, `parallel/test-net-connect-reset.js`, `parallel/test-net-pingpong.js`, ... (+2) |
| node:readline createInterface/async iterator API is not implemented | 5 | `parallel/test-readline-async-iterators-backpressure.js`, `parallel/test-readline-async-iterators-destroy.js`, `parallel/test-readline-async-iterators.js`, ... (+2) |
| process API incomplete | 5 | `parallel/test-process-beforeexit-throw-exit.js`, `parallel/test-process-beforeexit.js`, `parallel/test-process-chdir-errormessage.js`, ... (+2) |
| process.getActiveResourcesInfo() is not implemented | 5 | `parallel/test-process-getactiveresources-track-active-handles.js`, `parallel/test-process-getactiveresources-track-active-requests.js`, `parallel/test-process-getactiveresources-track-interval-lifetime.js`, ... (+2) |
| util.format output formatting differences | 5 | `parallel/test-util-format.js#block_00_block_00`, `parallel/test-util-format.js#block_01_string_format_specifier_including_tostring_properties_on_the`, `parallel/test-util-format.js#block_02_symbol_toprimitive_handling_for_string_format_specifier`, ... (+2) |
| WASM child emulation does not support Node.js --test CLI output behavior | 4 | `parallel/test-runner-extraneous-async-activity.js#block_00_block_00`, `parallel/test-runner-extraneous-async-activity.js#block_01_block_01`, `parallel/test-runner-extraneous-async-activity.js#block_02_block_02`, ... (+1) |
| diagnostics_channel incomplete | 4 | `parallel/test-diagnostics-channel-bind-store.js`, `parallel/test-diagnostics-channel-safe-subscriber-errors.js`, `parallel/test-diagnostics-channel-udp.js`, ... (+1) |
| inherited: --frozen-intrinsics flag semantics are not implemented | 4 | `parallel/test-freeze-intrinsics.js#block_00_ensure_we_can_extend_console`, `parallel/test-freeze-intrinsics.js#block_01_ensure_we_can_write_override_object_prototype_properties_on_`, `parallel/test-freeze-intrinsics.js#block_02_ensure_we_can_not_override_globalthis`, ... (+1) |
| inherited: common-shim mustCall()/mustCallAtLeast() argument validation differs from Node's test harness | 4 | `parallel/test-common.js#block_00_test_for_leaked_global_detection`, `parallel/test-common.js#block_01_test_for_disabling_leaked_global_detection`, `parallel/test-common.js#block_02_test_tmpdir`, ... (+1) |
| inherited: requires DNS lookup | 4 | `parallel/test-net-connect-options-port.js#block_00_test_wrong_type_of_ports`, `parallel/test-net-connect-options-port.js#block_01_test_out_of_range_ports`, `parallel/test-net-connect-options-port.js#block_02_test_invalid_hints`, ... (+1) |
| require()/import cycle handling in ESM graphs is incomplete (missing ERR_REQUIRE_CYCLE_MODULE and can hit QuickJS linker assert) | 4 | `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_00_a_mjs_b_mjs_c_mjs_d_mjs_c_mjs`, `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_01_b_mjs_c_mjs_d_mjs_c_mjs`, `es-module/test-require-module-cycle-esm-esm-cjs-esm.js#block_02_c_mjs_d_mjs_c_mjs`, ... (+1) |
| requires HTTP server functionality | 4 | `sequential/test-http-econnrefused.js`, `sequential/test-http-keepalive-maxsockets.js`, `sequential/test-http-max-sockets.js`, ... (+1) |
| DOMException options bag ({ name, cause }) is not implemented | 3 | `parallel/test-domexception-cause.js#block_01_block_01`, `parallel/test-domexception-cause.js#block_02_block_02`, `parallel/test-domexception-cause.js#block_03_block_03` |
| IPv6 sockets are not available in this runtime (common.hasIPv6=false) | 3 | `parallel/test-dgram-ipv6only.js`, `parallel/test-dgram-udp6-link-local-address.js`, `parallel/test-dgram-udp6-send-default-host.js` |
| WASM child emulation does not support Node.js --test TAP filtering behavior | 3 | `parallel/test-runner-no-isolation-filtering.js#test_00_works_with_test_only`, `parallel/test-runner-no-isolation-filtering.js#test_01_works_with_test_name_pattern`, `parallel/test-runner-no-isolation-filtering.js#test_02_works_with_test_skip_pattern` |
| WASM child emulation does not support Node.js --test reporter destination flushing | 3 | `parallel/test-runner-force-exit-flush.js#test_00_junit_reporter`, `parallel/test-runner-force-exit-flush.js#test_01_spec_reporter`, `parallel/test-runner-force-exit-flush.js#test_02_tap_reporter` |
| WebAssembly global is missing in current runtime | 3 | `es-module/test-wasm-memory-out-of-bound.js`, `es-module/test-wasm-simple.js`, `es-module/test-wasm-web-api.js` |
| child_process spawn() stdio stream compatibility (e.g. pipe) is incomplete in execPath emulation | 3 | `parallel/test-cwd-enoent-preload.js`, `parallel/test-cwd-enoent.js`, `parallel/test-preload.js` |
| child_process.spawn pipe mode does not provide functional child.stdin | 3 | `parallel/test-stdin-pipe-large.js`, `parallel/test-stdin-pipe-resume.js`, `parallel/test-stdin-script-child-option.js` |
| context marker Symbol(vm.context) leaks into sandbox property enumeration | 3 | `parallel/test-vm-ownkeys.js`, `parallel/test-vm-ownpropertynames.js`, `parallel/test-vm-ownpropertysymbols.js` |
| dgram socket buffer size APIs may hang | 3 | `parallel/test-dgram-socket-buffer-size.js#block_02_block_02`, `parallel/test-dgram-socket-buffer-size.js#block_04_block_04`, `parallel/test-dgram-socket-buffer-size.js#block_05_block_05` |
| hangs: test sends raw TCP bytes and expects specific parser errors | 3 | `parallel/test-http-client-parse-error.js`, `parallel/test-http-client-reject-chunked-with-content-length.js`, `parallel/test-http-client-reject-cr-no-lf.js` |
| inherited: common.canCreateSymLink shim always returns false, so traversal+symlink permission tests are skipped | 3 | `parallel/test-permission-fs-traversal-path.js#block_00_block_00`, `parallel/test-permission-fs-traversal-path.js#block_01_block_01`, `parallel/test-permission-fs-traversal-path.js#block_02_block_02` |
| inherited: dgram AbortSignal validation and close semantics are incomplete | 3 | `parallel/test-dgram-close-signal.js#block_00_block_00`, `parallel/test-dgram-close-signal.js#block_01_block_01`, `parallel/test-dgram-close-signal.js#block_02_block_02` |
| inherited: missing AbortSignal validation for listen | 3 | `parallel/test-net-server-listen-options-signal.js#block_00_block_00`, `parallel/test-net-server-listen-options-signal.js#block_01_block_01`, `parallel/test-net-server-listen-options-signal.js#block_02_block_02` |
| inherited: perf_hooks user timing classes and methods are incomplete | 3 | `parallel/test-perf-hooks-usertiming.js#block_00_block_00`, `parallel/test-perf-hooks-usertiming.js#block_01_block_01`, `parallel/test-perf-hooks-usertiming.js#block_02_block_02` |
| inherited: readline.emitKeypressEvents behavior is not implemented | 3 | `parallel/test-readline-emit-keypress-events.js#block_00_block_00`, `parallel/test-readline-emit-keypress-events.js#block_01_block_01`, `parallel/test-readline-emit-keypress-events.js#block_02_block_02` |
| inherited: requires HTTP server functionality, we only support clients | 3 | `parallel/test-http-dummy-characters-smuggling.js#block_01_block_01`, `parallel/test-http-missing-header-separator-lf.js#block_01_block_01`, `parallel/test-http-missing-header-separator-lf.js#block_02_block_02` |
| inherited: requires common/internet module and detailed ERR_INVALID_ARG_TYPE checks on setServers | 3 | `parallel/test-dns-setservers-type-check.js#block_00_block_00`, `parallel/test-dns-setservers-type-check.js#block_01_block_01`, `parallel/test-dns-setservers-type-check.js#block_02_this_test_for_dns_promises` |
| inherited: requires one-shot crypto.sign/verify, RSA-PSS padding/saltLength options, child_process.exec, generateKeyPairSync('rsa'), dsaEncoding option | 3 | `parallel/test-crypto-sign-verify.js#block_12_block_12`, `parallel/test-crypto-sign-verify.js#block_13_early_if_no_openssl_binary_is_found`, `parallel/test-crypto-sign-verify.js#block_18_block_18` |
| node:module does not implement package.json exports condition resolution (require/import/default) | 3 | `es-module/test-require-module-conditional-exports.js#block_00_if_only_require_exports_are_defined_return_require_exports`, `es-module/test-require-module-conditional-exports.js#block_01_if_both_are_defined_require_is_used`, `es-module/test-require-module-conditional-exports.js#block_02_if_import_and_default_are_defined_default_is_used` |
| node_compat common shim is missing ../common/wpt harness | 3 | `parallel/test-whatwg-events-event-constructors.js`, `parallel/test-whatwg-events-eventtarget-this-of-listener.js`, `parallel/test-whatwg-url-custom-searchparams-sort.js` |
| perf_hooks incomplete | 3 | `parallel/test-performance-gc.js#block_00_adding_an_observer_should_force_at_least_one_gc_to_appear`, `parallel/test-performance-measure-detail.js`, `parallel/test-performance-measure.js` |
| pipe/net edge case | 3 | `parallel/test-pipe-head.js`, `parallel/test-pipe-unref.js`, `parallel/test-pipe-writev.js` |
| requires dgram and DNS protocol-level testing | 3 | `parallel/test-dns-channel-timeout.js`, `parallel/test-dns-lookupService-promises.js`, `parallel/test-dns-setserver-when-querying.js` |
| setUncaughtExceptionCaptureCallback does not fully intercept thrown uncaught exceptions | 3 | `parallel/test-process-exception-capture-should-abort-on-uncaught-setflagsfromstring.js`, `parallel/test-process-exception-capture-should-abort-on-uncaught.js`, `parallel/test-process-exception-capture.js` |
| sqlite edge case | 3 | `parallel/test-sqlite-session.js#test_05_conflict_resolution`, `parallel/test-sqlite-statement-sync.js#test_06_statementsync_prototype_expandedsql`, `parallel/test-sqlite.js#test_00_accessing_the_node_sqlite_module` |
| timeout enforcement with microtaskMode='afterEvaluate' is incomplete | 3 | `parallel/test-vm-timeout-escape-promise-2.js`, `parallel/test-vm-timeout-escape-promise-module.js`, `parallel/test-vm-timeout-escape-promise.js` |
| CJS named export analysis for ESM/CJS interop is incomplete (missing named exports like π) | 2 | `es-module/test-require-module-twice.js`, `es-module/test-require-module.js#block_02_test_esm_that_import_cjs` |
| CLI/NODE_OPTIONS max-http-header-size propagation in child process emulation is incomplete | 2 | `parallel/test-set-http-max-http-headers.js#test_01_test_01`, `parallel/test-set-http-max-http-headers.js#test_02_same_checks_using_node_options_if_it_is_supported` |
| DSA key generation requires 2048+ bit modulus; test uses 512-bit when hasOpenSSL3 is false | 2 | `parallel/test-crypto-keygen-async-dsa-key-object.js`, `parallel/test-crypto-keygen-async-dsa.js` |
| ESM loader does not correctly recover/reuse cached module state after require() ERR_REQUIRE_ASYNC_MODULE | 2 | `es-module/test-require-module-tla-retry-import-2.js`, `es-module/test-require-module-tla-retry-import.js` |
| ESM loader does not correctly retry/resume top-level-await module evaluation after require() throws ERR_REQUIRE_ASYNC_MODULE | 2 | `es-module/test-require-module-retry-import-errored.js`, `es-module/test-require-module-retry-import-evaluating.js` |
| GC/common test infrastructure not fully compatible | 2 | `parallel/test-common-countdown.js`, `parallel/test-common-gc.js#block_00_block_00` |
| TextDecoderStream invalid-encoding errors are not Node-compatible yet | 2 | `parallel/test-whatwg-webstreams-encoding.js#block_00_block_00`, `parallel/test-whatwg-webstreams-encoding.js#block_01_block_01` |
| WASM child emulation does not support Node.js --test CLI reporter execution | 2 | `parallel/test-runner-error-reporter.js#test_00_all_tests_failures_reported_without_fail_fast_flag`, `parallel/test-runner-error-reporter.js#test_01_fail_fast_stops_test_execution_after_first_failure` |
| [manual] requires unix sockets / proxy / external tools unavailable in WASM | 2 | `parallel/test-http-unix-socket-keep-alive.js`, `parallel/test-http-unix-socket.js` |
| async_hooks createHook callback validation is incomplete | 2 | `parallel/test-async-hooks-constructor.js`, `parallel/test-async-wrap-constructor.js` |
| child_process execPath emulation does not fully match spawnSync({ encoding }) behavior for --check stdin runs | 2 | `parallel/test-cli-syntax-piped-bad.js`, `parallel/test-cli-syntax-piped-good.js` |
| child_process execPath emulation does not implement --trace-require-module warning output | 2 | `es-module/test-require-module-warning.js`, `es-module/test-require-node-modules-warning.js` |
| client never calls end(), wasi:http cannot finalize request to get response | 2 | `parallel/test-http-outgoing-destroyed.js#block_00_block_00`, `parallel/test-http-outgoing-destroyed.js#block_01_block_01` |
| common-shim gc helper does not provide V8-style collectability checks used by this leak test | 2 | `es-module/test-vm-source-text-module-leak.js`, `es-module/test-vm-synthetic-module-leak.js` |
| crypto edge case | 2 | `parallel/test-crypto-key-objects.js#block_05_block_05`, `parallel/test-crypto-keygen-empty-passphrase-no-prompt.js` |
| dgram socket buffer size APIs do not match Node error semantics | 2 | `parallel/test-dgram-socket-buffer-size.js#block_00_block_00`, `parallel/test-dgram-socket-buffer-size.js#block_01_block_01` |
| diagnostics_channel tracing for module.import events is incomplete | 2 | `parallel/test-diagnostics-channel-module-import-error.js`, `parallel/test-diagnostics-channel-module-import.js` |
| diagnostics_channel tracing for module.require events is incomplete | 2 | `parallel/test-diagnostics-channel-module-require-error.js`, `parallel/test-diagnostics-channel-module-require.js` |
| domain/setUncaughtExceptionCaptureCallback interaction is incomplete | 2 | `parallel/test-domain-load-after-set-uncaught-exception-capture.js`, `parallel/test-domain-set-uncaught-exception-capture-after-load.js` |
| execPath child emulation does not yet support trace-events CLI arg parsing used by -e runs | 2 | `parallel/test-trace-events-fs-async.js`, `parallel/test-trace-events-fs-sync.js` |
| fs edge case | 2 | `parallel/test-fs-read-stream-file-handle.js`, `sequential/test-fs-stat-sync-overflow.js` |
| hangs: requires unix socket support | 2 | `parallel/test-http-client-abort-keep-alive-queued-unix-socket.js`, `parallel/test-http-client-abort-unix-socket.js` |
| inherited: dgram multicast loopback API is not implemented (ENOSYS) | 2 | `parallel/test-dgram-multicast-loopback.js#block_00_block_00`, `parallel/test-dgram-multicast-loopback.js#block_01_block_01` |
| inherited: dgram setBroadcast API is not implemented (ENOSYS) | 2 | `parallel/test-dgram-setBroadcast.js#block_00_block_00`, `parallel/test-dgram-setBroadcast.js#block_01_block_01` |
| inherited: missing ERR_INVALID_ARG_TYPE validation for listen options | 2 | `parallel/test-net-server-listen-options.js#block_01_block_01`, `parallel/test-net-server-listen-options.js#block_02_block_02` |
| inherited: module syntax detection for extensionless/.js sources required by require(esm) is incomplete | 2 | `es-module/test-require-module-with-detection.js#block_00_block_00`, `es-module/test-require-module-with-detection.js#block_01_block_01` |
| inherited: process.getActiveResourcesInfo() is not implemented | 2 | `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_00_block_00`, `parallel/test-process-getactiveresources-track-timer-lifetime.js#block_01_block_01` |
| inherited: queueMicrotask argument validation/error codes are incomplete | 2 | `parallel/test-queue-microtask.js#block_00_block_00`, `parallel/test-queue-microtask.js#block_01_block_01` |
| inherited: requires perf_hooks.PerformanceObserver with net detail | 2 | `parallel/test-net-perf_hooks.js#block_00_block_00`, `parallel/test-net-perf_hooks.js#block_01_block_01` |
| perf_hooks resource timing buffer/full-event behavior is incomplete | 2 | `parallel/test-performance-resourcetimingbufferfull.js`, `parallel/test-performance-resourcetimingbuffersize.js` |
| process.allowedNodeEnvironmentFlags behavior is incomplete | 2 | `parallel/test-process-env-allowed-flags.js#block_00_assert_legit_flags_are_allowed_and_bogus_flags_are_disallowe`, `parallel/test-process-env-allowed-flags.js#block_02_assert_immutability_of_process_allowednodeenvironmentflags` |
| process.permission worker-thread restrictions are incomplete | 2 | `parallel/test-permission-dc-worker-threads.js`, `parallel/test-permission-worker-threads-cli.js` |
| process.report.writeReport and permission-model integration are missing | 2 | `parallel/test-permission-fs-write-report.js#block_00_block_00`, `parallel/test-permission-fs-write-report.js#block_01_block_01` |
| requires --expose-gc flag | 2 | `parallel/test-domain-async-id-map-leak.js`, `parallel/test-primitive-timer-leak.js` |
| requires --unhandled-rejections=throw flag | 2 | `parallel/test-promise-unhandled-throw-handler.js`, `parallel/test-promise-unhandled-throw.js` |
| requires CJS named export analysis (cjs-module-lexer) for ESM import of CJS modules | 2 | `es-module/test-require-module-dynamic-import-1.js`, `es-module/test-require-module-dynamic-import-2.js` |
| requires DNS lookup | 2 | `parallel/test-net-localerror.js`, `parallel/test-net-server-close-before-calling-lookup-callback.js` |
| requires child process spawning | 2 | `parallel/test-runner-module-mocking.js#test_11_node_modules_can_be_used_by_both_module_systems`, `parallel/test-runner-module-mocking.js#test_16_wrong_import_syntax_should_throw_error_after_module_mocking` |
| requires child process spawning and permission model | 2 | `parallel/test-runner-module-mocking.js#test_17_should_throw_err_access_denied_when_permission_model_is_enab`, `parallel/test-runner-module-mocking.js#test_18_should_work_when_allow_worker_is_passed_and_permission_model` |
| requires timer.unref() which is not implemented | 2 | `parallel/test-timers-unref-remove-other-unref-timers-only-one-fires.js`, `parallel/test-timers-unref-remove-other-unref-timers.js` |
| requires tls module which is not available in WASM | 2 | `parallel/test-crypto-verify-failure.js`, `parallel/test-crypto.js` |
| uncaughtExceptionMonitor event behavior in child_process flows is incomplete | 2 | `parallel/test-process-uncaught-exception-monitor.js#block_00_block_00`, `parallel/test-process-uncaught-exception-monitor.js#block_01_block_01` |
| wasi:http does not produce HPE_UNEXPECTED_CONTENT_LENGTH error code | 2 | `parallel/test-http-response-multi-content-length.js#block_00_test_adding_an_extra_content_length_header_using_setheader`, `parallel/test-http-response-multi-content-length.js#block_01_test_adding_an_extra_content_length_header_using_writehead` |
| --disable-proto=delete semantics differ in QuickJS (__proto__ yields null) | 1 | `parallel/test-disable-proto-delete.js` |
| --disable-proto=throw flag semantics are not implemented | 1 | `parallel/test-disable-proto-throw.js` |
| --disallow-code-generation-from-strings flag semantics are not implemented | 1 | `parallel/test-eval-disallow-code-generation-from-strings.js` |
| --no-experimental-global-customevent flag is not honored | 1 | `parallel/test-global-customevent-disabled.js` |
| --no-experimental-global-webcrypto flag is not honored | 1 | `parallel/test-global-webcrypto-disbled.js` |
| --trace-env diagnostics are not implemented in execPath emulation | 1 | `parallel/test-trace-env.js` |
| --trace-env-{js,native}-stack diagnostics are not implemented in execPath emulation | 1 | `parallel/test-trace-env-stack.js` |
| --trace-exit stack diagnostics are incomplete in execPath emulation | 1 | `parallel/test-trace-exit-stack-limit.js` |
| --trace-exit warning behavior across process/worker variants is incomplete | 1 | `parallel/test-trace-exit.js` |
| --trace-sync-io diagnostics are not implemented in execPath emulation | 1 | `parallel/test-sync-io-option.js` |
| AbortSignal edge case | 1 | `parallel/test-aborted-util.js#test_04_does_not_hang_forever` |
| ArrayBuffer transfer detachment semantics are incomplete | 1 | `parallel/test-worker-message-port.js#block_06_block_06` |
| AsyncLocalStorage context propagation across async boundaries is incomplete | 1 | `parallel/test-async-local-storage-contexts.js` |
| AsyncLocalStorage deep nesting/recursion handling is unstable | 1 | `parallel/test-async-local-storage-deep-stack.js` |
| AsyncLocalStorage.bind argument validation is incomplete | 1 | `parallel/test-async-local-storage-bind.js` |
| AsyncLocalStorage.snapshot is missing or incomplete | 1 | `parallel/test-async-local-storage-snapshot.js` |
| CLI --security-revert behavior in child_process spawnSync is not fully implemented | 1 | `parallel/test-security-revert-unknown.js` |
| CLI --title flag does not update process.title | 1 | `parallel/test-process-title-cli.js` |
| CLI --unhandled-rejections flag parsing/validation is incomplete | 1 | `parallel/test-promise-unhandled-flag.js` |
| CLI option precedence and NODE_OPTIONS merging are incomplete in execPath emulation | 1 | `parallel/test-cli-options-precedence.js` |
| CLI warning/negation behavior in execPath emulation is incomplete | 1 | `parallel/test-cli-options-negation.js` |
| Date timezone changes via process.env.TZ are not implemented | 1 | `parallel/test-process-env-tz.js` |
| ECDH key import/deriveBits compatibility for test vectors is incomplete | 1 | `parallel/test-webcrypto-derivebits-ecdh.js` |
| ECDH key import/deriveKey compatibility for test vectors is incomplete | 1 | `parallel/test-webcrypto-derivekey-ecdh.js` |
| ECDSA key import/sign/verify compatibility for test vectors is incomplete | 1 | `parallel/test-webcrypto-sign-verify-ecdsa.js` |
| ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG behavior is not implemented | 1 | `parallel/test-vm-dynamic-import-callback-missing-flag.js` |
| ESM diagnostics for require/exports globals and package type=module .js error messaging do not match Node yet | 1 | `es-module/test-esm-undefined-cjs-global-like-variables.js` |
| ESM directory import errors do not match Node ERR_UNSUPPORTED_DIR_IMPORT behavior | 1 | `parallel/test-directory-import.js` |
| ESM<->CJS export interop semantics (including __esModule/default/named export behavior and related errors) are not Node-compatible yet | 1 | `es-module/test-esm-cjs-exports.js` |
| EdDSA sign/verify vector compatibility is incomplete | 1 | `parallel/test-webcrypto-sign-verify-eddsa.js` |
| Error.prepareStackTrace default behavior is incomplete | 1 | `parallel/test-error-prepare-stack-trace.js` |
| EventEmitter captureRejections option validation/behavior is incomplete | 1 | `parallel/test-event-capture-rejections.js` |
| HKDF deriveBits argument validation/error codes do not match Node | 1 | `parallel/test-webcrypto-derivebits-hkdf.js` |
| HMAC sign/verify wrong-key error semantics do not match Node | 1 | `parallel/test-webcrypto-sign-verify-hmac.js` |
| HTTP server pipeline destroy/cleanup path does not propagate correctly — EIO on socket read after res.destroy() | 1 | `parallel/test-stream-pipeline.js#block_06_block_06` |
| Intl (including process.versions.tz expectations) is not available in current runtime | 1 | `parallel/test-tz-version.js` |
| MessageEvent.target/ports fields are incomplete | 1 | `parallel/test-worker-message-port.js#block_02_block_02` |
| MessagePort EventTarget API integration is incomplete | 1 | `parallel/test-worker-message-port.js#block_01_block_01` |
| MessagePort listener queueing semantics are incomplete | 1 | `parallel/test-worker-message-port.js#block_04_block_04` |
| MessagePort prototype surface differs from Node.js | 1 | `parallel/test-worker-message-port.js#block_08_block_08` |
| NODE_OPTIONS behavior via --env-file is incomplete in execPath child emulation | 1 | `parallel/test-dotenv-node-options.js` |
| NODE_V8_COVERAGE warning behavior in child_process execPath emulation is incomplete | 1 | `parallel/test-coverage-with-inspector-disabled.js` |
| OKP (Ed/X) key import/export compatibility is incomplete | 1 | `parallel/test-webcrypto-export-import-cfrg.js` |
| QuickJS await bypasses JS-visible Promise.prototype.then so ALS context is lost across await boundaries | 1 | `parallel/test-diagnostics-channel-tracing-channel-promise-run-stores.js` |
| QuickJS uses different error message for private field access | 1 | `parallel/test-runner-mocking.js#test_21_mocks_a_constructor` |
| RSA imported-key algorithm metadata compatibility is incomplete | 1 | `parallel/test-webcrypto-encrypt-decrypt-rsa.js` |
| RSA key import/export metadata compatibility is incomplete | 1 | `parallel/test-webcrypto-export-import-rsa.js` |
| RSA sign/verify error mapping does not match Node | 1 | `parallel/test-webcrypto-sign-verify-rsa.js` |
| Script.runInNewContext this-binding/type validation behavior does not match Node | 1 | `parallel/test-vm-new-script-new-context.js#block_07_block_07` |
| SourceTextModule import.meta initialization hook is not implemented | 1 | `parallel/test-vm-module-import-meta.js` |
| SourceTextModule linker/dependency parsing semantics are incomplete (imports, cycles, and attributes) | 1 | `parallel/test-vm-module-link.js` |
| WASM child emulation does not support --test-reporter in spawnPromisified | 1 | `parallel/test-runner-root-duration.js` |
| WASM child emulation does not support Node.js --test CLI behavior | 1 | `parallel/test-runner-exit-code.js` |
| WASM child emulation does not support Node.js --test force-exit reporter behavior | 1 | `parallel/test-runner-force-exit-failure.js` |
| WASM child emulation does not support Node.js --test reporter CLI behavior | 1 | `parallel/test-runner-reporters.js` |
| WHATWG streams edge case | 1 | `parallel/test-whatwg-readablebytestreambyob.js` |
| WebAssembly global is missing in VM contexts | 1 | `parallel/test-vm-codegen.js#block_00_block_00` |
| WebSocket is now always available in wasm-rquickjs | 1 | `parallel/test-websocket-disabled.js` |
| Worker transferList ArrayBuffer detachment semantics are incomplete | 1 | `parallel/test-worker-workerdata-messageport.js#block_02_block_02` |
| Worker transferList missing-port DataCloneError is not enforced | 1 | `parallel/test-worker-workerdata-messageport.js#block_03_block_03` |
| X25519/X448 deriveBits vector compatibility is incomplete | 1 | `parallel/test-webcrypto-derivebits-cfrg.js` |
| X25519/X448 deriveKey compatibility is incomplete | 1 | `parallel/test-webcrypto-derivekey-cfrg.js` |
| [manual] **Block_08 requires streaming/full-duplex HTTP request bodies**, which is architecturally incompatible with the current wasi:http implementation. | 1 | `parallel/test-stream-pipeline.js#block_08_block_08` |
| [manual] All subtests in `test-runner-cli-timeout.js` require `child_process.spawnSync` to spawn a **real Node.js process** in CLI `--test` runner mode with `NODE_DEBUG=test_runner`, then inspect s... | 1 | `parallel/test-runner-cli-timeout.js#test_01_timeout_of_10ms` |
| [manual] All subtests in `test-runner-cli-timeout.js` require `child_process.spawnSync` to spawn real Node.js child processes in CLI `--test` runner mode, then inspect their stderr for timeout debu... | 1 | `parallel/test-runner-cli-timeout.js#test_02_isolation_none_uses_the_test_timeout_flag` |
| [manual] The test asserts `res.headers.connection === 'keep-alive'`, but the `Connection` header is classified as a **forbidden hop-by-hop header** in wasmtime's wasi:http implementation (`wasmtime... | 1 | `parallel/test-http-automatic-headers.js` |
| [manual] The test asserts `response.rawHeaders.includes('Test')` (line 78) — requiring header name case preservation through the HTTP transport. In wasi:http, all header names are normalized to low... | 1 | `parallel/test-http-write-head.js` |
| [manual] The test requires TCP-level HTTP keep-alive where a single TCP connection is reused for multiple sequential requests. It asserts `assert.strictEqual(req.socket, serverSocket)` on the **ser... | 1 | `parallel/test-http-keepalive-client.js` |
| [manual] The test requires `child_process.spawnSync` to actually spawn Node.js processes in CLI `--test` runner mode with `NODE_DEBUG=test_runner`, then inspect stderr for timeout configuration deb... | 1 | `parallel/test-runner-cli-timeout.js#test_00_default_timeout_infinity` |
| [manual] The test's sub-tests 1-4 use `http.get()` and `http.request()` to connect to a local HTTP server that intentionally never responds. In the WASM architecture, these client requests go throu... | 1 | `parallel/test-http-set-timeout-server.js` |
| [manual] This test requires `child_process.execFileSync` to spawn real Node.js child processes from copied binaries, testing module resolution from global paths (`$HOME/.node_modules`, `$HOME/.node... | 1 | `parallel/test-module-loading-globalpaths.js` |
| [manual] This test requires `child_process.spawnSync()` to spawn real Node.js processes (`node --test`) and inspect their `stderr` output for concurrency configuration strings. WebAssembly componen... | 1 | `parallel/test-runner-cli-concurrency.js#test_02_concurrency_of_two` |
| [manual] This test requires `child_process.spawnSync` to spawn a real Node.js process with CLI flags (`--test --experimental-test-isolation=none --test-concurrency=2`) and inspect its stderr output... | 1 | `parallel/test-runner-cli-concurrency.js#test_04_isolation_none_overrides_test_concurrency` |
| [manual] This test requires `child_process.spawnSync` to spawn a real Node.js process with CLI flags (`--test --experimental-test-isolation=none`) and inspect its stderr output for internal concurr... | 1 | `parallel/test-runner-cli-concurrency.js#test_03_isolation_none_uses_a_concurrency_of_one` |
| [manual] This test requires `child_process.spawnSync` to spawn an actual Node.js process with the `--test` CLI flag and then inspects `NODE_DEBUG=test_runner` stderr output for internal concurrency... | 1 | `parallel/test-runner-cli-concurrency.js#test_00_default_concurrency` |
| [manual] This test uses `spawnSync(process.execPath, ['--test', '--test-concurrency=1'])` to spawn a Node.js child process in `--test` CLI mode and asserts on internal `NODE_DEBUG=test_runner` diag... | 1 | `parallel/test-runner-cli-concurrency.js#test_01_concurrency_of_one` |
| [manual] amp partial fix caused regressions | 1 | `parallel/test-http-upgrade-client.js` |
| [manual] requires Node.js --test-shard option (first shard) | 1 | `parallel/test-runner-cli.js#block_08_block_08` |
| [manual] requires Node.js --test-shard option (last shard) | 1 | `parallel/test-runner-cli.js#block_09_block_09` |
| [manual] requires Node.js test runner (--test mode with directory scanning, TAP output) | 1 | `parallel/test-runner-cli.js#block_01_block_01` |
| [manual] requires Node.js test runner (--test with --loader/--require) | 1 | `parallel/test-runner-cli.js#block_02_block_02` |
| [manual] requires Node.js test runner (file matching) | 1 | `parallel/test-runner-cli.js#block_10_block_10` |
| [manual] the test currently deadlocks in the runtime pollable/executor path (same-component `node:http` client calling back into same-component server via `wasi:http`), and I could not resolve it f... | 1 | `parallel/test-http-write-head-after-set-header.js` |
| [manual] wasmtime's `wasi:http` implementation strips `host` and `proxy-authorization` headers from HTTP responses (treating them as forbidden/hop-by-hop headers). The test asserts all 17 "norepeat... | 1 | `parallel/test-http-response-multiheaders.js` |
| [manual] wasmtime-wasi-http explicitly strips hop-by-hop headers (`Keep-Alive`, `Connection`) from HTTP responses via `DEFAULT_FORBIDDEN_HEADERS` / `remove_forbidden_headers()` before the WASM gues... | 1 | `parallel/test-http-keep-alive-timeout-custom.js` |
| accesses internal Resolver._handle property | 1 | `parallel/test-dns-get-server.js` |
| addAbortListener lacks argument validation and already-aborted/stopImmediatePropagation handling | 1 | `parallel/test-events-add-abort-listener.mjs` |
| addon resolution condition not applicable | 1 | `parallel/test-no-addons-resolution-condition.js` |
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
| child_process exec/spawn emulation does not fully match --help process behavior | 1 | `parallel/test-cli-node-print-help.js` |
| child_process execPath emulation does not honor --allow-addons/node-addons resolution | 1 | `parallel/test-permission-allow-addons-cli.js` |
| child_process execPath emulation does not implement --completion-bash output | 1 | `parallel/test-bash-completion.js` |
| child_process execPath emulation does not yet match Node CLI argument validation/exit codes | 1 | `parallel/test-cli-bad-options.js` |
| child_process execPath emulation has incomplete --require preload/argv handling | 1 | `parallel/test-preload-print-process-argv.js` |
| child_process execPath emulation lacks full --import/--require preload semantics | 1 | `es-module/test-require-module-preload.js` |
| child_process execPath emulation lacks full NODE_OPTIONS and CLI flag semantics | 1 | `parallel/test-cli-node-options.js` |
| child_process fork IPC/stdout stream behavior is incomplete | 1 | `parallel/test-process-external-stdio-close.js` |
| child_process spawn IPC/stdout stream behavior is incomplete | 1 | `parallel/test-process-external-stdio-close-spawn.js` |
| child_process spawn stdio/event behavior is incomplete in execPath emulation | 1 | `parallel/test-tracing-no-crash.js` |
| child_process spawnSync does not preserve stdout for symlinked execPath runs | 1 | `parallel/test-process-execpath.js` |
| child_process stdio pipe lifecycle/destroy semantics are incomplete | 1 | `parallel/test-stdio-undestroy.js` |
| child_process.exec does not expose live stderr/stdout streams on ChildProcess | 1 | `parallel/test-stdout-close-catch.js` |
| client never calls end(), wasi:http cannot finalize request | 1 | `parallel/test-http-outgoing-message-capture-rejection.js#block_01_block_01` |
| codeGeneration.wasm enforcement is incomplete and WebAssembly is unavailable in the context | 1 | `parallel/test-vm-codegen.js#block_02_block_02` |
| common shim is missing ../common/fixtures.mjs and child_process execPath emulation does not fully support the ESM CLI modes this test exercises (--input-type/--import) | 1 | `es-module/test-esm-import-meta-resolve.mjs` |
| common-shim expectWarning() behavior is not implemented | 1 | `parallel/test-common-expect-warning.js` |
| common-shim mustNotCall() error formatting differs from Node's test harness | 1 | `parallel/test-common-must-not-call.js` |
| common-shim spawnPromisified child emulation does not support --no-experimental-require-module | 1 | `es-module/test-cjs-esm-warn.js` |
| contextCodeGeneration/codeGeneration options do not block string eval with the expected EvalError | 1 | `parallel/test-vm-codegen.js#block_01_block_01` |
| contextified assignment semantics for strict/non-strict writes to non-writable globals are incorrect | 1 | `parallel/test-vm-strict-assign.js` |
| contextified global proxy identity/property fallback semantics are incomplete | 1 | `parallel/test-vm-property-not-on-sandbox.js` |
| createContext does not preserve non-enumerable/non-writable sandbox property descriptors | 1 | `parallel/test-vm-preserves-property.js` |
| createContext incorrectly triggers Proxy getOwnPropertyDescriptor traps | 1 | `parallel/test-vm-proxy-failure-CP.js` |
| custom ESM loader hooks (--experimental-loader) and assertionless JSON import behavior are not implemented | 1 | `es-module/test-esm-assertionless-json-import.js` |
| defining global accessor properties in vm contexts does not round-trip to the sandbox correctly | 1 | `parallel/test-vm-global-define-property.js` |
| dgram close-before-lookup race handling is incomplete | 1 | `parallel/test-dgram-bind-socket-close-before-lookup.js` |
| dgram does not validate options.lookup type | 1 | `parallel/test-dgram-custom-lookup.js#block_02_block_02` |
| diagnostics_channel integration | 1 | `parallel/test-console-diagnostics-channels.js` |
| diagnostics_channel integration for http events is incomplete | 1 | `parallel/test-diagnostics-channel-http.js` |
| diagnostics_channel integration for net events is incomplete | 1 | `parallel/test-diagnostics-channel-net.js` |
| dns perf_hooks integration not implemented | 1 | `parallel/test-dns-perf_hooks.js` |
| dotenv CLI --env-file parsing is incomplete | 1 | `parallel/test-dotenv.js` |
| dotenv CLI flags are incomplete in execPath child emulation | 1 | `parallel/test-dotenv-edge-cases.js` |
| dynamic import callback handling does not correctly support module namespace return values | 1 | `parallel/test-vm-module-dynamic-namespace.js` |
| error messages differ slightly from upstream Node.js for tracingChannel({}) case | 1 | `parallel/test-diagnostics-channel-tracing-channel-args-types.js` |
| events.EventEmitterAsyncResource API and ERR_INVALID_THIS branding are incomplete | 1 | `parallel/test-eventemitter-asyncresource.js` |
| execPath child emulation does not support --trace-atomics-wait CLI behavior | 1 | `parallel/test-trace-atomic-deprecation.js` |
| fails: Readable stream error during pipelined server responses | 1 | `parallel/test-http-many-ended-pipelines.js` |
| fails: request error when sending raw header pairs via wasi:http | 1 | `parallel/test-http-client-headers-array.js` |
| fs permission coverage tables are out of sync with exposed fs API surface | 1 | `parallel/test-permission-fs-supported.js` |
| fs symlink permission checks are incomplete | 1 | `parallel/test-permission-fs-symlink-relative.js` |
| fs.constants includes Linux-only O_NOATIME even when common.isLinux is false in WASM | 1 | `parallel/test-process-constants-noatime.js` |
| fs.globSync API is not implemented | 1 | `parallel/test-icu-env.js` |
| fs/promises FileHandle.readableWebStream support is missing or incomplete | 1 | `parallel/test-filehandle-readablestream.js` |
| function declaration/global binding semantics in vm contexts are incomplete | 1 | `parallel/test-vm-function-declaration.js` |
| function declarations are not persisted correctly across vm.runInContext calls | 1 | `parallel/test-vm-function-redefinition.js` |
| global performance object lacks Node perf_hooks API surface | 1 | `parallel/test-performance-global.js` |
| global process/Buffer accessor setter semantics are incomplete | 1 | `parallel/test-global-setters.js` |
| global property descriptor/interceptor behavior in vm contexts is incomplete | 1 | `parallel/test-vm-global-property-interceptors.js` |
| global web streams and node:stream/web exports are inconsistent | 1 | `parallel/test-global-webstreams.js` |
| globalThis shape differs from Node.js | 1 | `parallel/test-global.js` |
| hangs: 1xx informational responses not supported via wasi:http | 1 | `parallel/test-http-information-processing.js` |
| hangs: Expect header handling not fully implemented | 1 | `parallel/test-http-expect-handling.js` |
| hangs: Expect: 100-continue not fully implemented | 1 | `parallel/test-http-expect-continue.js` |
| hangs: creates 4 concurrent server-client pairs with net.connect raw TCP | 1 | `parallel/test-http-outgoing-first-chunk-singlebyte-encoding.js` |
| hangs: relies on Agent connection lifecycle not fully implemented | 1 | `parallel/test-http-client-agent-end-close-event.js` |
| hangs: relies on Agent createConnection not fully implemented | 1 | `parallel/test-http-client-override-global-agent.js` |
| hangs: relies on Agent timeout behavior not fully implemented | 1 | `parallel/test-http-client-timeout-agent.js` |
| hangs: relies on Agent.createConnection returning real sockets | 1 | `parallel/test-http-client-with-create-connection.js` |
| hangs: relies on ClientRequest timeout behavior not fully implemented | 1 | `parallel/test-http-client-timeout-with-data.js` |
| hangs: relies on ClientRequest timeout option not fully implemented | 1 | `parallel/test-http-client-timeout-option-listeners.js` |
| hangs: relies on ClientRequest.setTimeout not fully implemented | 1 | `parallel/test-http-client-set-timeout.js` |
| hangs: relies on HTTP parser lifecycle internals | 1 | `parallel/test-http-parser-freed-before-upgrade.js` |
| hangs: relies on IPv6 connection failure behavior | 1 | `parallel/test-http-host-header-ipv6-fail.js` |
| hangs: relies on close event tampering edge case | 1 | `parallel/test-http-req-close-robust-from-tampering.js` |
| hangs: relies on keep-alive connection piping | 1 | `parallel/test-http-client-pipe-end.js` |
| hangs: relies on request abort/timeout interaction not fully implemented | 1 | `parallel/test-http-client-spurious-aborted.js` |
| hangs: relies on response pause/resume backpressure | 1 | `parallel/test-http-pause.js` |
| hangs: relies on response stream cleanup behavior | 1 | `parallel/test-http-dump-req-when-res-ends.js` |
| hangs: relies on socket encoding error handling | 1 | `parallel/test-http-socket-encoding-error.js` |
| hangs: relies on socket error listener behavior | 1 | `parallel/test-http-socket-error-listeners.js` |
| hangs: relies on socket timeout event firing; wasi:http client has no real socket timeouts | 1 | `parallel/test-http-client-timeout-option.js` |
| hangs: relies on socket.setNoDelay verification | 1 | `parallel/test-http-nodelay.js` |
| hangs: relies on trailer support not fully implemented | 1 | `parallel/test-http-set-trailers.js` |
| hangs: relies on uncaughtException handling in request callbacks | 1 | `parallel/test-http-exceptions.js` |
| hangs: relies on unconsumed request body behavior | 1 | `parallel/test-http-no-read-no-dump.js` |
| hangs: relies on write-after-end error handling | 1 | `parallel/test-http-res-write-after-end.js` |
| hangs: requires domain module integration with HTTP client | 1 | `parallel/test-http-client-response-domain.js` |
| hangs: requires keep-alive socket reuse and res.connection.end() | 1 | `parallel/test-http-client-keep-alive-release-before-finish.js` |
| hangs: server never ends response, destroy during active readBodyChunk cannot unblock native async poll | 1 | `parallel/test-http-client-incomingmessage-destroy.js` |
| hangs: test calls server.close() from server handler without consuming client response, causing WASM event loop to not drain | 1 | `parallel/test-http-early-hints-invalid-argument.js` |
| hangs: test relies on Agent createConnection internals | 1 | `parallel/test-http-agent-uninitialized.js` |
| hangs: test relies on Agent._addSession and createConnection internals | 1 | `parallel/test-http-agent-uninitialized-with-handle.js` |
| hangs: test sends raw TCP bytes and expects clientError events | 1 | `parallel/test-http-client-error-rawbytes.js` |
| hangs: test sends raw TCP bytes for invalid transfer-encoding | 1 | `parallel/test-http-invalid-te.js` |
| hangs: test sends raw TCP bytes for malformed headers | 1 | `parallel/test-http-header-badrequest.js` |
| hangs: test sends raw TCP bytes for pipeline flooding | 1 | `parallel/test-http-pipeline-flood.js` |
| hangs: test sends raw TCP bytes to trigger header overflow | 1 | `parallel/test-http-header-overflow.js` |
| hangs: test spawns child_process and uses fixed port allocation | 1 | `parallel/test-http-chunk-problem.js` |
| hangs: test uses raw TCP for full response verification | 1 | `parallel/test-http-full-response.js` |
| hangs: test uses raw TCP for header chain verification | 1 | `parallel/test-http-set-header-chain.js` |
| hangs: test uses raw TCP for header removal verification | 1 | `parallel/test-http-remove-header-stays-removed.js` |
| hangs: test uses raw TCP to verify header case preservation | 1 | `parallel/test-http-raw-headers.js` |
| hangs: test uses raw TCP to verify multiple header handling | 1 | `parallel/test-http-multiple-headers.js` |
| hangs: test uses raw TCP to verify mutable headers | 1 | `parallel/test-http-mutable-headers.js` |
| http.IncomingMessage internal _addHeaderLines helper is not implemented | 1 | `parallel/test-set-incoming-message-header.js#block_02_addheaderlines_function_set_a_header_correctly` |
| importModuleDynamically callback and error semantics are incomplete for vm.Script and vm.SourceTextModule | 1 | `parallel/test-vm-module-dynamic-import.js` |
| indexed property definitions on vm globals do not propagate to the sandbox | 1 | `parallel/test-vm-indexed-properties.js` |
| inherited: requires dgram and DNS protocol-level testing | 1 | `parallel/test-dns-setlocaladdress.js#block_01_verify_that_setlocaladdress_throws_if_called_with_an_invalid` |
| invalid EC private keys do not raise Node-compatible DataError | 1 | `parallel/test-webcrypto-export-import-ec.js#block_01_bad_private_keys` |
| legacy punycode builtin is not wired into CommonJS module resolution | 1 | `parallel/test-punycode.js` |
| missing ERR_INVALID_ARG_TYPE validation for listen options | 1 | `parallel/test-net-server-listen-options.js#block_00_block_00` |
| missing importModuleDynamically callback does not raise ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING | 1 | `parallel/test-vm-no-dynamic-import-callback.js` |
| module resolution edge case | 1 | `parallel/test-module-circular-symlinks.js` |
| mustCall callbacks not fired during idle connection close + response wait | 1 | `parallel/test-http-server-close-idle-wait-response.js` |
| node:module does not implement package.json exports condition resolution (module-sync/require/import/default) | 1 | `es-module/test-require-module-conditional-exports-module.js` |
| node:module.findPackageJSON API behavior is incomplete | 1 | `parallel/test-find-package-json.js` |
| node:readline Interface constructor/options are not implemented | 1 | `parallel/test-readline-interface-escapecodetimeout.js` |
| node:test mock timers Date behavior is incomplete | 1 | `parallel/test-runner-mock-timers-date.js` |
| node:test mock timers scheduler.wait behavior is incomplete | 1 | `parallel/test-runner-mock-timers-scheduler.js` |
| node:test t.assert.fileSnapshot validation behavior is incomplete | 1 | `parallel/test-runner-snapshot-file-tests.js#test_00_t_assert_filesnapshot_validation` |
| node:vm does not yet support importModuleDynamically/SyntheticModule semantics used by this dynamic import lifetime test | 1 | `es-module/test-dynamic-import-script-lifetime.js` |
| node_compat test fixture module ../common/process-exit-code-cases is not resolved in this runtime | 1 | `parallel/test-process-exit-code.js` |
| non-writable global property semantics in vm contexts are incomplete | 1 | `parallel/test-vm-global-non-writable-properties.js` |
| package resolution from ESM (node_modules dependency without package.json) is incomplete | 1 | `es-module/test-require-module.js#block_04_also_test_default_export` |
| passive listener semantics are incomplete (test currently self-skips) | 1 | `parallel/test-whatwg-events-add-event-listener-options-passive.js#block_01_block_01` |
| per-context Symbol/global binding behavior is incomplete in vm contexts | 1 | `parallel/test-vm-harmony-symbols.js` |
| perf_hooks nodeTiming milestones/duration semantics are incomplete | 1 | `parallel/test-performance-nodetiming.js` |
| perf_hooks nodeTiming.uvMetricsInfo is missing | 1 | `parallel/test-performance-nodetiming-uvmetricsinfo.js` |
| perf_hooks performance.toJSON() does not expose nodeTiming yet | 1 | `parallel/test-tojson-perf_hooks.js` |
| performance.timerify function entries are not implemented | 1 | `parallel/test-performance-function-async.js` |
| permission mode does not yet honor --allow-addons/node-addons export-condition semantics | 1 | `parallel/test-permission-no-addons.js` |
| permission security-warning emission for --allow-* flags is incomplete | 1 | `parallel/test-permission-warning-flags.js` |
| postMessage function cloning should throw DataCloneError | 1 | `parallel/test-worker-message-port-transfer-native.js#block_00_block_00` |
| postMessage transferList argument validation is not Node-compatible yet | 1 | `parallel/test-worker-message-port.js#block_05_block_05` |
| preload module handling edge case | 1 | `parallel/test-preload-self-referential.js` |
| process is constructed as new EventEmitter() but prototype chain not fully compatible with Node.js expectations | 1 | `parallel/test-process-prototype.js` |
| process object tagging differs from Node (Object.prototype.toString.call(process)) | 1 | `parallel/test-vm-basic.js#block_02_vm_runinthiscontext` |
| process unhandledRejection/warning semantics are incomplete | 1 | `parallel/test-promise-handled-rejection-no-warning.js` |
| process.assert() is not implemented | 1 | `parallel/test-process-assert.js` |
| process.env defaults are incomplete (PATH is missing in VM context) | 1 | `parallel/test-vm-access-process-env.js` |
| process.exitCode validation and coercion semantics are incomplete | 1 | `parallel/test-process-exit-code-validation.js` |
| process.getuid() returns 0 (root) in WASM but seteuid/setegid cannot actually change credentials | 1 | `parallel/test-process-euid-egid.js` |
| process.getuid() returns 0 (root) in WASM but setgid/setuid cannot actually change credentials | 1 | `parallel/test-process-uid-gid.js` |
| process.loadEnvFile() behavior is incomplete | 1 | `parallel/test-process-load-env-file.js` |
| process.on('uncaughtException') handling during top-level module errors is incomplete | 1 | `parallel/test-exception-handler2.js` |
| process.ppid is stubbed and not wired to parent process IDs | 1 | `parallel/test-process-ppid.js` |
| process.ref()/process.unref() are not implemented | 1 | `parallel/test-process-ref-unref.js` |
| process.resourceUsage() is not implemented | 1 | `parallel/test-resource-usage.js` |
| process.stdout is not yet a full stream.Writable implementation | 1 | `parallel/test-stdout-pipeline-destroy.js` |
| promise rejection tracking incomplete | 1 | `parallel/test-promise-swallowed-event.js` |
| regression: was enabled but started failing | 1 | `parallel/test-require-extension-over-directory.js` |
| relies on keepAlive socket reuse and backpressure which are not supported in WASI | 1 | `parallel/test-http-outgoing-end-cork.js` |
| relies on server-side drain/backpressure and captureRejections propagation | 1 | `parallel/test-http-outgoing-message-capture-rejection.js#block_00_block_00` |
| relies on socket.parser lifecycle internals of HTTP server/client | 1 | `parallel/test-http-parser-memory-retention.js` |
| require(esm) rejection handling does not match Node behavior (unexpected unhandledRejection) | 1 | `es-module/test-require-module-synchronous-rejection-handling.js` |
| requires --experimental-eventsource flag and EventSource global which is not implemented (needs HTTP streaming/SSE support) | 1 | `parallel/test-eventsource.js` |
| requires --expose-internals and internal/event_target | 1 | `parallel/test-eventtarget-once-twice.js` |
| requires --unhandled-rejections=strict flag | 1 | `parallel/test-promise-unhandled-error.js` |
| requires AsyncLocalStorage context propagation across concurrent HTTP activity which is not implemented | 1 | `parallel/test-async-local-storage-http-multiclients.js` |
| requires CFRG key (Ed448/X25519/X448) DER export support | 1 | `parallel/test-webcrypto-wrap-unwrap.js` |
| requires DNS lookup for IPv6 | 1 | `parallel/test-net-connect-options-ipv6.js` |
| requires ERR_INVALID_ARG_TYPE validation on resolve methods (not yet implemented) | 1 | `parallel/test-dns-resolvens-typeerror.js` |
| requires IPv6 dual-stack and DNS resolution | 1 | `parallel/test-net-listen-ipv6only.js` |
| requires Intl/timezone data support that is not available in the current runtime | 1 | `parallel/test-datetime-change-notify.js` |
| requires Node.js internal modules | 1 | `parallel/test-http-set-max-idle-http-parser.js` |
| requires PerformanceObserver with HTTP performance entries | 1 | `parallel/test-http-perf_hooks.js` |
| requires WebCrypto AES-GCM with specific tag length validation | 1 | `parallel/test-crypto-webcrypto-aes-decrypt-tag-too-small.js` |
| requires actual TCP socket reuse with remotePort identity tracking via server; wasi:http creates new connections per request | 1 | `parallel/test-http-agent-scheduling.js` |
| requires captureRejections option | 1 | `parallel/test-net-server-capture-rejection.js` |
| requires createConnection to forward keepAlive/keepAliveInitialDelay options; wasi:http does not use Agent.createConnection for outbound requests | 1 | `parallel/test-http-agent-keepalive-delay.js` |
| requires fd option for listen | 1 | `parallel/test-net-listen-fd0.js` |
| requires internal/test/binding | 1 | `parallel/test-net-server-keepalive.js` |
| requires net.BlockList | 1 | `parallel/test-net-server-blocklist.js` |
| requires net.createServer with pauseOnConnect and socket.localPort; wasi:http does not expose socket-level properties | 1 | `parallel/test-http-agent-reuse-drained-socket-only.js` |
| requires onread option with buffer/callback | 1 | `parallel/test-net-onread-static-buffer.js` |
| requires process.memoryUsage() | 1 | `parallel/test-net-connect-memleak.js` |
| requires process.on('exit') and functional timer.unref() to prevent event loop from waiting | 1 | `parallel/test-timers-destroyed.js` |
| requires process.on('exit') hooks | 1 | `parallel/test-timers-immediate-queue.js` |
| requires process.on('uncaughtException') and unhandledRejection handling | 1 | `parallel/test-promise-unhandled-default.js` |
| requires process.on('uncaughtException') hooks | 1 | `parallel/test-events-uncaught-exception-stack.js` |
| requires process.stdin | 1 | `parallel/test-net-listen-after-destroying-stdin.js` |
| requires raw TCP response with obsolete HTTP line-folded headers; wasi:http rejects them | 1 | `parallel/test-http-multi-line-headers.js` |
| requires remote server close detection on idle keep-alive sockets and socket hang up errors; wasi:http creates independent connections per request with no shared socket lifecycle | 1 | `parallel/test-http-agent-keepalive.js` |
| requires reusePort option and cluster | 1 | `parallel/test-net-reuseport.js` |
| requires reusePort socket option not supported in WASI | 1 | `parallel/test-dgram-reuseport.js` |
| requires scheduler.yield, scheduler.wait, and ERR_ILLEGAL_CONSTRUCTOR | 1 | `parallel/test-timers-promises-scheduler.js` |
| requires test/addons/ directory and common/tmpdir fixtures | 1 | `parallel/test-process-dlopen-error-message-crash.js` |
| requires timer._idleTimeout, _onTimeout, and other internal timer properties | 1 | `parallel/test-timers-active.js` |
| requires timer.unref() and _unrefActive | 1 | `parallel/test-timers-unref-active.js` |
| requires timers module to export setTimeout/setInterval/setImmediate directly | 1 | `parallel/test-timers-api-refs.js` |
| requires timers.enroll which is not implemented | 1 | `parallel/test-timers-enroll-invalid-msecs.js` |
| requires v8.queryObjects (--expose-internals) | 1 | `parallel/test-diagnostics-channel-memory-leak.js` |
| runInContext does not preserve symbol/prototype property access on contextified objects | 1 | `parallel/test-vm-symbols.js` |
| runInNewContext assignment with Proxy sandbox does not match Node trap behavior | 1 | `parallel/test-vm-set-property-proxy.js` |
| runInNewContext does not propagate global writes back to the sandbox correctly | 1 | `parallel/test-vm-new-script-new-context.js#block_04_block_04` |
| runInNewContext own-vs-inherited property assignment semantics are incomplete | 1 | `parallel/test-vm-inherited_properties.js` |
| runInNewContext sandbox binding and write-back semantics are incomplete | 1 | `parallel/test-vm-run-in-new-context.js` |
| runInThisContext/runInContext sloppy-mode var/delete semantics are incorrect | 1 | `parallel/test-vm-not-strict.js` |
| second block requires EventEmitter captureRejections constructor option which is not implemented | 1 | `parallel/test-domain-ee.js` |
| sends 10000 pipelined requests which exceeds WASM resource limits | 1 | `parallel/test-http-pipeline-requests-connection-leak.js` |
| server-based test with writableLength tracking requires precise socket HWM | 1 | `parallel/test-http-outgoing-properties.js#block_02_block_02` |
| snapshot update/read flow via node:test is incomplete in WASM child emulation | 1 | `parallel/test-runner-snapshot-file-tests.js#test_01_t_assert_filesnapshot_update_read_flow` |
| source-map cache eviction via findSourceMap()/GC is incomplete | 1 | `parallel/test-source-map-cjs-require-cache.js` |
| spawnSyncAndExit with --experimental-print-required-tla not supported | 1 | `es-module/test-require-module-tla.js#block_01_block_01` |
| stack-overflow recovery around vm.runInThisContext/runInNewContext traps in WASM | 1 | `parallel/test-vm-low-stack-space.js` |
| stdout redirection to file not implemented | 1 | `parallel/test-stdout-to-file.js` |
| stream edge case | 1 | `parallel/test-readable-from-iterator-closing.js` |
| stream/web compression constructor error codes are not Node-compatible yet | 1 | `parallel/test-whatwg-webstreams-compression.js` |
| strict-mode assignment semantics in vm contexts differ from Node | 1 | `parallel/test-vm-strict-mode.js` |
| subtle.digest unsupported-algorithm error semantics do not match Node | 1 | `parallel/test-webcrypto-digest.js` |
| test uses V8-specific percent-encoded module syntax | 1 | `parallel/test-http-same-map.js` |
| test uses raw TCP (net.createServer) with HTTP/0.9 responses that wasi:http cannot parse | 1 | `parallel/test-http-response-no-headers.js` |
| times out after 120s | 1 | `parallel/test-http-autoselectfamily.js` |
| trace_events dynamic file output for node.async_hooks is incomplete | 1 | `parallel/test-trace-events-async-hooks-dynamic.js` |
| trace_events node.console category output is incomplete | 1 | `parallel/test-trace-events-console.js` |
| trace_events node.environment category output is incomplete | 1 | `parallel/test-trace-events-environment.js` |
| transferability checks and DataCloneError behavior are incomplete | 1 | `parallel/test-worker-message-port.js#block_07_block_07` |
| tty stdin stream/event-emitter compatibility is incomplete | 1 | `parallel/test-tty-stdin-end.js` |
| uncaughtException rethrow exit-code semantics are incomplete | 1 | `parallel/test-unhandled-exception-rethrow-error.js` |
| util.MIMEType parsing API is not implemented | 1 | `parallel/test-mime-whatwg.js` |
| util.MIMEType/util.MIMEParams are not implemented | 1 | `parallel/test-mime-api.js` |
| v8.setFlagsFromString argument validation error fidelity is incomplete | 1 | `parallel/test-v8-flag-type-check.js` |
| valid EC key vectors fail to import | 1 | `parallel/test-webcrypto-export-import-ec.js#block_00_block_00` |
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
| vm timeout interrupt is surfaced as a wasm trap instead of ERR_SCRIPT_EXECUTION_TIMEOUT | 1 | `parallel/test-vm-timeout.js` |
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
| wasi:http automatically adds Host header from URL, cannot send request without Host | 1 | `parallel/test-http-request-host-header.js#block_00_block_00` |
| wasi:sockets UDP implementation crashes on dgram close in this scenario | 1 | `parallel/test-dgram-send-cb-quelches-error.js` |

### WASI-impossible (1310)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| [manual] http2/https not implemented | 291 | `parallel/test-http2-allow-http1.js`, `parallel/test-http2-altsvc.js`, `parallel/test-http2-async-local-storage.js`, ... (+288) |
| tls/https is not supported in WebAssembly environment | 196 | `parallel/test-https-agent-create-connection.js#block_00_use_option_connect`, `parallel/test-https-agent-create-connection.js#block_01_use_port_and_option_connect`, `parallel/test-https-agent-create-connection.js#block_02_use_port_and_host_and_option_connect`, ... (+193) |
| inspector/debugger is not available in WASM | 101 | `parallel/test-debugger-backtrace.js`, `parallel/test-debugger-break.js`, `parallel/test-debugger-breakpoint-exists.js`, ... (+98) |
| worker_threads is not supported in WASM | 91 | `parallel/test-worker-broadcastchannel-wpt.js#block_00_block_00`, `parallel/test-worker-broadcastchannel-wpt.js#block_01_block_01`, `parallel/test-worker-broadcastchannel-wpt.js#block_02_block_02`, ... (+88) |
| cluster requires process forking, not available in WASM | 89 | `parallel/test-cluster-accept-fail.js`, `parallel/test-cluster-advanced-serialization.js`, `parallel/test-cluster-basic.js`, ... (+86) |
| requires child_process which is not available in WASM | 83 | `parallel/test-child-process-advanced-serialization-largebuffer.js`, `parallel/test-child-process-advanced-serialization-splitted-length-field.js`, `parallel/test-child-process-advanced-serialization.js`, ... (+80) |
| requires worker_threads which is not available in WASM | 70 | `parallel/test-perf-hooks-worker-timeorigin.js`, `parallel/test-preload-worker.js`, `parallel/test-worker-abort-on-uncaught-exception-terminate.js`, ... (+67) |
| V8 snapshot feature, not available in QuickJS/WASM | 57 | `parallel/test-snapshot-api.js#block_00_block_00`, `parallel/test-snapshot-api.js#block_01_block_01`, `parallel/test-snapshot-argv1.js#block_00_block_00`, ... (+54) |
| REPL requires interactive terminal, not available in WASM | 56 | `parallel/test-repl-array-prototype-tempering.js`, `parallel/test-repl-autocomplete.js`, `parallel/test-repl-clear-immediate-crash.js`, ... (+53) |
| Node.js SEA packaging, not available in WASM | 28 | `parallel/test-single-executable-blob-config-errors.js#block_00_block_00`, `parallel/test-single-executable-blob-config-errors.js#block_01_block_01`, `parallel/test-single-executable-blob-config-errors.js#block_02_block_02`, ... (+25) |
| ESLint tooling tests, not applicable to WASM runtime | 24 | `parallel/test-eslint-alphabetize-errors.js`, `parallel/test-eslint-alphabetize-primordials.js`, `parallel/test-eslint-async-iife-no-unused-result.js`, ... (+21) |
| repl is not supported in WASM | 23 | `parallel/test-readline-interface-no-trailing-newline.js`, `parallel/test-readline-interface-recursive-writes.js`, `parallel/test-repl-autolibs.js`, ... (+20) |
| tls is not supported in WebAssembly environment | 20 | `parallel/test-double-tls-client.js`, `parallel/test-double-tls-server.js`, `parallel/test-gc-tls-external-memory.js`, ... (+17) |
| V8 compile cache, not available in QuickJS/WASM | 15 | `parallel/test-compile-cache-api-env.js`, `parallel/test-compile-cache-api-error.js`, `parallel/test-compile-cache-api-flush.js`, ... (+12) |
| V8 profiling, not available in WASM | 12 | `sequential/test-cpu-prof-default.js`, `sequential/test-cpu-prof-dir-absolute.js`, `sequential/test-cpu-prof-dir-and-name.js`, ... (+9) |
| https is not supported in WebAssembly environment | 11 | `parallel/test-https-insecure-parse-per-stream.js#block_00_test_1_the_server_sends_an_invalid_header`, `parallel/test-https-insecure-parse-per-stream.js#block_01_test_2_the_same_as_test_1_except_without_the_option_to_make_`, `parallel/test-https-insecure-parse-per-stream.js#block_02_test_3_the_client_sends_an_invalid_header`, ... (+8) |
| inspector/heap profiler is not available in WASM | 10 | `parallel/test-heap-prof-basic.js`, `parallel/test-heap-prof-dir-absolute.js`, `parallel/test-heap-prof-dir-name.js`, ... (+7) |
| requires --abort-on-uncaught-exception child-process abort behavior | 10 | `parallel/test-domain-no-error-handler-abort-on-uncaught-0.js`, `parallel/test-domain-no-error-handler-abort-on-uncaught-1.js`, `parallel/test-domain-no-error-handler-abort-on-uncaught-2.js`, ... (+7) |
| V8 heap features, not available in WASM | 8 | `parallel/test-heapsnapshot-near-heap-limit-by-api-in-worker.js`, `parallel/test-heapsnapshot-near-heap-limit-worker.js`, `sequential/test-heapdump-flag-custom-dir.js`, ... (+5) |
| requires child_process IPC/fork which is not available in WASM | 8 | `parallel/test-child-process-fork-close.js`, `parallel/test-child-process-fork-net-server.js`, `parallel/test-child-process-fork-net-socket.js`, ... (+5) |
| requires internal/crypto/util | 8 | `parallel/test-webcrypto-keygen.js#block_00_test_invalid_algorithms`, `parallel/test-webcrypto-keygen.js#block_01_test_bad_usages`, `parallel/test-webcrypto-keygen.js#block_02_test_rsa_key_generation`, ... (+5) |
| http2 is not supported in WebAssembly environment | 4 | `parallel/test-h2-large-header-cause-client-to-hangup.js`, `parallel/test-h2leak-destroy-session-on-socket-ended.js`, `parallel/test-http2-alpn.js#block_00_block_00`, ... (+1) |
| inherited: Windows UNC path behavior is not applicable to the WASI runtime | 4 | `parallel/test-permission-fs-windows-path.js#block_00_block_00`, `parallel/test-permission-fs-windows-path.js#block_01_block_01`, `parallel/test-permission-fs-windows-path.js#block_02_block_02`, ... (+1) |
| inherited: requires worker_threads.BroadcastChannel, unavailable without threads in WASM | 4 | `parallel/test-broadcastchannel-custom-inspect.js#block_00_block_00`, `parallel/test-broadcastchannel-custom-inspect.js#block_01_block_01`, `parallel/test-broadcastchannel-custom-inspect.js#block_02_block_02`, ... (+1) |
| requires child_process.spawn for child env verification | 4 | `parallel/test-process-env.js#block_00_block_00`, `parallel/test-process-env.js#block_01_block_01`, `parallel/test-process-env.js#block_02_https_github_com_nodejs_node_issues_45380`, ... (+1) |
| requires cluster module which is not available in WASM | 4 | `parallel/test-cluster-bind-twice.js`, `parallel/test-cluster-dgram-2.js`, `parallel/test-cluster-primary-error.js`, ... (+1) |
| child_process is not supported in WebAssembly environment | 3 | `sequential/test-child-process-emfile.js`, `sequential/test-child-process-exit.js`, `sequential/test-child-process-pass-fd.js` |
| inherited: inspector/heap profiler is not available in WASM | 3 | `parallel/test-heap-prof-invalid-args.js#block_00_tests_heap_prof_name_without_heap_prof`, `parallel/test-heap-prof-invalid-args.js#block_01_tests_heap_prof_dir_without_heap_prof`, `parallel/test-heap-prof-invalid-args.js#block_02_tests_heap_prof_interval_without_heap_prof` |
| Linux abstract UNIX sockets are not available in WASI | 2 | `parallel/test-pipe-abstract-socket-http.js`, `parallel/test-pipe-abstract-socket.js` |
| breakOnSigint requires SIGINT delivery/handler semantics unavailable in WASI | 2 | `parallel/test-vm-sigint-existing-handler.js`, `parallel/test-vm-sigint.js` |
| http2 is not implemented | 2 | `parallel/test-http2-compat-client-upload-reject.js`, `parallel/test-http2-reset-flood.js` |
| inspector NodeTracing domain is unavailable in WASM | 2 | `parallel/test-trace-events-dynamic-enable-workers-disabled.js`, `parallel/test-trace-events-dynamic-enable.js` |
| package manager tooling, not applicable to WASM runtime | 2 | `parallel/test-corepack-version.js`, `parallel/test-npm-version.js` |
| repl requires interactive terminal | 2 | `parallel/test-repl-programmatic-history.js`, `parallel/test-repl.js` |
| requires detached child_process with inherited listening socket fd | 2 | `parallel/test-listen-fd-detached-inherit.js`, `parallel/test-listen-fd-detached.js` |
| requires spawning an interactive Node REPL subprocess (--interactive) and driving it via stdin; unsupported in this WASI environment | 2 | `es-module/test-esm-repl-imports.js`, `es-module/test-esm-repl.js` |
| requires spawning an interactive REPL subprocess (-i), unsupported in WASM | 2 | `parallel/test-force-repl-with-eval.js`, `parallel/test-force-repl.js` |
| requires worker_threads | 2 | `parallel/test-unhandled-exception-with-worker-inuse.js`, `parallel/test-worker-messaging.js` |
| tls/http2 is not supported in WebAssembly environment | 2 | `parallel/test-http2-https-fallback.js#block_00_http_2_http_1_1_server`, `parallel/test-http2-https-fallback.js#block_01_http_2_only_server` |
| ShadowRealm not supported in QuickJS | 1 | `parallel/test-shadow-realm-preload-module.js` |
| Windows-only OOM/exitcode behavior is not available on WASI | 1 | `parallel/test-windows-failed-heap-allocation.js` |
| Windows-only abort/exitcode behavior is not available on WASI | 1 | `parallel/test-windows-abort-exitcode.js` |
| Windows-only named pipe/cmd shell behavior is not available in WASI | 1 | `parallel/test-spawn-cmd-named-pipe.js` |
| Windows-specific long-path behavior is not applicable in WASI | 1 | `parallel/test-require-long-path.js` |
| Windows-specific process._debugProcess behavior is not available in WASI | 1 | `parallel/test-debug-process.js` |
| [manual] The test requires `child_process.execFileSync` to spawn a new Node.js subprocess (`execFileSync(node, [cjsModuleWrapTest])`). Process spawning is fundamentally impossible in a WASM compone... | 1 | `parallel/test-module-wrapper.js` |
| [manual] The test requires `child_process.execFileSync` to spawn new Node.js child processes, which is fundamentally impossible in a WebAssembly/WASI environment. Updated the skip reason in `config... | 1 | `parallel/test-module-main-extension-lookup.js` |
| [manual] This test fundamentally requires `child_process.spawn()` with IPC communication and OS signal handling (`SIGKILL`), which are impossible in a WebAssembly sandbox. The entire test logic dep... | 1 | `parallel/test-net-child-process-connect-reset.js` |
| [manual] This test requires `http2.createServer()` (TCP server listening on a port) and `http2.connect()` (full HTTP/2 protocol client), neither of which are available in the WebAssembly/WASI envir... | 1 | `parallel/test-stream-pipeline-http2.js` |
| child process signal termination semantics are not available in WASI | 1 | `parallel/test-signal-unregister.js` |
| cluster requires process forking and fd passing between processes | 1 | `parallel/test-listen-fd-cluster.js` |
| depends on worker_threads-based event loop utilization behavior | 1 | `parallel/test-performance-eventlooputil.js` |
| heap diagnostics not available in WASM | 1 | `parallel/test-heapdump-async-hooks-init-promise.js` |
| host signal delivery and SIGINT interruption semantics are not available in WASI | 1 | `parallel/test-sigint-infinite-loop.js` |
| inspector Runtime.evaluate side-effect checks are unavailable in WASM | 1 | `parallel/test-process-env-sideeffects.js` |
| inspector is not available in WASM | 1 | `parallel/test-set-process-debug-port.js` |
| process.kill signal delivery is not supported in WASI | 1 | `parallel/test-signal-args.js` |
| process.kill signal handling is not supported in WASI | 1 | `parallel/test-signal-handler.js` |
| requires Atomics.wait tracing across worker threads | 1 | `parallel/test-trace-atomics-wait.js` |
| requires Atomics/SharedArrayBuffer support, unavailable without threads in WASM | 1 | `parallel/test-atomics-wake.js` |
| requires FIPS-enabled OpenSSL build | 1 | `parallel/test-dsa-fips-invalid-key.js` |
| requires Linux abstract UNIX socket tracing | 1 | `parallel/test-trace-events-net-abstract-socket.js` |
| requires Linux strace syscall tracing | 1 | `parallel/test-strace-openat-openssl.js` |
| requires Node.js internals | 1 | `parallel/test-child-process-internal.js` |
| requires TLS server functionality | 1 | `parallel/test-tls-socket-close.js` |
| requires TLS socket wrapping over raw net sockets | 1 | `parallel/test-socket-writes-before-passed-to-tls-socket.js` |
| requires Worker threads with structured clone of CryptoKey | 1 | `parallel/test-webcrypto-cryptokey-workers.js` |
| requires a real subprocess with independent stack-size overflow handling | 1 | `parallel/test-stack-size-limit.js` |
| requires child_process IPC with inherited listening socket fd | 1 | `parallel/test-listen-fd-server.js` |
| requires child_process.exec subprocess behavior | 1 | `parallel/test-error-reporting.js` |
| requires child_process.exec which is not available in WASM | 1 | `parallel/test-child-process-exec-cwd.js` |
| requires child_process.execSync which is not available in WASM | 1 | `parallel/test-domain-abort-on-uncaught.js` |
| requires execSync/ps subprocess behavior not available in WASM | 1 | `parallel/test-setproctitle.js` |
| requires https.createServer not supported | 1 | `parallel/test-http-request-agent.js` |
| requires https.createServer/TLSSocket server support, unavailable in WebAssembly | 1 | `parallel/test-async-wrap-tlssocket-asyncreset.js` |
| requires libuv threadpool trace categories | 1 | `parallel/test-trace-events-threadpool.js` |
| requires macOS App Sandbox and codesign tooling outside WASI | 1 | `parallel/test-macos-app-sandbox.js` |
| requires process.binding not available in WASM | 1 | `parallel/test-http-parser-timeout-reset.js` |
| requires signal handling which is not available in WASM | 1 | `sequential/test-vm-break-on-sigint.js` |
| requires spawning an interactive Node REPL subprocess (--interactive) and driving it via stdin | 1 | `parallel/test-cwd-enoent-repl.js` |
| requires spawning node subprocesses to run package scripts | 1 | `parallel/test-node-run.js` |
| requires spawning node subprocesses to validate CLI CA flags | 1 | `parallel/test-openssl-ca-options.js` |
| requires worker_threads and child-process symlink behavior not available in WASI | 1 | `parallel/test-require-symlink.js` |
| requires worker_threads plus V8 --harmony-struct SharedArray feature | 1 | `parallel/test-experimental-shared-value-conveyor.js` |
| requires worker_threads stdout/execArgv behavior not available in WASM | 1 | `parallel/test-process-exec-argv.js` |
| requires worker_threads trace propagation | 1 | `parallel/test-trace-events-async-hooks-worker.js` |
| sending host process signals is not supported in WASI | 1 | `parallel/test-process-kill-null.js` |
| test is gated to Linux/macOS/Windows shell behavior and excludes WASI | 1 | `parallel/test-stdin-from-file-spawn.js` |
| tls is not implemented | 1 | `parallel/test-tls-wrap-econnreset-pipe.js` |
| uses spawnPromisified and permission model, not applicable in WASM | 1 | `parallel/test-permission-sqlite-load-extension.js` |

### engine difference (68)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| inherited: v8.Serializer/Deserializer and v8.serialize/deserialize are V8-specific and unavailable in QuickJS | 14 | `parallel/test-v8-serdes.js#block_00_block_00`, `parallel/test-v8-serdes.js#block_01_block_01`, `parallel/test-v8-serdes.js#block_02_block_02`, ... (+11) |
| ShadowRealm is not available in QuickJS | 10 | `parallel/test-shadow-realm-allowed-builtin-modules.js`, `parallel/test-shadow-realm-custom-loaders.js`, `parallel/test-shadow-realm-gc-module.js`, ... (+7) |
| v8.promiseHooks is V8-specific and not available in QuickJS | 6 | `parallel/test-promise-hook-create-hook.js`, `parallel/test-promise-hook-exceptions.js`, `parallel/test-promise-hook-on-after.js`, ... (+3) |
| vm.measureMemory depends on V8 heap introspection APIs unavailable in QuickJS | 6 | `parallel/test-vm-measure-memory-lazy.js#block_00_or_otherwise_these_may_not_resolve`, `parallel/test-vm-measure-memory-lazy.js#block_01_block_01`, `parallel/test-vm-measure-memory-lazy.js#block_02_block_02`, ... (+3) |
| inherited: v8.queryObjects is a V8-specific heap introspection API unavailable in QuickJS | 5 | `parallel/test-v8-query-objects.js#block_00_block_00`, `parallel/test-v8-query-objects.js#block_01_block_01`, `parallel/test-v8-query-objects.js#block_02_block_02`, ... (+2) |
| v8.GCProfiler is V8-specific and unavailable in QuickJS | 4 | `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_00_test_if_it_makes_the_process_crash`, `parallel/test-v8-collect-gc-profile-exit-before-stop.js#block_01_block_01`, `parallel/test-v8-collect-gc-profile-in-worker.js`, ... (+1) |
| QuickJS does not mirror V8's legacy RegExp static properties initialization | 3 | `parallel/test-startup-empty-regexp-statics.js#block_00_block_00`, `parallel/test-startup-empty-regexp-statics.js#block_01_block_01`, `parallel/test-startup-empty-regexp-statics.js#block_02_block_02` |
| targets V8 external string internals/limits that QuickJS does not replicate | 3 | `parallel/test-stringbytes-external.js#block_00_block_00`, `parallel/test-stringbytes-external.js#block_01_block_01`, `parallel/test-stringbytes-external.js#block_02_https_github_com_nodejs_node_issues_1024` |
| --use-largepages is a V8 startup flag not applicable to QuickJS/WASM | 2 | `parallel/test-startup-large-pages.js#block_00_block_00`, `parallel/test-startup-large-pages.js#block_01_block_01` |
| v8.serialize/deserialize are V8-specific and unavailable in QuickJS | 2 | `parallel/test-v8-deserialize-buffer.js`, `parallel/test-v8-serialize-leak.js` |
| v8.writeHeapSnapshot is a V8-specific API and is unavailable in QuickJS | 2 | `parallel/test-permission-fs-write-v8.js#block_00_block_00`, `parallel/test-permission-fs-write-v8.js#block_01_block_01` |
| SourceTextModule cachedData depends on V8 code cache internals unavailable in QuickJS | 1 | `parallel/test-vm-module-cached-data.js` |
| asserts V8-specific syntax error stderr text/format that differs in QuickJS | 1 | `es-module/test-require-module-errors.js` |
| depends on V8 --prof/--prof-process tick-processor tooling | 1 | `parallel/test-tick-processor-arguments.js` |
| depends on V8 PromiseRejectCallback stack-overflow behavior | 1 | `parallel/test-promise-reject-callback-exception.js` |
| depends on V8 native syntax and runtime flags not available in QuickJS | 1 | `parallel/test-v8-flags.js` |
| expects V8 heap space statistics that QuickJS does not expose | 1 | `parallel/test-v8-stats.js` |
| v8.cachedDataVersionTag depends on V8 internals unavailable in QuickJS | 1 | `parallel/test-v8-version-tag.js` |
| v8.getHeapSnapshot is V8-specific and unavailable in QuickJS | 1 | `parallel/test-v8-getheapsnapshot-twice.js` |
| v8.startupSnapshot is V8 snapshot machinery unavailable in QuickJS | 1 | `parallel/test-v8-startup-snapshot-api.js` |
| vm.Script cachedData/produceCachedData relies on V8 code cache format unavailable in QuickJS | 1 | `parallel/test-vm-cached-data.js` |
| vm.Script.createCachedData relies on V8 code cache internals unavailable in QuickJS | 1 | `parallel/test-vm-createcacheddata.js` |

### unevaluated (101)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| inherited: newly discovered, not yet evaluated | 53 | `parallel/test-dgram-membership.js#block_00_addmembership_on_closed_socket_should_throw`, `parallel/test-dgram-membership.js#block_01_dropmembership_on_closed_socket_should_throw`, `parallel/test-runner-wait-for.js#test_05_sets_last_failure_as_error_cause_on_timeouts`, ... (+50) |
| newly discovered, not yet evaluated | 48 | `es-module/test-require-module.js#block_00_test_named_exports`, `es-module/test-require-module.js#block_01_test_esm_that_import_esm`, `es-module/test-require-module.js#block_03_test_esm_that_require_cjs`, ... (+45) |

### Node.js internals (1023)

| Reason | Count | Example entries |
|--------|-------|-----------------|
| missing reason | 159 | `parallel/test-buffer-backing-arraybuffer.js`, `parallel/test-buffer-fill.js#block_00_block_00`, `parallel/test-buffer-fill.js#block_01_block_01`, ... (+156) |
| util.inspect output formatting differences | 99 | `parallel/test-util-inspect.js#block_00_special_function_inspection`, `parallel/test-util-inspect.js#block_01_block_01`, `parallel/test-util-inspect.js#block_02_block_02`, ... (+96) |
| requires --expose-internals and internal/webstreams/readablestream | 82 | `parallel/test-whatwg-readablestream.js#block_00_block_00`, `parallel/test-whatwg-readablestream.js#block_01_block_01`, `parallel/test-whatwg-readablestream.js#block_02_block_02`, ... (+79) |
| requires internal/util/inspect via --expose-internals | 78 | `parallel/test-readline-interface.js#block_00_block_00`, `parallel/test-readline-interface.js#block_01_block_01`, `parallel/test-readline-interface.js#block_02_block_02`, ... (+75) |
| requires --expose-internals and internal/webstreams/adapters | 60 | `parallel/test-whatwg-webstreams-adapters-streambase.js#block_00_block_00`, `parallel/test-whatwg-webstreams-adapters-streambase.js#block_01_block_01`, `parallel/test-whatwg-webstreams-adapters-streambase.js#block_02_block_02`, ... (+57) |
| inherited: requires --expose-internals, inspect integration, and internal EventTarget APIs | 57 | `parallel/test-eventtarget.js#block_00_first_test_event`, `parallel/test-eventtarget.js#block_01_block_01`, `parallel/test-eventtarget.js#block_02_block_02`, ... (+54) |
| inherited: requires --expose-internals and internal/event_target | 23 | `parallel/test-nodeeventtarget.js#block_00_block_00`, `parallel/test-nodeeventtarget.js#block_01_block_01`, `parallel/test-nodeeventtarget.js#block_02_block_02`, ... (+20) |
| Tests use internal/webstreams/util kState symbol to inspect web stream internals | 22 | `parallel/test-blob.js#block_00_block_00`, `parallel/test-blob.js#block_01_block_01`, `parallel/test-blob.js#block_02_block_02`, ... (+19) |
| [manual] http2/https not implemented | 20 | `parallel/test-http2-client-destroy.js#block_00_block_00`, `parallel/test-http2-client-destroy.js#block_01_test_destroy_before_client_operations`, `parallel/test-http2-client-destroy.js#block_02_test_destroy_before_goaway`, ... (+17) |
| inherited: requires internal/event_target, ERR_INVALID_ARG_TYPE validation, returnValue/cancelBubble/srcElement properties | 19 | `parallel/test-events-customevent.js#block_00_block_00`, `parallel/test-events-customevent.js#block_02_block_02`, `parallel/test-events-customevent.js#block_03_block_03`, ... (+16) |
| requires --expose-internals and internal/crypto/webidl | 19 | `parallel/test-webcrypto-webidl.js#block_00_required_arguments_length`, `parallel/test-webcrypto-webidl.js#block_01_boolean`, `parallel/test-webcrypto-webidl.js#block_02_https_webidl_spec_whatwg_org_abstract_opdef_converttoint`, ... (+16) |
| requires --expose-internals and internal/event_target | 15 | `parallel/test-events-on-async-iterator.js`, `parallel/test-eventtarget-brandcheck.js`, `parallel/test-global-customevent.js`, ... (+12) |
| uses --expose-internals plus internal/errors and internal/util/inspect | 15 | `parallel/test-errors-systemerror.js#block_00_block_00`, `parallel/test-errors-systemerror.js#block_01_block_01`, `parallel/test-errors-systemerror.js#block_02_block_02`, ... (+12) |
| requires --expose-internals and internal/worker/js_transferable | 14 | `parallel/test-whatwg-transformstream.js#block_00_block_00`, `parallel/test-whatwg-transformstream.js#block_01_block_01`, `parallel/test-whatwg-transformstream.js#block_02_block_02`, ... (+11) |
| inherited: requires --expose-internals and internal/validators | 13 | `parallel/test-internal-validators-validateoneof.js#block_00_block_00`, `parallel/test-internal-validators-validateoneof.js#block_01_block_01`, `parallel/test-internal-validators-validateoneof.js#block_02_block_02`, ... (+10) |
| requires --expose-internals and internal/webstreams/* modules | 13 | `parallel/test-whatwg-webstreams-transfer.js#block_00_block_00`, `parallel/test-whatwg-webstreams-transfer.js#block_01_block_01`, `parallel/test-whatwg-webstreams-transfer.js#block_02_block_02`, ... (+10) |
| inherited: requires --expose-internals and internal/errors | 11 | `parallel/test-internal-error-original-names.js#block_00_block_00`, `parallel/test-internal-error-original-names.js#block_01_block_01`, `parallel/test-internal-error-original-names.js#block_02_block_02`, ... (+8) |
| inherited: uses --expose-internals with internal/test/binding primordials and internal/util | 11 | `parallel/test-primordials-regexp.js#block_00_block_00`, `parallel/test-primordials-regexp.js#block_01_block_01`, `parallel/test-primordials-regexp.js#block_02_block_02`, ... (+8) |
| uses --expose-internals and internal/errors/internal/validators | 11 | `parallel/test-errors-hide-stack-frames.js#block_00_block_00`, `parallel/test-errors-hide-stack-frames.js#block_01_block_01`, `parallel/test-errors-hide-stack-frames.js#block_02_block_02`, ... (+8) |
| inherited: requires --expose-internals and internal/socket_list | 10 | `parallel/test-internal-socket-list-receive.js#block_00_verify_that_the_message_won_t_be_sent_when_child_is_not_conn`, `parallel/test-internal-socket-list-receive.js#block_01_verify_that_a_node_socket_all_closed_message_will_be_sent`, `parallel/test-internal-socket-list-receive.js#block_02_verify_that_a_node_socket_count_message_will_be_sent`, ... (+7) |
| inherited: requires --expose-internals and internal/crypto/webidl | 9 | `parallel/test-webcrypto-webidl.js#block_19_hmackeygenparams_hmacimportparams`, `parallel/test-webcrypto-webidl.js#block_20_aeskeygenparams_aesderivedkeyparams`, `parallel/test-webcrypto-webidl.js#block_21_hkdfparams`, ... (+6) |
| inherited: requires child_process which is not available in WASM | 9 | `parallel/test-child-process-bad-stdio.js#test_00_normal_execution_of_a_child_process_is_handled`, `parallel/test-child-process-bad-stdio.js#test_01_execution_with_an_error_event_is_handled`, `parallel/test-child-process-bad-stdio.js#test_02_execution_with_a_killed_process_is_handled`, ... (+6) |
| requires --expose-internals and internal/webstreams/util (kState) | 9 | `parallel/test-whatwg-readablebytestream.js#block_00_block_00`, `parallel/test-whatwg-readablebytestream.js#block_01_block_01`, `parallel/test-whatwg-readablebytestream.js#block_02_block_02`, ... (+6) |
| inherited: requires --expose-internals and internal/fs/sync_write_stream | 8 | `parallel/test-internal-fs-syncwritestream.js#block_00_verify_constructing_the_instance_with_default_options`, `parallel/test-internal-fs-syncwritestream.js#block_01_verify_constructing_the_instance_with_specified_options`, `parallel/test-internal-fs-syncwritestream.js#block_02_verify_that_the_file_will_be_written_synchronously`, ... (+5) |
| inherited: requires --expose-internals and process.on('warning') | 8 | `parallel/test-eventtarget-memoryleakwarning.js#block_00_block_00`, `parallel/test-eventtarget-memoryleakwarning.js#block_01_block_01`, `parallel/test-eventtarget-memoryleakwarning.js#block_02_block_02`, ... (+5) |
| inherited: uses --expose-internals and internal/test/binding primordials | 8 | `parallel/test-primordials-apply.js#block_00_block_00`, `parallel/test-primordials-apply.js#block_01_block_01`, `parallel/test-primordials-apply.js#block_02_block_02`, ... (+5) |
| requires --expose-internals and internalBinding('cares_wrap') | 7 | `parallel/test-dns-default-order-ipv4.js`, `parallel/test-dns-default-order-ipv6.js`, `parallel/test-dns-default-order-verbatim.js`, ... (+4) |
| requires internal/event_target, ERR_INVALID_ARG_TYPE validation, returnValue/cancelBubble/srcElement properties | 7 | `parallel/test-events-customevent.js#block_01_block_01`, `parallel/test-events-customevent.js#block_13_block_13`, `parallel/test-events-customevent.js#block_14_block_14`, ... (+4) |
| [manual] requires --expose-internals (Node.js internal APIs) | 6 | `parallel/test-http-agent-domain-reused-gc.js`, `parallel/test-http-client-immediate-error.js`, `parallel/test-http-client-timeout-on-connect.js`, ... (+3) |
| inherited: uses --expose-internals, internal/test/binding, and internal/dgram handle internals | 6 | `parallel/test-handle-wrap-hasref.js#block_00_child_process`, `parallel/test-handle-wrap-hasref.js#block_01_dgram_ipv4`, `parallel/test-handle-wrap-hasref.js#block_02_dgram_ipv6`, ... (+3) |
| requires --expose-internals and internal/test_runner/snapshot | 6 | `parallel/test-runner-snapshot-tests.js#test_00_snapshotmanager`, `parallel/test-runner-snapshot-tests.js#test_01_t_assert_snapshot_validation`, `parallel/test-runner-snapshot-tests.js#test_02_setresolvesnapshotpath`, ... (+3) |
| requires internal/timers | 6 | `parallel/test-timers-refresh.js#block_00_unref_d_timer`, `parallel/test-timers-refresh.js#block_01_should_throw_with_non_functions`, `parallel/test-timers-refresh.js#block_02_unref_pooled_timer`, ... (+3) |
| uses --expose-internals and internal/errors SystemError | 6 | `parallel/test-errors-systemerror-frozen-intrinsics.js`, `parallel/test-errors-systemerror-stackTraceLimit-custom-setter.js`, `parallel/test-errors-systemerror-stackTraceLimit-deleted-and-Error-sealed.js`, ... (+3) |
| imports internal/modules/esm/{loader,module_map,module_job,create_dynamic_module} | 5 | `es-module/test-esm-loader-modulemap.js#block_00_are_stored_in_the_map`, `es-module/test-esm-loader-modulemap.js#block_01_values_as_url_argument`, `es-module/test-esm-loader-modulemap.js#block_02_values_or_the_kasserttype_symbol_as_type_argument`, ... (+2) |
| requires --expose-internals and internal/util | 5 | `parallel/test-internal-util-assertCrypto.js`, `parallel/test-internal-util-classwrapper.js`, `parallel/test-internal-util-helpers.js`, ... (+2) |
| inherited: requires --expose-internals and internal/event_target (kWeakHandler) | 4 | `parallel/test-events-static-geteventlisteners.js#block_00_test_geteventlisteners_on_eventemitter`, `parallel/test-events-static-geteventlisteners.js#block_01_test_geteventlisteners_on_eventtarget`, `parallel/test-events-static-geteventlisteners.js#block_02_block_02`, ... (+1) |
| inherited: requires --expose-internals and internal/priority_queue | 4 | `parallel/test-priority-queue.js#block_02_block_02`, `parallel/test-priority-queue.js#block_03_block_03`, `parallel/test-priority-queue.js#block_04_block_04`, ... (+1) |
| requires --expose-internals, inspect integration, and internal EventTarget APIs | 4 | `parallel/test-eventtarget.js#block_13_block_13`, `parallel/test-eventtarget.js#block_14_block_14`, `parallel/test-eventtarget.js#block_15_block_15`, ... (+1) |
| uses --expose-internals and internal/dgram kStateSymbol | 4 | `parallel/test-dgram-close-during-bind.js`, `parallel/test-dgram-close.js`, `parallel/test-dgram-recv-error.js`, ... (+1) |
| [manual] amp fix caused regressions | 3 | `parallel/test-fs-watchfile-bigint.js`, `parallel/test-runner-mock-timers.js`, `parallel/test-runner-string-to-regexp.js` |
| inherited: requires --expose-internals and internal/fixed_queue | 3 | `parallel/test-fixed-queue.js#block_00_block_00`, `parallel/test-fixed-queue.js#block_01_block_01`, `parallel/test-fixed-queue.js#block_02_block_02` |
| inherited: requires --expose-internals and internalBinding('cares_wrap') to stub getaddrinfo | 3 | `parallel/test-dns-lookup.js#block_00_block_00`, `parallel/test-dns-lookup.js#block_01_block_01`, `parallel/test-dns-lookup.js#block_02_block_02` |
| inherited: requires X509Certificate class which is not implemented | 3 | `parallel/test-crypto-x509.js#block_00_block_00`, `parallel/test-crypto-x509.js#block_01_block_01`, `parallel/test-crypto-x509.js#block_02_block_02` |
| inherited: uses --expose-internals with dgram._createSocketHandle and internal/test/binding | 3 | `parallel/test-dgram-create-socket-handle-fd.js#block_00_return_a_negative_number_if_the_existing_fd_is_invalid`, `parallel/test-dgram-create-socket-handle-fd.js#block_01_return_a_negative_number_if_the_type_of_fd_is_not_udp`, `parallel/test-dgram-create-socket-handle-fd.js#block_02_create_a_bound_handle` |
| requires --expose-internals and internal/js_stream_socket | 3 | `parallel/test-wrap-js-stream-destroy.js#block_00_close_events_and_vice_versa`, `parallel/test-wrap-js-stream-destroy.js#block_01_destroy_the_streamwrap_and_test_again`, `parallel/test-wrap-js-stream-destroy.js#block_02_destroy_the_client_socket_and_test_again` |
| requires internal/test/binding internalBinding('tcp_wrap') | 3 | `parallel/test-tcp-wrap-connect.js`, `parallel/test-tcp-wrap-listen.js`, `parallel/test-tcp-wrap.js` |
| uses --expose-internals and internal/errors AbortError | 3 | `parallel/test-errors-aborterror.js#block_00_block_00`, `parallel/test-errors-aborterror.js#block_01_block_01`, `parallel/test-errors-aborterror.js#block_02_block_02` |
| uses --expose-internals and internalBinding('trace_events') | 3 | `parallel/test-trace-events-api.js`, `parallel/test-trace-events-category-used.js`, `parallel/test-trace-events-get-category-enabled-buffer.js` |
| uses --expose-internals and internalBinding('uv') | 3 | `parallel/test-ttywrap-invalid-fd.js`, `parallel/test-uv-errmap.js`, `parallel/test-uv-errno.js` |
| P-521 ECDH not yet implemented in native Rust | 2 | `parallel/test-webcrypto-derivebits.js#block_00_test_ecdh_bit_derivation`, `parallel/test-webcrypto-derivekey.js#block_00_test_ecdh_key_derivation` |
| X25519/X448 DH not yet implemented in native Rust | 2 | `parallel/test-webcrypto-derivebits.js#block_03_test_x25519_and_x448_bit_derivation`, `parallel/test-webcrypto-derivekey.js#block_05_test_x25519_and_x448_key_derivation` |
| [manual] requires HTTP server (net.listen) which is unavailable in WASM | 2 | `parallel/test-http-server-options-highwatermark.js#block_00_block_00`, `parallel/test-http-server-options-highwatermark.js#block_01_block_01` |
| checks Node source-tree release changelog files, not runtime API | 2 | `parallel/test-release-changelog.js#block_00_check_changelog_v_md`, `parallel/test-release-changelog.js#block_01_main_changelog_md_checks` |
| inherited: requires --expose-internals | 2 | `parallel/test-net-normalize-args.js#block_00_connecting_to_the_server_should_fail_with_a_standard_array`, `parallel/test-net-normalize-args.js#block_01_connecting_to_the_server_should_succeed_with_a_normalized_ar` |
| inherited: requires --expose-internals and internal/fs/utils | 2 | `parallel/test-internal-fs.js#block_00_test_junction_symlinks`, `parallel/test-internal-fs.js#block_01_test_none_junction_symlinks` |
| inherited: requires --expose-internals and internal/test/binding internalBinding('performance') | 2 | `parallel/test-performanceobserver.js#block_00_block_00`, `parallel/test-performanceobserver.js#block_01_test_non_buffered` |
| inherited: requires raw handle for listen | 2 | `parallel/test-net-server-listen-handle.js#block_00_not_a_public_api_used_by_child_process`, `parallel/test-net-server-listen-handle.js#block_01_block_01` |
| inherited: uses --expose-internals and internal/test/binding (internalBinding('config')) | 2 | `parallel/test-icu-data-dir.js#block_00_block_00`, `parallel/test-icu-data-dir.js#block_01_block_01` |
| inherited: uses --expose-internals and internal/test/binding internalBinding() | 2 | `parallel/test-accessor-properties.js#test_00_should_throw_instead_of_raise_assertions`, `parallel/test-accessor-properties.js#test_01_there_are_accessor_properties_in_crypto_too` |
| inherited: uses --expose-internals and internal/util customInspectSymbol | 2 | `parallel/test-compression-decompression-stream.js#test_00_decompressionstream_kinspect_method`, `parallel/test-compression-decompression-stream.js#test_01_compressionstream_kinspect_method` |
| inherited: uses --expose-internals with internal/dgram and internal/test/binding | 2 | `parallel/test-dgram-bind-fd-error.js#block_00_throw_when_the_fd_is_occupied_according_to_https_github_com_`, `parallel/test-dgram-bind-fd-error.js#block_01_throw_when_the_type_of_fd_is_not_udp` |
| requires --expose-internals and internal/options | 2 | `parallel/test-options-binding.js`, `parallel/test-pending-deprecation.js` |
| requires --expose-internals and internal/priority_queue | 2 | `parallel/test-priority-queue.js#block_00_block_00`, `parallel/test-priority-queue.js#block_01_block_01` |
| requires --expose-internals and node:internal/modules/esm/resolve | 2 | `es-module/test-cjs-legacyMainResolve-permission.js`, `es-module/test-cjs-legacyMainResolve.js` |
| requires internal/test/binding internalBinding('timers') | 2 | `parallel/test-timers-now.js`, `parallel/test-timers-ordering.js` |
| requires internal/v8_prof_polyfill | 2 | `parallel/test-tick-processor-version-check.js#block_00_block_00`, `parallel/test-tick-processor-version-check.js#block_01_block_01` |
| uses --expose-internals and internal/async_hooks symbols | 2 | `parallel/test-async-hooks-http-agent-destroy.js`, `parallel/test-async-hooks-http-agent.js` |
| uses --expose-internals and internal/errors | 2 | `parallel/test-uv-unmapped-exception.js#block_00_block_00`, `parallel/test-uv-unmapped-exception.js#block_01_block_01` |
| uses --expose-internals and internal/test/binding | 2 | `parallel/test-process-binding.js`, `parallel/test-worker-message-port-transfer-native.js#block_01_block_01` |
| uses --expose-internals with internal/dgram _createSocketHandle and internal/test/binding | 2 | `parallel/test-dgram-create-socket-handle.js#block_00_block_00`, `parallel/test-dgram-create-socket-handle.js#block_01_block_01` |
| Windows-only test that also imports node:internal/modules/esm/resolve and internal/modules/run_main | 1 | `es-module/test-esm-long-path-win.js` |
| [manual] The test requires Node.js internals (`internal/js_stream_socket` for `StreamWrap`, `internal/test/binding` for `internalBinding('stream_wrap')` / `ShutdownWrap`) and the `--expose-internal... | 1 | `parallel/test-stream-wrap-drain.js` |
| [manual] The test requires `internal/event_target` (a Node.js internal module accessed via `--expose-internals`). The test itself explicitly states it "depend[s] on Node.js internal APIs" and is "n... | 1 | `parallel/test-abortcontroller-internal.js` |
| [manual] The test requires `internal/js_stream_socket` and `internalBinding('stream_wrap')` with `ShutdownWrap` — these are Node.js C++ internals (stream base infrastructure, libuv bindings) that a... | 1 | `parallel/test-stream-wrap.js` |
| [manual] The test requires `internal/js_stream_socket`, a Node.js **internal module** (note the `// Flags: --expose-internals` header). Per the project's AGENTS.md: "We only implement the public No... | 1 | `parallel/test-stream-wrap-encoding.js#block_00_block_00` |
| [manual] The test requires `internal/js_stream_socket`, a Node.js internal module accessed via the `--expose-internals` flag. Per AGENTS.md, "Tests that exercise Node.js internals (internal modules... | 1 | `parallel/test-stream-wrap-encoding.js#block_01_block_01` |
| [manual] amp fix attempt failed verification | 1 | `parallel/test-stream-base-prototype-accessors-enumerability.js` |
| asserts exact process.moduleLoadList bootstrap internals | 1 | `parallel/test-bootstrap-modules.js` |
| checks bundled deps/npm release artifact in Node source tree, not runtime API | 1 | `parallel/test-release-npm.js` |
| crypto edge case | 1 | `parallel/test-crypto-prime.js#block_09_block_09` |
| depends on Node benchmark sources (benchmark/_cli.js), not public runtime API | 1 | `parallel/test-benchmark-cli.js` |
| depends on Node source tree files under tools/icu and deps/v8 | 1 | `parallel/test-icu-minimum-version.js` |
| depends on Node source-tree deps/* package metadata and process.config build internals | 1 | `parallel/test-process-versions.js` |
| depends on experimental Module._stat and CommonJS loader implementation details | 1 | `parallel/test-vfs.js` |
| depends on net.Server internal _handle.getsockname behavior | 1 | `parallel/test-socket-address.js` |
| depends on private process.stdin._handle close/unref internals | 1 | `parallel/test-stdout-close-unref.js` |
| imports internal/modules/esm/assert (Node internal module) | 1 | `es-module/test-esm-import-attributes-validation.js` |
| imports internal/modules/esm/resolve (Node internal module) | 1 | `es-module/test-esm-loader-search.js` |
| inherited: requires --expose-internals and internal/util | 1 | `parallel/test-internal-util-objects.js#block_00_block_00` |
| needs evaluation | 1 | `parallel/test-webcrypto-derivekey.js#block_03_test_default_key_lengths` |
| net.js TCP implementation incomplete - needs event handling and API fixes | 1 | `parallel/test-net-persistent-nodelay.js` |
| requires --expose-internals and child_process IPC to validate internal module visibility | 1 | `parallel/test-internal-module-require.js` |
| requires --expose-internals and internal/assert | 1 | `parallel/test-internal-assert.js` |
| requires --expose-internals and internal/crypto/util | 1 | `parallel/test-webcrypto-util.js` |
| requires --expose-internals and internal/crypto/webcrypto | 1 | `parallel/test-global-webcrypto-classes.js` |
| requires --expose-internals and internal/encoding | 1 | `parallel/test-whatwg-encoding-custom-internals.js` |
| requires --expose-internals and internal/errors AbortError | 1 | `parallel/test-webstream-readablestream-pipeto.js` |
| requires --expose-internals and internal/event_target (kEvents) | 1 | `parallel/test-events-once.js` |
| requires --expose-internals and internal/freelist | 1 | `parallel/test-freelist.js` |
| requires --expose-internals and internal/navigator | 1 | `parallel/test-navigator.js` |
| requires --expose-internals and internal/test/binding | 1 | `parallel/test-internal-only-binding.js` |
| requires --expose-internals and internal/test/transfer | 1 | `parallel/test-messaging-marktransfermode.js` |
| requires --expose-internals and internal/util customInspectSymbol | 1 | `parallel/test-whatwg-encoding-custom-interop.js#block_03_block_03` |
| requires --expose-internals and internal/util/inspect | 1 | `parallel/test-icu-stringwidth.js` |
| requires --expose-internals and internal/validators | 1 | `parallel/test-internal-validators-validateport.js` |
| requires --expose-internals and internal/webidl | 1 | `parallel/test-internal-webidl-converttoint.js` |
| requires --expose-internals and internal/webstreams/util | 1 | `parallel/test-whatwg-webstreams-coverage.js` |
| requires --expose-internals and internalBinding('cares_wrap') to stub getaddrinfo | 1 | `parallel/test-dns-lookup-promises.js` |
| requires --expose-internals and internalBinding('module_wrap') | 1 | `parallel/test-internal-module-wrap.js` |
| requires --expose-internals internalBinding('fs').internalModuleStat | 1 | `parallel/test-permission-fs-internal-module-stat.js` |
| requires --expose-internals, internal/util, and internal/test/binding | 1 | `parallel/test-internal-util-decorate-error-stack.js` |
| requires cluster | 1 | `parallel/test-net-listen-handle-in-cluster-2.js` |
| requires common/net test helper not available | 1 | `parallel/test-http-localaddress.js` |
| requires deprecated private _stream_wrap module | 1 | `parallel/test-warn-stream-wrap.js` |
| requires dgram and DNS protocol-level testing | 1 | `parallel/test-dns-lookupService.js` |
| requires fd option for socket connection | 1 | `parallel/test-net-connect-options-fd.js` |
| requires internal/dgram and internal/test/binding | 1 | `parallel/test-dgram-create-socket-handle.js#block_02_block_02` |
| requires internal/linkedlist | 1 | `parallel/test-timers-linked-list.js` |
| requires internal/readline/utils via --expose-internals | 1 | `parallel/test-readline-csi.js` |
| requires internal/socketaddress and internal/test/binding | 1 | `parallel/test-socketaddress.js` |
| requires internal/test/binding and credentials internalBinding | 1 | `parallel/test-safe-get-env.js` |
| requires internal/test/binding signal_wrap internalBinding | 1 | `parallel/test-signal-safety.js` |
| requires internalBinding('tcp_wrap') | 1 | `parallel/test-net-persistent-ref-unref.js` |
| requires internalBinding('uv') and internalBinding('stream_wrap') | 1 | `parallel/test-net-end-close.js` |
| requires private core module _http_outgoing | 1 | `parallel/test-outgoing-message-pipe.js` |
| uses --expose-internals and imports node:internal/modules/esm/get_format | 1 | `es-module/test-esm-url-extname.js` |
| uses --expose-internals and internal/errors formatList | 1 | `parallel/test-error-format-list.js` |
| uses --expose-internals and internal/options | 1 | `parallel/test-unicode-node-options.js` |
| uses --expose-internals and internal/test/binding async_wrap | 1 | `parallel/test-async-wrap-destroyid.js` |
| uses --expose-internals and internal/test/binding internalBinding('builtins') | 1 | `parallel/test-code-cache.js` |
| uses --expose-internals and internal/test/binding internalBinding('constants') | 1 | `parallel/test-binding-constants.js` |
| uses --expose-internals and internal/test/binding internalBinding('process_methods') | 1 | `parallel/test-dummy-stdio.js` |
| uses --expose-internals and internal/test/binding internalBinding('udp_wrap') | 1 | `parallel/test-dgram-bind-fd.js` |
| uses --expose-internals and internal/test/binding udp_wrap/tcp_wrap | 1 | `parallel/test-env-newprotomethod-remove-unnecessary-prototypes.js` |
| uses --expose-internals and internalBinding('tty_wrap') | 1 | `parallel/test-tty-backwards-api.js` |
| uses --expose-internals and require('internal/data_url') | 1 | `parallel/test-data-url.js` |
| uses --expose-internals plus Node internals (require('internal/...'), process.binding('natives')) | 1 | `es-module/test-loaders-hidden-from-users.js` |
| uses deprecated process.binding('uv') internal API | 1 | `parallel/test-err-name-deprecation.js` |
| uses internal process.binding API semantics | 1 | `parallel/test-permission-processbinding.js` |
| uses internal process.binding allowlist modules | 1 | `parallel/test-process-binding-internalbinding-allowlist.js` |
| uses internal process.binding('util') API | 1 | `parallel/test-process-binding-util.js` |
| uses internalBinding('constants') which is a Node.js internal API | 1 | `parallel/test-constants.js` |
| uses undocumented process._getActiveHandles() | 1 | `parallel/test-process-getactivehandles.js` |
| uses undocumented process._getActiveRequests() | 1 | `parallel/test-process-getactiverequests.js` |
| uses undocumented process._rawDebug() | 1 | `parallel/test-process-raw-debug.js` |
| uses undocumented process.binding('module_wrap') | 1 | `parallel/test-internal-process-binding.js` |
| uses undocumented process.reallyExit internal hook | 1 | `parallel/test-process-really-exit.js` |
| validates Node repository docs/source files (doc/api and src/node_options.cc) | 1 | `parallel/test-cli-node-options-docs.js` |
| validates Node source tree documentation file doc/api/cli.md | 1 | `parallel/test-process-env-allowed-flags-are-documented.js` |

## Config Hygiene

159 non-runnable entries are missing a reason.

<details>
<summary>Entries missing reasons</summary>

- `parallel/test-buffer-backing-arraybuffer.js` (Node.js internals)
- `parallel/test-buffer-fill.js#block_00_block_00` (Node.js internals)
- `parallel/test-buffer-fill.js#block_01_block_01` (Node.js internals)
- `parallel/test-buffer-fill.js#block_02_symbol_toprimitive` (Node.js internals)
- `parallel/test-buffer-fill.js#block_03_block_03` (Node.js internals)
- `parallel/test-buffer-write-fast.js` (Node.js internals)
- `parallel/test-cli-node-options-disallowed.js` (Node.js internals)
- `parallel/test-console-formatTime.js` (Node.js internals)
- `parallel/test-crypto-fips.js` (Node.js internals)
- `parallel/test-crypto-prime.js#block_00_block_00` (Node.js internals)
- `parallel/test-crypto-prime.js#block_01_block_01` (Node.js internals)
- `parallel/test-crypto-prime.js#block_02_block_02` (Node.js internals)
- `parallel/test-crypto-prime.js#block_03_block_03` (Node.js internals)
- `parallel/test-crypto-prime.js#block_04_block_04` (Node.js internals)
- `parallel/test-crypto-prime.js#block_05_block_05` (Node.js internals)
- `parallel/test-crypto-prime.js#block_06_block_06` (Node.js internals)
- `parallel/test-crypto-prime.js#block_07_block_07` (Node.js internals)
- `parallel/test-crypto-prime.js#block_08_block_08` (Node.js internals)
- `parallel/test-crypto-scrypt.js#block_00_block_00` (Node.js internals)
- `parallel/test-crypto-scrypt.js#block_01_block_01` (Node.js internals)
- `parallel/test-crypto-scrypt.js#block_02_block_02` (Node.js internals)
- `parallel/test-crypto-scrypt.js#block_03_block_03` (Node.js internals)
- `parallel/test-debug-v8-fast-api.js` (Node.js internals)
- `parallel/test-error-aggregateTwoErrors.js#block_00_block_00` (Node.js internals)
- `parallel/test-error-aggregateTwoErrors.js#block_01_block_01` (Node.js internals)
- `parallel/test-error-aggregateTwoErrors.js#block_02_block_02` (Node.js internals)
- `parallel/test-error-aggregateTwoErrors.js#block_03_block_03` (Node.js internals)
- `parallel/test-error-aggregateTwoErrors.js#block_04_block_04` (Node.js internals)
- `parallel/test-error-aggregateTwoErrors.js#block_05_block_05` (Node.js internals)
- `parallel/test-fs-access.js#block_00_block_00` (Node.js internals)
- `parallel/test-fs-access.js#block_01_block_01` (Node.js internals)
- `parallel/test-fs-access.js#block_02_block_02` (Node.js internals)
- `parallel/test-fs-copyfile.js` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_00_stat` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_01_lstat` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_02_fstat` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_03_realpath` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_04_native_realpath` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_05_readlink` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_06_link_nonexistent_file` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_07_link_existing_file` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_08_symlink` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_09_unlink` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_10_rename` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_11_rename_non_empty_directory` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_12_rmdir` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_13_rmdir_a_file` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_14_mkdir` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_15_chmod` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_16_open` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_17_close` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_18_readfile` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_19_readdir` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_20_ftruncate` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_21_fdatasync` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_22_fsync` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_23_mkdtemp` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_24_check_copyfile_with_invalid_modes` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_25_copyfile_destination_exists_but_the_copyfile_excl_flag_is_pr` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_26_copyfile_the_source_does_not_exist` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_27_read` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_28_fchmod` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_29_write_buffer` (Node.js internals)
- `parallel/test-fs-error-messages.js#block_30_write_string` (Node.js internals)
- `parallel/test-fs-filehandle.js` (Node.js internals)
- `parallel/test-fs-open-flags.js` (Node.js internals)
- `parallel/test-fs-promises-file-handle-aggregate-errors.js` (Node.js internals)
- `parallel/test-fs-promises-file-handle-close-errors.js` (Node.js internals)
- `parallel/test-fs-promises-file-handle-op-errors.js` (Node.js internals)
- `parallel/test-fs-promises-readfile.js` (Node.js internals)
- `parallel/test-fs-readdir-types.js` (Node.js internals)
- `parallel/test-fs-rm.js#block_00_test_the_asynchronous_version` (Node.js internals)
- `parallel/test-fs-rm.js#block_01_test_the_synchronous_version` (Node.js internals)
- `parallel/test-fs-rm.js#block_02_test_input_validation` (Node.js internals)
- `parallel/test-fs-rm.js#block_03_block_03` (Node.js internals)
- `parallel/test-fs-rmdir-recursive.js#block_00_test_the_asynchronous_version` (Node.js internals)
- `parallel/test-fs-rmdir-recursive.js#block_01_test_the_synchronous_version` (Node.js internals)
- `parallel/test-fs-rmdir-recursive.js#block_02_test_input_validation` (Node.js internals)
- `parallel/test-fs-rmdir-recursive.js#block_03_rimraf_see_35566` (Node.js internals)
- `parallel/test-fs-sync-fd-leak.js` (Node.js internals)
- `parallel/test-fs-syncwritestream.js` (Node.js internals)
- `parallel/test-fs-util-validateoffsetlength.js#block_00_block_00` (Node.js internals)
- `parallel/test-fs-util-validateoffsetlength.js#block_01_block_01` (Node.js internals)
- `parallel/test-fs-util-validateoffsetlength.js#block_02_block_02` (Node.js internals)
- `parallel/test-fs-util-validateoffsetlength.js#block_03_rangeerror_when_offset_bytelength` (Node.js internals)
- `parallel/test-fs-util-validateoffsetlength.js#block_04_rangeerror_when_bytelength_kiomaxlength_and_length_bytelengt` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_00_block_00` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_01_getdirents` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_02_block_02` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_03_block_03` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_04_block_04` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_05_getdirent` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_06_block_06` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_07_block_07` (Node.js internals)
- `parallel/test-fs-utils-get-dirents.js#block_08_block_08` (Node.js internals)
- `parallel/test-fs-watch-abort-signal.js#block_00_block_00` (Node.js internals)
- `parallel/test-fs-watch-abort-signal.js#block_01_block_01` (Node.js internals)
- `parallel/test-fs-watch-enoent.js#block_00_block_00` (Node.js internals)
- `parallel/test-fs-watch-enoent.js#block_01_block_01` (Node.js internals)
- `parallel/test-http-outgoing-buffer.js` (Node.js internals)
- `parallel/test-http-outgoing-internal-headers.js#block_00_block_00` (Node.js internals)
- `parallel/test-http-outgoing-internal-headers.js#block_01_block_01` (Node.js internals)
- `parallel/test-http-outgoing-internal-headers.js#block_02_block_02` (Node.js internals)
- `parallel/test-http-outgoing-renderHeaders.js#block_00_block_00` (Node.js internals)
- `parallel/test-http-outgoing-renderHeaders.js#block_01_block_01` (Node.js internals)
- `parallel/test-http-outgoing-renderHeaders.js#block_02_block_02` (Node.js internals)
- `parallel/test-http-outgoing-renderHeaders.js#block_03_block_03` (Node.js internals)
- `parallel/test-internal-modules.js` (Node.js internals)
- `parallel/test-internal-util-normalizeencoding.js` (Node.js internals)
- `parallel/test-js-stream-call-properties.js` (Node.js internals)
- `parallel/test-os-checked-function.js` (Node.js internals)
- `parallel/test-quic-internal-endpoint-listen-defaults.js` (Node.js internals)
- `parallel/test-quic-internal-endpoint-options.js` (Node.js internals)
- `parallel/test-quic-internal-endpoint-stats-state.js` (Node.js internals)
- `parallel/test-quic-internal-setcallbacks.js` (Node.js internals)
- `parallel/test-stream-add-abort-signal.js#block_00_block_00` (Node.js internals)
- `parallel/test-stream-add-abort-signal.js#block_01_block_01` (Node.js internals)
- `parallel/test-timers-nested.js` (Node.js internals)
- `parallel/test-timers-next-tick.js` (Node.js internals)
- `parallel/test-trace-events-binding.js` (Node.js internals)
- `parallel/test-url-is-url-internal.js` (Node.js internals)
- `parallel/test-util-emit-experimental-warning.js` (Node.js internals)
- `parallel/test-util-inspect-proxy.js` (Node.js internals)
- `parallel/test-util-internal.js` (Node.js internals)
- `parallel/test-util-promisify.js#block_00_block_00` (Node.js internals)
- `parallel/test-util-promisify.js#block_01_block_01` (Node.js internals)
- `parallel/test-util-promisify.js#block_02_block_02` (Node.js internals)
- `parallel/test-util-promisify.js#block_03_block_03` (Node.js internals)
- `parallel/test-util-promisify.js#block_04_block_04` (Node.js internals)
- `parallel/test-util-promisify.js#block_05_block_05` (Node.js internals)
- `parallel/test-util-promisify.js#block_06_block_06` (Node.js internals)
- `parallel/test-util-promisify.js#block_07_block_07` (Node.js internals)
- `parallel/test-util-promisify.js#block_08_block_08` (Node.js internals)
- `parallel/test-util-promisify.js#block_09_block_09` (Node.js internals)
- `parallel/test-util-promisify.js#block_10_block_10` (Node.js internals)
- `parallel/test-util-promisify.js#block_11_block_11` (Node.js internals)
- `parallel/test-util-promisify.js#block_12_block_12` (Node.js internals)
- `parallel/test-util-promisify.js#block_13_block_13` (Node.js internals)
- `parallel/test-util-promisify.js#block_14_block_14` (Node.js internals)
- `parallel/test-util-promisify.js#block_15_block_15` (Node.js internals)
- `parallel/test-util-promisify.js#block_16_block_16` (Node.js internals)
- `parallel/test-util-promisify.js#block_17_block_17` (Node.js internals)
- `parallel/test-util-promisify.js#block_18_block_18` (Node.js internals)
- `parallel/test-util-sigint-watchdog.js` (Node.js internals)
- `parallel/test-util-sleep.js` (Node.js internals)
- `parallel/test-util-types.js#block_00_block_00` (Node.js internals)
- `parallel/test-util-types.js#block_01_block_01` (Node.js internals)
- `parallel/test-util-types.js#block_02_block_02` (Node.js internals)
- `parallel/test-util.js` (Node.js internals)
- `parallel/test-uv-binding-constant.js` (Node.js internals)
- `parallel/test-webcrypto-derivebits.js#block_01_test_hkdf_bit_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivebits.js#block_02_test_pbkdf2_bit_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivekey.js#block_01_test_hkdf_key_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivekey.js#block_02_test_pbkdf2_key_derivation` (Node.js internals)
- `parallel/test-webcrypto-derivekey.js#block_04_block_04` (Node.js internals)
- `sequential/test-crypto-timing-safe-equal.js#block_00_block_00` (Node.js internals)
- `sequential/test-crypto-timing-safe-equal.js#block_01_block_01` (Node.js internals)
- `sequential/test-crypto-timing-safe-equal.js#block_02_block_02` (Node.js internals)
- `sequential/test-timers-block-eventloop.js` (Node.js internals)

</details>
