use super::*;
use wasm_rquickjs::{CompilationCacheStats, EmbeddingMode, GenerationTarget, JsModuleSpec};
use wasmtime::{CacheConfig, Config};

#[test]
fn initializer_sources_reuse_compilation_without_reusing_guest_state() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let root = temp.path();
    let embedded = root.join("embedded.js");
    std::fs::write(&embedded, "export const suffix = 'embedded';")?;
    let template = build_preinit_template_with_modules(
        root,
        GenerationTarget::WasiP3,
        "p3,encoding",
        // Cargo's shared target directory must distinguish this module layout
        // from the single-slot preinit-probe package.
        "source-input-probe",
        &[
            JsModuleSpec {
                name: "module".into(),
                mode: EmbeddingMode::BinarySlot,
            },
            JsModuleSpec {
                name: "embedded".into(),
                mode: EmbeddingMode::EmbedFile(embedded),
            },
            JsModuleSpec {
                name: "dependency".into(),
                mode: EmbeddingMode::BinarySlot,
            },
            JsModuleSpec {
                name: "late".into(),
                mode: EmbeddingMode::BinarySlot,
            },
        ],
    )?;
    let original_template = std::fs::read(&template)?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    runtime.block_on(async {
        let mut cache_config = CacheConfig::new();
        cache_config.with_directory(root.join("cache"));
        let mut config = Config::new();
        config.wasm_component_model_async(true);
        // Match callers which enable metering in their shared engine configuration.
        config.consume_fuel(true).epoch_interruption(true);
        let source = r#"
            import {value} from 'dependency';
            import {suffix} from 'embedded';
            globalThis.initializations = (globalThis.initializations ?? 0) + 1;
            const frozen = Date.now();
            let calls = 0;
            export function ready() { return 'ready'; }
            export async function run() {
                const late = await import('late');
                return JSON.stringify({value, suffix, late: late.value, frozen,
                    calls: ++calls, initializations: globalThis.initializations});
            }
        "#;
        let a = vec![
            source.to_owned(),
            "export const value = 'A';".into(),
            "export const value = 'late-A';".into(),
        ];
        let b = vec![
            source.to_owned(),
            "export const value = 'longer-B';".into(),
            "export const value = 'late-B';".into(),
        ];
        let output = root.join("snapshot.wasm");
        let mut snapshot_a = None;
        for (index, sources, expected, late) in [
            (0, &a, "A", "late-A"),
            (1, &b, "longer-B", "late-B"),
            (2, &a, "A", "late-A"),
        ] {
            // Every operation creates fresh engines and cache handles sharing only files.
            let result = optimize_component_with_options(
                &template,
                &output,
                "wizer-initialize",
                &OptimizeOptions {
                    sources: Some(sources),
                    engine_config: Some(&config),
                    cache_config: Some(&cache_config),
                    ..Default::default()
                },
            )
            .await?;
            assert_eq!(
                result.compilation_cache,
                Some(CompilationCacheStats {
                    hits: usize::from(index != 0),
                    misses: usize::from(index == 0),
                })
            );
            let bytes = std::fs::read(&output)?;
            if index == 0 {
                snapshot_a = Some(bytes);
            } else if index == 2 {
                assert_eq!(snapshot_a.as_ref().unwrap(), &bytes);
            }
            let value: serde_json::Value =
                serde_json::from_str(&run_probe(&output, false).await?.unwrap())?;
            assert_eq!(
                value,
                serde_json::json!({"value": expected, "suffix": "embedded",
                "late": late, "frozen": 0, "calls": 1, "initializations": 1})
            );
        }
        // Engine settings are part of Wasmtime's cache identity.
        let mut different_config = config.clone();
        different_config.cranelift_opt_level(wasmtime::OptLevel::None);
        let result = optimize_component_with_options(
            &template,
            &output,
            "wizer-initialize",
            &OptimizeOptions {
                sources: Some(&a),
                engine_config: Some(&different_config),
                cache_config: Some(&cache_config),
                ..Default::default()
            },
        )
        .await?;
        assert_eq!(
            result.compilation_cache,
            Some(CompilationCacheStats { hits: 0, misses: 1 })
        );
        assert_eq!(snapshot_a.as_ref().unwrap(), &std::fs::read(&output)?);

        // Native caching is optional and must not affect the deployable snapshot.
        let result = optimize_component_with_options(
            &template,
            &output,
            "wizer-initialize",
            &OptimizeOptions {
                sources: Some(&a),
                ..Default::default()
            },
        )
        .await?;
        assert_eq!(result.compilation_cache, None);
        assert_eq!(snapshot_a.as_ref().unwrap(), &std::fs::read(&output)?);

        // Damage the disposable artifacts, then let Wasmtime recompile them.
        for directory in std::fs::read_dir(root.join("cache/modules"))? {
            for file in std::fs::read_dir(directory?.path())? {
                let path = file?.path();
                if path.is_file() && path.extension().is_none() {
                    std::fs::write(path, b"truncated")?;
                }
            }
        }
        let options = OptimizeOptions {
            sources: Some(&a),
            engine_config: Some(&config),
            cache_config: Some(&cache_config),
            ..Default::default()
        };
        let result =
            optimize_component_with_options(&template, &output, "wizer-initialize", &options)
                .await?;
        assert_eq!(
            result.compilation_cache,
            Some(CompilationCacheStats { hits: 0, misses: 1 })
        );
        assert_eq!(snapshot_a.as_ref().unwrap(), &std::fs::read(&output)?);

        let parallel_a = root.join("parallel-a.wasm");
        let parallel_b = root.join("parallel-b.wasm");
        let options_b = OptimizeOptions {
            sources: Some(&b),
            ..options
        };
        let (a_result, b_result) = tokio::join!(
            optimize_component_with_options(&template, &parallel_a, "wizer-initialize", &options),
            optimize_component_with_options(&template, &parallel_b, "wizer-initialize", &options_b)
        );
        for result in [a_result?, b_result?] {
            assert_eq!(
                result.compilation_cache,
                Some(CompilationCacheStats { hits: 1, misses: 0 })
            );
        }
        assert_eq!(snapshot_a.as_ref().unwrap(), &std::fs::read(&parallel_a)?);
        optimize_component_with_options(
            &template,
            &output,
            "wizer-initialize",
            &OptimizeOptions {
                sources: Some(&b),
                ..Default::default()
            },
        )
        .await?;
        assert_eq!(std::fs::read(&output)?, std::fs::read(&parallel_b)?);

        // The unchanged template also remains usable by quick slot injection.
        let injected = root.join("injected.wasm");
        let refs: Vec<_> = b.iter().map(String::as_str).collect();
        wasm_rquickjs::inject_js_into_component(&template, &injected, &refs)?;
        let value: serde_json::Value =
            serde_json::from_str(&run_probe(&injected, false).await?.unwrap())?;
        assert_eq!(value["value"], "longer-B");
        assert_eq!(value["late"], "late-B");
        assert!(value["frozen"].as_u64().unwrap() > 0);

        std::fs::remove_file(&output)?;
        for invalid in [
            vec![],
            a[..2].to_vec(),
            [a.clone(), vec!["extra".into()]].concat(),
        ] {
            let error = optimize_component_with_options(
                &template,
                &output,
                "wizer-initialize",
                &OptimizeOptions {
                    sources: Some(&invalid),
                    ..Default::default()
                },
            )
            .await
            .unwrap_err();
            assert!(
                format!("{error:#}").contains("initializer source count"),
                "{error:#}"
            );
            assert!(!output.exists());
        }
        let malformed = vec!["export const = ;".into(), a[1].clone(), a[2].clone()];
        assert!(
            optimize_component_with_options(
                &template,
                &output,
                "wizer-initialize",
                &OptimizeOptions {
                    sources: Some(&malformed),
                    ..Default::default()
                }
            )
            .await
            .is_err()
        );
        assert!(!output.exists());

        // Filesystem absence is catchable even with supplied initializer sources.
        // Reuse compiled code, then execute the snapshot in fresh guest instances.
        let probe = vec![
            r#"
                import fs from 'node:fs';
                const exists = fs.existsSync('/app');
                let calls = 0;
                export function ready() { return 'ready'; }
                export function run() { return JSON.stringify({exists, calls: ++calls}); }
            "#
            .into(),
            a[1].clone(),
            a[2].clone(),
        ];
        let result = optimize_component_with_options(
            &template,
            &output,
            "wizer-initialize",
            &OptimizeOptions {
                sources: Some(&probe),
                engine_config: Some(&config),
                cache_config: Some(&cache_config),
                ..Default::default()
            },
        )
        .await?;
        assert_eq!(
            result.compilation_cache,
            Some(CompilationCacheStats { hits: 1, misses: 0 })
        );
        for _ in 0..2 {
            let value: serde_json::Value =
                serde_json::from_str(&run_probe(&output, false).await?.unwrap())?;
            assert_eq!(value, serde_json::json!({"exists": false, "calls": 1}));
        }
        optimize_component_with_options(
            &template,
            &output,
            "wizer-initialize",
            &OptimizeOptions {
                sources: Some(&a),
                ..Default::default()
            },
        )
        .await?;
        assert_eq!(snapshot_a.as_ref().unwrap(), &std::fs::read(&output)?);
        assert_eq!(original_template, std::fs::read(&template)?);
        Ok(())
    })
}
