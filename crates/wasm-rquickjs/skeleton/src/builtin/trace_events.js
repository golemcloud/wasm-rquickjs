import { inspect } from 'node:util';
import { ERR_INVALID_ARG_TYPE } from '__wasm_rquickjs_builtin/internal/errors';

const kEnabled = Symbol('enabled');
const kCategories = Symbol('categories');
const enabledTraces = new Set();

function normalizeCategories(categories) {
    if (!Array.isArray(categories)) {
        throw new ERR_INVALID_ARG_TYPE('options.categories', 'Array', categories);
    }

    if (categories.length === 0) {
        const err = new Error('At least one category is required');
        err.code = 'ERR_TRACE_EVENTS_CATEGORY_REQUIRED';
        throw err;
    }

    return categories.map((category, index) => {
        if (typeof category !== 'string') {
            throw new ERR_INVALID_ARG_TYPE(`options.categories[${index}]`, 'string', category);
        }

        return category;
    }).join(',');
}

class Tracing {
    constructor(categories) {
        this[kEnabled] = false;
        this[kCategories] = categories;
    }

    get enabled() {
        return this[kEnabled];
    }

    get categories() {
        return this[kCategories];
    }

    enable() {
        this[kEnabled] = true;
        enabledTraces.add(this);
    }

    disable() {
        this[kEnabled] = false;
        enabledTraces.delete(this);
    }

    [inspect.custom](depth, options) {
        if (depth < 0) {
            return 'Tracing {}';
        }

        return `Tracing { enabled: ${this.enabled}, categories: ${inspect(this.categories, options)} }`;
    }
}

export function createTracing(options) {
    if (options === null || typeof options !== 'object') {
        throw new ERR_INVALID_ARG_TYPE('options', 'Object', options);
    }

    return new Tracing(normalizeCategories(options.categories));
}

export function getEnabledCategories() {
    const categories = new Set();

    for (const trace of enabledTraces) {
        if (!trace.enabled || trace.categories === '') {
            continue;
        }

        for (const category of trace.categories.split(',')) {
            const trimmed = category.trim();
            if (trimmed !== '') {
                categories.add(trimmed);
            }
        }
    }

    return Array.from(categories).join(',');
}

export default {
    createTracing,
    getEnabledCategories,
};
