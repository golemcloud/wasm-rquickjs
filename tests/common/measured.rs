//! Opt-in execution evidence for tools/measured-report.cjs. Never changes retry policy.
use anyhow::Context;
use serde_json::{Value, json};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

fn directory() -> Option<PathBuf> {
    std::env::var_os("WASM_RQUICKJS_MEASURE_DIR").map(PathBuf::from)
}

fn write(path: &Path, value: &Value) -> anyhow::Result<()> {
    let bytes = serde_json::to_vec_pretty(value)?;
    // Workers may rediscover the same inventory concurrently. Publish only complete bytes.
    let parent =
        camino::Utf8Path::from_path(path.parent().unwrap()).context("non-UTF8 evidence path")?;
    let mut file = camino_tempfile::NamedUtf8TempFile::new_in(parent)?;
    file.write_all(&bytes)?;
    match file.persist_noclobber(path) {
        Ok(_) => (),
        Err(error) if error.error.kind() == std::io::ErrorKind::AlreadyExists => {
            anyhow::ensure!(
                fs::read(path)? == bytes,
                "conflicting evidence: {}",
                path.display()
            );
        }
        Err(error) => return Err(error.error.into()),
    }
    Ok(())
}

pub fn node_compat_input_roots() -> anyhow::Result<()> {
    if let Some(dir) = directory() {
        write(
            &dir.join("input-roots.json"),
            &json!(super::NODE_COMPAT_INPUT_ROOTS),
        )?;
    }
    Ok(())
}

pub fn register(
    name: &str,
    fixture: &str,
    runner_prefix: &str,
    classification: &str,
    reason: Option<&str>,
    timeout_seconds: u64,
    max_attempts: usize,
) {
    let Some(dir) = directory() else { return };
    let filter = std::env::var("WASM_RQUICKJS_MEASURE_FILTER").expect("measurement filter");
    let runner_name = format!("{runner_prefix}::{name}");
    if !runner_name.contains(&filter) {
        return;
    }
    let inventory = dir.join("inventory");
    fs::create_dir_all(&inventory).expect("create measurement inventory");
    write(&inventory.join(format!("{}.json", blake3::hash(name.as_bytes()))), &json!({
        "id": name, "runnerName": runner_name, "fixture": fixture,
        "classification": classification, "skipReason": reason.or_else(|| (classification != "runnable").then_some(classification)),
        "timeoutSeconds": timeout_seconds, "maxAttempts": max_attempts,
        "coverage": "unclassified"
    })).expect("record measurement inventory");
}

pub fn component(path: &Path, features: &str) -> anyhow::Result<()> {
    if let Some(dir) = directory() {
        write(
            &dir.join("component.json"),
            &json!({
                "identity": fs::read_to_string(dir.join("identity.txt"))?,
                "algorithm": "blake3", "digest": blake3::hash(&fs::read(path)?).to_hex().as_str(),
                "features": features
            }),
        )?;
    }
    Ok(())
}

pub struct Prerequisite {
    dir: Option<PathBuf>,
    identity: String,
    phase: String,
}

impl Prerequisite {
    pub fn start(phase: &str) -> anyhow::Result<Self> {
        let dir = directory().map(|root| {
            root.join("prerequisites")
                .join(format!("{phase}-{}", std::process::id()))
        });
        let identity = if let Some(dir) = &dir {
            fs::create_dir_all(dir)?;
            let identity = fs::read_to_string(directory().unwrap().join("identity.txt"))?;
            write(
                &dir.join("start.json"),
                &json!({
                    "identity": identity, "phase": phase, "startedAt": chrono::Utc::now().to_rfc3339()
                }),
            )?;
            identity
        } else {
            String::new()
        };
        Ok(Self {
            dir,
            identity,
            phase: phase.into(),
        })
    }

    pub fn finish<T>(self, result: anyhow::Result<T>) -> anyhow::Result<T> {
        if let Some(dir) = &self.dir {
            write(
                &dir.join("finish.json"),
                &json!({
                    "identity": self.identity, "phase": self.phase,
                    "outcome": if result.is_ok() { "pass" } else { "fail" },
                    "reason": result.as_ref().err().map(|error| format!("{error:#}")),
                    "finishedAt": chrono::Utc::now().to_rfc3339()
                }),
            )?;
        }
        result
    }
}

pub struct Attempt {
    dir: Option<PathBuf>,
    identity: String,
    case: String,
    ordinal: usize,
    phase: String,
    step: usize,
    timed_out: bool,
    skip_reason: Option<String>,
}

impl Attempt {
    pub fn is_enabled(&self) -> bool {
        self.dir.is_some()
    }

    pub fn start(case: &str) -> anyhow::Result<Self> {
        let mut attempt = Self {
            dir: None,
            identity: String::new(),
            case: case.into(),
            ordinal: 0,
            phase: String::new(),
            step: 0,
            timed_out: false,
            skip_reason: None,
        };
        if let Some(root) = directory() {
            let parent = root
                .join("attempts")
                .join(blake3::hash(case.as_bytes()).to_hex().as_str());
            fs::create_dir_all(&parent)?;
            for ordinal in 1.. {
                let dir = parent.join(format!("{ordinal:04}"));
                match fs::create_dir(&dir) {
                    Ok(()) => {
                        attempt.dir = Some(dir);
                        attempt.ordinal = ordinal;
                        break;
                    }
                    Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                    Err(error) => return Err(error.into()),
                }
            }
            attempt.identity = fs::read_to_string(root.join("identity.txt"))?;
            attempt.record(
                "start.json",
                json!({"startedAt": chrono::Utc::now().to_rfc3339()}),
            )?;
        }
        attempt.phase("setup")?;
        Ok(attempt)
    }

    fn record(&self, file: &str, mut value: Value) -> anyhow::Result<()> {
        if let Some(dir) = &self.dir {
            value["identity"] = self.identity.clone().into();
            value["caseId"] = self.case.clone().into();
            value["ordinal"] = self.ordinal.into();
            write(&dir.join(file), &value)?;
        }
        Ok(())
    }

    fn end_phase(&self, outcome: &str, reason: &str) -> anyhow::Result<()> {
        if self.step != 0 {
            self.record(
                &format!("phase-{:04}-finish.json", self.step),
                json!({
                    "phase": self.phase, "outcome": outcome, "reason": reason,
                    "finishedAt": chrono::Utc::now().to_rfc3339()
                }),
            )?;
        }
        Ok(())
    }

    pub fn phase(&mut self, phase: &str) -> anyhow::Result<()> {
        if self.dir.is_none() {
            return Ok(());
        }
        self.end_phase("pass", "")?;
        self.phase = phase.into();
        self.step += 1;
        self.record(
            &format!("phase-{:04}-start.json", self.step),
            json!({
                "phase": phase, "startedAt": chrono::Utc::now().to_rfc3339()
            }),
        )
    }

    pub fn logs(&self, stdout: &str, stderr: &str) -> anyhow::Result<()> {
        if let Some(dir) = &self.dir {
            for (suffix, text) in [("stdout", stdout), ("stderr", stderr)] {
                let path = dir.join(format!("phase-{:04}-{suffix}.txt", self.step));
                OpenOptions::new()
                    .write(true)
                    .create_new(true)
                    .open(path)?
                    .write_all(text.as_bytes())?;
            }
        }
        Ok(())
    }

    pub fn timed_out(&mut self) {
        self.timed_out = true;
    }

    pub fn returned(&mut self, result: &anyhow::Result<Option<wasmtime::component::Val>>) {
        if let Err(error) = result {
            self.timed_out |= error.chain().any(|cause| {
                matches!(
                    cause.downcast_ref::<wasmtime::Trap>(),
                    Some(wasmtime::Trap::Interrupt)
                )
            });
        }
        if let Ok(Some(wasmtime::component::Val::String(value))) = result
            && value.starts_with("SKIP:")
        {
            self.skip_reason = Some(value.clone());
        }
    }

    pub fn finish(&self, result: &anyhow::Result<()>) -> anyhow::Result<()> {
        if self.dir.is_none() {
            return Ok(());
        }
        let reason = result
            .as_ref()
            .err()
            .map(|e| format!("{e:#}"))
            .unwrap_or_else(|| self.skip_reason.clone().unwrap_or_default());
        let outcome = if result.is_ok() && self.skip_reason.is_some() {
            "skip"
        } else if result.is_ok() {
            "pass"
        } else if self.phase != "guest" {
            "blocked"
        } else if self.timed_out
            || result.as_ref().err().is_some_and(|error| {
                error.chain().any(|cause| {
                    matches!(
                        cause.downcast_ref::<wasmtime::Trap>(),
                        Some(wasmtime::Trap::Interrupt)
                    )
                })
            })
        {
            "timeout"
        } else {
            "fail"
        };
        self.end_phase(
            if outcome == "blocked" {
                "fail"
            } else {
                outcome
            },
            &reason,
        )?;
        self.record("finish.json", json!({
            "outcome": outcome, "reason": reason, "failedPhase": if result.is_err() { Some(&self.phase) } else { None },
            "finishedAt": chrono::Utc::now().to_rfc3339()
        })).context("finish measured attempt")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test_r::test]
    fn epoch_interrupt_retains_timeout() {
        // Isolate measurement environment variables from concurrent harness tests.
        if std::env::var_os("MEASURE_TRAP_CAPTURE_CHILD").is_none() {
            let dir = camino_tempfile::Utf8TempDir::new().unwrap();
            fs::write(dir.path().join("identity.txt"), "probe").unwrap();
            let output = std::process::Command::new(std::env::current_exe().unwrap())
                .args([
                    "--exact",
                    "common::measured::tests::epoch_interrupt_retains_timeout",
                ])
                .env("MEASURE_TRAP_CAPTURE_CHILD", "1")
                .env("WASM_RQUICKJS_MEASURE_DIR", dir.path())
                .env("WASM_RQUICKJS_MEASURE_FILTER", "no-measured-inventory")
                .output()
                .unwrap();
            assert!(
                output.status.success(),
                "{}",
                String::from_utf8_lossy(&output.stderr)
            );
            assert!(String::from_utf8_lossy(&output.stdout).contains("1 passed"));
            return;
        }
        for (case, error, expected) in [
            (
                "interrupt",
                anyhow::Error::new(wasmtime::Trap::Interrupt).context("guest invocation"),
                "timeout",
            ),
            ("assertion", anyhow::anyhow!("assertion failed"), "fail"),
        ] {
            let mut attempt = Attempt::start(case).unwrap();
            attempt.phase("guest").unwrap();
            let formatted = format!("Invocation error: {error}");
            let returned = Err(error);
            attempt.returned(&returned);
            attempt.logs("", "").unwrap();
            // The API runner formats the invocation error, losing the original chain.
            attempt.finish(&Err(anyhow::anyhow!(formatted))).unwrap();
            let finish = directory()
                .unwrap()
                .join("attempts")
                .join(blake3::hash(case.as_bytes()).to_hex().as_str())
                .join("0001/finish.json");
            let value: Value = serde_json::from_slice(&fs::read(finish).unwrap()).unwrap();
            assert_eq!(value["outcome"], expected);
        }
    }
}
