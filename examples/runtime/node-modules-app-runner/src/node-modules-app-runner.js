import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

function getRunFunction(module) {
    if (module && typeof module.run === 'function') return module.run;
    if (module && module.default && typeof module.default.run === 'function') return module.default.run;
    throw new Error('Node modules app test module must export run()');
}

export const runTest = async (testPath) => {
    const module = testPath.endsWith('.cjs')
        ? createRequire(testPath)(testPath)
        : await import(pathToFileURL(testPath).href);

    const result = await getRunFunction(module)();
    if (typeof result !== 'string' || !result.startsWith('PASS:')) {
        throw new Error(`Unexpected node modules app test result: ${result}`);
    }
    return result;
};
