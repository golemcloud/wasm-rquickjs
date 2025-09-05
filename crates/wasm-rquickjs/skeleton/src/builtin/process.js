import {
    get_args,
    get_env,
} from '__wasm_rquickjs_builtin/process_native';


export let argv = get_args();
export let argv0 = argv[0];
export let env = get_env();

export function cwd() {
    return "/";
}
