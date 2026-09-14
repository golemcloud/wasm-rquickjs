function emptyIoPhase() {
    return {
        fileExists: { calls: 0, hits: 0, misses: 0 },
        directoryExists: { calls: 0, hits: 0, misses: 0 },
        readFile: { calls: 0, hits: 0, misses: 0, bytes: 0 },
        readDirectory: { calls: 0, entries: 0 },
        realpath: { calls: 0 },
        getSourceFile: { calls: 0, hits: 0, misses: 0, bytes: 0 },
    };
}

function classifySourceFile(path, declaration) {
    const normalized = path.replaceAll('\\', '/');
    if (normalized.includes('/node_modules/typescript/lib/lib.') && declaration) {
        return 'typescriptLibDeclarations';
    }
    if (normalized.includes('/node_modules/') && declaration) {
        return 'dependencyDeclarations';
    }
    if (normalized.includes('/projects/') && declaration) {
        return 'projectDeclarations';
    }
    if (normalized.includes('/projects/')) {
        return 'projectSources';
    }
    if (/\.[cm]?jsx?$/.test(normalized)) {
        return 'javascriptSources';
    }
    return 'other';
}

export async function profileTypeScript({ typescriptPath, projectPath }) {
    const totalStarted = performance.now();
    const memoryBeforeImport = process.memoryUsage();
    const importStarted = performance.now();
    const imported = await import(typescriptPath);
    const ts = imported.default || imported;
    const importMs = performance.now() - importStarted;
    const memoryAfterImport = process.memoryUsage();

    const io = {
        configRead: emptyIoPhase(),
        configParse: emptyIoPhase(),
        programCreate: emptyIoPhase(),
        diagnostics: emptyIoPhase(),
    };
    let phase = 'configRead';

    function wrapIo(target, name) {
        const original = target[name];
        if (typeof original !== 'function') return original;
        return (...args) => {
            const counters = io[phase][name];
            counters.calls++;
            const value = original.apply(target, args);
            if (name === 'fileExists' || name === 'directoryExists') {
                counters[value ? 'hits' : 'misses']++;
            } else if (name === 'readFile') {
                counters[value === undefined ? 'misses' : 'hits']++;
                if (value !== undefined) counters.bytes += new TextEncoder().encode(value).byteLength;
            } else if (name === 'readDirectory') {
                counters.entries += value.length;
            } else if (name === 'getSourceFile') {
                counters[value === undefined ? 'misses' : 'hits']++;
                if (value !== undefined) counters.bytes += new TextEncoder().encode(value.text).byteLength;
            }
            return value;
        };
    }

    function instrument(target) {
        const instrumented = Object.create(target);
        for (const name of [
            'fileExists',
            'directoryExists',
            'readFile',
            'readDirectory',
            'realpath',
            'getSourceFile',
        ]) {
            if (typeof target[name] === 'function') instrumented[name] = wrapIo(target, name);
        }
        return instrumented;
    }

    const sys = instrument(ts.sys);
    const configReadStarted = performance.now();
    const config = ts.readConfigFile(projectPath, sys.readFile);
    const configReadMs = performance.now() - configReadStarted;
    if (config.error) {
        return {
            exitCode: 2,
            phasesMs: { import: importMs, configRead: configReadMs },
            diagnostics: 1,
            io,
        };
    }

    phase = 'configParse';
    const configParseStarted = performance.now();
    const parsed = ts.parseJsonConfigFileContent(
        config.config,
        sys,
        projectPath.slice(0, projectPath.lastIndexOf('/')),
    );
    const configParseMs = performance.now() - configParseStarted;

    phase = 'programCreate';
    const host = instrument(ts.createCompilerHost(parsed.options));
    const programCreateStarted = performance.now();
    const program = ts.createProgram({
        rootNames: parsed.fileNames,
        options: parsed.options,
        projectReferences: parsed.projectReferences,
        host,
    });
    const programCreateMs = performance.now() - programCreateStarted;

    const sourceFiles = {};
    for (const sourceFile of program.getSourceFiles()) {
        const kind = classifySourceFile(sourceFile.fileName, sourceFile.isDeclarationFile);
        sourceFiles[kind] = (sourceFiles[kind] || 0) + 1;
    }

    phase = 'diagnostics';
    const diagnosticsStarted = performance.now();
    const syntacticStarted = performance.now();
    const syntactic = program.getSyntacticDiagnostics();
    const syntacticMs = performance.now() - syntacticStarted;
    const optionsGlobalStarted = performance.now();
    const optionsAndGlobal = [
        ...program.getOptionsDiagnostics(),
        ...program.getGlobalDiagnostics(),
    ];
    const optionsAndGlobalMs = performance.now() - optionsGlobalStarted;
    const semanticStarted = performance.now();
    const semantic = program.getSemanticDiagnostics();
    const semanticMs = performance.now() - semanticStarted;
    const diagnostics = [...parsed.errors, ...syntactic, ...optionsAndGlobal, ...semantic];
    const diagnosticsMs = performance.now() - diagnosticsStarted;
    const totalMs = performance.now() - totalStarted;

    return {
        exitCode: diagnostics.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ? 2 : 0,
        phasesMs: {
            import: importMs,
            configRead: configReadMs,
            configParse: configParseMs,
            programCreate: programCreateMs,
            diagnostics: diagnosticsMs,
            syntacticDiagnostics: syntacticMs,
            optionsAndGlobalDiagnostics: optionsAndGlobalMs,
            semanticDiagnostics: semanticMs,
            measuredTotal: totalMs,
            unclassified: Math.max(
                0,
                totalMs - importMs - configReadMs - configParseMs - programCreateMs - diagnosticsMs,
            ),
        },
        diagnostics: {
            config: parsed.errors.length,
            syntactic: syntactic.length,
            optionsAndGlobal: optionsAndGlobal.length,
            semantic: semantic.length,
            total: diagnostics.length,
        },
        io,
        graph: {
            rootFiles: parsed.fileNames.length,
            sourceFiles,
            totalSourceFiles: program.getSourceFiles().length,
        },
        quickJsMemory: {
            beforeToolLoad: memoryBeforeImport,
            afterToolLoad: memoryAfterImport,
            afterCompiler: process.memoryUsage(),
        },
    };
}
