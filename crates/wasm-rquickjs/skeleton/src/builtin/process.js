import {
    get_args,
    get_env,
    next_tick
} from '__wasm_rquickjs_builtin/process_native';


export let argv = get_args();
export let argv0 = argv[0];

export function cwd() {
    return "/";
}

export function nextTick(callback, ...args) {
    next_tick(callback, args);
}

export default {
    argv,
    argv0,
    get env() {
        return get_env();
    },
    cwd,
    nextTick
};
