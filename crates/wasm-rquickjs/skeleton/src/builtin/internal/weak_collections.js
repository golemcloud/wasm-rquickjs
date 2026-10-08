// Capture the engine's weak-collection operations before user code can patch
// the public prototypes. Runtime-private caches use these primordials directly,
// while public collection inspection layers bookkeeping around them.
const call = Function.prototype.call;

export const nativeWeakMapDelete = call.bind(WeakMap.prototype.delete);
export const nativeWeakMapGet = call.bind(WeakMap.prototype.get);
export const nativeWeakMapHas = call.bind(WeakMap.prototype.has);
export const nativeWeakMapSet = call.bind(WeakMap.prototype.set);
export const nativeWeakSetAdd = call.bind(WeakSet.prototype.add);
export const nativeWeakSetDelete = call.bind(WeakSet.prototype.delete);
export const nativeWeakSetHas = call.bind(WeakSet.prototype.has);

export const NativeWeakRef = WeakRef;
export const nativeWeakRefDeref = call.bind(WeakRef.prototype.deref);
