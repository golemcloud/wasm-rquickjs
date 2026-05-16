test_r::enable!();

use crate::common::js_subtest_parser::{
    BlockInfo, SubtestDiscovery, discover_subtests, rewrite_for_block, rewrite_for_node_test,
};
use crate::common::{
    CompiledTest, GolemPreparedComponent, TestInstance, load_node_compat_config,
    setup_node_compat_test_files,
};
use camino::Utf8Path;
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::sync::Arc;
use std::time::Duration;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::{test_dep, test_gen};
use tokio::time::timeout;
use wasmtime::component::Val;

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

struct FullPreparedComponent(Arc<GolemPreparedComponent>);

async fn compile_node_compat_with_features(
    feature_combination: common::FeatureCombination,
) -> Arc<GolemPreparedComponent> {
    let path = Utf8Path::new("examples/runtime/node-compat-runner");
    let compiled = CompiledTest::new_with_features(path, true, feature_combination)
        .await
        .expect("Failed to compile node-compat-runner");
    Arc::new(
        GolemPreparedComponent::new(compiled.wasm_path()).expect("Failed to prepare component"),
    )
}

#[test_dep]
async fn prepare_node_compat_full() -> Arc<FullPreparedComponent> {
    Arc::new(FullPreparedComponent(
        compile_node_compat_with_features(common::FeatureCombination::FullNoLoggingWithGolem).await,
    ))
}

// --- Helper types and functions ---

/// Cloneable representation of discovery data for use in test closures.
#[derive(Clone)]
enum DiscoveryData {
    Block(Vec<BlockInfo>),
    NodeTest,
}

fn handle_test_result(
    result: anyhow::Result<Option<Val>>,
    stdout: &str,
    stderr: &str,
) -> anyhow::Result<()> {
    match result {
        Ok(Some(Val::String(ref s))) if s.starts_with("PASS") => Ok(()),
        Ok(Some(Val::String(ref s))) if s.starts_with("SKIP:") => Ok(()),
        Ok(Some(Val::String(ref s))) => {
            anyhow::bail!(
                "Test failed: {}\n[stdout]\n{}\n[stderr]\n{}",
                s,
                stdout.trim(),
                stderr.trim()
            )
        }
        Ok(other) => {
            anyhow::bail!(
                "Unexpected return: {:?}\n[stdout]\n{}\n[stderr]\n{}",
                other,
                stdout.trim(),
                stderr.trim()
            )
        }
        Err(e) => {
            anyhow::bail!(
                "Invocation error: {}\n[stdout]\n{}\n[stderr]\n{}",
                e,
                stdout.trim(),
                stderr.trim()
            )
        }
    }
}

// --- Shard tagging for CI parallelism ---

const NUM_SHARDS: u64 = 8;

fn shard_tag(name: &str) -> String {
    let mut hasher = DefaultHasher::new();
    name.hash(&mut hasher);
    format!("shard{}", hasher.finish() % NUM_SHARDS)
}

// --- Dynamic test generation ---

#[test_gen]
fn gen_node_compat_tests(r: &mut DynamicTestRegistration) {
    let entries =
        load_node_compat_config("tests/node_compat/config.jsonc").expect("Failed to load config");

    let dependency_name = "arc_fullpreparedcomponent".to_string();

    for entry in entries {
        let path = entry.path.clone();
        let file_test_name = path.replace('/', "__").replace(['.', '-'], "_");

        let test_timeout_secs = entry.timeout_secs;

        if !entry.split || entry.subtests.is_empty() {
            // Non-split: one Rust test per file (unchanged behavior)
            let props = TestProperties {
                is_ignored: entry.category.should_ignore_in_runner(),
                tags: vec![shard_tag(&file_test_name)],
                ..TestProperties::unit_test()
            };

            r.add_async_test(
                file_test_name,
                props,
                Some(vec![dependency_name.clone()]),
                move |deps| {
                    let prepared: Arc<Arc<FullPreparedComponent>> = deps
                        .get("arc_fullpreparedcomponent")
                        .expect("FullPreparedComponent dependency not found")
                        .downcast::<Arc<FullPreparedComponent>>()
                        .expect("FullPreparedComponent type mismatch");
                    let prepared = prepared.as_ref().as_ref().0.clone();
                    let path = path.clone();
                    Box::pin(async move {
                        let test_future = async {
                            let mut instance = TestInstance::from_golem_prepared(&prepared).await?;
                            instance.set_epoch_deadline(test_timeout_secs);
                            setup_node_compat_test_files(instance.temp_dir_path(), &path)?;

                            let guest_path = format!("/home/node/test/{}", path);
                            let (result, stdout, stderr) = instance
                                .invoke_and_capture_output_with_stderr(
                                    None,
                                    "run-test",
                                    &[Val::String(guest_path)],
                                )
                                .await;

                            handle_test_result(result, &stdout, &stderr)
                        };
                        match timeout(Duration::from_secs(test_timeout_secs), test_future).await {
                            Ok(result) => result,
                            Err(_) => anyhow::bail!("Test timed out after {}s", test_timeout_secs),
                        }
                    })
                },
            );
        } else {
            // Split: one Rust test per subtest
            let suite_path = format!("tests/node_compat/suite/{}", path);
            let source = match fs::read_to_string(&suite_path) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("WARNING: Cannot read split test file {}: {}", suite_path, e);
                    continue;
                }
            };

            let discovery = discover_subtests(&path, &source);

            // Staleness check: compare discovered subtest count vs config count
            let discovered_count = match &discovery {
                SubtestDiscovery::None => 0,
                SubtestDiscovery::Block(blocks) => blocks.len(),
                SubtestDiscovery::NodeTest(tests) => tests.len(),
            };
            if discovered_count != entry.subtests.len() {
                eprintln!(
                    "WARNING: Subtest count mismatch for {}: config has {}, discovered {}. Run migration tool.",
                    path,
                    entry.subtests.len(),
                    discovered_count
                );
            }

            for subtest in &entry.subtests {
                let test_name = format!("{}__{}", file_test_name, subtest.name);
                let is_ignored = subtest.category.should_ignore_in_runner();
                let props = TestProperties {
                    is_ignored,
                    tags: vec![shard_tag(&test_name)],
                    ..TestProperties::unit_test()
                };

                let path = path.clone();
                let subtest_index = subtest.index;
                let source = source.clone();
                let discovery_clone = match &discovery {
                    SubtestDiscovery::None => None,
                    SubtestDiscovery::Block(blocks) => Some(DiscoveryData::Block(blocks.clone())),
                    SubtestDiscovery::NodeTest(_) => Some(DiscoveryData::NodeTest),
                };

                r.add_async_test(
                    test_name,
                    props,
                    Some(vec![dependency_name.clone()]),
                    move |deps| {
                        let prepared: Arc<Arc<FullPreparedComponent>> = deps
                            .get("arc_fullpreparedcomponent")
                            .expect("FullPreparedComponent dependency not found")
                            .downcast::<Arc<FullPreparedComponent>>()
                            .expect("FullPreparedComponent type mismatch");
                        let prepared = prepared.as_ref().as_ref().0.clone();
                        let path = path.clone();
                        let source = source.clone();
                        let discovery_clone = discovery_clone.clone();
                        Box::pin(async move {
                            let mut instance = TestInstance::from_golem_prepared(&prepared).await?;
                            instance.set_epoch_deadline(test_timeout_secs);
                            setup_node_compat_test_files(instance.temp_dir_path(), &path)?;

                            // Rewrite the test file to isolate the target subtest
                            let rewritten = match &discovery_clone {
                                Some(DiscoveryData::Block(blocks)) => {
                                    rewrite_for_block(&source, blocks, subtest_index)
                                }
                                Some(DiscoveryData::NodeTest) => {
                                    rewrite_for_node_test(&source, subtest_index)
                                }
                                None => source.clone(),
                            };

                            // Write the rewritten file to the temp dir
                            let test_filename = path.rsplit('/').next().unwrap_or(&path);
                            let suite = path.split('/').next().unwrap_or("parallel");
                            let rewritten_path = instance
                                .temp_dir_path()
                                .join("home")
                                .join("node")
                                .join("test")
                                .join(suite)
                                .join(test_filename);
                            fs::write(&rewritten_path, &rewritten)?;

                            let guest_path = format!("/home/node/test/{}", path);
                            let test_future = async {
                                let (result, stdout, stderr) = instance
                                    .invoke_and_capture_output_with_stderr(
                                        None,
                                        "run-test",
                                        &[Val::String(guest_path)],
                                    )
                                    .await;

                                handle_test_result(result, &stdout, &stderr)
                            };
                            match timeout(Duration::from_secs(test_timeout_secs), test_future).await
                            {
                                Ok(result) => result,
                                Err(_) => {
                                    let stdout = instance.read_stdout().unwrap_or_default();
                                    let stderr = instance.read_stderr().unwrap_or_default();
                                    anyhow::bail!(
                                        "Test timed out after {}s\n[stdout]\n{}\n[stderr]\n{}",
                                        test_timeout_secs,
                                        stdout.trim(),
                                        stderr.trim()
                                    )
                                }
                            }
                        })
                    },
                );
            }
        }
    }
}
