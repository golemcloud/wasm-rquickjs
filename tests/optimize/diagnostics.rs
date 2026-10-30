use super::*;

#[test]
fn host_diagnostics_do_not_execute_thrown_values() -> anyhow::Result<()> {
    use wasm_rquickjs::GenerationTarget;
    let temp = Utf8TempDir::new()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    for (target, tier) in [
        (GenerationTarget::WasiP2, "p2,full,test-observability"),
        (GenerationTarget::WasiP3, "full-p3,test-observability"),
    ] {
        let root = temp.path().join(tier.replace(',', "-"));
        let template = build_preinit_template(&root, target, tier)?;
        let input = root.join("input.wasm");
        let output = root.join("optimized.wasm");
        let source = r#"
            import vm from 'node:vm';
            import {inherits} from 'node:util';
            import nodeModule from 'node:module';
            import {startJavaScript} from 'wasm-rquickjs:execution';
            const observe = globalThis.__wasm_rquickjs_test_format_exception;
            const parse = JSON.parse;
            const NativeError = Error;
            const prepare = Error.prepareStackTrace;
            function assert(condition, label) { if (!condition) throw new NativeError(label); }
            export function ready() { return 'ready'; }
            export async function run() {
                let calls = 0;
                function forbidden() { calls++; return 'UNSAFE'; }
                function format(value, hasPending = false, pending = undefined) {
                    const result = parse(observe(value, hasPending, pending));
                    assert(result.preserved, 'exception state was changed');
                    return result.formatted;
                }
                function formattingOrigin() { return new TypeError('native-message'); }
                const original = formattingOrigin();
                let diagnostic = format(original);
                assert(diagnostic.includes('TypeError: native-message'), diagnostic);
                assert(diagnostic.includes('formattingOrigin'), diagnostic);
                function Legacy(message) { this.message = message; NativeError.captureStackTrace(this, Legacy); }
                inherits(Legacy, NativeError); Legacy.prototype.name = 'LegacyError';
                assert(format(new Legacy('legacy-message')).includes('LegacyError: legacy-message'), 'legacy Error prototype');
                const preparedDefault = new NativeError('prepared-default');
                void preparedDefault.stack;
                const preparedText = format(preparedDefault).split('\nStack:\n')[1];
                assert(preparedText.startsWith('Error: prepared-default\n'), 'prepared header');
                assert(!preparedText.startsWith('Error: prepared-default\nError: prepared-default'), 'duplicate header');
                const assigned = new NativeError('assigned'); assigned.stack = 'assigned-text';
                assert(format(assigned).includes('\nStack:\nassigned-text'), 'assigned prepared stack');
                assigned.stack = {toString:forbidden};
                assert(format(assigned).includes('Source location unavailable'), 'prepared object coercion');
                const shadow = Object.create(Object.create({tag:'wrong'}, {tag:{get:forbidden}}));
                assert(!format(shadow).includes('wrong'), 'accessor must shadow inherited data');
                let deep = {tag:'too-deep'};
                for (let i=0; i<9; i++) deep = Object.create(deep);
                assert(!format(deep).includes('too-deep'), 'prototype hop bound');
                assert(format(Object.create({tag:'shallow'})).includes('Error: shallow'), 'safe inherited tag');
                const hostile = new NativeError('hidden');
                for (const key of ['name', 'message', 'stack', 'toJSON', 'toString']) {
                    Object.defineProperty(hostile, key, {get:forbidden, configurable:true});
                }
                hostile[Symbol.toPrimitive] = forbidden;
                diagnostic = format(hostile);
                assert(diagnostic.includes('<message unavailable>'), diagnostic);
                assert(!diagnostic.includes('UNSAFE'), diagnostic);
                const handler = {get:forbidden, getPrototypeOf() { calls++; return null; }, ownKeys:forbidden,
                    getOwnPropertyDescriptor:forbidden};
                assert(format(new Proxy({}, handler)).includes('<Proxy>'), 'proxy');
                const revoked = Proxy.revocable({}, handler); revoked.revoke();
                assert(format(revoked.proxy).includes('<Proxy>'), 'revoked proxy');
                assert(format(Object.create(new Proxy({}, handler))).includes('{}'), 'prototype proxy');
                const prototypeError = new NativeError('prototype-message');
                const beforePrototypeSetup = calls;
                Object.setPrototypeOf(prototypeError, new Proxy({}, handler));
                // The existing public setPrototypeOf shim inspects the new
                // prototype during setup. Only diagnostic reads are measured.
                const afterPrototypeSetup = calls;
                assert(format(prototypeError).includes('prototype-message'), 'Error prototype proxy');
                assert(calls === afterPrototypeSetup, 'formatter inspected prototype proxy');
                calls = beforePrototypeSetup;
                const cyclic = {}; cyclic.self = cyclic; cyclic.toJSON = forbidden;
                diagnostic = format({tag:'Failure', val:cyclic});
                assert(diagnostic.includes('Failure: {') && diagnostic.includes('[Circular]') && diagnostic.includes('<Function>'), diagnostic);
                const taggedAccessor = {get tag() { return forbidden(); }, get val() { return forbidden(); }};
                assert(format(taggedAccessor).includes('[Getter]'), 'tagged accessors');
                Object.defineProperty(taggedAccessor, 'empty', {get:undefined, enumerable:true});
                assert(format(taggedAccessor).includes('"empty": undefined'), 'empty accessor');
                diagnostic = format({code:404, message:'missing'});
                assert(diagnostic.includes('"code": 404') && diagnostic.includes('"message": "missing"'), diagnostic);
                diagnostic = format({tag:'not-found', val:{id:'x', nested:{reason:'missing', deep:{secret:'hidden'}}}});
                assert(diagnostic.includes('not-found: {') && diagnostic.includes('"id": "x"') && diagnostic.includes('"reason": "missing"'), diagnostic);
                assert(diagnostic.includes('"deep": {…}') && !diagnostic.includes('hidden'), 'summary depth budget');
                const shared = {id:'same'};
                diagnostic = format([shared, shared, new NativeError('nested-error'), new Proxy({}, handler)]);
                assert(diagnostic.includes('"id": "same"') && !diagnostic.includes('[Circular]'), diagnostic);
                assert(diagnostic.includes('Error: nested-error') && diagnostic.includes('<Proxy>'), diagnostic);
                const sparse = new Array(0xffffffff);
                sparse[0] = 'first';
                Object.defineProperty(sparse, 1, {get:forbidden});
                Object.defineProperty(sparse, 2, {set:forbidden});
                Object.defineProperty(sparse, 3, {get:forbidden, set:forbidden});
                diagnostic = format(sparse);
                assert(diagnostic.includes('"first", [Getter], [Setter], [Getter/Setter], [empty]') && diagnostic.endsWith(', …]'), diagnostic);
                const wide = {};
                for (let i=0; i<20000; i++) wide['field' + i] = i;
                diagnostic = format(wide);
                assert(diagnostic.includes('"field15": 15') && !diagnostic.includes('"field16"') && diagnostic.endsWith(', …}'), diagnostic);
                const unicode = format({text:'😀'.repeat(2048), ['é'.repeat(300)]:1});
                assert(new TextEncoder().encode(unicode.slice('JavaScript exception: '.length)).byteLength <= 4096 && unicode.includes('…') && !unicode.includes('\ufffd'), 'UTF8 output budget');
                const hooks = {toJSON:forbidden, toString:forbidden, [Symbol.toPrimitive]:forbidden};
                assert(format({hooks}).includes('<Function>'), 'record hooks are data only');
                const hidden = Object.create(null, {hidden:{value:'not-enumerable'}});
                assert(format(hidden).endsWith('{}'), 'record enumerable own keys only');
                for (const pending of [undefined, null, {}]) {
                    assert(format({tag:'pending-record', val:{id:'preserved'}}, true, pending).includes('"id": "preserved"'), 'record pending identity');
                }
                assert(format(Symbol('secret')).includes('<Symbol>'), 'symbol');
                assert(format(1n).includes('<BigInt>'), 'bigint');
                const flat = 'x'.repeat(1024 * 1024);
                let rope = 'x'; for (let i=0; i<20; i++) rope = rope + rope;
                for (const text of [flat, rope]) {
                    assert(format(text).includes('<string exceeds diagnostic limit>'), 'huge string');
                    const oversized = new NativeError(); oversized.message = text;
                    assert(format(oversized).length < 16384, 'huge error message');
                    oversized.stack = text;
                    assert(format(oversized).includes('<string exceeds diagnostic limit>'), 'huge assigned stack');
                    NativeError.prepareStackTrace = () => text;
                    const prepared = new NativeError('huge-prepared');
                    void prepared.stack;
                    assert(format(prepared).includes('<string exceeds diagnostic limit>'), 'huge custom prepared stack');
                    NativeError.prepareStackTrace = prepare;
                }
                NativeError.prepareStackTrace = () => 'custom-prepared-text';
                const custom = new NativeError('custom'); void custom.stack;
                assert(format(custom).includes('\nStack:\ncustom-prepared-text'), 'custom prepared stack');
                NativeError.prepareStackTrace = prepare;
                assert(format('\ud800').includes('\ufffd'), 'lone surrogate string kind');
                assert(format(new NativeError('\ud800')).includes('\ufffd'), 'lone surrogate message');
                function nameFrame() { return new NativeError('named-frame'); }
                Object.defineProperty(nameFrame, 'name', {value:'line\nbreak', configurable:true});
                assert(format(nameFrame()).includes('line break ('), 'frame name sanitization');
                // QuickJS ignores rope-valued function names when capturing;
                // a flat 513-unit name exercises the host field budget.
                Object.defineProperty(nameFrame, 'name', {value:'x'.repeat(513), configurable:true});
                assert(format(nameFrame()).includes('<string exceeds diagnostic limit>'), 'frame name budget');
                const oldLimit = NativeError.stackTraceLimit;
                NativeError.stackTraceLimit = 64;
                function deepOrigin(n) { return n ? deepOrigin(n-1) : new NativeError('deep-frames'); }
                const deepError = deepOrigin(30);
                NativeError.stackTraceLimit = oldLimit;
                assert((format(deepError).match(/\n    at /g) || []).length <= 12, 'frame count budget');
                for (const pending of [undefined, null, {}]) {
                    assert(format(original, true, pending).includes('native-message'), 'pending identity');
                }
                NativeError.prepareStackTrace = forbidden;
                const lazy = new TypeError('lazy-message');
                assert(format(lazy).includes('lazy-message'), 'lazy native stack');
                Object.defineProperty(NativeError, Symbol.hasInstance, {value:forbidden, configurable:true});
                globalThis.Error = new Proxy(NativeError, handler);
                assert(format(original).includes('TypeError: native-message'), 'global Error replacement');
                globalThis.Error = NativeError;
                delete NativeError[Symbol.hasInstance];
                NativeError.prepareStackTrace = prepare;
                const vmError = vm.runInNewContext("new TypeError('vm-native-message')");
                assert(format(vmError).includes('TypeError: vm-native-message'), 'VM native brand');
                const oldRegistry = Object.getOwnPropertyDescriptor(globalThis, '__wasm_rquickjs_simple_source_maps');
                const oldSupport = globalThis.__wasm_rquickjs_source_maps_enabled();
                nodeModule.setSourceMapsSupport(true);
                const registry = Object.create(null);
                const map = new nodeModule.SourceMap({version:3, sources:['original.ts'], names:[], mappings:'AAAA'});
                map.findOrigin = forbidden;
                registry.module = map;
                Object.defineProperty(globalThis, '__wasm_rquickjs_simple_source_maps', {value:registry, writable:true, configurable:true});
                assert(format(original).includes('original.ts:1:'), 'safe data map');
                const decoded = Object.getOwnPropertyDescriptor(map, '_decodedMappings');
                Object.defineProperty(map, '_decodedMappings', {get:forbidden, configurable:true});
                assert(format(original).includes('(module:'), 'unsafe map getter fallback');
                Object.defineProperty(map, '_decodedMappings', decoded);
                map._generatedLineOffset = -1e308;
                assert(format(original).includes('(module:'), 'source map search budget');
                map._generatedLineOffset = 0;
                Object.defineProperty(globalThis, '__wasm_rquickjs_simple_source_maps', {value:new Proxy(registry, handler), writable:true, configurable:true});
                assert(format(original).includes('(module:'), 'proxy registry fallback');
                Object.defineProperty(globalThis, '__wasm_rquickjs_simple_source_maps', {get:forbidden, configurable:true});
                assert(format(original).includes('(module:'), 'registry accessor fallback');
                Object.defineProperty(globalThis, '__wasm_rquickjs_simple_source_maps', {value:registry, writable:true, configurable:true});
                const poison = [[Reflect,'apply'],[Array,'isArray'],[String.prototype,'slice'],
                    [String.prototype,'charCodeAt'],[WeakMap.prototype,'get'],[Math,'floor'],
                    [Number,'isFinite'],[NativeError,'captureStackTrace']];
                const saved = poison.map(([owner,key]) => [owner,key,Object.getOwnPropertyDescriptor(owner,key)]);
                saved.push([NativeError.prototype,'stack',Object.getOwnPropertyDescriptor(NativeError.prototype,'stack')]);
                for (const [owner,key] of poison) Object.defineProperty(owner,key,{value:forbidden, configurable:true});
                Object.defineProperty(NativeError.prototype,'stack',{get:forbidden, configurable:true});
                NativeError.stackTraceLimit = 0;
                const poisonedDiagnostic = format(original);
                const poisonedVm = format(vmError);
                for (const [owner,key,descriptor] of saved) Object.defineProperty(owner,key,descriptor);
                NativeError.stackTraceLimit = oldLimit;
                assert(poisonedDiagnostic.includes('original.ts:1:'), 'captured reader intrinsics');
                assert(poisonedVm.includes('vm-native-message'), 'captured native getter');
                if (oldRegistry) Object.defineProperty(globalThis, '__wasm_rquickjs_simple_source_maps', oldRegistry);
                else delete globalThis.__wasm_rquickjs_simple_source_maps;
                nodeModule.setSourceMapsSupport(oldSupport);
                assert(calls === 0, 'diagnostics executed application code: ' + calls);
                // The real owned-job failure path must use the same formatter.
                const job = startJavaScript({source:`
                    Error.prepareStackTrace = () => { process.stdout.write('UNSAFE'); return 'bad'; };
                    function ownedOrigin() { throw new TypeError('owned-native-message'); }
                    ownedOrigin();
                `});
                let stdout = ''; job.stdout.on('data', chunk => { stdout += chunk; });
                let failed = false;
                try { await job.result; }
                catch (error) {
                    failed = true;
                    assert(error.message.includes('TypeError: owned-native-message'), error.message);
                    assert(error.message.includes('ownedOrigin'), error.message);
                }
                assert(failed && stdout === '', 'owned diagnostic ran prepareStackTrace');
                const recordJob = startJavaScript({source:`throw {tag:'not-found', val:{id:'owned-id'}};`});
                failed = false;
                try { await recordJob.result; }
                catch (error) {
                    failed = true;
                    assert(error.message.includes('not-found: {') && error.message.includes('"id": "owned-id"'), error.message);
                }
                assert(failed, 'owned tagged record must fail');
                assert(format(original).includes('native-message'), 'subsequent formatting');
                return 'ok';
            }
        "#;
        wasm_rquickjs::inject_js_into_component(&template, &input, &[source])?;
        runtime.block_on(optimize_component(&input, &output, "wizer-initialize"))?;
        let filesystem = root.join("filesystem");
        std::fs::create_dir(&filesystem)?;
        for component in [&output, &input] {
            let captured = runtime
                .block_on(run_probe_inner(component, false, Some(&filesystem), None))?
                .unwrap();
            assert_eq!(captured.json, "ok", "{tier}");
            assert!(
                !captured.stdout.contains("UNSAFE"),
                "{tier}: {}",
                captured.stdout
            );
        }
    }
    Ok(())
}

#[test]
fn optimizer_reports_native_exception_origins() -> anyhow::Result<()> {
    use wasm_rquickjs::GenerationTarget;
    let temp = Utf8TempDir::new()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    for (target, tier) in [
        (GenerationTarget::WasiP2, "p2,full"),
        (GenerationTarget::WasiP3, "full-p3"),
    ] {
        let root = temp.path().join(tier.replace(',', "-"));
        let template = build_preinit_template(&root, target, tier)?;
        let input = root.join("input.wasm");
        let output = root.join("optimized.wasm");
        for (source, expected, origin) in [
            (
                "function dependencyOrigin() { throw new TypeError('bootstrap-message'); } dependencyOrigin();",
                "TypeError: bootstrap-message",
                Some("dependencyOrigin"),
            ),
            ("const invalid = /(/;", "SyntaxError", None),
        ] {
            wasm_rquickjs::inject_js_into_component(&template, &input, &[source])?;
            let failure = runtime
                .block_on(optimize_component(&input, &output, "wizer-initialize"))
                .unwrap_err();
            let text = format!("{failure:#}");
            assert!(text.contains(expected), "{tier}: {text}");
            if let Some(origin) = origin {
                assert!(
                    text.contains(&format!("{origin} (module:")),
                    "{tier}: {text}"
                );
            } else {
                assert!(
                    text.contains(
                        "Source location unavailable: the engine supplied no usable native stack."
                    ),
                    "{tier}: {text}"
                );
            }
            assert!(!output.exists());
        }
    }
    Ok(())
}
