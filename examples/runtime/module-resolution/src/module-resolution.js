import assert from 'node:assert';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

async function expectImportError(specifier, code) {
    let thrown = false;
    try {
        await import(specifier);
    } catch (error) {
        thrown = true;
        assert.strictEqual(error && error.code, code, error && error.stack ? error.stack : String(error));
    }
    if (!thrown) {
        throw new Error(`Expected import(${specifier}) to throw ${code}`);
    }
}

async function expectImportRejectsMessage(specifier, pattern) {
    let thrown = false;
    try {
        await import(specifier);
    } catch (error) {
        thrown = true;
        assert.match(String(error && error.message), pattern, error && error.stack ? `${error.message}\n${error.stack}` : String(error));
    }
    if (!thrown) {
        throw new Error(`Expected import(${specifier}) to reject`);
    }
}

async function expectImportRejectsCode(specifier, code) {
    let thrown = false;
    try {
        await import(specifier);
    } catch (error) {
        thrown = true;
        assert.strictEqual(error && error.code, code, error && error.stack ? error.stack : String(error));
    }
    if (!thrown) {
        throw new Error(`Expected import(${specifier}) to reject with ${code}`);
    }
}

function writeImportEntry(path, specifier) {
    fs.writeFileSync(path, `export default await import(${JSON.stringify(specifier)});`);
}

export const testImportMetaResolve = async () => {
    const appDir = '/import-meta-resolve-app';
    const entryUrl = `${pathToFileURL(`${appDir}/entry.mjs`).href}`;
    fs.mkdirSync(`${appDir}/node_modules/pkg-dir`, { recursive: true });

    assert.strictEqual(import.meta.resolve('./local.mjs', entryUrl), `${pathToFileURL(`${appDir}/local.mjs`).href}`);
    assert.strictEqual(import.meta.resolve('node:fs', entryUrl), 'node:fs');
    assert.strictEqual(import.meta.resolve('fs', entryUrl), 'node:fs');
    assert.strictEqual(import.meta.resolve('pkg-dir/', entryUrl), `${pathToFileURL(`${appDir}/node_modules/pkg-dir/`).href}`);
    assert.throws(() => import.meta.resolve('does-not-exist', entryUrl), { code: 'ERR_MODULE_NOT_FOUND' });
    assert.throws(() => import.meta.resolve('./relative.mjs', 'data:text/javascript,'), { code: 'ERR_UNSUPPORTED_RESOLVE_REQUEST' });
    assert.throws(() => import.meta.resolve('../relative.mjs', 'data:text/javascript,'), { code: 'ERR_UNSUPPORTED_RESOLVE_REQUEST' });
    assert.throws(() => import.meta.resolve('does-not-exist', 'data:text/javascript,'), { code: 'ERR_UNSUPPORTED_RESOLVE_REQUEST' });

    const resolvedFromData = await import('data:text/javascript,export default import.meta.resolve("http://example.com/value")');
    assert.strictEqual(resolvedFromData.default, 'http://example.com/value');
    const fileResolvedFromData = await import('data:text/javascript,export default import.meta.resolve("file:///tmp/value.mjs")');
    assert.strictEqual(fileResolvedFromData.default, 'file:///tmp/value.mjs');
    await expectImportRejectsCode(
        'data:text/javascript,export default import.meta.resolve("does-not-exist")',
        'ERR_UNSUPPORTED_RESOLVE_REQUEST',
    );
    return true;
};

export const testEsmPackageMapEdgeCases = async () => {
    try {
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/outside.mjs', 'export default { escaped: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/package.json', JSON.stringify({
            type: 'module',
            main: './main.mjs',
            exports: {
                './public': './public.mjs',
                './encoded-target': './sp%20ce.mjs',
                './deprecated-double': './/public.mjs',
                './pattern-slash*': './subpath*.mjs',
                './trailing-pattern-slash*': './trailing-pattern-slash*index.mjs',
                './folder-pattern*': './folder-pattern*index.mjs',
                './tamper-pattern*': './tamper-pattern*index.mjs',
                './tamper-require*': './tamper-require*index.cjs',
                './shared-warning*': {
                    import: './shared-warning*index.mjs',
                    require: './shared-warning*index.cjs',
                },
                './suppressed-pattern*': './suppressed-pattern*index.mjs',
                './suppressed-require*': './suppressed-require*index.cjs',
                './throwing-pattern*': './throwing-pattern*index.mjs',
                './condition-order': {
                    default: './default.mjs',
                    import: './import.mjs',
                },
                './escape': './../outside.mjs',
                './nested-escape': './sub/../../outside.mjs',
                './node-modules-target': './sub/../node_modules/other/index.mjs',
                './dot-segment-target': './sub/../public.mjs',
                './encoded-dot-target': './%2e%2e/outside.mjs',
                './blocked-null': null,
                './blocked-false': false,
                './array-fallback': [
                    { browser: './browser.mjs' },
                    './public.mjs',
                ],
                './array-blocked': [
                    null,
                    './public.mjs',
                ],
                './array-false-fallback': [
                    false,
                    './public.mjs',
                ],
                './array-missing-first': [
                    './missing.mjs',
                    './public.mjs',
                ],
                './array-invalid-fallback': [
                    '../outside.mjs',
                    './public.mjs',
                ],
                './condition-no-match-fallback': {
                    node: { browser: './browser.mjs' },
                    default: './public.mjs',
                },
                './directory': './subdir',
                './no-ext': './real',
            },
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/main.mjs', 'export default { main: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/private.mjs', 'export default { private: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/public.mjs', 'export default { public: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/sp ce.mjs', 'export default { encoded: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/default.mjs', 'export default { condition: "default" };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/import.mjs', 'export default { condition: "import" };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/trailing-pattern-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/trailing-pattern-slash/index.mjs', 'export default { trailingPattern: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/tamper-pattern-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/tamper-pattern-slash/index.mjs', 'export default { tamperPattern: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/tamper-require-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/tamper-require-slash/index.cjs', 'module.exports = { tamperRequire: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/shared-warning-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/shared-warning-slash/index.mjs', 'export default { sharedWarning: "esm" };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/shared-warning-slash/index.cjs', 'module.exports = { sharedWarning: "cjs" };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/suppressed-pattern-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/suppressed-pattern-slash/index.mjs', 'export default { suppressedPattern: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/suppressed-require-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/suppressed-require-slash/index.cjs', 'module.exports = { suppressedRequire: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/throwing-pattern-slash', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/throwing-pattern-slash/index.mjs', 'export default { throwingPattern: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/folder-pattern/foo', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/folder-pattern/foo/index.mjs', 'export default { folderPattern: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/subpath/dir1', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/subpath/dir1/dir1.mjs', 'export default { patternSlash: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg/subdir', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/subdir/index.mjs', 'export default { directory: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/real.mjs', 'export default { extensionFallback: true };');

        fs.writeFileSync('/esm-package-map-edge-app/entry.mjs', [
            'export const publicValue = (await import("exported-pkg/public")).default;',
            'export const encodedTarget = (await import("exported-pkg/encoded-target")).default;',
            'export const conditionOrder = (await import("exported-pkg/condition-order")).default;',
            'export const arrayFallback = (await import("exported-pkg/array-fallback")).default;',
            'export const arrayBlocked = (await import("exported-pkg/array-blocked")).default;',
            'export const arrayFalseFallback = (await import("exported-pkg/array-false-fallback")).default;',
            'export const arrayInvalidFallback = (await import("exported-pkg/array-invalid-fallback")).default;',
            'export const conditionNoMatchFallback = (await import("exported-pkg/condition-no-match-fallback")).default;',
        ].join('\n'));

        const entry = await import('/esm-package-map-edge-app/entry.mjs');
        assert.deepStrictEqual(entry.publicValue, { public: true });
        assert.deepStrictEqual(entry.encodedTarget, { encoded: true });
        assert.deepStrictEqual(entry.conditionOrder, { condition: 'default' });
        assert.deepStrictEqual(entry.arrayFallback, { public: true });
        assert.deepStrictEqual(entry.arrayBlocked, { public: true });
        assert.deepStrictEqual(entry.arrayFalseFallback, { public: true });
        assert.deepStrictEqual(entry.arrayInvalidFallback, { public: true });
        assert.deepStrictEqual(entry.conditionNoMatchFallback, { public: true });

        assert.strictEqual(Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_emit_package_deprecation_warning'), false);

        const genericDeprecationWarnings = [];
        const onGenericDeprecationWarning = (warning) => {
            if (warning.code === 'DEP0155' && warning.message === 'generic dep0155') {
                genericDeprecationWarnings.push(warning);
            }
        };
        process.on('warning', onGenericDeprecationWarning);
        try {
            process.emitWarning('generic dep0155', 'DeprecationWarning', 'DEP0155');
            process.emitWarning('generic dep0155', 'DeprecationWarning', 'DEP0155');
            await new Promise((resolve) => process.nextTick(resolve));
        } finally {
            process.removeListener('warning', onGenericDeprecationWarning);
        }
        assert.strictEqual(genericDeprecationWarnings.length, 2);

        const packageWarnings = [];
        const onPackageWarning = (warning) => packageWarnings.push(warning);
        process.on('warning', onPackageWarning);
        const originalNoDeprecation = process.noDeprecation;
        const originalNoDeprecationDescriptor = Object.getOwnPropertyDescriptor(process, 'noDeprecation');
        const originalEmitWarning = process.emitWarning;
        const originalBoolean = globalThis.Boolean;
        try {
            writeImportEntry('/esm-package-map-edge-app/deprecated-double-subpath.mjs', 'exported-pkg/deprecated-double');
            writeImportEntry('/esm-package-map-edge-app/pattern-slash-subpath.mjs', 'exported-pkg/pattern-slash/dir1/dir1');
            writeImportEntry('/esm-package-map-edge-app/trailing-pattern-slash-subpath.mjs', 'exported-pkg/trailing-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/trailing-pattern-slash-subpath-duplicate.mjs', 'exported-pkg/trailing-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/folder-pattern-trailing-subpath.mjs', 'exported-pkg/folder-pattern/foo/');
            writeImportEntry('/esm-package-map-edge-app/tamper-pattern-slash-subpath.mjs', 'exported-pkg/tamper-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/suppressed-pattern-slash-subpath.mjs', 'exported-pkg/suppressed-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/suppressed-pattern-slash-subpath-after.mjs', 'exported-pkg/suppressed-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/throwing-pattern-slash-subpath.mjs', 'exported-pkg/throwing-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/shared-warning-subpath.mjs', 'exported-pkg/shared-warning-slash/');
            globalThis.__wasm_rquickjs_suppress_package_deprecation_warnings = 100;
            globalThis.__wasm_rquickjs_package_deprecation_warnings = {
                'DEP0155:/esm-package-map-edge-app/node_modules/exported-pkg:./tamper-pattern-slash/': true,
            };
            globalThis.__wasm_rquickjs_emit_package_deprecation_warning = () => {
                throw new Error('userland package warning helper must not be called');
            };
            try {
                process.noDeprecation = 'yes';
                process.emitWarning = undefined;
                globalThis.Boolean = () => {
                    throw new Error('userland Boolean must not be used for noDeprecation coercion');
                };
                assert.strictEqual(
                    import.meta.resolve(
                        'exported-pkg/suppressed-pattern-slash/',
                        pathToFileURL('/esm-package-map-edge-app/suppressed-resolve-parent.mjs').href,
                    ),
                    'file:///esm-package-map-edge-app/node_modules/exported-pkg/suppressed-pattern-slash/',
                );
                const requireSuppressed = createRequire('/esm-package-map-edge-app/suppressed-require-entry.cjs');
                assert.deepStrictEqual(requireSuppressed('exported-pkg/suppressed-require-slash/'), { suppressedRequire: true });
            } finally {
                process.noDeprecation = originalNoDeprecation;
                process.emitWarning = originalEmitWarning;
                globalThis.Boolean = originalBoolean;
            }
            Object.defineProperty(process, 'noDeprecation', {
                configurable: true,
                get() {
                    throw new Error('noDeprecation getter failed');
                },
            });
            await assert.rejects(
                () => import('/esm-package-map-edge-app/throwing-pattern-slash-subpath.mjs'),
                /noDeprecation getter failed/,
            );
            Object.defineProperty(process, 'noDeprecation', originalNoDeprecationDescriptor || {
                configurable: true,
                enumerable: true,
                writable: true,
                value: originalNoDeprecation,
            });
            process.emitWarning = () => {
                throw new Error('package warning emit failed');
            };
            const requireThrowingWarning = createRequire('/esm-package-map-edge-app/shared-warning-require-entry.cjs');
            assert.throws(
                () => requireThrowingWarning('exported-pkg/shared-warning-slash/'),
                /package warning emit failed/,
            );
            assert.deepStrictEqual(
                (await import('/esm-package-map-edge-app/shared-warning-subpath.mjs')).default.default,
                { sharedWarning: 'esm' },
            );
            process.emitWarning = function emitWarningWithProcessThis(...args) {
                assert.strictEqual(this, process);
                return originalEmitWarning.apply(this, args);
            };
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/deprecated-double-subpath.mjs')).default.default, { public: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/pattern-slash-subpath.mjs')).default.default, { patternSlash: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/trailing-pattern-slash-subpath.mjs')).default.default, { trailingPattern: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/trailing-pattern-slash-subpath-duplicate.mjs')).default.default, { trailingPattern: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/folder-pattern-trailing-subpath.mjs')).default.default, { folderPattern: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/tamper-pattern-slash-subpath.mjs')).default.default, { tamperPattern: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/suppressed-pattern-slash-subpath-after.mjs')).default.default, { suppressedPattern: true });
            const require = createRequire('/esm-package-map-edge-app/require-entry.cjs');
            assert.deepStrictEqual(require('exported-pkg/tamper-require-slash/'), { tamperRequire: true });
            await new Promise((resolve) => process.nextTick(resolve));
        } finally {
            delete globalThis.__wasm_rquickjs_suppress_package_deprecation_warnings;
            delete globalThis.__wasm_rquickjs_package_deprecation_warnings;
            delete globalThis.__wasm_rquickjs_emit_package_deprecation_warning;
            Object.defineProperty(process, 'noDeprecation', originalNoDeprecationDescriptor || {
                configurable: true,
                enumerable: true,
                writable: true,
                value: originalNoDeprecation,
            });
            process.emitWarning = originalEmitWarning;
            globalThis.Boolean = originalBoolean;
            process.removeListener('warning', onPackageWarning);
        }
        assert.deepStrictEqual(packageWarnings.map((warning) => warning.code), ['DEP0166', 'DEP0166', 'DEP0155', 'DEP0155', 'DEP0155', 'DEP0155', 'DEP0155']);
        assert.match(packageWarnings[0].stack, /DeprecationWarning: Use of deprecated double slash/);
        assert.match(packageWarnings[0].message, /package\.json imported from \/esm-package-map-edge-app\/deprecated-double-subpath\.mjs\./);
        assert.match(packageWarnings[1].message, /matched to "\.\/pattern-slash\*"/);
        assert.match(packageWarnings[1].message, /package\.json imported from \/esm-package-map-edge-app\/pattern-slash-subpath\.mjs\./);
        assert.match(packageWarnings[2].stack, /DeprecationWarning: Use of deprecated trailing slash pattern mapping/);
        assert.match(packageWarnings[2].message, /package\.json imported from \/esm-package-map-edge-app\/trailing-pattern-slash-subpath\.mjs\./);
        assert.match(packageWarnings[3].message, /folder-pattern\/foo\//);
        assert.match(packageWarnings[3].message, /package\.json imported from \/esm-package-map-edge-app\/folder-pattern-trailing-subpath\.mjs\./);
        assert.match(packageWarnings[4].message, /tamper-pattern-slash\//);
        assert.match(packageWarnings[4].message, /package\.json imported from \/esm-package-map-edge-app\/tamper-pattern-slash-subpath\.mjs\./);
        assert.match(packageWarnings[5].message, /suppressed-pattern-slash\//);
        assert.match(packageWarnings[5].message, /package\.json imported from \/esm-package-map-edge-app\/suppressed-pattern-slash-subpath-after\.mjs\./);
        assert.match(packageWarnings[6].message, /tamper-require-slash\//);
        assert.match(packageWarnings[6].message, /package\.json\./);

        fs.mkdirSync('/esm-package-map-edge-app/node_modules/no-exports-warn', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-warn/package.json', JSON.stringify({
            type: 'module',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-warn/index.js', 'export default { indexFallback: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-warn/foo.js', 'export default { exactSubpath: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-warn/sp ce.js', 'export default { encodedSpace: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/no-exports-warn/dir', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-warn/dir/index.js', 'export default { directorySubpath: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/main-extension-warn', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/main-extension-warn/package.json', JSON.stringify({
            type: 'module',
            main: 'index',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/main-extension-warn/index.js', 'export default { mainExtensionFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/main-directory-warn/dir', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/main-directory-warn/package.json', JSON.stringify({
            type: 'module',
            main: 'dir',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/main-directory-warn/dir/index.js', 'export default { mainDirectoryFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/no-exports-mjs-only', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-mjs-only/package.json', JSON.stringify({
            type: 'module',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-mjs-only/index.mjs', 'export default { indexFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/main-extension-mjs-only', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/main-extension-mjs-only/package.json', JSON.stringify({
            type: 'module',
            main: 'index',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/main-extension-mjs-only/index.mjs', 'export default { mainExtensionFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/no-package-mjs-only', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-package-mjs-only/index.mjs', 'export default { indexFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/default-main-mjs-only', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/default-main-mjs-only/package.json', JSON.stringify({
            main: 'index',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/default-main-mjs-only/index.mjs', 'export default { mainExtensionFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/commonjs-main-mjs-only', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/commonjs-main-mjs-only/package.json', JSON.stringify({
            type: 'commonjs',
            main: 'index',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/commonjs-main-mjs-only/index.mjs', 'export default { mainExtensionFallback: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/no-exports-native-only', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-native-only/package.json', JSON.stringify({
            type: 'module',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/no-exports-native-only/index.node', 'not a native addon');

        const fallbackWarnings = [];
        const onFallbackWarning = (warning) => fallbackWarnings.push(warning);
        process.on('warning', onFallbackWarning);
        try {
            writeImportEntry('/esm-package-map-edge-app/no-exports-warn-entry.mjs', 'no-exports-warn');
            writeImportEntry('/esm-package-map-edge-app/no-exports-exact-subpath.mjs', 'no-exports-warn/foo.js');
            writeImportEntry('/esm-package-map-edge-app/no-exports-encoded-space-subpath.mjs', 'no-exports-warn/sp%20ce.js');
            writeImportEntry('/esm-package-map-edge-app/main-extension-warn-entry.mjs', 'main-extension-warn');
            writeImportEntry('/esm-package-map-edge-app/main-directory-warn-entry.mjs', 'main-directory-warn');
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/no-exports-warn-entry.mjs')).default.default, { indexFallback: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/no-exports-exact-subpath.mjs')).default.default, { exactSubpath: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/no-exports-encoded-space-subpath.mjs')).default.default, { encodedSpace: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/main-extension-warn-entry.mjs')).default.default, { mainExtensionFallback: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/main-directory-warn-entry.mjs')).default.default, { mainDirectoryFallback: true });
            await new Promise((resolve) => process.nextTick(resolve));
        } finally {
            process.removeListener('warning', onFallbackWarning);
        }
        assert.deepStrictEqual(fallbackWarnings.map((warning) => warning.code), ['DEP0151', 'DEP0151', 'DEP0151']);
        assert.match(fallbackWarnings[0].message, /no-exports-warn\/ resolving the main entry point "index\.js", imported from \/esm-package-map-edge-app\/no-exports-warn-entry\.mjs\.\nDefault "index" lookups/);
        assert.match(fallbackWarnings[1].message, /main-extension-warn\/ has a "main" field set to "index".*resolved file at "index\.js", imported from \/esm-package-map-edge-app\/main-extension-warn-entry\.mjs\.\nAutomatic extension resolution/);
        assert.match(fallbackWarnings[2].message, /main-directory-warn\/ has a "main" field set to "dir".*resolved file at "dir\/index\.js", imported from \/esm-package-map-edge-app\/main-directory-warn-entry\.mjs\.\nAutomatic extension resolution/);

        writeImportEntry('/esm-package-map-edge-app/no-exports-mjs-only-entry.mjs', 'no-exports-mjs-only');
        writeImportEntry('/esm-package-map-edge-app/main-extension-mjs-only-entry.mjs', 'main-extension-mjs-only');
        writeImportEntry('/esm-package-map-edge-app/no-package-mjs-only-entry.mjs', 'no-package-mjs-only');
        writeImportEntry('/esm-package-map-edge-app/default-main-mjs-only-entry.mjs', 'default-main-mjs-only');
        writeImportEntry('/esm-package-map-edge-app/commonjs-main-mjs-only-entry.mjs', 'commonjs-main-mjs-only');
        writeImportEntry('/esm-package-map-edge-app/no-exports-native-only-entry.mjs', 'no-exports-native-only');
        writeImportEntry('/esm-package-map-edge-app/no-exports-missing-subpath.mjs', 'no-exports-warn/missing');
        writeImportEntry('/esm-package-map-edge-app/no-exports-no-ext-subpath.mjs', 'no-exports-warn/foo');
        writeImportEntry('/esm-package-map-edge-app/no-exports-dir-subpath.mjs', 'no-exports-warn/dir');
        writeImportEntry('/esm-package-map-edge-app/no-exports-encoded-slash-subpath.mjs', 'no-exports-warn/a%2Fb.js');
        writeImportEntry('/esm-package-map-edge-app/no-exports-encoded-backslash-subpath.mjs', 'no-exports-warn/a%5Cb.js');
        writeImportEntry('/esm-package-map-edge-app/missing-root.mjs', 'exported-pkg');
        writeImportEntry('/esm-package-map-edge-app/private-subpath.mjs', 'exported-pkg/private.mjs');
        writeImportEntry('/esm-package-map-edge-app/escape-subpath.mjs', 'exported-pkg/escape');
        writeImportEntry('/esm-package-map-edge-app/nested-escape-subpath.mjs', 'exported-pkg/nested-escape');
        writeImportEntry('/esm-package-map-edge-app/node-modules-target-subpath.mjs', 'exported-pkg/node-modules-target');
        writeImportEntry('/esm-package-map-edge-app/dot-segment-target-subpath.mjs', 'exported-pkg/dot-segment-target');
        writeImportEntry('/esm-package-map-edge-app/encoded-dot-target-subpath.mjs', 'exported-pkg/encoded-dot-target');
        writeImportEntry('/esm-package-map-edge-app/blocked-null-subpath.mjs', 'exported-pkg/blocked-null');
        writeImportEntry('/esm-package-map-edge-app/blocked-false-subpath.mjs', 'exported-pkg/blocked-false');
        writeImportEntry('/esm-package-map-edge-app/array-missing-first-subpath.mjs', 'exported-pkg/array-missing-first');
        writeImportEntry('/esm-package-map-edge-app/directory-subpath.mjs', 'exported-pkg/directory');
        writeImportEntry('/esm-package-map-edge-app/no-ext-subpath.mjs', 'exported-pkg/no-ext');

        await expectImportError('/esm-package-map-edge-app/no-exports-mjs-only-entry.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/main-extension-mjs-only-entry.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/no-package-mjs-only-entry.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/default-main-mjs-only-entry.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/commonjs-main-mjs-only-entry.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/no-exports-native-only-entry.mjs', 'ERR_UNKNOWN_FILE_EXTENSION');
        await expectImportError('/esm-package-map-edge-app/no-exports-missing-subpath.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/no-exports-no-ext-subpath.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/no-exports-dir-subpath.mjs', 'ERR_UNSUPPORTED_DIR_IMPORT');
        await expectImportError('/esm-package-map-edge-app/no-exports-encoded-slash-subpath.mjs', 'ERR_INVALID_MODULE_SPECIFIER');
        await expectImportError('/esm-package-map-edge-app/no-exports-encoded-backslash-subpath.mjs', 'ERR_INVALID_MODULE_SPECIFIER');
        await expectImportError('/esm-package-map-edge-app/missing-root.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/private-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/escape-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/nested-escape-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/node-modules-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/dot-segment-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/encoded-dot-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/blocked-null-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/blocked-false-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/array-missing-first-subpath.mjs', 'ERR_MODULE_NOT_FOUND');
        await expectImportError('/esm-package-map-edge-app/directory-subpath.mjs', 'ERR_UNSUPPORTED_DIR_IMPORT');
        await expectImportError('/esm-package-map-edge-app/no-ext-subpath.mjs', 'ERR_MODULE_NOT_FOUND');

        fs.mkdirSync('/esm-package-map-edge-app/node_modules/external-pkg', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/external-pkg/package.json', JSON.stringify({
            type: 'module',
            exports: './index.mjs',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/external-pkg/index.mjs', 'export default { external: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/dep', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/package.json', JSON.stringify({
            imports: {
                '#app-alias': './app-alias.mjs',
                '#external': 'external-pkg',
                '#fs': 'node:fs',
                '#false-target': false,
                '#array-false-fallback': [
                    false,
                    './app-alias.mjs',
                ],
            },
        }));
        fs.writeFileSync('/esm-package-map-edge-app/app-alias.mjs', 'export default { appAlias: true };');
        fs.writeFileSync('/esm-package-map-edge-app/imports-entry.mjs', [
            'import external from "#external";',
            'import arrayFalseFallback from "#array-false-fallback";',
            'import fs from "#fs";',
            'export default external;',
            'export const arrayFalseFallbackValue = arrayFalseFallback;',
            'export const readFileSyncType = typeof fs.readFileSync;',
        ].join('\n'));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/dep/package.json', JSON.stringify({
            type: 'module',
            exports: './index.js',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/dep/index.js', [
            'import appAlias from "#app-alias";',
            'export default appAlias;',
        ].join('\n'));
        fs.writeFileSync('/esm-package-map-edge-app/imports-boundary-entry.mjs', 'export default await import("dep");');

        const importsEntry = await import('/esm-package-map-edge-app/imports-entry.mjs');
        assert.deepStrictEqual(importsEntry.default, { external: true });
        assert.deepStrictEqual(importsEntry.arrayFalseFallbackValue, { appAlias: true });
        assert.strictEqual(importsEntry.readFileSyncType, 'function');
        fs.writeFileSync('/esm-package-map-edge-app/imports-false-entry.mjs', 'export default await import("#false-target");');
        await expectImportError('/esm-package-map-edge-app/imports-false-entry.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/imports-boundary-entry.mjs', 'ERR_PACKAGE_IMPORT_NOT_DEFINED');

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testEsmEncodedRelativePaths = async () => {
    try {
        fs.mkdirSync('/esm-encoded-relative-app/sub', { recursive: true });
        fs.writeFileSync('/esm-encoded-relative-app/sub/test-esm-ok.mjs', 'export default "ok";');
        fs.writeFileSync('/esm-encoded-relative-app/sub/test-esm-comma,.mjs', 'export default "comma";');
        fs.writeFileSync('/esm-encoded-relative-app/sub/test-esm-double-encoding-native%20.mjs', 'export default "percent";');
        fs.writeFileSync('/esm-encoded-relative-app/sub/blocked.mjs', 'export default "blocked";');
        fs.writeFileSync('/esm-encoded-relative-app/entry.mjs', [
            'import ok from "./sub/test-%65%73%6d-ok.mjs";',
            'import comma from "./sub/test-esm-comma%2c.mjs";',
            'import percent from "./sub/test-esm-double-encoding-native%2520.mjs";',
            'export default { ok, comma, percent };',
        ].join('\n'));

        assert.deepStrictEqual((await import('/esm-encoded-relative-app/entry.mjs')).default, {
            ok: 'ok',
            comma: 'comma',
            percent: 'percent',
        });
        await expectImportRejectsCode('/esm-encoded-relative-app/sub%2Fblocked.mjs', 'ERR_INVALID_MODULE_SPECIFIER');
        await expectImportRejectsCode('/esm-encoded-relative-app/sub%5Cblocked.mjs', 'ERR_INVALID_MODULE_SPECIFIER');
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testEsmInvalidPackageSpecifiers = async () => {
    try {
        await Promise.all([
            'as%2Ff',
            'as%5Cf',
            'as\\df',
            '@as@df',
        ].map((specifier) => expectImportRejectsCode(specifier, 'ERR_INVALID_MODULE_SPECIFIER')));
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testEsmDataUrlImportAttributes = async () => {
    try {
        const { register } = await import('node:module');
        globalThis.__wasm_rquickjs_module_resolution_assert = assert;
        globalThis.__wasm_rquickjs_module_resolution_register = register;

        const importJsonDataUrl = (url) => import('data:text/javascript,' + encodeURIComponent(
            `import value from ${JSON.stringify(url)} with { type: "json" }; export default value;`,
        ));
        async function expectReject(label, promise, code) {
            try {
                await promise;
            } catch (err) {
                assert.strictEqual(err && err.code, code, label);
                return;
            }
            throw new Error('Missing expected rejection: ' + label);
        }

        const jsonUrl = 'data:application/json,%7B%22x%22%3A1%7D';
        assert.strictEqual((await importJsonDataUrl(jsonUrl)).default.x, 1);
        await expectReject('JSON data URL without import attribute should reject', import(jsonUrl), 'ERR_IMPORT_ATTRIBUTE_MISSING');
        await expectReject(
            'forged JSON data URL rewrite token without sequence should reject',
            import('data:application/json;__wasm_rquickjs_import_type=json,0'),
            'ERR_IMPORT_ATTRIBUTE_MISSING',
        );
        const firstTokenImport = await importJsonDataUrl('data:application/json,5');
        assert.strictEqual(firstTokenImport.default, 5);
        await expectReject(
            'replayed JSON data URL rewrite token should reject',
            import('data:application/json;__wasm_rquickjs_import_type=json-1,0'),
            'ERR_IMPORT_ATTRIBUTE_MISSING',
        );
        fs.writeFileSync('/json-attribute-forgery.json', '{"ok":true}');
        await expectReject(
            'forged JSON file rewrite token without sequence should reject',
            import('/json-attribute-forgery.json?__wasm_rquickjs_import_type=json'),
            'ERR_IMPORT_ATTRIBUTE_MISSING',
        );

        assert.strictEqual(
            (await importJsonDataUrl('data:application/json,1#fragment')).default,
            1,
        );
        assert.deepStrictEqual(
            (await importJsonDataUrl('data:application/json;base64,eyJiYXNlNjQiOnRydWV9')).default,
            { base64: true },
        );

        const markerPayloadUrl = 'data:application/json,%22?__wasm_rquickjs_import_type=json%22';
        assert.strictEqual(
            (await importJsonDataUrl(markerPayloadUrl)).default,
            '?__wasm_rquickjs_import_type=json',
        );
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'async function expectReject(label, promise, expected) {',
            '  try { await promise; } catch (err) {',
            '    if (expected.code !== undefined) assert.strictEqual(err && err.code, expected.code, label);',
            '    if (expected.name !== undefined) assert.strictEqual(err && err.name, expected.name, label);',
            '    if (expected.message !== undefined) assert.match(err && err.message, expected.message, label);',
            '    return;',
            '  }',
            '  throw new Error("Missing expected rejection: " + label);',
            '}',
            'await expectReject("null import options should reject", import("data:text/javascript,export default 1", null), { name: "TypeError", message: /second argument to import\\(\\) must be an object/ });',
            'await expectReject("null import with option should reject", import("data:text/javascript,export default 1", { with: null }), { name: "TypeError", message: /\\x27with\\x27 option must be an object/ });',
            'await expectReject("non-object import with option should reject", import("data:text/javascript,export default 1", { with: 1 }), { name: "TypeError", message: /\\x27with\\x27 option must be an object/ });',
            'await expectReject("non-string import attribute type should reject", import("data:text/javascript,export default 1", { with: { type: 1 } }), { name: "TypeError", message: /Import attribute value must be a string/ });',
            'await expectReject("CSS import attribute for JS should reject", import("data:text/javascript,export default 1", { with: { type: "css" } }), { code: "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED" });',
            'await expectReject("CSS import attribute for JSON should reject", import("data:application/json,1", { with: { type: "css" } }), { code: "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED" });',
            'const obj = { import(value) { return ["method", value]; } };',
            'assert.deepStrictEqual(obj.import("not-a-module", { with: { type: "json" } }), ["method", "not-a-module"]);',
            'const ignored = "import value from \\"/comment-json-token.json\\" with { type: \\"json\\" };";',
            '// import value from "/comment-json-token.json" with { type: "json" };',
            'let withGets = 0;',
            'let ownKeys = 0;',
            'let typeGets = 0;',
            'const attrs = new Proxy({ type: "json" }, {',
            '  ownKeys(target) { ownKeys++; return Reflect.ownKeys(target); },',
            '  getOwnPropertyDescriptor(target, prop) { return Reflect.getOwnPropertyDescriptor(target, prop); },',
            '  get(target, prop, receiver) {',
            '    if (prop === "type") typeGets++;',
            '    return Reflect.get(target, prop, receiver);',
            '  },',
            '});',
            'const optionsProxy = new Proxy({}, {',
            '  get(_target, prop) {',
            '    if (prop === "with") withGets++;',
            '    return prop === "with" ? attrs : undefined;',
            '  },',
            '});',
            'assert.strictEqual((await import("data:application/json,9", optionsProxy)).default, 9);',
            'assert.deepStrictEqual({ withGets, ownKeys, typeGets }, { withGets: 1, ownKeys: 1, typeGets: 1 });',
        ].join('\n')));
        await expectReject(
            'late static JSON rewrite token should not authorize future file import',
            import('data:text/javascript,' + encodeURIComponent(
                'import value from "/late-json-token.json" with { type: "json" }; export default value;',
            )),
            'ERR_MODULE_NOT_FOUND',
        );
        fs.writeFileSync('/late-json-token.json', '{"late":true}');
        for (let token = 1; token <= 100; token++) {
            await expectReject(
                'late JSON rewrite token replay should reject',
                import(`/late-json-token.json?__wasm_rquickjs_import_type=json-${token}`),
                'ERR_IMPORT_ATTRIBUTE_MISSING',
            );
        }
        fs.writeFileSync('/comment-json-token.json', '{"comment":true}');
        for (let token = 1; token <= 100; token++) {
            await expectReject(
                'commented JSON rewrite token should not authorize import',
                import(`/comment-json-token.json?__wasm_rquickjs_import_type=json-${token}`),
                'ERR_IMPORT_ATTRIBUTE_MISSING',
            );
        }
        fs.writeFileSync('/static-non-string-attr.js', 'export default 1;');
        let staticNonStringRejected = false;
        try {
            await import('data:text/javascript,' + encodeURIComponent(
                'import value from "/static-non-string-attr.js" with { type: 1 }; export default value;',
            ));
        } catch (err) {
            assert.strictEqual(err && err.name, 'SyntaxError', 'static non-string import attribute should reject');
            staticNonStringRejected = true;
        }
        if (!staticNonStringRejected) {
            throw new Error('Missing expected rejection: static non-string import attribute should reject');
        }
        fs.mkdirSync('/json-pkg-attrs-app/node_modules/json-pkg', { recursive: true });
        fs.writeFileSync(
            '/json-pkg-attrs-app/node_modules/json-pkg/package.json',
            JSON.stringify({ exports: './data.json' }),
        );
        fs.writeFileSync('/json-pkg-attrs-app/node_modules/json-pkg/data.json', '{"pkg":true}');
        fs.mkdirSync('/json-pkg-attrs-app/node_modules/js-pkg', { recursive: true });
        fs.writeFileSync(
            '/json-pkg-attrs-app/node_modules/js-pkg/package.json',
            JSON.stringify({ exports: './index.mjs' }),
        );
        fs.writeFileSync('/json-pkg-attrs-app/node_modules/js-pkg/index.mjs', 'export default { js: true };');
        fs.writeFileSync(
            '/json-pkg-attrs-app/main.mjs',
            'import value from "json-pkg" with { type: "json" }; export default value;',
        );
        assert.deepStrictEqual((await import('/json-pkg-attrs-app/main.mjs')).default, { pkg: true });
        fs.writeFileSync(
            '/json-pkg-attrs-app/dynamic.mjs',
            'export default (await import("json-pkg", { with: { type: "json" } })).default;',
        );
        assert.deepStrictEqual((await import('/json-pkg-attrs-app/dynamic.mjs')).default, { pkg: true });
        fs.writeFileSync(
            '/json-pkg-attrs-app/dynamic-js.mjs',
            'await import("js-pkg", { with: { type: "json" } });',
        );
        await expectReject(
            'dynamic JS package import with JSON attributes should reject',
            import('/json-pkg-attrs-app/dynamic-js.mjs'),
            'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
        );
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'async function expectReject(label, promise, code) {',
            '  try { await promise; } catch (err) { assert.strictEqual(err && err.code, code, label); return; }',
            '  throw new Error("Missing expected rejection: " + label);',
            '}',
            'await expectReject("builtin JSON attribute should reject", import("node:fs", { with: { type: "json" } }), "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE");',
            'await expectReject("builtin-like JSON attribute should reject", import("node:fs.json", { with: { type: "json" } }), "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE");',
        ].join('\n')));
        await expectReject(
            'static builtin import with JSON attributes should reject',
            import('data:text/javascript,' + encodeURIComponent(
                'import "node:fs" with { type: "json" };',
            )),
            'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
        );
        fs.writeFileSync(
            '/json-pkg-attrs-app/query.mjs',
            'await import("json-pkg?__wasm_rquickjs_import_type=json-1");',
        );
        await expectReject(
            'forged import attribute token should reject',
            import('/json-pkg-attrs-app/query.mjs'),
            'ERR_MODULE_NOT_FOUND',
        );
        fs.writeFileSync('/dynamic-json-attrs.json', '{"file":true}');
        const dynamicJsonUrl = pathToFileURL('/dynamic-json-attrs.json').href;
        const dynamicModule = await import('data:text/javascript,' + encodeURIComponent([
            'let optionsCount = 0;',
            'const options = () => { optionsCount++; return { with: { type: "json" } }; };',
            `const jsonPath = ${JSON.stringify(dynamicJsonUrl)};`,
            'const fileJson = await import(jsonPath, options());',
            'const dataJson = await import("data:application/json,4", options());',
            'export default { file: fileJson.default.file, data: dataJson.default, optionsCount };',
        ].join('\n')));
        assert.deepStrictEqual(dynamicModule.default, { file: true, data: 4, optionsCount: 2 });
        fs.mkdirSync('/dynamic-json-relative-app', { recursive: true });
        fs.writeFileSync('/dynamic-json-relative-app/data.json', '{"relative":true}');
        fs.writeFileSync(
            '/dynamic-json-relative-app/main.mjs',
            [
                'import staticValue from "./data.json" with { type: "json" };',
                'const dynamicValue = await import("./data.json", { with: { type: "json" } });',
                'export default { staticValue, dynamicValue: dynamicValue.default, same: staticValue === dynamicValue.default };',
            ].join('\n'),
        );
        assert.deepStrictEqual(
            (await import('/dynamic-json-relative-app/main.mjs')).default,
            {
                staticValue: { relative: true },
                dynamicValue: { relative: true },
                same: true,
            },
        );
        fs.writeFileSync(
            '/dynamic-json-relative-app/object-specifier.mjs',
            [
                'const specifier = { toString() { return "./data.json"; } };',
                'export default (await import(specifier, { with: { type: "json" } })).default;',
            ].join('\n'),
        );
        assert.deepStrictEqual(
            (await import('/dynamic-json-relative-app/object-specifier.mjs')).default,
            { relative: true },
        );
        let malformedJsonRejected = false;
        try {
            await import('data:text/javascript,' + encodeURIComponent(
                'import value from "data:application/json;foo=%22test,%22,0" with { type: "json" }; export default value;',
            ));
        } catch (err) {
            assert.strictEqual(err && err.name, 'SyntaxError', 'malformed JSON data URL should reject');
            assert.match(err && err.message, /Unterminated string in JSON at position 3/, 'malformed JSON data URL should reject');
            malformedJsonRejected = true;
        }
        if (!malformedJsonRejected) {
            throw new Error('Missing expected rejection: malformed JSON data URL should reject');
        }
        fs.writeFileSync('/dynamic-json-relative-app/assertionless.json', '{"ofLife":42}');
        const assertionlessJsonUrl = pathToFileURL('/dynamic-json-relative-app/assertionless.json').href;
        const assertionlessJsonQueryUrl = `${assertionlessJsonUrl}?cache#frag`;
        globalThis.__assertionlessJsonEnabled = true;
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'globalThis.__assertionlessJsonSeen = [];',
            'function resolve(specifier, context, next) {',
            '  const noType = context.importAttributes.type == null;',
            '  const result = next(specifier, context);',
            '  const finish = (result) => {',
            '  const resultUrl = String(result.url);',
            '  let pathname = "";',
            '  try { pathname = new URL(resultUrl, resultUrl.startsWith("/") ? "file:///" : context.parentURL).pathname; } catch (_) {}',
            '  if (globalThis.__assertionlessJsonEnabled !== false && noType && (pathname.endsWith("/assertionless.json") || (resultUrl.startsWith("data:application/json") && resultUrl.includes("ofLife")))) {',
            '    result.importAttributes = Object.assign({}, result.importAttributes || context.importAttributes, { type: "json" });',
            '  }',
            '  globalThis.__assertionlessJsonSeen.push({ specifier, url: result.url, contextImportAttributes: context.importAttributes, resultImportAttributes: result.importAttributes });',
            '  return result;',
            '  };',
            '  return result && typeof result.then === "function" ? result.then(finish) : finish(result);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + resolve));',
            'const [filePlain, fileTyped] = await Promise.all([',
            `  import(${JSON.stringify(assertionlessJsonUrl)}),`,
            `  import(${JSON.stringify(assertionlessJsonUrl)}, { with: { type: "json" } }),`,
            ']);',
            'assert.strictEqual(filePlain, fileTyped, JSON.stringify(globalThis.__assertionlessJsonSeen));',
            'assert.strictEqual(filePlain.default, fileTyped.default, JSON.stringify(globalThis.__assertionlessJsonSeen));',
            'assert.deepStrictEqual(filePlain.default, { ofLife: 42 });',
            `const filePlainAgain = await import(${JSON.stringify(assertionlessJsonUrl)});`,
            `const fileTypedAgain = await import(${JSON.stringify(assertionlessJsonUrl)}, { with: { type: "json" } });`,
            'assert.strictEqual(filePlainAgain, filePlain);',
            'assert.strictEqual(fileTypedAgain, filePlain);',
            'const [queryPlain, queryTyped] = await Promise.all([',
            `  import(${JSON.stringify(assertionlessJsonQueryUrl)}),`,
            `  import(${JSON.stringify(assertionlessJsonQueryUrl)}, { with: { type: "json" } }),`,
            ']);',
            'assert.strictEqual(queryPlain, queryTyped);',
            'assert.deepStrictEqual(queryPlain.default, { ofLife: 42 });',
            'const dataPlain = await import("data:application/json,{%22ofLife%22:42}");',
            'const dataTyped = await import("data:application/json,{%22ofLife%22:42}", { with: { type: "json" } });',
            'assert.deepStrictEqual(dataPlain.default, { ofLife: 42 });',
            'assert.deepStrictEqual(dataTyped.default, { ofLife: 42 });',
            'globalThis.__assertionlessJsonEnabled = false;',
        ].join('\n')));
        for (let token = 1; token <= 100; token++) {
            await expectReject(
                `assertionless JSON superseded rewrite token should not authorize import: ${token}`,
                import(`/dynamic-json-relative-app/assertionless.json?__wasm_rquickjs_import_type=json-${token}`),
                'ERR_IMPORT_ATTRIBUTE_MISSING',
            );
        }
        await expectReject(
            'JSON file imported with attributes should still reject without attributes after assertionless hook is disabled',
            import('/dynamic-json-relative-app/assertionless.json'),
            'ERR_IMPORT_ATTRIBUTE_MISSING',
        );
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'let seed = 0;',
            'function resolve(specifier, context, next) {',
            '  const result = next(specifier, context);',
            '  const finish = (result) => {',
            '  const resultUrl = String(result.url);',
            '  const url = new URL(resultUrl, resultUrl.startsWith("/") ? "file:///" : context.parentURL);',
            '  if (url.pathname.endsWith("/dynamic-json-relative-app/data.json")) {',
            '    url.searchParams.set("seed", String(++seed));',
            '    return Object.assign({}, result, { url: url.href });',
            '  }',
            '  return result;',
            '  };',
            '  return result && typeof result.then === "function" ? result.then(finish) : finish(result);',
            '}',
            'function load(url, context, next) {',
            '  if (context.importAttributes.type === "json" && url.includes("/dynamic-json-relative-app/data.json")) {',
            '    const value = new URL(url).searchParams.get("seed");',
            '    return { shortCircuit: true, format: "json", source: JSON.stringify({ value }) };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("let seed = 0; export " + resolve + ";export " + load));',
            `const first = await import(${JSON.stringify(pathToFileURL('/dynamic-json-relative-app/data.json').href)}, { with: { type: "json" } });`,
            `const second = await import(${JSON.stringify(pathToFileURL('/dynamic-json-relative-app/data.json').href)}, { with: { type: "json" } });`,
            'assert.notDeepStrictEqual(first.default, second.default);',
            'assert.deepStrictEqual(first.default, { value: "1" });',
            'assert.deepStrictEqual(second.default, { value: "2" });',
        ].join('\n')));
        fs.mkdirSync('/loader-relative-app', { recursive: true });
        fs.writeFileSync('/loader-relative-app/data.json', '{"hookRelative":true}');
        fs.writeFileSync(
            '/loader-relative-app/main.mjs',
            'export default (await import("./data.json", { with: { type: "json" } })).default;',
        );
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'function resolve(specifier, context, next) {',
            '  if (specifier === "data:text/javascript,export default 5") {',
            '    if (JSON.stringify(context.importAttributes) !== "{}") throw new Error("plain import should pass empty import attributes");',
            '  }',
            '  if (String(context.parentURL).endsWith("/loader-relative-app/main.mjs")) {',
            '    if (specifier !== "./data.json") throw new Error("resolve hook did not receive original relative specifier");',
            '    globalThis.__loader_relative_seen = true;',
            '  }',
            '  return next(specifier, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + resolve));',
            `assert.deepStrictEqual((await import(${JSON.stringify(pathToFileURL('/loader-relative-app/main.mjs').href)})).default, { hookRelative: true });`,
            'assert.strictEqual(globalThis.__loader_relative_seen, true);',
            'assert.strictEqual((await import("data:text/javascript,export default 5", {})).default, 5);',
        ].join('\n')));
        fs.writeFileSync(
            '/loader-relative-app/relative-loader.mjs',
            [
                'export function resolve(specifier, context, next) {',
                '  if (specifier === "virtual:relative-loader") {',
                '    return { shortCircuit: true, url: "virtual:relative-loader-json", format: "json" };',
                '  }',
                '  return next(specifier, context);',
                '}',
                'export function load(url, context, next) {',
                '  if (url === "virtual:relative-loader-json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"relativeLoader\\":true}" };',
                '  }',
                '  return next(url, context);',
                '}',
            ].join('\n'),
        );
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'register("./relative-loader.mjs", { parentURL: "file:///loader-relative-app/main.mjs" });',
            'assert.deepStrictEqual((await import("virtual:relative-loader", { with: { type: "json" } })).default, { relativeLoader: true });',
        ].join('\n')));
        fs.writeFileSync('/loader-relative-app/bytes.json', '{}');
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'function resolve(specifier, context, next) {',
            '  if (specifier === "virtual:resolve-attrs") {',
            '    return { shortCircuit: true, url: "data:application/json,{%22resolveAttrs%22:true}", format: "json", importAttributes: { type: "json" } };',
            '  }',
            '  return next(specifier, context);',
            '}',
            'function load(url, context, next) {',
            '  if (url.includes("%22resolveAttrs%22")) {',
            '    if (JSON.stringify(context.importAttributes) !== "{\\"type\\":\\"json\\"}") throw new Error("resolve import attributes were not passed to load");',
            '    return { shortCircuit: true, format: "json", source: "{\\"resolveAttrs\\":true}" };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + resolve + "; export " + load));',
            'assert.deepStrictEqual((await import("virtual:resolve-attrs", {})).default, { resolveAttrs: true });',
        ].join('\n')));
        fs.mkdirSync('/loader-next-app/node_modules/loader-next-pkg', { recursive: true });
        fs.writeFileSync(
            '/loader-next-app/node_modules/loader-next-pkg/package.json',
            JSON.stringify({
                name: 'loader-next-pkg',
                exports: {
                    '.': {
                        golem: './data.json',
                        default: './fallback.json',
                    },
                },
            }),
        );
        fs.writeFileSync('/loader-next-app/node_modules/loader-next-pkg/data.json', '{"fromPackage":true}');
        fs.writeFileSync('/loader-next-app/node_modules/loader-next-pkg/fallback.json', '{"nextResolvePackage":true}');
        fs.mkdirSync('/loader-next-app/node_modules/loader-sparse-pkg', { recursive: true });
        fs.writeFileSync(
            '/loader-next-app/node_modules/loader-sparse-pkg/package.json',
            JSON.stringify({
                name: 'loader-sparse-pkg',
                exports: {
                    '.': {
                        undefined: './bad.json',
                        default: './sparse-default.json',
                    },
                },
            }),
        );
        fs.writeFileSync('/loader-next-app/node_modules/loader-sparse-pkg/bad.json', '{"sparseConditions":"bad"}');
        fs.writeFileSync('/loader-next-app/node_modules/loader-sparse-pkg/sparse-default.json', '{"sparseConditions":"default"}');
        fs.mkdirSync('/loader-next-app/node_modules/fs', { recursive: true });
        fs.writeFileSync(
            '/loader-next-app/node_modules/fs/package.json',
            JSON.stringify({ name: 'fs', main: './shadow.js' }),
        );
        fs.writeFileSync('/loader-next-app/node_modules/fs/shadow.js', 'export default "shadow";');
        fs.mkdirSync('/loader-next-app/node_modules/loader-subpath-pkg', { recursive: true });
        fs.writeFileSync(
            '/loader-next-app/node_modules/loader-subpath-pkg/package.json',
            JSON.stringify({ name: 'loader-subpath-pkg' }),
        );
        fs.writeFileSync('/loader-next-app/node_modules/loader-subpath-pkg/foo.js', 'export default "should-not-resolve";');
        fs.writeFileSync('/loader-next-app/node_modules/loader-subpath-pkg/sp ce.json', '{"encodedSpaceSubpath":true}');
        fs.writeFileSync('/loader-next-app/query.json', '{"query":true}');
        fs.writeFileSync('/loader-next-app/sp ce.json', '{"encodedRelative":true}');
        fs.writeFileSync('/loader-next-app/extensionless.js', 'export default "should-not-resolve";');
        fs.writeFileSync(
            '/loader-next-app/main.mjs',
            [
                'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
                'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
                'async function resolve(specifier, context, next) {',
                '  globalThis.__wasm_rquickjs_module_resolution_assert.deepStrictEqual([...context.conditions].sort(), ["import", "module-sync", "node", "node-addons"]);',
                '  if (specifier === "loader-next-pkg") {',
                '    const result = await next(specifier, context);',
                '    if (new URL(result.url).pathname !== "/loader-next-app/node_modules/loader-next-pkg/fallback.json") throw new Error("nextResolve exposed runtime-only package conditions to loader context: " + result.url);',
                '    return result;',
                '  }',
                '  if (specifier === "virtual:sparse-conditions") {',
                '    const result = await next("loader-sparse-pkg", { ...context, conditions: Array(1) });',
                '    if (new URL(result.url).pathname !== "/loader-next-app/node_modules/loader-sparse-pkg/sparse-default.json") throw new Error("nextResolve treated sparse condition holes as string undefined: " + result.url);',
                '    return result;',
                '  }',
                '  if (specifier === "virtual:undefined-condition") {',
                '    const result = await next("loader-sparse-pkg", { ...context, conditions: [undefined] });',
                '    if (new URL(result.url).pathname !== "/loader-next-app/node_modules/loader-sparse-pkg/sparse-default.json") throw new Error("nextResolve treated explicit undefined as string undefined: " + result.url);',
                '    return result;',
                '  }',
                '  if (specifier === "virtual:builtin-shadow") {',
                '    const result = await next("fs", context);',
                '    if (result.url !== "node:fs") throw new Error("nextResolve allowed node_modules to shadow builtin: " + result.url);',
                '    return { shortCircuit: true, url: "virtual:builtin-shadow-json", format: "json" };',
                '  }',
                '  if (specifier === "virtual:package-subpath-no-extension") {',
                '    try {',
                '      await next("loader-subpath-pkg/foo", context);',
                '      throw new Error("nextResolve unexpectedly resolved package subpath without extension");',
                '    } catch (error) {',
                '      if (!error || error.code !== "ERR_MODULE_NOT_FOUND") throw error;',
                '    }',
                '    return { shortCircuit: true, url: "virtual:package-subpath-json", format: "json" };',
                '  }',
                '  if (specifier === "virtual:encoded-space-subpath") {',
                '    const result = await next("loader-subpath-pkg/sp%20ce.json", context);',
                '    if (new URL(result.url).pathname !== "/loader-next-app/node_modules/loader-subpath-pkg/sp%20ce.json") throw new Error("nextResolve did not decode package subpath space: " + result.url);',
                '    return result;',
                '  }',
                '  if (specifier === "virtual:encoded-separator-subpath") {',
                '    for (const bad of ["loader-subpath-pkg/a%2Fb.js", "loader-subpath-pkg/a%5Cb.js"]) {',
                '      try {',
                '        await next(bad, context);',
                '        throw new Error("nextResolve unexpectedly accepted encoded separator subpath: " + bad);',
                '      } catch (error) {',
                '        if (!error || error.code !== "ERR_INVALID_MODULE_SPECIFIER") throw error;',
                '      }',
                '    }',
                '    return { shortCircuit: true, url: "virtual:encoded-separator-json", format: "json" };',
                '  }',
                '  if (specifier === "./query.json?one#two") {',
                '    const result = await next(specifier, context);',
                '    const url = new URL(result.url);',
                '    if (url.pathname !== "/loader-next-app/query.json" || url.search !== "?one" || url.hash !== "#two") throw new Error("nextResolve did not preserve file URL search/hash: " + result.url);',
                '    return result;',
                '  }',
                '  if (specifier === "./sp%20ce.json?encoded#space") {',
                '    const result = await next(specifier, context);',
                '    const url = new URL(result.url);',
                '    if (url.pathname !== "/loader-next-app/sp%20ce.json" || url.search !== "?encoded" || url.hash !== "#space") throw new Error("nextResolve did not preserve encoded relative path/search/hash: " + result.url);',
                '    return result;',
                '  }',
                '  return next(specifier, context);',
                '}',
                'function load(url, context, next) {',
                '  if (new URL(url).pathname === "/loader-next-app/node_modules/loader-next-pkg/data.json") {',
                '    if (context.format !== "json") throw new Error("nextResolve did not pass json format to load");',
                '    return { shortCircuit: true, format: "json", source: "{\\"nextResolvePackage\\":true}" };',
                '  }',
                '  if (new URL(url).pathname === "/loader-next-app/node_modules/loader-sparse-pkg/sparse-default.json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"sparseConditions\\":\\"default\\"}" };',
                '  }',
                '  if (new URL(url).pathname === "/loader-next-app/node_modules/loader-sparse-pkg/bad.json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"sparseConditions\\":\\"bad\\"}" };',
                '  }',
                '  if (url === "virtual:builtin-shadow-json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"builtinShadow\\":true}" };',
                '  }',
                '  if (url === "virtual:package-subpath-json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"packageSubpath\\":true}" };',
                '  }',
                '  if (new URL(url).pathname === "/loader-next-app/node_modules/loader-subpath-pkg/sp%20ce.json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"encodedSpaceSubpath\\":true}" };',
                '  }',
                '  if (url === "virtual:encoded-separator-json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"encodedSeparator\\":true}" };',
                '  }',
                '  if (new URL(url).pathname === "/loader-next-app/query.json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"queryHash\\":true}" };',
                '  }',
                '  if (new URL(url).pathname === "/loader-next-app/sp%20ce.json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"encodedRelative\\":true}" };',
                '  }',
                '  return next(url, context);',
                '}',
                'register("data:text/javascript," + encodeURIComponent("export " + resolve + "; export " + load));',
                'let extensionlessRejected = false;',
                'try {',
                '  await import("./extensionless", {});',
                '} catch (err) {',
                '  if (err && err.code !== undefined) assert.strictEqual(err.code, "ERR_MODULE_NOT_FOUND", "extensionless loader nextResolve import should reject");',
                '  extensionlessRejected = true;',
                '}',
                'if (!extensionlessRejected) throw new Error("Missing expected rejection: extensionless loader nextResolve import should reject");',
                'assert.deepStrictEqual((await import("virtual:sparse-conditions", { with: { type: "json" } })).default, { sparseConditions: "default" });',
                'assert.deepStrictEqual((await import("virtual:undefined-condition", { with: { type: "json" } })).default, { sparseConditions: "default" });',
                'assert.deepStrictEqual((await import("virtual:builtin-shadow", { with: { type: "json" } })).default, { builtinShadow: true });',
                'assert.deepStrictEqual((await import("virtual:package-subpath-no-extension", { with: { type: "json" } })).default, { packageSubpath: true });',
                'assert.deepStrictEqual((await import("virtual:encoded-space-subpath", { with: { type: "json" } })).default, { encodedSpaceSubpath: true });',
                'assert.deepStrictEqual((await import("virtual:encoded-separator-subpath", { with: { type: "json" } })).default, { encodedSeparator: true });',
                'assert.deepStrictEqual((await import("./query.json?one#two", { with: { type: "json" } })).default, { queryHash: true });',
                'assert.deepStrictEqual((await import("./sp%20ce.json?encoded#space", { with: { type: "json" } })).default, { encodedRelative: true });',
                'export default (await import("loader-next-pkg", { with: { type: "json" } })).default;',
            ].join('\n'),
        );
        assert.deepStrictEqual(
            (await import('/loader-next-app/main.mjs')).default,
            { nextResolvePackage: true },
        );
        globalThis.__wasm_rquickjs_registered_loaders = [];
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'function load(url, context, next) {',
            '  if (url.includes("/loader-relative-app/bytes.json")) {',
            '    return { shortCircuit: true, format: "json", source: new TextEncoder().encode("{\\"bytes\\":true}") };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + load));',
            `assert.deepStrictEqual((await import(${JSON.stringify(pathToFileURL('/loader-relative-app/bytes.json').href)}, { with: { type: "json" } })).default, { bytes: true });`,
        ].join('\n')));
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'function initialize(data) {',
            '  globalThis.__loader_initialize_calls = (globalThis.__loader_initialize_calls || 0) + 1;',
            '  globalThis.__loader_initialize_value = data.value;',
            '}',
            'function resolve(specifier, context, next) {',
            '  if (specifier === "virtual:initialize-data") {',
            '    if (globalThis.__loader_initialize_value !== 42) throw new Error("loader initialize data was not available");',
            '    return { shortCircuit: true, url: "virtual:initialize-data-json", format: "json" };',
            '  }',
            '  return next(specifier, context);',
            '}',
            'function load(url, context, next) {',
            '  if (url === "virtual:initialize-data-json") {',
            '    return { shortCircuit: true, format: "json", source: "{\\"initialized\\":true}" };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + initialize + "; export " + resolve + "; export " + load), { data: { value: 42 } });',
            'assert.deepStrictEqual((await import("virtual:initialize-data", { with: { type: "json" } })).default, { initialized: true });',
            'assert.deepStrictEqual((await import("virtual:initialize-data", { with: { type: "json" } })).default, { initialized: true });',
            'assert.strictEqual(globalThis.__loader_initialize_calls, 1);',
        ].join('\n')));
        fs.writeFileSync(
            '/loader-relative-app/url-parent-loader.mjs',
            [
                'let initializedValue;',
                'export function initialize(data) { initializedValue = data.value; }',
                'export function resolve(specifier, context, next) {',
                '  if (specifier === "virtual:url-parent-initialize") {',
                '    if (initializedValue !== 7) throw new Error("three-argument initialize data was not available");',
                '    return { shortCircuit: true, url: "virtual:url-parent-initialize-json", format: "json" };',
                '  }',
                '  return next(specifier, context);',
                '}',
                'export function load(url, context, next) {',
                '  if (url === "virtual:url-parent-initialize-json") {',
                '    return { shortCircuit: true, format: "json", source: "{\\"urlParent\\":true}" };',
                '  }',
                '  return next(url, context);',
                '}',
            ].join('\n'),
        );
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'register("./url-parent-loader.mjs", new URL("file:///loader-relative-app/main.mjs"), { data: { value: 7 } });',
            'assert.deepStrictEqual((await import("virtual:url-parent-initialize", { with: { type: "json" } })).default, { urlParent: true });',
        ].join('\n')));
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            'register("./url-parent-loader.mjs", { parentURL: "file:///loader-relative-app/main.mjs", data: { value: 7 } });',
            'assert.deepStrictEqual((await import("virtual:url-parent-initialize", { with: { type: "json" } })).default, { urlParent: true });',
        ].join('\n')));
        fs.writeFileSync('/cjs-data-url-import-attributes.cjs', [
            'const assert = require("node:assert");',
            'module.exports = async function () {',
            '  const literal = await import("data:application/json;foo=\\"test,\\"this\\"", { with: { type: "json" } });',
            '  if (literal.default !== "this") throw new Error("literal data URL import failed");',
            '  const unicodeLiteral = await import("data:application/json,%7B%22snowman%22%3A%22\\u2603%22%7D", { with: { type: "json" } });',
            '  if (unicodeLiteral.default.snowman !== "☃") throw new Error("unicode literal data URL import failed");',
            '  const escaped = await import("data:application/json,%7B%22snowman%22%3A%22%E2%98%83%22%7D", { with: { type: "json" } });',
            '  if (escaped.default.snowman !== "☃") throw new Error("escaped literal data URL import failed");',
            '  const variableSpecifier = `data:application/json;foo=${encodeURIComponent("test,")},0`;',
            '  const variable = await import(variableSpecifier, { with: { type: "json" } });',
            '  if (variable.default !== 0) throw new Error("variable data URL import failed");',
            '  let missingAttrRejected = false;',
            '  try {',
            '    await import(variableSpecifier);',
            '  } catch (err) {',
            '    assert.strictEqual(err && err.code, "ERR_IMPORT_ATTRIBUTE_MISSING", "CJS dynamic JSON import without attributes should reject");',
            '    missingAttrRejected = true;',
            '  }',
            '  if (!missingAttrRejected) throw new Error("Missing expected rejection: CJS dynamic JSON import without attributes should reject");',
            '  const urls = [variableSpecifier, "data:application/json,1"];',
            '  let index = 0;',
            '  let optionsCount = 0;',
            '  const options = () => { optionsCount++; return { with: { type: "json" } }; };',
            '  const sideEffected = await import(urls[index++], { with: { type: "json" } });',
            '  if (index !== 1 || sideEffected.default !== 0) throw new Error("specifier evaluated more than once");',
            '  const sideEffectedOptions = await import(urls[index++], options());',
            '  if (index !== 2 || optionsCount !== 1 || sideEffectedOptions.default !== 1) throw new Error("options evaluated more than once");',
            '  const plainUrls = ["data:text/javascript,export default 6", "data:text/javascript,export default 7"];',
            '  let plainIndex = 0;',
            '  const plain = await import(plainUrls[plainIndex++]);',
            '  if (plainIndex !== 1 || plain.default !== 6) throw new Error("plain import specifier evaluated more than once");',
            '  const obj = { "import": function(value) { return ["method", value]; } };',
            '  const methodResult = obj.import("not-a-module", { with: { type: "json" } });',
            '  if (methodResult[0] !== "method" || methodResult[1] !== "not-a-module") throw new Error("property import call was rewritten");',
            '  const plainMethod = { import(value) { return ["plain", value]; } };',
            '  if (plainMethod.import("value")[0] !== "plain") throw new Error("plain import method was rewritten");',
            '  const asyncMethod = { async import(value) { return ["async", value]; } };',
            '  if ((await asyncMethod.import("value"))[0] !== "async") throw new Error("async import method was rewritten");',
            '  const generatorMethod = { *import(value) { yield value; } };',
            '  if (generatorMethod.import("value").next().value !== "value") throw new Error("generator import method was rewritten");',
            '  const asyncGeneratorMethod = { async * import(value) { yield value; } };',
            '  if ((await asyncGeneratorMethod.import("value").next()).value !== "value") throw new Error("async generator import method was rewritten");',
            '  const accessorMethod = { get import() { return "getter"; }, set import(value) { this.setter = value; } };',
            '  if (accessorMethod.import !== "getter") throw new Error("getter import method was rewritten");',
            '  accessorMethod.import = "setter";',
            '  if (accessorMethod.setter !== "setter") throw new Error("setter import method was rewritten");',
            '  class ImportMethods { import(value) { return ["class", value]; } }',
            '  if (new ImportMethods().import("value")[0] !== "class") throw new Error("class import method was rewritten");',
            '  class StaticImportMethod { static import(value) { return ["static", value]; } }',
            '  if (StaticImportMethod.import("value")[0] !== "static") throw new Error("static import method was rewritten");',
            '  class StaticGetterImportMethod { static get import() { return "staticGetter"; } }',
            '  if (StaticGetterImportMethod.import !== "staticGetter") throw new Error("static getter import method was rewritten");',
            '  class AsyncGeneratorImportMethod { async * import(value) { yield value; } }',
            '  if ((await new AsyncGeneratorImportMethod().import("value").next()).value !== "value") throw new Error("class async generator import method was rewritten");',
            '  const regex = /import\\("not-a-module", \\{ with: \\{ type: "json" \\} \\}\\)/;',
            '  if (!regex.test(\'import("not-a-module", { with: { type: "json" } })\')) throw new Error("regex literal changed");',
            '};',
        ].join('\n'));
        await (await import('/cjs-data-url-import-attributes.cjs')).default();

        delete globalThis.__wasm_rquickjs_module_resolution_assert;
        delete globalThis.__wasm_rquickjs_module_resolution_register;
        return true;
    } catch (error) {
        delete globalThis.__wasm_rquickjs_module_resolution_assert;
        delete globalThis.__wasm_rquickjs_module_resolution_register;
        console.error(error);
        throw error;
    }
};

export const testEsmJsonUrlCacheKeys = async () => {
    try {
        const root = '/esm-json-url-cache-keys-app';
        fs.mkdirSync(root, { recursive: true });
        fs.writeFileSync(`${root}/cache-key.json`, JSON.stringify({ id: 0 }));
        const jsonUrl = pathToFileURL(`${root}/cache-key.json`).href;

        globalThis.__wasm_rquickjs_json_cache_key_write = (value) => {
            fs.writeFileSync(`${root}/cache-key.json`, JSON.stringify({ id: value }));
        };
        try {
            const result = (await import('data:text/javascript,' + encodeURIComponent([
                'import assert from "node:assert";',
                `const jsonUrl = ${JSON.stringify(jsonUrl)};`,
                'const plain = await import(jsonUrl, { with: { type: "json" } });',
                'globalThis.__wasm_rquickjs_json_cache_key_write(1);',
                'const query = await import(`${jsonUrl}?a=1`, { with: { type: "json" } });',
                'globalThis.__wasm_rquickjs_json_cache_key_write(2);',
                'const hash = await import(`${jsonUrl}#a=1`, { with: { type: "json" } });',
                'globalThis.__wasm_rquickjs_json_cache_key_write(3);',
                'const queryHash = await import(`${jsonUrl}?a=1#a=1`, { with: { type: "json" } });',
                'assert.notStrictEqual(plain, query);',
                'assert.notStrictEqual(plain, hash);',
                'assert.notStrictEqual(query, hash);',
                'export default [plain.default, query.default, hash.default, queryHash.default];',
            ].join('\n')))).default;
            assert.deepStrictEqual(result, [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
        } finally {
            delete globalThis.__wasm_rquickjs_json_cache_key_write;
        }
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testStaticLoaderAbsoluteEntrySpecifier = async () => {
    try {
        const root = '/static-loader-absolute-entry-app';
        fs.mkdirSync(root, { recursive: true });
        fs.mkdirSync(`${root}/node_modules/static-condition-pkg`, { recursive: true });
        fs.writeFileSync(`${root}/entry.mjs`, 'export default true;');
        fs.writeFileSync(
            `${root}/node_modules/static-condition-pkg/package.json`,
            JSON.stringify({
                name: 'static-condition-pkg',
                exports: {
                    customStatic: './custom.mjs',
                    default: './default.mjs',
                },
            }),
        );
        fs.writeFileSync(`${root}/node_modules/static-condition-pkg/custom.mjs`, 'export default "custom";');
        fs.writeFileSync(`${root}/node_modules/static-condition-pkg/default.mjs`, 'export default "default";');
        fs.writeFileSync(`${root}/from-data-parent.mjs`, 'export default "should-not-resolve";');
        const loaderUrl = 'data:text/javascript,' + encodeURIComponent([
            'export function resolve(specifier, context, next) {',
            '  if (specifier.startsWith("/")) throw new Error("static loader received absolute path: " + specifier);',
            '  if (specifier.startsWith("file://") && specifier.includes("/static-loader-absolute-entry-app/entry.mjs?cache#frag")) {',
            '    globalThis.__static_loader_absolute_entry_seen = specifier;',
            '  }',
            '  if (specifier === "virtual:static-condition") {',
            '    return next("static-condition-pkg", { ...context, conditions: ["customStatic"] });',
            '  }',
            '  if (specifier === "virtual:rooted-data-parent") {',
            `    const resolved = next(${JSON.stringify(`${root}/from-data-parent.mjs`)}, { ...context, parentURL: "data:text/javascript,export%20default%200" });`,
            '    if (resolved !== undefined) throw new Error("nextResolve resolved rooted specifier under data: parent: " + resolved.url);',
            '    const relative = next("./relative-from-data.mjs", { ...context, parentURL: "data:text/javascript,export%20default%200" });',
            '    if (relative !== undefined) throw new Error("nextResolve resolved relative specifier under data: parent: " + relative.url);',
            '    const bare = next("definitely-not-installed-static-loader-pkg", { ...context, parentURL: "data:text/javascript,export%20default%200" });',
            '    if (bare !== undefined) throw new Error("nextResolve resolved bare specifier under data: parent: " + bare.url);',
            '    return { shortCircuit: true, url: "data:text/javascript,export default true", format: "module" };',
            '  }',
            '  return next(specifier, context);',
            '}',
        ].join('\n'));
        await import(loaderUrl);
        const { register } = await import('node:module');
        register(loaderUrl);
        await import('data:text/javascript,export default 0');
        assert.strictEqual(
            (await import('data:text/javascript,' + encodeURIComponent(
                `import value from ${JSON.stringify(`${root}/entry.mjs?cache#frag`)}; export default value;`,
            ))).default,
            true,
        );
        assert.strictEqual(
            globalThis.__static_loader_absolute_entry_seen,
            `${pathToFileURL(`${root}/entry.mjs`).href}?cache#frag`,
        );
        assert.strictEqual(
            globalThis.__wasm_rquickjs_resolve_static_registered_loader(
                pathToFileURL(`${root}/entry.mjs`).href,
                'virtual:static-condition',
            ),
            `${root}/node_modules/static-condition-pkg/custom.mjs`,
        );
        assert.strictEqual(
            globalThis.__wasm_rquickjs_resolve_static_registered_loader(
                pathToFileURL(`${root}/entry.mjs`).href,
                'virtual:rooted-data-parent',
            ),
            'data:text/javascript,export default true',
        );
        delete globalThis.__static_loader_absolute_entry_seen;
        return true;
    } catch (error) {
        delete globalThis.__static_loader_absolute_entry_seen;
        console.error(error);
        throw error;
    }
};

export const testRegisteredLoaderModuleRealmIsolation = async () => {
    try {
        const root = '/registered-loader-realm-app';
        fs.mkdirSync(root, { recursive: true });
        fs.writeFileSync(
            `${root}/stateful.mjs`,
            [
                'let value = 0;',
                'export function count() { return ++value; }',
            ].join('\n'),
        );
        fs.mkdirSync(`${root}/node_modules/loader-realm-pkg`, { recursive: true });
        fs.writeFileSync(
            `${root}/node_modules/loader-realm-pkg/package.json`,
            JSON.stringify({ name: 'loader-realm-pkg', exports: './index.mjs' }),
        );
        fs.writeFileSync(
            `${root}/node_modules/loader-realm-pkg/index.mjs`,
            [
                'let value = 0;',
                'export function count() { return ++value; }',
            ].join('\n'),
        );
        fs.writeFileSync(
            `${root}/app.mjs`,
            [
                'import { count as stateCount } from "./stateful.mjs";',
                'import { count as packageCount } from "loader-realm-pkg";',
                'export default [stateCount(), packageCount()];',
            ].join('\n'),
        );
        fs.writeFileSync(
            `${root}/loader.mjs`,
            [
                'import { count } from "./stateful.mjs";',
                'import { count as packageCount } from "loader-realm-pkg";',
                'if (import.meta.url.includes("__wasm_rquickjs_loader_realm")) {',
                '  throw new Error("loader realm marker leaked through import.meta.url");',
                '}',
                'const loaderCount = count();',
                'const loaderPackageCount = packageCount();',
                'export function resolve(specifier, context, next) {',
                '  if (specifier === "virtual:loader-realm-count") {',
                '    return { shortCircuit: true, url: "virtual:loader-realm-count-json", format: "json" };',
                '  }',
                '  return next(specifier, context);',
                '}',
                'export function load(url, context, next) {',
                '  if (url === "virtual:loader-realm-count-json") {',
                '    return { shortCircuit: true, format: "json", source: JSON.stringify({ loaderCount, loaderPackageCount }) };',
                '  }',
                '  return next(url, context);',
                '}',
            ].join('\n'),
        );
        globalThis.__wasm_rquickjs_registered_loaders = [];
        globalThis.__wasm_rquickjs_module_resolution_assert = assert;
        globalThis.__wasm_rquickjs_module_resolution_register = (await import('node:module')).register;
        await import('data:text/javascript,' + encodeURIComponent([
            'const assert = globalThis.__wasm_rquickjs_module_resolution_assert;',
            'const register = globalThis.__wasm_rquickjs_module_resolution_register;',
            `register(${JSON.stringify(pathToFileURL(`${root}/loader.mjs`).href)});`,
            'assert.deepStrictEqual((await import("virtual:loader-realm-count", { with: { type: "json" } })).default, { loaderCount: 1, loaderPackageCount: 1 });',
            `const userState = await import(${JSON.stringify(pathToFileURL(`${root}/stateful.mjs`).href)});`,
            'assert.strictEqual(userState.count(), 1);',
            `assert.deepStrictEqual((await import(${JSON.stringify(pathToFileURL(`${root}/app.mjs`).href)})).default, [2, 1]);`,
        ].join('\n')));
        delete globalThis.__wasm_rquickjs_module_resolution_assert;
        delete globalThis.__wasm_rquickjs_module_resolution_register;
        return true;
    } catch (error) {
        delete globalThis.__wasm_rquickjs_module_resolution_assert;
        delete globalThis.__wasm_rquickjs_module_resolution_register;
        console.error(error);
        throw error;
    }
};

export const testEsmForbiddenCjsGlobals = async () => {
    try {
        const root = '/esm-forbidden-cjs-globals-app';
        fs.mkdirSync(root, { recursive: true });
        fs.writeFileSync(
            `${root}/main.mjs`,
            [
                'export default [',
                '  typeof arguments,',
                '  typeof this,',
                '  typeof exports,',
                '  typeof require,',
                '  typeof module,',
                '  typeof __filename,',
                '  typeof __dirname,',
                '];',
                'export const meta = [typeof import.meta.url, typeof import.meta.filename, typeof import.meta.dirname];',
            ].join('\n'),
        );
        fs.writeFileSync(
            `${root}/declared.mjs`,
            [
                'const require = () => "local-require";',
                'const exports = "local-exports";',
                'const module = "local-module";',
                'const __filename = "local-filename";',
                'const __dirname = "local-dirname";',
                'export default [require(), exports, module, __filename, __dirname];',
            ].join('\n'),
        );
        fs.writeFileSync(
            `${root}/bindings.mjs`,
            [
                'export const req = "imported-require";',
                'export const exp = "imported-exports";',
                'export const mod = "imported-module";',
                'export const file = "imported-filename";',
                'export const dir = "imported-dirname";',
            ].join('\n'),
        );
        fs.writeFileSync(
            `${root}/imported.mjs`,
            [
                'import { req as require, exp as exports, mod as module, file as __filename, dir as __dirname } from "./bindings.mjs";',
                'export default [require, exports, module, __filename, __dirname];',
            ].join('\n'),
        );
        fs.writeFileSync(`${root}/rhs-require.mjs`, 'const value = require; export default value;');
        fs.writeFileSync(
            `${root}/param-require.mjs`,
            [
                'function local(require) { return require; }',
                'export default [local("local-require"), typeof require];',
            ].join('\n'),
        );
        fs.writeFileSync(`${root}/direct.mjs`, 'Object.defineProperty(exports, "__esModule", { value: true });');
        const imported = await import(pathToFileURL(`${root}/main.mjs`).href);
        assert.deepStrictEqual(imported.default, [
            'undefined',
            'undefined',
            'undefined',
            'undefined',
            'undefined',
            'undefined',
            'undefined',
        ]);
        assert.deepStrictEqual(imported.meta, ['string', 'string', 'string']);
        assert.deepStrictEqual((await import(pathToFileURL(`${root}/declared.mjs`).href)).default, [
            'local-require',
            'local-exports',
            'local-module',
            'local-filename',
            'local-dirname',
        ]);
        assert.deepStrictEqual((await import(pathToFileURL(`${root}/imported.mjs`).href)).default, [
            'imported-require',
            'imported-exports',
            'imported-module',
            'imported-filename',
            'imported-dirname',
        ]);
        assert.deepStrictEqual((await import(pathToFileURL(`${root}/param-require.mjs`).href)).default, [
            'local-require',
            'undefined',
        ]);
        await assert.rejects(import(pathToFileURL(`${root}/rhs-require.mjs`).href), {
            name: 'ReferenceError',
            message: /require is not defined/,
        });
        await assert.rejects(import(pathToFileURL(`${root}/direct.mjs`).href), {
            name: 'ReferenceError',
            message: /exports is not defined/,
        });
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsDynamicImportAttributeScanner = async () => {
    try {
        fs.mkdirSync('/cjs-dynamic-import-attr-scanner', { recursive: true });
        fs.writeFileSync('/cjs-dynamic-import-attr-scanner/data.json', '{"fromCjs":true}');
        fs.writeFileSync('/cjs-dynamic-import-attr-scanner/module.cjs', [
            'const assert = require("node:assert");',
            'const stringLiteral = "import(\\"./missing-string.json\\", { with: { type: \\"json\\" } })";',
            'const templateLiteral = `before ${"import(\\"./missing-template.json\\", { with: { type: \\"json\\" } })"} after`;',
            'const regexLiteral = /import\\(\\"\\.\\/missing-regex\\.json\\", \\{ with: \\{ type: \\"json\\" \\} \\}\\)/;',
            'const commentedAssignmentRegexLiteral = /* scanner comment */ /import(".+")/.source;',
            'function returnedRegexLiteral() { return /* scanner comment */ /import(".+")/.source; }',
            '// import("./missing-comment.json", { with: { type: "json" } });',
            'const objectMethod = { import(value, options) { return [value, options.with.type]; } };',
            'class ImportMethods {',
            '  static import(value, options) { return [value, options.with.type]; }',
            '}',
            'exports.run = async function run() {',
            '  assert.deepStrictEqual(objectMethod.import("object", { with: { type: "json" } }), ["object", "json"]);',
            '  assert.deepStrictEqual(ImportMethods.import("static", { with: { type: "json" } }), ["static", "json"]);',
            '  const imported = await import("./data.json", { with: { type: "json" } });',
            '  const spaced = await import ("./data.json", { with: { type: "json" } });',
            '  const commented = await import /* scanner comment */ ("./data.json", { with: { type: "json" } });',
            '  const templateImported = await `${(await import("./data.json", { with: { type: "json" } })).default.fromCjs}`;',
            '  const nested = await import((await import("./name.json", { with: { type: "json" } })).default.name, { with: { type: "json" } });',
            '  return { stringLiteral, templateLiteral, regexLiteral: regexLiteral.source, commentedAssignmentRegexLiteral, returnedRegexLiteral: returnedRegexLiteral(), json: imported.default, spaced: spaced.default, commented: commented.default, templateImported, nested: nested.default };',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-dynamic-import-attr-scanner/name.json', '{"name":"./data.json"}');

        const result = (await import('/cjs-dynamic-import-attr-scanner/module.cjs')).default;
        const value = await result.run();
        assert.strictEqual(
            value.stringLiteral,
            'import("./missing-string.json", { with: { type: "json" } })',
        );
        assert.strictEqual(
            value.templateLiteral,
            'before import("./missing-template.json", { with: { type: "json" } }) after',
        );
        assert.match(value.regexLiteral, /missing-regex/);
        assert.strictEqual(value.commentedAssignmentRegexLiteral, 'import(".+")');
        assert.strictEqual(value.returnedRegexLiteral, 'import(".+")');
        assert.deepStrictEqual(value.json, { fromCjs: true });
        assert.deepStrictEqual(value.spaced, { fromCjs: true });
        assert.deepStrictEqual(value.commented, { fromCjs: true });
        assert.strictEqual(value.templateImported, 'true');
        assert.deepStrictEqual(value.nested, { fromCjs: true });
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testLoaderCommonjsSourceNamedExports = async () => {
    try {
        fs.mkdirSync('/loader-cjs-source-app', { recursive: true });
        fs.writeFileSync('/loader-cjs-source-app/dep.cjs', 'module.exports = { depValue: 17 };');
        fs.writeFileSync('/loader-cjs-source-app/reexport-dep.cjs', 'exports.reexported = 91;');
        fs.writeFileSync('/loader-cjs-source-app/guard-dep.cjs', 'exports.foo = "foo"; exports.bar = "bar";');
        fs.writeFileSync('/loader-cjs-source-app/direct-guard-dep.cjs', 'exports.directGuarded = 93;');
        fs.writeFileSync('/loader-cjs-source-app/object-guard-dep.cjs', 'exports.objectGuarded = 94;');
        fs.writeFileSync('/loader-cjs-source-app/prototype-guard-dep.cjs', 'exports.prototypeGuarded = 95;');
        fs.writeFileSync('/loader-cjs-source-app/nested-dep.cjs', 'exports.nested = { nestedValue: 92 };');
        fs.writeFileSync('/loader-cjs-source-app/tag-dep.cjs', 'module.exports = function tag() { return { reexported: 1 }; }; module.exports.reexported = 91;');
        fs.writeFileSync('/loader-cjs-source-app/aliased-dep.cjs', 'exports.aliasValue = 77;');
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'function resolve(specifier, context, next) {',
            '  if (specifier === "virtual:loader-cjs") {',
            '    return { shortCircuit: true, url: "virtual:loader-cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:sync-chain-incomplete") {',
            '    return { url: "virtual:sync-chain-incomplete", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-file") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/source.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-reexport") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/reexport.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-reexport") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-reexport.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-string-first-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-string-first-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-asi") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-asi.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-asi-before-binding") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-asi-before-binding.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-commented") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-commented.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-line-comment-boundary") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-line-comment-boundary.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-block-comment-boundary") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-block-comment-boundary.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-hasown-return-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-hasown-return-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-hasown-return-negative") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-hasown-return-negative.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-duplicate-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-duplicate-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-duplicate-enumerable") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-duplicate-enumerable.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-getter-only") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-getter-only.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-getter-before-enumerable") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-getter-before-enumerable.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-direct-hasown-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-direct-hasown-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-object-hasown-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-object-hasown-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-prototype-hasown-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-prototype-hasown-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-semantic-guard") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-semantic-guard.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-negative") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-negative.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-nested") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-nested.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-scoped-binding") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-scoped-binding.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-continuation") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-continuation.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-keys-tagged-template") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/keys-tagged-template.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-exports-reassign") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/exports-reassign.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-view") {',
            '    return { shortCircuit: true, url: "virtual:loader-cjs-view", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-proto-assignment") {',
            '    return { shortCircuit: true, url: "virtual:loader-cjs-proto-assignment", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-object-require-spread-relative") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/object-require-spread-relative.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-object-require-spread-member") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/object-require-spread-member.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-object-require-spread-call") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/object-require-spread-call.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-object-require-spread-optional") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/object-require-spread-optional.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-object-require-spread-bracket") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/object-require-spread-bracket.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-object-require-spread-tagged") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/object-require-spread-tagged.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier.startsWith("virtual:loader-cjs-object-")) {',
            '    return { shortCircuit: true, url: specifier, format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-define-getters") {',
            '    return { shortCircuit: true, url: specifier, format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-collision-a") {',
            '    return { shortCircuit: true, url: "virtual:a:b", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-collision-b") {',
            '    return { shortCircuit: true, url: "virtual:a_3Ab", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:child") {',
            '    return { shortCircuit: true, url: "virtual:child", format: "commonjs" };',
            '  }',
            '  if (specifier === "alias-from-next") {',
            '    return next("./aliased-dep.cjs", { parentURL: "file:///loader-cjs-source-app/entry.cjs" });',
            '  }',
            '  if (specifier === "alias-fs") {',
            '    return { shortCircuit: true, url: "node:fs", format: "builtin" };',
            '  }',
            '  if (specifier === "virtual:file-query-a") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/query.cjs?one", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:file-query-b") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/query.cjs?two", format: "commonjs" };',
            '  }',
            '  return next(specifier, context);',
            '}',
            'function sourceView(text) {',
            '  const bytes = new Uint8Array(text.length + 4);',
            '  bytes[0] = 33;',
            '  bytes[1] = 33;',
            '  for (let i = 0; i < text.length; i++) bytes[i + 2] = text.charCodeAt(i);',
            '  bytes[text.length + 2] = 33;',
            '  bytes[text.length + 3] = 33;',
            '  return bytes.subarray(2, text.length + 2);',
            '}',
            'function load(url, context, next) {',
            '  if (url === "virtual:loader-cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "const fs = require(\\"node:fs\\");",',
            '        "module.exports = fs;",',
            '        "module.exports.__fromLoader = true;",',
            '        "module.exports.virtualFilename = __filename;",',
            '        "module.exports.virtualDirname = __dirname;",',
            '        "module.exports.virtualModuleId = module.id;",',
            '        "module.exports.virtualModuleFilename = module.filename;",',
            '        "module.exports[\\"escaped\\\\u004eame\\"] = 42;",',
            '        "module.exports[\\"brace\\\\u{4e}ame\\"] = 84;",',
            '        "module.exports.constructor = \\"own-constructor\\";",',
            '        "module.exports.toString = \\"own-toString\\";",',
            '        "module.exports.__proto__ = \\"assigned-proto\\";",',
            '        "Object.defineProperty(module.exports, \\"definedValue\\", { value: 64 });",',
            '        "Object.defineProperty(module.exports, \\"definedProto\\", { value: module.exports.__proto__ });",',
            '        "Object.defineProperty(module.exports, \\"__proto__\\", { value: \\"own-proto\\" });",',
            '        "const child = require(\\"virtual:child\\");",',
            '        "module.exports.childValue = child.value;",',
            '        "module.exports.aliasValue = require(\\"alias-from-next\\").aliasValue;",',
            '        "module.exports.aliasResolved = require.resolve(\\"alias-from-next\\");",',
            '        "module.exports.aliasFsReadFile = require(\\"alias-fs\\").readFile;",',
            '        "module.exports.aliasFsResolved = require.resolve(\\"alias-fs\\");",',
            '        "module.exports.childConditions = child.conditions;",',
            '        "module.exports.childFromView = child.fromView;",',
            '        "module.exports.moduleRequireValue = module.require(\\"virtual:child\\").value;",',
            '        "module.exports.childResolved = require.resolve(\\"virtual:child\\");",',
            '        "module.exports.childResolvedWithOptions = require.resolve(\\"virtual:child\\", {});",',
            '        "try { require(\\"virtual:sync-chain-incomplete\\"); } catch (e) { module.exports.syncChainErrorCode = e.code; }",',
            '        "exports.readFile = fs.readFile;",',
            '        "exports.__fromLoader = true;",',
            '        "const obj = { exports: {}, module: { exports: {} } };",',
            '        "obj.exports.falsePositive = true;",',
            '        "obj.module.exports.falsePositive = true;"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "virtual:loader-cjs-view") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: (() => {',
            '        return sourceView("exports.fromView = true;");',
            '      })()',
            '    };',
            '  }',
            '  if (url === "virtual:loader-cjs-proto-assignment") {',
            '    return { shortCircuit: true, format: "commonjs", source: "module.exports.__proto__ = \\"assigned-proto\\";" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-values") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; const ns = { member: \\"member-value\\" }; module.exports = { shorthand: v, member: ns.member, call: factory(), after: v }; function factory() { return \\"call-value\\"; }" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-computed") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; const key = \\"computed\\"; module.exports = { before: v, [key]: 2, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-spread") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; const other = { spread: 2 }; module.exports = { before: v, ...other, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-require-spread") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'virtual:child\'), after: v };" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/object-require-spread-relative.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'./reexport-dep.cjs\'), after: v };" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/object-require-spread-member.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'./reexport-dep.cjs\').nested, after: v };" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/object-require-spread-call.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'./tag-dep.cjs\')(), after: v };" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/object-require-spread-optional.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'./reexport-dep.cjs\')?.nested, after: v };" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/object-require-spread-bracket.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'./reexport-dep.cjs\')[\'nested\'], after: v };" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/object-require-spread-tagged.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, ...require(\'./tag-dep.cjs\')`x`, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-call-spread") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; const other = () => ({ spread: 2 }); module.exports = { before: v, ...other(), after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-paren-spread") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; const other = { spread: 2 }; module.exports = { before: v, ...(other), after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-member-spread") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; const ns = { other: { spread: 2 } }; module.exports = { before: v, ...ns.other, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-literals") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = \\"after\\"; module.exports = { stringLiteral: \\"no\\", numberLiteral: 1, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-primitives") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = \\"after\\"; module.exports = { trueValue: true, falseValue: false, nullValue: null, undefinedValue: undefined, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-object-accessor") {',
            '    return { shortCircuit: true, format: "commonjs", source: "const v = 1; module.exports = { before: v, get getter() { return 2; }, after: v };" };',
            '  }',
            '  if (url === "virtual:loader-cjs-define-getters") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "const dep = { value: \\"getter-value\\" };",',
            '        "const value = \\"shorthand-value\\";",',
            '        "Object.defineProperty(exports, \\"getterExport\\", { get() { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"functionGetterExport\\", { get: function () { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"namedFunctionGetterExport\\", { get: function getValue() { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"bracketGetterExport\\", { get() { return dep[\\"value\\"]; } });",',
            '        "Object.defineProperty(exports, \\"valueThenValue\\", { value: \\"first\\", value: \\"second\\" });",',
            '        "Object.defineProperty(exports, \\"valueThenString\\", { value: \\"good\\", \\"value\\": \\"string-wins\\" });",',
            '        "Object.defineProperty(exports, \\"valueThenComputed\\", { value: \\"good\\", [\\"value\\"]: \\"computed-wins\\" });",',
            '        "Object.defineProperty(exports, \\"valueThenShorthand\\", { value: \\"first\\", value });",',
            '        "Object.defineProperty(exports, \\"valueThenMethod\\", { value: \\"first\\", value() { return \\"method-value\\"; } });",',
            '        "Object.defineProperty(exports, \\"arrowGetter\\", { get: () => dep.value });",',
            '        "Object.defineProperty(exports, \\"stringKeyGetter\\", { \\"get\\": function () { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"shorthandValue\\", { value });",',
            '        "Object.defineProperty(exports, \\"computedValue\\", { [\\"value\\"]: 1 });",',
            '        "Object.defineProperty(exports, \\"multiStatementGetter\\", { get() { const v = dep.value; return v; } });",',
            '        "Object.defineProperty(exports, \\"helperValueDescriptor\\", makeDescriptor({ value: dep.value }));",',
            '        "Object.defineProperty(exports, \\"parameterGetter\\", { get(a) { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"parameterFunctionGetter\\", { get: function (a) { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"helperDescriptor\\", makeDescriptor({ get() { return dep.value; } }));",',
            '        "Object.defineProperty(exports, \\"nestedMemberGetter\\", { get() { return dep.value.nested; } });",',
            '        "Object.defineProperty(exports, \\"nestedBracketGetter\\", { get() { return dep[\\"value\\"][\\"nested\\"]; } });",',
            '        "Object.defineProperty(exports, \\"duplicateGet\\", { get() { return dep.value; }, get: function (a) { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"stringThenValue\\", { \\"value\\": \\"bad\\", value: dep.value });",',
            '        "Object.defineProperty(exports, \\"computedThenValue\\", { [\\"value\\"]: \\"bad\\", value: dep.value });",',
            '        "Object.defineProperty(exports, \\"writableThenValue\\", { writable: true, value: dep.value });",',
            '        "Object.defineProperty(exports, \\"configurableThenValue\\", { configurable: true, value: dep.value });",',
            '        "Object.defineProperty(exports, \\"quotedEnumerableThenValue\\", { \\"enumerable\\": true, value: dep.value });",',
            '        "Object.defineProperty(exports, \\"valueThenFalseEnumerable\\", { value: dep.value, enumerable: false });",',
            '        "Object.defineProperty(exports, \\"hiddenGetter\\", { enumerable: false, get() { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"truthyEnumerableGetter\\", { enumerable: 1, get() { return dep.value; } });",',
            '        "Object.defineProperty(exports, \\"getterThenEnumerable\\", { get() { return dep.value; }, enumerable: true });",',
            '        "function makeDescriptor(descriptor) { return descriptor; }"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "virtual:a:b") {',
            '    return { shortCircuit: true, format: "commonjs", source: "exports.marker = \\"colon\\";" };',
            '  }',
            '  if (url === "virtual:a_3Ab") {',
            '    return { shortCircuit: true, format: "commonjs", source: "exports.marker = \\"underscore\\";" };',
            '  }',
            '  if (url === "virtual:child") {',
            '    return { shortCircuit: true, format: "commonjs", source: sourceView("exports.value = 123; exports.fromView = true; exports.conditions = " + JSON.stringify(context.conditions) + ";") };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/query.cjs?one") {',
            '    return { shortCircuit: true, format: "commonjs", source: "exports.query = \\"one\\"; exports.filename = __filename; exports.moduleId = module.id; exports.moduleFilename = module.filename;" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/query.cjs?two") {',
            '    return { shortCircuit: true, format: "commonjs", source: "exports.query = \\"two\\"; exports.filename = __filename; exports.moduleId = module.id; exports.moduleFilename = module.filename;" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/source.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "this.fromThis = true;",',
            '        "exports.filename = __filename;",',
            '        "exports.dirname = __dirname;",',
            '        "exports.dep = require(\\"./dep.cjs\\").depValue;",',
            '        "exports.beforeReturn = true;",',
            '        "return;",',
            '        "exports.afterReturn = true;"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/reexport.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "module.exports = require(\\"./reexport-dep.cjs\\");" };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-reexport.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-string-first-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (\\"default\\" === key || \\"__esModule\\" === key) return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-asi.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\")",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key]",',
            '        "})",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-asi-before-binding.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "init()",',
            '        "var dep = require(\\"./reexport-dep.cjs\\")",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key]",',
            '        "})",',
            '        "exports.own = \\"own-value\\";",',
            '        "function init() {}"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-commented.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "/* header */ var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-line-comment-boundary.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\")// comment before statement boundary",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-block-comment-boundary.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\")/* block comment before statement boundary */",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-hasown-return-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  if (Object.prototype.hasOwnProperty.call(exports, key)) return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-hasown-return-negative.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./guard-dep.cjs\\");",',
            '        "var skip = { foo: true };",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  if (skip.hasOwnProperty(key)) return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-duplicate-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  if (key in exports && exports[key] === dep[key]) return;",',
            '        "  Object.defineProperty(exports, key, { enumerable: true, get: function () { return dep[key]; } });",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-duplicate-enumerable.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  Object.defineProperty(exports, key, { enumerable: true, enumerable: true, get: function () { return dep[key]; } });",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-getter-only.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  Object.defineProperty(exports, key, { get: function () { return dep[key]; } });",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-getter-before-enumerable.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  Object.defineProperty(exports, key, { get: function () { return dep[key]; }, enumerable: true });",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-direct-hasown-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./direct-guard-dep.cjs\\");",',
            '        "var directExportNames = {};",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key !== \\"default\\" && !directExportNames.hasOwnProperty(key)) exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-object-hasown-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./object-guard-dep.cjs\\");",',
            '        "var objectExportNames = {};",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key !== \\"default\\" && !Object.hasOwnProperty.call(objectExportNames, key)) exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-prototype-hasown-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./prototype-guard-dep.cjs\\");",',
            '        "var prototypeExportNames = {};",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key !== \\"default\\" && !Object.prototype.hasOwnProperty.call(prototypeExportNames, key)) exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-semantic-guard.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./guard-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  if (key === \\"foo\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-negative.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-nested.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./reexport-dep.cjs\\");",',
            '        "function copy() {",',
            '        "  Object.keys(dep).forEach(function (key) {",',
            '        "    if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "    exports[key] = dep[key];",',
            '        "  });",',
            '        "}",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-scoped-binding.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = {};",',
            '        "function init() {; var dep = require(\\"./reexport-dep.cjs\\"); }",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-continuation.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./nested-dep.cjs\\").nested;",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/keys-tagged-template.cjs") {',
            '    return {',
            '      shortCircuit: true,',
            '      format: "commonjs",',
            '      source: [',
            '        "var dep = require(\\"./tag-dep.cjs\\")",',
            '        "`ignored`",',
            '        "Object.keys(dep).forEach(function (key) {",',
            '        "  if (key === \\"default\\" || key === \\"__esModule\\") return;",',
            '        "  exports[key] = dep[key];",',
            '        "});",',
            '        "exports.own = \\"own-value\\";"',
            '      ].join("\\n")',
            '    };',
            '  }',
            '  if (url === "file:///loader-cjs-source-app/exports-reassign.cjs") {',
            '    return { shortCircuit: true, format: "commonjs", source: "exports = require(\\"./reexport-dep.cjs\\");" };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent(sourceView + "; export " + resolve + "; export " + load));',
            'const ns = await import("virtual:loader-cjs");',
            'assert.strictEqual(typeof ns.default.readFile, "function");',
            'assert.strictEqual(ns.readFile, ns.default.readFile);',
            'assert.strictEqual(ns.__fromLoader, true);',
            'assert.strictEqual(ns.default.__fromLoader, true);',
            'assert.strictEqual(ns.virtualFilename, "virtual:loader-cjs");',
            'assert.strictEqual(ns.virtualDirname, ".");',
            'assert.strictEqual(ns.virtualModuleId, "virtual:loader-cjs");',
            'assert.strictEqual(ns.virtualModuleFilename, "virtual:loader-cjs");',
            'assert.strictEqual(ns.escapedName, 42);',
            'assert.strictEqual(ns.braceName, 84);',
            'assert.strictEqual(ns.constructor, "own-constructor");',
            'assert.strictEqual(ns.toString, "own-toString");',
            'assert.strictEqual(ns.__proto__, "own-proto");',
            'assert.strictEqual(ns.definedValue, 64);',
            'assert.notStrictEqual(ns.definedProto, "assigned-proto");',
            'assert.strictEqual(ns.childValue, 123);',
            'assert.strictEqual(ns.aliasValue, 77);',
            'assert.strictEqual(ns.aliasResolved, "/loader-cjs-source-app/aliased-dep.cjs");',
            'assert.strictEqual(typeof ns.aliasFsReadFile, "function");',
            'assert.strictEqual(ns.aliasFsResolved, "fs");',
            'assert.strictEqual(ns.childFromView, true);',
            'assert(ns.childConditions.includes("require"));',
            'assert(!ns.childConditions.includes("import"));',
            'assert.strictEqual(ns.moduleRequireValue, 123);',
            'assert.strictEqual(ns.childResolved, "virtual:child");',
            'assert.strictEqual(ns.childResolvedWithOptions, "virtual:child");',
            'assert.strictEqual(ns.syncChainErrorCode, "ERR_LOADER_CHAIN_INCOMPLETE");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(ns, "falsePositive"), false);',
            'assert.strictEqual((await import("virtual:loader-cjs-view")).fromView, true);',
            'assert.strictEqual((await import("virtual:loader-cjs-proto-assignment"))["__proto__"], undefined);',
            'const objectValues = await import("virtual:loader-cjs-object-values");',
            'assert.strictEqual(objectValues.shorthand, 1);',
            'assert.strictEqual(objectValues.member, "member-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(objectValues, "call"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(objectValues, "after"), false);',
            'const computedObject = await import("virtual:loader-cjs-object-computed");',
            'assert.strictEqual(computedObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(computedObject, "computed"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(computedObject, "after"), false);',
            'const spreadObject = await import("virtual:loader-cjs-object-spread");',
            'assert.strictEqual(spreadObject.before, 1);',
            'assert.strictEqual(spreadObject.after, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(spreadObject, "spread"), false);',
            'const requireSpreadObject = await import("virtual:loader-cjs-object-require-spread");',
            'assert.strictEqual(requireSpreadObject.before, 1);',
            'assert.strictEqual(requireSpreadObject.after, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(requireSpreadObject, "value"), false);',
            'const relativeRequireSpreadObject = await import("virtual:loader-cjs-object-require-spread-relative");',
            'assert.strictEqual(relativeRequireSpreadObject.before, 1);',
            'assert.strictEqual(relativeRequireSpreadObject.after, 1);',
            'assert.strictEqual(relativeRequireSpreadObject.reexported, 91);',
            'const memberRequireSpreadObject = await import("virtual:loader-cjs-object-require-spread-member");',
            'assert.strictEqual(memberRequireSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(memberRequireSpreadObject, "after"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(memberRequireSpreadObject, "reexported"), true);',
            'assert.strictEqual(memberRequireSpreadObject.reexported, undefined);',
            'const callRequireSpreadObject = await import("virtual:loader-cjs-object-require-spread-call");',
            'assert.strictEqual(callRequireSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(callRequireSpreadObject, "after"), false);',
            'assert.strictEqual(callRequireSpreadObject.reexported, 1);',
            'const optionalRequireSpreadObject = await import("virtual:loader-cjs-object-require-spread-optional");',
            'assert.strictEqual(optionalRequireSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(optionalRequireSpreadObject, "after"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(optionalRequireSpreadObject, "reexported"), true);',
            'assert.strictEqual(optionalRequireSpreadObject.reexported, undefined);',
            'const bracketRequireSpreadObject = await import("virtual:loader-cjs-object-require-spread-bracket");',
            'assert.strictEqual(bracketRequireSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(bracketRequireSpreadObject, "after"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(bracketRequireSpreadObject, "reexported"), true);',
            'assert.strictEqual(bracketRequireSpreadObject.reexported, undefined);',
            'const taggedRequireSpreadObject = await import("virtual:loader-cjs-object-require-spread-tagged");',
            'assert.strictEqual(taggedRequireSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(taggedRequireSpreadObject, "after"), false);',
            'assert.strictEqual(taggedRequireSpreadObject.reexported, 1);',
            'const callSpreadObject = await import("virtual:loader-cjs-object-call-spread");',
            'assert.strictEqual(callSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(callSpreadObject, "after"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(callSpreadObject, "spread"), false);',
            'const parenSpreadObject = await import("virtual:loader-cjs-object-paren-spread");',
            'assert.strictEqual(parenSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(parenSpreadObject, "after"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(parenSpreadObject, "spread"), false);',
            'const memberSpreadObject = await import("virtual:loader-cjs-object-member-spread");',
            'assert.strictEqual(memberSpreadObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(memberSpreadObject, "after"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(memberSpreadObject, "spread"), false);',
            'const literalObject = await import("virtual:loader-cjs-object-literals");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(literalObject, "stringLiteral"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(literalObject, "numberLiteral"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(literalObject, "after"), false);',
            'const primitiveObject = await import("virtual:loader-cjs-object-primitives");',
            'assert.strictEqual(primitiveObject.trueValue, true);',
            'assert.strictEqual(primitiveObject.falseValue, false);',
            'assert.strictEqual(primitiveObject.nullValue, null);',
            'assert.strictEqual(primitiveObject.undefinedValue, undefined);',
            'assert.strictEqual(primitiveObject.after, "after");',
            'const accessorObject = await import("virtual:loader-cjs-object-accessor");',
            'assert.strictEqual(accessorObject.before, 1);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(accessorObject, "get"), true);',
            'assert.strictEqual(accessorObject.get, undefined);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(accessorObject, "getter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(accessorObject, "after"), false);',
            'const defineGetters = await import("virtual:loader-cjs-define-getters");',
            'assert.strictEqual(defineGetters.getterExport, "getter-value");',
            'assert.strictEqual(defineGetters.functionGetterExport, "getter-value");',
            'assert.strictEqual(defineGetters.namedFunctionGetterExport, "getter-value");',
            'assert.strictEqual(defineGetters.bracketGetterExport, "getter-value");',
            'assert.strictEqual(defineGetters.valueThenValue, "second");',
            'assert.strictEqual(defineGetters.valueThenString, "string-wins");',
            'assert.strictEqual(defineGetters.valueThenComputed, "computed-wins");',
            'assert.strictEqual(defineGetters.valueThenShorthand, "shorthand-value");',
            'assert.strictEqual(typeof defineGetters.valueThenMethod, "function");',
            'assert.strictEqual(defineGetters.valueThenMethod(), "method-value");',
            'assert.strictEqual(defineGetters.valueThenFalseEnumerable, "getter-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "arrowGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "stringKeyGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "shorthandValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "computedValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "multiStatementGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "helperValueDescriptor"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "parameterGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "parameterFunctionGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "helperDescriptor"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "nestedMemberGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "nestedBracketGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "duplicateGet"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "stringThenValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "computedThenValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "writableThenValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "configurableThenValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "quotedEnumerableThenValue"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "hiddenGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "truthyEnumerableGetter"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(defineGetters, "getterThenEnumerable"), false);',
            'assert.strictEqual((await import("virtual:loader-cjs-collision-a")).marker, "colon");',
            'assert.strictEqual((await import("virtual:loader-cjs-collision-b")).marker, "underscore");',
            'const fileQueryA = await import("virtual:file-query-a");',
            'const fileQueryB = await import("virtual:file-query-b");',
            'assert.strictEqual(fileQueryA.query, "one");',
            'assert.strictEqual(fileQueryB.query, "one");',
            'assert.strictEqual(fileQueryA.default, fileQueryB.default);',
            'assert.strictEqual(fileQueryA.filename, "/loader-cjs-source-app/query.cjs");',
            'assert.strictEqual(fileQueryB.filename, "/loader-cjs-source-app/query.cjs");',
            'assert.strictEqual(fileQueryA.moduleId, "/loader-cjs-source-app/query.cjs");',
            'assert.strictEqual(fileQueryB.moduleId, "/loader-cjs-source-app/query.cjs");',
            'assert.strictEqual(fileQueryA.moduleFilename, "/loader-cjs-source-app/query.cjs");',
            'assert.strictEqual(fileQueryB.moduleFilename, "/loader-cjs-source-app/query.cjs");',
            'assert.strictEqual((await import("virtual:loader-cjs-reexport")).reexported, 91);',
            'const keysReexport = await import("virtual:loader-cjs-keys-reexport");',
            'assert.strictEqual(keysReexport.reexported, 91);',
            'assert.strictEqual(keysReexport.own, "own-value");',
            'const keysStringFirstGuard = await import("virtual:loader-cjs-keys-string-first-guard");',
            'assert.strictEqual(keysStringFirstGuard.default.reexported, 91);',
            'assert.strictEqual(keysStringFirstGuard.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysStringFirstGuard, "reexported"), false);',
            'const keysAsi = await import("virtual:loader-cjs-keys-asi");',
            'assert.strictEqual(keysAsi.reexported, 91);',
            'assert.strictEqual(keysAsi.own, "own-value");',
            'const keysAsiBeforeBinding = await import("virtual:loader-cjs-keys-asi-before-binding");',
            'assert.strictEqual(keysAsiBeforeBinding.reexported, 91);',
            'assert.strictEqual(keysAsiBeforeBinding.own, "own-value");',
            'const keysCommented = await import("virtual:loader-cjs-keys-commented");',
            'assert.strictEqual(keysCommented.reexported, 91);',
            'assert.strictEqual(keysCommented.own, "own-value");',
            'const keysLineCommentBoundary = await import("virtual:loader-cjs-keys-line-comment-boundary");',
            'assert.strictEqual(keysLineCommentBoundary.reexported, 91);',
            'assert.strictEqual(keysLineCommentBoundary.own, "own-value");',
            'const keysBlockCommentBoundary = await import("virtual:loader-cjs-keys-block-comment-boundary");',
            'assert.strictEqual(keysBlockCommentBoundary.reexported, 91);',
            'assert.strictEqual(keysBlockCommentBoundary.own, "own-value");',
            'const keysHasOwnReturnGuard = await import("virtual:loader-cjs-keys-hasown-return-guard");',
            'assert.strictEqual(keysHasOwnReturnGuard.reexported, 91);',
            'assert.strictEqual(keysHasOwnReturnGuard.own, "own-value");',
            'const keysHasOwnReturnNegative = await import("virtual:loader-cjs-keys-hasown-return-negative");',
            'assert.strictEqual(keysHasOwnReturnNegative.default.bar, "bar");',
            'assert.strictEqual(keysHasOwnReturnNegative.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysHasOwnReturnNegative, "foo"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysHasOwnReturnNegative, "bar"), false);',
            'const keysDuplicateGuard = await import("virtual:loader-cjs-keys-duplicate-guard");',
            'assert.strictEqual(keysDuplicateGuard.reexported, 91);',
            'assert.strictEqual(keysDuplicateGuard.own, "own-value");',
            'const keysDuplicateEnumerable = await import("virtual:loader-cjs-keys-duplicate-enumerable");',
            'assert.strictEqual(keysDuplicateEnumerable.default.reexported, 91);',
            'assert.strictEqual(keysDuplicateEnumerable.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysDuplicateEnumerable, "reexported"), false);',
            'const keysGetterOnly = await import("virtual:loader-cjs-keys-getter-only");',
            'assert.strictEqual(keysGetterOnly.default.reexported, 91);',
            'assert.strictEqual(keysGetterOnly.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysGetterOnly, "reexported"), false);',
            'const keysGetterBeforeEnumerable = await import("virtual:loader-cjs-keys-getter-before-enumerable");',
            'assert.strictEqual(keysGetterBeforeEnumerable.default.reexported, 91);',
            'assert.strictEqual(keysGetterBeforeEnumerable.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysGetterBeforeEnumerable, "reexported"), false);',
            'const keysDirectHasOwnGuard = await import("virtual:loader-cjs-keys-direct-hasown-guard");',
            'assert.strictEqual(keysDirectHasOwnGuard.directGuarded, 93);',
            'assert.strictEqual(keysDirectHasOwnGuard.own, "own-value");',
            'const keysObjectHasOwnGuard = await import("virtual:loader-cjs-keys-object-hasown-guard");',
            'assert.strictEqual(keysObjectHasOwnGuard.objectGuarded, 94);',
            'assert.strictEqual(keysObjectHasOwnGuard.own, "own-value");',
            'const keysPrototypeHasOwnGuard = await import("virtual:loader-cjs-keys-prototype-hasown-guard");',
            'assert.strictEqual(keysPrototypeHasOwnGuard.prototypeGuarded, 95);',
            'assert.strictEqual(keysPrototypeHasOwnGuard.own, "own-value");',
            'const keysSemanticGuard = await import("virtual:loader-cjs-keys-semantic-guard");',
            'assert.strictEqual(keysSemanticGuard.default.bar, "bar");',
            'assert.strictEqual(keysSemanticGuard.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysSemanticGuard, "foo"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysSemanticGuard, "bar"), false);',
            'const keysNegative = await import("virtual:loader-cjs-keys-negative");',
            'assert.strictEqual(keysNegative.default.reexported, 91);',
            'assert.strictEqual(keysNegative.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysNegative, "reexported"), false);',
            'const keysNested = await import("virtual:loader-cjs-keys-nested");',
            'assert.strictEqual(keysNested.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysNested, "reexported"), false);',
            'const keysScopedBinding = await import("virtual:loader-cjs-keys-scoped-binding");',
            'assert.strictEqual(keysScopedBinding.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysScopedBinding, "reexported"), false);',
            'const keysContinuation = await import("virtual:loader-cjs-keys-continuation");',
            'assert.strictEqual(keysContinuation.default.nestedValue, 92);',
            'assert.strictEqual(keysContinuation.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysContinuation, "nestedValue"), false);',
            'const keysTaggedTemplate = await import("virtual:loader-cjs-keys-tagged-template");',
            'assert.strictEqual(keysTaggedTemplate.default.reexported, 1);',
            'assert.strictEqual(keysTaggedTemplate.own, "own-value");',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(keysTaggedTemplate, "reexported"), false);',
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(await import("virtual:loader-cjs-exports-reassign"), "reexported"), false);',
            'const fileNs = await import("virtual:loader-cjs-file");',
            'assert.strictEqual(fileNs.default.fromThis, true);',
            'assert.strictEqual(fileNs.filename, "/loader-cjs-source-app/source.cjs");',
            'assert.strictEqual(fileNs.dirname, "/loader-cjs-source-app");',
            'assert.strictEqual(fileNs.dep, 17);',
            'assert.strictEqual(fileNs.beforeReturn, true);',
            'assert.strictEqual(fileNs.afterReturn, undefined);',
        ].join('\n')));
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testLoaderModuleSourceValidation = async () => {
    try {
        fs.mkdirSync('/loader-module-source-app', { recursive: true });
        fs.writeFileSync('/loader-module-source-app/as-module.ext', 'export default "from-ext"; export const named = 11;');
        fs.writeFileSync('/loader-module-source-app/null-source.cjs', 'exports.marker = "null-source";');
        fs.writeFileSync('/loader-module-source-app/inherited-null-source.cjs', 'exports.marker = "inherited-null-source";');
        fs.writeFileSync('/loader-module-source-app/undefined-source.cjs', 'exports.marker = "undefined-source";');

        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'function sourceView(text) {',
            '  const bytes = new TextEncoder().encode(text);',
            '  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);',
            '}',
            'async function expectReject(label, promise, code, message) {',
            '  let rejected = false;',
            '  try {',
            '    await promise;',
            '  } catch (error) {',
            '    rejected = true;',
            '    assert.strictEqual(error && error.code, code, label);',
            '    if (message) assert.match(error && error.message, message, label);',
            '  }',
            '  if (!rejected) throw new Error("Missing expected rejection: " + label);',
            '}',
            'function resolve(specifier, context, next) {',
            '  if (specifier === "virtual:module-source") return { shortCircuit: true, url: "virtual:module-source", format: "module" };',
            '  if (specifier === "virtual:module-view") return { shortCircuit: true, url: "virtual:module-view", format: "module" };',
            '  if (specifier === "virtual:static-url") return { shortCircuit: true, url: "data:text/javascript,export default 23;", format: "module" };',
            '  if (specifier === "virtual:invalid-result") return { shortCircuit: true, url: "virtual:invalid-result", format: "module" };',
            '  if (specifier === "virtual:invalid-source") return { shortCircuit: true, url: "virtual:invalid-source", format: "module" };',
            '  if (specifier === "virtual:bad-format") return { shortCircuit: true, url: "virtual:bad-format", format: "module" };',
            '  if (specifier === "virtual:empty-format") return { shortCircuit: true, url: "virtual:empty-format", format: "module" };',
            '  if (specifier === "virtual:bad-url") return { shortCircuit: true, url: "not-a-url" };',
            '  if (specifier === "virtual:missing-url") return { shortCircuit: true };',
            '  if (specifier === "virtual:undefined-url") return { shortCircuit: true, url: undefined };',
            '  if (specifier === "virtual:resolve-esm-hint") return { shortCircuit: true, url: "virtual:resolve-esm-hint", format: "esm" };',
            '  if (specifier === "virtual:bad-resolve-format") return { shortCircuit: true, url: "virtual:bad-resolve-format", format: false };',
            '  if (specifier === "virtual:cjs-null-source") return { shortCircuit: true, url: "file:///loader-module-source-app/null-source.cjs", format: "commonjs" };',
            '  if (specifier === "virtual:cjs-inherited-null-source") return { shortCircuit: true, url: "file:///loader-module-source-app/inherited-null-source.cjs", format: "commonjs" };',
            '  if (specifier === "virtual:cjs-undefined-source") return { shortCircuit: true, url: "file:///loader-module-source-app/undefined-source.cjs", format: "commonjs" };',
            '  if (specifier === "virtual:bad-cjs-source") return { shortCircuit: true, url: "virtual:bad-cjs-source", format: "commonjs" };',
            '  return next(specifier, context);',
            '}',
            'function load(url, context, next) {',
            '  if (url === "virtual:module-source") return { shortCircuit: true, format: "module", source: "export const named = 42; export default named;" };',
            '  if (url === "virtual:module-view") return { shortCircuit: true, format: "module", source: sourceView("export default 7;") };',
            '  if (url === "virtual:invalid-result") return "export default 0;";',
            '  if (url === "virtual:invalid-source") return { shortCircuit: true, format: "module", source: [] };',
            '  if (url === "virtual:bad-format") return { shortCircuit: true, format: "foo", source: "" };',
            '  if (url === "virtual:empty-format") return { shortCircuit: true, format: "", source: "" };',
            '  if (url === "virtual:resolve-esm-hint") return { shortCircuit: true, format: "module", source: "export default 19;" };',
            '  if (url.endsWith("/null-source.cjs")) return { shortCircuit: true, format: "commonjs", source: null };',
            '  if (url.endsWith("/inherited-null-source.cjs")) return { shortCircuit: true, source: null };',
            '  if (url.endsWith("/undefined-source.cjs")) return { shortCircuit: true, format: "commonjs", source: undefined };',
            '  if (url === "virtual:bad-cjs-source") return { shortCircuit: true, format: "commonjs", source: 1n };',
            '  if (url.endsWith("/as-module.ext")) return next(url, { ...context, format: "module" });',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent(sourceView + "; export " + resolve + "; export " + load));',
            'const sourced = await import("virtual:module-source");',
            'assert.strictEqual(sourced.default, 42);',
            'assert.strictEqual(sourced.named, 42);',
            'const staticConsumer = await import("data:text/javascript," + encodeURIComponent(',
            '  "import value, { named } from \\"virtual:module-source\\"; import urlValue from \\"virtual:static-url\\"; export default { value, named, urlValue };"',
            '));',
            'assert.deepStrictEqual(staticConsumer.default, { value: 42, named: 42, urlValue: 23 });',
            'assert.strictEqual((await import("virtual:module-view")).default, 7);',
            'const ext = await import("file:///loader-module-source-app/as-module.ext");',
            'assert.strictEqual(ext.default, "from-ext");',
            'assert.strictEqual(ext.named, 11);',
            'assert.strictEqual((await import("virtual:resolve-esm-hint")).default, 19);',
            'assert.strictEqual((await import("virtual:cjs-null-source")).marker, "null-source");',
            'assert.strictEqual((await import("virtual:cjs-inherited-null-source")).marker, "inherited-null-source");',
            'assert.strictEqual((await import("virtual:cjs-undefined-source")).marker, "undefined-source");',
            'await expectReject("load hook must return object", import("virtual:invalid-result"), "ERR_INVALID_RETURN_VALUE");',
            'await expectReject("resolve format type", import("virtual:bad-resolve-format"), "ERR_INVALID_RETURN_PROPERTY_VALUE");',
            'await expectReject("resolve url must be absolute", import("virtual:bad-url"), "ERR_INVALID_RETURN_PROPERTY_VALUE", /url.*resolve/);',
            'await expectReject("resolve url is required", import("virtual:missing-url"), "ERR_INVALID_RETURN_PROPERTY_VALUE", /url.*resolve/);',
            'await expectReject("resolve url cannot be undefined", import("virtual:undefined-url"), "ERR_INVALID_RETURN_PROPERTY_VALUE", /url.*resolve/);',
            'await expectReject("unknown module format", import("virtual:bad-format"), "ERR_UNKNOWN_MODULE_FORMAT");',
            'await expectReject("empty module format", import("virtual:empty-format"), "ERR_UNKNOWN_MODULE_FORMAT");',
            'await expectReject("invalid module source", import("virtual:invalid-source"), "ERR_INVALID_RETURN_PROPERTY_VALUE");',
            'await expectReject("invalid commonjs source", import("virtual:bad-cjs-source"), "ERR_INVALID_RETURN_PROPERTY_VALUE", /"source".*\'load\'.*got type bigint/);',
        ].join('\n')));
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testSyncBuiltinEsmExports = async () => {
    try {
        const module = await import('node:module');
        const fsModule = await import('node:fs');
        const eventsModule = await import('node:events');
        const vmModule = await import('node:vm');

        const fs = fsModule.default;
        const originalReadFile = fs.readFile;
        const originalReadFileSync = fs.readFileSync;
        const originalWriteFile = fs.writeFile;
        const originalExistsSync = fs.existsSync;
        const originalOpenAsBlob = fs.openAsBlob;
        const replacementReadFile = function replacementReadFile() {};
        const replacementReadFileSync = function replacementReadFileSync() {};
        const replacementWriteFile = function replacementWriteFile() {};
        const replacementExistsSync = function replacementExistsSync() {};
        const replacementOpenAsBlob = function replacementOpenAsBlob() {};

        fs.readFile = replacementReadFile;
        fs.readFileSync = replacementReadFileSync;
        fs.writeFile = replacementWriteFile;
        fs.existsSync = replacementExistsSync;
        fs.openAsBlob = replacementOpenAsBlob;
        module.syncBuiltinESMExports();
        assert.strictEqual(fsModule.readFile, replacementReadFile);
        assert.strictEqual(fsModule.readFileSync, replacementReadFileSync);
        assert.strictEqual(fsModule.writeFile, replacementWriteFile);
        assert.strictEqual(fsModule.existsSync, replacementExistsSync);
        assert.strictEqual(fsModule.openAsBlob, replacementOpenAsBlob);

        delete fs.readFile;
        module.syncBuiltinESMExports();
        assert.strictEqual(fsModule.readFile, undefined);

        fs.readFile = originalReadFile;
        fs.readFileSync = originalReadFileSync;
        fs.writeFile = originalWriteFile;
        fs.existsSync = originalExistsSync;
        fs.openAsBlob = originalOpenAsBlob;
        module.syncBuiltinESMExports();

        const events = eventsModule.default;
        const originalDefaultMaxListeners = events.defaultMaxListeners;
        const originalOnce = events.once;
        const originalGetMaxListeners = events.getMaxListeners;
        const replacementOnce = function replacementOnce() {};
        const replacementGetMaxListeners = function replacementGetMaxListeners() {};
        events.defaultMaxListeners = originalDefaultMaxListeners + 1;
        events.once = replacementOnce;
        events.getMaxListeners = replacementGetMaxListeners;
        module.syncBuiltinESMExports();
        assert.strictEqual(eventsModule.defaultMaxListeners, originalDefaultMaxListeners + 1);
        assert.strictEqual(eventsModule.once, replacementOnce);
        assert.strictEqual(eventsModule.getMaxListeners, replacementGetMaxListeners);
        events.defaultMaxListeners = originalDefaultMaxListeners;
        events.once = originalOnce;
        events.getMaxListeners = originalGetMaxListeners;
        module.syncBuiltinESMExports();

        const moduleDefault = module.default;
        const originalSyncBuiltinESMExports = moduleDefault.syncBuiltinESMExports;
        const originalCreateRequire = moduleDefault.createRequire;
        const replacementSyncBuiltinESMExports = function replacementSyncBuiltinESMExports() {};
        const replacementCreateRequire = function replacementCreateRequire() {};
        moduleDefault.syncBuiltinESMExports = replacementSyncBuiltinESMExports;
        moduleDefault.createRequire = replacementCreateRequire;
        originalSyncBuiltinESMExports();
        assert.strictEqual(module.syncBuiltinESMExports, replacementSyncBuiltinESMExports);
        assert.strictEqual(module.createRequire, replacementCreateRequire);
        moduleDefault.syncBuiltinESMExports = originalSyncBuiltinESMExports;
        moduleDefault.createRequire = originalCreateRequire;
        originalSyncBuiltinESMExports();

        try {
            await import('__wasm_rquickjs_builtin/vm_native');
            throw new Error('private builtin import should not resolve from user modules');
        } catch (error) {
            assert.strictEqual(error.code, 'ERR_MODULE_NOT_FOUND');
        }
        assert.throws(() => import.meta.resolve('__wasm_rquickjs_builtin/vm_native'), { code: 'ERR_MODULE_NOT_FOUND' });
        assert.throws(() => module.createRequire(import.meta.url)('__wasm_rquickjs_builtin/vm_native'), { code: 'MODULE_NOT_FOUND' });

        async function expectPrivateBuiltinRejected(label, promise) {
            try {
                await promise;
            } catch (error) {
                assert.strictEqual(error.code, 'ERR_MODULE_NOT_FOUND', label);
                return;
            }
            throw new Error('private builtin import should not resolve from ' + label);
        }

        await expectPrivateBuiltinRejected(
            'data module',
            import('data:text/javascript,' + encodeURIComponent('import "__wasm_rquickjs_builtin/vm_native"; export default true;')),
        );

        await expectPrivateBuiltinRejected(
            'vm default loader',
            vmModule.default.runInNewContext('import("__wasm_rquickjs_builtin/vm_native")', {}, {
                importModuleDynamically: vmModule.default.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
            }),
        );

        const vmSpecifierSandbox = {};
        const vmSpecifierResult = await vmModule.default.runInNewContext([
            'globalThis.toStringCalls = 0;',
            'const specifier = {',
            '  toString() {',
            '    globalThis.toStringCalls += 1;',
            '    return globalThis.toStringCalls === 1 ? "node:fs" : "__wasm_rquickjs_builtin/vm_native";',
            '  }',
            '};',
            'import(specifier);',
        ].join('\n'), vmSpecifierSandbox, {
            importModuleDynamically: vmModule.default.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.strictEqual(typeof vmSpecifierResult.existsSync, 'function');
        assert.strictEqual(vmSpecifierSandbox.toStringCalls, 1);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testEsmResolutionErrorUrls = async () => {
    try {
        fs.mkdirSync('/esm-error-url-app/dir', { recursive: true });
        fs.mkdirSync('/esm-error-url-app/package-dir', { recursive: true });
        fs.mkdirSync('/esm-error-url-app/relative-package-dir', { recursive: true });
        fs.mkdirSync('/esm-error-url-app/sub', { recursive: true });
        fs.writeFileSync('/esm-error-url-app/package-dir/package.json', JSON.stringify({ main: 'main-entry' }));
        fs.writeFileSync('/esm-error-url-app/package-dir/main-entry.js', 'export default 1;');
        fs.writeFileSync('/esm-error-url-app/relative-package-dir/package.json', JSON.stringify({ main: 'main-entry' }));
        fs.writeFileSync('/esm-error-url-app/relative-package-dir/main-entry.js', 'export default 1;');
        fs.writeFileSync('/esm-error-url-app/entry.mjs', "await import('./miss%2Eing');\n");
        fs.writeFileSync('/esm-error-url-app/relative-package-entry.mjs', "await import('./relative-package-dir');\n");
        fs.writeFileSync('/esm-error-url-app/entry-dot.mjs', "await import('./sub/%2e%2e/missing');\n");
        const originalError = globalThis.Error;
        const originalTypeError = globalThis.TypeError;
        const poisonUrl = {
            configurable: true,
            get() {
                throw new originalError('prototype url getter should not be read');
            },
            set() {
                throw new originalError('prototype url setter should not be called');
            },
        };
        Object.defineProperty(Error.prototype, 'url', poisonUrl);
        Object.defineProperty(Object.prototype, 'url', poisonUrl);
        const originalDefineProperty = Object.defineProperty;
        Object.defineProperty = () => {
            throw new originalError('patched Object.defineProperty should not be called');
        };
        globalThis.Error = function PatchedError() {
            throw new originalError('patched Error constructor should not be called');
        };
        globalThis.TypeError = function PatchedTypeError() {
            throw new originalError('patched TypeError constructor should not be called');
        };
        const cases = [
            ['/esm-error-url-app/dir', 'ERR_UNSUPPORTED_DIR_IMPORT'],
            ['/esm-error-url-app/missing', 'ERR_MODULE_NOT_FOUND'],
            ['/esm-error-url-app/miss%2Eing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/miss%2Eing'],
            ['/esm-error-url-app/missing?x= a#b c', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing?x=%20a#b%20c'],
            ['/esm-error-url-app/entry.mjs', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/miss%2Eing'],
            ['/esm-error-url-app/sub/%2e%2e/missing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing'],
            ['/esm-error-url-app/entry-dot.mjs', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing'],
            ['file:///esm-error-url-app/miss%23ing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/miss%23ing'],
            ['file:///esm-error-url-app/miss%2Eing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/miss%2Eing'],
            ['file:///esm-error-url-app/missing?x= a#b c', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing?x=%20a#b%20c'],
            ['file:///esm-error-url-app/sub/%2e%2e/missing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing'],
            ['file://localhost/esm-error-url-app/sub/%2e%2e/missing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing'],
            ['file://LOCALHOST/esm-error-url-app/sub/%2e%2e/missing', 'ERR_MODULE_NOT_FOUND', 'file:///esm-error-url-app/missing'],
            ['file://example.com/esm-error-url-app/missing', 'ERR_INVALID_FILE_URL_HOST', null],
        ];

        try {
            for (const [specifier, code, expectedUrl = pathToFileURL(specifier).href] of cases) {
                await assert.rejects(
                    import(specifier),
                    (error) => {
                        assert.strictEqual(error.code, code);
                        assert(!Object.prototype.hasOwnProperty.call(error, 'name'));
                        if (expectedUrl === null) {
                            assert(!Object.prototype.hasOwnProperty.call(error, 'url'));
                            assert(error instanceof originalError || error.name === 'TypeError');
                        } else {
                            assert(Object.prototype.hasOwnProperty.call(error, 'url'));
                            assert.strictEqual(error.url, expectedUrl);
                        }
                        return true;
                    }
                );
                const dataSpecifier = expectedUrl === null ? specifier : expectedUrl;
                await assert.rejects(
                    import(`data:text/javascript,import${encodeURIComponent(JSON.stringify(dataSpecifier))}`),
                    (error) => {
                        assert.strictEqual(error.code, code);
                        assert(!Object.prototype.hasOwnProperty.call(error, 'name'));
                        if (expectedUrl === null) {
                            assert(!Object.prototype.hasOwnProperty.call(error, 'url'));
                            assert(error instanceof originalError || error.name === 'TypeError');
                        } else {
                            assert(Object.prototype.hasOwnProperty.call(error, 'url'));
                            assert.strictEqual(error.url, expectedUrl);
                        }
                        return true;
                    }
                );
            }
        } finally {
            globalThis.TypeError = originalTypeError;
            globalThis.Error = originalError;
            Object.defineProperty = originalDefineProperty;
            delete Error.prototype.url;
            delete Object.prototype.url;
        }
        await assert.rejects(import('/esm-error-url-app/dir'), /ERR_UNSUPPORTED_DIR_IMPORT/);
        await assert.rejects(import('file:///esm-error-url-app/package-dir'), /Did you mean/);
        await assert.rejects(
            import('/esm-error-url-app/relative-package-entry.mjs'),
            (error) => error.code === 'ERR_UNSUPPORTED_DIR_IMPORT' && !String(error).includes('Did you mean'),
        );
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsDirectNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-named-export-app', { recursive: true });
        fs.writeFileSync('/cjs-named-export-app/direct.cjs', [
            'exports.foo = "foo";',
            'module.exports.bar = "bar";',
            'exports["baz"] = "baz";',
            'module.exports["π"] = "pi";',
            'exports["invalid identifier"] = "invalid";',
            'module.exports["?invalid"] = "question";',
            'exports.package = "reserved";',
            '// exports.commentOnly = "no";',
            '/* module.exports.blockCommentOnly = "no"; */',
            'const text = "exports.stringOnly = no";',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/bracket-only.js', [
            'exports["bracketOnly"] = "bracket";',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/define-only.js', [
            'Object.defineProperty(exports, "definedOnly", { value: "defined" });',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/object-primitives.cjs', [
            'const value = "after";',
            'module.exports = {',
            '  yes: true,',
            '  no: false,',
            '  empty: null,',
            '  missing: undefined,',
            '  after: value,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/false-positives.cjs', [
            'const myexports = {};',
            'myexports.fake1 = "no";',
            'const obj = { exports: {} };',
            'obj.exports.fake2 = "no";',
            'const notmodule = {};',
            'notmodule.exports = {};',
            'notmodule.exports.fake3 = "no";',
            'if (exports.fake4 === "no") {}',
            'if (module.exports.fake5 == "no") {}',
            'const re = /exports.fake6 = "no"/;',
            'exports.real = "yes";',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/direct-entry.mjs', [
            'import def, { foo, bar, baz, π, package as packageExport } from "./direct.cjs";',
            'import { bracketOnly } from "./bracket-only.js";',
            'import { definedOnly } from "./define-only.js";',
            'import { yes, no, empty, missing, after } from "./object-primitives.cjs";',
            'import * as ns from "./direct.cjs";',
            'import * as fp from "./false-positives.cjs";',
            'export default {',
            '  def, foo, bar, baz, pi: π, packageExport, bracketOnly, definedOnly,',
            '  yes, no, empty, missing, after,',
            '  invalidIdentifier: ns["invalid identifier"],',
            '  questionInvalid: ns["?invalid"],',
            '  hasCommentOnly: Object.prototype.hasOwnProperty.call(ns, "commentOnly"),',
            '  hasBlockCommentOnly: Object.prototype.hasOwnProperty.call(ns, "blockCommentOnly"),',
            '  hasStringOnly: Object.prototype.hasOwnProperty.call(ns, "stringOnly"),',
            '  falsePositiveKeys: Object.keys(fp).filter((key) => key !== "default" && key !== "real"),',
            '  real: fp.real,',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-named-export-app/direct-entry.mjs')).default;
        assert.strictEqual(result.foo, 'foo');
        assert.strictEqual(result.bar, 'bar');
        assert.strictEqual(result.baz, 'baz');
        assert.strictEqual(result.pi, 'pi');
        assert.strictEqual(result.packageExport, 'reserved');
        assert.strictEqual(result.bracketOnly, 'bracket');
        assert.strictEqual(result.definedOnly, 'defined');
        assert.strictEqual(result.yes, true);
        assert.strictEqual(result.no, false);
        assert.strictEqual(result.empty, null);
        assert.strictEqual(result.missing, undefined);
        assert.strictEqual(result.after, 'after');
        assert.strictEqual(result.invalidIdentifier, 'invalid');
        assert.strictEqual(result.questionInvalid, 'question');
        assert.strictEqual(result.def.foo, 'foo');
        assert.strictEqual(result.def['π'], 'pi');
        assert.deepStrictEqual(result.falsePositiveKeys, []);
        assert.strictEqual(result.real, 'yes');
        assert.strictEqual(result.hasCommentOnly, false);
        assert.strictEqual(result.hasBlockCommentOnly, false);
        assert.strictEqual(result.hasStringOnly, false);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsDefinePropertyNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-define-export-app', { recursive: true });
        fs.writeFileSync('/cjs-define-export-app/define.cjs', [
            'const dep = { value: "getter-value" };',
            'Object.defineProperty(exports, "valueExport", { value: "value" });',
            'Object.defineProperty(exports, "getterExport", { enumerable: true, get: function () { return dep.value; } });',
            'Object.defineProperty(module.exports, "moduleGetter", { enumerable: true, get() { return dep.value; } });',
            'Object.defineProperty(exports, "unsafe", { enumerable: true, get() { return dynamic(); } });',
            'Object.defineProperty(exports, "unsafeValueWord", { enumerable: true, get() { return value(); } });',
        ].join('\n'));
        fs.writeFileSync('/cjs-define-export-app/define-entry.mjs', [
            'import { valueExport, getterExport, moduleGetter } from "./define.cjs";',
            'import * as ns from "./define.cjs";',
            'export default {',
            '  valueExport, getterExport, moduleGetter,',
            '  hasUnsafe: Object.prototype.hasOwnProperty.call(ns, "unsafe"),',
            '  hasUnsafeValueWord: Object.prototype.hasOwnProperty.call(ns, "unsafeValueWord"),',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-define-export-app/define-entry.mjs')).default;
        assert.strictEqual(result.valueExport, 'value');
        assert.strictEqual(result.getterExport, 'getter-value');
        assert.strictEqual(result.moduleGetter, 'getter-value');
        assert.strictEqual(result.hasUnsafe, false);
        assert.strictEqual(result.hasUnsafeValueWord, false);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const testCjsReexportNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-reexport-app', { recursive: true });
        fs.writeFileSync('/cjs-reexport-app/dep.cjs', [
            'exports.alpha = "alpha";',
            'exports.beta = "beta";',
        ].join('\n'));
        fs.writeFileSync('/cjs-reexport-app/reexport.cjs', 'module.exports = require("./dep.cjs");');
        fs.writeFileSync('/cjs-reexport-app/transpiler.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, {',
            '    enumerable: true,',
            '    get: function () { return _dep[key]; }',
            '  });',
            '});',
        ].join('\n'));
        fs.writeFileSync('/cjs-reexport-app/not-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(console.log);',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-reexport-app/reexport-entry.mjs', [
            'import { alpha, beta } from "./reexport.cjs";',
            'import { alpha as transAlpha, beta as transBeta } from "./transpiler.cjs";',
            'import * as nonReexport from "./not-reexport.cjs";',
            'export default {',
            '  alpha, beta, transAlpha, transBeta,',
            '  nonReexportKeys: Object.keys(nonReexport).filter((key) => key !== "default" && key !== "own"),',
            '  nonReexportOwn: nonReexport.own,',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-reexport-app/reexport-entry.mjs')).default;
        assert.deepStrictEqual(result, {
            alpha: 'alpha',
            beta: 'beta',
            transAlpha: 'alpha',
            transBeta: 'beta',
            nonReexportKeys: [],
            nonReexportOwn: 'own',
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const testCjsAnalyzerFalsePositiveGuards = async () => {
    try {
        fs.mkdirSync('/cjs-analyzer-guards-app', { recursive: true });
        fs.writeFileSync('/cjs-analyzer-guards-app/esm-with-cjs-text.js', [
            '// exports.commentOnly = "no";',
            'const text = "module.exports = {}; require(";',
            'const re = /exports.regexOnly = "no"/;',
            'const fn = () => /module.exports.arrowRegexOnly = "no"/;',
            'if (typeof module !== "undefined" && module.exports === undefined) {}',
            'const require = () => ({ value: 64 });',
            'const dep = require("./dep.cjs");',
            'export const value = 42;',
            'export const requireValue = dep.value;',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/esm-entry.mjs', [
            'import { value, requireValue } from "./esm-with-cjs-text.js";',
            'export default { value, requireValue };',
        ].join('\n'));
        assert.deepStrictEqual((await import('/cjs-analyzer-guards-app/esm-entry.mjs')).default, { value: 42, requireValue: 64 });

        fs.writeFileSync('/cjs-analyzer-guards-app/whitespace-module.js', 'module /*x*/ . /*y*/ exports = { value: "module" };');
        fs.writeFileSync('/cjs-analyzer-guards-app/whitespace-entry.mjs', [
            'import mod from "./whitespace-module.js";',
            'export default mod.value;',
        ].join('\n'));
        assert.strictEqual((await import('/cjs-analyzer-guards-app/whitespace-entry.mjs')).default, 'module');

        fs.writeFileSync('/cjs-analyzer-guards-app/false-positives.cjs', [
            'const myexports = {};',
            'myexports.fake1 = "no";',
            'const obj = { exports: {} };',
            'obj.exports.fake2 = "no";',
            'const notmodule = {};',
            'notmodule.exports = {};',
            'notmodule.exports.fake3 = "no";',
            'if (exports.fake4 === "no") {}',
            'if (module.exports.fake5 == "no") {}',
            'function f() { return /exports.fake6 = "no"/; }',
            'const g = () => /module.exports.fake7 = "no"/;',
            'exports.real = "yes";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/unsafe-define.cjs', [
            'Object.defineProperty(exports, "unsafeStringReturn", { enumerable: true, get() { const s = "return dep.value"; return dynamic(); } });',
            'Object.defineProperty(exports, "unsafeRegexValue", { enumerable: true, get() { return /value:/; } });',
            'Object.defineProperty(exports, "unsafeRegexDescriptor", { enumerable: /value:/ });',
            'Object.defineProperty(exports, "unsafeNestedValue", { enumerable: true, get() { return { value: dynamic() }; } });',
            'Object.defineProperty(exports, "unsafeMultipleReturn", { enumerable: true, get() { return dep.value; return dynamic(); } });',
            'Object.defineProperty(exports, "unsafeConditionalReturn", { enumerable: true, get() { if (dep) return dep.value; return dynamic(); } });',
            'exports.safe = "yes";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/dep.cjs', 'exports.alpha = "alpha";');
        fs.writeFileSync('/cjs-analyzer-guards-app/dep-nested.cjs', 'exports.nested = { beta: "beta" };');
        fs.writeFileSync('/cjs-analyzer-guards-app/not-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'var other = {};',
            'Object.keys(_dep).forEach(function (key) {',
            '  const msg = "Object.defineProperty(exports, key, { get: function () { return _dep[key]; } })";',
            '});',
            'Object.keys(_dep).forEach(function (key) {',
            '  Object.defineProperty(other, key, { value: 1 });',
            '  exports;',
            '  function unrelated() { return _dep[key]; }',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/nested-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'function copy() {',
            '  Object.keys(_dep).forEach(function (key) {',
            '    if (key === "default" || key === "__esModule") return;',
            '    exports[key] = _dep[key];',
            '  });',
            '}',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/nested-require-binding.cjs', [
            'var _dep = {};',
            'function init() {',
            '  var _dep = require("./dep.cjs");',
            '}',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/unguarded-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  const π = 1;',
            '  Object.defineProperty(exports, key, { enumerable: true, get: function () { return _dep[key]; } });',
            '});',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/hidden-descriptor-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, { enumerable: false, get: function () { return _dep[key]; } });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/extra-descriptor-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, { enumerable: true, get: function () { return _dep[key]; }, configurable: true });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/duplicate-enumerable-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, { enumerable: true, enumerable: true, get: function () { return _dep[key]; } });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/getter-only-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, { get: function () { return _dep[key]; } });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/getter-before-enumerable-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, { get: function () { return _dep[key]; }, enumerable: true });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/reversed-guard-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if ("default" === key || "__esModule" === key) return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/delayed-guard-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  exports[key] = _dep[key];',
            '  if (key === "default" || key === "__esModule") return;',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/nested-guard-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  function guard() {',
            '    if (key === "default" || key === "__esModule") return;',
            '  }',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/for-header-binding.cjs', [
            'for (var _dep = require("./dep.cjs"); false;) {}',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/commented-reexport.cjs', [
            '/* header */ var _dep = require("./dep.cjs");',
            'exports.own = "own";',
            '/* separator */ Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/line-commented-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'exports.own = "own"; // trailing comment',
            '// separator',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/arrow-callback-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach((key) => {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/extra-arg-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '}, null);',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/has-own-guard-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key !== "default" && !Object.prototype.hasOwnProperty.call(exports, key)) exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/duplicate-return-guard-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (key in exports && exports[key] === _dep[key]) return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/module-exports-duplicate-return-guard-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (key in module.exports && module.exports[key] === _dep[key]) return;',
            '  module.exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/skip-map-return-guard.cjs', [
            'var _dep = require("./dep.cjs");',
            'var skip = {};',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (skip.hasOwnProperty(key)) return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/object-hasown-return-guard.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (Object.hasOwnProperty.call(exports, key)) return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/skip-map-duplicate-shape-return-guard.cjs', [
            'var _dep = require("./dep.cjs");',
            'var skip = {};',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (key in skip && skip[key] === _dep[key]) return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/other-binding-duplicate-shape-return-guard.cjs', [
            'var _dep = require("./dep.cjs");',
            'var other = {};',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (key in exports && exports[key] === other[key]) return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/asi-reexport.cjs', [
            'var _dep = require("./dep.cjs")',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key]',
            '})',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/renamed-key-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (name) {',
            '  if (name === "default" || name === "__esModule") return;',
            '  exports[name] = _dep[name];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/require-continuation.cjs', [
            'var _dep = require("./dep.cjs")',
            '+ 0;',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/statement-continuation.cjs', [
            'var _dep = require("./dep.cjs");',
            'false &&',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/conditional-body-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  if (false) exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/intervening-statement-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'function touch() {}',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  touch();',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/prefix-asi-reexport.cjs', [
            'var x = 0;',
            'var _dep = require("./dep.cjs")',
            '++x;',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  exports[key] = _dep[key];',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/continuation.cjs', [
            'module.exports = require("./dep.cjs").nested;',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/binding-continuation.cjs', [
            'var dep = require("./dep-nested.cjs").nested;',
            'Object.keys(dep).forEach(function (key) {',
            '  Object.defineProperty(exports, key, { enumerable: true, get: function () { return dep[key]; } });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/object-literal-values.cjs', [
            'const identifierValue = "identifier";',
            'const memberSource = { x: "member" };',
            'module.exports = {',
            '  identifierValue,',
            '  callExpression: factory(),',
            '  memberExpression: memberSource.x,',
            '  booleanLiteral: true,',
            '  nullLiteral: null,',
            '  undefinedLiteral: undefined,',
            '};',
            'function factory() { return "call"; }',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/object-literal-require-value.cjs', [
            'module.exports = {',
            '  requireValue: require("./dep.cjs"),',
            '  afterRequire: "not-detected",',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/object-literal-unsupported.cjs', [
            'const identifierValue = "identifier";',
            'module.exports = {',
            '  stringLiteral: "not-detected",',
            '  numberLiteral: 1,',
            '  objectLiteral: {},',
            '  callExpression: factory(),',
            '  identifierValue,',
            '};',
            'function factory() { return "not-detected"; }',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/object-literal-call-terminal.cjs', [
            'const afterCall = "after";',
            'module.exports = {',
            '  callValue: factory(),',
            '  afterCall,',
            '};',
            'function factory() { return "call"; }',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/object-literal-method-terminal.cjs', [
            'const beforeMethod = "before";',
            'const afterMethod = "after";',
            'module.exports = {',
            '  beforeMethod,',
            '  method() { return "method"; },',
            '  afterMethod,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/guards-entry.mjs', [
            'import * as fp from "./false-positives.cjs";',
            'import * as unsafe from "./unsafe-define.cjs";',
            'import * as nonReexport from "./not-reexport.cjs";',
            'import * as nestedReexport from "./nested-reexport.cjs";',
            'import * as nestedRequireBinding from "./nested-require-binding.cjs";',
            'import * as unguardedReexport from "./unguarded-reexport.cjs";',
            'import * as hiddenDescriptorReexport from "./hidden-descriptor-reexport.cjs";',
            'import * as extraDescriptorReexport from "./extra-descriptor-reexport.cjs";',
            'import * as duplicateEnumerableReexport from "./duplicate-enumerable-reexport.cjs";',
            'import * as getterOnlyReexport from "./getter-only-reexport.cjs";',
            'import * as getterBeforeEnumerableReexport from "./getter-before-enumerable-reexport.cjs";',
            'import * as reversedGuardReexport from "./reversed-guard-reexport.cjs";',
            'import * as delayedGuardReexport from "./delayed-guard-reexport.cjs";',
            'import * as nestedGuardReexport from "./nested-guard-reexport.cjs";',
            'import * as forHeaderBinding from "./for-header-binding.cjs";',
            'import * as commentedReexport from "./commented-reexport.cjs";',
            'import * as lineCommentedReexport from "./line-commented-reexport.cjs";',
            'import * as arrowCallbackReexport from "./arrow-callback-reexport.cjs";',
            'import * as extraArgReexport from "./extra-arg-reexport.cjs";',
            'import * as hasOwnGuardReexport from "./has-own-guard-reexport.cjs";',
            'import * as duplicateReturnGuardReexport from "./duplicate-return-guard-reexport.cjs";',
            'import * as moduleExportsDuplicateReturnGuardReexport from "./module-exports-duplicate-return-guard-reexport.cjs";',
            'import * as skipMapReturnGuard from "./skip-map-return-guard.cjs";',
            'import * as objectHasOwnReturnGuard from "./object-hasown-return-guard.cjs";',
            'import * as skipMapDuplicateShapeReturnGuard from "./skip-map-duplicate-shape-return-guard.cjs";',
            'import * as otherBindingDuplicateShapeReturnGuard from "./other-binding-duplicate-shape-return-guard.cjs";',
            'import * as asiReexport from "./asi-reexport.cjs";',
            'import * as renamedKeyReexport from "./renamed-key-reexport.cjs";',
            'import * as requireContinuation from "./require-continuation.cjs";',
            'import * as statementContinuation from "./statement-continuation.cjs";',
            'import * as conditionalBodyReexport from "./conditional-body-reexport.cjs";',
            'import * as interveningStatementReexport from "./intervening-statement-reexport.cjs";',
            'import * as prefixAsiReexport from "./prefix-asi-reexport.cjs";',
            'import * as continuation from "./continuation.cjs";',
            'import * as bindingContinuation from "./binding-continuation.cjs";',
            'import * as objectLiteralValues from "./object-literal-values.cjs";',
            'import * as objectLiteralRequireValue from "./object-literal-require-value.cjs";',
            'import * as objectLiteralUnsupported from "./object-literal-unsupported.cjs";',
            'import * as objectLiteralCallTerminal from "./object-literal-call-terminal.cjs";',
            'import * as objectLiteralMethodTerminal from "./object-literal-method-terminal.cjs";',
            'export default {',
            '  fpKeys: Object.keys(fp).filter((key) => key !== "default" && key !== "real"),',
            '  real: fp.real,',
            '  unsafeKeys: Object.keys(unsafe).filter((key) => key !== "default" && key !== "safe"),',
            '  safe: unsafe.safe,',
            '  nonReexportKeys: Object.keys(nonReexport).filter((key) => key !== "default" && key !== "own"),',
            '  own: nonReexport.own,',
            '  nestedReexportKeys: Object.keys(nestedReexport).filter((key) => key !== "default" && key !== "own"),',
            '  nestedOwn: nestedReexport.own,',
            '  nestedRequireBindingKeys: Object.keys(nestedRequireBinding).filter((key) => key !== "default" && key !== "own"),',
            '  nestedRequireBindingOwn: nestedRequireBinding.own,',
            '  unguardedReexportKeys: Object.keys(unguardedReexport).filter((key) => key !== "default"),',
            '  hiddenDescriptorReexportKeys: Object.keys(hiddenDescriptorReexport).filter((key) => key !== "default" && key !== "own"),',
            '  hiddenDescriptorOwn: hiddenDescriptorReexport.own,',
            '  extraDescriptorReexportKeys: Object.keys(extraDescriptorReexport).filter((key) => key !== "default" && key !== "own"),',
            '  extraDescriptorOwn: extraDescriptorReexport.own,',
            '  duplicateEnumerableReexportKeys: Object.keys(duplicateEnumerableReexport).filter((key) => key !== "default" && key !== "own"),',
            '  duplicateEnumerableOwn: duplicateEnumerableReexport.own,',
            '  getterOnlyReexportKeys: Object.keys(getterOnlyReexport).filter((key) => key !== "default" && key !== "own"),',
            '  getterOnlyOwn: getterOnlyReexport.own,',
            '  getterBeforeEnumerableReexportKeys: Object.keys(getterBeforeEnumerableReexport).filter((key) => key !== "default" && key !== "own"),',
            '  getterBeforeEnumerableOwn: getterBeforeEnumerableReexport.own,',
            '  reversedGuardReexportKeys: Object.keys(reversedGuardReexport).filter((key) => key !== "default" && key !== "own"),',
            '  reversedGuardOwn: reversedGuardReexport.own,',
            '  delayedGuardReexportKeys: Object.keys(delayedGuardReexport).filter((key) => key !== "default" && key !== "own"),',
            '  delayedGuardOwn: delayedGuardReexport.own,',
            '  nestedGuardReexportKeys: Object.keys(nestedGuardReexport).filter((key) => key !== "default" && key !== "own"),',
            '  nestedGuardOwn: nestedGuardReexport.own,',
            '  forHeaderBindingKeys: Object.keys(forHeaderBinding).filter((key) => key !== "default" && key !== "own"),',
            '  forHeaderBindingOwn: forHeaderBinding.own,',
            '  commentedAlpha: commentedReexport.alpha,',
            '  lineCommentedAlpha: lineCommentedReexport.alpha,',
            '  arrowCallbackReexportKeys: Object.keys(arrowCallbackReexport).filter((key) => key !== "default" && key !== "own"),',
            '  arrowCallbackOwn: arrowCallbackReexport.own,',
            '  extraArgReexportKeys: Object.keys(extraArgReexport).filter((key) => key !== "default" && key !== "own"),',
            '  extraArgOwn: extraArgReexport.own,',
            '  hasOwnGuardAlpha: hasOwnGuardReexport.alpha,',
            '  duplicateReturnGuardAlpha: duplicateReturnGuardReexport.alpha,',
            '  moduleExportsDuplicateReturnGuardAlpha: moduleExportsDuplicateReturnGuardReexport.alpha,',
            '  skipMapReturnGuardKeys: Object.keys(skipMapReturnGuard).filter((key) => key !== "default" && key !== "own"),',
            '  objectHasOwnReturnGuardKeys: Object.keys(objectHasOwnReturnGuard).filter((key) => key !== "default" && key !== "own"),',
            '  skipMapDuplicateShapeReturnGuardKeys: Object.keys(skipMapDuplicateShapeReturnGuard).filter((key) => key !== "default" && key !== "own"),',
            '  otherBindingDuplicateShapeReturnGuardKeys: Object.keys(otherBindingDuplicateShapeReturnGuard).filter((key) => key !== "default" && key !== "own"),',
            '  asiAlpha: asiReexport.alpha,',
            '  renamedKeyAlpha: renamedKeyReexport.alpha,',
            '  requireContinuationKeys: Object.keys(requireContinuation).filter((key) => key !== "default" && key !== "own"),',
            '  statementContinuationKeys: Object.keys(statementContinuation).filter((key) => key !== "default" && key !== "own"),',
            '  conditionalBodyReexportKeys: Object.keys(conditionalBodyReexport).filter((key) => key !== "default" && key !== "own"),',
            '  interveningStatementReexportKeys: Object.keys(interveningStatementReexport).filter((key) => key !== "default" && key !== "own"),',
            '  prefixAsiAlpha: prefixAsiReexport.alpha,',
            '  continuationKeys: Object.keys(continuation).filter((key) => key !== "default"),',
            '  bindingContinuationKeys: Object.keys(bindingContinuation).filter((key) => key !== "default" && key !== "own"),',
            '  bindingContinuationOwn: bindingContinuation.own,',
            '  objectLiteralValueKeys: Object.keys(objectLiteralValues).filter((key) => key !== "default").sort(),',
            '  identifierValue: objectLiteralValues.identifierValue,',
            '  callExpression: objectLiteralValues.callExpression,',
            '  objectLiteralRequireValueKeys: Object.keys(objectLiteralRequireValue).filter((key) => key !== "default").sort(),',
            '  requireValue: objectLiteralRequireValue.requireValue,',
            '  objectLiteralUnsupportedKeys: Object.keys(objectLiteralUnsupported).filter((key) => key !== "default").sort(),',
            '  objectLiteralCallTerminalKeys: Object.keys(objectLiteralCallTerminal).filter((key) => key !== "default").sort(),',
            '  callValue: objectLiteralCallTerminal.callValue,',
            '  objectLiteralMethodTerminalKeys: Object.keys(objectLiteralMethodTerminal).filter((key) => key !== "default").sort(),',
            '  methodType: typeof objectLiteralMethodTerminal.method,',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-analyzer-guards-app/guards-entry.mjs')).default;
        assert.deepStrictEqual(result.fpKeys, []);
        assert.strictEqual(result.real, 'yes');
        assert.deepStrictEqual(result.unsafeKeys, []);
        assert.strictEqual(result.safe, 'yes');
        assert.deepStrictEqual(result.nonReexportKeys, []);
        assert.strictEqual(result.own, 'own');
        assert.deepStrictEqual(result.nestedReexportKeys, []);
        assert.strictEqual(result.nestedOwn, 'own');
        assert.deepStrictEqual(result.nestedRequireBindingKeys, []);
        assert.strictEqual(result.nestedRequireBindingOwn, 'own');
        assert.deepStrictEqual(result.unguardedReexportKeys, []);
        assert.deepStrictEqual(result.hiddenDescriptorReexportKeys, []);
        assert.strictEqual(result.hiddenDescriptorOwn, 'own');
        assert.deepStrictEqual(result.extraDescriptorReexportKeys, []);
        assert.strictEqual(result.extraDescriptorOwn, 'own');
        assert.deepStrictEqual(result.duplicateEnumerableReexportKeys, []);
        assert.strictEqual(result.duplicateEnumerableOwn, 'own');
        assert.deepStrictEqual(result.getterOnlyReexportKeys, []);
        assert.strictEqual(result.getterOnlyOwn, 'own');
        assert.deepStrictEqual(result.getterBeforeEnumerableReexportKeys, []);
        assert.strictEqual(result.getterBeforeEnumerableOwn, 'own');
        assert.deepStrictEqual(result.reversedGuardReexportKeys, []);
        assert.strictEqual(result.reversedGuardOwn, 'own');
        assert.deepStrictEqual(result.delayedGuardReexportKeys, []);
        assert.strictEqual(result.delayedGuardOwn, 'own');
        assert.deepStrictEqual(result.nestedGuardReexportKeys, []);
        assert.strictEqual(result.nestedGuardOwn, 'own');
        assert.deepStrictEqual(result.forHeaderBindingKeys, []);
        assert.strictEqual(result.forHeaderBindingOwn, 'own');
        assert.strictEqual(result.commentedAlpha, 'alpha');
        assert.strictEqual(result.lineCommentedAlpha, 'alpha');
        assert.deepStrictEqual(result.arrowCallbackReexportKeys, []);
        assert.strictEqual(result.arrowCallbackOwn, 'own');
        assert.deepStrictEqual(result.extraArgReexportKeys, []);
        assert.strictEqual(result.extraArgOwn, 'own');
        assert.strictEqual(result.hasOwnGuardAlpha, 'alpha');
        assert.strictEqual(result.duplicateReturnGuardAlpha, 'alpha');
        assert.strictEqual(result.moduleExportsDuplicateReturnGuardAlpha, 'alpha');
        assert.deepStrictEqual(result.skipMapReturnGuardKeys, []);
        assert.deepStrictEqual(result.objectHasOwnReturnGuardKeys, []);
        assert.deepStrictEqual(result.skipMapDuplicateShapeReturnGuardKeys, []);
        assert.deepStrictEqual(result.otherBindingDuplicateShapeReturnGuardKeys, []);
        assert.strictEqual(result.asiAlpha, 'alpha');
        assert.strictEqual(result.renamedKeyAlpha, 'alpha');
        assert.deepStrictEqual(result.requireContinuationKeys, []);
        assert.deepStrictEqual(result.statementContinuationKeys, []);
        assert.deepStrictEqual(result.conditionalBodyReexportKeys, []);
        assert.deepStrictEqual(result.interveningStatementReexportKeys, []);
        assert.strictEqual(result.prefixAsiAlpha, 'alpha');
        assert.deepStrictEqual(result.continuationKeys, []);
        assert.deepStrictEqual(result.bindingContinuationKeys, []);
        assert.strictEqual(result.bindingContinuationOwn, 'own');
        assert.deepStrictEqual(result.objectLiteralValueKeys, [
            'callExpression',
            'identifierValue',
        ]);
        assert.strictEqual(result.identifierValue, 'identifier');
        assert.strictEqual(result.callExpression, 'call');
        assert.deepStrictEqual(result.objectLiteralRequireValueKeys, ['requireValue']);
        assert.deepStrictEqual(result.requireValue, { alpha: 'alpha' });
        assert.deepStrictEqual(result.objectLiteralUnsupportedKeys, []);
        assert.deepStrictEqual(result.objectLiteralCallTerminalKeys, ['callValue']);
        assert.strictEqual(result.callValue, 'call');
        assert.deepStrictEqual(result.objectLiteralMethodTerminalKeys, ['beforeMethod', 'method']);
        assert.strictEqual(result.methodType, 'function');
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsSharedLoaderIdentity = async () => {
    try {
        fs.mkdirSync('/cjs-shared-loader-app', { recursive: true });
        fs.writeFileSync('/cjs-shared-loader-app/shared.cjs', [
            'globalThis.__sharedLoaderCount = (globalThis.__sharedLoaderCount || 0) + 1;',
            'exports.count = globalThis.__sharedLoaderCount;',
            'exports.marker = "shared";',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/named.cjs', [
            'globalThis.__sharedNamedCount = (globalThis.__sharedNamedCount || 0) + 1;',
            'exports.alpha = "alpha";',
            'module.exports.beta = "beta";',
            'exports.count = globalThis.__sharedNamedCount;',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/esm-first.mjs', [
            'import { createRequire } from "node:module";',
            'import shared from "./shared.cjs";',
            'const require = createRequire(import.meta.url);',
            'const required = require("./shared.cjs");',
            'required.fromRequire = "mutated";',
            'const resolved = require.resolve("./shared.cjs");',
            'export default {',
            '  same: shared === required,',
            '  count: globalThis.__sharedLoaderCount,',
            '  sharedFromRequire: shared.fromRequire,',
            '  cacheExportsSame: require.cache[resolved].exports === shared,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/cjs-first.cjs', [
            'exports.run = async function () {',
            '  const required = require("./shared.cjs");',
            '  required.fromCjsFirst = "yes";',
            '  const imported = await import("./shared.cjs");',
            '  const resolved = require.resolve("./shared.cjs");',
            '  return {',
            '    same: imported.default === required,',
            '    count: globalThis.__sharedLoaderCount,',
            '    importedMutation: imported.default.fromCjsFirst,',
            '    cacheExportsSame: require.cache[resolved].exports === imported.default,',
            '  };',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/named-entry.mjs', [
            'import { createRequire } from "node:module";',
            'import namedDefault, { alpha, beta, count } from "./named.cjs";',
            'const require = createRequire(import.meta.url);',
            'const required = require("./named.cjs");',
            'export default {',
            '  same: namedDefault === required,',
            '  alpha, beta, count,',
            '  loadCount: globalThis.__sharedNamedCount,',
            '};',
        ].join('\n'));
        fs.mkdirSync('/cjs-shared-loader-app/type-module/node_modules/dep-without-package-json', { recursive: true });
        fs.writeFileSync('/cjs-shared-loader-app/type-module/package.json', JSON.stringify({ type: 'module' }));
        fs.writeFileSync('/cjs-shared-loader-app/type-module/index.js', [
            'import dep from "dep-without-package-json/dep.js";',
            'export default { esm: true, dep };',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/type-module/node_modules/dep-without-package-json/dep.js', [
            'globalThis.__sharedBoundaryCount = (globalThis.__sharedBoundaryCount || 0) + 1;',
            'module.exports = { cjs: true, count: globalThis.__sharedBoundaryCount };',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/handled.js', 'exports.source = "source";');

        globalThis.__sharedLoaderCount = 0;
        globalThis.__sharedNamedCount = 0;
        globalThis.__sharedBoundaryCount = 0;

        const esmFirst = (await import('/cjs-shared-loader-app/esm-first.mjs')).default;
        assert.deepStrictEqual(esmFirst, {
            same: true,
            count: 1,
            sharedFromRequire: 'mutated',
            cacheExportsSame: true,
        });

        const cjsFirst = await (await import('/cjs-shared-loader-app/cjs-first.cjs')).default.run();
        assert.deepStrictEqual(cjsFirst, {
            same: true,
            count: 1,
            importedMutation: 'yes',
            cacheExportsSame: true,
        });

        const named = (await import('/cjs-shared-loader-app/named-entry.mjs')).default;
        assert.deepStrictEqual(named, {
            same: true,
            alpha: 'alpha',
            beta: 'beta',
            count: 1,
            loadCount: 1,
        });

        const { createRequire } = await import('node:module');
        const require = createRequire('/cjs-shared-loader-app/main.cjs');
        const originalJsHandler = require.extensions['.js'];
        try {
            require.extensions['.js'] = (module) => {
                module.exports = { fromExtension: true };
            };
            const handled = (await import('/cjs-shared-loader-app/handled.js')).default;
            assert.deepStrictEqual(handled, { fromExtension: true });
            assert.strictEqual(require('/cjs-shared-loader-app/handled.js'), handled);
        } finally {
            require.extensions['.js'] = originalJsHandler;
        }

        const boundary = (await import('/cjs-shared-loader-app/type-module/index.js')).default;
        assert.deepStrictEqual(boundary, {
            esm: true,
            dep: { cjs: true, count: 1 },
        });

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testModuleSyntaxDetectionAndDiagnostics = async () => {
    try {
        fs.mkdirSync('/module-syntax-app/package-without-type', { recursive: true });
        fs.writeFileSync('/module-syntax-app/loose.js', [
            'export default "loose-module";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-source.mjs', [
            'export const named = "named";',
            'export default "source-default";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-side-effect.js', [
            'import "./static-source.mjs";',
            'export default "side-effect-import";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-default.js', [
            'import value from "./static-source.mjs";',
            'export default value;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-named.js', [
            'import { named } from "./static-source.mjs";',
            'export default named;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-namespace.js', [
            'import * as ns from "./static-source.mjs";',
            'export default ns.named;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-export-list.js', [
            'const listed = "listed";',
            'export { listed as default };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-export-star.js', [
            'export * from "./static-source.mjs";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/tla-only.js', [
            'globalThis.__moduleSyntaxTlaOnly = "before";',
            'await Promise.resolve();',
            'globalThis.__moduleSyntaxTlaOnly = "after";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/tla-require-only.js', [
            'await Promise.resolve();',
            'globalThis.__moduleSyntaxTlaRequireOnly = true;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/mixed-export-cjs.js', [
            'export default "esm-wins";',
            'if (false) module.exports = { wrong: true };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/local-cjs-names.js', [
            'const require = 1;',
            'const module = 2;',
            'const exports = 3;',
            'export default { require, module, exports };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-idiom.js', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import.meta.url);',
            'export default { kind: typeof require, resolved: require.resolve("./false-positive.cjs") };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-spaced.js', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import . meta . url);',
            'export default { kind: typeof require, resolved: require.resolve("./false-positive.cjs") };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-commented.js', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import/*x*/.meta.url);',
            'export default { kind: typeof require, resolved: require.resolve("./false-positive.cjs") };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-ambiguous-spaced.js', [
            'const require = createRequire(import . meta . url);',
            'globalThis.__moduleSyntaxAmbiguousSpaced = require.resolve("./false-positive.cjs");',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-ambiguous-commented.js', [
            'const require = createRequire(import/*x*/.meta.url);',
            'globalThis.__moduleSyntaxAmbiguousCommented = require.resolve("./false-positive.cjs");',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-ambiguous-url-prefix-negative.js', [
            'const require = createRequire(import.meta.urlx);',
            'globalThis.__moduleSyntaxAmbiguousUrlPrefix = require.resolve("./false-positive.cjs");',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main-dep.cjs', [
            'module.exports = {',
            '  isMain: require.main === module,',
            '  mainFilename: require.main && require.main.filename,',
            '  processMainFilename: process.mainModule && process.mainModule.filename,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main.cjs', [
            'const dep = require("./entry-main-dep.cjs");',
            'module.exports = {',
            '  isMain: require.main === module,',
            '  processMain: process.mainModule === module,',
            '  mainFilename: require.main && require.main.filename,',
            '  processMainFilename: process.mainModule && process.mainModule.filename,',
            '  dep,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main-dep.mjs', [
            'export const main = import.meta.main;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main.mjs', [
            'import { main as depMain } from "./entry-main-dep.mjs";',
            'export default { main: import.meta.main, depMain };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main-spaced.mjs', [
            'export default {',
            '  spaced: import . meta . main,',
            '  commented: import/*x*/.meta.main,',
            '  prefix: typeof import.meta.mainx,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/import-meta-main-false-positive.mjs', [
            'const obj = { "import": { meta: { main: 1 } }, "//": { import: { meta: { main: 2 } } } };',
            'class C { #import = { meta: { main: 1 } }; m() { return this.#import.meta.main; } }',
            'export default [',
            '  "import.meta.main",',
            '  /import\\.meta\\.main/.source,',
            '  obj["import"].meta.main,',
            '  obj.import.meta.main,',
            '  obj.import . meta . main,',
            '  obj["//"].import.meta.main,',
            '  obj./*x*/import.meta.main,',
            '  obj./* x /* y */import.meta.main,',
            '  obj.//x',
            '    import.meta.main,',
            '  (() => { const s = ".//"; return import.meta.main; })(),',
            '  new C().m(),',
            '  import.meta.main,',
            '  import . meta . main,',
            '  import/*x*/.meta.main,',
            '  typeof import.meta.mainx,',
            '];',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/package-without-type/package.json', JSON.stringify({ main: 'index.js' }));
        fs.writeFileSync('/module-syntax-app/package-without-type/noext-esm', [
            'export default "extensionless-module";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/false-positive.cjs', [
            'const a = "export default no";',
            'const b = /import { nope } from "x"/;',
            '// export const commentOnly = 1;',
            '/* import "comment-only"; */',
            'exports.value = "cjs";',
        ].join('\n'));
        fs.mkdirSync('/module-syntax-app/type-module', { recursive: true });
        fs.writeFileSync('/module-syntax-app/type-module/package.json', JSON.stringify({ type: 'module' }));
        fs.writeFileSync('/module-syntax-app/type-module/cjs.js', 'module.exports = "wrong-extension";');
        fs.writeFileSync('/module-syntax-app/type-module/require.js', 'require("x");');
        fs.writeFileSync('/module-syntax-app/type-module/exports.js', 'exports = {};');
        fs.writeFileSync('/module-syntax-app/type-module/filename.js', 'console.log(__filename);');
        fs.writeFileSync('/module-syntax-app/type-module/dirname.js', 'console.log(__dirname);');
        fs.writeFileSync('/module-syntax-app/type-module/local-require.js', 'const require = 1; export default require;');
        fs.writeFileSync('/module-syntax-app/type-module/dep.mjs', 'export default 2;');
        fs.writeFileSync('/module-syntax-app/type-module/import-module.js', 'import module from "./dep.mjs"; export default module;');
        fs.writeFileSync('/module-syntax-app/type-module/object-exports.js', 'export default { exports: 3 };');
        fs.writeFileSync('/module-syntax-app/query.mjs', [
            'globalThis.__queryModuleCount = (globalThis.__queryModuleCount || 0) + 1;',
            'export const count = globalThis.__queryModuleCount;',
            'export const url = import.meta.url;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/relative-query-entry.mjs', [
            'const one = await import("./query.mjs?relative-one");',
            'const two = await import("./query.mjs?relative-two");',
            'export default {',
            '  one: one.count,',
            '  two: two.count,',
            '  oneUrl: one.url,',
            '  twoUrl: two.url,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-data.json', JSON.stringify({ one: 1 }));
        fs.writeFileSync('/module-syntax-app/attr-cjs.cjs', [
            'exports.data = require("./attr-data.json");',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-entry.mjs', [
            'import data from "./attr-data.json" with { type: "json" };',
            'import dataWithQuery from "./attr-data.json?cache" with { type: "json" };',
            'import cjs from "./attr-cjs.cjs";',
            'export default {',
            '  data,',
            '  dataWithQuery,',
            '  sameAsCjs: data === cjs.data,',
            '  querySameAsCjs: dataWithQuery === cjs.data,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-missing.mjs', [
            'import data from "./attr-data.json";',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-type-mismatch.mjs', [
            'import value from "./static-source.mjs" with { type: "json" };',
            'export default value;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-unsupported.mjs', [
            'import data from "./attr-data.json" with { type: "unsupported" };',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-data-url-entry.mjs', [
            'import data from "data:application/json,{%22two%22:2}" with { type: "json" };',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-data-url-missing.mjs', [
            'import data from "data:application/json,{%22two%22:2}";',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/member-false-positive.js', [
            'const obj = { import: 1 };',
            'obj.import;',
            'const = ;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/property-false-positive.js', [
            '({ export: 1 });',
            'const = ;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/dynamic-import-false-positive.js', [
            'import("./static-source.mjs");',
            'const = ;',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/module-syntax-app/main.cjs');

        assert.strictEqual(require('/module-syntax-app/loose.js').default, 'loose-module');
        assert.strictEqual(require('/module-syntax-app/static-import-side-effect.js').default, 'side-effect-import');
        assert.strictEqual(require('/module-syntax-app/static-import-default.js').default, 'source-default');
        assert.strictEqual(require('/module-syntax-app/static-import-named.js').default, 'named');
        assert.strictEqual(require('/module-syntax-app/static-import-namespace.js').default, 'named');
        assert.strictEqual(require('/module-syntax-app/static-export-list.js').default, 'listed');
        assert.strictEqual(require('/module-syntax-app/static-export-star.js').named, 'named');
        assert.strictEqual(require('/module-syntax-app/package-without-type/noext-esm').default, 'extensionless-module');
        assert.deepStrictEqual(require('/module-syntax-app/false-positive.cjs'), { value: 'cjs' });
        globalThis.__moduleSyntaxTlaOnly = undefined;
        await import('/module-syntax-app/tla-only.js');
        assert.strictEqual(globalThis.__moduleSyntaxTlaOnly, 'after');
        assert.throws(() => require('/module-syntax-app/tla-require-only.js'), /async|top-level await|ERR_REQUIRE_ASYNC_MODULE/i);
        assert.strictEqual(require('/module-syntax-app/mixed-export-cjs.js').default, 'esm-wins');
        assert.strictEqual((await import('/module-syntax-app/mixed-export-cjs.js')).default, 'esm-wins');
        assert.deepStrictEqual(require('/module-syntax-app/local-cjs-names.js').default, {
            require: 1,
            module: 2,
            exports: 3,
        });
        const createRequireIdiom = require('/module-syntax-app/create-require-idiom.js').default;
        assert.deepStrictEqual(createRequireIdiom, {
            kind: 'function',
            resolved: '/module-syntax-app/false-positive.cjs',
        });
        assert.deepStrictEqual(require('/module-syntax-app/create-require-spaced.js').default, createRequireIdiom);
        assert.deepStrictEqual(require('/module-syntax-app/create-require-commented.js').default, createRequireIdiom);
        globalThis.createRequire = createRequire;
        globalThis.__moduleSyntaxAmbiguousSpaced = undefined;
        globalThis.__moduleSyntaxAmbiguousCommented = undefined;
        globalThis.__moduleSyntaxAmbiguousUrlPrefix = undefined;
        assert.throws(() => require('/module-syntax-app/create-require-ambiguous-spaced.js'), /import\.meta|unexpected|SyntaxError/i);
        assert.throws(() => require('/module-syntax-app/create-require-ambiguous-commented.js'), /import\.meta|unexpected|SyntaxError/i);
        assert.throws(() => require('/module-syntax-app/create-require-ambiguous-url-prefix-negative.js'), /urlx|undefined/i);
        assert.strictEqual(globalThis.__moduleSyntaxAmbiguousSpaced, undefined);
        assert.strictEqual(globalThis.__moduleSyntaxAmbiguousCommented, undefined);
        assert.strictEqual(globalThis.__moduleSyntaxAmbiguousUrlPrefix, undefined);
        delete globalThis.createRequire;

        const originalArgv = process.argv.slice();
        const originalMainModule = process.mainModule;
        const originalRequireMain = {
            id: require.main.id,
            filename: require.main.filename,
            path: require.main.path,
            exports: require.main.exports,
            loaded: require.main.loaded,
            parent: require.main.parent,
            children: require.main.children.slice(),
            paths: require.main.paths ? require.main.paths.slice() : require.main.paths,
        };
        try {
            process.argv[1] = '/module-syntax-app/entry-main.cjs';
            const cjsMain = require('/module-syntax-app/entry-main.cjs');
            assert.deepStrictEqual(cjsMain, {
                isMain: true,
                processMain: true,
                mainFilename: '/module-syntax-app/entry-main.cjs',
                processMainFilename: '/module-syntax-app/entry-main.cjs',
                dep: {
                    isMain: false,
                    mainFilename: '/module-syntax-app/entry-main.cjs',
                    processMainFilename: '/module-syntax-app/entry-main.cjs',
                },
            });

            process.argv[1] = '/module-syntax-app/entry-main.mjs';
            const esmMain = (await import('/module-syntax-app/entry-main.mjs')).default;
            assert.deepStrictEqual(esmMain, { main: true, depMain: false });
            process.argv[1] = '/module-syntax-app/entry-main-spaced.mjs';
            assert.deepStrictEqual((await import('/module-syntax-app/entry-main-spaced.mjs')).default, {
                spaced: true,
                commented: true,
                prefix: 'undefined',
            });
            assert.deepStrictEqual(await import('/module-syntax-app/import-meta-main-false-positive.mjs').then((m) => m.default), [
                'import.meta.main',
                'import\\.meta\\.main',
                1,
                1,
                1,
                2,
                1,
                1,
                1,
                false,
                1,
                false,
                false,
                false,
                'undefined',
            ]);
        } finally {
            Object.assign(require.main, originalRequireMain);
            process.argv = originalArgv;
            process.mainModule = originalMainModule;
        }

        await expectImportRejectsMessage('/module-syntax-app/type-module/cjs.js', /use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/require.js', /require is not defined.*use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/exports.js', /exports is not defined.*use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/filename.js', /__filename is not defined.*use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/dirname.js', /__dirname is not defined.*use the '\.cjs' file extension/);
        assert.strictEqual((await import('/module-syntax-app/type-module/local-require.js')).default, 1);
        assert.strictEqual((await import('/module-syntax-app/type-module/import-module.js')).default, 2);
        assert.deepStrictEqual((await import('/module-syntax-app/type-module/object-exports.js')).default, { exports: 3 });
        await expectImportRejectsMessage('data:text/javascript,require;', /require.*not defined/i);
        await expectImportRejectsMessage('data:text/javascript,exports={};', /exports.*not defined/i);
        await expectImportRejectsMessage('data:text/javascript,require_custom;', /^(?!.*in ES module scope)(?!.*use import instead).*$/);

        const propertyKeyModule = await import('data:text/javascript,export default { require: 1 };');
        assert.deepStrictEqual(propertyKeyModule.default, { require: 1 });
        const localBindingModule = await import('data:text/javascript,const module = 1; export default module;');
        assert.strictEqual(localBindingModule.default, 1);
        const importBindingModule = await import('data:text/javascript,import require from "data:text/javascript,export default 1"; export default require;');
        assert.strictEqual(importBindingModule.default, 1);
        const namespaceImportBindingModule = await import('data:text/javascript,import * as module from "data:text/javascript,export default 1"; export default module.default;');
        assert.strictEqual(namespaceImportBindingModule.default, 1);
        const namedImportBindingModule = await import('data:text/javascript,import { value as exports } from "data:text/javascript,export const value = 1"; export default exports;');
        assert.strictEqual(namedImportBindingModule.default, 1);
        const functionParamModule = await import('data:text/javascript,function f(require) { return require; } export default f(1);');
        assert.strictEqual(functionParamModule.default, 1);
        const arrowParamModule = await import('data:text/javascript,export default ((require) => require)(1);');
        assert.strictEqual(arrowParamModule.default, 1);
        const methodNameModule = await import('data:text/javascript,export default { require() { return 1; }, f(module) { return module; } }.f(2);');
        assert.strictEqual(methodNameModule.default, 2);
        const asyncMethodModule = await import('data:text/javascript,export default { async require() { return 1; } };');
        assert.strictEqual(await asyncMethodModule.default.require(), 1);
        const generatorMethodModule = await import('data:text/javascript,export default { *module() { yield 1; } }.module().next().value;');
        assert.strictEqual(generatorMethodModule.default, 1);
        const getterMethodModule = await import('data:text/javascript,export default { get exports() { return 1; } }.exports;');
        assert.strictEqual(getterMethodModule.default, 1);
        const stringKeyMethodModule = await import('data:text/javascript,export default { "x"(require) { return require; } }.x(1);');
        assert.strictEqual(stringKeyMethodModule.default, 1);
        const commentedMethodModule = await import('data:text/javascript,export default { /* comment */ require() { return 1; } }.require();');
        assert.strictEqual(commentedMethodModule.default, 1);
        const generatorModule = await import('data:text/javascript,function* module() { yield 1; } export default module().next().value;');
        assert.strictEqual(generatorModule.default, 1);
        const multiDeclarationModule = await import('data:text/javascript,const a = 0,\n  require = 1;\nexport default require;');
        assert.strictEqual(multiDeclarationModule.default, 1);
        const destructuringModule = await import('data:text/javascript,const {\n  module\n} = { module: 1 };\nexport default module;');
        assert.strictEqual(destructuringModule.default, 1);
        const memberNameModule = await import('data:text/javascript,export default import.meta.require;');
        assert.strictEqual(memberNameModule.default, undefined);

        globalThis.__queryModuleCount = 0;
        const queryBase = pathToFileURL('/module-syntax-app/query.mjs').href;
        const queryOne = await import(`${queryBase}?one`);
        const queryTwo = await import(`${queryBase}?two`);
        assert.strictEqual(queryOne.count, 1);
        assert.strictEqual(queryTwo.count, 2);
        assert.match(queryOne.url, /\?one$/);
        assert.match(queryTwo.url, /\?two$/);
        const relativeQuery = (await import('/module-syntax-app/relative-query-entry.mjs')).default;
        assert.deepStrictEqual(relativeQuery, {
            one: 3,
            two: 4,
            oneUrl: 'file:///module-syntax-app/query.mjs?relative-one',
            twoUrl: 'file:///module-syntax-app/query.mjs?relative-two',
        });
        const attrEntry = (await import('/module-syntax-app/attr-entry.mjs')).default;
        assert.deepStrictEqual(attrEntry, {
            data: { one: 1 },
            dataWithQuery: { one: 1 },
            sameAsCjs: true,
            querySameAsCjs: false,
        });
        assert.deepStrictEqual((await import('/module-syntax-app/attr-data-url-entry.mjs')).default, { two: 2 });
        await expectImportRejectsCode('/module-syntax-app/attr-missing.mjs', 'ERR_IMPORT_ATTRIBUTE_MISSING');
        await expectImportRejectsCode('/module-syntax-app/attr-type-mismatch.mjs', 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
        await expectImportRejectsCode('/module-syntax-app/attr-unsupported.mjs', 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
        await expectImportRejectsCode('/module-syntax-app/attr-data-url-missing.mjs', 'ERR_IMPORT_ATTRIBUTE_MISSING');

        assert.throws(() => require('/module-syntax-app/member-false-positive.js'), /unexpected|expecting|SyntaxError/i);
        assert.throws(() => require('/module-syntax-app/property-false-positive.js'), /unexpected|expecting|SyntaxError/i);
        assert.throws(() => require('/module-syntax-app/dynamic-import-false-positive.js'), /unexpected|expecting|SyntaxError/i);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testPackageCustomConditions = async () => {
    const hadPackageConditions = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_package_conditions');
    const originalPackageConditions = globalThis.__wasm_rquickjs_package_conditions;
    try {
        globalThis.__wasm_rquickjs_package_conditions = ['custom-condition', 'another'];

        fs.mkdirSync('/package-custom-conditions-app/node_modules/conditional-pkg', { recursive: true });
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/package.json', JSON.stringify({
            exports: {
                './condition': {
                    'custom-condition': {
                        import: './custom.mjs',
                        require: './custom.cjs',
                    },
                    another: './another.mjs',
                    import: './import.mjs',
                    require: './require.cjs',
                    default: './default.mjs',
                },
            },
        }));
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/custom.mjs', 'export default "custom-import";');
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/custom.cjs', 'exports.selected = "custom-require";');
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/another.mjs', 'export default "another";');
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/import.mjs', 'export default "import";');
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/require.cjs', 'module.exports = "require";');
        fs.writeFileSync('/package-custom-conditions-app/node_modules/conditional-pkg/default.mjs', 'export default "default";');
        fs.writeFileSync('/package-custom-conditions-app/entry.mjs', [
            'import selected from "conditional-pkg/condition";',
            'export default selected;',
        ].join('\n'));
        fs.writeFileSync('/package-custom-conditions-app/reexport.cjs', 'module.exports = require("conditional-pkg/condition");');
        fs.writeFileSync('/package-custom-conditions-app/facade-entry.mjs', [
            'import { selected } from "./reexport.cjs";',
            'export default selected;',
        ].join('\n'));

        const imported = (await import('/package-custom-conditions-app/entry.mjs')).default;
        assert.strictEqual(imported, 'custom-import');

        const { createRequire } = await import('node:module');
        const require = createRequire('/package-custom-conditions-app/entry.cjs');
        assert.deepStrictEqual(require('conditional-pkg/condition'), { selected: 'custom-require' });

        const facadeImported = (await import('/package-custom-conditions-app/facade-entry.mjs')).default;
        assert.strictEqual(facadeImported, 'custom-require');

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        if (hadPackageConditions) {
            globalThis.__wasm_rquickjs_package_conditions = originalPackageConditions;
        } else {
            delete globalThis.__wasm_rquickjs_package_conditions;
        }
    }
};

export const testCjsPackageJsonParseCache = async () => {
    try {
        const root = '/package-json-cache-app';
        const require = createRequire(`${root}/entry.cjs`);
        fs.mkdirSync(`${root}/node_modules/cached-pkg`, { recursive: true });
        fs.writeFileSync(`${root}/node_modules/cached-pkg/package.json`, JSON.stringify({
            exports: './entry.js',
        }));
        fs.writeFileSync(`${root}/node_modules/cached-pkg/entry.js`, 'module.exports = { cached: true };');
        fs.writeFileSync(`${root}/node_modules/cached-pkg/changed.js`, 'module.exports = { changed: true };');
        fs.writeFileSync(`${root}/app.cjs`, [
            'const assert = require("assert");',
            'const path = require("path");',
            'const fs = require("fs");',
            'const pkgJsonPath = "/package-json-cache-app/node_modules/cached-pkg/package.json";',
            'const first = require.resolve("cached-pkg");',
            'fs.writeFileSync(pkgJsonPath, JSON.stringify({ exports: "./changed.js" }));',
            'const second = require.resolve("cached-pkg");',
            'assert.strictEqual(first, second);',
            'assert.strictEqual(path.basename(first), "entry.js");',
            'module.exports = true;',
        ].join('\n'));

        assert.strictEqual(require(`${root}/app.cjs`), true);

        fs.mkdirSync(`${root}/node_modules/cached-esm-pkg`, { recursive: true });
        fs.writeFileSync(`${root}/node_modules/cached-esm-pkg/package.json`, JSON.stringify({
            exports: {
                './first': './entry.mjs',
                './second': './entry.mjs',
            },
        }));
        fs.writeFileSync(`${root}/node_modules/cached-esm-pkg/entry.mjs`, 'export default { cached: true };');
        fs.writeFileSync(`${root}/node_modules/cached-esm-pkg/changed.mjs`, 'export default { changed: true };');
        fs.writeFileSync(`${root}/esm-entry.mjs`, [
            'const fs = await import("node:fs");',
            'const first = await import("cached-esm-pkg/first");',
            'fs.writeFileSync("/package-json-cache-app/node_modules/cached-esm-pkg/package.json", JSON.stringify({ exports: { "./second": "./changed.mjs" } }));',
            'const second = await import("cached-esm-pkg/second");',
            'export default { first: first.default, second: second.default };',
        ].join('\n'));

        assert.deepStrictEqual((await import(`${root}/esm-entry.mjs`)).default, {
            first: { cached: true },
            second: { cached: true },
        });
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsPackageReexportNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/pkg/index.js', [
            'exports.alpha = "alpha";',
            'exports.beta = "beta";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/pkg/subpath.js', [
            'exports.sub = "sub";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/reexport-package.cjs', 'module.exports = require("pkg");');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-subpath.cjs', 'module.exports = require("pkg/subpath");');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/file-pkg.js', 'exports.file = "file";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-file-package.cjs', 'module.exports = require("file-pkg");');
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/bare-non-string-main', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-non-string-main/package.json', JSON.stringify({
            main: {},
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-non-string-main/index.js', 'exports.bareNonStringMain = "bare-non-string-main";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-bare-non-string-main.cjs', 'module.exports = require("bare-non-string-main");');
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/bare-null-main', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-null-main/package.json', JSON.stringify({
            main: null,
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-null-main/index.js', 'exports.bareNullMain = "bare-null-main";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-bare-null-main.cjs', 'module.exports = require("bare-null-main");');
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/bare-non-string-type', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-non-string-type/package.json', JSON.stringify({
            type: {},
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-non-string-type/index.js', 'exports.bareNonStringType = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-bare-non-string-type.cjs', 'module.exports = require("bare-non-string-type");');
        fs.writeFileSync('/cjs-package-reexport-app/bare-non-string-type-entry.mjs', [
            'import { bareNonStringType } from "./reexport-bare-non-string-type.cjs";',
            'export default bareNonStringType;',
        ].join('\n'));
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/bare-null-type', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-null-type/package.json', JSON.stringify({
            type: null,
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-null-type/index.js', 'exports.bareNullType = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-bare-null-type.cjs', 'module.exports = require("bare-null-type");');
        fs.writeFileSync('/cjs-package-reexport-app/bare-null-type-entry.mjs', [
            'import { bareNullType } from "./reexport-bare-null-type.cjs";',
            'export default bareNullType;',
        ].join('\n'));
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/bare-non-string-name', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-non-string-name/package.json', JSON.stringify({
            name: {},
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-non-string-name/index.js', 'exports.bareNonStringName = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-bare-non-string-name.cjs', 'module.exports = require("bare-non-string-name");');
        fs.writeFileSync('/cjs-package-reexport-app/bare-non-string-name-entry.mjs', [
            'import { bareNonStringName } from "./reexport-bare-non-string-name.cjs";',
            'export default bareNonStringName;',
        ].join('\n'));
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/bare-null-name', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-null-name/package.json', JSON.stringify({
            name: null,
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/bare-null-name/index.js', 'exports.bareNullName = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-bare-null-name.cjs', 'module.exports = require("bare-null-name");');
        fs.writeFileSync('/cjs-package-reexport-app/bare-null-name-entry.mjs', [
            'import { bareNullName } from "./reexport-bare-null-name.cjs";',
            'export default bareNullName;',
        ].join('\n'));

        fs.mkdirSync('/cjs-package-reexport-app/node_modules/exported-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/package.json', JSON.stringify({
            exports: {
                '.': './main.cjs',
                './feature': './feature.cjs',
                './condition': {
                    import: './import.mjs',
                    'module-sync': './sync.cjs',
                    require: './require.cjs',
                    default: './default.cjs',
                },
            },
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/main.cjs', 'exports.main = "main";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/feature.cjs', 'exports.feature = "feature";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/sync.cjs', 'exports.condition = "module-sync";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/require.cjs', 'exports.condition = "require";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/default.cjs', 'exports.condition = "default";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/import.mjs', 'export const condition = "import";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-exported-root.cjs', 'module.exports = require("exported-pkg");');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-exported-feature.cjs', 'module.exports = require("exported-pkg/feature");');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-exported-condition.cjs', 'module.exports = require("exported-pkg/condition");');

        fs.writeFileSync('/cjs-package-reexport-app/package.json', JSON.stringify({
            imports: {
                '#dep': './imports-target.cjs',
            },
        }));
        fs.writeFileSync('/cjs-package-reexport-app/imports-target.cjs', 'exports.imported = "imported";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-imports.cjs', 'module.exports = require("#dep");');

        fs.mkdirSync('/cjs-package-reexport-app/relative-main-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/relative-main-pkg/package.json', JSON.stringify({
            main: 'main.cjs',
        }));
        fs.writeFileSync('/cjs-package-reexport-app/relative-main-pkg/main.cjs', 'exports.relativeMain = "relative-main";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-relative-main.cjs', 'module.exports = require("./relative-main-pkg");');
        fs.mkdirSync('/cjs-package-reexport-app/relative-index-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/relative-index-pkg/index.js', 'exports.relativeIndex = "relative-index";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-relative-index.cjs', 'module.exports = require("./relative-index-pkg");');
        fs.mkdirSync('/cjs-package-reexport-app/non-string-main-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/non-string-main-pkg/package.json', JSON.stringify({
            main: {},
        }));
        fs.writeFileSync('/cjs-package-reexport-app/non-string-main-pkg/index.js', 'exports.nonStringMainIndex = "non-string-main-index";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-non-string-main.cjs', 'module.exports = require("./non-string-main-pkg");');
        fs.mkdirSync('/cjs-package-reexport-app/malformed-relative-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/malformed-relative-pkg/package.json', '{');
        fs.writeFileSync('/cjs-package-reexport-app/malformed-relative-pkg/index.js', 'exports.malformedIndex = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-malformed-relative.cjs', 'module.exports = require("./malformed-relative-pkg");');
        fs.writeFileSync('/cjs-package-reexport-app/malformed-relative-entry.mjs', [
            'import { malformedIndex } from "./reexport-malformed-relative.cjs";',
            'export default malformedIndex;',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/json-analysis.json', '"exports.jsonFalsePositive = true;"');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-json-analysis.cjs', 'module.exports = require("./json-analysis");');
        fs.writeFileSync('/cjs-package-reexport-app/json-analysis-entry.mjs', [
            'import { jsonFalsePositive } from "./reexport-json-analysis.cjs";',
            'export default jsonFalsePositive;',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/implicit-cjs.cjs', 'exports.implicitCjs = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-implicit-cjs.cjs', 'module.exports = require("./implicit-cjs");');
        fs.writeFileSync('/cjs-package-reexport-app/implicit-cjs-entry.mjs', [
            'import { implicitCjs } from "./reexport-implicit-cjs.cjs";',
            'export default implicitCjs;',
        ].join('\n'));

        fs.mkdirSync('/cjs-package-reexport-app/node_modules/transitive-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/transitive-pkg/index.js', [
            'exports.gamma = "gamma";',
            'exports.delta = "delta";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/reexport-transpiler.cjs', [
            'var dep = require("transitive-pkg");',
            'Object.keys(dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, {',
            '    enumerable: true,',
            '    get: function () { return dep[key]; }',
            '  });',
            '});',
        ].join('\n'));

        fs.mkdirSync('/cjs-package-reexport-app/node_modules/cycle-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/cycle-a.cjs', [
            'module.exports = require("cycle-pkg");',
            'exports.a = "a";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/cycle-pkg/index.js', [
            'module.exports = require("../../cycle-a.cjs");',
            'exports.b = "b";',
        ].join('\n'));

        fs.writeFileSync('/cjs-package-reexport-app/reexport-continuation.cjs', [
            'var ignored = require("pkg").nested;',
            'exports.own = "own";',
        ].join('\n'));

        fs.writeFileSync('/cjs-package-reexport-app/node_modules/analysis-native.node', 'not a native addon');
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/analysis-native', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/analysis-native/index.js', 'exports.wrong = "wrong";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-native.cjs', 'module.exports = require("analysis-native");');
        fs.writeFileSync('/cjs-package-reexport-app/native-named-entry.mjs', [
            'import { wrong } from "./reexport-native.cjs";',
            'export default wrong;',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/analysis-exports.js', 'exports.wrong = "wrong";');
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/analysis-exports', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/analysis-exports/package.json', JSON.stringify({
            exports: './main.cjs',
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/analysis-exports/main.cjs', 'exports.right = "right";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-analysis-exports.cjs', 'module.exports = require("analysis-exports");');
        fs.writeFileSync('/cjs-package-reexport-app/analysis-exports-entry.mjs', [
            'import { right } from "./reexport-analysis-exports.cjs";',
            'export default right;',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/analysis-exports-wrong-entry.mjs', [
            'import { wrong } from "./reexport-analysis-exports.cjs";',
            'export default wrong;',
        ].join('\n'));

        fs.writeFileSync('/cjs-package-reexport-app/package-entry.mjs', [
            'import packageDefault, { alpha, beta } from "./reexport-package.cjs";',
            'import { sub } from "./reexport-subpath.cjs";',
            'import { file } from "./reexport-file-package.cjs";',
            'import { bareNonStringMain } from "./reexport-bare-non-string-main.cjs";',
            'import { bareNullMain } from "./reexport-bare-null-main.cjs";',
            'import { main } from "./reexport-exported-root.cjs";',
            'import { feature } from "./reexport-exported-feature.cjs";',
            'import { condition } from "./reexport-exported-condition.cjs";',
            'import { imported } from "./reexport-imports.cjs";',
            'import { relativeMain } from "./reexport-relative-main.cjs";',
            'import { relativeIndex } from "./reexport-relative-index.cjs";',
            'import { nonStringMainIndex } from "./reexport-non-string-main.cjs";',
            'import { gamma, delta } from "./reexport-transpiler.cjs";',
            'import * as continuation from "./reexport-continuation.cjs";',
            'import * as cycle from "./cycle-a.cjs";',
            'export default {',
            '  alpha, beta, defaultAlpha: packageDefault.alpha, sub, file, bareNonStringMain, bareNullMain, main, feature, condition, imported, relativeMain, relativeIndex, nonStringMainIndex, gamma, delta,',
            '  continuationKeys: Object.keys(continuation).filter((key) => key !== "default" && key !== "own"),',
            '  continuationOwn: continuation.own,',
            '  cycleKeys: Object.keys(cycle).filter((key) => key !== "default").sort(),',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-package-reexport-app/package-entry.mjs')).default;
        assert.deepStrictEqual(result, {
            alpha: 'alpha',
            beta: 'beta',
            defaultAlpha: 'alpha',
            sub: 'sub',
            file: 'file',
            bareNonStringMain: 'bare-non-string-main',
            bareNullMain: 'bare-null-main',
            main: 'main',
            feature: 'feature',
            condition: 'module-sync',
            imported: 'imported',
            relativeMain: 'relative-main',
            relativeIndex: 'relative-index',
            nonStringMainIndex: 'non-string-main-index',
            gamma: 'gamma',
            delta: 'delta',
            continuationKeys: [],
            continuationOwn: 'own',
            cycleKeys: ['a', 'b'],
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/native-named-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'wrong' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/implicit-cjs-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'implicitCjs' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/malformed-relative-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'malformedIndex' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/json-analysis-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'jsonFalsePositive' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/bare-non-string-type-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'bareNonStringType' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/bare-null-type-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'bareNullType' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/bare-non-string-name-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'bareNonStringName' not found/,
        });
        await assert.rejects(() => import('/cjs-package-reexport-app/bare-null-name-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'bareNullName' not found/,
        });
        assert.strictEqual((await import('/cjs-package-reexport-app/analysis-exports-entry.mjs')).default, 'right');
        await assert.rejects(() => import('/cjs-package-reexport-app/analysis-exports-wrong-entry.mjs'), {
            name: 'SyntaxError',
            message: /Named export 'wrong' not found/,
        });
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testFindPackageJson = async () => {
    try {
        const { createRequire, findPackageJSON } = await import('node:module');
        const require = createRequire('/find-package-json-app/entry.cjs');

        fs.mkdirSync('/find-package-json-app/node_modules/pkg/subfolder', { recursive: true });
        fs.mkdirSync('/find-package-json-app/node_modules/pkg/subfolder2', { recursive: true });
        fs.mkdirSync('/find-package-json-app/node_modules/pkg2', { recursive: true });
        fs.mkdirSync('/find-package-json-app/packages/nested/sub-pkg-cjs', { recursive: true });
        fs.mkdirSync('/find-package-json-app/packages/nested/sub-pkg-esm', { recursive: true });

        fs.writeFileSync('/find-package-json-app/package.json', JSON.stringify({ name: 'root-app' }));
        fs.writeFileSync('/find-package-json-app/packages/nested/package.json', JSON.stringify({ name: 'nested-parent' }));
        fs.writeFileSync('/find-package-json-app/packages/nested/sub-pkg-cjs/index.cjs', [
            'const { findPackageJSON } = require("node:module");',
            'module.exports = findPackageJSON("..", __filename);',
        ].join('\n'));
        fs.writeFileSync('/find-package-json-app/packages/nested/sub-pkg-esm/index.mjs', [
            'import { findPackageJSON } from "node:module";',
            'export default findPackageJSON("..", import.meta.url);',
        ].join('\n'));

        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder/index.js', 'module.exports = { subfolder: true };');
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder/package.json', JSON.stringify({
            name: 'pkg-subfolder',
            secretNumberSubfolder: 11,
        }));
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder2/index.js', 'module.exports = { subfolder2: true };');
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder2/package.json', JSON.stringify({
            name: 'pkg-subfolder2',
            secretNumberSubfolder2: 22,
        }));
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/package.json', JSON.stringify({
            name: 'pkg',
            exports: './subfolder/index.js',
            secretNumberPkgRoot: 33,
        }));
        fs.writeFileSync('/find-package-json-app/node_modules/pkg2/package.json', JSON.stringify({
            name: 'pkg2',
            main: '/find-package-json-app/node_modules/pkg/subfolder2/index.js',
            secretNumberPkg2: 44,
        }));

        assert.throws(
            () => findPackageJSON(),
            { code: 'ERR_MISSING_ARGS' },
        );

        for (const invalidBase of [null, {}, [], Symbol('invalid'), () => {}, true, false, 1, 0]) {
            assert.throws(
                () => findPackageJSON('', invalidBase),
                { code: 'ERR_INVALID_ARG_TYPE' },
            );
        }

        const basePath = '/find-package-json-app/entry.mjs';
        const baseUrl = pathToFileURL(basePath);
        const subfolderPackageJson = '/find-package-json-app/node_modules/pkg/subfolder/package.json';
        const nestedPackageJson = '/find-package-json-app/packages/nested/package.json';
        const pkgRootPackageJson = '/find-package-json-app/node_modules/pkg/package.json';
        const pkg2RootPackageJson = '/find-package-json-app/node_modules/pkg2/package.json';

        assert.strictEqual(
            findPackageJSON('./node_modules/pkg/subfolder/index.js', baseUrl.href),
            subfolderPackageJson,
        );
        assert.strictEqual(
            findPackageJSON(new URL('./node_modules/pkg/subfolder/index.js', baseUrl), baseUrl),
            subfolderPackageJson,
        );
        assert.strictEqual(
            findPackageJSON('./node_modules/pkg/subfolder/index.js', basePath),
            subfolderPackageJson,
        );

        const cjsParentPackageJson = require('/find-package-json-app/packages/nested/sub-pkg-cjs/index.cjs');
        assert.strictEqual(cjsParentPackageJson, nestedPackageJson);

        const esmParentPackageJson = (await import('/find-package-json-app/packages/nested/sub-pkg-esm/index.mjs')).default;
        assert.strictEqual(esmParentPackageJson, nestedPackageJson);

        assert.strictEqual(findPackageJSON('pkg', baseUrl), pkgRootPackageJson);
        assert.strictEqual(findPackageJSON('pkg2', baseUrl), pkg2RootPackageJson);

        const pkgResolved = require.resolve('pkg', { paths: ['/find-package-json-app'] });
        assert.strictEqual(findPackageJSON(pkgResolved), subfolderPackageJson);
        assert.strictEqual(findPackageJSON(pathToFileURL(pkgResolved).href), subfolderPackageJson);
        assert.strictEqual(findPackageJSON(pathToFileURL(pkgResolved)), subfolderPackageJson);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testVmMainContextDefaultLoader = async () => {
    try {
        const vm = await import('node:vm');
        const { default: assert } = await import('node:assert');
        const { pathToFileURL } = await import('node:url');

        fs.mkdirSync('/vm-default-loader-app/subdir', { recursive: true });
        fs.mkdirSync('/vm-default-loader-app/other', { recursive: true });
        fs.mkdirSync('/vm-default-loader-app/space dir', { recursive: true });
        fs.writeFileSync('/vm-default-loader-app/subdir/message.mjs', [
            'export const value = "from-subdir";',
            'export default { value };',
        ].join('\n'));
        fs.writeFileSync('/vm-default-loader-app/other/message.mjs', [
            'export const value = "from-other";',
            'export default { value };',
        ].join('\n'));
        fs.writeFileSync('/vm-default-loader-app/space dir/message.mjs', [
            'export const value = "from-space";',
            'export default { value };',
        ].join('\n'));
        fs.writeFileSync('/vm-default-loader-app/message.mjs', [
            'export const value = "from-cwd";',
            'export default { value };',
        ].join('\n'));

        assert.strictEqual(typeof vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER, 'symbol');
        assert.strictEqual(typeof vm.Module, 'function');
        assert.strictEqual(typeof vm.SourceTextModule, 'function');
        assert.strictEqual(typeof vm.SyntheticModule, 'function');
        assert.throws(() => new vm.Module(), {
            name: 'TypeError',
            message: 'Module is not a constructor',
        });
        assert.throws(() => new vm.SourceTextModule(null), { code: 'ERR_INVALID_ARG_TYPE' });
        assert.strictEqual(new vm.SourceTextModule('') instanceof vm.Module, true);
        const util = await import('node:util');
        const inspectContext = vm.createContext({ foo: 'bar' });
        const inspectSourceTextModule = new vm.SourceTextModule('1', { context: inspectContext });
        assert.strictEqual(util.inspect(inspectSourceTextModule), [
            'SourceTextModule {',
            "  status: 'unlinked',",
            "  identifier: 'vm:module(0)',",
            "  context: { foo: 'bar' }",
            '}',
        ].join('\n'));
        assert.strictEqual(util.inspect(inspectSourceTextModule, { depth: -1 }), '[SourceTextModule]');
        const inspectSyntheticModule = new vm.SyntheticModule([], () => {}, { context: inspectContext });
        assert.strictEqual(util.inspect(inspectSyntheticModule), [
            'SyntheticModule {',
            "  status: 'unlinked',",
            "  identifier: 'vm:module(0)',",
            "  context: { foo: 'bar' }",
            '}',
        ].join('\n'));
        assert.strictEqual(util.inspect(inspectSyntheticModule, { depth: -1 }), '[SyntheticModule]');
        for (const invalidThis of [null, { __proto__: null }, vm.SourceTextModule.prototype]) {
            assert.throws(() => inspectSourceTextModule[util.inspect.custom].call(invalidThis), {
                name: 'TypeError',
                code: 'ERR_INVALID_ARG_TYPE',
                message: /The "this" argument must be an instance of Module/,
            });
        }
        assert.throws(() => new vm.SyntheticModule(undefined, () => {}, {}), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
            message: 'The "exportNames" argument must be an Array of unique strings. Received undefined',
        });
        assert.throws(() => new vm.SyntheticModule(['x', 'x'], () => {}, {}), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_VALUE',
            message: "The property 'exportNames.x' is duplicated. Received 'x'",
        });
        assert.throws(() => new vm.SyntheticModule([], undefined, {}), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
        });
        assert.throws(() => new vm.SyntheticModule([], () => {}, null), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
        });
        for (const invalidInitializeImportMeta of [null, {}, 0, Symbol.iterator, [], 'string', false]) {
            assert.throws(() => new vm.SourceTextModule('', {
                initializeImportMeta: invalidInitializeImportMeta,
            }), {
                name: 'TypeError',
                code: 'ERR_INVALID_ARG_TYPE',
            });
        }

        const importMetaModule = new vm.SourceTextModule('globalThis.vmImportMetaResult = import.meta;', {
            initializeImportMeta(meta, module) {
                assert.strictEqual(module, importMetaModule);
                assert.strictEqual(this, undefined);
                meta.prop = 42;
            },
        });
        await importMetaModule.link(() => {});
        await importMetaModule.evaluate();
        assert.strictEqual(typeof globalThis.vmImportMetaResult, 'object');
        assert.strictEqual(Object.getPrototypeOf(globalThis.vmImportMetaResult), null);
        assert.deepStrictEqual(Reflect.ownKeys(globalThis.vmImportMetaResult), ['prop']);
        assert.strictEqual(globalThis.vmImportMetaResult.prop, 42);
        delete globalThis.vmImportMetaResult;

        const importMetaSloppyThisModule = new vm.SourceTextModule('globalThis.vmImportMetaSloppyThis = import.meta.value;', {
            initializeImportMeta: Function('meta', 'module', 'meta.value = this === globalThis;'),
        });
        await importMetaSloppyThisModule.link(() => {});
        await importMetaSloppyThisModule.evaluate();
        assert.strictEqual(globalThis.vmImportMetaSloppyThis, true);
        delete globalThis.vmImportMetaSloppyThis;

        const importMetaTemplateModule = new vm.SourceTextModule('globalThis.vmImportMetaTemplate = `${import.meta.prop}:${`${import.meta.prop}`}`;', {
            initializeImportMeta(meta) {
                meta.prop = 'template';
            },
        });
        await importMetaTemplateModule.link(() => {});
        await importMetaTemplateModule.evaluate();
        assert.strictEqual(globalThis.vmImportMetaTemplate, 'template:template');
        delete globalThis.vmImportMetaTemplate;

        const importMetaFalsePositiveModule = new vm.SourceTextModule(`
            globalThis.vmImportMetaFalsePositives = [
                "import.meta",
                /import.meta/.source,
                Array.from(/import.meta/.source).join(""),
                ({ import: { meta: 7 } }). /* comment */ import.meta,
                typeof importMeta,
            ];
            // import.meta
            /* import.meta */
            for (const ch of /import.meta/.source) {}
            for (const ch of /* comment */ /import.meta/.source) {}
        `, {
            initializeImportMeta() {
                throw new Error('unreachable');
            },
        });
        await importMetaFalsePositiveModule.link(() => {});
        await importMetaFalsePositiveModule.evaluate();
        assert.deepStrictEqual(globalThis.vmImportMetaFalsePositives, ['import.meta', 'import.meta', 'import.meta', 7, 'undefined']);
        delete globalThis.vmImportMetaFalsePositives;

        const sourceTextParserFalsePositiveModule = new vm.SourceTextModule(`
            const text = "import { x } from 'dep'; export const wrong = 1;";
            const regex = /import "dep"; export const wrong = 1;/;
            // import "dep"; export const wrong = 1;
            /* import "dep"; export const wrong = 1; */
            globalThis.vmSourceTextParserFalsePositives = [text.includes("export const wrong"), regex.test('import "dep"; export const wrong = 1;')];
        `);
        assert.deepStrictEqual(sourceTextParserFalsePositiveModule.dependencySpecifiers, []);
        await sourceTextParserFalsePositiveModule.link(() => {
            throw new Error('unreachable');
        });
        await sourceTextParserFalsePositiveModule.evaluate();
        assert.deepStrictEqual(globalThis.vmSourceTextParserFalsePositives, [true, true]);
        delete globalThis.vmSourceTextParserFalsePositives;

        const sourceTextExportRegexModule = new vm.SourceTextModule('export const r = /import "dep"; export const wrong = 1;/;');
        assert.deepStrictEqual(sourceTextExportRegexModule.dependencySpecifiers, []);
        await sourceTextExportRegexModule.link(() => {
            throw new Error('unreachable');
        });
        await sourceTextExportRegexModule.evaluate();
        assert.strictEqual(sourceTextExportRegexModule.namespace.r.test('import "dep"; export const wrong = 1;'), true);
        assert.strictEqual(Object.prototype.hasOwnProperty.call(sourceTextExportRegexModule.namespace, 'wrong'), false);

        const sourceTextPropertyExportModule = new vm.SourceTextModule(`
            const o = { export: 1 };
            class C { export() { return 2; } }
            globalThis.vmSourceTextPropertyExport = [o.export, new C().export()];
        `);
        await sourceTextPropertyExportModule.link(() => {});
        await sourceTextPropertyExportModule.evaluate();
        assert.deepStrictEqual(globalThis.vmSourceTextPropertyExport, [1, 2]);
        delete globalThis.vmSourceTextPropertyExport;

        const sourceTextMultilineExportModule = new vm.SourceTextModule(`
            export const a = 1,
                b = 2;
        `);
        await sourceTextMultilineExportModule.link(() => {});
        await sourceTextMultilineExportModule.evaluate();
        assert.strictEqual(sourceTextMultilineExportModule.namespace.a, 1);
        assert.strictEqual(sourceTextMultilineExportModule.namespace.b, 2);

        const sourceTextNestedTemplateModule = new vm.SourceTextModule('const s = `${`import "dep"; export const wrong = 1;`}`; globalThis.vmSourceTextNestedTemplate = s;');
        assert.deepStrictEqual(sourceTextNestedTemplateModule.dependencySpecifiers, []);
        await sourceTextNestedTemplateModule.link(() => {
            throw new Error('unreachable');
        });
        await sourceTextNestedTemplateModule.evaluate();
        assert.strictEqual(globalThis.vmSourceTextNestedTemplate, 'import "dep"; export const wrong = 1;');
        delete globalThis.vmSourceTextNestedTemplate;

        const syntheticModule = new vm.SyntheticModule(['x'], function() {
            syntheticEvaluateCalled = true;
            this.setExport('x', 1);
        });
        var syntheticEvaluateCalled = false;
        assert.strictEqual(syntheticModule instanceof vm.Module, true);
        assert.strictEqual(syntheticModule instanceof vm.SourceTextModule, false);
        assert.strictEqual(typeof syntheticModule.setExport, 'function');
        await syntheticModule.link(() => {});
        assert.strictEqual(syntheticModule.namespace.x, undefined);
        await syntheticModule.evaluate();
        assert.strictEqual(syntheticEvaluateCalled, true);
        assert.strictEqual(syntheticModule.namespace.x, 1);
        assert.strictEqual(Object.getOwnPropertyDescriptor(syntheticModule.namespace, 'x').configurable, false);
        assert.throws(() => syntheticModule.setExport(1, 2), TypeError);
        assert.throws(() => syntheticModule.setExport('missing', 2), ReferenceError);

        const prelinkedSynthetic = new vm.SyntheticModule(['x'], function() {});
        assert.throws(() => prelinkedSynthetic.setExport('x', 1), {
            code: 'ERR_VM_MODULE_STATUS',
        });

        const rejectedSynthetic = new vm.SyntheticModule([], function() {
            const promise = Promise.reject(new Error('ignored'));
            promise.catch(() => {});
            return promise;
        });
        await rejectedSynthetic.link(() => {});
        assert.strictEqual(await rejectedSynthetic.evaluate(), undefined);

        const liveSynthetic = new vm.SyntheticModule(['x'], function() {
            liveSynthetic.setExport('x', 1);
        });
        const liveSyntheticUser = new vm.SourceTextModule('import { x } from "synthetic"; export const getX = () => x;');
        await liveSyntheticUser.link((specifier) => {
            assert.strictEqual(specifier, 'synthetic');
            return liveSynthetic;
        });
        await liveSyntheticUser.evaluate();
        assert.strictEqual(liveSyntheticUser.namespace.getX(), 1);
        liveSynthetic.setExport('x', 42);
        assert.strictEqual(liveSyntheticUser.namespace.getX(), 42);

        const dedupedSyntheticUser = new vm.SourceTextModule('import { x } from "synthetic"; import "synthetic"; export const getX = () => x;');
        assert.deepStrictEqual(dedupedSyntheticUser.dependencySpecifiers, ['synthetic']);
        let dedupedSyntheticLinkCalls = 0;
        await dedupedSyntheticUser.link((specifier) => {
            dedupedSyntheticLinkCalls++;
            assert.strictEqual(specifier, 'synthetic');
            return liveSynthetic;
        });
        assert.strictEqual(dedupedSyntheticLinkCalls, 1);
        await dedupedSyntheticUser.evaluate();
        assert.strictEqual(dedupedSyntheticUser.namespace.getX(), 42);

        const aliasSyntheticUser = new vm.SourceTextModule('import { x as y } from "synthetic"; export const getY = () => y;');
        await aliasSyntheticUser.link(() => liveSynthetic);
        await aliasSyntheticUser.evaluate();
        assert.strictEqual(aliasSyntheticUser.namespace.getY(), 42);
        liveSynthetic.setExport('x', 7);
        assert.strictEqual(aliasSyntheticUser.namespace.getY(), 7);

        const scopedSyntheticUser = new vm.SourceTextModule(`
            import { x } from "synthetic";
            export const shadow = (x) => x;
            export const property = () => ({ x: 1 }).x;
            export const shorthand = () => ({ x }).x;
            export const regex = () => /x/.test("x");
        `);
        await scopedSyntheticUser.link(() => liveSynthetic);
        await scopedSyntheticUser.evaluate();
        assert.strictEqual(scopedSyntheticUser.namespace.shadow(3), 3);
        assert.strictEqual(scopedSyntheticUser.namespace.property(), 1);
        assert.strictEqual(scopedSyntheticUser.namespace.shorthand(), 7);
        assert.strictEqual(scopedSyntheticUser.namespace.regex(), true);
        liveSynthetic.setExport('x', 8);
        assert.strictEqual(scopedSyntheticUser.namespace.shorthand(), 8);

        const unicodeSyntheticUser = new vm.SourceTextModule('import { x as π } from "synthetic"; export const get = () => π;');
        await unicodeSyntheticUser.link(() => liveSynthetic);
        await unicodeSyntheticUser.evaluate();
        assert.strictEqual(unicodeSyntheticUser.namespace.get(), 8);

        const internalNameSyntheticUser = new vm.SourceTextModule('import { x } from "synthetic"; export const leak = __wasm_rquickjs_vm_imports;');
        await internalNameSyntheticUser.link(() => liveSynthetic);
        await assert.rejects(internalNameSyntheticUser.evaluate(), ReferenceError);

        const missingImportHelperCount = () => Object.getOwnPropertyNames(globalThis)
            .filter((name) => name.indexOf('__wasm_rquickjs_vm_missing_dynamic_import__') !== -1)
            .length;
        const missingImportFlagHelperCount = () => Object.getOwnPropertyNames(globalThis)
            .filter((name) => name.indexOf('__wasm_rquickjs_vm_missing_dynamic_import_flag__') !== -1)
            .length;
        const missingImportHelperCountBefore = missingImportHelperCount();
        const missingImportFlagHelperCountBefore = missingImportFlagHelperCount();
        assert.strictEqual(new vm.Script('1 + 1').runInThisContext(), 2);
        assert.strictEqual(new vm.Script('1 + 1').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('1 + 1\n// sourceMappingURL=wrong.map').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('1 + 1\n//#sourceMappingURL=nospace.map').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('1 + 1\n//#    sourceMappingURL=multi-space.map').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('const s = "//# sourceMappingURL=string.map";').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('const s = `//# sourceMappingURL=template.map`;').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('/[//# sourceMappingURL=regex.map]/;').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('/*\n//# sourceMappingURL=inside-block.map\n*/').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('1 + 1\n/*# sourceMappingURL=block.map */').sourceMapURL, undefined);
        assert.strictEqual(new vm.Script('1 + 1\n//# sourceMappingURL=script.map').sourceMapURL, 'script.map');
        assert.strictEqual(new vm.Script('1;\n//# sourceMappingURL=semi.map').sourceMapURL, 'semi.map');
        assert.strictEqual(new vm.Script('1 + 1\n//#\tsourceMappingURL=tab.map').sourceMapURL, 'tab.map');
        assert.strictEqual(new vm.Script('1 + 1\n//#\vsourceMappingURL=vertical-tab.map').sourceMapURL, 'vertical-tab.map');
        assert.strictEqual(new vm.Script('1 + 1\n//#\fsourceMappingURL=form-feed.map').sourceMapURL, 'form-feed.map');
        assert.strictEqual(new vm.Script('1 + 1\n//#\u00a0sourceMappingURL=nbsp.map').sourceMapURL, 'nbsp.map');
        assert.strictEqual(new vm.Script('const s = `${1 //# sourceMappingURL=expr.map\n}`;').sourceMapURL, 'expr.map');
        const receiverScript = new vm.Script('');
        assert.throws(() => receiverScript.runInNewContext.call('hello'), {
            name: 'TypeError',
            message: 'this.runInContext is not a function',
        });
        assert.throws(() => receiverScript.runInNewContext.call(null), {
            name: 'TypeError',
            message: "Cannot read properties of null (reading 'runInContext')",
        });
        assert.throws(() => receiverScript.runInNewContext.call(undefined), {
            name: 'TypeError',
            message: "Cannot read properties of undefined (reading 'runInContext')",
        });
        const overriddenReceiverScript = new vm.Script('41');
        overriddenReceiverScript.runInContext = function(context, options) {
            assert.strictEqual(vm.isContext(context), true);
            assert.deepStrictEqual(options, { displayErrors: false });
            return 99;
        };
        assert.strictEqual(overriddenReceiverScript.runInNewContext({}, { displayErrors: false }), 99);
        for (const invalidSandbox of [null, 1, 'x']) {
            assert.throws(() => receiverScript.runInNewContext(invalidSandbox), {
                name: 'TypeError',
                code: 'ERR_INVALID_ARG_TYPE',
            });
        }
        const genericReceiverSandbox = {};
        assert.strictEqual(vm.Script.prototype.runInNewContext.call({
            runInContext(context, options) {
                assert.strictEqual(context, genericReceiverSandbox);
                assert.strictEqual(vm.isContext(context), true);
                assert.deepStrictEqual(options, { displayErrors: false });
                return 42;
            },
        }, genericReceiverSandbox, { displayErrors: false }), 42);
        let genericReceiverWasCalled = false;
        assert.strictEqual(vm.Script.prototype.runInNewContext.call({
            runInContext(context) {
                genericReceiverWasCalled = true;
                assert.strictEqual(vm.isContext(context), true);
                return 43;
            },
        }), 43);
        assert.strictEqual(genericReceiverWasCalled, true);
        for (const invalidSandbox of [null, 1, 'x']) {
            genericReceiverWasCalled = false;
            assert.throws(() => vm.Script.prototype.runInNewContext.call({
                runInContext() {
                    genericReceiverWasCalled = true;
                },
            }, invalidSandbox), {
                name: 'TypeError',
                code: 'ERR_INVALID_ARG_TYPE',
            });
            assert.strictEqual(genericReceiverWasCalled, false);
        }
        for (const invalidOptions of [
            { contextName: null },
            { contextOrigin: null },
            { contextCodeGeneration: null },
            { contextCodeGeneration: 1 },
            { contextCodeGeneration: { strings: null } },
            { contextCodeGeneration: { strings: 1 } },
            { contextCodeGeneration: { wasm: null } },
            { contextCodeGeneration: { wasm: 1 } },
            { microtaskMode: 'bad' },
        ]) {
            genericReceiverWasCalled = false;
            const expectedCode = invalidOptions.microtaskMode === 'bad' ? 'ERR_INVALID_ARG_VALUE' : 'ERR_INVALID_ARG_TYPE';
            assert.throws(() => vm.Script.prototype.runInNewContext.call({
                runInContext() {
                    genericReceiverWasCalled = true;
                },
            }, {}, invalidOptions), {
                name: 'TypeError',
                code: expectedCode,
            });
            assert.strictEqual(genericReceiverWasCalled, false);
            assert.throws(() => receiverScript.runInNewContext({}, invalidOptions), {
                name: 'TypeError',
                code: expectedCode,
            });
        }
        assert.throws(() => receiverScript.runInNewContext(null, { microtaskMode: 'bad' }), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
        });
        assert.throws(() => receiverScript.runInNewContext(null, { contextCodeGeneration: 1 }), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
        });
        assert.throws(() => receiverScript.runInContext.call('hello', vm.createContext({})), {
            name: 'TypeError',
            message: 'Illegal invocation',
        });
        assert.throws(() => receiverScript.runInThisContext.call('hello'), {
            name: 'TypeError',
            message: 'Illegal invocation',
        });
        assert.throws(() => receiverScript.createCachedData.call('hello'), {
            name: 'TypeError',
            message: 'Illegal invocation',
        });
        assert.deepStrictEqual(Object.getOwnPropertySymbols(receiverScript), []);
        assert.throws(() => vm.Script.prototype.runInThisContext.call({ _code: '40 + 2' }), {
            name: 'TypeError',
            message: 'Illegal invocation',
        });
        const sandboxWriteBack = { foo: 0, baz: 3 };
        globalThis.vmWriteBackOuterFoo = 2;
        assert.strictEqual(new vm.Script('foo = 1; bar = 2; if (baz !== 3) throw new Error("bad baz");').runInNewContext(sandboxWriteBack), undefined);
        assert.strictEqual(sandboxWriteBack.foo, 1);
        assert.strictEqual(sandboxWriteBack.bar, 2);
        assert.strictEqual(globalThis.vmWriteBackOuterFoo, 2);
        delete globalThis.vmWriteBackOuterFoo;
        const directWriteBack = { foo: 0 };
        assert.strictEqual(vm.runInNewContext('foo = 3; bar = 4; "ok"', directWriteBack), 'ok');
        assert.deepStrictEqual(directWriteBack, { foo: 3, bar: 4 });
        const throwWriteBack = { foo: 0 };
        assert.throws(() => vm.runInNewContext('foo = 5; throw new Error("boom")', throwWriteBack), {
            name: 'Error',
            message: 'boom',
        });
        assert.strictEqual(throwWriteBack.foo, 5);
        const deleteWriteBack = { foo: 0, bar: 1 };
        assert.strictEqual(vm.runInNewContext('foo = 6; delete globalThis.foo; bar = 2', deleteWriteBack), 2);
        assert.deepStrictEqual(deleteWriteBack, { bar: 2 });
        const poisonedWriteBack = { foo: 0 };
        assert.strictEqual(vm.runInNewContext('Object.keys = () => []; foo = 7; bar = 8', poisonedWriteBack), 8);
        assert.deepStrictEqual(poisonedWriteBack, { foo: 7, bar: 8 });
        const accessorWriteBack = {};
        assert.strictEqual(vm.runInNewContext('Object.defineProperty(globalThis, "boom", { enumerable: true, configurable: true, get() { throw new Error("getter"); } }); "ok"', accessorWriteBack), 'ok');
        const boomDescriptor = Object.getOwnPropertyDescriptor(accessorWriteBack, 'boom');
        assert.strictEqual(boomDescriptor.enumerable, true);
        assert.strictEqual(typeof boomDescriptor.get, 'function');
        assert.throws(() => accessorWriteBack.boom, {
            name: 'Error',
            message: 'getter',
        });
        const nonEnumerableWriteBack = { x: 1 };
        assert.strictEqual(vm.runInNewContext('delete globalThis.x; Object.defineProperty(globalThis, "x", { value: 2, configurable: true }); "ok"', nonEnumerableWriteBack), 'ok');
        assert.deepStrictEqual(Object.getOwnPropertyDescriptor(nonEnumerableWriteBack, 'x'), {
            value: 2,
            writable: false,
            enumerable: false,
            configurable: true,
        });
        const callPoisonWriteBack = { foo: 0 };
        assert.strictEqual(vm.runInNewContext('Function.prototype.call = () => { throw new Error("poison"); }; foo = 9; bar = 10', callPoisonWriteBack), 10);
        assert.strictEqual(callPoisonWriteBack.foo, 9);
        assert.strictEqual(callPoisonWriteBack.bar, 10);
        const originalErrorWriteBack = {};
        Object.defineProperty(originalErrorWriteBack, 'foo', {
            value: 0,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        assert.throws(() => vm.runInNewContext('foo = 1; throw new Error("boom")', originalErrorWriteBack), {
            name: 'Error',
            message: 'boom',
        });
        assert.strictEqual(originalErrorWriteBack.foo, 0);
        const readonlyWriteBack = {};
        Object.defineProperty(readonlyWriteBack, 'foo', {
            value: 0,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        assert.strictEqual(vm.runInNewContext('foo = 1; bar = 2', readonlyWriteBack), 2);
        assert.strictEqual(readonlyWriteBack.foo, 0);
        assert.strictEqual(readonlyWriteBack.bar, 2);
        assert.strictEqual(vm.compileFunction('return 1')(), 1);
        assert.strictEqual(vm.compileFunction('console.log("Hello, World!")').toString(), 'function () {\nconsole.log("Hello, World!")\n}');
        assert.throws(() => vm.compileFunction('});\n\n(function() {\nthrow new Error("unreachable");\n})();\n\n(function() {'), {
            name: 'SyntaxError',
            message: "Unexpected token '}'",
        });
        assert.throws(() => vm.compileFunction('', undefined, { filename: null }), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
            message: 'The "options.filename" property must be of type string. Received null',
        });
        assert.throws(() => vm.compileFunction('', undefined, { columnOffset: null }), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
            message: 'The "options.columnOffset" property must be of type number. Received null',
        });
        assert.strictEqual(vm.compileFunction('return a;', undefined, { contextExtensions: [{ a: 5 }] })(), 5);
        let compileFunctionSetterValue;
        const compileFunctionExtension = {};
        Object.defineProperty(compileFunctionExtension, 'x', {
            enumerable: true,
            configurable: true,
            get() { return 42; },
            set(value) { compileFunctionSetterValue = value; },
        });
        assert.strictEqual(vm.compileFunction('return x', [], { contextExtensions: [compileFunctionExtension] })(), 42);
        assert.strictEqual(compileFunctionSetterValue, undefined);
        assert.strictEqual(vm.compileFunction('return varInContext', [], {
            parsingContext: vm.createContext({ varInContext: 'abc' }),
        })(), 'abc');
        const cachedFunction = vm.compileFunction('return 3', [], { produceCachedData: true });
        assert.strictEqual(cachedFunction.cachedDataProduced, true);
        assert.ok(cachedFunction.cachedData.length > 0);
        assert.strictEqual(vm.compileFunction('return 3', [], { cachedData: cachedFunction.cachedData }).cachedDataRejected, false);
        assert.strictEqual(vm.compileFunction('return 4', [], { cachedData: cachedFunction.cachedData }).cachedDataRejected, true);
        const oldStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 1;
        try {
            assert.throws(() => vm.compileFunction('throw new Error("Sample Error")')(), {
                message: 'Sample Error',
                stack: 'Error: Sample Error\n    at <anonymous>:1:7',
            });
            assert.throws(() => vm.compileFunction('throw new Error("Sample Error")', [], { lineOffset: 3 })(), {
                message: 'Sample Error',
                stack: 'Error: Sample Error\n    at <anonymous>:4:7',
            });
            assert.throws(() => vm.compileFunction('throw new Error("Sample Error")', [], { columnOffset: 3 })(), {
                message: 'Sample Error',
                stack: 'Error: Sample Error\n    at <anonymous>:1:10',
            });
        } finally {
            Error.stackTraceLimit = oldStackTraceLimit;
        }
        const runFilenameContext = vm.createContext({});
        function hasVmFilenameStack(err) {
            return typeof err.stack === 'string' && err.stack.startsWith('runtime-boom.js:1');
        }
        assert.throws(() => vm.runInThisContext('throw new Error("boom")', 'runtime-boom.js'), hasVmFilenameStack);
        assert.throws(() => vm.runInNewContext('throw new Error("boom")', {}, 'runtime-boom.js'), hasVmFilenameStack);
        assert.strictEqual(vm.runInNewContext('1 + 1', undefined), 2);
        assert.throws(() => vm.runInNewContext('', null, 'runtime-null-sandbox.js'), {
            code: 'ERR_INVALID_ARG_TYPE',
            name: 'TypeError',
        });
        for (const invalidSandbox of [0, '', true, Symbol('sandbox'), function invalidSandbox() {}]) {
            assert.throws(() => vm.runInNewContext('1 + 1', invalidSandbox), {
                code: 'ERR_INVALID_ARG_TYPE',
                name: 'TypeError',
            });
        }
        assert.throws(() => vm.runInNewContext('', {}, { filename: 1 }), { code: 'ERR_INVALID_ARG_TYPE', name: 'TypeError' });
        assert.throws(() => vm.runInNewContext('', {}, { filename: 1, get lineOffset() { throw new Error('wrong order'); } }), { code: 'ERR_INVALID_ARG_TYPE', name: 'TypeError' });
        assert.throws(() => vm.runInContext('', runFilenameContext, { lineOffset: 1.5 }), { code: 'ERR_OUT_OF_RANGE', name: 'RangeError' });
        assert.throws(() => vm.runInThisContext('', { columnOffset: 'bad' }), { code: 'ERR_INVALID_ARG_TYPE', name: 'TypeError' });
        assert.throws(() => vm.runInContext('throw new Error("boom")', runFilenameContext, 'runtime-boom.js'), hasVmFilenameStack);
        assert.throws(() => vm.runInContext('', {}), {
            code: 'ERR_INVALID_ARG_TYPE',
            name: 'TypeError',
            message: /contextifiedObject.*vm\.Context/,
        });
        assert.throws(() => new vm.Script('').runInContext([]), {
            code: 'ERR_INVALID_ARG_TYPE',
            name: 'TypeError',
            message: /contextifiedObject.*vm\.Context/,
        });
        function assertEmptyVmRunDoesNotTouchProxy(run) {
            const emptyRunProxyTraps = { ownKeys: 0, getOwnPropertyDescriptor: 0, get: 0 };
            const descriptorThrowingProxy = new Proxy({ foo: 'bar' }, {
                ownKeys() {
                    emptyRunProxyTraps.ownKeys++;
                    throw new Error('ownKeys trap should not run');
                },
                getOwnPropertyDescriptor() {
                    emptyRunProxyTraps.getOwnPropertyDescriptor++;
                    throw new Error('descriptor trap should not run');
                },
                get() {
                    emptyRunProxyTraps.get++;
                    throw new Error('get trap should not run');
                },
            });
            assert.strictEqual(run(descriptorThrowingProxy), undefined);
            assert.deepStrictEqual(emptyRunProxyTraps, { ownKeys: 0, getOwnPropertyDescriptor: 0, get: 0 });
        }
        assertEmptyVmRunDoesNotTouchProxy((proxy) => vm.runInContext('', vm.createContext(proxy)));
        assertEmptyVmRunDoesNotTouchProxy((proxy) => vm.runInContext(' \n/* comment */\n// line comment', vm.createContext(proxy)));
        assertEmptyVmRunDoesNotTouchProxy((proxy) => vm.runInContext('\uFEFF\u00A0\u2028', vm.createContext(proxy)));
        assertEmptyVmRunDoesNotTouchProxy((proxy) => vm.runInContext('#!/usr/bin/env node', vm.createContext(proxy)));
        assertEmptyVmRunDoesNotTouchProxy((proxy) => vm.runInContext('<!-- html comment\n--> html close comment', vm.createContext(proxy)));
        assertEmptyVmRunDoesNotTouchProxy((proxy) => vm.runInNewContext('', proxy));
        assertEmptyVmRunDoesNotTouchProxy((proxy) => new vm.Script('/* script comment */').runInContext(vm.createContext(proxy)));
        const vmRegex = vm.runInNewContext('/hello/');
        assert.throws(() => { throw 'hello world'; }, vmRegex);
        assert.throws(() => assert.match('hello', { [Symbol.toStringTag]: 'RegExp', test() { return true; } }), {
            code: 'ERR_INVALID_ARG_TYPE',
            name: 'TypeError',
        });
        assert.throws(() => assert.match('hello', Object.create(/hello/)), {
            code: 'ERR_INVALID_ARG_TYPE',
            name: 'TypeError',
        });
        assert.throws(() => assert.match('hello', new Proxy(/hello/, {})), {
            code: 'ERR_INVALID_ARG_TYPE',
            name: 'TypeError',
        });
        const poisonedRegex = /hello/;
        poisonedRegex.test = () => false;
        assert.match('hello', poisonedRegex);
        assert.throws(() => { throw 'hello world'; }, poisonedRegex);
        const originalRegExpSource = Object.getOwnPropertyDescriptor(RegExp.prototype, 'source');
        try {
            Object.defineProperty(RegExp.prototype, 'source', {
                configurable: true,
                get() { return ''; },
            });
            assert.throws(() => assert.match('hello', { test() { return true; } }), {
                code: 'ERR_INVALID_ARG_TYPE',
                name: 'TypeError',
            });
        } finally {
            Object.defineProperty(RegExp.prototype, 'source', originalRegExpSource);
        }
        const sloppyMainResult = vm.runInThisContext([
            'var __wasm_rquickjs_sloppy_main_value = "main";',
            '[delete __wasm_rquickjs_sloppy_main_value, __wasm_rquickjs_sloppy_main_value];',
        ].join('\n'));
        assert.deepStrictEqual(sloppyMainResult, [false, 'main']);
        assert.deepStrictEqual(Object.getOwnPropertyDescriptor(globalThis, '__wasm_rquickjs_sloppy_main_value'), {
            value: 'main',
            writable: true,
            enumerable: true,
            configurable: false,
        });
        const sloppyScriptResult = new vm.Script([
            'var __wasm_rquickjs_sloppy_script_value = "script";',
            '[delete __wasm_rquickjs_sloppy_script_value, __wasm_rquickjs_sloppy_script_value];',
        ].join('\n')).runInThisContext();
        assert.deepStrictEqual(sloppyScriptResult, [false, 'script']);
        const sloppyConstructorFilenameResult = new vm.Script([
            'var __wasm_rquickjs_sloppy_constructor_filename_value = "constructor";',
            '[delete __wasm_rquickjs_sloppy_constructor_filename_value, __wasm_rquickjs_sloppy_constructor_filename_value];',
        ].join('\n'), 'runtime-script-sloppy.js').runInThisContext();
        assert.deepStrictEqual(sloppyConstructorFilenameResult, [false, 'constructor']);
        assert.throws(() => new vm.Script('throw new Error("script filename")', {
            filename: 'runtime-script-sloppy-stack.js',
        }).runInThisContext(), (err) => {
            return typeof err.stack === 'string' && err.stack.startsWith('runtime-script-sloppy-stack.js:1');
        });
        assert.throws(() => new vm.Script('throw new Error("empty script filename")', {
            filename: '',
        }).runInThisContext(), (err) => {
            return typeof err.stack === 'string' && err.stack.startsWith(':1');
        });
        globalThis.__wasm_rquickjs_sloppy_main_value = undefined;
        globalThis.__wasm_rquickjs_sloppy_script_value = undefined;
        globalThis.__wasm_rquickjs_sloppy_constructor_filename_value = undefined;
        assert.throws(() => vm.createContext('bad'), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => vm.createContext(function badSandbox() {}), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script('void 0', 42), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script('void 0', { lineOffset: null }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script('void 0', { lineOffset: 0.5 }), { name: 'RangeError', code: 'ERR_OUT_OF_RANGE' });
        assert.throws(() => new vm.Script('void 0', { columnOffset: 2 ** 32 }), { name: 'RangeError', code: 'ERR_OUT_OF_RANGE' });
        assert.throws(() => new vm.Script('void 0', { filename: 123 }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script('void 0', { produceCachedData: 1 }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script('void 0', { cachedData: {} }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script('void 0', { importModuleDynamically: 123 }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => new vm.Script({ toString() { throw new Error('code toString'); } }, 42), {
            name: 'Error',
            message: 'code toString',
        });
        assert.doesNotThrow(() => new vm.Script('void 0', 'runtime-script.js'));
        const runOptionScript = new vm.Script('void 0');
        const runOptionContext = vm.createContext({});
        assert.throws(() => runOptionScript.runInThisContext(null), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => runOptionScript.runInContext(runOptionContext, { timeout: 0 }), { name: 'RangeError', code: 'ERR_OUT_OF_RANGE' });
        assert.doesNotThrow(() => runOptionScript.runInThisContext({ timeout: 4294967295 }));
        assert.throws(() => runOptionScript.runInThisContext({ timeout: 4294967296 }), { name: 'RangeError', code: 'ERR_OUT_OF_RANGE' });
        assert.throws(() => runOptionScript.runInContext({}, { get timeout() { throw new Error('bad order'); } }), {
            name: 'TypeError',
            code: 'ERR_INVALID_ARG_TYPE',
            message: /contextifiedObject.*vm\.Context/,
        });
        assert.throws(() => runOptionScript.runInNewContext({}, { displayErrors: null }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => runOptionScript.runInNewContext({}, { breakOnSigint: 1 }), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        assert.strictEqual(vm.isContext({}), false);
        assert.strictEqual(vm.isContext([]), false);
        for (const invalidContext of ['string', null, undefined, 8.9, Symbol('sym'), true, function invalidContext() {}]) {
            assert.throws(() => vm.isContext(invalidContext), { name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE' });
        }
        const contextSandbox = {};
        assert.strictEqual(vm.isContext(vm.createContext(contextSandbox)), true);
        assert.strictEqual(vm.isContext(contextSandbox), true);
        assert.strictEqual(vm.isContext(Object.create(contextSandbox)), false);
        assert.deepStrictEqual(Reflect.ownKeys(contextSandbox), []);
        const contextSymbolA = Symbol('context-a');
        const contextSymbolB = Symbol('context-b');
        const keyedContextSandbox = {
            visible: true,
            [contextSymbolA]: true,
        };
        Object.defineProperty(keyedContextSandbox, 'hidden', { value: true });
        Object.defineProperty(keyedContextSandbox, contextSymbolB, { value: true });
        vm.createContext(keyedContextSandbox);
        assert.deepStrictEqual(Reflect.ownKeys(keyedContextSandbox), ['visible', 'hidden', contextSymbolA, contextSymbolB]);
        assert.deepStrictEqual(Object.getOwnPropertyNames(keyedContextSandbox), ['visible', 'hidden']);
        assert.deepStrictEqual(Object.getOwnPropertySymbols(keyedContextSandbox), [contextSymbolA, contextSymbolB]);
        const nativeContextNames = vm.runInNewContext('Object.getOwnPropertyNames(this)');
        const keyedContextNames = vm.runInContext('Object.getOwnPropertyNames(this)', keyedContextSandbox);
        const keyedContextOwnNames = keyedContextNames.filter((name) => !nativeContextNames.includes(name));
        assert.strictEqual(keyedContextOwnNames.length, 2);
        assert.strictEqual(keyedContextOwnNames[0], 'visible');
        assert.strictEqual(keyedContextOwnNames[1], 'hidden');
        const nativeContextSymbols = vm.runInNewContext('Object.getOwnPropertySymbols(this)');
        const keyedContextSymbols = vm.runInContext('Object.getOwnPropertySymbols(this)', keyedContextSandbox);
        const keyedContextOwnSymbols = keyedContextSymbols.filter((symbol) => !nativeContextSymbols.includes(symbol));
        assert.strictEqual(keyedContextOwnSymbols.length, 2);
        assert.strictEqual(keyedContextOwnSymbols[0], contextSymbolA);
        assert.strictEqual(keyedContextOwnSymbols[1], contextSymbolB);
        assert.strictEqual(vm.runInContext('const symbols = Object.getOwnPropertySymbols(this); const symbol = symbols.find((value) => String(value) === "Symbol(context-a)"); this[symbol] = "updated"; this[symbol]', keyedContextSandbox), 'updated');
        assert.strictEqual(keyedContextSandbox[contextSymbolA], 'updated');
        assert.strictEqual(keyedContextSandbox[contextSymbolB], true);
        const newSymbolSandbox = vm.createContext({});
        const assignedSymbol = vm.runInContext('const symbol = Symbol("assigned"); this[symbol] = 1; symbol', newSymbolSandbox);
        assert.deepStrictEqual(Object.getOwnPropertySymbols(newSymbolSandbox), []);
        assert.strictEqual(newSymbolSandbox[assignedSymbol], undefined);
        const hiddenDescriptor = vm.runInContext('Object.getOwnPropertyDescriptor(this, "hidden")', keyedContextSandbox);
        assert.strictEqual(hiddenDescriptor.value, true);
        assert.strictEqual(hiddenDescriptor.writable, false);
        assert.strictEqual(hiddenDescriptor.enumerable, false);
        assert.strictEqual(hiddenDescriptor.configurable, false);
        assert.strictEqual(vm.runInNewContext('typeof performance'), 'undefined');
        assert.strictEqual(vm.runInContext('Object.keys(this).join(",")', vm.createContext({ key: 'value', 1: 'one' })), '1,key');
        const hiddenVmGlobalNames = ['DOMException', 'Float16Array', 'InternalError', 'performance', 'queueMicrotask'];
        assert.strictEqual(vm.runInNewContext('["DOMException", "Float16Array", "InternalError", "performance", "queueMicrotask"].filter((name) => Object.hasOwn(this, name)).join(",")'), '');
        for (const hiddenName of hiddenVmGlobalNames) {
            assert.strictEqual(vm.runInContext(hiddenName + '.marker', vm.createContext({
                [hiddenName]: { marker: hiddenName },
            })), hiddenName);
        }
        const baselineGlobalSandbox = {};
        assert.strictEqual(vm.runInNewContext('Object.defineProperty(this, "encodeURI", { value: 42, configurable: true }); "ok"', baselineGlobalSandbox), 'ok');
        assert.strictEqual(baselineGlobalSandbox.encodeURI, 42);
        const baselineGlobalDescriptor = Object.getOwnPropertyDescriptor(baselineGlobalSandbox, 'encodeURI');
        assert.strictEqual(baselineGlobalDescriptor.value, 42);
        assert.strictEqual(baselineGlobalDescriptor.configurable, true);
        const untouchedGlobalSandbox = {};
        assert.strictEqual(vm.runInNewContext('1 + 1', untouchedGlobalSandbox), 2);
        assert.strictEqual(Object.hasOwn(untouchedGlobalSandbox, 'encodeURI'), false);
        const deletedBaselineGlobalSandbox = vm.createContext({});
        assert.strictEqual(vm.runInContext('delete this.encodeURI', deletedBaselineGlobalSandbox), true);
        assert.strictEqual(vm.runInContext('typeof encodeURI', deletedBaselineGlobalSandbox), 'undefined');
        assert.strictEqual(vm.runInContext('this.encodeURI = 7; encodeURI', deletedBaselineGlobalSandbox), 7);
        assert.strictEqual(deletedBaselineGlobalSandbox.encodeURI, 7);
        assert.strictEqual(vm.runInContext('encodeURI', deletedBaselineGlobalSandbox), 7);
        assert.strictEqual(new vm.Script('2 + 1', { importModuleDynamically() { throw new Error('unreachable'); } }).runInThisContext(), 3);
        assert.strictEqual(vm.compileFunction('return 2', [], { importModuleDynamically() { throw new Error('unreachable'); } })(), 2);
        assert.strictEqual(missingImportHelperCount(), missingImportHelperCountBefore);
        assert.strictEqual(missingImportFlagHelperCount(), missingImportFlagHelperCountBefore);
        assert.strictEqual(
            new vm.Script('"import(\\"node:fs\\")"; /import\\("node:fs"\\)/; ({ import() { return 3; } }).import();').runInThisContext(),
            3,
        );
        assert.strictEqual(
            new vm.Script('({ import(value = /[)]/) { return value.test(")"); } }).import();').runInThisContext(),
            true,
        );
        assert.strictEqual(
            await new vm.Script('({ async import() { return 4; } }).import().then((value) => value);').runInThisContext(),
            4,
        );
        assert.strictEqual(
            new vm.Script('({ *import() { yield 5; } }).import().next().value;').runInThisContext(),
            5,
        );
        assert.strictEqual(
            await new vm.Script('({ async *import() { yield 6; } }).import().next().then((result) => result.value);').runInThisContext(),
            6,
        );
        assert.strictEqual(
            new vm.Script('const target = {}; ({ set import(value) { target.value = value; } }).import = 7; target.value;').runInThisContext(),
            7,
        );
        assert.strictEqual(
            new vm.Script('class Example { static import() { return 8; } } Example.import();').runInThisContext(),
            8,
        );
        assert.strictEqual(
            await new vm.Script('class AsyncExample { static async import() { return 9; } } AsyncExample.import();').runInThisContext(),
            9,
        );

        await assert.rejects(
            new vm.Script('import("./message.mjs")').runInThisContext(),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING' },
            'vm.Script without importModuleDynamically rejects dynamic import',
        );
        await assert.rejects(
            vm.compileFunction('return import("./message.mjs")')(),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING' },
            'vm.compileFunction without importModuleDynamically rejects dynamic import',
        );
        await assert.rejects(
            vm.runInThisContext('import("./message.mjs")'),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING' },
            'vm.runInThisContext without importModuleDynamically rejects dynamic import',
        );
        await assert.rejects(
            new vm.Script('import("./message.mjs")').runInNewContext({}),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING' },
            'vm.Script.runInNewContext without importModuleDynamically rejects dynamic import',
        );
        await assert.rejects(
            new vm.Script('import("./message.mjs")').runInContext(vm.createContext({})),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING' },
            'vm.Script.runInContext without importModuleDynamically rejects dynamic import',
        );
        await assert.rejects(
            new vm.Script('import("./message.mjs")', {
                importModuleDynamically() { throw new Error('unreachable'); },
            }).runInThisContext(),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' },
            'vm.Script with importModuleDynamically callback rejects without VM modules flag',
        );
        await assert.rejects(
            vm.compileFunction('return import("./message.mjs")', [], {
                importModuleDynamically() { throw new Error('unreachable'); },
            })(),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' },
            'vm.compileFunction with importModuleDynamically callback rejects without VM modules flag',
        );
        await assert.rejects(
            vm.runInThisContext('import("./message.mjs")', {
                importModuleDynamically() { throw new Error('unreachable'); },
            }),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' },
            'vm.runInThisContext with importModuleDynamically callback rejects without VM modules flag',
        );
        await assert.rejects(
            new vm.Script('import("./message.mjs")', {
                importModuleDynamically() { throw new Error('unreachable'); },
            }).runInNewContext({}),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' },
            'vm.Script.runInNewContext with importModuleDynamically callback rejects without VM modules flag',
        );
        await assert.rejects(
            new vm.Script('import("./message.mjs")', {
                importModuleDynamically() { throw new Error('unreachable'); },
            }).runInContext(vm.createContext({})),
            { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' },
            'vm.Script.runInContext with importModuleDynamically callback rejects without VM modules flag',
        );

        const missingSourceTextModule = new vm.SourceTextModule('globalThis.vmModuleImportResult = import("dep");');
        await missingSourceTextModule.link(() => {});
        await missingSourceTextModule.evaluate();
        await assert.rejects(globalThis.vmModuleImportResult, { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING' });
        delete globalThis.vmModuleImportResult;

        const missingFlagSourceTextModule = new vm.SourceTextModule('globalThis.vmModuleImportResult = import("dep");', {
            importModuleDynamically() { throw new Error('unreachable'); },
        });
        await missingFlagSourceTextModule.link(() => {});
        await missingFlagSourceTextModule.evaluate();
        await assert.rejects(globalThis.vmModuleImportResult, { code: 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' });
        delete globalThis.vmModuleImportResult;

        const stateModule = new vm.SourceTextModule('throw new Error("vm-state-error");');
        assert.strictEqual(stateModule.status, 'unlinked');
        assert.throws(() => stateModule.namespace, {
            code: 'ERR_VM_MODULE_STATUS',
            message: 'Module status must not be unlinked or linking',
        });
        assert.throws(() => stateModule.error, {
            code: 'ERR_VM_MODULE_STATUS',
            message: 'Module status must be errored',
        });
        await assert.rejects(stateModule.link(undefined), { code: 'ERR_INVALID_ARG_TYPE' });
        await stateModule.link(() => {});
        assert.strictEqual(stateModule.status, 'linked');
        await assert.rejects(stateModule.link(() => {}), { code: 'ERR_VM_MODULE_ALREADY_LINKED' });
        await assert.rejects(stateModule.evaluate(false), {
            code: 'ERR_INVALID_ARG_TYPE',
            message: 'The "options" argument must be of type object. Received type boolean (false)',
        });
        await assert.rejects(stateModule.evaluate({ breakOnSigint: 'a-string' }), {
            code: 'ERR_INVALID_ARG_TYPE',
            message: "The \"options.breakOnSigint\" property must be of type boolean. Received type string ('a-string')",
        });
        await assert.rejects(stateModule.evaluate(), { message: 'vm-state-error' });
        assert.strictEqual(stateModule.status, 'errored');
        assert.strictEqual(stateModule.error.message, 'vm-state-error');

        const invalidLinkedModule = new vm.SourceTextModule('import "dep";');
        assert.deepStrictEqual(invalidLinkedModule.dependencySpecifiers, ['dep']);
        await assert.rejects(invalidLinkedModule.link(() => ({})), { code: 'ERR_VM_MODULE_NOT_MODULE' });
        assert.strictEqual(invalidLinkedModule.status, 'errored');
        assert.deepStrictEqual(new vm.SourceTextModule('// import "dep";').dependencySpecifiers, []);

        const linkedContext = vm.createContext({});
        const contextDepModule = new vm.SourceTextModule('', { context: linkedContext });
        await contextDepModule.link(() => {});
        const differentContextModule = new vm.SourceTextModule('import "dep";');
        await assert.rejects(differentContextModule.link(() => contextDepModule), { code: 'ERR_VM_MODULE_DIFFERENT_CONTEXT' });
        assert.strictEqual(differentContextModule.status, 'errored');

        const erroredDep = new vm.SourceTextModule('throw new Error("dep-error");');
        await erroredDep.link(() => {});
        await assert.rejects(erroredDep.evaluate(), { message: 'dep-error' });
        const rootWithErroredDep = new vm.SourceTextModule('import "dep";');
        await assert.rejects(rootWithErroredDep.link(() => erroredDep), {
            code: 'ERR_VM_MODULE_LINK_FAILURE',
            cause: erroredDep.error,
        });

        const originalExecArgv = process.execArgv.slice();
        try {
            process.execArgv.push('--experimental-vm-modules');
            const vmDynamicDep = new vm.SourceTextModule('export const value = 7;');
            await vmDynamicDep.link(() => {});
            await vmDynamicDep.evaluate();

            const moduleCallbackSourceTextModule = new vm.SourceTextModule('globalThis.vmModuleImportResult = import("dep", { with: { kind: "runtime" } });', {
                importModuleDynamically(specifier, wrap, attributes) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, moduleCallbackSourceTextModule);
                    assert.deepStrictEqual(attributes, { __proto__: null, kind: 'runtime' });
                    return vmDynamicDep;
                },
            });
            await moduleCallbackSourceTextModule.link(() => {});
            await moduleCallbackSourceTextModule.evaluate();
            assert.strictEqual(await globalThis.vmModuleImportResult, vmDynamicDep.namespace);
            delete globalThis.vmModuleImportResult;

            const namespaceCallbackSourceTextModule = new vm.SourceTextModule('globalThis.vmModuleImportResult = import("dep");', {
                importModuleDynamically(specifier, wrap) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, namespaceCallbackSourceTextModule);
                    return vmDynamicDep.namespace;
                },
            });
            await namespaceCallbackSourceTextModule.link(() => {});
            await namespaceCallbackSourceTextModule.evaluate();
            assert.strictEqual(await globalThis.vmModuleImportResult, vmDynamicDep.namespace);
            delete globalThis.vmModuleImportResult;

            const namespaceCallbackScript = new vm.Script('import("dep")', {
                importModuleDynamically(specifier, wrap) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, namespaceCallbackScript);
                    return vmDynamicDep.namespace;
                },
            });
            assert.strictEqual(await namespaceCallbackScript.runInThisContext(), vmDynamicDep.namespace);

            const namespaceCallbackFunction = vm.compileFunction('return import("dep")', [], {
                importModuleDynamically(specifier, wrap) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, namespaceCallbackFunction);
                    return vmDynamicDep.namespace;
                },
            });
            assert.strictEqual(await namespaceCallbackFunction(), vmDynamicDep.namespace);

            const namespaceBrand = Symbol.for('wasm-rquickjs.vm.namespaceBindings');
            const spoofedNamespaceSourceTextModule = new vm.SourceTextModule('globalThis.vmModuleImportResult = import("dep");', {
                importModuleDynamically() {
                    return { [namespaceBrand]: {} };
                },
            });
            await spoofedNamespaceSourceTextModule.link(() => {});
            await spoofedNamespaceSourceTextModule.evaluate();
            await assert.rejects(globalThis.vmModuleImportResult, { code: 'ERR_VM_MODULE_NOT_MODULE' });
            delete globalThis.vmModuleImportResult;

            const reusableScript = new vm.Script('import("dep")', {
                importModuleDynamically(specifier, wrap) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, reusableScript);
                    return vmDynamicDep;
                },
            });
            assert.strictEqual(await reusableScript.runInThisContext(), vmDynamicDep.namespace);
            assert.strictEqual(await reusableScript.runInThisContext(), vmDynamicDep.namespace);

            const reusableFunction = vm.compileFunction('return import("dep")', [], {
                importModuleDynamically(specifier, wrap) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, reusableFunction);
                    return vmDynamicDep;
                },
            });
            assert.strictEqual(await reusableFunction(), vmDynamicDep.namespace);
            assert.strictEqual(await reusableFunction(), vmDynamicDep.namespace);

            const sequentialSourceTextModule = new vm.SourceTextModule([
                'globalThis.vmModuleImportResult = (async () => {',
                '  const first = await import("dep");',
                '  const second = await import("dep");',
                '  return [first, second];',
                '})();',
            ].join('\n'), {
                importModuleDynamically(specifier, wrap) {
                    assert.strictEqual(specifier, 'dep');
                    assert.strictEqual(wrap, sequentialSourceTextModule);
                    return vmDynamicDep;
                },
            });
            await sequentialSourceTextModule.link(() => {});
            await sequentialSourceTextModule.evaluate();
            assert.deepStrictEqual(await globalThis.vmModuleImportResult, [vmDynamicDep.namespace, vmDynamicDep.namespace]);
            delete globalThis.vmModuleImportResult;
        } finally {
            process.execArgv.length = 0;
            for (let i = 0; i < originalExecArgv.length; i++) {
                process.execArgv.push(originalExecArgv[i]);
            }
            delete globalThis.vmModuleImportResult;
        }

        const script = new vm.Script('import("./message.mjs")', {
            filename: '/vm-default-loader-app/subdir/index.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await script.runInThisContext()).default, { value: 'from-subdir' });

        const mutableOptions = {
            filename: '/vm-default-loader-app/subdir/mutable.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        };
        const mutableScript = new vm.Script('import("./message.mjs")', mutableOptions);
        mutableOptions.filename = '/vm-default-loader-app/other/mutable.js';
        assert.deepStrictEqual((await mutableScript.runInThisContext()).default, { value: 'from-subdir' });

        const expressionScript = new vm.Script([
            'const name = "message.mjs";',
            'import("./" + name);',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/expression.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await expressionScript.runInThisContext()).default, { value: 'from-subdir' });

        const templateScript = new vm.Script('import(`./message.mjs`)', {
            filename: '/vm-default-loader-app/subdir/template.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await templateScript.runInThisContext()).default, { value: 'from-subdir' });

        const commentScript = new vm.Script('import /* comment */ ("./message.mjs")', {
            filename: '/vm-default-loader-app/subdir/comment.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await commentScript.runInThisContext()).default, { value: 'from-subdir' });

        const templateExpressionScript = new vm.Script([
            'let imported;',
            '`${imported = import("./message.mjs")}`;',
            'imported;',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/template-expression.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await templateExpressionScript.runInThisContext()).default, { value: 'from-subdir' });

        const dataScript = new vm.Script([
            'const literal = "import(\\"./message.mjs\\")";',
            'const regex = /import\\("\\.\\/message\\.mjs"\\)/;',
            'function readRegex() { return /import\\("\\.\\/message\\.mjs"\\)/; }',
            'if (true) /import\\("\\.\\/message\\.mjs"\\)/.test(literal);',
            'literal + String(regex) + String(readRegex());',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/string-regex.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.match(dataScript.runInThisContext(), /import/);

        const divisionScript = new vm.Script([
            'const a = 1, b = 2;',
            'a / b;',
            'import("./message.mjs");',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/division.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await divisionScript.runInThisContext()).default, { value: 'from-subdir' });

        const propertyScript = new vm.Script([
            'const obj = { "import"(specifier) { return specifier; } };',
            'obj.import("./message.mjs");',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/property.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.strictEqual(propertyScript.runInThisContext(), './message.mjs');

        const privatePropertyScript = new vm.Script([
            'class C {',
            '  #import(specifier) { return specifier; }',
            '  m() { return this.#import("./message.mjs"); }',
            '}',
            'new C().m();',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/private-property.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.strictEqual(privatePropertyScript.runInThisContext(), './message.mjs');

        const strictScript = new vm.Script([
            '"use strict";',
            'Promise.all([import("./message.mjs"), Promise.resolve((function() { return this; })())]);',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/strict.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        const [strictImport, strictThis] = await strictScript.runInThisContext();
        assert.deepStrictEqual(strictImport.default, { value: 'from-subdir' });
        assert.strictEqual(strictThis, undefined);

        const collisionScript = new vm.Script([
            'let __wasm_rquickjs_vm_import__ = 1;',
            'import("./message.mjs");',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/collision.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await collisionScript.runInThisContext()).default, { value: 'from-subdir' });

        const helperNameCollisionScript = new vm.Script([
            'let __wasm_rquickjs_vm_default_loader_import__ = 1;',
            'import("./message.mjs");',
        ].join('\n'), {
            filename: '/vm-default-loader-app/subdir/helper-name-collision.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await helperNameCollisionScript.runInThisContext()).default, { value: 'from-subdir' });

        const builtinScript = new vm.Script('import("node:fs")', {
            filename: '/vm-default-loader-app/subdir/builtin.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.strictEqual((await builtinScript.runInThisContext()).existsSync('/vm-default-loader-app'), true);

        const fileUrlScript = new vm.Script('import("./message.mjs")', {
            filename: pathToFileURL('/vm-default-loader-app/space dir/index.js').href + '?cache=1',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await fileUrlScript.runInThisContext()).default, { value: 'from-space' });

        assert.deepStrictEqual((await vm.runInNewContext('import("./message.mjs")', {}, {
            filename: '/vm-default-loader-app/subdir/run-in-new-context.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        })).default, { value: 'from-subdir' });

        assert.deepStrictEqual((await vm.runInNewContext('import("./message.mjs")', { globalThis: {} }, {
            filename: '/vm-default-loader-app/subdir/shadow-globalthis.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        })).default, { value: 'from-subdir' });

        const newContextScript = new vm.Script('import("./message.mjs")', {
            filename: '/vm-default-loader-app/subdir/script-new-context.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await newContextScript.runInNewContext({})).default, { value: 'from-subdir' });

        const scriptContext = vm.createContext({});
        const contextDefaultScript = new vm.Script('import("./message.mjs")', {
            filename: '/vm-default-loader-app/subdir/script-context.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await contextDefaultScript.runInContext(scriptContext)).default, { value: 'from-subdir' });

        const shadowGlobalContext = vm.createContext({ globalThis: {} });
        const shadowGlobalContextScript = new vm.Script('import("./message.mjs")', {
            filename: '/vm-default-loader-app/subdir/script-context-shadow-globalthis.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await shadowGlobalContextScript.runInContext(shadowGlobalContext)).default, { value: 'from-subdir' });

        const context = vm.createContext({}, {
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        const contextScript = new vm.Script('import("./message.mjs")');
        await assert.rejects(contextScript.runInContext(context));
        const originalContextCwd = process.cwd();
        try {
            process.chdir('/vm-default-loader-app/subdir');
            const contextEvalScript = new vm.Script('Promise.resolve("import(\\"./message.mjs\\")").then(eval)');
            const contextEvalResult = await contextEvalScript.runInContext(context);
            assert.strictEqual(JSON.stringify(contextEvalResult.default || contextEvalResult), '{"value":"from-subdir"}');
        } finally {
            process.chdir(originalContextCwd);
        }

        const compiled = vm.compileFunction('return import("./" + name)', ['name'], {
            filename: '/vm-default-loader-app/subdir/function.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        assert.deepStrictEqual((await compiled('message.mjs')).default, { value: 'from-subdir' });

        const compiledMissing = vm.compileFunction('return import("./missing.mjs")', [], {
            filename: '/vm-default-loader-app/subdir/function-missing.js',
            importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
        });
        await assert.rejects(compiledMissing(), { code: 'ERR_MODULE_NOT_FOUND' });

        const originalCwd = process.cwd();
        try {
            process.chdir('/vm-default-loader-app');
            const cwdScript = new vm.Script('import("./message.mjs")', {
                importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
            });
            assert.deepStrictEqual((await cwdScript.runInThisContext()).default, { value: 'from-cwd' });
        } finally {
            process.chdir(originalCwd);
        }

        await assert.rejects(
            new vm.Script('import("./missing.mjs")', {
                filename: '/vm-default-loader-app/subdir/index.js',
                importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
            }).runInThisContext(),
            { code: 'ERR_MODULE_NOT_FOUND' },
        );

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testVmSourceTextModuleLinkSemantics = async () => {
    try {
        const { SourceTextModule } = await import('node:vm');

        const defaultSource = new SourceTextModule([
            'const __wasm_rquickjs_vm_default_export = "local";',
            'export default 5;',
        ].join('\n'));
        const defaultConsumer = new SourceTextModule([
            'import five from "default-source";',
            'export const value = five;',
        ].join('\n'));
        await defaultConsumer.link((specifier) => {
            assert.strictEqual(specifier, 'default-source');
            return defaultSource;
        });
        await defaultConsumer.evaluate();
        assert.strictEqual(defaultConsumer.namespace.value, 5);

        const namedDefault = new SourceTextModule([
            'export default function getAnswer() { return 42; }',
            'export const visible = getAnswer();',
        ].join('\n'));
        await namedDefault.link(() => {
            throw new Error('unexpected dependency');
        });
        await namedDefault.evaluate();
        assert.strictEqual(namedDefault.namespace.default(), 42);
        assert.strictEqual(namedDefault.namespace.visible, 42);

        const dependency = new SourceTextModule([
            'export default "default-value";',
            'export const named = "named-value";',
        ].join('\n'));
        const namespaceConsumer = new SourceTextModule([
            'import value, { named } from "dependency";',
            'import * as ns from "dependency";',
            'export const combined = value + ":" + named + ":" + ns.default + ":" + ns.named;',
        ].join('\n'));
        await namespaceConsumer.link((specifier) => {
            assert.strictEqual(specifier, 'dependency');
            return dependency;
        });
        await namespaceConsumer.evaluate();
        assert.strictEqual(namespaceConsumer.namespace.combined, 'default-value:named-value:default-value:named-value');

        const ambiguousA = new SourceTextModule('export const shared = "a"; export const onlyA = "a";');
        const ambiguousB = new SourceTextModule('export const shared = "b"; export const onlyB = "b";');
        const star = new SourceTextModule('export * from "a"; export * from "b";');
        await star.link((specifier) => specifier === 'a' ? ambiguousA : ambiguousB);
        await star.evaluate();
        assert.strictEqual('shared' in star.namespace, false);
        assert.strictEqual(star.namespace.onlyA, 'a');
        assert.strictEqual(star.namespace.onlyB, 'b');

        const common = new SourceTextModule('export const x = 1;');
        const starA = new SourceTextModule('export * from "common";');
        const starB = new SourceTextModule('export * from "common";');
        const duplicateSameBinding = new SourceTextModule('export * from "star-a"; export * from "star-b";');
        await duplicateSameBinding.link((specifier) => {
            if (specifier === 'common') return common;
            if (specifier === 'star-a') return starA;
            if (specifier === 'star-b') return starB;
            throw new Error(`unexpected specifier: ${specifier}`);
        });
        await duplicateSameBinding.evaluate();
        assert.strictEqual(duplicateSameBinding.namespace.x, 1);

        const fromExport = new SourceTextModule('export const from = "from-name";');
        const fromImport = new SourceTextModule('import { from as x } from "from-export"; export const value = x;');
        await fromImport.link(() => fromExport);
        await fromImport.evaluate();
        assert.strictEqual(fromImport.namespace.value, 'from-name');

        const multilineDependency = new SourceTextModule('export default "default"; export const a = "a";');
        const multilineImport = new SourceTextModule([
            'import value',
            'from "multiline-dependency";',
            'import { a }',
            'from "multiline-dependency";',
            'export const result = value + a;',
        ].join('\n'));
        await multilineImport.link(() => multilineDependency);
        await multilineImport.evaluate();
        assert.strictEqual(multilineImport.namespace.result, 'defaulta');

        const multilineExport = new SourceTextModule([
            'export *',
            'from "multiline-dependency";',
        ].join('\n'));
        await multilineExport.link(() => multilineDependency);
        await multilineExport.evaluate();
        assert.strictEqual(multilineExport.namespace.a, 'a');
        assert.strictEqual('default' in multilineExport.namespace, false);

        let attributesSeen = null;
        const attributes = new SourceTextModule('import "dep" with { n1: "v1", "n-two": "v2" };');
        await attributes.link((specifier, _module, extra) => {
            assert.strictEqual(specifier, 'dep');
            attributesSeen = extra;
            return new SourceTextModule('');
        });
        assert.strictEqual(attributesSeen.attributes.n1, 'v1');
        assert.strictEqual(attributesSeen.assert.n1, 'v1');
        assert.strictEqual(attributesSeen.attributes['n-two'], 'v2');

        const cycleA = new SourceTextModule([
            'import getValue from "cycle-b";',
            'export let value = 1;',
            'value = 2;',
            'export default getValue();',
        ].join('\n'));
        const cycleB = new SourceTextModule([
            'import { value } from "cycle-a";',
            'export default function getValue() { return value; }',
        ].join('\n'));
        await cycleA.link((specifier) => specifier === 'cycle-b' ? cycleB : cycleA);
        await cycleA.evaluate();
        assert.strictEqual(cycleA.namespace.default, 2);

        const compoundA = new SourceTextModule([
            'import getValue from "compound-b";',
            'export let value = 1;',
            'value += 2;',
            'value++;',
            'if (true) { value = 7; }',
            'export default getValue();',
        ].join('\n'));
        const compoundB = new SourceTextModule([
            'import { value } from "compound-a";',
            'export default function getValue() { return value; }',
        ].join('\n'));
        await compoundA.link((specifier) => specifier === 'compound-b' ? compoundB : compoundA);
        await compoundA.evaluate();
        assert.strictEqual(compoundA.namespace.default, 7);

        const shadowA = new SourceTextModule([
            'import getValue from "shadow-b";',
            'export let value = 1;',
            'function f(value) { value = 2; }',
            'f(0);',
            'export default getValue();',
        ].join('\n'));
        const shadowB = new SourceTextModule([
            'import { value } from "shadow-a";',
            'export default function getValue() { return value; }',
        ].join('\n'));
        await shadowA.link((specifier) => specifier === 'shadow-b' ? shadowB : shadowA);
        await shadowA.evaluate();
        assert.strictEqual(shadowA.namespace.default, 1);

        const closureA = new SourceTextModule([
            'import getValue from "closure-b";',
            'export let value = 1;',
            'function setValue() { value = 2; }',
            'setValue();',
            'export default getValue();',
        ].join('\n'));
        const closureB = new SourceTextModule([
            'import { value } from "closure-a";',
            'export default function getValue() { return value; }',
        ].join('\n'));
        await closureA.link((specifier) => specifier === 'closure-b' ? closureB : closureA);
        await closureA.evaluate();
        assert.strictEqual(closureA.namespace.default, 2);

        const localShadowA = new SourceTextModule([
            'import getValue from "local-shadow-b";',
            'export let value = 1;',
            'function f() { let value = 0; value = 2; }',
            'f();',
            'export default getValue();',
        ].join('\n'));
        const localShadowB = new SourceTextModule([
            'import { value } from "local-shadow-a";',
            'export default function getValue() { return value; }',
        ].join('\n'));
        await localShadowA.link((specifier) => specifier === 'local-shadow-b' ? localShadowB : localShadowA);
        await localShadowA.evaluate();
        assert.strictEqual(localShadowA.namespace.default, 1);

        const multilineAssignmentA = new SourceTextModule([
            'import getValue from "multiline-assignment-b";',
            'export let value = 0;',
            'value = 1',
            '  + 2;',
            'export default getValue();',
        ].join('\n'));
        const multilineAssignmentB = new SourceTextModule([
            'import { value } from "multiline-assignment-a";',
            'export default function getValue() { return value; }',
        ].join('\n'));
        await multilineAssignmentA.link((specifier) => specifier === 'multiline-assignment-b' ? multilineAssignmentB : multilineAssignmentA);
        await multilineAssignmentA.evaluate();
        assert.strictEqual(multilineAssignmentA.namespace.default, 3);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmErrorHandling = async () => {
    try {
        fs.mkdirSync('/require-esm-errors-app', { recursive: true });
        fs.writeFileSync('/require-esm-errors-app/runtime-error.mjs', [
            'throw new Error("hello");',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/reference-error.mjs', [
            'Object.defineProperty(exports, "__esModule", { value: true });',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/ambiguous-reference.js', [
            'Object.defineProperty(exports, "__esModule", { value: true });',
            'const require = () => {};',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/valid-transpiled.js', [
            'Object.defineProperty(exports, "__esModule", { value: true });',
            'exports.foo = "foo";',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/module-exports-marker.mjs', [
            'const value = { marker: true };',
            'export default "namespace default";',
            'export { value as "module.exports" };',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/cjs-missing-named.cjs', [
            'module.exports = { missing: "runtime" };',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/cjs-default-named.cjs', [
            'module.exports = { defaultNamed: true };',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/cjs-quoted-named.cjs', [
            'module.exports = {};',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/import-missing-named.mjs', [
            'import { missing } from "./cjs-missing-named.cjs";',
            'export default missing;',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/import-default-named.mjs', [
            'import { default as cjsDefault } from "./cjs-default-named.cjs";',
            'export default cjsDefault;',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/import-quoted-named.mjs', [
            'import { "missing-name" as missingName } from "./cjs-quoted-named.cjs";',
            'export default missingName;',
        ].join('\n'));
        fs.mkdirSync('/require-esm-errors-app/node_modules/warn-pkg/trailing-pattern-slash', { recursive: true });
        fs.writeFileSync('/require-esm-errors-app/node_modules/warn-pkg/package.json', JSON.stringify({
            type: 'module',
            exports: {
                './trailing-pattern-slash*': './trailing-pattern-slash*index.mjs',
            },
        }));
        fs.writeFileSync('/require-esm-errors-app/node_modules/warn-pkg/trailing-pattern-slash/index.mjs', 'export default { warned: true };');
        fs.writeFileSync('/require-esm-errors-app/import-warn-pkg.mjs', [
            'import warned from "warn-pkg/trailing-pattern-slash/";',
            'export default warned;',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-errors-app/main.cjs');

        assert.throws(() => require('/require-esm-errors-app/runtime-error.mjs'), {
            message: 'hello',
        });
        assert.throws(() => require('/require-esm-errors-app/reference-error.mjs'), {
            name: 'ReferenceError',
        });
        assert.throws(() => require('/require-esm-errors-app/ambiguous-reference.js'), {
            name: 'ReferenceError',
        });
        assert.strictEqual(require('/require-esm-errors-app/valid-transpiled.js').foo, 'foo');
        assert.deepStrictEqual(require('/require-esm-errors-app/module-exports-marker.mjs'), { marker: true });
        assert.deepStrictEqual((await import('/require-esm-errors-app/import-default-named.mjs')).default, {
            defaultNamed: true,
        });
        const requireEsmPackageWarnings = [];
        const onRequireEsmPackageWarning = (warning) => requireEsmPackageWarnings.push(warning);
        process.on('warning', onRequireEsmPackageWarning);
        try {
            assert.deepStrictEqual(require('/require-esm-errors-app/import-warn-pkg.mjs').default, { warned: true });
            await new Promise((resolve) => process.nextTick(resolve));
        } finally {
            process.removeListener('warning', onRequireEsmPackageWarning);
        }
        assert.deepStrictEqual(requireEsmPackageWarnings.map((warning) => warning.code), ['DEP0155']);
        assert.match(requireEsmPackageWarnings[0].message, /package\.json imported from \/require-esm-errors-app\/import-warn-pkg\.mjs\./);
        await assert.rejects(() => import('/require-esm-errors-app/import-missing-named.mjs'), {
            name: 'SyntaxError',
            message: [
                "Named export 'missing' not found. The requested module './cjs-missing-named.cjs' is a CommonJS module, which may not support all module.exports as named exports.",
                'CommonJS modules can always be imported via the default export, for example using:',
                '',
                "import pkg from './cjs-missing-named.cjs';",
                'const { missing } = pkg;',
                '',
            ].join('\n'),
        });
        await assert.rejects(() => import('/require-esm-errors-app/import-quoted-named.mjs'), {
            name: 'SyntaxError',
            message: [
                'Named export \'missing-name\' not found. The requested module \'./cjs-quoted-named.cjs\' is a CommonJS module, which may not support all module.exports as named exports.',
                'CommonJS modules can always be imported via the default export, for example using:',
                '',
                "import pkg from './cjs-quoted-named.cjs';",
                'const { "missing-name": missingName } = pkg;',
                '',
            ].join('\n'),
        });

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmTlaRetry = async () => {
    try {
        fs.mkdirSync('/require-esm-tla-app', { recursive: true });
        fs.writeFileSync('/require-esm-tla-app/tla-success.mjs', [
            'await Promise.resolve();',
            'export const hello = "world";',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-tla-app/main.cjs');

        assert.throws(() => require('/require-esm-tla-app/tla-success.mjs'), {
            code: 'ERR_REQUIRE_ASYNC_MODULE',
        });

        const first = await import('/require-esm-tla-app/tla-success.mjs');
        const second = await import('/require-esm-tla-app/tla-success.mjs');
        assert.strictEqual(first.hello, 'world');
        assert.strictEqual(second.hello, 'world');
        assert.strictEqual(first, second);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmRejectionTracking = async () => {
    try {
        fs.mkdirSync('/require-esm-rejection-app', { recursive: true });
        fs.writeFileSync('/require-esm-rejection-app/pending-tla.mjs', [
            'await new Promise(() => {});',
            'export const value = 1;',
        ].join('\n'));
        fs.writeFileSync('/require-esm-rejection-app/throw-with-unhandled.mjs', [
            'Promise.reject(new Error("side rejection"));',
            'throw new Error("module failure");',
        ].join('\n'));
        fs.writeFileSync('/require-esm-rejection-app/shared-reason.mjs', [
            'const shared = new Error("shared reason");',
            'Promise.reject(shared);',
            'throw shared;',
        ].join('\n'));
        fs.writeFileSync('/require-esm-rejection-app/saved-reason.mjs', [
            'throw globalThis.__requireEsmSavedReason;',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-rejection-app/main.cjs');

        const originalCatch = Object.getOwnPropertyDescriptor(Promise.prototype, 'catch');
        Object.defineProperty(Promise.prototype, 'catch', {
            configurable: true,
            get() {
                throw new Error('poisoned Promise.prototype.catch');
            },
        });
        try {
            assert.throws(() => require('/require-esm-rejection-app/pending-tla.mjs'), {
                code: 'ERR_REQUIRE_ASYNC_MODULE',
            });
        } finally {
            Object.defineProperty(Promise.prototype, 'catch', originalCatch);
        }

        const unhandled = [];
        const onUnhandled = (reason) => unhandled.push(reason && reason.message);
        process.on('unhandledRejection', onUnhandled);
        try {
            assert.throws(() => require('/require-esm-rejection-app/throw-with-unhandled.mjs'), {
                message: 'module failure',
            });
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            assert.throws(() => require('/require-esm-rejection-app/shared-reason.mjs'), {
                message: 'shared reason',
            });
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            globalThis.__requireEsmSavedReason = new Error('saved reason');
            assert.throws(() => require('/require-esm-rejection-app/saved-reason.mjs'), {
                message: 'saved reason',
            });
            Promise.reject(globalThis.__requireEsmSavedReason);
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        } finally {
            process.removeListener('unhandledRejection', onUnhandled);
        }
        assert.deepStrictEqual(unhandled, ['side rejection', 'shared reason', 'saved reason']);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmCycleGuards = async () => {
    try {
        fs.mkdirSync('/require-esm-cycle-app', { recursive: true });
        fs.writeFileSync('/require-esm-cycle-app/a.mjs', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import.meta.url);',
            'let cycleCode;',
            'try {',
            '  require("./a.mjs");',
            '} catch (error) {',
            '  cycleCode = error && error.code;',
            '}',
            'export const value = 1;',
            'export { cycleCode };',
        ].join('\n'));
        fs.writeFileSync('/require-esm-cycle-app/syntax-detected.js', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import.meta.url);',
            'let cycleCode;',
            'try {',
            '  require("./syntax-detected.js");',
            '} catch (error) {',
            '  cycleCode = error && error.code;',
            '}',
            'export const value = 2;',
            'export { cycleCode };',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-cycle-app/main.cjs');

        const arrayIterator = Array.prototype[Symbol.iterator];
        delete Array.prototype[Symbol.iterator];
        try {
            const ns = require('/require-esm-cycle-app/a.mjs');
            assert.strictEqual(ns.value, 1);
            assert.strictEqual(ns.cycleCode, 'ERR_REQUIRE_CYCLE_MODULE');
            const detected = require('/require-esm-cycle-app/syntax-detected.js');
            assert.strictEqual(detected.value, 2);
            assert.strictEqual(detected.cycleCode, 'ERR_REQUIRE_CYCLE_MODULE');
        } finally {
            Array.prototype[Symbol.iterator] = arrayIterator;
        }
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsSymlinkCircularCache = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-symlink-cycle-app';
        const moduleA = `${root}/node_modules/moduleA`;
        const moduleB = `${root}/node_modules/moduleB`;
        const moduleALink = `${moduleB}/node_modules/moduleA`;
        const moduleBLink = `${moduleA}/node_modules/moduleB`;

        fs.mkdirSync(`${moduleA}/node_modules`, { recursive: true });
        fs.mkdirSync(`${moduleB}/node_modules`, { recursive: true });
        fs.symlinkSync(moduleA, moduleALink);
        fs.symlinkSync(moduleB, moduleBLink);
        fs.writeFileSync(`${root}/index.cjs`, 'module.exports = require("moduleA");');
        fs.writeFileSync(`${moduleA}/index.js`, 'module.exports = { b: require("moduleB") };');
        fs.writeFileSync(`${moduleB}/index.js`, 'module.exports = { a: require("moduleA") };');

        const require = createRequire(`${root}/index.cjs`);
        const obj = require(`${root}/index.cjs`);
        assert.ok(obj);
        assert.ok(obj.b);
        assert.ok(obj.b.a);
        assert.ok(!obj.b.a.b);

        const cacheKeys = Object.keys(require.cache).filter((key) => key.startsWith(root));
        assert.strictEqual(cacheKeys.some((key) => key.includes('/moduleA/node_modules/moduleB/')), false);
        assert.strictEqual(cacheKeys.some((key) => key.includes('/moduleB/node_modules/moduleA/')), false);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsNodeModuleLoadingCompat = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-node-module-loading-app';
        const require = createRequire(`${root}/entry.cjs`);

        fs.mkdirSync(`${root}/missing-main-with-index`, { recursive: true });
        fs.writeFileSync(`${root}/missing-main-with-index/package.json`, JSON.stringify({ main: 'missing.js' }));
        fs.writeFileSync(`${root}/missing-main-with-index/index.js`, 'module.exports = { ok: true };');
        assert.deepStrictEqual(require(`${root}/missing-main-with-index`), { ok: true });

        fs.mkdirSync(`${root}/missing-main-no-index`, { recursive: true });
        fs.writeFileSync(`${root}/missing-main-no-index/package.json`, JSON.stringify({ main: 'missing.js' }));
        assert.throws(() => require(`${root}/missing-main-no-index`), {
            code: 'MODULE_NOT_FOUND',
            path: `${root}/missing-main-no-index/package.json`,
            requestPath: `${root}/missing-main-no-index`,
        });

        require.extensions['.test'] = function(module, filename) {
            const content = fs.readFileSync(filename, 'utf8').replace('VALUE', 'module.exports.value');
            module._compile(content, filename);
        };
        fs.writeFileSync(`${root}/custom.test`, 'VALUE = 42;');
        assert.strictEqual(require(`${root}/custom`).value, 42);

        fs.mkdirSync(`${root}/parent/child/node_modules/target`, { recursive: true });
        fs.writeFileSync(`${root}/parent/child/node_modules/target/index.js`, 'module.exports = { from: "child" };');
        fs.writeFileSync(`${root}/parent/child/index.js`, 'exports.module = module; exports.loaded = require("target");');
        fs.writeFileSync(`${root}/parent/index.js`, [
            'const child = require("./child");',
            'module.exports = { fromModuleRequire: child.module.require("target"), fromChildRequire: child.loaded };',
        ].join('\n'));
        const parent = require(`${root}/parent`);
        assert.deepStrictEqual(parent.fromModuleRequire, { from: 'child' });
        assert.strictEqual(parent.fromModuleRequire, parent.fromChildRequire);

        fs.mkdirSync(`${root}/node_modules/no-exports-cjs/subdir`, { recursive: true });
        fs.mkdirSync(`${root}/node_modules/no-exports-cjs/empty-dir`, { recursive: true });
        fs.writeFileSync(`${root}/node_modules/no-exports-cjs/package.json`, JSON.stringify({ type: 'commonjs' }));
        fs.writeFileSync(`${root}/node_modules/no-exports-cjs/exact.js`, 'module.exports = { value: "exact" };');
        fs.writeFileSync(`${root}/node_modules/no-exports-cjs/no-ext.js`, 'module.exports = { value: "extension" };');
        fs.writeFileSync(`${root}/node_modules/no-exports-cjs/subdir/index.js`, 'module.exports = { value: "directory" };');
        fs.writeFileSync(`${root}/node_modules/no-exports-cjs/sp%20ce.js`, 'module.exports = { value: "encoded" };');
        fs.writeFileSync(`${root}/node_modules/no-exports-cjs/native.node`, 'not a native addon');
        fs.mkdirSync(`${root}/node_modules/exports-blocks-cjs`, { recursive: true });
        fs.writeFileSync(`${root}/node_modules/exports-blocks-cjs/package.json`, JSON.stringify({
            exports: './public.js',
        }));
        fs.writeFileSync(`${root}/node_modules/exports-blocks-cjs/public.js`, 'module.exports = { value: "public" };');
        fs.writeFileSync(`${root}/node_modules/exports-blocks-cjs/private.js`, 'module.exports = { value: "private" };');
        fs.mkdirSync(`${root}/node_modules/native-main`, { recursive: true });
        fs.writeFileSync(`${root}/node_modules/native-main/package.json`, JSON.stringify({ main: 'addon' }));
        fs.writeFileSync(`${root}/node_modules/native-main/addon.node`, 'not a native addon');
        fs.mkdirSync(`${root}/node_modules/native-index`, { recursive: true });
        fs.writeFileSync(`${root}/node_modules/native-index/index.node`, 'not a native addon');
        assert.deepStrictEqual(require('no-exports-cjs/exact.js'), { value: 'exact' });
        assert.deepStrictEqual(require('no-exports-cjs/no-ext'), { value: 'extension' });
        assert.deepStrictEqual(require('no-exports-cjs/subdir'), { value: 'directory' });
        assert.deepStrictEqual(require('no-exports-cjs/sp%20ce.js'), { value: 'encoded' });
        assert.throws(() => require('no-exports-cjs/empty-dir'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => require('no-exports-cjs/native'), { code: 'ERR_DLOPEN_FAILED', message: /native\.node/ });
        assert.deepStrictEqual(require('exports-blocks-cjs'), { value: 'public' });
        assert.throws(() => require('exports-blocks-cjs/private.js'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => require('native-main'), { code: 'ERR_DLOPEN_FAILED', message: /addon\.node/ });
        assert.throws(() => require('native-index'), { code: 'ERR_DLOPEN_FAILED', message: /index\.node/ });

        fs.writeFileSync(`${root}/bom.js`, '\uFEFFmodule.exports = 42;');
        fs.writeFileSync(`${root}/bom.json`, '\uFEFF42');
        fs.writeFileSync(`${root}/bom-shebang-shebang.js`, '\uFEFF#!shebang\n#!shebang\nmodule.exports = 1;');
        fs.writeFileSync(`${root}/shebang-bom.js`, '#!shebang\n\uFEFFmodule.exports = 42;');
        assert.strictEqual(require(`${root}/bom.js`), 42);
        assert.strictEqual(require(`${root}/bom.json`), 42);
        assert.throws(() => require(`${root}/bom-shebang-shebang.js`), { name: 'SyntaxError' });
        assert.strictEqual(require(`${root}/shebang-bom.js`), 42);

        require.extensions['.reg'] = require.extensions['.js'];
        fs.mkdirSync(`${root}/dir-index-reg`, { recursive: true });
        fs.writeFileSync(`${root}/dir-index-reg/index.reg`, 'exports.value = "index.reg";');
        assert.strictEqual(require(`${root}/dir-index-reg`).value, 'index.reg');

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsNestedDependencyCacheShape = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-nested-dependency-cache-app';

        fs.mkdirSync(`${root}/b/package`, { recursive: true });
        fs.writeFileSync(`${root}/b/package/index.js`, [
            'exports.hello = "world";',
        ].join('\n'));
        fs.writeFileSync(`${root}/b/d.js`, [
            'let value = "D";',
            'exports.D = function() { return value; };',
        ].join('\n'));
        fs.writeFileSync(`${root}/b/c.js`, [
            'const d = require("./d");',
            'const package = require("./package");',
            'if (package.hello !== "world") throw new Error("bad package");',
            'let value = "C";',
            'exports.SomeClass = function() {};',
            'exports.C = function() { return value; };',
            'exports.D = function() { return d.D(); };',
        ].join('\n'));
        fs.writeFileSync(`${root}/a.js`, [
            'const c = require("./b/c");',
            'let value = "A";',
            'exports.SomeClass = c.SomeClass;',
            'exports.A = function() { return value; };',
            'exports.C = function() { return c.C(); };',
            'exports.D = function() { return c.D(); };',
            'exports.number = 42;',
        ].join('\n'));

        const require = createRequire(`${root}/entry.cjs`);
        const withExtension = require(`${root}/a.js`);
        const withoutExtension = require(`${root}/a`);
        const c = require(`${root}/b/c`);
        const d = require(`${root}/b/d`);

        assert.strictEqual(withExtension, withoutExtension);
        assert.strictEqual(withExtension.number, 42);
        assert.strictEqual(withExtension.A(), 'A');
        assert.strictEqual(withExtension.C(), 'C');
        assert.strictEqual(withExtension.D(), 'D');
        assert.ok(new withExtension.SomeClass() instanceof c.SomeClass);
        assert.strictEqual(d.D(), 'D');

        const aCacheKeys = Object.keys(require.cache).filter((key) => key === `${root}/a.js`);
        assert.deepStrictEqual(aCacheKeys, [`${root}/a.js`]);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsModuleChildrenGraph = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-module-children-app';

        fs.mkdirSync(`${root}/nested`, { recursive: true });
        fs.writeFileSync(`${root}/nested/grandchild.js`, 'exports.name = "grandchild";');
        fs.writeFileSync(`${root}/nested/child.js`, [
            'exports.grandchild = require("./grandchild");',
            'exports.module = module;',
        ].join('\n'));
        fs.writeFileSync(`${root}/data.json`, JSON.stringify({ name: 'json' }));
        fs.writeFileSync(`${root}/custom.test`, 'module.exports.name = "custom";');
        fs.writeFileSync(`${root}/module-require-target.js`, 'exports.name = "module-require-target";');
        fs.writeFileSync(`${root}/throws.js`, 'throw new Error("failed child");');
        fs.writeFileSync(`${root}/native.node`, 'not a native module');
        fs.writeFileSync(`${root}/entry.js`, [
            'require.extensions[".test"] = function(mod, filename) {',
            '  mod._compile(require("fs").readFileSync(filename, "utf8"), filename);',
            '};',
            'exports.child = require("./nested/child");',
            'exports.childAgain = require("./nested/child");',
            'exports.json = require("./data.json");',
            'exports.custom = require("./custom.test");',
            'exports.moduleRequireTarget = module.require("./module-require-target");',
            'try { require("./throws"); } catch (err) { exports.throwCode = err.message; }',
            'try { require("./native.node"); } catch (err) { exports.nativeCode = err.code; }',
            'exports.module = module;',
        ].join('\n'));

        const require = createRequire(`${root}/main.cjs`);
        const entry = require(`${root}/entry.js`);
        assert.strictEqual(entry.child, entry.childAgain);
        assert.strictEqual(entry.child.grandchild.name, 'grandchild');
        assert.strictEqual(entry.json.name, 'json');
        assert.strictEqual(entry.custom.name, 'custom');
        assert.strictEqual(entry.moduleRequireTarget.name, 'module-require-target');
        assert.strictEqual(entry.throwCode, 'failed child');
        assert.strictEqual(entry.nativeCode, 'ERR_DLOPEN_FAILED');

        const childIds = entry.module.children.map((child) => child.filename);
        assert.deepStrictEqual(childIds, [
            `${root}/nested/child.js`,
            `${root}/data.json`,
            `${root}/custom.test`,
            `${root}/module-require-target.js`,
        ]);
        assert.strictEqual(childIds.includes(`${root}/throws.js`), false);
        assert.strictEqual(childIds.includes(`${root}/native.node`), false);
        assert.strictEqual(childIds.filter((filename) => filename === `${root}/nested/child.js`).length, 1);

        const nestedChildIds = entry.child.module.children.map((child) => child.filename);
        assert.deepStrictEqual(nestedChildIds, [`${root}/nested/grandchild.js`]);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
