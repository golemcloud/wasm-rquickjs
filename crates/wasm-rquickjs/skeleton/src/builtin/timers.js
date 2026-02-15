import { setTimeout as pSetTimeout, setImmediate as pSetImmediate, setInterval as pSetInterval } from 'node:timers/promises';

export const setTimeout = globalThis.setTimeout;
export const setInterval = globalThis.setInterval;
export const setImmediate = globalThis.setImmediate;
export const clearTimeout = globalThis.clearTimeout;
export const clearInterval = globalThis.clearInterval;
export const clearImmediate = globalThis.clearImmediate;
export const promises = { setTimeout: pSetTimeout, setImmediate: pSetImmediate, setInterval: pSetInterval };
export default { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate, promises };
