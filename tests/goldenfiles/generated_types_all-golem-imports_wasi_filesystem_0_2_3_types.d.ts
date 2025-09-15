/**
 * WASI filesystem is a filesystem API primarily intended to let users run WASI
 * programs that access their files on their existing filesystems, without
 * significant overhead.
 * It is intended to be roughly portable between Unix-family platforms and
 * Windows, though it does not hide many of the major differences.
 * Paths are passed as interface-type `string`s, meaning they must consist of
 * a sequence of Unicode Scalar Values (USVs). Some filesystems may contain
 * paths which are not accessible by this API.
 * The directory separator in WASI is always the forward-slash (`/`).
 * All paths in WASI are relative paths, and are interpreted relative to a
 * `descriptor` referring to a base directory. If a `path` argument to any WASI
 * function starts with `/`, or if any step of resolving a `path`, including
 * `..` and symbolic link steps, reaches a directory outside of the base
 * directory, or reaches a symlink to an absolute or rooted path in the
 * underlying filesystem, the function fails with `error-code::not-permitted`.
 * For more information about WASI path resolution and sandboxing, see
 * [WASI filesystem path resolution].
 * [WASI filesystem path resolution]: https://github.com/WebAssembly/wasi-filesystem/blob/main/path-resolution.md
 */
declare module 'wasi:filesystem/types@0.2.3' {
  import * as wasiClocks023WallClock from 'wasi:clocks/wall-clock@0.2.3';
  import * as wasiIo023Streams from 'wasi:io/streams@0.2.3';
  /**
   * Attempts to extract a filesystem-related `error-code` from the stream
   * `error` provided.
   * Stream operations which return `stream-error::last-operation-failed`
   * have a payload with more information about the operation that failed.
   * This payload can be passed through to this function to see if there's
   * filesystem-related information about the error to return.
   * Note that this function is fallible because not all stream-related
   * errors are filesystem-related errors.
   */
  export function filesystemErrorCode(err: Error): ErrorCode | undefined;
  export class Descriptor {
    /**
     * Return a stream for reading from a file, if available.
     * May fail with an error-code describing why the file cannot be read.
     * Multiple read, write, and append streams may be active on the same open
     * file and they do not interfere with each other.
     * Note: This allows using `read-stream`, which is similar to `read` in POSIX.
     * @throws ErrorCode
     */
    readViaStream(offset: Filesize): InputStream;
    /**
     * Return a stream for writing to a file, if available.
     * May fail with an error-code describing why the file cannot be written.
     * Note: This allows using `write-stream`, which is similar to `write` in
     * POSIX.
     * @throws ErrorCode
     */
    writeViaStream(offset: Filesize): OutputStream;
    /**
     * Return a stream for appending to a file, if available.
     * May fail with an error-code describing why the file cannot be appended.
     * Note: This allows using `write-stream`, which is similar to `write` with
     * `O_APPEND` in POSIX.
     * @throws ErrorCode
     */
    appendViaStream(): OutputStream;
    /**
     * Provide file advisory information on a descriptor.
     * This is similar to `posix_fadvise` in POSIX.
     * @throws ErrorCode
     */
    advise(offset: Filesize, length: Filesize, advice: Advice): void;
    /**
     * Synchronize the data of a file to disk.
     * This function succeeds with no effect if the file descriptor is not
     * opened for writing.
     * Note: This is similar to `fdatasync` in POSIX.
     * @throws ErrorCode
     */
    syncData(): void;
    /**
     * Get flags associated with a descriptor.
     * Note: This returns similar flags to `fcntl(fd, F_GETFL)` in POSIX.
     * Note: This returns the value that was the `fs_flags` value returned
     * from `fdstat_get` in earlier versions of WASI.
     * @throws ErrorCode
     */
    getFlags(): DescriptorFlags;
    /**
     * Get the dynamic type of a descriptor.
     * Note: This returns the same value as the `type` field of the `fd-stat`
     * returned by `stat`, `stat-at` and similar.
     * Note: This returns similar flags to the `st_mode & S_IFMT` value provided
     * by `fstat` in POSIX.
     * Note: This returns the value that was the `fs_filetype` value returned
     * from `fdstat_get` in earlier versions of WASI.
     * @throws ErrorCode
     */
    getType(): DescriptorType;
    /**
     * Adjust the size of an open file. If this increases the file's size, the
     * extra bytes are filled with zeros.
     * Note: This was called `fd_filestat_set_size` in earlier versions of WASI.
     * @throws ErrorCode
     */
    setSize(size: Filesize): void;
    /**
     * Adjust the timestamps of an open file or directory.
     * Note: This is similar to `futimens` in POSIX.
     * Note: This was called `fd_filestat_set_times` in earlier versions of WASI.
     * @throws ErrorCode
     */
    setTimes(dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): void;
    /**
     * Read from a descriptor, without using and updating the descriptor's offset.
     * This function returns a list of bytes containing the data that was
     * read, along with a bool which, when true, indicates that the end of the
     * file was reached. The returned list will contain up to `length` bytes; it
     * may return fewer than requested, if the end of the file is reached or
     * if the I/O operation is interrupted.
     * In the future, this may change to return a `stream<u8, error-code>`.
     * Note: This is similar to `pread` in POSIX.
     * @throws ErrorCode
     */
    read(length: Filesize, offset: Filesize): [Uint8Array, boolean];
    /**
     * Write to a descriptor, without using and updating the descriptor's offset.
     * It is valid to write past the end of a file; the file is extended to the
     * extent of the write, with bytes between the previous end and the start of
     * the write set to zero.
     * In the future, this may change to take a `stream<u8, error-code>`.
     * Note: This is similar to `pwrite` in POSIX.
     * @throws ErrorCode
     */
    write(buffer: Uint8Array, offset: Filesize): Filesize;
    /**
     * Read directory entries from a directory.
     * On filesystems where directories contain entries referring to themselves
     * and their parents, often named `.` and `..` respectively, these entries
     * are omitted.
     * This always returns a new stream which starts at the beginning of the
     * directory. Multiple streams may be active on the same directory, and they
     * do not interfere with each other.
     * @throws ErrorCode
     */
    readDirectory(): DirectoryEntryStream;
    /**
     * Synchronize the data and metadata of a file to disk.
     * This function succeeds with no effect if the file descriptor is not
     * opened for writing.
     * Note: This is similar to `fsync` in POSIX.
     * @throws ErrorCode
     */
    sync(): void;
    /**
     * Create a directory.
     * Note: This is similar to `mkdirat` in POSIX.
     * @throws ErrorCode
     */
    createDirectoryAt(path: string): void;
    /**
     * Return the attributes of an open file or directory.
     * Note: This is similar to `fstat` in POSIX, except that it does not return
     * device and inode information. For testing whether two descriptors refer to
     * the same underlying filesystem object, use `is-same-object`. To obtain
     * additional data that can be used do determine whether a file has been
     * modified, use `metadata-hash`.
     * Note: This was called `fd_filestat_get` in earlier versions of WASI.
     * @throws ErrorCode
     */
    stat(): DescriptorStat;
    /**
     * Return the attributes of a file or directory.
     * Note: This is similar to `fstatat` in POSIX, except that it does not
     * return device and inode information. See the `stat` description for a
     * discussion of alternatives.
     * Note: This was called `path_filestat_get` in earlier versions of WASI.
     * @throws ErrorCode
     */
    statAt(pathFlags: PathFlags, path: string): DescriptorStat;
    /**
     * Adjust the timestamps of a file or directory.
     * Note: This is similar to `utimensat` in POSIX.
     * Note: This was called `path_filestat_set_times` in earlier versions of
     * WASI.
     * @throws ErrorCode
     */
    setTimesAt(pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): void;
    /**
     * Create a hard link.
     * Note: This is similar to `linkat` in POSIX.
     * @throws ErrorCode
     */
    linkAt(oldPathFlags: PathFlags, oldPath: string, newDescriptor: Descriptor, newPath: string): void;
    /**
     * Open a file or directory.
     * If `flags` contains `descriptor-flags::mutate-directory`, and the base
     * descriptor doesn't have `descriptor-flags::mutate-directory` set,
     * `open-at` fails with `error-code::read-only`.
     * If `flags` contains `write` or `mutate-directory`, or `open-flags`
     * contains `truncate` or `create`, and the base descriptor doesn't have
     * `descriptor-flags::mutate-directory` set, `open-at` fails with
     * `error-code::read-only`.
     * Note: This is similar to `openat` in POSIX.
     * @throws ErrorCode
     */
    openAt(pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): Descriptor;
    /**
     * Read the contents of a symbolic link.
     * If the contents contain an absolute or rooted path in the underlying
     * filesystem, this function fails with `error-code::not-permitted`.
     * Note: This is similar to `readlinkat` in POSIX.
     * @throws ErrorCode
     */
    readlinkAt(path: string): string;
    /**
     * Remove a directory.
     * Return `error-code::not-empty` if the directory is not empty.
     * Note: This is similar to `unlinkat(fd, path, AT_REMOVEDIR)` in POSIX.
     * @throws ErrorCode
     */
    removeDirectoryAt(path: string): void;
    /**
     * Rename a filesystem object.
     * Note: This is similar to `renameat` in POSIX.
     * @throws ErrorCode
     */
    renameAt(oldPath: string, newDescriptor: Descriptor, newPath: string): void;
    /**
     * Create a symbolic link (also known as a "symlink").
     * If `old-path` starts with `/`, the function fails with
     * `error-code::not-permitted`.
     * Note: This is similar to `symlinkat` in POSIX.
     * @throws ErrorCode
     */
    symlinkAt(oldPath: string, newPath: string): void;
    /**
     * Unlink a filesystem object that is not a directory.
     * Return `error-code::is-directory` if the path refers to a directory.
     * Note: This is similar to `unlinkat(fd, path, 0)` in POSIX.
     * @throws ErrorCode
     */
    unlinkFileAt(path: string): void;
    /**
     * Test whether two descriptors refer to the same filesystem object.
     * In POSIX, this corresponds to testing whether the two descriptors have the
     * same device (`st_dev`) and inode (`st_ino` or `d_ino`) numbers.
     * wasi-filesystem does not expose device and inode numbers, so this function
     * may be used instead.
     */
    isSameObject(other: Descriptor): boolean;
    /**
     * Return a hash of the metadata associated with a filesystem object referred
     * to by a descriptor.
     * This returns a hash of the last-modification timestamp and file size, and
     * may also include the inode number, device number, birth timestamp, and
     * other metadata fields that may change when the file is modified or
     * replaced. It may also include a secret value chosen by the
     * implementation and not otherwise exposed.
     * Implementations are encouraged to provide the following properties:
     *  - If the file is not modified or replaced, the computed hash value should
     *    usually not change.
     *  - If the object is modified or replaced, the computed hash value should
     *    usually change.
     *  - The inputs to the hash should not be easily computable from the
     *    computed hash.
     * However, none of these is required.
     * @throws ErrorCode
     */
    metadataHash(): MetadataHashValue;
    /**
     * Return a hash of the metadata associated with a filesystem object referred
     * to by a directory descriptor and a relative path.
     * This performs the same hash computation as `metadata-hash`.
     * @throws ErrorCode
     */
    metadataHashAt(pathFlags: PathFlags, path: string): MetadataHashValue;
  }
  export class DirectoryEntryStream {
    /**
     * Read a single directory entry from a `directory-entry-stream`.
     * @throws ErrorCode
     */
    readDirectoryEntry(): DirectoryEntry | undefined;
  }
  export type InputStream = wasiIo023Streams.InputStream;
  export type OutputStream = wasiIo023Streams.OutputStream;
  export type Error = wasiIo023Streams.Error;
  export type Datetime = wasiClocks023WallClock.Datetime;
  /**
   * File size or length of a region within a file.
   */
  export type Filesize = bigint;
  /**
   * The type of a filesystem object referenced by a descriptor.
   * Note: This was called `filetype` in earlier versions of WASI.
   */
  export type DescriptorType = "unknown" | "block-device" | "character-device" | "directory" | "fifo" | "symbolic-link" | "regular-file" | "socket";
  /**
   * Descriptor flags.
   * Note: This was called `fdflags` in earlier versions of WASI.
   */
  export type DescriptorFlags = {
    read: boolean;
    write: boolean;
    fileIntegritySync: boolean;
    dataIntegritySync: boolean;
    requestedWriteSync: boolean;
    mutateDirectory: boolean;
  };
  /**
   * Flags determining the method of how paths are resolved.
   */
  export type PathFlags = {
    symlinkFollow: boolean;
  };
  /**
   * Open flags used by `open-at`.
   */
  export type OpenFlags = {
    create: boolean;
    directory: boolean;
    exclusive: boolean;
    truncate: boolean;
  };
  /**
   * Number of hard links to an inode.
   */
  export type LinkCount = bigint;
  /**
   * File attributes.
   * Note: This was called `filestat` in earlier versions of WASI.
   */
  export type DescriptorStat = {
    type: DescriptorType;
    linkCount: LinkCount;
    size: Filesize;
    dataAccessTimestamp?: Datetime;
    dataModificationTimestamp?: Datetime;
    statusChangeTimestamp?: Datetime;
  };
  /**
   * When setting a timestamp, this gives the value to set it to.
   */
  export type NewTimestamp = {
    tag: 'no-change'
  } |
  {
    tag: 'now'
  } |
  {
    tag: 'timestamp'
    val: Datetime
  };
  /**
   * A directory entry.
   */
  export type DirectoryEntry = {
    type: DescriptorType;
    name: string;
  };
  /**
   * Error codes returned by functions, similar to `errno` in POSIX.
   * Not all of these error codes are returned by the functions provided by this
   * API; some are used in higher-level library layers, and others are provided
   * merely for alignment with POSIX.
   */
  export type ErrorCode = "access" | "would-block" | "already" | "bad-descriptor" | "busy" | "deadlock" | "quota" | "exist" | "file-too-large" | "illegal-byte-sequence" | "in-progress" | "interrupted" | "invalid" | "io" | "is-directory" | "loop" | "too-many-links" | "message-size" | "name-too-long" | "no-device" | "no-entry" | "no-lock" | "insufficient-memory" | "insufficient-space" | "not-directory" | "not-empty" | "not-recoverable" | "unsupported" | "no-tty" | "no-such-device" | "overflow" | "not-permitted" | "pipe" | "read-only" | "invalid-seek" | "text-file-busy" | "cross-device";
  /**
   * File or memory access pattern advisory information.
   */
  export type Advice = "normal" | "sequential" | "random" | "will-need" | "dont-need" | "no-reuse";
  /**
   * A 128-bit hash value, split into parts because wasm doesn't have a
   * 128-bit integer type.
   */
  export type MetadataHashValue = {
    lower: bigint;
    upper: bigint;
  };
  export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
}
