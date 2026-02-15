#!/usr/bin/env bash
# Regenerate the Node.js compatibility report.
#
# Usage:
#   ./tests/node_compat/generate-report.sh
#
# Prerequisites:
#   - The vendored test suite must be present (run vendor.sh first)
#   - cargo-component must be installed
#
# The report is written to tests/node_compat/report.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SUITE_DIR="${SCRIPT_DIR}/suite"

if [ ! -d "${SUITE_DIR}/parallel" ]; then
  echo "Error: vendored test suite not found at ${SUITE_DIR}/parallel"
  echo "Run ./tests/node_compat/vendor.sh first."
  exit 1
fi

cd "${REPO_ROOT}"

# Clean the cached runner WASM so it gets rebuilt with latest changes
rm -rf tmp/node-compat-runner tmp/rt-target

echo "==> Running node_compat_report test (this takes ~10 minutes)..."
cargo test --test node_compat_report -- --nocapture

echo "==> Report written to tests/node_compat/report.md"
