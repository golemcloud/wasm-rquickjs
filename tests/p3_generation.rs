use camino::Utf8Path;
use camino::Utf8PathBuf;
use camino_tempfile::Utf8TempDir;
use indoc::indoc;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::process::Command;
use std::thread;
use std::time::{Duration, Instant};
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_dts, generate_wrapper_crate_with_target,
};

/// Starts a minimal single-threaded HTTP/1.1 test server on an ephemeral loopback port and
/// returns the bound port. The server runs on a detached background thread for the lifetime of
/// the test process and serves:
///   * `GET  /hello` -> `200` with body `hello-from-p3`
///   * `POST /echo`  -> `200` echoing the request body
///   * `GET  /redirect` -> `302` with `Location: /hello`
///   * `POST /redirect-307` -> `307` with `Location: /echo-method`
///   * `POST /bad-location-redirect` -> `302` with an invalid `Location` header
///   * `GET  /truncated-redirect` -> malformed `302` with `Content-Length` longer than body
///   * `GET  /legal` -> `451 Unavailable For Legal Reasons`
///   * `GET|POST /truncated` -> malformed response with `Content-Length` longer than body
///   * `POST /content-type` -> `200` with `<content-type-count>:<joined-values>`
///   * `POST /echo-method` -> `200` with `<method>:<body>`
///   * `<any> /method` -> `200` with the received request method as the body
///   * anything else -> `404`
fn spawn_test_http_server() -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").expect("failed to bind test HTTP server");
    let port = listener.local_addr().unwrap().port();

    thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(mut stream) = stream else { continue };

            // Read the request head (up to the blank line separating headers from the body).
            let mut buf = Vec::new();
            let mut chunk = [0u8; 1024];
            let header_end = loop {
                if let Some(pos) = find_subsequence(&buf, b"\r\n\r\n") {
                    break pos + 4;
                }
                match stream.read(&mut chunk) {
                    Ok(0) => break buf.len(),
                    Ok(n) => buf.extend_from_slice(&chunk[..n]),
                    Err(_) => break buf.len(),
                }
            };

            let head = String::from_utf8_lossy(&buf[..header_end.min(buf.len())]).to_string();
            let mut lines = head.split("\r\n");
            let request_line = lines.next().unwrap_or("");
            let mut parts = request_line.split_whitespace();
            let method = parts.next().unwrap_or("").to_string();
            let target = parts.next().unwrap_or("").to_string();

            let content_type_values = head
                .lines()
                .filter_map(|l| {
                    let (name, value) = l.split_once(':')?;
                    name.trim()
                        .eq_ignore_ascii_case("content-type")
                        .then(|| value.trim().to_string())
                })
                .collect::<Vec<_>>();

            let content_length = head
                .lines()
                .find_map(|l| {
                    let (name, value) = l.split_once(':')?;
                    name.trim()
                        .eq_ignore_ascii_case("content-length")
                        .then(|| value.trim().parse::<usize>().ok())
                        .flatten()
                })
                .unwrap_or(0);
            let is_chunked = head.lines().any(|l| {
                l.split_once(':').is_some_and(|(name, value)| {
                    name.trim().eq_ignore_ascii_case("transfer-encoding")
                        && value.to_ascii_lowercase().contains("chunked")
                })
            });

            // Read the remaining request body. `wasi:http` streams request bodies with
            // `Transfer-Encoding: chunked` (no known length), so decode chunked framing when
            // present and otherwise honor `Content-Length`.
            let mut raw = buf[header_end.min(buf.len())..].to_vec();
            let body = if is_chunked {
                loop {
                    if let Some(decoded) = decode_chunked(&raw) {
                        break decoded;
                    }
                    match stream.read(&mut chunk) {
                        Ok(0) => break decode_chunked(&raw).unwrap_or_default(),
                        Ok(n) => raw.extend_from_slice(&chunk[..n]),
                        Err(_) => break decode_chunked(&raw).unwrap_or_default(),
                    }
                }
            } else {
                while raw.len() < content_length {
                    match stream.read(&mut chunk) {
                        Ok(0) => break,
                        Ok(n) => raw.extend_from_slice(&chunk[..n]),
                        Err(_) => break,
                    }
                }
                raw
            };

            let response: Vec<u8> = match (method.as_str(), target.as_str()) {
                ("POST", "/echo") => http_response(200, "OK", "text/plain", &body),
                ("POST", "/echo-method") => http_response(
                    200,
                    "OK",
                    "text/plain",
                    format!("{method}:{}", String::from_utf8_lossy(&body)).as_bytes(),
                ),
                ("POST", "/content-type") => http_response(
                    200,
                    "OK",
                    "text/plain",
                    format!(
                        "{}:{}",
                        content_type_values.len(),
                        content_type_values.join("|")
                    )
                    .as_bytes(),
                ),
                (_, "/method") => http_response(200, "OK", "text/plain", method.as_bytes()),
                ("GET", "/hello") => http_response(200, "OK", "text/plain", b"hello-from-p3"),
                ("POST", "/bad-location-redirect") => {
                    b"HTTP/1.1 302 Found\r\nLocation: http://[\r\nContent-Type: text/plain\r\nContent-Length: 17\r\n\r\nbad-location-body"
                        .to_vec()
                }
                ("GET", "/legal") => http_response(
                    451,
                    "Unavailable For Legal Reasons",
                    "text/plain",
                    b"blocked",
                ),
                ("GET", "/truncated") | ("POST", "/truncated") => {
                    b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 10\r\n\r\nshort"
                        .to_vec()
                }
                ("GET", "/truncated-redirect") => {
                    b"HTTP/1.1 302 Found\r\nLocation: /hello\r\nContent-Type: text/plain\r\nContent-Length: 10\r\n\r\nshort"
                        .to_vec()
                }
                ("GET", "/redirect") => {
                    b"HTTP/1.1 302 Found\r\nLocation: /hello\r\nContent-Length: 0\r\n\r\n".to_vec()
                }
                ("POST", "/redirect-307") => {
                    b"HTTP/1.1 307 Temporary Redirect\r\nLocation: /echo-method\r\nContent-Length: 0\r\n\r\n"
                        .to_vec()
                }
                _ => http_response(404, "Not Found", "text/plain", b"not found"),
            };

            let _ = stream.write_all(&response);
            let _ = stream.flush();
        }
    });

    port
}

fn http_response(status: u16, reason: &str, content_type: &str, body: &[u8]) -> Vec<u8> {
    let mut out = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\n\r\n",
        body.len()
    )
    .into_bytes();
    out.extend_from_slice(body);
    out
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

/// Decodes an HTTP/1.1 `Transfer-Encoding: chunked` body. Returns `Some(bytes)` once the
/// terminating zero-length chunk has been fully received, or `None` if more bytes are still
/// needed (so the caller keeps reading from the socket).
fn decode_chunked(raw: &[u8]) -> Option<Vec<u8>> {
    let mut out = Vec::new();
    let mut rest = raw;
    loop {
        let line_end = find_subsequence(rest, b"\r\n")?;
        let size_line = std::str::from_utf8(&rest[..line_end]).ok()?;
        // Chunk size may carry extensions after a ';'; ignore them.
        let size_hex = size_line.split(';').next().unwrap_or("").trim();
        let size = usize::from_str_radix(size_hex, 16).ok()?;
        rest = &rest[line_end + 2..];
        if size == 0 {
            // Final chunk; a trailing CRLF (and optional trailers) follows but we don't need it.
            return Some(out);
        }
        if rest.len() < size + 2 {
            return None; // Need more bytes for the chunk data + trailing CRLF.
        }
        out.extend_from_slice(&rest[..size]);
        rest = &rest[size + 2..];
    }
}

/// Starts a test server whose `POST /slow-redirect` responds with a `302` to `/hello` but then
/// stalls the (discarded) redirect response body for `delay` before closing the connection.
///
/// Each accepted connection is handled on its own thread so the `GET /hello` follow-up can be
/// served immediately while the slow redirect connection is still lingering. This is what lets the
/// test distinguish "followed the redirect promptly" (correct: does not read the discarded body)
/// from "waited for the discarded redirect body" (bug).
fn spawn_slow_streaming_redirect_server(delay: Duration) -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").expect("failed to bind test HTTP server");
    let port = listener.local_addr().unwrap().port();

    thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(mut stream) = stream else { continue };

            thread::spawn(move || {
                let mut buf = Vec::new();
                let mut chunk = [0u8; 1024];
                let header_end = loop {
                    if let Some(pos) = find_subsequence(&buf, b"\r\n\r\n") {
                        break pos + 4;
                    }
                    match stream.read(&mut chunk) {
                        Ok(0) => break buf.len(),
                        Ok(n) => buf.extend_from_slice(&chunk[..n]),
                        Err(_) => break buf.len(),
                    }
                };

                let head = String::from_utf8_lossy(&buf[..header_end.min(buf.len())]).to_string();
                let mut lines = head.split("\r\n");
                let request_line = lines.next().unwrap_or("");
                let mut parts = request_line.split_whitespace();
                let method = parts.next().unwrap_or("");
                let target = parts.next().unwrap_or("");

                match (method, target) {
                    ("POST", "/slow-redirect") => {
                        let _ = stream.write_all(
                            b"HTTP/1.1 302 Found\r\nLocation: /hello\r\nContent-Type: text/plain\r\nContent-Length: 100000000\r\n\r\npartial",
                        );
                        let _ = stream.flush();
                        thread::sleep(delay);
                    }
                    ("GET", "/hello") => {
                        let _ = stream.write_all(&http_response(
                            200,
                            "OK",
                            "text/plain",
                            b"hello-after-slow-redirect",
                        ));
                        let _ = stream.flush();
                    }
                    _ => {
                        let _ = stream.write_all(&http_response(
                            404,
                            "Not Found",
                            "text/plain",
                            b"not found",
                        ));
                        let _ = stream.flush();
                    }
                }
            });
        }
    });

    port
}

fn write_fixture(root: &Utf8Path, wit: &str, js: &str) -> anyhow::Result<()> {
    let wit_dir = root.join("wit");
    let src_dir = root.join("src");
    std::fs::create_dir_all(&wit_dir)?;
    std::fs::create_dir_all(&src_dir)?;
    std::fs::write(wit_dir.join("world.wit"), wit)?;
    std::fs::write(src_dir.join("module.js"), js)?;
    Ok(())
}

fn write_wit_dep(root: &Utf8Path, name: &str, wit: &str) -> anyhow::Result<()> {
    let deps_dir = root.join("wit").join("deps");
    std::fs::create_dir_all(&deps_dir)?;
    std::fs::write(deps_dir.join(name), wit)?;
    Ok(())
}

fn generate_p3(root: &Utf8Path) -> anyhow::Result<()> {
    generate_wrapper_crate_with_target(
        &root.join("wit"),
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(root.join("src").join("module.js")),
        }],
        &root.join("out"),
        None,
        GenerationTarget::WasiP3,
    )
}

fn build_p3(root: &Utf8Path, wasm_name: &str) -> anyhow::Result<Utf8PathBuf> {
    build_p3_with_features(root, wasm_name, None)
}

/// Builds a generated P3 crate, optionally overriding its default feature set. Passing
/// `features = Some("full-p3")` compiles the heavier capability tier (sqlite, brotli,
/// crypto-full, timezone) that is intentionally left out of the default `normal-p3` tier.
fn build_p3_with_features(
    root: &Utf8Path,
    wasm_name: &str,
    features: Option<&str>,
) -> anyhow::Result<Utf8PathBuf> {
    let mut build_cmd = Command::new("cargo");
    build_cmd
        .arg("build")
        .arg("--manifest-path")
        .arg(root.join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2");
    if let Some(features) = features {
        build_cmd
            .arg("--no-default-features")
            .arg("--features")
            .arg(features);
    }
    let build = build_cmd.output()?;

    assert!(
        build.status.success(),
        "P3 generated crate should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );

    let metadata = Command::new("cargo")
        .arg("metadata")
        .arg("--no-deps")
        .arg("--format-version")
        .arg("1")
        .arg("--manifest-path")
        .arg(root.join("out").join("Cargo.toml"))
        .output()?;
    assert!(
        metadata.status.success(),
        "cargo metadata should succeed; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&metadata.stdout),
        String::from_utf8_lossy(&metadata.stderr)
    );
    let metadata: serde_json::Value = serde_json::from_slice(&metadata.stdout)?;
    let target_dir = metadata["target_directory"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("missing target_directory in cargo metadata"))?;

    Ok(Utf8PathBuf::from(target_dir)
        .join("wasm32-wasip2")
        .join("debug")
        .join(format!("{wasm_name}.wasm")))
}

fn run_p3_string_export(wasm_path: &Utf8Path, export: &str) -> anyhow::Result<String> {
    let output = Command::new("wasmtime")
        .arg("run")
        .arg("-S")
        .arg("p3=y")
        // The default `normal-p3` tier wires the `fetch`/HTTP builtins, so every generated P3
        // component imports `wasi:http`. `-S http=y` provides that host implementation; it is
        // harmless for components that never make a request.
        .arg("-S")
        .arg("http=y")
        .arg("--wasm")
        .arg("component-model=y")
        .arg("--wasm")
        .arg("component-model-async=y")
        .arg("--invoke")
        .arg(format!("{export}()"))
        .arg(wasm_path)
        .output()?;

    assert!(
        output.status.success(),
        "P3 component invocation should succeed; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(stdout.trim()).map_err(Into::into)
}

fn run_p3_string_export_with_dir(
    wasm_path: &Utf8Path,
    export: &str,
    host_dir: &Utf8Path,
    guest_dir: &str,
) -> anyhow::Result<String> {
    let output = Command::new("wasmtime")
        .arg("run")
        .arg("-S")
        .arg("p3=y")
        .arg("-S")
        .arg("http=y")
        .arg("--wasm")
        .arg("component-model=y")
        .arg("--wasm")
        .arg("component-model-async=y")
        .arg("--dir")
        .arg(format!("{host_dir}::{guest_dir}"))
        .arg("--invoke")
        .arg(format!("{export}()"))
        .arg(wasm_path)
        .output()?;

    assert!(
        output.status.success(),
        "P3 component invocation should succeed; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(stdout.trim()).map_err(Into::into)
}

#[test]
fn p3_rejects_sync_wizer_initialize_export_from_input_wit() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:wizer;

            world wizer {
              export wizer-initialize: func();
            }
        "#},
        "",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject synchronous exports even when the export is named wizer-initialize"
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_wasi_system_clock_import() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:clock;

            world clock {
              import wasi:clocks/system-clock@0.3.0-rc-2026-03-15;
              export run: async func() -> u64;
            }
        "#},
        "export async function run() { return 1n; }\n",
    )?;
    write_wit_dep(
        temp.path(),
        "clocks.wit",
        indoc! {r#"
            package wasi:clocks@0.3.0-rc-2026-03-15;

            interface types {
              type duration = u64;
            }

            interface system-clock {
              use types.{duration};

              record instant {
                seconds: s64,
                nanoseconds: u32,
              }

              now: func() -> instant;
              get-resolution: func() -> duration;
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let output = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        output.status.success(),
        "P3 generated crate with a wasi:clocks/system-clock import should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_async_result_export() -> anyhow::Result<()> {
    // An async export returning `result<T, E>`. Per the documented contract a result-returning
    // JS function returns the bare `ok` value or `throw`s for the `err` arm (the `{ tag, val }`
    // shape is only used for results received as inputs/data, not for result *return* values).
    // This locks in that the P3 result-export glue (`JsResult` + `call_js_export_returning_result`)
    // generates a crate that compiles. The ok/err runtime behavior is validated by the
    // `examples/p3/async-result` host-runner harness.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:result-export;

            world result-export {
              export run: async func(flag: bool) -> result<u32, string>;
            }
        "#},
        indoc! {r#"
            export async function run(flag) {
              if (flag) {
                return 7;
              }
              throw "nope";
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let build = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        build.status.success(),
        "P3 generated crate with an async result export should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_node_builtin_imports() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-builtins;

            world p3-builtins {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { Buffer } from 'node:buffer';
            import process from 'node:process';
            import path from 'node:path';

            export async function run() {
              return `${Buffer.from('p3').toString('utf8')}:${process.platform}:${path.join('a', 'b')}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let build = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        build.status.success(),
        "P3 generated crate with Node.js builtin imports should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );
    Ok(())
}

#[test]
fn p3_fs_named_imports_are_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fs-named;

            world p3-fs-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { readFile } from 'node:fs';

            export async function run() {
              return typeof readFile;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fs_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function");
    Ok(())
}

#[test]
fn p3_fs_read_write_roundtrip_on_wasi_p3() -> anyhow::Result<()> {
    // Strong functional check that node:fs actually *executes* on the Preview 3 path
    // (native filesystem calls driven through `block_on`), not merely that the named
    // exports are importable. A regression back to throwing "not available" stubs would
    // fail here even though the `typeof`-only smoke tests above would still pass.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fs-rw;

            world p3-fs-rw {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';

            export async function run() {
              mkdirSync('/data/sub', { recursive: true });
              writeFileSync('/data/sub/hello.txt', 'p3-fs-works');
              const back = readFileSync('/data/sub/hello.txt', 'utf8');
              const listed = readdirSync('/data/sub').join(',');
              const ex = existsSync('/data/sub/hello.txt');
              return `${back}|${listed}|${ex}`;
            }
        "#},
    )?;

    let data_dir = temp.path().join("data");
    std::fs::create_dir_all(&data_dir)?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fs_rw")?;
    let result = run_p3_string_export_with_dir(&wasm_path, "run", &data_dir, "/data")?;

    assert_eq!(result, "p3-fs-works|hello.txt|true");
    // Confirm the write really hit the host filesystem through the P3 filesystem bindings.
    let written = std::fs::read_to_string(data_dir.join("sub").join("hello.txt"))?;
    assert_eq!(written, "p3-fs-works");
    Ok(())
}

#[test]
fn p3_fs_dirent_named_import_is_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fs-dirent-named;

            world p3-fs-dirent-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { Dirent } from 'node:fs';

            export async function run() {
              return typeof Dirent;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fs_dirent_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function");
    Ok(())
}

#[test]
fn p3_net_named_imports_are_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-net-named;

            world p3-net-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { createConnection, Socket } from 'node:net';

            export async function run() {
              return `${typeof createConnection}:${typeof Socket}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_net_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function:function");
    Ok(())
}

#[test]
fn p3_dgram_named_import_is_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-dgram-named;

            world p3-dgram-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { createSocket } from 'node:dgram';

            export async function run() {
              return typeof createSocket;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_dgram_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function");
    Ok(())
}

#[test]
fn p3_dns_named_imports_are_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-dns-named;

            world p3-dns-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { lookup, promises } from 'node:dns';
            import { resolve4 } from 'node:dns/promises';

            export async function run() {
              return `${typeof lookup}:${typeof promises}:${typeof resolve4}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_dns_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function:object:function");
    Ok(())
}

#[test]
fn p3_dns_promises_default_matches_dns_promises_object() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-dns-promises-identity;

            world p3-dns-promises-identity {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import dnsPromises from 'node:dns/promises';
            import { promises } from 'node:dns';

            export async function run() {
              return String(dnsPromises === promises);
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_dns_promises_identity")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "true");
    Ok(())
}

#[test]
fn p3_set_timeout_resolves_promise_on_wasi_p3() -> anyhow::Result<()> {
    // Proves that the Preview 3 async spine actually *drives* rquickjs background tasks:
    // `setTimeout` schedules a Rust future via `ctx.spawn` that awaits
    // `wasip3::clocks::monotonic_clock::wait_for`. If the spawned future were never polled
    // (e.g. because the P3 executor did not wake rquickjs tasks), this `run()` would hang and
    // the invocation would time out instead of returning the resolved value.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-set-timeout;

            world p3-set-timeout {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            export async function run() {
              return await new Promise((resolve) => {
                setTimeout(() => resolve('timer-ok'), 1);
              });
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_set_timeout")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "timer-ok");
    Ok(())
}

#[test]
fn p3_crypto_sha256_matches_known_digest_on_wasi_p3() -> anyhow::Result<()> {
    // The default `normal-p3` tier enables the real `crypto` capability, so `node:crypto`
    // must expose the full hashing surface. The `web_crypto_lite` fallback only provides
    // randomness and has no `createHash`, so computing the well-known SHA-256 digest of "abc"
    // proves the native hash bridge is actually wired and functional on the Preview 3 path.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-crypto-sha256;

            world p3-crypto-sha256 {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { createHash } from 'node:crypto';

            export async function run() {
              return createHash('sha256').update('abc').digest('hex');
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_crypto_sha256")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(
        result,
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    Ok(())
}

#[test]
fn p3_zlib_gzip_roundtrip_on_wasi_p3() -> anyhow::Result<()> {
    // The default `normal-p3` tier enables the real `zlib` capability. The `zlib_disabled`
    // fallback throws for every operation, so a gzip -> gunzip roundtrip that recovers the
    // original text proves the native flate2 bridge is actually wired on the Preview 3 path.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-zlib-roundtrip;

            world p3-zlib-roundtrip {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { Buffer } from 'node:buffer';
            import { gzipSync, gunzipSync } from 'node:zlib';

            export async function run() {
              const original = 'hello zlib on preview 3';
              const restored = gunzipSync(gzipSync(Buffer.from(original))).toString();
              return restored;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_zlib_roundtrip")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "hello zlib on preview 3");
    Ok(())
}

#[test]
fn p3_sqlite_roundtrip_on_wasi_p3() -> anyhow::Result<()> {
    // `sqlite` is intentionally kept out of the default `normal-p3` tier (it pulls in the
    // heavier rusqlite dependency), so this builds the generated crate with the `full-p3`
    // tier instead. An in-memory create/insert/select roundtrip proves the real rusqlite
    // bridge is wired and functional on the Preview 3 path rather than the throwing
    // `sqlite_disabled` stub.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-sqlite-roundtrip;

            world p3-sqlite-roundtrip {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { DatabaseSync } from 'node:sqlite';

            export async function run() {
              const db = new DatabaseSync(':memory:');
              db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
              const insert = db.prepare('INSERT INTO t (name) VALUES (?)');
              insert.run('alice');
              insert.run('bob');
              const rows = db.prepare('SELECT name FROM t ORDER BY id').all();
              db.close();
              return rows.map((r) => r.name).join(',');
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3_with_features(temp.path(), "p3_sqlite_roundtrip", Some("full-p3"))?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "alice,bob");
    Ok(())
}

#[test]
fn p3_websocket_builds_on_wasi_p3() -> anyhow::Result<()> {
    // `websocket` is an opt-in capability (like `logging`) intentionally kept out of the default
    // `normal-p3` and `full-p3` tiers because enabling it adds a required `golem:websocket/client`
    // host import that plain WASI hosts (including the wasmtime CLI used here) cannot satisfy. It
    // uses the fully synchronous `golem:websocket@1.5.0` interface, which is Preview 3-portable.
    // There is no `golem:websocket` host in this harness, so this is a build-only check that the
    // websocket builtin compiles and links into a Preview 3 crate (the `WebSocket`/`WebSocketStream`
    // globals it installs are exercised by the P2 runtime tests / a Golem host, not here).
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-websocket;

            world p3-websocket {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            export async function run() {
              return `${typeof WebSocket},${typeof WebSocketStream}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    // Build only: enabling `websocket` adds an unsatisfiable `golem:websocket` import under the
    // wasmtime CLI, so we assert compilation/linking succeeds rather than invoking the component.
    let _wasm_path =
        build_p3_with_features(temp.path(), "p3_websocket", Some("normal-p3,websocket"))?;
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_exported_resource() -> anyhow::Result<()> {
    // An *exported* WIT resource on the Preview 3 path (Phase 4). It exercises every method shape:
    // a synchronous constructor, synchronous instance/static methods (plain `fn`s driven by
    // `block_on`), and `async func` instance/static methods (`async fn`s awaiting the JS Promise).
    // This locks in that the P3 exported-resource glue generates a crate that compiles. The
    // end-to-end runtime behavior (constructor / method / static / async / drop) is validated by
    // the `tests/p3_exported_resource.rs` harness.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:exported-resource;

            interface api {
              resource counter {
                constructor(initial: u32);
                increment: func(by: u32) -> u32;
                get: func() -> u32;
                %static-zero: static func() -> u32;
                increment-async: async func(by: u32) -> u32;
                make-async: static async func(initial: u32) -> u32;
              }
            }

            world exported-resource {
              export api;
            }
        "#},
        indoc! {r#"
            class Counter {
              constructor(initial) {
                this.value = initial;
              }
              increment(by) {
                this.value += by;
                return this.value;
              }
              get() {
                return this.value;
              }
              static staticZero() {
                return 0;
              }
              async incrementAsync(by) {
                await Promise.resolve();
                this.value += by;
                return this.value;
              }
              static async makeAsync(initial) {
                await Promise.resolve();
                return initial;
              }
            }

            export const api = {
              Counter,
            };
        "#},
    )?;

    generate_p3(temp.path())?;
    let _wasm_path = build_p3(temp.path(), "exported_resource")?;
    Ok(())
}

#[test]
fn p3_rejects_methodless_exported_resource() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-resource;

            interface api {
              resource r;
            }

            world methodless-resource {
              export api;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject exported resources even when the resource has no functions"
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_exported_resource_alias() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-resource-alias;

            interface resources {
              resource r;
            }

            interface api {
              use resources.{r};
            }

            world methodless-resource-alias {
              export api;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject exported resources even when the exported interface re-exports the resource through a type alias"
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_world_level_resource() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-world-resource;

            world methodless-world-resource {
              resource r;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject resources declared directly in the world even when the resource has no functions"
    );
    Ok(())
}

#[test]
fn p3_rejects_world_level_imported_resource() -> anyhow::Result<()> {
    // A resource declared directly in the world (rather than inside an interface) is only usable
    // through functions imported directly into the world. Those are a documented limitation
    // ("only whole interfaces" are supported for imports): they would land in the synthetic
    // global import module, which is never registered with QuickJS's module resolver/loader.
    // The Preview 3 path must reject this instead of emitting a crate that fails to compile.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:world-resource;

            world world-resource {
              resource r;

              import make: func() -> r;
              import take: func(x: r);
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject resources imported directly into the world"
    );
    Ok(())
}

#[test]
fn p3_rejects_world_level_freestanding_import() -> anyhow::Result<()> {
    // Functions imported directly into the world (not through an interface) are a documented
    // limitation ("only whole interfaces" are supported for imports). On the Preview 3 path such
    // an import would build but trap at runtime ("Error resolving module ...") because the global
    // import module is never registered with QuickJS, so generation must reject it up front.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:async-import-runtime;

            world async-import-runtime {
              import get-number: async func() -> u32;
              export run: async func() -> u32;
            }
        "#},
        indoc! {r#"
            import { getNumber } from 'async-import-runtime';

            export async function run() {
              return await getNumber();
            }
        "#},
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject functions imported directly into the world"
    );
    Ok(())
}

#[test]
fn p3_fetch_get_returns_body_on_wasi_p3() -> anyhow::Result<()> {
    // Strong functional check that `fetch`/HTTP actually *executes* on the Preview 3 path: the
    // request is driven through `wasip3::http::client::send` (Component Model async bodies), not
    // through P2 pollables. A regression back to the `http_disabled` stub (which throws for every
    // call) would fail this test.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-get;

            world p3-fetch-get {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const res = await fetch('http://127.0.0.1:__PORT__/hello');
              const text = await res.text();
              return `${res.status}:${text}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_get")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:hello-from-p3");
    Ok(())
}

#[test]
fn p3_fetch_post_echoes_body_on_wasi_p3() -> anyhow::Result<()> {
    // Validates buffered *request* bodies on the Preview 3 path: the POST body is streamed to the
    // server through the async `stream<u8>` request body, and the server echoes it back.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-post;

            world p3-fetch-post {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const res = await fetch('http://127.0.0.1:__PORT__/echo', {
                method: 'POST',
                body: 'ping-p3',
              });
              const text = await res.text();
              return `${res.status}:${text}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_post")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:ping-p3");
    Ok(())
}

#[test]
fn p3_fetch_follows_redirect_on_wasi_p3() -> anyhow::Result<()> {
    // Validates the redirect-following logic in `http_p3.rs`: `GET /redirect` returns a 302 to
    // `/hello`, and the default `redirect: 'follow'` policy must transparently follow it and
    // surface `redirected === true` plus the final body.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-redirect;

            world p3-fetch-redirect {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const res = await fetch('http://127.0.0.1:__PORT__/redirect');
              const text = await res.text();
              return `${res.status}:${res.redirected}:${text}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_redirect")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:true:hello-from-p3");
    Ok(())
}

#[test]
fn p3_fetch_manual_redirect_returns_opaqueredirect_filtered_response() -> anyhow::Result<()> {
    // Fetch's manual redirect mode returns an opaque-redirect filtered response: status/statusText,
    // headers, and body are hidden from JavaScript, and the response type is `opaqueredirect`.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-manual-redirect;

            world p3-fetch-manual-redirect {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const res = await fetch('http://127.0.0.1:__PORT__/redirect', {
                redirect: 'manual',
              });
              return `${res.status}:${res.statusText}:${res.type}:${res.headers.get('location')}:${await res.text()}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_manual_redirect")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "0::opaqueredirect:null:");
    Ok(())
}

#[test]
fn p3_request_clone_preserves_replayable_body_without_disturbing_original() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-request-clone-body;

            world p3-request-clone-body {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            export async function run() {
              const req = new Request('http://example.com/echo', {
                method: 'POST',
                body: 'clone-body',
              });

              try {
                const clone = req.clone();
                return `not-thrown:${clone.method}:${await clone.text()}:originalUsed=${req.bodyUsed}`;
              } catch (err) {
                return `thrown:${String(err && (err.message || err))}:originalUsed=${req.bodyUsed}`;
              }
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_request_clone_body")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "not-thrown:POST:clone-body:originalUsed=false");
    Ok(())
}

#[test]
fn p3_fetch_rejects_invalid_http_version() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-invalid-version;

            world p3-fetch-invalid-version {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              try {
                const res = await fetch('http://127.0.0.1:__PORT__/hello', {
                  version: 'HTTP/9.9',
                });
                return `not-thrown:${res.status}:${await res.text()}`;
              } catch (err) {
                return String(err && (err.message || err));
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_invalid_version")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert!(
        result.contains("Unsupported HTTP version: HTTP/9.9"),
        "invalid HTTP version should be rejected before sending; got {result:?}"
    );
    Ok(())
}

#[test]
fn p3_fetch_rejects_invalid_header_value() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-invalid-header-value;

            world p3-fetch-invalid-header-value {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              try {
                const res = await fetch('http://127.0.0.1:__PORT__/hello', {
                  headers: { 'x-bad': 'a\r\nb' },
                });
                return `not-thrown:${res.status}:${await res.text()}`;
              } catch (err) {
                return String(err && (err.message || err));
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_invalid_header_value")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert!(
        result.contains("failed to parse header value"),
        "invalid header value should be rejected before sending; got {result:?}"
    );
    Ok(())
}

#[test]
fn p3_http_request_rejects_invalid_method_like_p2_constructor() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-invalid-method;

            world p3-fetch-invalid-method {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { HttpRequest } from '__wasm_rquickjs_builtin/http_native';

            export async function run() {
              try {
                new HttpRequest(
                  'http://example.com/hello',
                  'bad method',
                  {},
                  'HTTP/1.1',
                  'cors',
                  'about:client',
                  'strict-origin-when-cross-origin',
                  'same-origin',
                  'follow',
                );
                return 'not-thrown';
              } catch (err) {
                return String(err && (err.message || err));
              }
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_invalid_method")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert!(
        result.contains("failed to parse method"),
        "invalid method syntax should be rejected by the native request constructor like P2; got {result:?}"
    );
    Ok(())
}

#[test]
fn p3_http_request_preserves_custom_method_case_like_p2_constructor() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-custom-method-case;

            world p3-fetch-custom-method-case {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            import { HttpRequest } from '__wasm_rquickjs_builtin/http_native';

            export async function run() {
              const request = new HttpRequest(
                'http://127.0.0.1:__PORT__/method',
                'foo',
                {},
                'HTTP/1.1',
                'cors',
                'about:client',
                'strict-origin-when-cross-origin',
                'same-origin',
                'follow',
              );
              const res = await request.simpleSend();
              return await res.text();
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_custom_method_case")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "foo");
    Ok(())
}

#[test]
fn p3_fetch_status_text_uses_canonical_reason() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-status-text;

            world p3-fetch-status-text {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const res = await fetch('http://127.0.0.1:__PORT__/legal');
              return `${res.status}:${res.statusText}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_status_text")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "451:Unavailable For Legal Reasons");
    Ok(())
}

#[test]
fn p3_fetch_rejects_truncated_response_body() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-truncated-body;

            world p3-fetch-truncated-body {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              try {
                const res = await fetch('http://127.0.0.1:__PORT__/truncated');
                return `not-thrown:${res.status}:${await res.text()}`;
              } catch (err) {
                return `thrown:${String(err && (err.message || err))}`;
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_truncated_body")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert!(
        result.starts_with("thrown:"),
        "fetch should reject instead of returning a partial response body; got {result:?}"
    );
    Ok(())
}

#[test]
fn p3_fetch_follows_redirect_even_when_redirect_body_is_truncated() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-truncated-redirect-body;

            world p3-fetch-truncated-redirect-body {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              try {
                const res = await fetch('http://127.0.0.1:__PORT__/truncated-redirect');
                return `${res.status}:${res.redirected}:${await res.text()}`;
              } catch (err) {
                return `thrown:${String(err && (err.message || err))}`;
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_truncated_redirect_body")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:true:hello-from-p3");
    Ok(())
}

#[test]
fn p3_response_json_invalid_status_matches_p2_fallback() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-response-json-invalid-status;

            world p3-response-json-invalid-status {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            export async function run() {
              const res = Response.json({ ok: true }, { status: 42 });
              return `${res.status}:${res.statusText}:${await res.text()}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_response_json_invalid_status")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:OK:{\"ok\":true}");
    Ok(())
}

#[test]
fn p3_url_search_params_body_replaces_existing_content_type() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-url-search-params-content-type;

            world p3-url-search-params-content-type {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const res = await fetch('http://127.0.0.1:__PORT__/content-type', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: new URLSearchParams([['a', 'b']]),
              });
              return await res.text();
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_url_search_params_content_type")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "1:application/x-www-form-urlencoded");
    Ok(())
}

#[test]
fn p3_fetch_streams_readable_stream_request_body_on_wasi_p3() -> anyhow::Result<()> {
    // Validates *streaming* request bodies on the Preview 3 path: a `ReadableStream` POST body is
    // uploaded chunk-by-chunk through the Component Model `stream<u8>` request body while the
    // `wasi:http/client.send` future is in flight, and the server echoes the concatenated body.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-body;

            world p3-fetch-stream-body {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const chunks = ['strea', 'ming-', 'p3-', 'upload'];
              const body = new ReadableStream({
                start(controller) {
                  const enc = new TextEncoder();
                  for (const c of chunks) {
                    controller.enqueue(enc.encode(c));
                  }
                  controller.close();
                },
              });
              const res = await fetch('http://127.0.0.1:__PORT__/echo', {
                method: 'POST',
                body,
                duplex: 'half',
              });
              const text = await res.text();
              return `${res.status}:${text}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_body")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:streaming-p3-upload");
    Ok(())
}

#[test]
fn p3_fetch_streams_large_readable_stream_request_body_on_wasi_p3() -> anyhow::Result<()> {
    // Validates that a large streamed request body (many chunks, larger than a single stream
    // write) is uploaded and echoed back intact, exercising the write loop / backpressure.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-body-large;

            world p3-fetch-stream-body-large {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const chunkCount = 64;
              const chunkSize = 1024;
              const body = new ReadableStream({
                start(controller) {
                  for (let i = 0; i < chunkCount; i++) {
                    const chunk = new Uint8Array(chunkSize);
                    chunk.fill(65 + (i % 26));
                    controller.enqueue(chunk);
                  }
                  controller.close();
                },
              });
              const res = await fetch('http://127.0.0.1:__PORT__/echo', {
                method: 'POST',
                body,
                duplex: 'half',
              });
              const buf = await res.arrayBuffer();
              return `${res.status}:${buf.byteLength}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_body_large")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "200:65536");
    Ok(())
}

#[test]
fn p3_streaming_fetch_invalid_redirect_location_matches_buffered_path() -> anyhow::Result<()> {
    // A malformed Location cannot be followed. The buffered P3 path falls back to returning the
    // 302 response as the final visible response; the public fetch result must not depend on
    // whether the request body is buffered or a ReadableStream.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-invalid-redirect-location;

            world p3-fetch-stream-invalid-redirect-location {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const url = 'http://127.0.0.1:__PORT__/bad-location-redirect';

              const buffered = await fetch(url, { method: 'POST', body: 'buffered' });
              const bufferedResult = `${buffered.status}:${await buffered.text()}`;

              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('streamed'));
                  controller.close();
                },
              });
              try {
                const streamed = await fetch(url, {
                  method: 'POST',
                  body,
                  duplex: 'half',
                });
                return `buffered=${bufferedResult};streaming=${streamed.status}:${await streamed.text()}`;
              } catch (err) {
                return `buffered=${bufferedResult};streaming=thrown:${String(err && (err.message || err))}`;
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_invalid_redirect_location")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(
        result,
        "buffered=302:bad-location-body;streaming=302:bad-location-body"
    );
    Ok(())
}

#[test]
fn p3_streaming_fetch_stream_body_307_redirect_fails_per_fetch_spec() -> anyhow::Result<()> {
    // A 307 redirect preserves the original method and request body. A *buffered* body has a
    // replayable source, so buffered fetch re-sends it and succeeds. A *streaming* (ReadableStream)
    // body has a null source and per the Fetch standard's HTTP-redirect fetch ("If ... status is
    // not 303, request's body is non-null, and request's body's source is null, then return a
    // network error") cannot be replayed, so streaming fetch must fail. This spec-mandated
    // divergence is the correct behavior; the two paths are NOT expected to match here.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-307-redirect;

            world p3-fetch-stream-307-redirect {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const url = 'http://127.0.0.1:__PORT__/redirect-307';

              const buffered = await fetch(url, { method: 'POST', body: 'redirect-body' });
              const bufferedResult = `${buffered.status}:${buffered.redirected}:${await buffered.text()}`;

              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('redirect-body'));
                  controller.close();
                },
              });
              try {
                const streamed = await fetch(url, {
                  method: 'POST',
                  body,
                  duplex: 'half',
                });
                return `buffered=${bufferedResult};streaming=${streamed.status}:${streamed.redirected}:${await streamed.text()}`;
              } catch (err) {
                return `buffered=${bufferedResult};streaming=thrown:${String(err && (err.message || err))}`;
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_307_redirect")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    // The buffered arm replays its body and succeeds; the streaming arm must fail (network error)
    // because a ReadableStream body has no replayable source.
    assert!(
        result.starts_with("buffered=200:true:POST:redirect-body;streaming=thrown:"),
        "buffered fetch should replay the body across 307 while streaming fetch fails; got {result:?}"
    );
    assert!(
        result.contains("streaming=thrown:")
            && result.contains(
                "streaming request body cannot be resent across a body-preserving redirect"
            ),
        "streaming fetch should fail with the spec-mandated network error for a stream body across a 307; got {result:?}"
    );
    Ok(())
}

#[test]
fn p3_streaming_fetch_no_cors_response_is_opaque() -> anyhow::Result<()> {
    // The public fetch contract should not depend on whether the request body is buffered or a
    // ReadableStream. Buffered P3 fetch makes no-cors responses opaque in native simple_send; the
    // streaming path must do the same instead of exposing status/body/headers.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-no-cors-opaque;

            world p3-fetch-stream-no-cors-opaque {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('visible-if-not-opaque'));
                  controller.close();
                },
              });
              const res = await fetch('http://127.0.0.1:__PORT__/echo', {
                method: 'POST',
                mode: 'no-cors',
                body,
                duplex: 'half',
              });
              const text = await res.text();
              return `${res.status}:${res.type}:${text}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_no_cors_opaque")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "0:opaque:");
    Ok(())
}

#[test]
fn p3_streaming_fetch_no_cors_rejects_unsafe_method() -> anyhow::Result<()> {
    // Buffered P3 fetch enforces no-cors method restrictions before sending. A ReadableStream body
    // takes a separate streaming path and must reject the same public fetch input instead of
    // issuing the unsafe method.
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-no-cors-method;

            world p3-fetch-stream-no-cors-method {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('body'));
                  controller.close();
                },
              });
              try {
                const res = await fetch('http://127.0.0.1:__PORT__/method', {
                  method: 'PUT',
                  mode: 'no-cors',
                  body,
                  duplex: 'half',
                });
                return `not-thrown:${res.status}:${await res.text()}`;
              } catch (err) {
                return `thrown:${String(err && (err.message || err))}`;
              }
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_no_cors_method")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert!(
        result.contains("thrown:no-cors mode only allows GET, HEAD, or POST methods"),
        "streaming no-cors fetch should reject unsafe methods before sending; got {result:?}"
    );
    Ok(())
}

#[test]
fn p3_streaming_redirect_does_not_wait_for_redirect_response_body() -> anyhow::Result<()> {
    // The shared streaming redirect loop must be able to inspect a 302 response head and follow it
    // without waiting for the discarded redirect response body. A slow or never-ending redirect
    // body is not observable to JS and must not delay redirect handling.
    let port = spawn_slow_streaming_redirect_server(Duration::from_secs(5));
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-slow-redirect-body;

            world p3-fetch-stream-slow-redirect-body {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('streamed-upload'));
                  controller.close();
                },
              });
              const res = await fetch('http://127.0.0.1:__PORT__/slow-redirect', {
                method: 'POST',
                body,
                duplex: 'half',
              });
              return `${res.status}:${res.redirected}:${await res.text()}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_slow_redirect_body")?;

    let started = Instant::now();
    let result = run_p3_string_export(&wasm_path, "run")?;
    let elapsed = started.elapsed();

    assert_eq!(result, "200:true:hello-after-slow-redirect");
    assert!(
        elapsed < Duration::from_secs(2),
        "streaming fetch followed the redirect only after waiting {elapsed:?} for the discarded redirect body"
    );
    Ok(())
}

#[test]
fn p3_streaming_fetch_manual_redirect_returns_opaqueredirect_filtered_response()
-> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-manual-redirect;

            world p3-fetch-stream-manual-redirect {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('streamed-manual'));
                  controller.close();
                },
              });
              const res = await fetch('http://127.0.0.1:__PORT__/redirect-307', {
                method: 'POST',
                body,
                duplex: 'half',
                redirect: 'manual',
              });
              return `${res.status}:${res.statusText}:${res.type}:${res.headers.get('location')}:${await res.text()}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_manual_redirect")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "0::opaqueredirect:null:");
    Ok(())
}

#[test]
fn p3_streaming_fetch_truncated_final_body_rejects_like_buffered_path() -> anyhow::Result<()> {
    let port = spawn_test_http_server();
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fetch-stream-truncated-final-body;

            world p3-fetch-stream-truncated-final-body {
              export run: async func() -> string;
            }
        "#},
        &indoc! {r#"
            export async function run() {
              const url = 'http://127.0.0.1:__PORT__/truncated';
              let bufferedResult;
              try {
                const buffered = await fetch(url, { method: 'POST', body: 'buffered' });
                bufferedResult = `resolved:${buffered.status}:${await buffered.text()}`;
              } catch (err) {
                bufferedResult = 'rejected';
              }

              const body = new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode('streamed'));
                  controller.close();
                },
              });
              let streamingResult;
              try {
                const streamed = await fetch(url, {
                  method: 'POST',
                  body,
                  duplex: 'half',
                });
                let bodyResult;
                try {
                  bodyResult = `body-resolved:${await streamed.text()}`;
                } catch (err) {
                  bodyResult = 'body-rejected';
                }
                streamingResult = `resolved:${streamed.status}:${bodyResult}`;
              } catch (err) {
                streamingResult = 'rejected';
              }

              return `buffered=${bufferedResult};streaming=${streamingResult}`;
            }
        "#}
        .replace("__PORT__", &port.to_string()),
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fetch_stream_truncated_final_body")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "buffered=rejected;streaming=rejected");
    Ok(())
}

#[test]
fn p3_rejects_nested_future_in_record() -> anyhow::Result<()> {
    // `future<T>` / `stream<T>` are only supported as a *direct* function parameter or return
    // type (the four JS ⇄ component async-value boundaries). A future/stream nested inside another
    // type (here a record field) has no lowering through the normal `WrappedType` pipeline, so
    // generation must reject it up front with a clear message rather than emit a broken crate.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:nested-future;

            world nested-future {
              record wrap { f: future<u32> }
              export run: async func() -> wrap;
            }
        "#},
        "export async function run() { return { f: Promise.resolve(1) }; }\n",
    )?;

    let err = generate_p3(temp.path())
        .expect_err("P3 generation must reject a future<T> nested inside a record");
    let message = format!("{err:#}");
    assert!(
        message.contains("only supported as a direct function parameter or return type"),
        "unexpected error message: {message}"
    );
    Ok(())
}

#[test]
fn p3_rejects_nested_stream_in_list() -> anyhow::Result<()> {
    // The same restriction applies to `stream<T>`: a `list<stream<u8>>` return type is a nested
    // occurrence and must be rejected.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:nested-stream;

            world nested-stream {
              export run: async func() -> list<stream<u8>>;
            }
        "#},
        "export async function run() { return []; }\n",
    )?;

    let err = generate_p3(temp.path())
        .expect_err("P3 generation must reject a stream<T> nested inside a list");
    let message = format!("{err:#}");
    assert!(
        message.contains("only supported as a direct function parameter or return type"),
        "unexpected error message: {message}"
    );
    Ok(())
}

#[test]
fn p3_dts_rejects_nested_future_in_record() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-nested-future;

            world dts-nested-future {
              record wrap { f: future<u32> }
              export run: func() -> wrap;
            }
        "#},
        "export function run() { return { f: Promise.resolve(1) }; }\n",
    )?;

    let err = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)
        .expect_err("DTS generation must reject a future<T> nested inside a record");
    let message = format!("{err:#}");
    assert!(
        message.contains("only supported as a direct function parameter or return type"),
        "unexpected error message: {message}"
    );
    Ok(())
}

#[test]
fn p3_dts_rejects_nested_future_alias_in_record() -> anyhow::Result<()> {
    // The nested-use restriction must also hold when the `future<T>` is named through a WIT alias:
    // a record field of an alias-to-future type is still a nested async value and has no TypeScript
    // representation, so DTS generation must reject it just like the anonymous nested case.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-nested-future-alias;

            world dts-nested-future-alias {
              type aliased-future = future<u32>;
              record wrap { f: aliased-future }
              export run: func() -> wrap;
            }
        "#},
        "export function run() { return { f: Promise.resolve(1) }; }\n",
    )?;

    let err = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)
        .expect_err("DTS generation must reject a future<T> alias nested inside a record");
    let message = format!("{err:#}");
    assert!(
        message.contains("only supported as a direct function parameter or return type"),
        "unexpected error message: {message}"
    );
    Ok(())
}

#[test]
fn p3_dts_maps_direct_future_and_stream_boundaries() -> anyhow::Result<()> {
    // The counterpart to the nested-rejection tests: a `future<T>` / `stream<T>` used *directly*
    // as a function parameter or return type is a supported async-value boundary and must be
    // reflected in the generated `.d.ts` as `Promise<T>` / `AsyncIterable<T>`. This is checked for
    // all four boundaries — export param/return and import param/return.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-async-values;

            interface host {
              make-future: func(x: u32) -> future<u32>;
              consume-stream: func(s: stream<u8>) -> u32;
            }

            world dts-async-values {
              import host;
              export run-future: func() -> future<u32>;
              export take-stream: func(s: stream<u8>) -> u32;
            }
        "#},
        "export function runFuture() { return Promise.resolve(1); }\n\
         export function takeStream() { return 0; }\n",
    )?;

    let generated = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)?;
    let mut combined = String::new();
    for path in &generated {
        combined.push_str(&std::fs::read_to_string(path)?);
        combined.push('\n');
    }

    // export return `future<u32>` and import return `future<u32>` -> `Promise<number>`
    assert!(
        combined.contains("Promise<number>"),
        "expected a direct future<u32> boundary to map to Promise<number>; generated:\n{combined}"
    );
    // export param `stream<u8>` and import param `stream<u8>` -> `AsyncIterable<number>`
    assert!(
        combined.contains("AsyncIterable<number>"),
        "expected a direct stream<u8> boundary to map to AsyncIterable<number>; \
         generated:\n{combined}"
    );
    Ok(())
}

#[test]
fn p3_dts_exported_future_return_is_not_double_wrapped() -> anyhow::Result<()> {
    // Exported JS functions are already declared as Promise-returning by the DTS writer. A direct
    // component `future<T>` export return is implemented by returning a `T`/`Promise<T>` payload
    // from JS, so the declaration must expose `Promise<T>`, not `Promise<Promise<T>>`.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-export-future-return;

            world dts-export-future-return {
              export run-future: func() -> future<u32>;
            }
        "#},
        "export function runFuture() { return Promise.resolve(1); }\n",
    )?;

    let generated = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)?;
    let exports_path = generated
        .iter()
        .find(|path| path.file_name() == Some("exports.d.ts"))
        .expect("exports.d.ts should be generated");
    let exports = std::fs::read_to_string(exports_path)?;

    assert!(
        exports.contains("export function runFuture(): Promise<number>;"),
        "expected exported future<T> return to be declared as Promise<T>; generated:\n{exports}"
    );
    Ok(())
}

#[test]
fn p3_dts_maps_direct_future_and_stream_alias_boundaries() -> anyhow::Result<()> {
    // Direct function-boundary async values remain direct even when named through a WIT alias.
    // DTS generation should follow those aliases and emit Promise<T> / AsyncIterable<T> at the
    // function boundary rather than treating the alias declaration as a forbidden nested use.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-async-value-aliases;

            interface host {
              type aliased-future = future<u32>;
              type aliased-stream = stream<u8>;

              make-future: func() -> aliased-future;
              consume-stream: func(s: aliased-stream) -> u32;
            }

            world dts-async-value-aliases {
              import host;

              type exported-future = future<u32>;
              type exported-stream = stream<u8>;

              export run-future: func() -> exported-future;
              export take-stream: func(s: exported-stream) -> u32;
            }
        "#},
        "export function runFuture() { return Promise.resolve(1); }\n\
         export function takeStream() { return 0; }\n",
    )?;

    let generated = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)?;
    let mut combined = String::new();
    for path in &generated {
        combined.push_str(&std::fs::read_to_string(path)?);
        combined.push('\n');
    }

    assert!(
        combined.contains("Promise<number>"),
        "expected a direct future<u32> alias boundary to map to Promise<number>; \
         generated:\n{combined}"
    );
    assert!(
        combined.contains("AsyncIterable<number>"),
        "expected a direct stream<u8> alias boundary to map to AsyncIterable<number>; \
         generated:\n{combined}"
    );
    Ok(())
}

#[test]
fn p3_dts_emits_payload_type_definitions_for_async_value_boundaries() -> anyhow::Result<()> {
    // Named payload types used only inside direct `future<T>` / `stream<T>` function boundaries are
    // still part of the public TypeScript surface. The generated declarations must define them;
    // otherwise the boundary signatures reference undeclared `Rec` / `Result` types.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-async-payload-types;

            interface host {
              record rec { n: u32 }

              make-result: func() -> future<result<u32, string>>;
              take-result: func(s: stream<result<u32, string>>);

              resource thing {
                get-result: func() -> future<result<u32, string>>;
              }
            }

            world dts-async-payload-types {
              import host;

              record rec { n: u32 }

              export run-future: func() -> future<rec>;
              export take-stream: func(s: stream<rec>);
              export run-result: func() -> future<result<u32, string>>;
              export take-result: func(s: stream<result<u32, string>>);
            }
        "#},
        "export function runFuture() { return Promise.resolve({ n: 1 }); }\n\
         export function takeStream() {}\n\
         export function runResult() { return Promise.resolve({ tag: 'ok', val: 1 }); }\n\
         export function takeResult() {}\n",
    )?;

    let generated = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)?;
    let exports_path = generated
        .iter()
        .find(|path| path.file_name() == Some("exports.d.ts"))
        .expect("exports.d.ts should be generated");
    let exports = std::fs::read_to_string(exports_path)?;
    let host_path = generated
        .iter()
        .find(|path| path.file_name() != Some("exports.d.ts"))
        .expect("import interface .d.ts should be generated");
    let host = std::fs::read_to_string(host_path)?;

    let expected = [
        (
            "future<rec> return boundary signature",
            "export function runFuture(): Promise<Rec>;",
        ),
        (
            "stream<rec> parameter boundary signature",
            "export function takeStream(s: AsyncIterable<Rec>): Promise<void>;",
        ),
        (
            "future<result<_, _>> return boundary signature",
            "export function runResult(): Promise<Result<number, string>>;",
        ),
        (
            "stream<result<_, _>> parameter boundary signature",
            "export function takeResult(s: AsyncIterable<Result<number, string>>): Promise<void>;",
        ),
        (
            "named async-value payload type declaration",
            "export type Rec =",
        ),
        (
            "async-value result payload helper",
            "export type Result<T, E> =",
        ),
    ];
    let missing = expected
        .iter()
        .filter_map(|(description, needle)| (!exports.contains(needle)).then_some(*description))
        .collect::<Vec<_>>();
    assert!(
        missing.is_empty(),
        "missing expected DTS entries for {}; generated:\n{exports}",
        missing.join(", ")
    );
    assert!(
        host.contains("export type Result<T, E> ="),
        "expected the Result helper for result payloads used by import functions/resource methods; \
         generated:\n{host}"
    );
    Ok(())
}

#[test]
fn p3_dts_accepts_async_func_async_value_boundaries() -> anyhow::Result<()> {
    // The Preview 3 generation path supports `async func` exports/imports, and `future<T>` /
    // `stream<T>` are supported as direct async-value function boundaries. DTS generation should
    // therefore be able to describe the same valid P3 surface instead of accepting only the sync
    // `func() -> future<T>` spelling used by some host-side helpers.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-async-func-async-values;

            interface host {
              make-future: async func() -> future<u32>;
              consume-stream: async func(s: stream<u8>);
            }

            world dts-async-func-async-values {
              import host;

              export run-future: async func() -> future<u32>;
              export take-stream: async func(s: stream<u8>);
            }
        "#},
        "export async function runFuture() { return 1; }\n\
         export async function takeStream() {}\n",
    )?;

    let generated = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)?;
    let exports_path = generated
        .iter()
        .find(|path| path.file_name() == Some("exports.d.ts"))
        .expect("exports.d.ts should be generated");
    let exports = std::fs::read_to_string(exports_path)?;

    assert!(
        exports.contains("export function runFuture(): Promise<number>;"),
        "expected exported async future<T> return to be declared as Promise<T>; generated:\n{exports}"
    );
    assert!(
        exports.contains("export function takeStream(s: AsyncIterable<number>): Promise<void>;"),
        "expected exported async stream<T> parameter to be declared as AsyncIterable<T>; generated:\n{exports}"
    );
    Ok(())
}

#[test]
fn p3_dts_collects_dependencies_through_imported_async_value_aliases() -> anyhow::Result<()> {
    // A direct function boundary remains direct when the boundary type is a world-local `use` alias
    // of an imported interface's alias-to-future. The generated signature references the imported
    // payload type and Result helper, so dependency collection must not stop at the async alias.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:dts-imported-async-alias;

            interface host {
              record rec { n: u32 }
              type fut-rec = future<rec>;
              type fut-result = future<result<u32, string>>;
            }

            world dts-imported-async-alias {
              import host;
              use host.{fut-rec, fut-result};

              export get-rec: func() -> fut-rec;
              export get-result: func() -> fut-result;
            }
        "#},
        "export function getRec() { return Promise.resolve({ n: 1 }); }\n\
         export function getResult() { return Promise.resolve({ tag: 'ok', val: 1 }); }\n",
    )?;

    let generated = generate_dts(&temp.path().join("wit"), &temp.path().join("dts"), None)?;
    let exports_path = generated
        .iter()
        .find(|path| path.file_name() == Some("exports.d.ts"))
        .expect("exports.d.ts should be generated");
    let exports = std::fs::read_to_string(exports_path)?;

    assert!(
        exports.contains(
            "import * as bugDtsImportedAsyncAliasHost from 'bug:dts-imported-async-alias/host';"
        ),
        "expected an import for the host namespace referenced by the async-value payload; \
         generated:\n{exports}"
    );
    assert!(
        exports.contains("export function getRec(): Promise<bugDtsImportedAsyncAliasHost.Rec>;"),
        "expected imported record payload type to be qualified in the future<T> boundary; \
         generated:\n{exports}"
    );
    assert!(
        exports.contains("export function getResult(): Promise<Result<number, string>>;"),
        "expected imported async alias with result payload to use the Result helper; \
         generated:\n{exports}"
    );
    assert!(
        exports.contains("export type Result<T, E> ="),
        "expected Result helper to be emitted for result payload behind imported async alias; \
         generated:\n{exports}"
    );
    Ok(())
}

#[test]
fn p3_dts_generates_for_async_values_examples() -> anyhow::Result<()> {
    // End-to-end ground truth for Phase 3 part 2: the committed async-value examples use real P3
    // `async func` boundaries. DTS generation must succeed on them and produce the settled
    // `Promise<T>` / `AsyncIterable<T>` mappings (this is the surface a real user would consume).
    let out = Utf8TempDir::new()?;

    // Export-side example: future/stream at both export return and export parameter positions.
    let export_dts = out.path().join("export");
    generate_dts(
        Utf8Path::new("examples/p3/async-values/wit"),
        &export_dts,
        None,
    )?;
    let exports = std::fs::read_to_string(export_dts.join("exports.d.ts"))?;
    for needle in [
        "export function runFuture(): Promise<number>;",
        "export function runStream(): Promise<AsyncIterable<number>>;",
        "export function takeFuture(f: Promise<number>): Promise<number>;",
        "export function takeStream(s: AsyncIterable<number>): Promise<number>;",
    ] {
        assert!(
            exports.contains(needle),
            "missing `{needle}` in generated exports.d.ts:\n{exports}"
        );
    }

    // Import-side example: future/stream at both import return and import parameter positions,
    // across sync `func` and `async func` imports.
    let import_dts = out.path().join("import");
    let generated = generate_dts(
        Utf8Path::new("examples/p3/async-values-import/wit"),
        &import_dts,
        None,
    )?;
    let host_path = generated
        .iter()
        .find(|path| path.file_name().is_some_and(|name| name.contains("host")))
        .expect("host import interface .d.ts should be generated");
    let host = std::fs::read_to_string(host_path)?;
    for needle in [
        // sync `func` import returning future/stream: no outer Promise wrapper
        "export function makeFuture(x: number): Promise<number>;",
        "export function makeStream(n: number): AsyncIterable<number>;",
        // `async func` import: Promise-wrapped return, future param stays Promise<T>
        "export function consumeFuture(f: Promise<number>): Promise<number>;",
        "export function consumeStream(s: AsyncIterable<number>): Promise<number>;",
        "export function storeFuture(f: Promise<number>): Promise<void>;",
        "export function readStoredFuture(): Promise<number>;",
    ] {
        assert!(
            host.contains(needle),
            "missing `{needle}` in generated host.d.ts:\n{host}"
        );
    }
    Ok(())
}
