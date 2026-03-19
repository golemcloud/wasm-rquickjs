use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use indoc::formatdoc;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "console")]
fn compiled_console() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/console");
    CompiledTest::new(path, true).expect("Failed to compile console")
}

#[test]
async fn console(#[tagged_as("console")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let _ = r?;

    println!("{output}");

    // Removing the last 3 lines which are printed by timers and can have slight differences in the millisecond
    // values

    let lines = output.lines().collect::<Vec<_>>();
    let (output, timer_output) = lines.split_at(lines.len() - 3);
    let output_str = output.join("\n");
    let timer_output = timer_output.join("\n");

    assert_eq!(
        output_str,
        formatdoc!(
            r#"
    default: 1
    logged message 1 2 {{ key: 'value' }}
    This is an debug message
    This is an info message
    default: 2
    Group 1
      Inside Group 1
      Group 2
        Inside Group 2
    default: 3
    test: 1
    test: 2
    default: 1
    {colored}
    {{ key: 'value', nested: {{ a: 1, b: 2 }} }}
    ┌─────────┬───────────┐
    │ (index) │ Values    │
    ├─────────┼───────────┤
    │ 0       │ 'apples'  │
    │ 1       │ 'oranges' │
    │ 2       │ 'bananas' │
    └─────────┴───────────┘
    ┌─────────┬──────────┬─────────┐
    │ (index) │ 0        │ 1       │
    ├─────────┼──────────┼─────────┤
    │ 0       │ 'Tyrone' │ 'Jones' │
    │ 1       │ 'Janet'  │ 'Smith' │
    │ 2       │ 'Maria'  │ 'Cruz'  │
    └─────────┴──────────┴─────────┘
    ┌───────────┬──────────┐
    │ (index)   │ Values   │
    ├───────────┼──────────┤
    │ firstName │ 'Tyrone' │
    │ lastName  │ 'Jones'  │
    └───────────┴──────────┘
    ┌─────────┬───────────┐
    │ (index) │ firstName │
    ├─────────┼───────────┤
    │ 0       │ 'Tyrone'  │
    │ 1       │ 'Janet'   │
    │ 2       │ 'Maria'   │
    └─────────┴───────────┘
    --- Map Examples ---
    Empty map: Map(0) {{}}
    Simple map: Map(3) {{ 'name' => 'John', 'age' => 30, 'city' => 'New York' }}
    Map with mixed keys: Map(3) {{
      'string' => 'value',
      42 => 'number key',
      {{ key: 'obj' }} => 'object key'
    }}
    Map with object values: Map(2) {{
      'user' => {{ name: 'Alice', age: 25 }},
      'config' => {{ debug: true, timeout: 5000 }}
    }}
    Map with array values: Map(2) {{
      'colors' => [ 'red', 'green', 'blue' ],
      'numbers' => [ 1, 2, 3, 4, 5 ]
    }}
    --- Map in dir() ---
    Map(3) {{ 'name' => 'John', 'age' => 30, 'city' => 'New York' }}
    --- Map in inspect() ---
    Map(2) {{
      'user' => {{ name: 'Alice', age: 25 }},
      'config' => {{ debug: true, timeout: 5000 }}
    }}
    --- Set Examples ---
    Empty set: Set(0) {{}}
    Simple set: Set(3) {{ 'apple', 'banana', 'cherry' }}
    Set with mixed types: Set(4) {{ 'string', 42, {{ key: 'obj' }}, [ 1, 2, 3 ] }}
    Set with objects: Set(2) {{ {{ name: 'Alice', age: 25 }}, {{ name: 'Bob', age: 30 }} }}
    --- Set in dir() ---
    Set(3) {{ 'apple', 'banana', 'cherry' }}
    --- Set in inspect() ---
    Set(2) {{ {{ name: 'Alice', age: 25 }}, {{ name: 'Bob', age: 30 }} }}
    --- WeakSet Examples ---
    WeakSet: WeakSet {{ <items unknown> }}
    --- WeakMap Examples ---
    WeakMap: WeakMap {{ <items unknown> }}"#,
            colored = "{ key: \u{1b}[32m'value'\u{1b}[39m, nested: { a: \u{1b}[33m1\u{1b}[39m, b: \u{1b}[33m2\u{1b}[39m } }"
        )
    );

    assert!(timer_output.contains("after 1 second"));
    assert!(timer_output.contains("after 2 seconds"));

    Ok(())
}
