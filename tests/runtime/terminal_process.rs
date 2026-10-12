use crate::common::{CompiledTest, FeatureCombination, PreparedComponent, TestInstance};
use camino::Utf8Path;
use serde_json::Value;
use test_r::{test, test_dep, timeout};

#[test_dep(tagged_as = "terminal_process", scope = Cloneable)]
async fn compiled_terminal_process() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/terminal-process"),
        true,
        FeatureCombination::TerminalProcess,
    )
    .await
    .expect("failed to compile terminal process fixture")
}

#[test]
#[timeout("60s")]
async fn terminal_process_real_builtins(
    #[tagged_as("terminal_process")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let prepared = PreparedComponent::new(compiled.wasm_path())?;
    for (source, code, stdout, stderr_fragment) in [
        (
            "console.log('before');process.exit(7);console.log('after');",
            7,
            "before\n",
            "",
        ),
        (
            "(async()=>{await 0;console.log('unexpected')})();process.exit(7);",
            7,
            "",
            "",
        ),
        (
            "Promise.resolve().then((()=>console.log('unexpected')).bind(null));process.exit(7);",
            7,
            "",
            "",
        ),
        (
            "try{process.exit(7)}catch{console.log('catch')}finally{console.log('finally')}",
            7,
            "",
            "",
        ),
        (
            "Object.defineProperty(Error,Symbol.hasInstance,{value:()=>{probeMutation();return false}});Object.defineProperty(Error.prototype,'message',{set(){probeMutation()}});process.exit(7);",
            7,
            "",
            "",
        ),
        (
            "throw {get stack(){process.exit(7)},toString(){probeMutation();return 'unexpected'}};",
            7,
            "",
            "",
        ),
        (
            "const original=globalThis.__wasm_rquickjs_rejection_tracker;globalThis.__wasm_rquickjs_rejection_tracker=(...args)=>{probeMutation();return original(...args)};(async()=>{process.exit(7)})();",
            7,
            "",
            "",
        ),
        (
            "setTimeout(()=>console.log('delayed'),5);process.exitCode=3;",
            3,
            "delayed\n",
            "",
        ),
        (
            "setInterval(()=>console.log('unreferenced'),100).unref();",
            0,
            "",
            "",
        ),
        (
            "setTimeout(()=>{Promise.resolve().then(()=>console.log('unexpected'));process.exit(7)},5);",
            7,
            "",
            "",
        ),
        (
            "process.nextTick(()=>process.exit(7));process.nextTick(()=>console.log('unexpected'));",
            7,
            "",
            "",
        ),
        (
            "process.on('exit',()=>console.log('listener'));process.exit(7);",
            7,
            "listener\n",
            "",
        ),
        (
            "const result=require('node:child_process').spawnSync(process.execPath,['-e','process.exit(7)']);console.log('child:'+result.status);console.log('after');",
            0,
            "child:7\nafter\n",
            "",
        ),
        (
            "const child=require('node:child_process').spawn(process.execPath,['-e','console.log(\"child\");process.exit(7)']);child.stdout.on('data',bytes=>process.stdout.write(bytes));child.on('close',code=>console.log('code:'+code));",
            0,
            "child\ncode:7\n",
            "",
        ),
        (
            "import('wasm-rquickjs:execution').then(({runJavaScript})=>runJavaScript({source:'setInterval(()=>{},100)'}));setTimeout(()=>process.exit(7),5);",
            7,
            "",
            "",
        ),
        (
            "const fs=require('node:fs');fs.mkdirSync('/tmp',{recursive:true});fs.writeFileSync('/tmp/terminal-file','file');(async()=>console.log(await require('node:fs/promises').readFile('/tmp/terminal-file','utf8')))();",
            0,
            "file\n",
            "",
        ),
        (
            "setTimeout(()=>{throw new Error('timer failure')},5);setTimeout(()=>console.log('unexpected'),50);",
            1,
            "",
            "timer failure",
        ),
        (
            "Promise.reject(new Error('promise failure'));",
            1,
            "",
            "promise failure",
        ),
        (
            "process.on('unhandledRejection',()=>console.log('handled rejection'));Promise.reject(new Error('handled rejection'));",
            0,
            "handled rejection\n",
            "",
        ),
        (
            "process.on('uncaughtException',()=>console.log('handled'));setTimeout(()=>{throw new Error('handled error')},5);",
            0,
            "handled\n",
            "",
        ),
        (
            "let n=0;process.on('beforeExit',()=>{console.log('before');if(n++===0)setTimeout(()=>console.log('timer'),5)});process.on('exit',()=>console.log('exit'));",
            0,
            "before\ntimer\nbefore\nexit\n",
            "",
        ),
    ] {
        let mut instance = TestInstance::from_prepared(&prepared).await?;
        let (result, output, diagnostics) = instance
            .invoke_and_capture_output_with_stderr(
                None,
                "run",
                &[wasmtime::component::Val::String(source.into())],
            )
            .await;
        let result = result.map_err(|error| {
            anyhow::anyhow!("{source}: {error}\nstdout: {output}\nstderr: {diagnostics}")
        })?;
        let Some(wasmtime::component::Val::String(json)) = result else {
            panic!("unexpected fixture result")
        };
        let report: Value = serde_json::from_str(&json)?;
        assert_eq!(report["exitCode"], code, "{source}: {report}");
        let bytes = |name: &str| {
            report[name]
                .as_array()
                .unwrap()
                .iter()
                .map(|byte| byte.as_u64().unwrap() as u8)
                .collect::<Vec<_>>()
        };
        assert_eq!(bytes("stdout"), stdout.as_bytes(), "{source}: {report}");
        let stderr = String::from_utf8(bytes("stderr"))?;
        if stderr_fragment.is_empty() {
            assert_eq!(stderr, "", "{source}: {report}");
        } else {
            assert!(stderr.contains(stderr_fragment), "{source}: {report}");
        }
        assert_eq!(report["runtimeReleased"], true, "{source}: {report}");
        assert_eq!(report["postExitEffects"], 0, "{source}: {report}");
        assert_eq!(report["phase"], "Complete", "{source}: {report}");
    }
    Ok(())
}

#[test]
#[timeout("60s")]
async fn terminal_process_binary_stdio(
    #[tagged_as("terminal_process")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let source = "process.stdout.write(new Uint8Array([77,0,255,1,88]).subarray(1,4));process.stderr.write(Buffer.from('00fe','hex'));process.on('exit',()=>process.stdout.write(new Uint8Array([2])));process.exit(7);";
    let (result, output, diagnostics) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run",
            &[wasmtime::component::Val::String(source.into())],
        )
        .await;
    let result = result
        .map_err(|error| anyhow::anyhow!("{error}\nstdout:{output}\nstderr:{diagnostics}"))?;
    let Some(wasmtime::component::Val::String(json)) = result else {
        panic!("unexpected fixture result")
    };
    let report: Value = serde_json::from_str(&json)?;
    assert_eq!(report["exitCode"], 7);
    assert_eq!(report["stdout"], serde_json::json!([0, 255, 1, 2]));
    assert_eq!(report["stderr"], serde_json::json!([0, 254]));
    assert_eq!(report["runtimeReleased"], true);
    assert_eq!(output, "");
    assert_eq!(diagnostics, "");
    Ok(())
}
