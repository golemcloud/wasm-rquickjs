# Manual npm metadata measurements

The dated JSON files are raw observations, not CI pass/fail thresholds. Run one
target at a time with the pinned Node 22.14.0/npm 10.9.2 installation:

```sh
NPM_METADATA_RUN=1 NPM_METADATA_ITERATIONS=3 NPM_METADATA_REPORT=tests/npm_metadata/results/YYYY-MM-DD-p2.json \
  tools/dev-test.sh p2 standard npm_metadata ''
NPM_METADATA_RUN=1 NPM_METADATA_ITERATIONS=3 NPM_METADATA_REPORT=tests/npm_metadata/results/YYYY-MM-DD-p3.json \
  tools/dev-test.sh p3 standard npm_metadata ''
```

Set `PATH` to the pinned Node installation first. The runner fetches the two
lockfile-pinned tarballs once before timing and serves the same bytes from the
local registry. Each cold invocation gets a fresh component instance, guest
runtime, workspace, and npm cache. Warm rows repeat a fresh execution job with
the same workspace/cache and are always labeled separately. Immutable
Wasmtime component preparation is shared but excluded from per-command timing.
The local registry is a controlled HTTP transport, not a network latency
baseline. Without `NPM_METADATA_RUN=1`, the test target exits without building
the component or using the network. Public npmjs.org results must never be used
as CI timing gates.
