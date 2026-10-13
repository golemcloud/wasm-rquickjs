//! Cargo dependency reuse only; generated crates and runtime state are never cached.
use std::fs::{File, OpenOptions};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Mutex, MutexGuard};

static BUILD_LOCK: Mutex<()> = Mutex::new(());

pub struct BuildCache {
    target: Option<PathBuf>,
    _thread_lock: Option<MutexGuard<'static, ()>>,
    _process_lock: Option<File>,
}

impl BuildCache {
    pub fn new() -> std::io::Result<Self> {
        let enabled = std::env::var("WASM_RQUICKJS_TEST_ARTIFACT_CACHE")
            .is_ok_and(|v| matches!(v.to_ascii_lowercase().as_str(), "1" | "true" | "yes" | "on"));
        Self::open(
            enabled
                .then(|| Path::new(env!("CARGO_MANIFEST_DIR")).join("target/p3-component-build")),
        )
    }

    fn open(target: Option<PathBuf>) -> std::io::Result<Self> {
        let mut cache = Self {
            target,
            _thread_lock: None,
            _process_lock: None,
        };
        if let Some(target) = &cache.target {
            cache._thread_lock = Some(BUILD_LOCK.lock().unwrap_or_else(|e| e.into_inner()));
            std::fs::create_dir_all(target)?;
            let lock = OpenOptions::new()
                .create(true)
                .truncate(false)
                .read(true)
                .write(true)
                .open(target.join(".p3-build.lock"))?;
            // Also protect separate binaries/processes sharing this repository cache.
            lock.lock()?;
            cache._process_lock = Some(lock);
        }
        Ok(cache)
    }

    /// Apply identically to build and metadata, overriding inherited Cargo target settings.
    pub fn configure(&self, command: &mut Command) {
        if let Some(target) = &self.target {
            command.env("CARGO_TARGET_DIR", target);
        }
    }

    /// Snapshot the mutable final artifact before either lock is released.
    pub fn finish(self, wasm: &Path, private_dir: &Path) -> std::io::Result<PathBuf> {
        if self.target.is_none() {
            return Ok(wasm.to_owned());
        }
        let destination = private_dir.join(wasm.file_name().expect("wasm filename"));
        std::fs::copy(wasm, &destination)?;
        Ok(destination)
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;
    use std::sync::{Arc, Barrier};

    #[test]
    fn same_world_builds_return_private_bytes_and_uncached_path_is_unchanged() {
        let root = std::env::temp_dir().join(format!(
            "p3-build-contract-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).unwrap();
        let cargo = root.join("cargo");
        std::fs::write(
            &cargo,
            r#"#!/bin/sh
set -eu
case "$1" in
build)
  mkdir -p "$CARGO_TARGET_DIR/wasm32-wasip2/debug"
  printf '%s' "$BYTES" > "$CARGO_TARGET_DIR/wasm32-wasip2/debug/same_world.wasm"
  sleep 0.05
  ;;
metadata) printf '%s' "$CARGO_TARGET_DIR" ;;
esac
"#,
        )
        .unwrap();
        std::fs::set_permissions(&cargo, std::fs::Permissions::from_mode(0o755)).unwrap();
        let barrier = Arc::new(Barrier::new(2));
        let outputs = std::thread::scope(|scope| {
            let handles: Vec<_> = ["normal-source", "full-p3-other-source"]
                .into_iter()
                .map(|bytes| {
                    let root = &root;
                    let cargo = &cargo;
                    let barrier = &barrier;
                    scope.spawn(move || {
                        let private = root.join(bytes);
                        std::fs::create_dir(&private).unwrap();
                        barrier.wait();
                        let cache = BuildCache::open(Some(root.join("shared"))).unwrap();
                        let mut build = Command::new(cargo);
                        build.arg("build").env("BYTES", bytes);
                        cache.configure(&mut build);
                        assert!(build.status().unwrap().success());
                        let mut metadata = Command::new(cargo);
                        metadata.arg("metadata");
                        cache.configure(&mut metadata);
                        let metadata = metadata.output().unwrap();
                        assert!(metadata.status.success());
                        let target = PathBuf::from(String::from_utf8(metadata.stdout).unwrap());
                        assert_eq!(target, root.join("shared"));
                        let wasm = target.join("wasm32-wasip2/debug/same_world.wasm");
                        let result = cache.finish(&wasm, &private).unwrap();
                        assert_eq!(result, private.join("same_world.wasm"));
                        (result, bytes)
                    })
                })
                .collect();
            handles
                .into_iter()
                .map(|h| h.join().unwrap())
                .collect::<Vec<_>>()
        });
        // Check after BOTH builds have finished and the shared final file was overwritten.
        for (path, bytes) in outputs {
            assert_eq!(std::fs::read(path).unwrap(), bytes.as_bytes());
        }
        let uncached = BuildCache::open(None).unwrap();
        let mut command = Command::new(&cargo);
        command.env("CARGO_TARGET_DIR", "inherited-target");
        uncached.configure(&mut command);
        assert_eq!(
            command
                .get_envs()
                .find(|(key, _)| *key == "CARGO_TARGET_DIR")
                .unwrap()
                .1,
            Some(std::ffi::OsStr::new("inherited-target"))
        );
        let original = root.join("out/target/wasm32-wasip2/debug/same_world.wasm");
        assert_eq!(uncached.finish(&original, &root).unwrap(), original);
        std::fs::remove_dir_all(root).unwrap();
    }
}
