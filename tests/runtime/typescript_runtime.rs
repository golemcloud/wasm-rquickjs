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
    assert_eq!(report["ambiguousAwaitImported"], 42);
    assert_eq!(report["ambiguousAwaitRequired"], 42);
    assert_eq!(report["directTransformValue"], 42);
    assert_eq!(report["directCachedTransformValue"], 42);
    assert_eq!(report["directFirstLoadTransformCount"], 1);
    assert_eq!(report["directFirstLoadAnalysisCount"], 0);
    assert_eq!(report["directCachedTransformCount"], 1);
    assert_eq!(report["directCachedAnalysisCount"], 0);
    assert_eq!(report["importedTransformValue"], 42);
    assert_eq!(report["importedCachedTransformValue"], 42);
    assert_eq!(report["importedFirstLoadTransformCount"], 1);
    assert_eq!(report["preparedImportFirstLoadTrace"], "start,end");
    assert_eq!(report["importedCachedTransformCount"], 1);
    assert_eq!(report["importedThenRequiredTransformValue"], 42);
    assert_eq!(report["importedThenRequiredTransformCount"], 1);
    assert_eq!(report["requiredBeforeImportTransformValue"]["answer"], 42);
    assert_eq!(report["requiredBeforeImportTransformCount"], 1);
    assert_eq!(report["requiredBeforeImportAnalysisCount"], 0);
    assert_eq!(report["requiredThenImportedTransformValue"], 42);
    assert_eq!(report["requiredThenImportedHasPhantom"], false);
    assert_eq!(report["requiredThenImportedTransformCount"], 1);
    assert_eq!(report["requiredThenImportedAnalysisCount"], 1);
    assert_eq!(
        report["requiredBeforeImportCacheStatsAfterRequire"]["preparedEntries"].as_u64(),
        report["requiredBeforeImportCacheStatsBefore"]["preparedEntries"]
            .as_u64()
            .map(|value| value + 1)
    );
    assert_eq!(
        report["requiredBeforeImportCacheStatsAfterImport"]["preparedEntries"],
        report["requiredBeforeImportCacheStatsBefore"]["preparedEntries"]
    );
    assert!(
        report["requiredBeforeImportCacheStatsAfterRequire"]["preparedBytes"]
            .as_u64()
            .unwrap()
            > report["requiredBeforeImportCacheStatsBefore"]["preparedBytes"]
                .as_u64()
                .unwrap()
    );
    assert_eq!(
        report["requiredBeforeImportCacheStatsAfterImport"]["preparedBytes"],
        report["requiredBeforeImportCacheStatsBefore"]["preparedBytes"]
    );
    assert_eq!(report["rewriteRequiredValue"]["answer"], 42);
    assert_eq!(report["rewriteImportedDefault"]["answer"], 42);
    assert_eq!(
        report["rewriteImportedKeys"],
        serde_json::json!(["changed", "default"])
    );
    assert_eq!(report["rewriteImportedChangedIsUndefined"], true);
    assert_eq!(report["rewriteTransformCount"], 2);
    assert_eq!(report["rewriteAnalysisCount"], 1);
    assert_eq!(report["requiredReexportValue"]["answer"], 42);
    assert_eq!(report["requiredReexportTransformCount"], 2);
    assert_eq!(report["requiredReexportAnalysisCount"], 0);
    assert_eq!(report["reexportTransformValue"], 42);
    assert_eq!(report["reexportHasPhantom"], false);
    assert_eq!(report["reexportFirstLoadTransformCount"], 2);
    assert_eq!(report["reexportFirstLoadAnalysisCount"], 2);
    assert_eq!(report["reexportCachedTransformValue"], 42);
    assert_eq!(report["reexportCachedTransformCount"], 2);
    assert_eq!(report["reexportChildTransformValue"], 42);
    assert_eq!(report["reexportChildHasPhantom"], false);
    assert_eq!(report["reexportChildImportTransformCount"], 2);
    assert_eq!(report["requiredCycleA"], 1);
    assert_eq!(report["requiredCycleB"], 2);
    assert_eq!(report["importedCycleA"], 1);
    assert_eq!(report["importedCycleB"], 2);
    assert_eq!(report["cachedCycleA"], 1);
    assert_eq!(report["cachedCycleB"], 2);
    assert_eq!(report["cycleTransformCount"], 2);
    assert_eq!(report["cycleAnalysisCount"], 2);
    assert_eq!(report["cycleExecutionCounts"], serde_json::json!([1, 1]));
    assert!(
        report["preparedSourceCacheStats"]["entries"]
            .as_u64()
            .unwrap()
            <= 32
    );
    assert!(
        report["preparedSourceCacheStats"]["bytes"]
            .as_u64()
            .unwrap()
            <= 1024 * 1024
    );
    assert_eq!(report["preparedSourceCacheStats"]["maxEntries"], 32);
    assert_eq!(report["preparedSourceCacheStats"]["maxBytes"], 1024 * 1024);
    assert_eq!(report["oversizedRequiredValue"]["answer"], 42);
    assert_eq!(report["oversizedImportedValue"], 42);
    assert_eq!(report["oversizedTransformCount"], 2);
    assert_eq!(report["oversizedAnalysisCount"], 1);
    assert_eq!(
        report["oversizedCacheStatsAfterRequire"]["preparedEntries"],
        report["oversizedCacheStatsBefore"]["preparedEntries"]
    );
    assert_eq!(
        report["oversizedCacheStatsAfterRequire"]["preparedBytes"],
        report["oversizedCacheStatsBefore"]["preparedBytes"]
    );
    assert!(
        report["oversizedCacheStatsAfterImport"]["entries"]
            .as_u64()
            .unwrap()
            <= report["oversizedCacheStatsAfterImport"]["maxEntries"]
                .as_u64()
                .unwrap()
    );
    assert!(
        report["oversizedCacheStatsAfterImport"]["bytes"]
            .as_u64()
            .unwrap()
            <= report["oversizedCacheStatsAfterImport"]["maxBytes"]
                .as_u64()
                .unwrap()
    );
    assert_eq!(report["cachedChildReexportValue"], 42);
    assert_eq!(report["cachedChildReexportTransformCount"], 2);
    assert_eq!(report["esmChildReexportValue"], 42);
    assert_eq!(report["esmChildReexportTransformCount"], 1);
    assert_eq!(report["importTypeCommonJsValue"], 42);
    assert_eq!(report["importTypeCommonJsTransformCount"], 1);
    assert_eq!(report["typeCommonJsValue"], 42);
    assert_eq!(report["typeCommonJsTransformCount"], 1);
    assert_eq!(report["typeOnlyReexportValue"], 42);
    assert_eq!(report["typeOnlyReexportTransformCount"], 2);
    assert_eq!(report["typeModuleCtsReexportValue"], 42);
    assert_eq!(report["typeModuleCtsReexportTransformCount"], 2);
    assert_eq!(report["lexicalEsmChildReexportValue"], "ANALYSIS_ONLY");
    assert_eq!(report["lexicalEsmChildReexportTransformCount"], 1);
    assert_eq!(report["topLevelForAwaitReexportValue"], "ANALYSIS_ONLY");
    assert_eq!(report["topLevelForAwaitReexportTransformCount"], 1);
    assert_eq!(report["nestedForAwaitReexportValue"], "ANALYSIS_ONLY");
    assert_eq!(report["nestedForAwaitReexportTransformCount"], 2);
    assert_eq!(report["topLevelAwaitUsingReexportValue"], "ANALYSIS_ONLY");
    assert_eq!(report["topLevelAwaitUsingReexportTransformCount"], 1);
    assert_eq!(report["nestedAwaitUsingReexportValue"], "ANALYSIS_ONLY");
    assert_eq!(report["nestedAwaitUsingReexportTransformCount"], 2);
    assert_eq!(report["declareWrapperReexportValue"], "ANALYSIS_ONLY");
    assert_eq!(report["declareWrapperReexportTransformCount"], 2);
    assert_eq!(
        report["recoverablePrepareError"],
        "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX"
    );
    assert_eq!(report["recoverableCachedAfterFailure"], false);
    assert_eq!(
        report["recoverableChildrenAfterFailure"],
        report["recoverableChildrenBefore"]
    );
    assert_eq!(report["recoverablePrepareValue"], 42);
    assert_eq!(report["recoverableCachedAfterSuccess"], true);
    assert_eq!(
        report["recoverableChildrenAfterSuccess"].as_u64(),
        report["recoverableChildrenBefore"]
            .as_u64()
            .map(|value| value + 1)
    );
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
