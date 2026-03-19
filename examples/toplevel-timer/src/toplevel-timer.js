// Top-level setTimeout during module initialization — this previously caused
// a re-entrant block_on panic because get_js_state() was called before STATE
// was published.
let initTimerFired = false;

setTimeout(() => {
    initTimerFired = true;
}, 0);

setInterval(() => {}, 1000).unref();

export function run() {
    return `PASS: initTimerFired=${initTimerFired}`;
}
