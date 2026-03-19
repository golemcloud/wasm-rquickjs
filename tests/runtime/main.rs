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
mod buffer;
mod cjs_require;
mod console;
mod crypto;
mod diagnostics_channel;
mod diagnostics_channel_golem;
mod dns;
mod domain;
mod encoding;
mod example1;
mod example2;
mod example3;
mod export_from_inner_package;
mod fetch;
mod fs;
mod imports;
mod intl;
mod node_http;
mod os;
mod path;
mod pollable;
mod response_constructor;
mod response_static;
mod stateful1;
mod streams;
mod structured_clone;
mod timeout;
mod url;
mod v8_stack_trace;
mod xhr;

#[test_dep(tagged_as = "example3")]
fn compiled_example3() -> CompiledTest {
    let path = Utf8Path::new("examples/example3");
    CompiledTest::new(path, true).expect("Failed to compile example3")
}
