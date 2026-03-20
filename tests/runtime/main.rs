test_r::enable!();

use crate::common::CompiledTest;
use camino::Utf8Path;
use test_r::{tag_suite, test_dep};

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
mod toplevel_timer;
mod url;
mod v8_stack_trace;
mod xhr;

// Tag suites into 8 groups for parallel CI matrix execution
tag_suite!(crypto, group1);

tag_suite!(fetch, group2);

tag_suite!(abort_controller, group3);
tag_suite!(fs, group3);

tag_suite!(xhr, group4);
tag_suite!(assert, group4);
tag_suite!(dns, group4);
tag_suite!(console, group4);
tag_suite!(encoding, group4);

tag_suite!(response_constructor, group5);
tag_suite!(streams, group5);
tag_suite!(diagnostics_channel, group5);
tag_suite!(diagnostics_channel_golem, group5);
tag_suite!(pollable, group5);
tag_suite!(toplevel_timer, group5);

tag_suite!(path, group6);
tag_suite!(domain, group6);
tag_suite!(stateful1, group6);
tag_suite!(os, group6);
tag_suite!(export_from_inner_package, group6);
tag_suite!(example3, group6);

tag_suite!(url, group7);
tag_suite!(cjs_require, group7);
tag_suite!(timeout, group7);
tag_suite!(buffer, group7);
tag_suite!(bigint_roundtrip, group7);
tag_suite!(imports, group7);

tag_suite!(response_static, group8);
tag_suite!(v8_stack_trace, group8);
tag_suite!(structured_clone, group8);
tag_suite!(node_http, group8);
tag_suite!(intl, group8);
tag_suite!(example1, group8);
tag_suite!(example2, group8);

#[test_dep(tagged_as = "example3")]
fn compiled_example3() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/example3");
    CompiledTest::new(path, true).expect("Failed to compile example3")
}
