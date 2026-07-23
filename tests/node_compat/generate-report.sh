#!/usr/bin/env bash
# Regenerate the Node.js compatibility report.
#
# Usage:
#   ./tests/node_compat/generate-report.sh
#
# Prerequisites:
#   - The vendored test suite must be present (run vendor.sh first). No tests are
#     compiled or executed, but each test file is read to detect Node-internals
#     usage (`--expose-internals`, `require('internal/...')`); without the suite
#     those tests are silently misclassified as runnable.
#
# Everything else is derived from tests/node_compat/config.jsonc, so a run takes
# seconds. Run it whenever config.jsonc changes; nothing in CI regenerates or
# checks the report.
#
# The report is written to tests/node_compat/report.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SUITE_DIR="${SCRIPT_DIR}/suite"

if [ ! -d "${SUITE_DIR}" ]; then
  echo "Error: vendored test suite not found at ${SUITE_DIR}"
  echo "Run ./tests/node_compat/vendor.sh first."
  exit 1
fi

cd "${REPO_ROOT}"

echo "==> Running node_compat_report test..."
cargo test --test node_compat_report -- --nocapture

echo "==> Report written to tests/node_compat/report.md"
