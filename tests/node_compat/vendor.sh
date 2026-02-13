#!/usr/bin/env bash
# Vendor Node.js test suite for compatibility testing.
#
# Usage:
#   ./tests/node_compat/vendor.sh [version]
#
# If no version is specified, defaults to the version in NODE_VERSION below.
# The script sparse-checkouts test/parallel/ and test/common/ from the
# nodejs/node repository at the given tag.

set -euo pipefail

NODE_VERSION="${1:-22.14.0}"
TAG="v${NODE_VERSION}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SUITE_DIR="${SCRIPT_DIR}/suite"

echo "==> Vendoring Node.js ${TAG} test suite into ${SUITE_DIR}"

# Clean previous vendor
rm -rf "${SUITE_DIR}"
mkdir -p "${SUITE_DIR}"

# Clone with sparse checkout — only test/parallel and test/common
TMPDIR_CLONE="$(mktemp -d)"
trap 'rm -rf "${TMPDIR_CLONE}"' EXIT

echo "==> Cloning nodejs/node@${TAG} (sparse)..."
git clone --depth 1 --sparse --branch "${TAG}" --single-branch \
    --filter=blob:none \
    https://github.com/nodejs/node.git "${TMPDIR_CLONE}/node"

cd "${TMPDIR_CLONE}/node"
git sparse-checkout set test/parallel test/common

echo "==> Copying test files..."
cp -r test/parallel "${SUITE_DIR}/parallel"
cp -r test/common "${SUITE_DIR}/common"

# Record the version
echo "${NODE_VERSION}" > "${SUITE_DIR}/NODE_VERSION"

# Count what we got
PARALLEL_COUNT=$(find "${SUITE_DIR}/parallel" -name '*.js' -o -name '*.mjs' | wc -l | tr -d ' ')
COMMON_COUNT=$(find "${SUITE_DIR}/common" -name '*.js' -o -name '*.mjs' | wc -l | tr -d ' ')

echo "==> Done! Vendored ${PARALLEL_COUNT} test files + ${COMMON_COUNT} common files from Node.js ${TAG}"
echo "==> Suite directory: ${SUITE_DIR}"
