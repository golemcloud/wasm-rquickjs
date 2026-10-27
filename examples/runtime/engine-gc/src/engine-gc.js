import assert from 'node:assert/strict';
import data from 'data:application/json,%7B%22answer%22%3A42%7D' with { type: 'json' };
import { answer, data as extraData, namespace } from 'engine-extra';
import { runJavaScript } from 'wasm-rquickjs:execution';
import { aborted } from 'node:util';

const spacingMarks = /[\p{Spacing_Mark}--[\u0903\u093B\u094E]]/v;
const snapshot = () => globalThis.__wasm_rquickjs_gc_snapshot();
const probe = () => globalThis.__wasm_rquickjs_new_gc_probe();
const MiB = 1024 * 1024;

export function regexpSets() {
    for (const regex of [spacingMarks, new RegExp('[\\p{Spacing_Mark}--[\\u0903\\u093B\\u094E]]', 'v')]) {
        assert.equal(regex.test('\u093e'), true);
        for (const excluded of ['\u0903', '\u093b', '\u094e', 'A']) assert.equal(regex.test(excluded), false);
    }
    assert.equal(/[\p{ASCII}&&\p{Letter}]/v.test('A'), true);
    assert.equal(/[\p{ASCII}&&\p{Letter}]/v.test('1'), false);
    assert.equal(/[[a-z]--[aeiou]]/v.test('b'), true);
    assert.equal(/[[a-z]--[aeiou]]/v.test('a'), false);
    assert.equal(/[\q{ab|cd}--\q{ab}]/v.test('cd'), true);
    assert.equal(/[\q{ab|cd}--\q{ab}]/v.test('ab'), false);
    assert.equal(/\p{RGI_Emoji}/v.test('👨‍👩‍👧‍👦'), true);
    assert.throws(() => new RegExp('[a-z--[aeiou]]', 'v'), SyntaxError);
    assert.throws(() => new Function('return /[a-z--[aeiou]]/v'), SyntaxError);
    assert.equal(typeof Symbol.dispose, 'symbol');
    assert.equal(typeof Symbol.asyncDispose, 'symbol');
    assert.equal(globalThis.__wasm_rquickjs_symbol_dispose, Symbol.dispose);
    for (const name of ['dispose', 'asyncDispose']) {
        assert.equal(Symbol.keyFor(Symbol[name]), undefined);
        assert.equal(Object.getOwnPropertyDescriptor(Symbol, name).writable, false);
    }
    return true;
}

export async function registeredJsonAttributes() {
    const { register } = await import('node:module');
    const sourceUrl = 'registered-json:source';
    const dataUrl = 'data:application/json,%7B%22answer%22%3A43%7D';
    const loader = `
        export function resolve(specifier, context, next) {
            if (specifier === ${JSON.stringify(sourceUrl)}) {
                return { shortCircuit: true, url: specifier, format: 'json' };
            }
            return next(specifier, context);
        }
        export function load(url, context, next) {
            if (url === ${JSON.stringify(sourceUrl)}) {
                return { shortCircuit: true, format: 'json', source: '{"answer":42}' };
            }
            return next(url, context);
        }
    `;
    register('data:text/javascript,' + encodeURIComponent(loader));
    await import('data:text/javascript,export default true#registered-json-ready');
    const before = snapshot()[5];
    const parent = (url, label, prefix = '') => 'data:text/javascript,' + encodeURIComponent(
        `${prefix}\nimport * as value from ${JSON.stringify(url)} with {type:'json'}; export default value;\n// ${label}`,
    );
    for (const url of [sourceUrl, dataUrl]) {
        const firstParent = parent(url, 'first');
        const first = (await import(firstParent)).default;
        assert.equal((await import(firstParent)).default, first);
        assert.equal(await import(url, { with: { type: 'json' } }), first);
        for (let i = 0; i < 20; i++) {
            assert.equal((await import(parent(url, i))).default, first);
            assert.equal(snapshot()[5], before, 'registered JSON handoffs must consume their authorizations');
        }
        const concurrent = await Promise.all([
            import(parent(url, 'concurrent-a')), import(parent(url, 'concurrent-b')),
        ]);
        for (const imported of concurrent) assert.equal(imported.default, first);
        if (url === dataUrl) {
            // The default loader validates attributes; a custom JSON load hook
            // may deliberately accept other attributes, as Node permits.
            await assert.rejects(import(url), { code: 'ERR_IMPORT_ATTRIBUTE_MISSING' });
            // The registered default loader's unsupported-type error code is
            // a separate validation gap; cache reuse must still reject it.
            await assert.rejects(import(url, { with: { type: 'invalid' } }));
        }
        for (const prefix of ['const invalid = ;', 'import "missing-registered-json-package";']) {
            for (let i = 0; i < 10; i++) {
                await assert.rejects(import(parent(url, `failed-${i}`, prefix)));
                assert.equal(snapshot()[5], before, 'unreached static edges must not retain authorizations');
            }
        }
    }
    const appNamespace = await import(sourceUrl, { with: { type: 'json' } });
    const consumer = `
        import * as value from ${JSON.stringify(sourceUrl)} with {type:'json'};
        globalThis.__registeredJsonLoaderNamespace = value;
        export function resolve(specifier, context, next) { return next(specifier, context); }
    `;
    register('data:text/javascript,' + encodeURIComponent(consumer));
    await import('data:text/javascript,export default true#registered-json-realm-ready');
    const loaderNamespace = globalThis.__registeredJsonLoaderNamespace;
    assert.deepEqual(loaderNamespace.default, appNamespace.default);
    assert.notEqual(loaderNamespace, appNamespace, 'the loader realm must retain its own module identity');
    assert.notEqual(loaderNamespace.default, appNamespace.default);
    assert.equal(snapshot()[5], before);
    delete globalThis.__registeredJsonLoaderNamespace;
    return true;
}

export async function embeddedAttributes() {
    assert.equal(answer, 42);
    const url = 'data:application/json,%7B%22answer%22%3A42%7D';
    const first = await import(url, { with: { type: 'json' } });
    const second = await import(url, { with: { type: 'json' } });
    assert.equal(first.default, data);
    assert.equal(first, second);
    assert.equal(first.default, extraData);
    assert.equal(first, namespace);
    await assert.rejects(import(url), { code: 'ERR_IMPORT_ATTRIBUTE_MISSING' });
    await assert.rejects(import(url, { with: { type: 'invalid' } }), { code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' });
    await assert.rejects(import(url, { with: { type: 'json', extra: 'x' } }), { code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' });
    // A raw engine import must still authorize the request before cache lookup.
    const bareImport = new Function('url', 'return import(url)');
    await assert.rejects(bareImport(url), {
        code: 'ERR_IMPORT_ATTRIBUTE_MISSING',
        message: `Module "${url}" needs an import attribute of "type: json"`,
    });
    await assert.rejects(bareImport('data:application/json;__wasm_rquickjs_import_type=json-forged,%7B%7D'), { code: 'ERR_IMPORT_ATTRIBUTE_MISSING' });
    const parent = label => import('data:text/javascript,' + encodeURIComponent(
        `import * as value from ${JSON.stringify(url)} with {type:'json'}; export default value;`
    ) + '#' + label);
    const parents = await Promise.all([parent('a'), parent('b')]);
    for (const imported of parents) assert.equal(imported.default, first);
    const other = 'data:application/json;foo=bar,%7B%22answer%22%3A42%7D';
    await assert.rejects(import(other), { code: 'ERR_IMPORT_ATTRIBUTE_MISSING' });
    const distinct = await import(other, { with: { type: 'json' } });
    assert.notEqual(distinct, first);
    const fragment = await import(other + '#fragment', { with: { type: 'json' } });
    assert.notEqual(fragment, distinct);
    await assert.rejects(import('data:application/json,%7B', { with: { type: 'json' } }), SyntaxError);
    return true;
}

export async function failedImports() {
    const before = snapshot()[5];
    for (const prefix of ['const invalid = ;', 'import "missing-failed-import-package";']) {
        const source = `${prefix}\nimport value from "data:application/json,42" with {type:"json"};`;
        const url = 'data:text/javascript,' + encodeURIComponent(source);
        for (let i = 0; i < 1000; i++) {
            await assert.rejects(import(url));
            assert.equal(snapshot()[5], before, 'failed parsing or linking must release unused authorizations');
        }
    }
    const valid = await import('data:application/json,42', { with: { type: 'json' } });
    assert.equal(valid.default, 42);
    return true;
}

export async function sharedBodyErrors() {
    assert.equal(await globalThis.__wasm_rquickjs_shared_body_error_gc(false), true);
    assert.equal(await globalThis.__wasm_rquickjs_shared_body_error_gc(true), true);
    return true;
}

export function typedBuffers() {
    for (const Type of [Uint16Array, Uint32Array]) {
        const length = 1024;
        const size = length * Type.BYTES_PER_ELEMENT;
        const backing = new Uint8Array(size + 64).fill(165);
        const view = new Type(backing.buffer, 32, length);
        view.fill(0);
        assert.equal(crypto.getRandomValues(view), view);
        assert.ok(backing.subarray(0, 32).every(byte => byte === 165));
        assert.ok(backing.subarray(size + 32).every(byte => byte === 165));
        for (let i = 0; i < Type.BYTES_PER_ELEMENT; i++) {
            const part = backing.subarray(32 + i * length, 32 + (i + 1) * length);
            assert.ok(part.some(byte => byte !== 0), 'random fill must cover the full byte length');
        }
    }
    return true;
}

export function accounting() {
    const before = snapshot();
    const bytes = new Uint8Array(16 * MiB);
    bytes[0] = 123;
    bytes[bytes.length - 1] = 45;
    const retained = snapshot();
    assert.equal(bytes[0] + bytes[bytes.length - 1], 168);
    assert.ok(retained[0] - before[0] >= 16 * MiB, 'allocator must count the buffer payload');
    return JSON.stringify({ before, retained });
}

function churn(count, payload) {
    for (let i = 0; i < count; i++) {
        const cycle = { data: new Uint8Array(payload), native: probe() };
        cycle.data[0] = i & 255;
        cycle.self = cycle;
    }
}

export function cycleStress() {
    const bootstrap = snapshot();
    const root = new Uint8Array(1024).fill(73);
    churn(10000, 4096);
    const warm = snapshot();
    const points = [];
    for (let i = 0; i < 9; i++) {
        churn(10000, 4096);
        points.push(snapshot());
        assert.equal(root[511], 73);
    }
    const final = points[points.length - 1];
    const report = JSON.stringify({ bootstrap, warm, points, final });
    assert.ok(final[3] - bootstrap[3] > 50000, `automatic GC must release native objects in cycles: ${report}`);
    for (const point of points) {
        assert.ok(point[1] - warm[1] <= 16 * MiB, `heap must plateau after warmup: ${report}`);
        assert.ok(point[4] - warm[4] <= 32 * MiB, `linear memory must plateau after warmup: ${report}`);
    }
    return report;
}

export async function asyncRoots() {
    const before = snapshot();
    async function* values() {
        const captured = { value: 42, native: probe() };
        yield captured.value;
        await Promise.resolve();
        churn(20000, 4096);
        yield captured.value + 1;
        await new Promise(resolve => setTimeout(resolve, 0));
        return captured.value + 2;
    }
    const iterator = values();
    assert.deepEqual(await iterator.next(), { value: 42, done: false });
    assert.deepEqual(await iterator.next(), { value: 43, done: false });
    assert.deepEqual(await iterator.next(), { value: 44, done: true });
    const returned = values();
    await returned.next();
    churn(20000, 4096);
    assert.deepEqual(await returned.return(99), { value: 99, done: true });
    const thrown = values();
    await thrown.next();
    churn(20000, 4096);
    const failure = new Error('generator throw');
    await assert.rejects(thrown.throw(failure), error => error === failure);
    assert.ok(snapshot()[3] > before[3], 'the root checks must run under real collection pressure');
    return true;
}

export async function ownedRuntimes() {
    const parentDrops = snapshot()[3];
    const source = `
        const snapshot = globalThis.__wasm_rquickjs_gc_snapshot;
        const before = snapshot();
        if (before[3] !== 0 || globalThis.jobMarker !== undefined) throw new Error('runtime state leaked');
        globalThis.jobMarker = true;
        const captured = { value: 42, native: globalThis.__wasm_rquickjs_new_gc_probe() };
        for (let i = 0; i < 20000; i++) {
            const cycle = { data: new Uint8Array(4096), native: globalThis.__wasm_rquickjs_new_gc_probe() };
            cycle.self = cycle;
            if (i % 100 === 0) await Promise.resolve();
        }
        if (captured.value !== 42 || snapshot()[3] === 0) throw new Error('root or collection failure');
        return captured.value;
    `;
    const results = await Promise.all([
        runJavaScript({ source }), runJavaScript({ source }),
    ]);
    assert.deepEqual(results.map(result => result.value), [42, 42]);
    assert.equal(snapshot()[3], parentDrops);
    return true;
}

// Diagnostic control for pre-existing strong JS registries. Automatic engine GC
// cannot reclaim objects that remain strongly rooted by their API wrapper.
export function registryRetention() {
    const before = snapshot();
    for (let i = 0; i < 1000; i++) {
        const signal = AbortSignal.timeout(3600000);
        signal.probe = probe();
        const controller = new AbortController();
        aborted(controller.signal, { native: probe() });
    }
    const registered = snapshot();
    churn(20000, 4096);
    const after = snapshot();
    assert.ok(after[3] - before[3] > 10000, 'control must exercise automatic collection');
    return JSON.stringify({ before, registered, after });
}

export async function retainedHeap() {
    const roots = Array.from({ length: 4096 }, (_, i) => new Uint8Array(16384).fill(i & 255));
    const before = snapshot();
    for (let i = 0; i < 100; i++) {
        churn(1000, 1024);
        await Promise.resolve();
    }
    for (let i = 0; i < roots.length; i++) assert.equal(roots[i][8192], i & 255);
    const after = snapshot();
    assert.ok(after[3] > before[3], 'large retained heaps must still collect garbage');
    return JSON.stringify({ before, after });
}
