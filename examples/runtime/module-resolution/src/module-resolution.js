import assert from 'node:assert';
import fs from 'node:fs';
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
        try {
            writeImportEntry('/esm-package-map-edge-app/deprecated-double-subpath.mjs', 'exported-pkg/deprecated-double');
            writeImportEntry('/esm-package-map-edge-app/pattern-slash-subpath.mjs', 'exported-pkg/pattern-slash/dir1/dir1');
            writeImportEntry('/esm-package-map-edge-app/trailing-pattern-slash-subpath.mjs', 'exported-pkg/trailing-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/trailing-pattern-slash-subpath-duplicate.mjs', 'exported-pkg/trailing-pattern-slash/');
            writeImportEntry('/esm-package-map-edge-app/folder-pattern-trailing-subpath.mjs', 'exported-pkg/folder-pattern/foo/');
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/deprecated-double-subpath.mjs')).default.default, { public: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/pattern-slash-subpath.mjs')).default.default, { patternSlash: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/trailing-pattern-slash-subpath.mjs')).default.default, { trailingPattern: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/trailing-pattern-slash-subpath-duplicate.mjs')).default.default, { trailingPattern: true });
            assert.deepStrictEqual((await import('/esm-package-map-edge-app/folder-pattern-trailing-subpath.mjs')).default.default, { folderPattern: true });
            await new Promise((resolve) => process.nextTick(resolve));
        } finally {
            process.removeListener('warning', onPackageWarning);
        }
        assert.deepStrictEqual(packageWarnings.map((warning) => warning.code), ['DEP0166', 'DEP0166', 'DEP0155', 'DEP0155']);
        assert.match(packageWarnings[0].stack, /DeprecationWarning: Use of deprecated double slash/);
        assert.match(packageWarnings[0].message, /package\.json imported from \/esm-package-map-edge-app\/deprecated-double-subpath\.mjs\./);
        assert.match(packageWarnings[1].message, /matched to "\.\/pattern-slash\*"/);
        assert.match(packageWarnings[1].message, /package\.json imported from \/esm-package-map-edge-app\/pattern-slash-subpath\.mjs\./);
        assert.match(packageWarnings[2].stack, /DeprecationWarning: Use of deprecated trailing slash pattern mapping/);
        assert.match(packageWarnings[2].message, /package\.json imported from \/esm-package-map-edge-app\/trailing-pattern-slash-subpath\.mjs\./);
        assert.match(packageWarnings[3].message, /folder-pattern\/foo\//);
        assert.match(packageWarnings[3].message, /package\.json imported from \/esm-package-map-edge-app\/folder-pattern-trailing-subpath\.mjs\./);

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
        const dynamicModule = await import('data:text/javascript,' + encodeURIComponent([
            'let optionsCount = 0;',
            'const options = () => { optionsCount++; return { with: { type: "json" } }; };',
            'const jsonPath = "/dynamic-json-attrs.json";',
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
        fs.writeFileSync('/dynamic-json-relative-app/assertionless.json', '{"ofLife":42}');
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'globalThis.__assertionlessJsonSeen = [];',
            'async function resolve(specifier, context, next) {',
            '  const noType = context.importAttributes.type == null;',
            '  const result = await next(specifier, context);',
            '  const url = new URL(result.url);',
            '  if (globalThis.__assertionlessJsonEnabled !== false && noType && (url.pathname.endsWith("/assertionless.json") || (result.url.startsWith("data:application/json") && result.url.includes("ofLife")))) {',
            '    result.importAttributes = Object.assign({}, result.importAttributes || context.importAttributes, { type: "json" });',
            '  }',
            '  globalThis.__assertionlessJsonSeen.push({ specifier, url: result.url, contextImportAttributes: context.importAttributes, resultImportAttributes: result.importAttributes });',
            '  return result;',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + resolve));',
            'const [filePlain, fileTyped] = await Promise.all([',
            '  import("/dynamic-json-relative-app/assertionless.json"),',
            '  import("/dynamic-json-relative-app/assertionless.json", { with: { type: "json" } }),',
            ']);',
            'assert.strictEqual(filePlain, fileTyped, JSON.stringify(globalThis.__assertionlessJsonSeen));',
            'assert.strictEqual(filePlain.default, fileTyped.default, JSON.stringify(globalThis.__assertionlessJsonSeen));',
            'assert.deepStrictEqual(filePlain.default, { ofLife: 42 });',
            'const filePlainAgain = await import("/dynamic-json-relative-app/assertionless.json");',
            'const fileTypedAgain = await import("/dynamic-json-relative-app/assertionless.json", { with: { type: "json" } });',
            'assert.strictEqual(filePlainAgain, filePlain);',
            'assert.strictEqual(fileTypedAgain, filePlain);',
            'const [queryPlain, queryTyped] = await Promise.all([',
            '  import("/dynamic-json-relative-app/assertionless.json?cache#frag"),',
            '  import("/dynamic-json-relative-app/assertionless.json?cache#frag", { with: { type: "json" } }),',
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
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'let seed = 0;',
            'async function resolve(specifier, context, next) {',
            '  const result = await next(specifier, context);',
            '  const url = new URL(result.url);',
            '  if (url.pathname.endsWith("/dynamic-json-relative-app/data.json")) {',
            '    url.searchParams.set("seed", String(++seed));',
            '    return Object.assign({}, result, { url: url.href });',
            '  }',
            '  return result;',
            '}',
            'function load(url, context, next) {',
            '  if (context.importAttributes.type === "json" && url.includes("/dynamic-json-relative-app/data.json")) {',
            '    const value = new URL(url).searchParams.get("seed");',
            '    return { shortCircuit: true, format: "json", source: JSON.stringify({ value }) };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("let seed = 0; export " + resolve + ";export " + load));',
            'const first = await import("/dynamic-json-relative-app/data.json", { with: { type: "json" } });',
            'const second = await import("/dynamic-json-relative-app/data.json", { with: { type: "json" } });',
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
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'async function resolve(specifier, context, next) {',
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
            'assert.deepStrictEqual((await import("/loader-relative-app/main.mjs")).default, { hookRelative: true });',
            'assert.strictEqual(globalThis.__loader_relative_seen, true);',
            'assert.strictEqual((await import("data:text/javascript,export default 5", {})).default, 5);',
        ].join('\n')));
        fs.writeFileSync(
            '/loader-relative-app/relative-loader.mjs',
            [
                'export async function resolve(specifier, context, next) {',
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
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'register("./relative-loader.mjs", { parentURL: "file:///loader-relative-app/main.mjs" });',
            'assert.deepStrictEqual((await import("virtual:relative-loader", { with: { type: "json" } })).default, { relativeLoader: true });',
        ].join('\n')));
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'async function resolve(specifier, context, next) {',
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
        fs.writeFileSync('/loader-next-app/node_modules/loader-next-pkg/fallback.json', '{"fallback":true}');
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
                'import assert from "node:assert";',
                'import { register } from "node:module";',
                'async function resolve(specifier, context, next) {',
                '  if (specifier === "loader-next-pkg") {',
                '    const result = await next(specifier, context);',
                '    if (new URL(result.url).pathname !== "/loader-next-app/node_modules/loader-next-pkg/data.json") throw new Error("nextResolve did not use package exports import condition: " + result.url);',
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
                '  assert.strictEqual(err && err.code, "ERR_MODULE_NOT_FOUND", "extensionless loader nextResolve import should reject");',
                '  extensionlessRejected = true;',
                '}',
                'if (!extensionlessRejected) throw new Error("Missing expected rejection: extensionless loader nextResolve import should reject");',
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
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'function load(url, context, next) {',
            '  if (url.includes("/loader-relative-app/bytes.json")) {',
            '    return { shortCircuit: true, format: "json", source: new TextEncoder().encode("{\\"bytes\\":true}") };',
            '  }',
            '  return next(url, context);',
            '}',
            'register("data:text/javascript," + encodeURIComponent("export " + load));',
            'assert.deepStrictEqual((await import("/loader-relative-app/bytes.json", { with: { type: "json" } })).default, { bytes: true });',
        ].join('\n')));
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
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
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'register("./url-parent-loader.mjs", new URL("file:///loader-relative-app/main.mjs"), { data: { value: 7 } });',
            'assert.deepStrictEqual((await import("virtual:url-parent-initialize", { with: { type: "json" } })).default, { urlParent: true });',
        ].join('\n')));
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'register("./url-parent-loader.mjs", { parentURL: "file:///loader-relative-app/main.mjs", data: { value: 7 } });',
            'assert.deepStrictEqual((await import("virtual:url-parent-initialize", { with: { type: "json" } })).default, { urlParent: true });',
        ].join('\n')));
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
        fs.writeFileSync('/loader-cjs-source-app/aliased-dep.cjs', 'exports.aliasValue = 77;');
        await import('data:text/javascript,' + encodeURIComponent([
            'import assert from "node:assert";',
            'import { register } from "node:module";',
            'function resolve(specifier, context, next) {',
            '  if (specifier === "virtual:loader-cjs") {',
            '    return { shortCircuit: true, url: "virtual:loader-cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-file") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/source.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-reexport") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/reexport.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-exports-reassign") {',
            '    return { shortCircuit: true, url: "file:///loader-cjs-source-app/exports-reassign.cjs", format: "commonjs" };',
            '  }',
            '  if (specifier === "virtual:loader-cjs-view") {',
            '    return { shortCircuit: true, url: "virtual:loader-cjs-view", format: "commonjs" };',
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
            '        "Object.defineProperty(module.exports, \\"definedValue\\", { value: 64 });",',
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
            'assert.strictEqual(ns.definedValue, 64);',
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
            'assert.strictEqual(Object.prototype.hasOwnProperty.call(ns, "falsePositive"), false);',
            'assert.strictEqual((await import("virtual:loader-cjs-view")).fromView, true);',
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

export const testSyncBuiltinEsmExports = async () => {
    try {
        const module = await import('node:module');
        const fsModule = await import('node:fs');
        const eventsModule = await import('node:events');

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
            'import * as ns from "./direct.cjs";',
            'import * as fp from "./false-positives.cjs";',
            'export default {',
            '  def, foo, bar, baz, pi: π, packageExport, bracketOnly, definedOnly,',
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
            'import * as reversedGuardReexport from "./reversed-guard-reexport.cjs";',
            'import * as delayedGuardReexport from "./delayed-guard-reexport.cjs";',
            'import * as nestedGuardReexport from "./nested-guard-reexport.cjs";',
            'import * as forHeaderBinding from "./for-header-binding.cjs";',
            'import * as commentedReexport from "./commented-reexport.cjs";',
            'import * as lineCommentedReexport from "./line-commented-reexport.cjs";',
            'import * as arrowCallbackReexport from "./arrow-callback-reexport.cjs";',
            'import * as extraArgReexport from "./extra-arg-reexport.cjs";',
            'import * as hasOwnGuardReexport from "./has-own-guard-reexport.cjs";',
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
            querySameAsCjs: true,
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

        const ns = require('/require-esm-cycle-app/a.mjs');
        assert.strictEqual(ns.value, 1);
        assert.strictEqual(ns.cycleCode, 'ERR_REQUIRE_CYCLE_MODULE');
        const detected = require('/require-esm-cycle-app/syntax-detected.js');
        assert.strictEqual(detected.value, 2);
        assert.strictEqual(detected.cycleCode, 'ERR_REQUIRE_CYCLE_MODULE');
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
        fs.writeFileSync(`${root}/entry.js`, [
            'require.extensions[".test"] = function(mod, filename) {',
            '  mod._compile(require("fs").readFileSync(filename, "utf8"), filename);',
            '};',
            'exports.child = require("./nested/child");',
            'exports.childAgain = require("./nested/child");',
            'exports.json = require("./data.json");',
            'exports.custom = require("./custom.test");',
            'exports.moduleRequireTarget = module.require("./module-require-target");',
            'exports.module = module;',
        ].join('\n'));

        const require = createRequire(`${root}/main.cjs`);
        const entry = require(`${root}/entry.js`);
        assert.strictEqual(entry.child, entry.childAgain);
        assert.strictEqual(entry.child.grandchild.name, 'grandchild');
        assert.strictEqual(entry.json.name, 'json');
        assert.strictEqual(entry.custom.name, 'custom');
        assert.strictEqual(entry.moduleRequireTarget.name, 'module-require-target');

        const childIds = entry.module.children.map((child) => child.filename);
        assert.deepStrictEqual(childIds, [
            `${root}/nested/child.js`,
            `${root}/data.json`,
            `${root}/custom.test`,
            `${root}/module-require-target.js`,
        ]);
        assert.strictEqual(childIds.filter((filename) => filename === `${root}/nested/child.js`).length, 1);

        const nestedChildIds = entry.child.module.children.map((child) => child.filename);
        assert.deepStrictEqual(nestedChildIds, [`${root}/nested/grandchild.js`]);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
