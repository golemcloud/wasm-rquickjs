async function capture(emit) {
    const written = [];
    const events = [];
    const originalWrite = process.stderr.write;
    const onWarning = (warning) => events.push(warning.message);
    process.stderr.write = (chunk) => {
        written.push(String(chunk));
        return true;
    };
    process.on('warning', onWarning);
    try {
        emit();
        await new Promise((resolve) => setImmediate(resolve));
    } finally {
        process.stderr.write = originalWrite;
        process.removeListener('warning', onWarning);
    }
    return { stderr: written.join(''), events };
}

export async function test() {
    const first = await capture(() => process.emitWarning('first'));
    const detailed = await capture(() =>
        process.emitWarning('detailed', { code: 'CODE001', detail: 'more detail' }));

    process.traceProcessWarnings = true;
    const traced = await capture(() => process.emitWarning('traced', 'CustomWarning'));
    process.traceProcessWarnings = false;

    return JSON.stringify({
        argv0: process.argv0,
        first,
        detailed,
        traced,
    });
}
