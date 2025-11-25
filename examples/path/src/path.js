import * as path from 'node:path';

function assert(condition, message) {
    if (!condition) {
        console.log("Assertion failed: " + message);
        throw new Error(message);
    }
}

export const testBasename = () => {
    try {
        assert(path.basename('/foo/bar/baz/asdf/quux.html') === 'quux.html', "basename 1");
        assert(path.basename('/foo/bar/baz/asdf/quux.html', '.html') === 'quux', "basename 2");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testDirname = () => {
    try {
        assert(path.dirname('/foo/bar/baz/asdf/quux') === '/foo/bar/baz/asdf', "dirname 1");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testExtname = () => {
    try {
        assert(path.extname('index.html') === '.html', "extname 1");
        assert(path.extname('index.coffee.md') === '.md', "extname 2");
        assert(path.extname('index.') === '.', "extname 3");
        assert(path.extname('index') === '', "extname 4");
        assert(path.extname('.index') === '', "extname 5");
        assert(path.extname('.index.md') === '.md', "extname 6");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testIsAbsolute = () => {
    try {
        assert(path.isAbsolute('/foo/bar') === true, "isAbsolute 1");
        assert(path.isAbsolute('/baz/..') === true, "isAbsolute 2");
        assert(path.isAbsolute('quux/') === false, "isAbsolute 3");
        assert(path.isAbsolute('.') === false, "isAbsolute 4");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testJoin = () => {
    try {
        assert(path.join('/foo', 'bar', 'baz/asdf', 'quux', '..') === '/foo/bar/baz/asdf', "join 1");
        assert(path.join('/foo', '/bar') === '/foo/bar', "join 2"); // This will fail with current impl
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testNormalize = () => {
    try {
        assert(path.normalize('/foo/bar//baz/asdf/quux/..') === '/foo/bar/baz/asdf', "normalize 1");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRelative = () => {
    try {
        assert(path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb') === '../../impl/bbb', "relative 1");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testResolve = () => {
    try {
        assert(path.resolve('/foo/bar', './baz') === '/foo/bar/baz', "resolve 1");
        assert(path.resolve('/foo/bar', '/tmp/file/') === '/tmp/file', "resolve 2");
        assert(path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif') === '/wwwroot/static_files/gif/image.gif', "resolve 3"); // Assumes cwd is /
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testParseFormat = () => {
    try {
        const p = path.parse('/home/user/dir/file.txt');
        assert(p.root === '/', "parse root");
        assert(p.dir === '/home/user/dir', "parse dir");
        assert(p.base === 'file.txt', "parse base");
        assert(p.ext === '.txt', "parse ext");
        assert(p.name === 'file', "parse name");

        const f = path.format({
            root: '/',
            dir: '/home/user/dir',
            base: 'file.txt',
            ext: '.txt',
            name: 'file'
        });
        assert(f === '/home/user/dir/file.txt', "format 1");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
