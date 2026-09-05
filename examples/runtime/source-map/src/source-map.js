import fs from 'node:fs';
import module, { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function writeJson(path, value) {
    fs.writeFileSync(path, JSON.stringify(value));
}

export function testSourceMapApi() {
    try {
        const errorConstructorNames = [
            'Error',
            'TypeError',
            'RangeError',
            'ReferenceError',
            'SyntaxError',
            'EvalError',
            'URIError',
            'AggregateError',
        ];
        const errorConstructorsBefore = errorConstructorNames.map(name => {
            const Constructor = globalThis[name];
            return {
                Constructor,
                prototype: Constructor.prototype,
                prototypeConstructor: Constructor.prototype.constructor,
                name: Constructor.name,
                length: Constructor.length,
            };
        });
        module.setSourceMapsSupport(true);

        const previousLine = new module.SourceMap({
            sources: ['previous.js'],
            names: [],
            mappings: 'AAAA;',
        });
        assert(previousLine.findEntry(1, 0).generatedLine === 0, 'findEntry previous line');

        const withTrailingNewline = '/source-map-line-lengths.cjs';
        const lineLengthSource = 'module.exports = 1;\n//# sourceMappingURL=line-lengths.map\n';
        fs.writeFileSync(withTrailingNewline, lineLengthSource);
        writeJson('/line-lengths.map', {
            version: 3,
            sources: ['line-lengths-source.js'],
            names: [],
            mappings: 'AAAA',
        });
        require(withTrailingNewline);
        const expectedLineLengths = lineLengthSource.split('\n').map(line => line.length).join(',');
        assert(module.findSourceMap(withTrailingNewline).lineLengths.join(',') === expectedLineLengths, 'line lengths');

        const withoutTrailingNewline = '/source-map-line-lengths-no-trailing-newline.cjs';
        const noTrailingNewlineSource = 'module.exports = 1;\n//# sourceMappingURL=line-lengths.map';
        fs.writeFileSync(withoutTrailingNewline, noTrailingNewlineSource);
        require(withoutTrailingNewline);
        const expectedNoTrailingNewlineLengths = noTrailingNewlineSource
            .split('\n')
            .map(line => line.length)
            .join(',');
        assert(
            module.findSourceMap(withoutTrailingNewline).lineLengths.join(',') ===
                expectedNoTrailingNewlineLengths,
            'line lengths retain a final directive without a trailing newline',
        );

        const errorConstructorsStable = errorConstructorNames.every((name, index) => {
            const before = errorConstructorsBefore[index];
            const Constructor = globalThis[name];
            return Constructor === before.Constructor &&
                Constructor.prototype === before.prototype &&
                Constructor.prototype.constructor === before.prototypeConstructor &&
                Constructor.name === before.name &&
                Constructor.length === before.length;
        });
        assert(errorConstructorsStable, 'enabling source maps preserves Error constructor identity and metadata');

        const rawOffsets = '/source-map-raw-offsets.cjs';
        fs.writeFileSync(rawOffsets, '\n\n\n\n\n\n\nmodule.exports = 1;\n//# sourceMappingURL=raw-offsets.map\n');
        writeJson('/raw-offsets.map', {
            version: 3,
            sources: ['raw-offset-source.js'],
            names: [],
            mappings: ';;;;;;;AAAA',
        });
        require(rawOffsets);
        const rawEntry = module.findSourceMap(rawOffsets).findEntry(7, 0);
        assert(rawEntry.generatedLine === 7, 'public findEntry uses raw generated line');
        const rawColumnEntry = module.findSourceMap(rawOffsets).findEntry(7, 7);
        assert(rawColumnEntry.generatedLine === 7, 'public findEntry uses raw generated line with column offset');
        const rawOrigin = module.findSourceMap(rawOffsets).findOrigin(8, 8);
        assert(rawOrigin.lineNumber === 1, 'public findOrigin uses raw generated position');

        const absoluteSource = module.findSourceMap(rawOffsets).findEntry(7, 0).originalSource;
        assert(absoluteSource.startsWith('file://') && absoluteSource.endsWith('/raw-offset-source.js'), 'absolute source URL');

        const blockDirective = '/source-map-block-directive.cjs';
        fs.writeFileSync(blockDirective, [
            'module.exports = 1;',
            '//# sourceMappingURL=wrong-map.json',
            '/*# sourceMappingURL=right-map.json */',
        ].join('\n'));
        writeJson('/wrong-map.json', {
            version: 3,
            sources: ['wrong.js'],
            names: [],
            mappings: 'AAAA',
        });
        writeJson('/right-map.json', {
            version: 3,
            sources: ['right.js'],
            names: [],
            mappings: 'AAAA',
        });
        require(blockDirective);
        assert(module.findSourceMap(blockDirective).findEntry(0, 0).originalSource.endsWith('/wrong.js'), 'block directives are ignored');

        const lexicalDirective = '/source-map-lexical-directive.cjs';
        fs.writeFileSync(lexicalDirective, [
            'module.exports = 1;',
            '//@ sourceMappingURL=right.map   \t',
            'const stringDecoy = "//# sourceMappingURL=wrong-map.json";',
            'const templateDecoy = `//# sourceMappingURL=wrong-map.json`;',
            'const regexDecoy = /[//# sourceMappingURL=wrong-map.json]/;',
            '//# sourceMappingURL=wrong-map.json trailing-garbage',
        ].join('\n'));
        writeJson('/right.map', {
            version: 3,
            sources: ['lexically-selected.js'],
            names: [],
            mappings: 'AAAA',
        });
        writeJson('/wrong-map.json', {
            version: 3,
            sources: ['textually-selected.js'],
            names: [],
            mappings: 'AAAA',
        });
        require(lexicalDirective);
        assert(
            module.findSourceMap(lexicalDirective).findEntry(0, 0).originalSource
                .endsWith('/lexically-selected.js'),
            'only the last valid lexical line directive wins',
        );

        const customExtension = '/source-map-custom-extension.probe';
        const customMap = '/custom-extension.map';
        fs.writeFileSync(customExtension, 'not JavaScript');
        writeJson(customMap, {
            version: 3,
            sources: ['custom-extension-source.js'],
            names: [],
            mappings: 'AAAA',
        });
        const previousProbe = require.extensions['.probe'];
        try {
            require.extensions['.probe'] = (mod, filename) => {
                mod._compile('module.exports = 1;\n//# sourceMappingURL=custom-extension.map\n', filename);
            };
            require(customExtension);
            assert(
                module.findSourceMap(customExtension).findEntry(0, 0).originalSource.endsWith('/custom-extension-source.js'),
                'custom extension _compile registers source map',
            );
        } finally {
            if (previousProbe === undefined) delete require.extensions['.probe'];
            else require.extensions['.probe'] = previousProbe;
            delete require.cache[customExtension];
        }

        return true;
    } catch (e) {
        console.log(e && e.stack ? e.stack : String(e));
        return false;
    } finally {
        module.setSourceMapsSupport(false);
    }
}
