'use strict';

// Simplified GC helper shim for WASM environment.
// global.gc() is not available in QuickJS/WASM, so these are best-effort stubs.

async function onGC(obj, gcListener) {
  // No-op: GC tracking via async_hooks is not available in WASM
}

async function gcUntil(name, condition, maxCount = 10) {
  for (let count = 0; count < maxCount; ++count) {
    if (typeof global.gc === 'function') {
      global.gc();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (condition()) {
      return;
    }
  }
  throw new Error(`Test ${name} failed`);
}

async function checkIfCollectable(fn, maxCount = 4096) {
  // Best-effort: just create a few objects and hope GC collects them
  for (let i = 0; i < Math.min(maxCount, 10); i++) {
    await fn();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function runAndBreathe(fn, repeat, waitTime = 20) {
  for (let i = 0; i < repeat; i++) {
    await fn();
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}

async function checkIfCollectableByCounting(fn, ctor, count, waitTime = 20) {
  // Stub: v8.queryObjects not available in WASM
  throw new Error('checkIfCollectableByCounting requires V8 internals');
}

module.exports = {
  checkIfCollectable,
  runAndBreathe,
  checkIfCollectableByCounting,
  onGC,
  gcUntil,
};
