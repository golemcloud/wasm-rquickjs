'use strict';

// Stub for common/child_process helper.
// child_process is not available in WASM, but providing the module
// prevents "Cannot find module" errors during require().
// Tests that actually use these functions will fail with descriptive errors.

const common = require('./');

const kExpiringChildRunTime = common.platformTimeout(20 * 1000);
const kExpiringParentTimer = 1;

function cleanupStaleProcess() {
  // No-op in WASM
}

function logAfterTime(time) {
  setTimeout(() => {
    console.log('child stdout');
    console.error('child stderr');
  }, time);
}

function spawnSyncAndExit() {
  throw new Error('child_process.spawnSync is not available in WASM');
}

function spawnSyncAndExitWithoutError() {
  throw new Error('child_process.spawnSync is not available in WASM');
}

function spawnSyncAndAssert() {
  throw new Error('child_process.spawnSync is not available in WASM');
}

module.exports = {
  cleanupStaleProcess,
  logAfterTime,
  kExpiringChildRunTime,
  kExpiringParentTimer,
  spawnSyncAndAssert,
  spawnSyncAndExit,
  spawnSyncAndExitWithoutError,
};
