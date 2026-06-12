import assert from 'node:assert';
import fs from 'node:fs';

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
                './array-invalid-fallback': [
                    '../outside.mjs',
                    './public.mjs',
                ],
                './condition-no-match-fallback': {
                    node: { browser: './browser.mjs' },
                    default: './public.mjs',
                },
                './no-ext': './real',
            },
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/main.mjs', 'export default { main: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/private.mjs', 'export default { private: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/public.mjs', 'export default { public: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/default.mjs', 'export default { condition: "default" };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/import.mjs', 'export default { condition: "import" };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/real.mjs', 'export default { extensionFallback: true };');

        fs.writeFileSync('/esm-package-map-edge-app/entry.mjs', [
            'export const publicValue = (await import("exported-pkg/public")).default;',
            'export const conditionOrder = (await import("exported-pkg/condition-order")).default;',
            'export const arrayFallback = (await import("exported-pkg/array-fallback")).default;',
            'export const arrayInvalidFallback = (await import("exported-pkg/array-invalid-fallback")).default;',
            'export const conditionNoMatchFallback = (await import("exported-pkg/condition-no-match-fallback")).default;',
        ].join('\n'));

        const entry = await import('/esm-package-map-edge-app/entry.mjs');
        assert.deepStrictEqual(entry.publicValue, { public: true });
        assert.deepStrictEqual(entry.conditionOrder, { condition: 'default' });
        assert.deepStrictEqual(entry.arrayFallback, { public: true });
        assert.deepStrictEqual(entry.arrayInvalidFallback, { public: true });
        assert.deepStrictEqual(entry.conditionNoMatchFallback, { public: true });

        writeImportEntry('/esm-package-map-edge-app/missing-root.mjs', 'exported-pkg');
        writeImportEntry('/esm-package-map-edge-app/private-subpath.mjs', 'exported-pkg/private.mjs');
        writeImportEntry('/esm-package-map-edge-app/escape-subpath.mjs', 'exported-pkg/escape');
        writeImportEntry('/esm-package-map-edge-app/nested-escape-subpath.mjs', 'exported-pkg/nested-escape');
        writeImportEntry('/esm-package-map-edge-app/node-modules-target-subpath.mjs', 'exported-pkg/node-modules-target');
        writeImportEntry('/esm-package-map-edge-app/dot-segment-target-subpath.mjs', 'exported-pkg/dot-segment-target');
        writeImportEntry('/esm-package-map-edge-app/encoded-dot-target-subpath.mjs', 'exported-pkg/encoded-dot-target');
        writeImportEntry('/esm-package-map-edge-app/blocked-null-subpath.mjs', 'exported-pkg/blocked-null');
        writeImportEntry('/esm-package-map-edge-app/blocked-false-subpath.mjs', 'exported-pkg/blocked-false');
        writeImportEntry('/esm-package-map-edge-app/array-blocked-subpath.mjs', 'exported-pkg/array-blocked');
        writeImportEntry('/esm-package-map-edge-app/no-ext-subpath.mjs', 'exported-pkg/no-ext');

        await expectImportError('/esm-package-map-edge-app/missing-root.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/private-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/escape-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/nested-escape-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/node-modules-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/dot-segment-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/encoded-dot-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/blocked-null-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/blocked-false-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/array-blocked-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
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
            },
        }));
        fs.writeFileSync('/esm-package-map-edge-app/app-alias.mjs', 'export default { appAlias: true };');
        fs.writeFileSync('/esm-package-map-edge-app/imports-entry.mjs', [
            'import external from "#external";',
            'import fs from "#fs";',
            'export default external;',
            'export const readFileSyncType = typeof fs.readFileSync;',
        ].join('\n'));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/dep/index.mjs', [
            'import appAlias from "#app-alias";',
            'export default appAlias;',
        ].join('\n'));
        fs.writeFileSync('/esm-package-map-edge-app/imports-boundary-entry.mjs', 'export default await import("dep");');

        const importsEntry = await import('/esm-package-map-edge-app/imports-entry.mjs');
        assert.deepStrictEqual(importsEntry.default, { external: true });
        assert.strictEqual(importsEntry.readFileSyncType, 'function');
        await expectImportError('/esm-package-map-edge-app/imports-boundary-entry.mjs', 'ERR_PACKAGE_IMPORT_NOT_DEFINED');

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};
