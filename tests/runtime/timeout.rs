use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use indoc::indoc;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "timeout", scope = Cloneable)]
async fn compiled_timeout() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/timeout");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile timeout")
}

#[test]
async fn timeout_1(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let _ = r?;

    const REPEATED: &str = "This is a repeated message every 250ms";
    let lines: Vec<_> = output.lines().collect();
    let semantic_events: Vec<_> = lines
        .iter()
        .copied()
        .filter(|line| *line != REPEATED)
        .collect();
    assert_eq!(
        semantic_events,
        [
            "timeout test starts",
            "Message from setImmediate #1",
            "Message from setImmediate #2",
            "This is a delayed message after 1s, with params x, 100",
            "This is a delayed message after 2s",
            "This is a followup delayed message after 1s",
        ]
    );

    let delayed_one = lines
        .iter()
        .position(|line| *line == semantic_events[3])
        .unwrap();
    let delayed_two = lines
        .iter()
        .position(|line| *line == semantic_events[4])
        .unwrap();
    let followup = lines
        .iter()
        .position(|line| *line == semantic_events[5])
        .unwrap();
    for (name, count) in [
        (
            "before the one-second timeout",
            lines[3..delayed_one]
                .iter()
                .filter(|line| **line == REPEATED)
                .count(),
        ),
        (
            "between the one- and two-second timeouts",
            lines[delayed_one + 1..delayed_two]
                .iter()
                .filter(|line| **line == REPEATED)
                .count(),
        ),
        (
            "between the two-second timeout and its followup",
            lines[delayed_two + 1..followup]
                .iter()
                .filter(|line| **line == REPEATED)
                .count(),
        ),
    ] {
        assert!(
            (3..=4).contains(&count),
            "expected three or four interval ticks {name}, got {count}:\n{output}"
        );
    }

    Ok(())
}

#[test]
#[ignore] // NOTE: this test passes with Golem but not with wasmtime. To be investigated.
async fn timeout_2(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "parallel", &[]).await;
    let _ = r?;

    for i in 0..1000 {
        assert!(output.contains(&format!("test {i}")));
    }

    Ok(())
}

#[test]
async fn timeout_3(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "use-next-tick", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
            start
            end
            nextTick callback 1
            nextTick callback 2
            setImmediate callback 1
        "#
        )
    );

    Ok(())
}
