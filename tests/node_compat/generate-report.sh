#!/usr/bin/env bash
# Regenerate the Node.js compatibility report.
#
# Usage:
#   ./tests/node_compat/generate-report.sh
#
# Prerequisites:
#   - The vendored test suite must be present (run vendor.sh first)
#
# The report is written to tests/node_compat/report.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SUITE_DIR="${SCRIPT_DIR}/suite"

if [ ! -f "${SUITE_DIR}/NODE_VERSION" ]; then
  echo "Error: vendored test suite not found at ${SUITE_DIR}"
  echo "Run ./tests/node_compat/vendor.sh first."
  exit 1
fi

cd "${REPO_ROOT}"

echo "==> Generating report from config.jsonc and pinned vendored Node.js sources..."
cargo test --release --test node_compat_report -- generate_node_compat_config_report --nocapture

echo "==> Report written to tests/node_compat/report.md"
