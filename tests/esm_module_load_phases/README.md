# ESM module-load phase attribution

This manual experiment attributes the roughly 11-second strip-mode prepared-ESM
latency reproduced by `tests/typescript_transform_latency`. It runs five serial
64-KiB samples for P2 and P3. Every sample creates a fresh execution-job QuickJS
runtime and a unique `.mjs` path; only the compiled component instance is reused
within a target report.

The checked-in instrumentation patch is deliberately not applied to production
source. It records exclusive loader subphases and the surrounding resolver time in
the existing private execution profile. Same-runtime JavaScript timestamps locate
evaluation within the import promise. The remaining pre-evaluation interval is
reported as a residual containing unresolved resolver-chain dispatch, QuickJS
linking, and promise scheduling; it is not called an exact link timer.

Run one target at a time from the repository root:

```sh
tests/esm_module_load_phases/run.sh p2
tests/esm_module_load_phases/run.sh p3
```

The runner creates a detached temporary worktree at the current committed source,
verifies and applies the retained patch there, records one report, and removes the
worktree. This keeps the validated transform-latency reports current. Optional
artifact and Wasmtime caches remain disabled. Validate retained reports without
executing workloads with:

```sh
tests/esm_module_load_phases/run.sh --check
```
