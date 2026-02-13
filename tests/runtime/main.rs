test_r::enable!();

use crate::common::CompiledTest;
use camino::Utf8Path;
use test_r::test_dep;

#[allow(dead_code)]
#[path = "../common/mod.rs"]
mod common;

mod abort_controller;
mod assert;
mod bigint_roundtrip;
mod cjs_require;
mod console;
mod crypto;
mod encoding;
mod example1;
mod example2;
mod example3;
mod export_from_inner_package;
mod fetch;
mod fs;
mod imports;
mod os;
mod path;
mod pollable;
mod response_static;
mod stateful1;
mod streams;
mod structured_clone;
mod timeout;
mod url;
mod xhr;

#[test_dep(tagged_as = "example1")]
fn compiled_example1() -> CompiledTest {
    let path = Utf8Path::new("examples/example1");
    CompiledTest::new(path, true).expect("Failed to compile example1")
}

#[test_dep(tagged_as = "example2")]
fn compiled_example2() -> CompiledTest {
    let path = Utf8Path::new("examples/example2");
    CompiledTest::new(path, true).expect("Failed to compile example2")
}

#[test_dep(tagged_as = "example3")]
fn compiled_example3() -> CompiledTest {
    let path = Utf8Path::new("examples/example3");
    CompiledTest::new(path, true).expect("Failed to compile example3")
}

#[test_dep(tagged_as = "console")]
fn compiled_console() -> CompiledTest {
    let path = Utf8Path::new("examples/console");
    CompiledTest::new(path, true).expect("Failed to compile console")
}

#[test_dep(tagged_as = "encoding")]
fn compiled_encoding() -> CompiledTest {
    let path = Utf8Path::new("examples/encoding");
    CompiledTest::new(path, true).expect("Failed to compile encoding")
}

#[test_dep(tagged_as = "export_from_inner_package")]
fn compiled_export_from_inner_package() -> CompiledTest {
    let path = Utf8Path::new("examples/export-from-inner-package");
    CompiledTest::new(path, true).expect("Failed to compile export-from-inner-package")
}

#[test_dep(tagged_as = "fetch")]
fn compiled_fetch() -> CompiledTest {
    let path = Utf8Path::new("examples/fetch");
    CompiledTest::new(path, true).expect("Failed to compile fetch")
}

#[test_dep(tagged_as = "imports1")]
fn compiled_imports1() -> CompiledTest {
    let path = Utf8Path::new("examples/imports1");
    CompiledTest::new(path, true).expect("Failed to compile imports1")
}

#[test_dep(tagged_as = "imports2")]
fn compiled_imports2() -> CompiledTest {
    let path = Utf8Path::new("examples/imports2");
    CompiledTest::new(path, true).expect("Failed to compile imports2")
}

#[test_dep(tagged_as = "imports3")]
fn compiled_imports3() -> CompiledTest {
    let path = Utf8Path::new("examples/imports3");
    CompiledTest::new(path, true).expect("Failed to compile imports3")
}

#[test_dep(tagged_as = "types_in_exports")]
fn compiled_types_in_exports() -> CompiledTest {
    let path = Utf8Path::new("examples/types-in-exports");
    CompiledTest::new(path, true).expect("Failed to compile types-in-exports")
}

#[test_dep(tagged_as = "stateful1")]
fn compiled_stateful1() -> CompiledTest {
    let path = Utf8Path::new("examples/stateful1");
    CompiledTest::new(path, true).expect("Failed to compile stateful1")
}

#[test_dep(tagged_as = "streams")]
fn compiled_streams() -> CompiledTest {
    let path = Utf8Path::new("examples/streams");
    CompiledTest::new(path, true).expect("Failed to compile streams")
}

#[test_dep(tagged_as = "timeout")]
fn compiled_timeout() -> CompiledTest {
    let path = Utf8Path::new("examples/timeout");
    CompiledTest::new(path, true).expect("Failed to compile timeout")
}

#[test_dep(tagged_as = "bigint_roundtrip")]
fn compiled_bigint_roundtrip() -> CompiledTest {
    let path = Utf8Path::new("examples/bigint-roundtrip");
    CompiledTest::new(path, true).expect("Failed to compile bigint-roundtrip")
}

#[test_dep(tagged_as = "pollable")]
fn compiled_pollable() -> CompiledTest {
    let path = Utf8Path::new("examples/pollable");
    CompiledTest::new(path, true).expect("Failed to compile pollable")
}

#[test_dep(tagged_as = "fs")]
fn compiled_fs() -> CompiledTest {
    let path = Utf8Path::new("examples/fs");
    CompiledTest::new(path, false).expect("Failed to compile fs")
}

#[test_dep(tagged_as = "url")]
fn compiled_url() -> CompiledTest {
    let path = Utf8Path::new("examples/url");
    CompiledTest::new(path, false).expect("Failed to compile url")
}

#[test_dep(tagged_as = "crypto")]
fn compiled_crypto() -> CompiledTest {
    let path = Utf8Path::new("examples/crypto");
    CompiledTest::new(path, false).expect("Failed to compile crypto")
}

#[test_dep(tagged_as = "response_static")]
fn compiled_response_static() -> CompiledTest {
    let path = Utf8Path::new("examples/response-static");
    CompiledTest::new(path, true).expect("Failed to compile response-static")
}

#[test_dep(tagged_as = "abort_controller")]
fn compiled_abort_controller() -> CompiledTest {
    let path = Utf8Path::new("examples/abort-controller");
    CompiledTest::new(path, true).expect("Failed to compile abort-controller")
}

#[test_dep(tagged_as = "xhr")]
fn compiled_xhr() -> CompiledTest {
    let path = Utf8Path::new("examples/xhr");
    CompiledTest::new(path, true).expect("Failed to compile xhr")
}

#[test_dep(tagged_as = "os")]
fn compiled_os() -> CompiledTest {
    let path = Utf8Path::new("examples/os");
    CompiledTest::new(path, true).expect("Failed to compile os")
}

#[test_dep(tagged_as = "structured_clone")]
fn compiled_structured_clone() -> CompiledTest {
    let path = Utf8Path::new("examples/structured-clone");
    CompiledTest::new(path, true).expect("Failed to compile structured-clone")
}

#[test_dep(tagged_as = "path")]
fn compiled_path() -> CompiledTest {
    let path = Utf8Path::new("examples/path");
    CompiledTest::new(path, false).expect("Failed to compile path")
}

#[test_dep(tagged_as = "assert")]
fn compiled_assert() -> CompiledTest {
    let path = Utf8Path::new("examples/assert");
    CompiledTest::new(path, false).expect("Failed to compile assert")
}

#[test_dep(tagged_as = "cjs_require")]
fn compiled_cjs_require() -> CompiledTest {
    let path = Utf8Path::new("examples/cjs-require");
    CompiledTest::new(path, false).expect("Failed to compile cjs-require")
}
