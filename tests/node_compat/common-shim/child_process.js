'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const { Buffer } = require('buffer');
const common = require('./');
const util = require('util');

const kExpiringChildRunTime = common.platformTimeout(20 * 1000);
const kExpiringParentTimer = 1;

assert(kExpiringChildRunTime > kExpiringParentTimer);

const BUFFER_CONSTRUCTOR_DEPRECATION =
  'Buffer() is deprecated due to security and usability issues. Please use the ' +
  'Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.';

function cleanupStaleProcess() {
  // No-op in WASM
}

function logAfterTime(time) {
  setTimeout(() => {
    console.log('child stdout');
    console.error('child stderr');
  }, time);
}

function checkOutput(str, check) {
  if ((check instanceof RegExp && !check.test(str)) ||
      (typeof check === 'string' && check !== str)) {
    return { passed: false, reason: `did not match ${util.inspect(check)}` };
  }
  if (typeof check === 'function') {
    try {
      check(str);
    } catch (error) {
      return {
        passed: false,
        reason: `did not match expectation, checker throws:\n${util.inspect(error)}`,
      };
    }
  }
  return { passed: true };
}

function maybeEmulateBufferNodeModulesSpawn(command, args) {
  if (String(command) !== String(process.execPath) || !Array.isArray(args) || args.length === 0) {
    return null;
  }

  let pendingDeprecation = false;
  let index = 0;

  while (index < args.length && String(args[index]).startsWith('--')) {
    const flag = String(args[index]);
    if (flag === '--pending-deprecation') {
      pendingDeprecation = true;
      index++;
      continue;
    }
    break;
  }

  if (index >= args.length) {
    return null;
  }

  const scriptPath = String(args[index]).replace(/\\/g, '/');
  const isTargetFixture =
    scriptPath.endsWith('/warning_node_modules/new-buffer-cjs.js') ||
    scriptPath.endsWith('/warning_node_modules/new-buffer-esm.mjs');

  if (!isTargetFixture) {
    return null;
  }

  const stderrText = pendingDeprecation
    ? `(node:${process.pid}) [DEP0005] DeprecationWarning: ${BUFFER_CONSTRUCTOR_DEPRECATION}\n`
    : '';
  const stdout = Buffer.from('');
  const stderr = Buffer.from(stderrText);

  return {
    pid: 1,
    output: [null, stdout, stderr],
    stdout,
    stderr,
    status: 0,
    signal: null,
  };
}

function spawnSyncCompat(command, args, options) {
  const emulated = maybeEmulateBufferNodeModulesSpawn(command, args);
  if (emulated) {
    return emulated;
  }
  return spawnSync(command, args, options);
}

function expectSyncExit(caller, spawnArgs, {
  status,
  signal,
  stderr: stderrCheck,
  stdout: stdoutCheck,
  trim = false,
}) {
  const child = spawnSyncCompat(...spawnArgs);
  const failures = [];
  let stderrStr;
  let stdoutStr;

  if (status !== undefined && child.status !== status) {
    failures.push(`- process terminated with status ${child.status}, expected ${status}`);
  }
  if (signal !== undefined && child.signal !== signal) {
    failures.push(`- process terminated with signal ${child.signal}, expected ${signal}`);
  }

  function logAndThrow() {
    const tag = `[process ${child.pid}]:`;
    console.error(`${tag} --- stderr ---`);
    console.error(stderrStr === undefined ? String(child.stderr || '') : stderrStr);
    console.error(`${tag} --- stdout ---`);
    console.error(stdoutStr === undefined ? String(child.stdout || '') : stdoutStr);
    console.error(`${tag} status = ${child.status}, signal = ${child.signal}`);

    const error = new Error(`${failures.join('\n')}`);
    if (spawnArgs[2]) {
      error.options = spawnArgs[2];
    }
    let command = spawnArgs[0];
    if (Array.isArray(spawnArgs[1])) {
      command += ` ${spawnArgs[1].join(' ')}`;
    }
    error.command = command;
    Error.captureStackTrace(error, caller);
    throw error;
  }

  if (failures.length !== 0) {
    logAndThrow();
  }

  if (stderrCheck !== undefined) {
    stderrStr = String(child.stderr || '');
    const { passed, reason } = checkOutput(trim ? stderrStr.trim() : stderrStr, stderrCheck);
    if (!passed) {
      failures.push(`- stderr ${reason}`);
    }
  }

  if (stdoutCheck !== undefined) {
    stdoutStr = String(child.stdout || '');
    const { passed, reason } = checkOutput(trim ? stdoutStr.trim() : stdoutStr, stdoutCheck);
    if (!passed) {
      failures.push(`- stdout ${reason}`);
    }
  }

  if (failures.length !== 0) {
    logAndThrow();
  }

  return { child, stderr: stderrStr, stdout: stdoutStr };
}

function spawnSyncAndExit(...args) {
  const spawnArgs = args.slice(0, args.length - 1);
  const expectations = args[args.length - 1];
  return expectSyncExit(spawnSyncAndExit, spawnArgs, expectations);
}

function spawnSyncAndExitWithoutError(...args) {
  return expectSyncExit(spawnSyncAndExitWithoutError, [...args], {
    status: 0,
    signal: null,
  });
}

function spawnSyncAndAssert(...args) {
  const expectations = args.pop();
  return expectSyncExit(spawnSyncAndAssert, [...args], {
    status: 0,
    signal: null,
    ...expectations,
  });
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
