// Runtime-local policy shared by the actual owners of cloneable host values.
// Keep this leaf module independent of public builtins and their bootstrap graph.
import { createPrivateWeakMap, createPrivateWeakSet } from '__wasm_rquickjs_builtin/internal/weak_collections';

const uncloneable = createPrivateWeakSet();
const untransferable = createPrivateWeakSet();
const transferableSignals = createPrivateWeakSet();
const adapters = createPrivateWeakMap();

const isObject = value => value !== null && (typeof value === 'object' || typeof value === 'function');

export function markAsUncloneable(value) {
    if (isObject(value)) uncloneable.add(value);
}

export function markAsUntransferable(value) {
    if (isObject(value)) untransferable.add(value);
}

export function isMarkedAsUncloneable(value) {
    return uncloneable.has(value);
}

export function isMarkedAsUntransferable(value) {
    return untransferable.has(value);
}

export function registerCloneAdapter(value, adapter) {
    adapters.set(value, adapter);
}

export function getCloneAdapter(value) {
    return adapters.get(value);
}

export function markTransferableSignal(value) {
    if (!isAbortSignal(value)) return false;
    transferableSignals.add(value);
    return true;
}

export function isAbortSignal(value) {
    return getCloneAdapter(value)?.kind === 'AbortSignal';
}

export function isTransferableSignal(value) {
    return transferableSignals.has(value);
}
