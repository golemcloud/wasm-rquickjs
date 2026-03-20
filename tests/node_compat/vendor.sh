#!/usr/bin/env bash
# Vendor Node.js test suite for compatibility testing.
#
# Usage:
#   ./tests/node_compat/vendor.sh [version]
#
# If no version is specified, defaults to the version in NODE_VERSION below.
# The script sparse-checkouts test/parallel/, test/sequential/, test/es-module/,
# test/common/, and test/fixtures/ from the nodejs/node repository at the given tag.

set -euo pipefail

NODE_VERSION="${1:-22.14.0}"
TAG="v${NODE_VERSION}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SUITE_DIR="${SCRIPT_DIR}/suite"

echo "==> Vendoring Node.js ${TAG} test suite into ${SUITE_DIR}"

# Clean previous vendor
rm -rf "${SUITE_DIR}"
mkdir -p "${SUITE_DIR}"

# Clone with sparse checkout — test/parallel, test/common, and test/fixtures
TMPDIR_CLONE="$(mktemp -d)"
trap 'rm -rf "${TMPDIR_CLONE}"' EXIT

echo "==> Cloning nodejs/node@${TAG} (sparse)..."
git clone --depth 1 --sparse --branch "${TAG}" --single-branch \
    --filter=blob:none \
    https://github.com/nodejs/node.git "${TMPDIR_CLONE}/node"

cd "${TMPDIR_CLONE}/node"
git sparse-checkout set test/parallel test/sequential test/es-module test/common test/fixtures

echo "==> Copying test files..."
cp -r test/parallel "${SUITE_DIR}/parallel"
cp -r test/sequential "${SUITE_DIR}/sequential"
cp -r test/es-module "${SUITE_DIR}/es-module"
cp -r test/common "${SUITE_DIR}/common"
cp -r test/fixtures "${SUITE_DIR}/fixtures"

# Record the version
echo "${NODE_VERSION}" > "${SUITE_DIR}/NODE_VERSION"

# Count what we got
PARALLEL_COUNT=$(find "${SUITE_DIR}/parallel" -name '*.js' -o -name '*.mjs' | wc -l | tr -d ' ')
SEQUENTIAL_COUNT=$(find "${SUITE_DIR}/sequential" -name '*.js' -o -name '*.mjs' | wc -l | tr -d ' ')
ES_MODULE_COUNT=$(find "${SUITE_DIR}/es-module" -name '*.js' -o -name '*.mjs' | wc -l | tr -d ' ')
COMMON_COUNT=$(find "${SUITE_DIR}/common" -name '*.js' -o -name '*.mjs' | wc -l | tr -d ' ')
FIXTURES_COUNT=$(find "${SUITE_DIR}/fixtures" -type f | wc -l | tr -d ' ')

echo "==> Done! Vendored ${PARALLEL_COUNT} parallel + ${SEQUENTIAL_COUNT} sequential + ${ES_MODULE_COUNT} es-module test files + ${COMMON_COUNT} common files + ${FIXTURES_COUNT} fixture files from Node.js ${TAG}"
echo "==> Suite directory: ${SUITE_DIR}"
