pub mod test_server;

use crate::common::WasmSource::Precompiled;
use anyhow::anyhow;
use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::{NamedUtf8TempFile, Utf8TempDir};
use heck::ToSnakeCase;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Write;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time::timeout;
use wac_graph::types::{Package, SubtypeChecker};
use wac_graph::{CompositionGraph, EncodeOptions, PackageId, PlugError};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};
use wasmtime::component::{
    Component, Func, Instance, Linker, ResourceAny, ResourceTable, ResourceType, Val,
};
use wasmtime::{Engine, Store, StoreContextMut};
use wasmtime_wasi::p2::{IoView, OutputFile, WasiCtx, WasiView, bindings};
use wasmtime_wasi::{DirPerms, FilePerms};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpView};

/// Strip JSONC comments (// and /* */) while respecting string literals.
pub fn strip_jsonc_comments(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if chars[i] == '"' {
            result.push(chars[i]);
            i += 1;
            while i < len && chars[i] != '"' {
                if chars[i] == '\\' && i + 1 < len {
                    result.push(chars[i]);
                    result.push(chars[i + 1]);
                    i += 2;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            }
            if i < len {
                result.push(chars[i]);
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '/' {
            i += 2;
            while i < len && chars[i] != '\n' {
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < len {
                i += 2;
            }
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }

    result
}

/// Recursively copy a directory and all its contents to a destination.
pub fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> anyhow::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Copy a vendored Node.js test file and common shims into a temp directory.
///
/// Sets up the directory layout expected by the node-compat-runner:
/// - `/tests/parallel/<test_file>` — the test itself
/// - `/tests/common/` and `/test/common/` — common shims (both paths used by vendored tests)
/// - `/tmp/` — for tmpdir shim
/// - `/tests/fixtures/` — fixture data files (recursively copied)
pub fn setup_node_compat_test_files(temp: &Utf8Path, test_rel_path: &str) -> anyhow::Result<()> {
    // Parse the suite name from the relative path (e.g., "parallel/test-foo.js" → "parallel")
    let suite = test_rel_path.split('/').next().unwrap_or("parallel");

    // Create directory structure: /test/<suite>/ and /test/common/
    // Node.js uses "test/" (not "tests/") so __filename ends up matching expectations.
    let suite_dir = temp.join("test").join(suite);
    let common_dir = temp.join("test").join("common");
    fs::create_dir_all(&suite_dir)?;
    fs::create_dir_all(&common_dir)?;

    // Copy the test file
    let test_filename = test_rel_path.rsplit('/').next().unwrap_or(test_rel_path);
    let src_test = format!("tests/node_compat/suite/{test_rel_path}");
    let dst_test = suite_dir.join(test_filename);
    fs::copy(&src_test, &dst_test)?;

    // Copy the common shim
    let src_shim = "tests/node_compat/common-shim/index.js";
    let dst_shim = common_dir.join("index.js");
    fs::copy(src_shim, &dst_shim)?;

    // Copy additional common shims if they exist
    for shim_name in &["tmpdir.js", "tick.js", "fixtures.js", "crypto.js"] {
        let src_shim_extra = format!("tests/node_compat/common-shim/{shim_name}");
        if std::path::Path::new(&src_shim_extra).exists() {
            let dst_shim_extra = common_dir.join(shim_name);
            fs::copy(&src_shim_extra, &dst_shim_extra)?;
        }
    }

    // Some vendored tests use require('../../test/common/tmpdir') instead of
    // require('../common/tmpdir'), so mirror shims into /test/common/ as well.
    let test_common_dir = temp.join("test").join("common");
    fs::create_dir_all(&test_common_dir)?;
    fs::copy(src_shim, test_common_dir.join("index.js"))?;
    for shim_name in &["tmpdir.js", "tick.js", "fixtures.js", "crypto.js"] {
        let src_shim_extra = format!("tests/node_compat/common-shim/{shim_name}");
        if std::path::Path::new(&src_shim_extra).exists() {
            fs::copy(&src_shim_extra, test_common_dir.join(shim_name))?;
        }
    }

    // Create /tmp directory for tmpdir shim
    let tmp_dir = temp.join("tmp");
    fs::create_dir_all(&tmp_dir)?;

    // Copy fixture data files for tests that use require('../common/fixtures')
    let fixtures_dst = temp.join("test").join("fixtures");

    // First copy vendored suite fixtures
    let vendored_fixtures_src = std::path::Path::new("tests/node_compat/suite/fixtures");
    if vendored_fixtures_src.exists() {
        copy_dir_recursive(vendored_fixtures_src, fixtures_dst.as_std_path())?;
    }

    // Then overlay with our custom fixtures (take priority over vendored ones)
    let fixtures_src = std::path::Path::new("tests/node_compat/fixtures");
    if fixtures_src.exists() {
        copy_dir_recursive(fixtures_src, fixtures_dst.as_std_path())?;
    }

    Ok(())
}

pub fn collect_example_paths() -> anyhow::Result<Vec<Utf8PathBuf>> {
    let mut result = Vec::new();
    let paths = fs::read_dir("examples")?;
    for example_path in paths {
        let example_path = example_path?;
        let metadata = example_path.metadata()?;
        if metadata.is_dir() {
            let path = Utf8PathBuf::from_path_buf(example_path.path())
                .map_err(|_| anyhow!("Non UTF-8 example path"))?;
            result.push(path);
        }
    }
    Ok(result)
}

#[derive(Copy, Clone)]
pub enum FeatureCombination {
    None,
    LogOnly,
    HttpOnly,
    Default,
    Golem,
}

impl FeatureCombination {
    pub fn all() -> Vec<FeatureCombination> {
        vec![Self::None, Self::LogOnly, Self::HttpOnly, Self::Default]
    }

    pub fn label(&self) -> &str {
        match self {
            Self::None => "none",
            Self::LogOnly => "log",
            Self::HttpOnly => "http",
            Self::Default => "default",
            Self::Golem => "golem",
        }
    }

    pub fn cargo_args(&self) -> Vec<&'static str> {
        match self {
            FeatureCombination::None => vec!["--no-default-features"],
            FeatureCombination::LogOnly => {
                vec!["--no-default-features", "--features", "logging"]
            }
            FeatureCombination::HttpOnly => vec!["--no-default-features", "--features", "http"],
            FeatureCombination::Default => vec![],
            FeatureCombination::Golem => vec!["--features", "golem"],
        }
    }
}

pub struct PreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
}

impl PreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let mut config = wasmtime::Config::default();
        config.async_support(true);
        config.wasm_component_model(true);
        config.async_stack_size(32 * 1024 * 1024); // 32MB async stack (must be >= max_wasm_stack)
        config.max_wasm_stack(16 * 1024 * 1024); // 16MB WASM stack (default is 512KB, QuickJS in WASM needs more for deep recursion)
        config.cache(Some(wasmtime::Cache::from_file(None)?));
        let engine = Engine::new(&config)?;
        let mut linker: Linker<Host> = Linker::new(&engine);

        wasmtime_wasi::p2::add_to_linker_with_options_async(
            &mut linker,
            &bindings::LinkOptions::default(),
        )?;
        wasmtime_wasi_http::add_only_http_to_linker_async(&mut linker)?;

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            linker,
            component,
        })
    }
}

/// Mock logging level for wasi:logging/logging
#[derive(wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(enum)]
#[repr(u8)]
#[allow(dead_code)]
pub enum LogLevel {
    #[component(name = "trace")]
    Trace,
    #[component(name = "debug")]
    Debug,
    #[component(name = "info")]
    Info,
    #[component(name = "warn")]
    Warn,
    #[component(name = "error")]
    Error,
    #[component(name = "critical")]
    Critical,
}

/// Mock attribute-value variant for golem:api/context
#[derive(wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(variant)]
pub enum AttributeValue {
    #[component(name = "string")]
    String(String),
}

/// Mock span for golem:api/context testing
pub struct GolemSpan {
    pub name: String,
    pub attributes: Vec<(String, String)>,
    pub finished: bool,
}

/// A PreparedComponent that includes a mock golem:api/context host implementation.
pub struct GolemPreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
    pub spans: Arc<Mutex<Vec<GolemSpan>>>,
}

impl GolemPreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let mut config = wasmtime::Config::default();
        config.async_support(true);
        config.wasm_component_model(true);
        config.async_stack_size(32 * 1024 * 1024);
        config.max_wasm_stack(16 * 1024 * 1024);
        config.cache(Some(wasmtime::Cache::from_file(None)?));
        let engine = Engine::new(&config)?;
        let mut linker: Linker<Host> = Linker::new(&engine);

        wasmtime_wasi::p2::add_to_linker_with_options_async(
            &mut linker,
            &bindings::LinkOptions::default(),
        )?;
        wasmtime_wasi_http::add_only_http_to_linker_async(&mut linker)?;

        // Mock wasi:logging/logging (required by the golem feature)
        {
            let mut logging = linker.instance("wasi:logging/logging")?;
            logging.func_wrap(
                "log",
                |_ctx: StoreContextMut<'_, Host>, (_level, _context, _message): (LogLevel, String, String)| -> Result<(), anyhow::Error> {
                    Ok(())
                },
            )?;
        }

        // Mock golem:api/context@1.3.0
        let spans: Arc<Mutex<Vec<GolemSpan>>> = Arc::new(Mutex::new(Vec::new()));
        let spans_clone = spans.clone();

        let mut golem_ctx = linker.instance("golem:api/context@1.3.0")?;

        // Register the span resource type
        let span_resource_type = ResourceType::host::<GolemSpan>();
        golem_ctx.resource("span", span_resource_type, {
            let spans = spans_clone.clone();
            move |mut ctx: StoreContextMut<'_, Host>, rep: u32| {
                // Destructor: mark span as finished if not already
                let table = ctx.data_mut().table.lock().unwrap();
                // Resource already dropped by wasmtime
                let _ = (spans.as_ref(), rep, table);
                Ok(())
            }
        })?;

        // start-span: func(name: string) -> span
        golem_ctx.func_wrap(
            "start-span",
            {
                let spans = spans_clone.clone();
                move |mut ctx: StoreContextMut<'_, Host>, (name,): (String,)| -> Result<(wasmtime::component::Resource<GolemSpan>,), anyhow::Error> {
                    let span = GolemSpan {
                        name,
                        attributes: Vec::new(),
                        finished: false,
                    };
                    let mut table = ctx.data_mut().table.lock().unwrap();
                    let resource = table.push(span)?;
                    spans.lock().unwrap().push(GolemSpan {
                        name: String::new(), // placeholder, real data is in table
                        attributes: Vec::new(),
                        finished: false,
                    });
                    Ok((resource,))
                }
            },
        )?;

        // [method]span.set-attribute: func(name: string, value: attribute-value)
        // attribute-value is a variant with one case: string(string)
        // In the component model, a single-case variant is lifted as a tuple (u32, string) or similar.
        // But since it has only one case, wasmtime may simplify it.
        // Let's check what the actual signature is - it's (resource<span>, string, attribute-value)
        // where attribute-value = variant { string(string) }
        // A variant with one case lifts as (discriminant: u32, payload: string) but wasmtime component
        // may represent it as an enum. Let's use a tuple.
        golem_ctx.func_wrap(
            "[method]span.set-attribute",
            {
                let spans = spans_clone.clone();
                move |mut ctx: StoreContextMut<'_, Host>,
                      (span_res, attr_name, attr_value): (
                    wasmtime::component::Resource<GolemSpan>,
                    String,
                    AttributeValue,
                )| -> Result<(), anyhow::Error> {
                    let value_str = match &attr_value {
                        AttributeValue::String(s) => s.clone(),
                    };
                    let mut table = ctx.data_mut().table.lock().unwrap();
                    if let Ok(span) = table.get_mut(&span_res) {
                        span.attributes.push((attr_name.clone(), value_str.clone()));
                    }
                    // Also record in the shared spans list
                    let mut shared = spans.lock().unwrap();
                    if let Some(last) = shared.last_mut() {
                        last.attributes.push((attr_name, value_str));
                    }
                    Ok(())
                }
            },
        )?;

        // [method]span.finish: func()
        golem_ctx.func_wrap(
            "[method]span.finish",
            {
                let spans = spans_clone.clone();
                move |mut ctx: StoreContextMut<'_, Host>,
                      (span_res,): (wasmtime::component::Resource<GolemSpan>,)| -> Result<(), anyhow::Error> {
                    let mut table = ctx.data_mut().table.lock().unwrap();
                    if let Ok(span) = table.get_mut(&span_res) {
                        span.finished = true;
                        // Copy final state to shared spans
                        let name = span.name.clone();
                        let attributes = span.attributes.clone();
                        let mut shared = spans.lock().unwrap();
                        if let Some(last) = shared.last_mut() {
                            last.name = name;
                            last.finished = true;
                            last.attributes = attributes;
                        }
                    }
                    Ok(())
                }
            },
        )?;

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            linker,
            component,
            spans,
        })
    }
}

#[allow(dead_code)]
pub struct TestInstance {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
    store: Store<Host>,
    instance: Instance,
    stdout_file: NamedUtf8TempFile,
    stderr_file: NamedUtf8TempFile,
    temp_dir: Utf8TempDir,
}

impl TestInstance {
    pub async fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let prepared = PreparedComponent::new(wasm_path)?;
        Self::from_prepared(&prepared).await
    }

    pub async fn from_prepared(prepared: &PreparedComponent) -> anyhow::Result<Self> {
        Self::from_parts(&prepared.engine, &prepared.linker, &prepared.component).await
    }

    pub async fn from_golem_prepared(prepared: &GolemPreparedComponent) -> anyhow::Result<Self> {
        Self::from_parts(&prepared.engine, &prepared.linker, &prepared.component).await
    }

    async fn from_parts(
        engine: &Engine,
        linker: &Linker<Host>,
        component: &Component,
    ) -> anyhow::Result<Self> {
        let stdout_file = NamedUtf8TempFile::new()?;
        let stderr_file = NamedUtf8TempFile::new()?;

        let temp_dir = Utf8TempDir::new()?;
        fs::write(temp_dir.path().join("input.txt"), "test file contents")?;
        fs::create_dir(temp_dir.path().join("test"))?;

        let ctx = WasiCtx::builder()
            .stdout(OutputFile::new(stdout_file.reopen()?))
            .stderr(OutputFile::new(stderr_file.reopen()?))
            .arg("first-arg")
            .arg("second-arg")
            .env("TEST_KEY", "TEST_VALUE")
            .env("TEST_KEY_2", "TEST_VALUE_2")
            .preopened_dir(&temp_dir, "/", DirPerms::all(), FilePerms::all())?
            .build();
        let http_ctx = WasiHttpCtx::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(http_ctx),
        };

        let mut store = Store::new(engine, host);

        let instance = linker
            .instantiate_async(&mut store, component)
            .await?;

        Ok(Self {
            engine: engine.clone(),
            linker: linker.clone(),
            component: component.clone(),
            store,
            instance,
            stdout_file,
            stderr_file,
            temp_dir,
        })
    }

    pub async fn invoke_and_capture_output(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> (anyhow::Result<Option<Val>>, String) {
        let (results, stdout, _stderr) = self
            .invoke_and_capture_output_with_stderr(interface_name, function_name, args)
            .await;
        (results, stdout)
    }

    pub async fn invoke_and_capture_output_with_stderr(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> (anyhow::Result<Option<Val>>, String, String) {
        let results = self
            .invoke_and_capture_output_inner(interface_name, function_name, args)
            .await;

        let stdout = fs::read_to_string(&self.stdout_file).expect("failed to read stdout");
        let stderr = fs::read_to_string(&self.stderr_file).expect("failed to read stderr");

        if results.is_err() {
            for line in stdout.lines() {
                println!("[stdout] {line}");
            }
        }

        for line in stderr.lines() {
            println!("[stderr] {line}");
        }

        (
            results.map(|results| results.first().cloned()),
            stdout,
            stderr,
        )
    }

    pub fn temp_dir_path(&self) -> &Utf8Path {
        self.temp_dir.path()
    }

    async fn invoke_and_capture_output_inner(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> anyhow::Result<Vec<Val>> {
        let func = match interface_name {
            Some(interface_name) => {
                let (_, exported_instance_id) = self
                    .instance
                    .get_export(&mut self.store, None, interface_name)
                    .ok_or_else(|| anyhow!("Interface {interface_name} not found"))?;
                let (_, func_id) = self
                    .instance
                    .get_export(&mut self.store, Some(&exported_instance_id), function_name)
                    .ok_or_else(|| {
                        anyhow!("Function {function_name} not found in interface {interface_name}")
                    })?;
                self.instance
                    .get_func(&mut self.store, func_id)
                    .ok_or_else(|| anyhow!("Function {function_name} not found"))?
            }
            None => self
                .instance
                .get_func(&mut self.store, function_name)
                .ok_or_else(|| anyhow!("Function {function_name} not found"))?,
        };

        match timeout(Duration::from_secs(120), self.perform_invoke(func, args)).await {
            Ok(result) => result,
            Err(_) => Err(anyhow!("Function {function_name} timed out")),
        }
    }

    async fn perform_invoke(&mut self, func: Func, args: &[Val]) -> anyhow::Result<Vec<Val>> {
        let mut results = (0..func.results(&mut self.store).len())
            .map(|_| Val::Bool(false))
            .collect::<Vec<_>>();
        func.call_async(&mut self.store, args, &mut results).await?;
        func.post_return_async(&mut self.store).await?;
        Ok(results)
    }

    pub async fn drop_resource(&mut self, resource: ResourceAny) -> anyhow::Result<()> {
        resource.resource_drop_async::<Host>(&mut self.store).await
    }
}

pub async fn invoke_and_capture_output(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
) -> (anyhow::Result<Option<Val>>, String) {
    match TestInstance::new(wasm_path).await {
        Ok(mut test_instance) => {
            test_instance
                .invoke_and_capture_output(interface_name, function_name, args)
                .await
        }
        Err(e) => (Err(e), String::new()),
    }
}

pub async fn invoke_and_capture_output_with_stderr(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
) -> (anyhow::Result<Option<Val>>, String, String) {
    match TestInstance::new(wasm_path).await {
        Ok(mut test_instance) => {
            test_instance
                .invoke_and_capture_output_with_stderr(interface_name, function_name, args)
                .await
        }
        Err(e) => (Err(e), String::new(), String::new()),
    }
}

enum WasmSource {
    Precompiled(Utf8PathBuf),
    OwnedTemporary(NamedUtf8TempFile),
}

pub struct CompiledTest {
    wasm: WasmSource,
}

impl CompiledTest {
    pub fn new(path: &Utf8Path, use_shared_target: bool) -> anyhow::Result<CompiledTest> {
        Self::new_with_features(path, use_shared_target, FeatureCombination::HttpOnly)
    }

    pub fn new_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        let feature_combination = feature_combination;
        let name = path.file_name().unwrap();
        let wrapper_crate_root = Utf8Path::new("tmp")
            .join(name)
            .join(feature_combination.label());

        // shared_target is relative to wrapper_crate_root.
        // this is a _different_ shared target than the one used in the compilation tests to make
        // sure different feature combinations do not interfere with these tests.
        let shared_target = Utf8Path::new("..").join("..").join("rt-target");

        println!("Generating wrapper create for example '{name}' to {wrapper_crate_root}");
        generate_wrapper_crate(
            &path.join("wit"),
            &[JsModuleSpec {
                name: name.to_string(),
                mode: EmbeddingMode::EmbedFile(path.join("src").join(format!("{name}.js"))),
            }],
            &wrapper_crate_root,
            None,
        )?;

        println!("Compiling wrapper crate in {wrapper_crate_root}");
        let mut command = Command::new("cargo-component");
        command.arg("build");
        if use_shared_target {
            command.arg("--target-dir");
            command.arg(shared_target);
        }
        command
            .args(feature_combination.cargo_args())
            .current_dir(&wrapper_crate_root)
            .status()?;

        if use_shared_target {
            Ok(CompiledTest {
                wasm: Precompiled(
                    Utf8Path::new("tmp")
                        .join("rt-target")
                        .join("wasm32-wasip1")
                        .join("debug")
                        .join(format!("{}.wasm", name.to_snake_case())),
                ),
            })
        } else {
            Ok(CompiledTest {
                wasm: Precompiled(
                    wrapper_crate_root
                        .join("target")
                        .join("wasm32-wasip1")
                        .join("debug")
                        .join(format!("{}.wasm", name.to_snake_case())),
                ),
            })
        }
    }

    pub fn wasm_path(&self) -> &Utf8Path {
        match &self.wasm {
            WasmSource::Precompiled(path) => path,
            WasmSource::OwnedTemporary(temp_file) => temp_file.path(),
        }
    }

    pub fn plug_into(&self, other: &CompiledTest) -> anyhow::Result<CompiledTest> {
        let mut graph = CompositionGraph::new();
        let socket_package =
            Package::from_file("socket", None, other.wasm_path(), graph.types_mut())?;
        let socket_id = graph.register_package(socket_package)?;

        let plug_package = Package::from_file("plug", None, self.wasm_path(), graph.types_mut())?;
        let plug_id = graph.register_package(plug_package)?;

        plug(
            &mut graph,
            vec![(self.wasm_path().to_string(), plug_id)],
            socket_id,
        )?;

        let bytes = graph.encode(EncodeOptions::default())?;
        let mut wasm_path = NamedUtf8TempFile::new()?;
        wasm_path.write_all(bytes.as_slice())?;
        wasm_path.flush()?;
        Ok(CompiledTest {
            wasm: WasmSource::OwnedTemporary(wasm_path),
        })
    }
}

#[derive(Clone)]
struct Host {
    pub table: Arc<Mutex<ResourceTable>>,
    pub wasi: Arc<Mutex<WasiCtx>>,
    pub wasi_http: Arc<WasiHttpCtx>,
}

impl IoView for Host {
    fn table(&mut self) -> &mut ResourceTable {
        Arc::get_mut(&mut self.table)
            .expect("ResourceTable is shared and cannot be borrowed mutably")
            .get_mut()
            .expect("ResourceTable mutex must never fail")
    }
}

impl WasiView for Host {
    fn ctx(&mut self) -> &mut WasiCtx {
        Arc::get_mut(&mut self.wasi)
            .expect("WasiCtx is shared and cannot be borrowed mutably")
            .get_mut()
            .expect("WasiCtx mutex must never fail")
    }
}

impl WasiHttpView for Host {
    fn ctx(&mut self) -> &mut WasiHttpCtx {
        Arc::get_mut(&mut self.wasi_http)
            .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
    }
}

// Based on https://github.com/bytecodealliance/wac/blob/release-0.6.0/crates/wac-graph/src/plug.rs#L23
// but instead of returning NoPlugError, it logs skipped instantiations
fn plug(
    graph: &mut CompositionGraph,
    plugs: Vec<(String, PackageId)>,
    socket: PackageId,
) -> Result<(), PlugError> {
    let socket_instantiation = graph.instantiate(socket);

    let mut requested_plugs = BTreeSet::<String>::new();
    let mut plug_exports_to_plug = BTreeMap::<String, String>::new();

    for (plug_name, plug) in plugs {
        requested_plugs.insert(plug_name.clone());

        let mut plug_exports = Vec::new();
        let mut cache = Default::default();
        let mut checker = SubtypeChecker::new(&mut cache);
        for (name, plug_ty) in &graph.types()[graph[plug].ty()].exports {
            if let Some(socket_ty) = graph.types()[graph[socket].ty()].imports.get(name)
                && checker
                    .is_subtype(*plug_ty, graph.types(), *socket_ty, graph.types())
                    .is_ok()
            {
                plug_exports.push(name.clone());
            }
        }

        // Instantiate the plug component
        let mut plug_instantiation = None;
        for plug_export_name in plug_exports {
            plug_exports_to_plug.insert(plug_export_name.clone(), plug_name.clone());

            let plug_instantiation =
                *plug_instantiation.get_or_insert_with(|| graph.instantiate(plug));
            let export = graph
                .alias_instance_export(plug_instantiation, &plug_export_name)
                .map_err(|err| PlugError::GraphError { source: err.into() })?;
            graph
                .set_instantiation_argument(socket_instantiation, &plug_export_name, export)
                .map_err(|err| PlugError::GraphError { source: err.into() })?;
        }
    }

    // Export all exports from the socket component.
    for name in graph.types()[graph[socket].ty()]
        .exports
        .keys()
        .cloned()
        .collect::<Vec<_>>()
    {
        let export = graph
            .alias_instance_export(socket_instantiation, &name)
            .map_err(|err| PlugError::GraphError { source: err.into() })?;

        graph
            .export(export, &name)
            .map_err(|err| PlugError::GraphError { source: err.into() })?;
    }

    Ok(())
}
