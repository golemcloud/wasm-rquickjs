declare module 'wasi:filesystem/preopens@0.2.3' {
  import * as wasiFilesystem023Types from 'wasi:filesystem/types@0.2.3';
  /**
   * Return the set of preopened directories, and their paths.
   */
  export function getDirectories(): [Descriptor, string][];
  export type Descriptor = wasiFilesystem023Types.Descriptor;
}
