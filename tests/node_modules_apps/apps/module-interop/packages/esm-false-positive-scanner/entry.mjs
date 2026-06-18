const obj = {
  require() {
    return { ok: true };
  },
};

const req = createRequire;

function createRequire() {
  return () => ({ ok: true });
}

const localRequire = createRequire();

export const propertyRequireResult = obj.require('./entry.mjs');
export const nonCallCreateRequireAlias = typeof req === 'function' ? { ok: true } : { ok: false };
export const localCreateRequireResult = localRequire('./entry.mjs');
export default { propertyRequireResult, nonCallCreateRequireAlias, localCreateRequireResult };
