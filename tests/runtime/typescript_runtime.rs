use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "typescript_runtime", scope = Cloneable)]
async fn compiled_typescript_runtime() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/typescript-runtime"),
        true,
        FeatureCombination::TypeScriptRuntime,
    )
    .await
    .expect("Failed to compile typescript-runtime")
}

#[test_dep(tagged_as = "typescript_transform_runtime", scope = Cloneable)]
async fn compiled_typescript_transform_runtime() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/typescript-transform-runtime"),
        true,
        FeatureCombination::TypeScriptTransformRuntime,
    )
    .await
    .expect("Failed to compile typescript-transform-runtime")
}

#[test]
async fn strip_typescript_types_matches_node_contract(
    #[tagged_as("typescript_runtime")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    assert!(output.is_empty(), "unexpected output: {output}");
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected TypeScript result JSON");
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(report["stripped"], "const value         = 1;");
    assert!(
        report["transformed"]
            .as_str()
            .is_some_and(|output| output.contains("MathUtil")
                && output.contains("sourceMappingURL=data:application/json;base64,")
                && output.ends_with("//# sourceURL=input.ts"))
    );
    assert_eq!(
        report["sourceMap"],
        serde_json::json!({
            "version": 3,
            "sources": ["input.ts"],
            "names": [],
            "mappings": "UACY;aACK,MAAM,CAAC,GAAW,IAAc,IAAI;AACnD,GAFU,aAAA",
        })
    );
    assert_eq!(
        report["validationCodes"],
        serde_json::json!([
            "ERR_INVALID_ARG_TYPE",
            "ERR_INVALID_ARG_TYPE",
            "ERR_INVALID_ARG_VALUE",
            "ERR_INVALID_ARG_VALUE",
        ])
    );
    assert_eq!(report["moduleTs"], 42);
    assert_eq!(report["moduleMts"], 42);
    assert_eq!(report["commonJsCts"], 42);
    assert_eq!(report["directTransformValue"], 42);
    assert_eq!(report["directCachedTransformValue"], 42);
    assert_eq!(report["directFirstLoadTransformCount"], 1);
    assert_eq!(report["directCachedTransformCount"], 1);
    assert_eq!(report["importedTransformValue"], 42);
    assert_eq!(report["importedCachedTransformValue"], 42);
    assert_eq!(report["importedFirstLoadTransformCount"], 1);
    assert_eq!(report["preparedImportFirstLoadTrace"], "start,end");
    assert_eq!(report["importedCachedTransformCount"], 1);
    assert_eq!(report["importedThenRequiredTransformValue"], 42);
    assert_eq!(report["importedThenRequiredTransformCount"], 1);
    assert_eq!(report["requiredBeforeImportTransformValue"]["answer"], 42);
    assert_eq!(report["requiredBeforeImportTransformCount"], 1);
    assert_eq!(report["requiredThenImportedTransformValue"], 42);
    assert_eq!(report["requiredThenImportedHasPhantom"], false);
    assert_eq!(report["requiredThenImportedTransformCount"], 1);
    assert_eq!(report["requiredReexportValue"]["answer"], 42);
    assert_eq!(report["requiredReexportTransformCount"], 2);
    assert_eq!(report["reexportTransformValue"], 42);
    assert_eq!(report["reexportHasPhantom"], false);
    assert_eq!(report["reexportFirstLoadTransformCount"], 2);
    assert_eq!(report["reexportCachedTransformValue"], 42);
    assert_eq!(report["reexportCachedTransformCount"], 2);
    assert_eq!(report["reexportChildTransformValue"], 42);
    assert_eq!(report["reexportChildHasPhantom"], false);
    assert_eq!(report["reexportChildImportTransformCount"], 2);
    assert_eq!(report["requiredMtsDefault"], 42);
    assert_eq!(report["importedMtsDefault"], 42);
    assert_eq!(report["importedMtsLive"], 1);
    assert_eq!(report["mtsRequireImportSameNamespace"], false);
    assert_eq!(report["mtsRequireImportTransformCount"], 2);
    assert_eq!(report["requiredModuleTsDefault"], 42);
    assert_eq!(report["importedModuleTsDefault"], 42);
    assert_eq!(report["importedModuleTsLive"], 1);
    assert_eq!(report["moduleTsRequireImportSameNamespace"], false);
    assert_eq!(report["moduleTsRequireImportTransformCount"], 2);
    assert_eq!(report["extensionlessCommonJsTsError"], "MODULE_NOT_FOUND");
    assert_eq!(report["extensionlessEsmError"], "ERR_MODULE_NOT_FOUND");
    assert_eq!(
        report["loaderUnsupportedCode"],
        "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX"
    );
    assert_eq!(report["loaderUnsupportedName"], "SyntaxError");
    assert_eq!(
        report["commonJsUnsupportedCode"],
        "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX"
    );
    assert_eq!(report["commonJsUnsupportedName"], "SyntaxError");
    assert_eq!(report["processFeatureStrip"], "strip");
    assert_eq!(report["processFeatureAfterMutation"], "strip");
    assert_eq!(report["esmImportsCts"], 42);
    assert_eq!(report["typeOnlyImport"], 42);
    assert_eq!(report["invalidSyntaxCode"], "ERR_INVALID_TYPESCRIPT_SYNTAX");
    assert_eq!(report["invalidSyntaxName"], "SyntaxError");
    assert_eq!(
        report["nodeModulesError"],
        "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING"
    );
    assert_eq!(report["nodeModulesErrorName"], "Error");
    assert_eq!(
        report["commonJsNodeModulesError"],
        "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING"
    );
    assert_eq!(report["commonJsNodeModulesErrorName"], "Error");
    assert!(
        report["inlineRunnerUnsupported"]
            .as_str()
            .is_some_and(|message| message.contains("TypeScript enum")),
        "unexpected strip-only inline execution result: {}",
        report["inlineRunnerUnsupported"]
    );
    assert_eq!(report["inlineRunnerStripped"], 42);
    assert_eq!(report["entryRunner"], 42);
    assert_eq!(report["commonJsEntryRunner"], 42);
    assert_eq!(report["largeInlineRunner"], 42);
    assert!(
        report["unsupported"]
            .as_str()
            .is_some_and(|message| message.contains("TypeScript enum is not supported"))
    );
    assert_eq!(
        report["unsupportedCode"],
        "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX"
    );
    Ok(())
}

#[test]
async fn typescript_transform_runtime_is_immutable(
    #[tagged_as("typescript_transform_runtime")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    assert!(output.is_empty(), "unexpected output: {output}");
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected TypeScript transform result JSON");
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(report["processFeature"], "transform");
    assert_eq!(report["transformObservability"], "undefined");
    assert_eq!(report["transformedModule"], 1);
    assert_eq!(report["executionEntry"], 1);
    assert_eq!(report["commonJsExecutionEntry"], 42);
    assert_eq!(report["filesystemProject"]["answer"], 42);
    assert_eq!(report["filesystemProject"]["runtime"], "typescript");
    assert_eq!(
        report["nodeModulesTypeScriptError"],
        "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING"
    );
    assert_eq!(report["nodeModulesTypeScriptErrorName"], "Error");
    assert_eq!(
        report["commonJsNodeModulesTypeScriptError"],
        "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING"
    );
    assert_eq!(report["commonJsNodeModulesTypeScriptErrorName"], "Error");
    assert_eq!(report["executionInline"], 1);
    assert_eq!(report["largeInlineExecution"], 1);
    Ok(())
}
