import fs from 'node:fs';
import module from 'node:module';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function writeJson(path, value) {
    fs.writeFileSync(path, JSON.stringify(value));
}

export function testSourceMapApi() {
    const originalExecArgv = process.execArgv.slice();
    try {
        process.execArgv = originalExecArgv.concat('--enable-source-maps');

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
        assert(module.findSourceMap(blockDirective).findEntry(0, 0).originalSource.endsWith('/right.js'), 'last block directive wins');

        return true;
    } catch (e) {
        console.log(e && e.stack ? e.stack : String(e));
        return false;
    } finally {
        process.execArgv = originalExecArgv;
    }
}
