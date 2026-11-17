import { GLOBSTAR, Minimatch, minimatch } from '__wasm_rquickjs_builtin/internal/glob_matcher_vendor';

// WASI path matching uses case-sensitive patterns. The explicit win32 path API changes
// parsing rules, while retaining the same case policy as the POSIX API.
const options = {
    __proto__: null,
    nocase: false,
    windowsPathsNoEscape: true,
    nonegate: true,
    nocomment: true,
    optimizationLevel: 2,
    nocaseMagicOnly: true,
    platform: 'posix',
};

export { GLOBSTAR };

export function createMatcher(pattern) {
    return new Minimatch(pattern, options);
}

export function matchesGlob(path, pattern, windows) {
    return minimatch(path, pattern, { ...options, platform: windows ? 'win32' : 'posix' });
}
