import { constants as fsConstants } from "node:fs";
import {
    ERR_INVALID_ARG_TYPE,
    ERR_INVALID_ARG_VALUE,
    ERR_OUT_OF_RANGE,
} from "__wasm_rquickjs_builtin/internal/errors";

const {
    O_APPEND = 0,
    O_CREAT = 0,
    O_EXCL = 0,
    O_RDONLY = 0,
    O_RDWR = 0,
    O_SYNC = 0,
    O_TRUNC = 0,
    O_WRONLY = 0,
} = fsConstants;

export function stringToFlags(flags, name = "flags") {
    if (typeof flags === "number") {
        return flags;
    }

    if (flags == null) {
        return O_RDONLY;
    }

    switch (flags) {
        case "r": return O_RDONLY;
        case "rs":
        case "sr": return O_RDONLY | O_SYNC;
        case "r+": return O_RDWR;
        case "rs+":
        case "sr+": return O_RDWR | O_SYNC;
        case "w": return O_TRUNC | O_CREAT | O_WRONLY;
        case "wx":
        case "xw": return O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;
        case "w+": return O_TRUNC | O_CREAT | O_RDWR;
        case "wx+":
        case "xw+": return O_TRUNC | O_CREAT | O_RDWR | O_EXCL;
        case "a": return O_APPEND | O_CREAT | O_WRONLY;
        case "ax":
        case "xa": return O_APPEND | O_CREAT | O_WRONLY | O_EXCL;
        case "as":
        case "sa": return O_APPEND | O_CREAT | O_WRONLY | O_SYNC;
        case "a+": return O_APPEND | O_CREAT | O_RDWR;
        case "ax+":
        case "xa+": return O_APPEND | O_CREAT | O_RDWR | O_EXCL;
        case "as+":
        case "sa+": return O_APPEND | O_CREAT | O_RDWR | O_SYNC;
        default:
            throw new ERR_INVALID_ARG_VALUE(name, flags);
    }
}

const defaultRmOptions = {
    recursive: false,
    force: false,
    retryDelay: 100,
    maxRetries: 0,
};

const defaultRmdirOptions = {
    retryDelay: 100,
    maxRetries: 0,
    recursive: false,
};

function validateObject(value, name) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new ERR_INVALID_ARG_TYPE(name, 'object', value);
    }
}

function validateBoolean(value, name) {
    if (typeof value !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE(name, 'boolean', value);
    }
}

function validateInt32(value, name, min = -2147483648, max = 2147483647) {
    if (typeof value !== 'number') {
        throw new ERR_INVALID_ARG_TYPE(name, 'number', value);
    }
    if (!Number.isInteger(value)) {
        throw new ERR_OUT_OF_RANGE(name, 'an integer', value);
    }
    if (value < min || value > max) {
        throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
}

export function validateRmdirOptions(options, defaults = defaultRmdirOptions) {
    if (options === undefined) {
        return defaults;
    }
    validateObject(options, 'options');
    options = { ...defaults, ...options };
    validateBoolean(options.recursive, 'options.recursive');
    validateInt32(options.retryDelay, 'options.retryDelay', 0);
    validateInt32(options.maxRetries, 'options.maxRetries', 0);
    return options;
}

export function validateRmOptionsSync(path, options, expectDir) {
    const fs = require('node:fs');
    options = validateRmdirOptions(options, defaultRmOptions);
    validateBoolean(options.force, 'options.force');

    if (!options.force || expectDir || !options.recursive) {
        const isDirectory = fs
            .lstatSync(path, { throwIfNoEntry: !options.force })?.isDirectory();

        if (expectDir && !isDirectory) {
            return false;
        }

        if (isDirectory && !options.recursive) {
            const err = new Error(`EISDIR: is a directory, rm '${path}'`);
            err.code = 'EISDIR';
            err.syscall = 'rm';
            err.path = path;
            throw err;
        }
    }

    return options;
}

export function validateOffsetLengthRead(offset, length, bufferLength) {
    if (offset < 0) {
        throw new ERR_OUT_OF_RANGE('offset', '>= 0', offset);
    }
    if (length < 0) {
        throw new ERR_OUT_OF_RANGE('length', '>= 0', length);
    }
    if (offset + length > bufferLength) {
        throw new ERR_OUT_OF_RANGE('length', `<= ${bufferLength - offset}`, length);
    }
}

export function validateOffsetLengthWrite(offset, length, byteLength) {
    if (offset > byteLength) {
        throw new ERR_OUT_OF_RANGE('offset', `<= ${byteLength}`, offset);
    }
    if (length > byteLength - offset) {
        throw new ERR_OUT_OF_RANGE('length', `<= ${byteLength - offset}`, length);
    }
}

export default {
    stringToFlags,
    validateRmdirOptions,
    validateRmOptionsSync,
    validateOffsetLengthRead,
    validateOffsetLengthWrite,
};
