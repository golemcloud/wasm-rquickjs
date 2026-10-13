(function (error) {
    function format(value, path) {
        if (value === null || typeof value !== 'object') return String(value);
        if (path.has(value)) return '<circular>';
        path.add(value);
        try {
            if (typeof value.tag === 'string') {
                return value.val === undefined
                    ? value.tag
                    : `${value.tag}: ${format(value.val, path)}`;
            }
            return JSON.stringify(value, (_key, item) =>
                typeof item === 'bigint' ? String(item) : item,
            );
        } finally {
            path.delete(value);
        }
    }

    function toString() {
        try {
            return format(this, new Set());
        } catch {
            return '<unprintable WIT error>';
        }
    }

    // A record error may have a WIT field named to-string. Keep that field intact.
    if (!Object.prototype.hasOwnProperty.call(error, 'toString')) {
        Object.defineProperty(error, 'toString', {
            value: toString, writable: true, configurable: true,
        });
    }
    Object.defineProperty(error, Symbol.toPrimitive, {
        value: toString, writable: true, configurable: true,
    });
    return error;
})
