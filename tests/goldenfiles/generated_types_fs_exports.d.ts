declare module 'fs' {
  export function runAsync(): Promise<void>;
  export function run(): Promise<void>;
  export function testFsPromisesWriteFile(): Promise<void>;
  export function testFsPromisesRename(): Promise<void>;
  export function testFsPromisesMkdir(): Promise<void>;
  export function testFsPromisesMkdirRecursive(): Promise<void>;
  export function testFsPromisesUnlink(): Promise<void>;
  export function testRenameSync(): Promise<void>;
  export function testRenameCallback(): Promise<void>;
  export function testMkdirSync(): Promise<void>;
  export function testMkdirSyncRecursive(): Promise<void>;
  export function testMkdirCallback(): Promise<void>;
  export function testMkdirCallbackRecursive(): Promise<void>;
  export function testUnlinkSync(): Promise<void>;
  export function testUnlinkCallback(): Promise<void>;
}
