use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "owned_runtime", scope = Cloneable)]
async fn compiled_owned_runtime() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/owned-runtime"),
        true,
        FeatureCombination::Normal,
    )
    .await
    .expect("Failed to compile owned-runtime")
}

#[test]
async fn owned_runtime_isolation(
    #[tagged_as("owned_runtime")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let result = result?;
    assert!(
        output.is_empty(),
        "nested output leaked to component stdio: {output}"
    );
    let Some(wasmtime::component::Val::String(json)) = result else {
        anyhow::bail!("expected JSON string result, got {result:?}");
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(report["liveStdout"], "live:first\nlive:last\n");
    assert_eq!(report["liveStderr"], "live:warn\nlive:error\n");
    assert_eq!(report["liveResult"]["value"]["label"], "live");
    assert_eq!(report["liveResult"]["value"]["argv"][1], "live");
    assert_eq!(
        report["ordering"][0], "data",
        "output was not delivered live"
    );
    assert_eq!(
        report["ordering"].as_array().unwrap().last().unwrap(),
        "result"
    );
    assert_eq!(report["streamedBeforeResult"], true);
    assert_eq!(report["parentProgress"], true);
    assert_eq!(report["left"]["value"], "left");
    assert_eq!(report["left"]["stdout"], "left\n");
    assert_eq!(report["right"]["value"], "right");
    assert_eq!(report["right"]["stdout"], "right\n");
    assert_eq!(report["timeoutSuccess"]["value"], "quick");
    assert_eq!(report["timeoutError"], "runner job timed out");
    assert_eq!(report["tightLoopTimeoutError"], "runner job timed out");
    assert_eq!(report["zeroTimeoutCode"], "ERR_INVALID_ARG_TYPE");
    assert_eq!(report["hugeTimeoutCode"], "ERR_OUT_OF_RANGE");
    for name in ["invalidEntry", "invalidSource"] {
        assert_eq!(
            report["invalidProgramOptions"][name], "ERR_INVALID_ARG_TYPE",
            "unexpected validation result for {name}"
        );
    }
    for name in ["invalidEntryWithSource", "invalidSourceWithEntry", "both"] {
        assert_eq!(
            report["invalidProgramOptions"][name],
            "exactly one of entry or source is required",
            "unexpected exclusivity result for {name}"
        );
    }
    assert_eq!(report["overflowError"], "runner output exceeded maxBytes");
    assert_eq!(report["truncated"]["value"], "ok");
    assert_eq!(report["truncated"]["stderr"], "éé");
    assert_eq!(report["truncated"]["overflowed"], true);
    assert_eq!(report["entry"]["value"]["kind"], "entry");
    assert_eq!(
        report["entry"]["value"]["argv"][1],
        "/tmp/runner-app/entry.mjs"
    );
    assert_eq!(report["imports"]["value"]["local"], "local");
    assert_eq!(report["imports"]["value"]["package"], "package");
    assert_eq!(report["imports"]["value"]["json"], "json");
    assert_eq!(report["imports"]["value"]["cjs"], "cjs");
    assert_eq!(report["imports"]["value"]["afterChdir"], "local");
    assert_eq!(report["imports"]["value"]["cwd"], "/tmp/runner-other");
    assert_eq!(report["privateImport"]["value"], "ERR_MODULE_NOT_FOUND");
    for check in [
        "hasUndefined",
        "nan",
        "infinity",
        "negativeInfinity",
        "negativeZero",
        "bigint",
        "cycle",
        "map",
        "set",
        "bytes",
    ] {
        assert_eq!(report["cloneChecks"][check], true, "clone check {check}");
    }
    assert!(
        report["resourceError"]
            .as_str()
            .is_some_and(|message| message.contains("runner results cannot contain resources")),
        "unexpected resource error: {}",
        report["resourceError"]
    );
    assert_eq!(report["pathAliases"]["value"]["mode"], 0o611);
    assert_eq!(report["pathAliases"]["value"]["link"], "./sub/../file.txt");
    assert_eq!(
        report["pathAliases"]["value"]["real"],
        "/tmp/alias/file.txt"
    );
    assert_eq!(report["pathAliases"]["value"]["renamed"], "before");
    assert_eq!(report["cancellationError"], "runner job cancelled");
    assert_eq!(
        report["nested"]["value"],
        "nested code-runner jobs are not supported"
    );
    assert_eq!(
        report["capacityError"],
        "code-runner supports at most 8 active jobs per runtime"
    );
    assert_eq!(report["reclaimed"]["value"], "reclaimed");
    assert_eq!(
        report["isolation"]["left"]["value"]["fd"],
        report["isolation"]["right"]["value"]["fd"]
    );
    for side in ["left", "right"] {
        let probe = &report["isolation"][side]["value"];
        assert_eq!(probe["mode"], if side == "left" { 0o600 } else { 0o640 });
        assert_eq!(probe["cwd"], format!("/tmp/runner-isolation-{side}"));
        assert_eq!(probe["linkTarget"], "./target.txt");
        assert_eq!(probe["linkValue"], format!("{side}:target"));
        assert_eq!(probe["packageValue"], format!("{side}:package"));
        assert_eq!(
            report["isolation"][side]["stdout"],
            format!("{side}:stdout\n")
        );
        assert_eq!(
            report["isolation"][side]["stderr"],
            format!("{side}:stderr\n")
        );
    }
    assert_eq!(
        report["isolation"]["left"]["value"]["secondFd"].as_i64(),
        report["isolation"]["left"]["value"]["fd"]
            .as_i64()
            .map(|fd| fd + 1)
    );
    assert_eq!(
        report["isolation"]["right"]["value"]["foreignFdError"],
        "EBADF"
    );
    Ok(())
}
