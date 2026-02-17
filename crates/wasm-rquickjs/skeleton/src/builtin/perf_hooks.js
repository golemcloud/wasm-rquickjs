// node:perf_hooks - partial implementation

const _timeOrigin = Date.now();
const _marks = [];
const _measures = [];

class PerformanceEntry {
    constructor(name, entryType, startTime, duration) {
        this.name = name;
        this.entryType = entryType;
        this.startTime = startTime;
        this.duration = duration;
    }

    toJSON() {
        return {
            name: this.name,
            entryType: this.entryType,
            startTime: this.startTime,
            duration: this.duration,
        };
    }
}

const nodeTiming = Object.freeze({
    name: 'node',
    entryType: 'node',
    startTime: 0,
    duration: 0,
    nodeStart: 0,
    v8Start: 0,
    bootstrapComplete: 0,
    environment: 0,
    loopStart: 0,
    loopExit: 0,
    idleTime: 0,
});

const performance = {
    timeOrigin: _timeOrigin,

    now() {
        return Date.now() - _timeOrigin;
    },

    mark(name, options) {
        const startTime = (options && options.startTime !== undefined) ? options.startTime : performance.now();
        const entry = new PerformanceEntry(name, 'mark', startTime, 0);
        _marks.push(entry);
        return entry;
    },

    measure(name, startMarkOrOptions, endMark) {
        let startTime = 0;
        let endTime = performance.now();

        if (typeof startMarkOrOptions === 'string') {
            const startEntry = _marks.find(e => e.name === startMarkOrOptions);
            if (!startEntry) {
                throw new Error(`The "${startMarkOrOptions}" performance mark has not been set`);
            }
            startTime = startEntry.startTime;
            if (typeof endMark === 'string') {
                const endEntry = _marks.find(e => e.name === endMark);
                if (!endEntry) {
                    throw new Error(`The "${endMark}" performance mark has not been set`);
                }
                endTime = endEntry.startTime;
            }
        } else if (startMarkOrOptions && typeof startMarkOrOptions === 'object') {
            if (startMarkOrOptions.start !== undefined) {
                if (typeof startMarkOrOptions.start === 'string') {
                    const se = _marks.find(e => e.name === startMarkOrOptions.start);
                    if (!se) {
                        throw new Error(`The "${startMarkOrOptions.start}" performance mark has not been set`);
                    }
                    startTime = se.startTime;
                } else {
                    startTime = startMarkOrOptions.start;
                }
            }
            if (startMarkOrOptions.end !== undefined) {
                if (typeof startMarkOrOptions.end === 'string') {
                    const ee = _marks.find(e => e.name === startMarkOrOptions.end);
                    if (!ee) {
                        throw new Error(`The "${startMarkOrOptions.end}" performance mark has not been set`);
                    }
                    endTime = ee.startTime;
                } else {
                    endTime = startMarkOrOptions.end;
                }
            }
            if (startMarkOrOptions.duration !== undefined) {
                endTime = startTime + startMarkOrOptions.duration;
            }
        }

        const duration = endTime - startTime;
        const entry = new PerformanceEntry(name, 'measure', startTime, duration);
        _measures.push(entry);
        return entry;
    },

    clearMarks(name) {
        if (name === undefined) {
            _marks.length = 0;
        } else {
            for (let i = _marks.length - 1; i >= 0; i--) {
                if (_marks[i].name === name) _marks.splice(i, 1);
            }
        }
    },

    clearMeasures(name) {
        if (name === undefined) {
            _measures.length = 0;
        } else {
            for (let i = _measures.length - 1; i >= 0; i--) {
                if (_measures[i].name === name) _measures.splice(i, 1);
            }
        }
    },

    getEntries() {
        return [..._marks, ..._measures];
    },

    getEntriesByName(name, type) {
        return performance.getEntries().filter(e => {
            if (e.name !== name) return false;
            if (type !== undefined && e.entryType !== type) return false;
            return true;
        });
    },

    getEntriesByType(type) {
        return performance.getEntries().filter(e => e.entryType === type);
    },

    nodeTiming,

    toJSON() {
        return { timeOrigin: _timeOrigin };
    },
};

class PerformanceObserver {
    constructor(callback) {
        this._callback = callback;
    }

    observe(options) {
        // no-op
    }

    disconnect() {
        // no-op
    }

    takeRecords() {
        return [];
    }

    static get supportedEntryTypes() {
        return ['mark', 'measure'];
    }
}

function monitorEventLoopDelay(options) {
    throw new Error('monitorEventLoopDelay is not supported in WebAssembly environment');
}

function createHistogram(options) {
    throw new Error('createHistogram is not supported in WebAssembly environment');
}

const constants = {};

export {
    performance,
    PerformanceEntry,
    PerformanceObserver,
    monitorEventLoopDelay,
    createHistogram,
    constants,
};

export default {
    performance,
    PerformanceEntry,
    PerformanceObserver,
    monitorEventLoopDelay,
    createHistogram,
    constants,
};
