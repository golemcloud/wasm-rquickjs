(function (error) {
    function toString() {
        try {
            return JSON.stringify(this, (_key, item) =>
                typeof item === 'bigint' ? String(item) : item,
            );
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
