import { constants as fsConstants } from "node:fs";
import { ERR_INVALID_ARG_VALUE } from "__wasm_rquickjs_builtin/internal/errors";

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

export default {
    stringToFlags,
};
