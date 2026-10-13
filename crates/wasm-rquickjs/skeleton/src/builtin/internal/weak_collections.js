// Capture the engine's weak-collection operations before user code can patch
// the public prototypes. Runtime-private caches use these primordials directly,
// while public collection inspection layers bookkeeping around them.
const call = Function.prototype.call;
const defineProperties = Object.defineProperties;
const NativeWeakMap = WeakMap;
const NativeWeakSet = WeakSet;

export const nativeWeakMapDelete = call.bind(WeakMap.prototype.delete);
export const nativeWeakMapGet = call.bind(WeakMap.prototype.get);
export const nativeWeakMapHas = call.bind(WeakMap.prototype.has);
export const nativeWeakMapSet = call.bind(WeakMap.prototype.set);
export const nativeWeakSetAdd = call.bind(WeakSet.prototype.add);
export const nativeWeakSetDelete = call.bind(WeakSet.prototype.delete);
export const nativeWeakSetHas = call.bind(WeakSet.prototype.has);

export const NativeWeakRef = WeakRef;
export const nativeWeakRefDeref = call.bind(WeakRef.prototype.deref);

const privateWeakMapMethods = {
    __proto__: null,
    delete: { __proto__: null, value: function del(key) { return nativeWeakMapDelete(this, key); } },
    get: { __proto__: null, value: function get(key) { return nativeWeakMapGet(this, key); } },
    has: { __proto__: null, value: function has(key) { return nativeWeakMapHas(this, key); } },
    set: { __proto__: null, value: function set(key, value) { return nativeWeakMapSet(this, key, value); } },
};

const privateWeakSetMethods = {
    __proto__: null,
    add: { __proto__: null, value: function add(value) { return nativeWeakSetAdd(this, value); } },
    delete: { __proto__: null, value: function del(value) { return nativeWeakSetDelete(this, value); } },
    has: { __proto__: null, value: function has(value) { return nativeWeakSetHas(this, value); } },
};

// Own methods keep runtime-private collections on the captured native path even
// after the public prototypes gain inspection bookkeeping or are changed by
// user code. The properties are non-enumerable, non-writable, and
// non-configurable by default.
export function createPrivateWeakMap() {
    return defineProperties(new NativeWeakMap(), privateWeakMapMethods);
}

export function createPrivateWeakSet() {
    return defineProperties(new NativeWeakSet(), privateWeakSetMethods);
}
