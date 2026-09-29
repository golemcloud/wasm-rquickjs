#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
binary=$(mktemp "${TMPDIR:-/tmp}/wasm-rquickjs-currentness.XXXXXX")
trap 'rm -f "$binary"' EXIT HUP INT TERM
rustc --edition=2024 -D warnings "$repo_root/tools/performance-report-currentness.rs" -o "$binary"
"$binary" "$@"
