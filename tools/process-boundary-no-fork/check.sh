#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
: "${WASI_SDK:?Set WASI_SDK to the installed WASI SDK}"
: "${ORACLE_NODE:?Set ORACLE_NODE to Node 22.14.0}"
export WASI_SDK
proof=tools/process-boundary-no-fork
results=${BOUNDARY_RESULTS_DIR:-tmp/process-boundary-no-fork-results}
mkdir -p "$results"
cargo fmt --manifest-path "$proof/Cargo.toml" -- --check
cargo metadata --manifest-path "$proof/Cargo.toml" --all-features --locked --offline --format-version 1 > "$results/dependencies.json"
"$ORACLE_NODE" -e 'const m=require("./"+process.argv[1]); for(const p of m.packages) if(p.name.startsWith("rquickjs")){if(p.version!=="0.10.0" || !p.source?.startsWith("registry+"))throw Error("Patched/unexpected rquickjs: "+p.name); console.log(p.name,p.version,p.source)}' "$results/dependencies.json"
cargo clippy --manifest-path "$proof/Cargo.toml" --locked --offline -- -D warnings
cargo test --manifest-path "$proof/Cargo.toml" --locked --offline --lib terminal_process::admission::tests
cargo test --manifest-path "$proof/Cargo.toml" --locked --offline --lib binding_tests::macro_adapter_without_signal_retains_stock_behavior
cargo build --manifest-path "$proof/Cargo.toml" --release --locked --offline
"$proof/target/release/process-boundary-no-fork" > "$results/host.jsonl"
"$proof/target/release/process-boundary-no-fork" complete > "$results/host-completion.jsonl"
"$ORACLE_NODE" "$proof/oracle.cjs" "$proof/target/release/process-boundary-no-fork" > "$results/node-oracle.json"
for lane in p2 p3; do
  cargo clippy --manifest-path "$proof/Cargo.toml" --lib --target wasm32-wasip2 --features "$lane" --locked --offline -- -D warnings
  cargo build --manifest-path "$proof/Cargo.toml" --lib --target wasm32-wasip2 --features "$lane" --release --locked --offline
  cp "$proof/target/wasm32-wasip2/release/process_boundary_no_fork.wasm" "$results/prototype-$lane.wasm"
  if [[ $lane == p3 ]]; then
    wasmtime compile -W component-model-async=y -o "$results/prototype-$lane.cwasm" "$results/prototype-$lane.wasm"
  else
    wasmtime compile -o "$results/prototype-$lane.cwasm" "$results/prototype-$lane.wasm"
  fi
done
"$ORACLE_NODE" "$proof/measure.cjs" "$results"
