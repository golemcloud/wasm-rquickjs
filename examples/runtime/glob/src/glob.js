import process from 'node:process';
import fs, { glob, globSync, Dirent } from 'node:fs';
import * as fsp from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

function fixture(name) {
    const root = path.resolve('test', `glob-${name}`);
    fs.rmSync(root, { recursive: true, force: true });
    for (const name of ['src/a.js', 'src/sub/b.ts', 'src/skip/c.js', 'top.txt', '.hidden', 'src/.dot.js']) {
        const file = path.join(root, name);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, name);
    }
    return root;
}

const collect = async iterator => {
    const result = [];
    for await (const entry of iterator) result.push(entry);
    return result;
};

export function matcherContract() {
    for (const [value, pattern, expected] of [
        ['a/b/c.js', '**/*.js', true], ['.x', '*', false], ['.x', '.*', true],
        ['a/.x', 'a/**', false], ['file.ts', '*.{js,ts}', true],
        ['foo', '@(foo|bar)', true], ['foo', '!(bar)', true], ['bar', '!(bar)', false],
        ['x', '#x', false], ['#x', '#x', true], ['!x', '!x', true],
        ['file7', 'file[0-9]', true], ['filex', 'file[!0-9]', true],
    ]) assert.equal(path.matchesGlob(value, pattern), expected, `${value}: ${pattern}`);
    for (const operator of ['?', '*', '+', '@']) {
        for (const body of ['', '|', '||']) {
            const pattern = `${operator}(${body})`;
            assert.equal(path.matchesGlob(pattern, pattern), true);
            assert.equal(path.matchesGlob('', pattern), false);
            assert.equal(path.matchesGlob(`a/${pattern}`, `a/${pattern}`), true);
        }
    }
    for (const api of [path, path.posix, path.win32]) {
        assert.equal(api.matchesGlob('Case.TXT', '*.txt'), false);
        assert.throws(() => api.matchesGlob(null, '*'), { code: 'ERR_INVALID_ARG_TYPE' });
        assert.throws(() => api.matchesGlob('a', []), { code: 'ERR_INVALID_ARG_TYPE' });
    }
    // Recorded from Node.js v22.14.0 path source with WASI OS constants. Case policy has
    // separate WASI assertions above; these inputs test both path dialects.
    for (const [value, pattern, posix, win32] of [
        ["", "*", false, false],
        ["", "**", true, true],
        [".", "**", false, false],
        ["a", "a/**", false, false],
        ["foo/.bar", "**/*", false, false],
        ["../a", "**/a", false, false],
        ["foo//bar", "foo/**/bar", true, true],
        ["foo/bar/", "foo/**", true, true],
        ["foo/bar", "foo/**/", false, false],
        ["file2", "file{1..3}", true, true],
        ["file12", "file{1..3}", false, false],
        ["[a]", "\\[a\\]", false, false],
        ["file9", "file[0-9]", true, true],
        ["fileq", "file[!0-9]", true, true],
        ["abc", "a?(b)c", true, true],
        ["ac", "a?(b)c", true, true],
        ["abbbc", "a+(b)c", true, true],
        ["abc", "a!(d)c", true, true],
        ["x?()", "x?()", false, false],
        ["foo", "!(bar)", true, true],
        ["bar", "!(bar)", false, false],
        ["a/b", "!(a)/b", false, false],
        ["foo", "{foo,bar}", true, true],
        ["bar", "{,foo}", false, false],
        ["{foo}", "{foo}", true, true],
        ["a\\b\\c.js", "a/**/c.js", false, true],
        ["c:\\src\\file.js", "c:/**/*.js", false, true],
        ["//server/share/a.js", "//server/share/*.js", true, true],
        ["c:/src/file.txt", "c:/src/*.{js,txt}", true, true],
        ["c:/src/file.txt", "c:/src/*.js", false, false],
        ["a\\b", "a/b", false, true],
        ["a/b", "a\\b", true, true],
        ["file.js", "*.+(js|ts)", true, true],
        ["file02.txt", "file{01..03}.txt", true, true],
        ["file4", "file{1..5..2}", false, false],
        ["file3", "file{1..5..2}", true, true],
        ["fileb", "file{a..c}", true, true],
        ["filez", "file{a..c}", false, false],
        ["b.js", "{a,{b,c}}.js", true, true],
        ["foobar", "{foo,{baz,}}bar", true, true],
        ["bb", "@(a|+(b|c))", true, true],
        ["bc", "@(a|+(b|c))", true, true],
        ["d", "@(a|+(b|c))", false, false],
        ["abce", "a!(b@(c|d))e", true, true],
        ["abxe", "a!(b@(c|d))e", true, true],
        ["x", "[[:alpha:]]", true, true],
        ["7", "[[:alpha:]]", false, false],
        ["7", "[[:digit:]]", true, true],
        [" ", "[[:space:]]", true, true],
        ["\u00e9", "[[:alpha:]]", true, true],
        ["./a", "./*", true, true],
        ["../a", "../*", true, true],
        ["a/../b", "a/**/b", false, false],
        ["a/.", "a/*", false, false],
        ["\\\\server\\share\\dir\\a.js", "\\\\server\\share\\**\\*.js", false, true],
        ["c:dir\\a.js", "c:**\\*.js", false, true],
        ["/a/b", "/**/*", true, true],
        ["c:/", "c:/**", true, true],
        ["//server/share/", "//server/share/**", true, true],
        ["a[b].js", "a[[]b].js", true, true],
        ["a*b", "a\\*b", false, false],
        ["a?b", "a[?]b", true, true],
        ["a/.x", "{a,b}/.*", true, true],
    ]) {
        assert.equal(path.posix.matchesGlob(value, pattern), posix, `posix: ${value}: ${pattern}`);
        assert.equal(path.win32.matchesGlob(value, pattern), win32, `win32: ${value}: ${pattern}`);
    }
    assert.equal(path.win32.matchesGlob('C:\\src\\a.js', 'C:\\**\\*.js'), true);
    assert.equal(path.posix.matchesGlob('a\\b', 'a/b'), false);
    assert.equal(path.matchesGlob('a'.repeat(512) + 'c', '*a'.repeat(24) + 'b'), false);
    for (let i = 0; i < 300; i++) assert.equal(path.matchesGlob(`file${i}`, `file${i}`), true);
    return true;
}

export function syncContract() {
    const cwd = fixture('sync');
    assert.equal(fs.glob, glob);
    assert.equal(fs.globSync, globSync);
    assert.equal(fs.promises.glob, fsp.glob);
    assert.deepEqual(globSync(['src/**/*.js', 'src/*.{js,ts}'], { cwd }).sort(), ['src/a.js', 'src/skip/c.js']);
    assert.deepEqual(globSync('src/**/*.{js,ts}', { cwd, exclude: ['src/skip/**'] }).sort(), ['src/a.js', 'src/sub/b.ts']);
    assert.deepEqual(globSync([], { cwd: '/missing' }), []);
    assert.deepEqual(globSync('not-here/**', { cwd }), []);
    const entries = globSync('src/*', { cwd, withFileTypes: true });
    assert(entries.every(entry => entry instanceof Dirent));
    assert(entries.every(entry => entry.parentPath === path.join(cwd, 'src')));
    assert(entries.find(entry => entry.name === 'a.js').isFile());
    assert(entries.find(entry => entry.name === 'sub').isDirectory());
    assert.equal(globSync('src/.dot.js', { cwd }).length, 1);
    assert.deepEqual(globSync('src\\**\\*.js', { cwd }).sort(), ['src/a.js', 'src/skip/c.js']);
    assert.throws(() => globSync('*', null), { code: 'ERR_INVALID_ARG_TYPE' });
    assert.throws(() => globSync(['*', 1], { cwd }), { code: 'ERR_INVALID_ARG_TYPE' });
    assert.throws(() => globSync('*', { cwd, exclude: ['x', false] }), { code: 'ERR_INVALID_ARG_TYPE' });
    return true;
}

export async function callbackContract() {
    const cwd = fixture('callback');
    assert.throws(() => glob('*', null), { code: 'ERR_INVALID_ARG_TYPE' });
    assert.throws(() => glob('*.txt', { cwd }, 42), { code: 'ERR_INVALID_ARG_TYPE', message: /"cb"/ });
    const previousCwd = process.cwd();
    try {
        process.chdir(cwd);
        assert.deepEqual(await new Promise((resolve, reject) => glob('*.txt', (error, entries) => error ? reject(error) : resolve(entries))), ['top.txt']);
    } finally { process.chdir(previousCwd); }
    const badOrder = ['call'];
    glob(42, { cwd }, error => {
        assert.equal(error.code, 'ERR_INVALID_ARG_TYPE');
        badOrder.push('callback');
    });
    badOrder.push('returned');
    assert.deepEqual(badOrder, ['call', 'callback', 'returned']);
    const order = ['call'];
    const pending = new Promise((resolve, reject) => {
        glob('*.txt', { cwd }, (error, entries) => {
            order.push('callback');
            if (error) reject(error); else resolve(entries);
        });
    });
    order.push('returned');
    assert.deepEqual(await pending, ['top.txt']);
    assert.deepEqual(order, ['call', 'returned', 'callback']);
    const sentinel = new Error('callback failure');
    let calls = 0;
    await new Promise((resolve, reject) => {
        glob('*.txt', { cwd }, error => {
            calls++;
            if (!error) throw sentinel;
            if (error !== sentinel) reject(error); else resolve();
        });
    });
    assert.equal(calls, 2);
    return true;
}

export async function iteratorContract() {
    const root = fixture('iterator');
    const options = { cwd: path.join(root, 'src') };
    const patterns = ['*.js'];
    const iterator = fsp.glob(patterns, options);
    options.cwd = path.join(root, 'src/sub');
    patterns[0] = '*.ts';
    fs.writeFileSync(path.join(options.cwd, 'late.ts'), 'late');
    assert.deepEqual((await collect(iterator)).sort(), ['b.ts', 'late.ts']);
    const invalid = fsp.glob('*', null);
    await assert.rejects(invalid.next(), { code: 'ERR_INVALID_ARG_TYPE' });
    let calls = 0;
    const early = fsp.glob('**/*', { cwd: root, exclude: () => { calls++; return false; } });
    assert.equal((await early.next()).done, false);
    const before = calls;
    await early.return();
    await Promise.resolve();
    assert.equal(calls, before);
    fs.writeFileSync(path.join(root, 'fresh.txt'), 'fresh');
    assert.deepEqual((await collect(fsp.glob('*.txt', { cwd: root }))).sort(), ['fresh.txt', 'top.txt']);
    const dirents = await collect(fsp.glob('src/*', { cwd: root, withFileTypes: true }));
    assert(dirents.every(entry => entry instanceof Dirent && entry.parentPath === path.join(root, 'src')));
    assert(dirents.find(entry => entry.name === 'sub').isDirectory());
    for (const [pattern, options, expected] of [
        [path.join(root, 'src/**/*.js'), { cwd: root }, [path.join(root, 'src/a.js'), path.join(root, 'src/skip/c.js')]],
        ['../*.txt', { cwd: path.join(root, 'src') }, ['../fresh.txt', '../top.txt']],
        ['./src/**/*.js', { cwd: root }, ['src/a.js', 'src/skip/c.js']],
        ['*.txt', { cwd: path.relative(process.cwd(), root) }, ['fresh.txt', 'top.txt']],
        ['*', { cwd: path.join(root, 'missing') }, []],
        ['src/**/', { cwd: root }, ['src', 'src/skip', 'src/sub']],
        ['**/..', { cwd: root }, ['.', '..', 'src']],
    ]) {
        assert.deepEqual(globSync(pattern, options).sort(), expected);
        assert.deepEqual((await collect(fsp.glob(pattern, options))).sort(), expected);
        const callback = await new Promise((resolve, reject) => glob(pattern, options, (error, entries) => error ? reject(error) : resolve(entries)));
        assert.deepEqual(callback.sort(), expected);
    }
    const callbackDirents = await new Promise((resolve, reject) => glob('src/*', { cwd: root, withFileTypes: true }, (error, entries) => error ? reject(error) : resolve(entries)));
    assert(callbackDirents.every(entry => entry instanceof Dirent && entry.parentPath === path.join(root, 'src')));
    assert.deepEqual(callbackDirents.map(entry => entry.name).sort(), dirents.map(entry => entry.name).sort());
    const left = fsp.glob('*.txt', { cwd: root });
    const right = fsp.glob('src/sub/*.ts', { cwd: root });
    const [a, b] = await Promise.all([collect(left), collect(right)]);
    assert.deepEqual(a.sort(), ['fresh.txt', 'top.txt']);
    assert.deepEqual(b.sort(), ['src/sub/b.ts', 'src/sub/late.ts']);
    return true;
}

export async function exclusionContract() {
    const cwd = fixture('exclude');
    let calls = 0;
    const exclude = () => { calls++; return Promise.resolve(false); };
    assert.deepEqual(globSync('*.txt', { cwd, exclude }), ['top.txt']);
    assert.equal(calls, 0);
    assert.deepEqual(globSync('**/*', { cwd, exclude }), []);
    assert.deepEqual(await collect(fsp.glob('**/*', { cwd, exclude })), []);
    assert(calls > 0);
    const entries = [];
    globSync('**/*', { cwd, withFileTypes: true, exclude: entry => {
        assert(entry instanceof Dirent);
        entries.push(entry.name);
        return entry.name === 'skip';
    } });
    assert(entries.includes('src'));
    assert(!entries.includes('c.js'));
    const sentinel = new Error('exclude failure');
    assert.throws(() => globSync('**/*', { cwd, exclude() { throw sentinel; } }), error => error === sentinel);
    await assert.rejects(collect(fsp.glob('**/*', { cwd, exclude() { throw sentinel; } })), error => error === sentinel);
    return true;
}

export async function symlinkContract() {
    const cwd = fixture('symlink');
    fs.symlinkSync('src', path.join(cwd, 'alias'), 'dir');
    fs.symlinkSync('..', path.join(cwd, 'src/cycle'), 'dir');
    fs.symlinkSync('missing', path.join(cwd, 'broken'));
    const expected = ['alias/sub/b.ts'];
    assert.deepEqual(globSync('alias/**/*.ts', { cwd }), expected);
    assert.deepEqual(await collect(fsp.glob('alias/**/*.ts', { cwd })), expected);
    assert.deepEqual(globSync('**/*.ts', { cwd }), ['src/sub/b.ts']);
    const entries = globSync('*', { cwd, withFileTypes: true });
    assert(entries.find(entry => entry.name === 'alias').isSymbolicLink());
    assert(entries.find(entry => entry.name === 'broken').isSymbolicLink());
    const all = globSync('**/*', { cwd });
    assert(all.includes('src/cycle'));
    assert(all.includes('src/cycle/top.txt'));
    assert(!all.some(value => value.startsWith('src/cycle/src/')));
    // Node.js v22.14.0 rejects async traversal when a dangling link is read
    // as a directory. Its synchronous traversal returns the available matches.
    const readError = error => error instanceof TypeError && /null.*length|length.*null/.test(error.message);
    await assert.rejects(collect(fsp.glob('**/*', { cwd })), readError);
    await assert.rejects(new Promise((resolve, reject) => glob('**/*', { cwd }, (error, entries) => error ? reject(error) : resolve(entries))), readError);
    fs.unlinkSync(path.join(cwd, 'broken'));
    assert.deepEqual((await collect(fsp.glob('**/*', { cwd }))).sort(), globSync('**/*', { cwd }).sort());
    fs.symlinkSync('top.txt', path.join(cwd, 'file-link'));
    await assert.rejects(collect(fsp.glob('**/*', { cwd })), readError);
    await assert.rejects(new Promise((resolve, reject) => glob('**/*', { cwd }, (error, entries) => error ? reject(error) : resolve(entries))), readError);
    return true;
}
