test_r::enable!();

use crate::common::js_subtest_parser::{
    BlockInfo, SubtestDiscovery, TestInfo, discover_subtests_with_options,
    rewrite_for_block_with_options, rewrite_for_node_test,
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

/// Parent compiles the node-compat wrapper crate exactly once and ships
/// the wasm path to every worker via test-r's `Cloneable` scope. The
/// expensive piece (cargo build of the wrapper crate) therefore runs a
/// single time per suite even with `--test-threads N` and capture on.
#[test_dep(tagged_as = "node_compat_full_compiled", scope = Cloneable)]
async fn compiled_node_compat_full() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/node-compat-runner");
    CompiledTest::new_with_features(
        path,
        true,
        common::FeatureCombination::FullNoLoggingWithGolemAndTypeScript,
    )
    .await
    .expect("Failed to compile node-compat-runner")
}

/// Each worker materialises its own `FullPreparedComponent` (which owns
/// the per-worker `wasmtime::Engine`, `Linker`, `Component`, and
/// epoch-ticker thread) from the parent-shipped wasm path. This is
/// `PerWorker` rather than `Shared` so it does not re-trigger the
/// single-threaded fallback that `Shared` deps cause under capture.
#[test_dep(scope = PerWorker)]
fn prepare_node_compat_full(
    #[tagged_as("node_compat_full_compiled")] compiled: &CompiledTest,
) -> Arc<FullPreparedComponent> {
    Arc::new(FullPreparedComponent(Arc::new(
        GolemPreparedComponent::new(compiled.wasm_path()).expect("Failed to prepare component"),
    )))
}

#[test_r::test]
async fn runner_import_preload_flag(prepared: &Arc<FullPreparedComponent>) -> anyhow::Result<()> {
    let mut instance = TestInstance::from_golem_prepared(&prepared.0).await?;
    instance.set_epoch_deadline(30);

    let suite_dir = instance
        .temp_dir_path()
        .join("home")
        .join("node")
        .join("test")
        .join("es-module");
    fs::create_dir_all(&suite_dir)?;
    fs::write(
        suite_dir.join("preload-smoke-preload.mjs"),
        "globalThis.__nodeCompatPreloadValue = 41;\n",
    )?;
    fs::write(
        suite_dir.join("preload-smoke.mjs"),
        [
            "// Flags: --import ./test/es-module/preload-smoke-preload.mjs",
            "if (globalThis.__nodeCompatPreloadValue !== 41) {",
            "  throw new Error('preload did not run before entry');",
            "}",
        ]
        .join("\n"),
    )?;

    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run-test",
            &[Val::String(
                "/home/node/test/es-module/preload-smoke.mjs".to_string(),
            )],
        )
        .await;

    handle_test_result(result, &stdout, &stderr)
}

#[test_r::test]
async fn runner_dynamic_import_cache_survives_removed_file(
    prepared: &Arc<FullPreparedComponent>,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::from_golem_prepared(&prepared.0).await?;
    instance.set_epoch_deadline(30);

    let suite_dir = instance
        .temp_dir_path()
        .join("home")
        .join("node")
        .join("test")
        .join("es-module");
    fs::create_dir_all(&suite_dir)?;
    fs::write(
        suite_dir.join("dynamic-import-cache-entry.mjs"),
        [
            "import assert from 'node:assert';",
            "import fs from 'node:fs/promises';",
            "const target = new URL('./dynamic-import-cache-target.mjs', import.meta.url);",
            "await assert.rejects(import(target), { code: 'ERR_MODULE_NOT_FOUND' });",
            "await fs.writeFile(target, 'export default \"actual target\"\\n');",
            "const moduleRecord = await import(target);",
            "await fs.rm(target);",
            "assert.strictEqual(await import(target), moduleRecord);",
        ]
        .join("\n"),
    )?;

    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run-test",
            &[Val::String(
                "/home/node/test/es-module/dynamic-import-cache-entry.mjs".to_string(),
            )],
        )
        .await;

    handle_test_result(result, &stdout, &stderr)
}

#[test_r::test]
async fn runner_static_registered_loader_async_resolve(
    prepared: &Arc<FullPreparedComponent>,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::from_golem_prepared(&prepared.0).await?;
    instance.set_epoch_deadline(30);

    let suite_dir = instance
        .temp_dir_path()
        .join("home")
        .join("node")
        .join("test")
        .join("es-module");
    fs::create_dir_all(&suite_dir)?;
    fs::write(
        suite_dir.join("async-static-loader.mjs"),
        [
            "export async function resolve(specifier, context, nextResolve) {",
            "  if (specifier === './dep.mjs') {",
            "    return nextResolve('./real.mjs', context);",
            "  }",
            "  if (specifier === './generated.mjs') {",
            "    return { shortCircuit: true, url: 'virtual:generated', format: 'module' };",
            "  }",
            "  if (specifier === 'virtual:child') {",
            "    return { shortCircuit: true, url: new URL('./child.mjs', import.meta.url).href, format: 'module' };",
            "  }",
            "  return nextResolve(specifier, context);",
            "}",
            "export async function load(url, context, nextLoad) {",
            "  if (url === 'virtual:generated') {",
            "    return { shortCircuit: true, format: 'module', source: 'import value from \"virtual:child\"; export default value;' };",
            "  }",
            "  return nextLoad(url, context);",
            "}",
        ]
        .join("\n"),
    )?;
    fs::write(
        suite_dir.join("async-static-entry.mjs"),
        [
            "// Flags: --experimental-loader ./test/es-module/async-static-loader.mjs",
            "import value from './dep.mjs';",
            "import generated from './generated.mjs';",
            "if (value !== 42) throw new Error('static async loader resolve did not run');",
            "if (generated !== 7) throw new Error('loader source child import was not prepared');",
        ]
        .join("\n"),
    )?;
    fs::write(suite_dir.join("real.mjs"), "export default 42;\n")?;
    fs::write(suite_dir.join("child.mjs"), "export default 7;\n")?;

    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run-test",
            &[Val::String(
                "/home/node/test/es-module/async-static-entry.mjs".to_string(),
            )],
        )
        .await;

    handle_test_result(result, &stdout, &stderr)
}

#[test_r::test]
async fn runner_programmatic_registered_loader_chain(
    prepared: &Arc<FullPreparedComponent>,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::from_golem_prepared(&prepared.0).await?;
    instance.set_epoch_deadline(30);

    let suite_dir = instance
        .temp_dir_path()
        .join("home")
        .join("node")
        .join("test")
        .join("es-module");
    fs::create_dir_all(&suite_dir)?;
    fs::write(
        suite_dir.join("register-chain-loader-a.mjs"),
        [
            "export function resolve(specifier, context, nextResolve) {",
            "  if (!specifier.startsWith('virtual:registered-chain')) return nextResolve(specifier, context);",
            "  return nextResolve(`${specifier}:a`, context);",
            "}",
        ]
        .join("\n"),
    )?;
    fs::write(
        suite_dir.join("register-chain-loader-b.mjs"),
        [
            "let tag;",
            "export function initialize(data) { tag = data.tag; }",
            "export function resolve(specifier, context, nextResolve) {",
            "  if (!specifier.startsWith('virtual:registered-chain')) return nextResolve(specifier, context);",
            "  return nextResolve(`${specifier}:${tag}`, context);",
            "}",
        ]
        .join("\n"),
    )?;
    fs::write(
        suite_dir.join("register-chain-terminal.mjs"),
        [
            "let tag;",
            "export function initialize(data) { tag = data.tag; }",
            "export function resolve(specifier, context, nextResolve) {",
            "  if (!specifier.startsWith('virtual:registered-chain')) return nextResolve(specifier, context);",
            "  return { shortCircuit: true, url: `virtual:done:${specifier}:${tag}`, format: 'module' };",
            "}",
            "export function load(url, context, nextLoad) {",
            "  if (!url.startsWith('virtual:done:')) return nextLoad(url, context);",
            "  return { shortCircuit: true, format: 'module', source: `export default ${JSON.stringify(url)};` };",
            "}",
        ]
        .join("\n"),
    )?;
    fs::write(
        suite_dir.join("register-chain-entry.mjs"),
        [
            "import { register } from 'node:module';",
            "register('./register-chain-terminal.mjs', { parentURL: import.meta.url, data: { tag: 'terminal' } });",
            "register('./register-chain-loader-a.mjs', { parentURL: import.meta.url });",
            "register('./register-chain-loader-b.mjs', { parentURL: import.meta.url, data: { tag: 'b' } });",
            "register('./register-chain-loader-a.mjs', { parentURL: import.meta.url });",
            "const ns = await import('virtual:registered-chain');",
            "if (ns.default !== 'virtual:done:virtual:registered-chain:a:b:a:terminal') {",
            "  throw new Error('programmatic loader chain order mismatch: ' + ns.default);",
            "}",
        ]
        .join("\n"),
    )?;

    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run-test",
            &[Val::String(
                "/home/node/test/es-module/register-chain-entry.mjs".to_string(),
            )],
        )
        .await;

    handle_test_result(result, &stdout, &stderr)
}

#[test_r::test]
async fn runner_module_load_uses_parent_resolution(
    prepared: &Arc<FullPreparedComponent>,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::from_golem_prepared(&prepared.0).await?;
    instance.set_epoch_deadline(30);

    let suite_dir = instance
        .temp_dir_path()
        .join("home")
        .join("node")
        .join("test")
        .join("es-module");
    fs::create_dir_all(&suite_dir)?;
    fs::write(
        suite_dir.join("module-load-parent.mjs"),
        [
            "import Module from 'node:module';",
            "const parent = new Module('/home/node/test/es-module/parent.cjs');",
            "parent.filename = '/home/node/test/es-module/parent.cjs';",
            "parent.path = '/home/node/test/es-module';",
            "parent.paths = Module._nodeModulePaths('/home/node/test/es-module');",
            "parent.require = () => { throw new Error('Module._load must not call parent.require'); };",
            "const loaded = Module._load('./module-load-dep.cjs', parent);",
            "if (loaded.marker !== 42) throw new Error('Module._load did not resolve relative to parent');",
            "const resolved = Module._resolveFilename('./module-load-dep.cjs', parent);",
            "if (!resolved.endsWith('/module-load-dep.cjs')) throw new Error('Module._resolveFilename did not resolve relative to parent: ' + resolved);",
            "const viaPrototype = Module.prototype.require.call(parent, './module-load-dep.cjs');",
            "if (viaPrototype.marker !== 42) throw new Error('Module.prototype.require did not resolve relative to receiver');",
            "const customParent = new Module('synthetic-parent');",
            "if (customParent.path !== '.') throw new Error('Module constructor did not derive relative id path: ' + customParent.path);",
            "if (Object.prototype.hasOwnProperty.call(customParent, 'paths')) throw new Error('Module constructor should not define own paths');",
            "const undefinedId = new Module(undefined);",
            "if (undefinedId.id !== '' || undefinedId.path !== '.') throw new Error('Module constructor did not default undefined id');",
            "const constructorParent = new Module('/home/node/test/es-module/constructor-parent.cjs');",
            "const constructorChild = new Module('/home/node/test/es-module/subdir/constructor-child.cjs', constructorParent);",
            "if (constructorParent.path !== '/home/node/test/es-module') throw new Error('Module constructor parent path mismatch: ' + constructorParent.path);",
            "if (constructorChild.path !== '/home/node/test/es-module/subdir') throw new Error('Module constructor child path mismatch: ' + constructorChild.path);",
            "if (constructorChild.parent !== constructorParent) throw new Error('Module constructor did not expose parent');",
            "if (!constructorParent.children.includes(constructorChild)) throw new Error('Module constructor did not add child to parent.children');",
            "assertInvalidArgType(() => new Module(null));",
            "assertInvalidArgType(() => new Module(0));",
            "const arrayLikeParent = { children: { length: 0 } };",
            "const arrayLikeChild = new Module('array-like-child', arrayLikeParent);",
            "if (arrayLikeParent.children[0] !== arrayLikeChild || arrayLikeParent.children.length !== 1) throw new Error('Module constructor did not append to array-like children');",
            "customParent.path = '/not-used-for-bare-resolution';",
            "customParent.paths = ['/home/node/test/es-module/custom_lookup'];",
            "const packageLoaded = Module._load('parent-only-pkg', customParent);",
            "if (packageLoaded.marker !== 84) throw new Error('Module._load did not honor parent.paths');",
            "const packageResolved = Module._resolveFilename('parent-only-pkg', customParent);",
            "if (!packageResolved.endsWith('/custom_lookup/parent-only-pkg/index.js')) throw new Error('Module._resolveFilename did not honor parent.paths: ' + packageResolved);",
            "const pathsOptionResolved = Module._resolveFilename('paths-option-pkg', customParent, false, { paths: ['/home/node/test/es-module/paths_option'] });",
            "if (!pathsOptionResolved.endsWith('/paths_option/node_modules/paths-option-pkg/index.js')) throw new Error('Module._resolveFilename did not honor options.paths: ' + pathsOptionResolved);",
            "assertModuleNotFound(() => Module._resolveFilename('./missing-paths-option.cjs', parent, false, { paths: ['/home/node/test/es-module/paths_option'] }), '/home/node/test/es-module/parent.cjs');",
            "const packageViaPrototype = Module.prototype.require.call(customParent, 'parent-only-pkg');",
            "if (packageViaPrototype.marker !== 84) throw new Error('Module.prototype.require did not honor receiver.paths');",
            "if (Module._resolveFilename('node:module') !== 'node:module') throw new Error('Module._resolveFilename changed node: builtin specifier');",
            "if (Module._resolveFilename('module') !== 'module') throw new Error('Module._resolveFilename changed bare builtin specifier');",
            "if (!Module.isBuiltin('module')) throw new Error('Module.isBuiltin did not recognize module');",
            "if (!Module.isBuiltin('node:module')) throw new Error('Module.isBuiltin did not recognize node:module');",
            "if (!Module.builtinModules.includes('module')) throw new Error('Module.builtinModules is missing module');",
            "if (Module.builtinModules.includes('node:module')) throw new Error('Module.builtinModules should not include node:module');",
            "if (Module.prototype.require.call(parent, 'node:module').createRequire(import.meta.url).resolve.paths('module') !== null) throw new Error('require.resolve.paths should return null for module');",
            "if (Module.prototype.require.call(parent, 'node:module').createRequire(import.meta.url).resolve.paths('node:module') !== null) throw new Error('require.resolve.paths should return null for node:module');",
            "const pathOnlyParent = new Module('path-only-parent');",
            "pathOnlyParent.path = '/home/node/test/es-module/path_only_base';",
            "pathOnlyParent.paths = [];",
            "assertModuleNotFound(() => Module._load('./path-only-dep.cjs', pathOnlyParent));",
            "assertModuleNotFound(() => Module._resolveFilename('./path-only-dep.cjs', pathOnlyParent));",
            "assertModuleNotFound(() => Module.prototype.require.call(pathOnlyParent, './path-only-dep.cjs'));",
            "const compiled = new Module('/home/node/test/es-module/compiled-parent.cjs');",
            "const compiledPathBefore = compiled.path;",
            "compiled._compile('exports.filename = __filename; exports.dirname = __dirname; exports.dep = require(\"./compiled-dep.cjs\");', '/home/node/test/es-module/compiled-parent.cjs');",
            "if (compiled.filename !== null) throw new Error('Module.prototype._compile should not mutate synthetic module.filename');",
            "if (compiled.loaded !== false) throw new Error('Module.prototype._compile should not mutate synthetic module.loaded');",
            "if (compiled.path !== compiledPathBefore) throw new Error('Module.prototype._compile should not mutate synthetic module.path');",
            "if (compiled.exports.filename !== '/home/node/test/es-module/compiled-parent.cjs') throw new Error('Module.prototype._compile passed wrong __filename');",
            "if (compiled.exports.dirname !== '/home/node/test/es-module') throw new Error('Module.prototype._compile passed wrong __dirname');",
            "if (compiled.exports.dep.marker !== 252) throw new Error('Module.prototype._compile require did not resolve relative to filename');",
            "const missingCompile = new Module('/home/node/test/es-module/compiled-parent.cjs');",
            "assertModuleNotFound(() => missingCompile._compile('require(\"./missing-compiled-dep.cjs\");', '/home/node/test/es-module/compiled-parent.cjs'), '/home/node/test/es-module/compiled-parent.cjs');",
            "assertInvalidArgType(() => Module.prototype._compile.call(null, 'exports.x = 1;', '/home/node/test/es-module/null.cjs'));",
            "assertInvalidArgType(() => Module.prototype._compile.call({}, 'exports.x = 1;', '/home/node/test/es-module/plain.cjs'));",
            "const cacheRequire = Module.createRequire(import.meta.url);",
            "cacheRequire('./loaded-compile-target.cjs');",
            "const loadedModule = cacheRequire.cache[cacheRequire.resolve('./loaded-compile-target.cjs')];",
            "const unboundCompile = loadedModule._compile;",
            "assertInvalidArgType(() => unboundCompile('exports.x = 1;', '/home/node/test/es-module/unbound.cjs'));",
            "loadedModule._compile('exports.emptyFilename = __filename; exports.emptyDirname = __dirname; exports.emptyDep = require(\"./compiled-dep.cjs\");', '');",
            "if (loadedModule.exports.emptyFilename !== '') throw new Error('loaded module _compile should honor empty filename');",
            "if (loadedModule.exports.emptyDirname !== '.') throw new Error('loaded module _compile should use dot dirname for empty filename');",
            "if (loadedModule.exports.emptyDep.marker !== 252) throw new Error('loaded module _compile empty-filename require should resolve from original module');",
            "function assertModuleNotFound(fn) {",
            "  const expectedStack = arguments.length > 1 ? arguments[1] : undefined;",
            "  try { fn(); } catch (err) {",
            "    if (err && err.code === 'MODULE_NOT_FOUND') {",
            "      if (expectedStack && (!Array.isArray(err.requireStack) || !err.requireStack.includes(expectedStack))) throw err;",
            "      return;",
            "    }",
            "    throw err;",
            "  }",
            "  throw new Error('expected MODULE_NOT_FOUND');",
            "}",
            "function assertInvalidArgType(fn) {",
            "  try { fn(); } catch (err) { if (err && err.code === 'ERR_INVALID_ARG_TYPE') return; throw err; }",
            "  throw new Error('expected ERR_INVALID_ARG_TYPE');",
            "}",
        ]
        .join("\n"),
    )?;
    fs::write(
        suite_dir.join("module-load-dep.cjs"),
        "module.exports = { marker: 42 };\n",
    )?;
    let package_dir = suite_dir.join("custom_lookup").join("parent-only-pkg");
    fs::create_dir_all(&package_dir)?;
    fs::write(
        package_dir.join("index.js"),
        "module.exports = { marker: 84 };\n",
    )?;
    let paths_option_package_dir = suite_dir
        .join("paths_option")
        .join("node_modules")
        .join("paths-option-pkg");
    fs::create_dir_all(&paths_option_package_dir)?;
    fs::write(
        paths_option_package_dir.join("index.js"),
        "module.exports = { marker: 126 };\n",
    )?;
    let path_only_dir = suite_dir.join("path_only_base");
    fs::create_dir_all(&path_only_dir)?;
    fs::write(
        path_only_dir.join("path-only-dep.cjs"),
        "module.exports = { marker: 168 };\n",
    )?;
    fs::write(
        suite_dir.join("compiled-dep.cjs"),
        "module.exports = { marker: 252 };\n",
    )?;
    fs::write(
        suite_dir.join("loaded-compile-target.cjs"),
        "module.exports = { marker: 294 };\n",
    )?;

    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run-test",
            &[Val::String(
                "/home/node/test/es-module/module-load-parent.mjs".to_string(),
            )],
        )
        .await;

    handle_test_result(result, &stdout, &stderr)
}

// --- Helper types and functions ---

/// Cloneable representation of discovery data for use in test closures.
#[derive(Clone)]
enum DiscoveryData {
    Block(Vec<BlockInfo>),
    NodeTest(Vec<TestInfo>),
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

// --- Flaky test retry support ---

/// Maximum number of attempts for tests marked `"flaky": true` in
/// `tests/node_compat/config.jsonc`. A flaky test passes if any single attempt
/// passes; it only fails after all `FLAKY_MAX_ATTEMPTS` attempts fail.
const FLAKY_MAX_ATTEMPTS: u32 = 10;

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

            let entry_flaky = entry.flaky;
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
                        let max_attempts = if entry_flaky { FLAKY_MAX_ATTEMPTS } else { 1 };
                        let mut last_err: Option<anyhow::Error> = None;
                        for attempt in 1..=max_attempts {
                            let prepared = prepared.clone();
                            let path = path.clone();
                            let attempt_result = async {
                                let mut instance =
                                    TestInstance::from_golem_prepared(&prepared).await?;
                                instance.set_epoch_deadline(test_timeout_secs);
                                setup_node_compat_test_files(instance.temp_dir_path(), &path)?;

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
                                match timeout(Duration::from_secs(test_timeout_secs), test_future)
                                    .await
                                {
                                    Ok(result) => result,
                                    Err(_) => {
                                        let stdout = instance.read_stdout().unwrap_or_default();
                                        let stderr = instance.read_stderr().unwrap_or_default();
                                        anyhow::bail!(
                                            "Test timed out after {}s\n[stdout]\n{}\n[stderr]\n{}\n[host trace]\n{}",
                                            test_timeout_secs,
                                            stdout.trim(),
                                            stderr.trim(),
                                            common::host_trace().trim()
                                        )
                                    }
                                }
                            }
                            .await;
                            match attempt_result {
                                Ok(()) => return Ok(()),
                                Err(e) => {
                                    if entry_flaky && attempt < max_attempts {
                                        eprintln!(
                                            "Flaky test attempt {}/{} failed, retrying: {}",
                                            attempt, max_attempts, e
                                        );
                                    }
                                    last_err = Some(e);
                                }
                            }
                        }
                        Err(last_err.unwrap_or_else(|| {
                            anyhow::anyhow!("Test failed with no recorded error")
                        }))
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

            let discovery = discover_subtests_with_options(
                &path,
                &source,
                entry.nested_node_test,
                entry.isolate_block_subtests,
            );

            // Staleness check: compare discovered subtest count vs config count
            let discovered_count = match &discovery {
                SubtestDiscovery::None => 0,
                SubtestDiscovery::Block(blocks) => blocks.len(),
                SubtestDiscovery::NodeTest(tests) => tests.len(),
            };
            assert_eq!(
                discovered_count,
                entry.subtests.len(),
                "Subtest count mismatch for {path}: config has {}, discovered {discovered_count}. Run migration tool.",
                entry.subtests.len()
            );

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
                let isolate_block_subtests = entry.isolate_block_subtests;
                let discovery_clone = match &discovery {
                    SubtestDiscovery::None => None,
                    SubtestDiscovery::Block(blocks) => Some(DiscoveryData::Block(blocks.clone())),
                    SubtestDiscovery::NodeTest(tests) => {
                        Some(DiscoveryData::NodeTest(tests.clone()))
                    }
                };
                let subtest_flaky = subtest.flaky;

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
                            let max_attempts =
                                if subtest_flaky { FLAKY_MAX_ATTEMPTS } else { 1 };
                            let mut last_err: Option<anyhow::Error> = None;
                            for attempt in 1..=max_attempts {
                                let prepared = prepared.clone();
                                let path = path.clone();
                                let source = source.clone();
                                let discovery_clone = discovery_clone.clone();
                                let attempt_result = async {
                                    let mut instance =
                                        TestInstance::from_golem_prepared(&prepared).await?;
                                    instance.set_epoch_deadline(test_timeout_secs);
                                    setup_node_compat_test_files(instance.temp_dir_path(), &path)?;

                                    // Rewrite the test file to isolate the target subtest
                                    let rewritten = match &discovery_clone {
                                        Some(DiscoveryData::Block(blocks)) => rewrite_for_block_with_options(
                                            &source,
                                            blocks,
                                            subtest_index,
                                            isolate_block_subtests,
                                        ),
                                        Some(DiscoveryData::NodeTest(tests)) => {
                                            rewrite_for_node_test(&source, tests, subtest_index)
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
                                    match timeout(
                                        Duration::from_secs(test_timeout_secs),
                                        test_future,
                                    )
                                    .await
                                    {
                                        Ok(result) => result,
                                        Err(_) => {
                                            let stdout = instance.read_stdout().unwrap_or_default();
                                            let stderr = instance.read_stderr().unwrap_or_default();
                                            anyhow::bail!(
                                                "Test timed out after {}s\n[stdout]\n{}\n[stderr]\n{}\n[host trace]\n{}",
                                                test_timeout_secs,
                                                stdout.trim(),
                                                stderr.trim(),
                                                common::host_trace().trim()
                                            )
                                        }
                                    }
                                }
                                .await;

                                match attempt_result {
                                    Ok(()) => return Ok(()),
                                    Err(e) => {
                                        if subtest_flaky && attempt < max_attempts {
                                            eprintln!(
                                                "Flaky test attempt {}/{} failed, retrying: {}",
                                                attempt, max_attempts, e
                                            );
                                        }
                                        last_err = Some(e);
                                    }
                                }
                            }
                            Err(last_err.unwrap_or_else(|| {
                                anyhow::anyhow!("Test failed with no recorded error")
                            }))
                        })
                    },
                );
            }
        }
    }
}
