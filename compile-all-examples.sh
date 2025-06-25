#!/usr/bin/env bash

set -euox pipefail

# Temporary test script until integration tests are implemented

cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/export-from-inner-package/wit --js examples/export-from-inner-package/src/hello.js --output tmp/export-from-inner-package
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/hello-world1/wit --js examples/hello-world1/src/hello.js --output tmp/hello-world1
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/hello-world2/wit --js examples/hello-world2/src/hello.js --output tmp/hello-world2
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/hello-world3/wit --js examples/hello-world3/src/hello.js --output tmp/hello-world3
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/imports1/wit --js examples/imports1/src/imports1.js --output tmp/imports1
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/imports2/wit --js examples/imports2/src/imports2.js --output tmp/imports2
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/imports3/wit --js examples/imports3/src/imports3.js --output tmp/imports3
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/stateful1/wit --js examples/stateful1/src/stateful.js --output tmp/stateful1
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/types-in-exports/wit --js examples/types-in-exports/src/types-in-exports.js --output tmp/types-in-exports
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/all-golem-imports/wit --js examples/all-golem-imports/src/all-golem-imports.js --output tmp/all-golem-imports
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/console/wit --js examples/console/src/console.js --output tmp/console

pushd tmp/export-from-inner-package
cargo component build
popd
pushd tmp/hello-world1
cargo component build
popd
pushd tmp/hello-world2
cargo component build
popd
pushd tmp/hello-world3
cargo component build
popd
pushd tmp/imports1
cargo component build
popd
pushd tmp/imports2
cargo component build
popd
pushd tmp/imports3
cargo component build
popd
pushd tmp/stateful1
cargo component build
popd
pushd tmp/types-in-exports
cargo component build
popd
pushd tmp/all-golem-imports
cargo component build
popd
pushd tmp/console
cargo component build
popd


