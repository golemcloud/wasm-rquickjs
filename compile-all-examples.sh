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
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/timeout/wit --js examples/timeout/src/timeout.js --output tmp/timeout
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/streams/wit --js examples/streams/src/streams.js --output tmp/streams
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/fetch/wit --js examples/fetch/src/fetch.js --output tmp/fetch
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-wrapper-crate --wit examples/encoding/wit --js examples/encoding/src/encoding.js --output tmp/encoding

# Generate .d.ts files for all examples
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/export-from-inner-package/wit --output tmp/export-from-inner-package/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/hello-world1/wit --output tmp/hello-world1/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/hello-world2/wit --output tmp/hello-world2/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/hello-world3/wit --output tmp/hello-world3/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/imports1/wit --output tmp/imports1/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/imports2/wit --output tmp/imports2/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/imports3/wit --output tmp/imports3/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/stateful1/wit --output tmp/stateful1/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/types-in-exports/wit --output tmp/types-in-exports/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/all-golem-imports/wit --output tmp/all-golem-imports/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/console/wit --output tmp/console/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/timeout/wit --output tmp/timeout/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/streams/wit --output tmp/streams/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/fetch/wit --output tmp/fetch/dts
cargo run --package wasm-rquickjs-cli --bin wasm-rquickjs -- generate-dts --wit examples/encoding/wit --output tmp/encoding/dts

# All generated crates can be compiled
pushd tmp/export-from-inner-package
cargo component build --target-dir ../target
popd
pushd tmp/hello-world1
cargo component build --target-dir ../target
popd
pushd tmp/hello-world2
cargo component build --target-dir ../target
popd
pushd tmp/hello-world3
cargo component build --target-dir ../target
popd
pushd tmp/imports1
cargo component build --target-dir ../target
popd
pushd tmp/imports2
cargo component build --target-dir ../target
popd
pushd tmp/imports3
cargo component build --target-dir ../target
popd
pushd tmp/stateful1
cargo component build --target-dir ../target
popd
pushd tmp/types-in-exports
cargo component build --target-dir ../target
popd
pushd tmp/all-golem-imports
cargo component build --target-dir ../target
popd
pushd tmp/console
cargo component build --target-dir ../target
popd
pushd tmp/timeout
cargo component build --target-dir ../target
popd
pushd tmp/streams
cargo component build --target-dir ../target
popd
pushd tmp/fetch
cargo component build --target-dir ../target
popd

# Test feature flags in one of the examples
pushd tmp/hello-world1
cargo clean
cargo component build --no-default-features --target-dir ../target
cargo clean
cargo component build --no-default-features --features logging --target-dir ../target
cargo clean
cargo component build --no-default-features --features http --target-dir ../target
popd
