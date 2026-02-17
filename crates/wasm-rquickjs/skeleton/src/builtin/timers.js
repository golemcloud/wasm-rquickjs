import { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } from '__wasm_rquickjs_builtin/timeout';
import { setTimeout as pSetTimeout, setImmediate as pSetImmediate, setInterval as pSetInterval } from 'node:timers/promises';

export { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate };
export const promises = { setTimeout: pSetTimeout, setImmediate: pSetImmediate, setInterval: pSetInterval };
export const active = function active() {};
export const unenroll = function unenroll() {};
export const enroll = function enroll() {};
export default { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate, promises, active, unenroll, enroll };
