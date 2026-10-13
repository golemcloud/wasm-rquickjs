function fail(kind) {
    if (kind === 'success') return 'ok';
    if (kind === 'backend-error') throw { tag: kind, val: 'service unavailable' };
    if (kind === 'nested') throw { tag: kind, val: { tag: 'permission-denied' } };
    throw { tag: 'permission-denied' };
}

export const api = {
    fail,
    failEnum() { throw 'permission-denied'; },
    failString() { throw 'host unavailable'; },
    failRecord() { throw { tag: '', toString: 'declared field', count: 9007199254740993n }; },
    Gate: class {
        static failStatic(kind) { return fail(kind); }
    },
};
