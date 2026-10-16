const result = {
    requireMainIsUndefined: require.main === undefined,
    processMainIsUndefined: process.mainModule === undefined,
};

globalThis[Symbol.for('wasm-rquickjs:inline-non-cjs-main-dependency')] = result;
module.exports = result;
