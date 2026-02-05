import * as path from 'node:path';
import * as fs from 'node:fs';
import * as util from 'node:util';
import * as buffer from 'node:buffer';
import * as os from 'node:os';
import * as events from 'node:events';
import * as stream from 'node:stream';
import * as crypto from 'node:crypto';
import * as child_process from 'node:child_process';
import * as string_decoder from 'node:string_decoder';
import * as process from 'node:process';

const builtinModules = {
    'path': path,
    'node:path': path,
    'fs': fs,
    'node:fs': fs,
    'util': util,
    'node:util': util,
    'buffer': buffer,
    'node:buffer': buffer,
    'os': os,
    'node:os': os,
    'events': events,
    'node:events': events,
    'stream': stream,
    'node:stream': stream,
    'crypto': crypto,
    'node:crypto': crypto,
    'child_process': child_process,
    'node:child_process': child_process,
    'string_decoder': string_decoder,
    'node:string_decoder': string_decoder,
    'process': process,
    'node:process': process,
};

export function require(id) {
    const mod = builtinModules[id];
    if (mod !== undefined) {
        return mod;
    }
    throw new Error(`Dynamic require of "${id}" is not supported`);
}

export function createRequire(filename) {
    return require;
}

export const builtinModuleList = Object.keys(builtinModules);

export default {
    require,
    createRequire,
    builtinModules: builtinModuleList,
};
