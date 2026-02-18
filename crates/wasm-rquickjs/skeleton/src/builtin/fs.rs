#[cfg(unix)]
use std::os::unix::fs::MetadataExt;

use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::time::UNIX_EPOCH;

struct FdTable {
    files: HashMap<i32, std::fs::File>,
    next_fd: i32,
}

impl FdTable {
    fn new() -> Self {
        Self {
            files: HashMap::new(),
            next_fd: 10,
        }
    }

    fn insert(&mut self, file: std::fs::File) -> i32 {
        let fd = self.next_fd;
        self.next_fd += 1;
        self.files.insert(fd, file);
        fd
    }

    fn get_mut(&mut self, fd: i32) -> Option<&mut std::fs::File> {
        self.files.get_mut(&fd)
    }

    fn remove(&mut self, fd: i32) -> Option<std::fs::File> {
        self.files.remove(&fd)
    }
}

static FD_TABLE: LazyLock<Mutex<FdTable>> = LazyLock::new(|| Mutex::new(FdTable::new()));

fn map_error_code(err: &std::io::Error) -> (&'static str, i32, &'static str) {
    match err.kind() {
        std::io::ErrorKind::NotFound => ("ENOENT", -2, "no such file or directory"),
        std::io::ErrorKind::AlreadyExists => ("EEXIST", -17, "file already exists"),
        std::io::ErrorKind::PermissionDenied => ("EACCES", -13, "permission denied"),
        std::io::ErrorKind::InvalidInput => ("EINVAL", -22, "invalid argument"),
        _ => {
            if let Some(raw) = err.raw_os_error() {
                match raw {
                    21 => ("EISDIR", -21, "illegal operation on a directory"),
                    20 => ("ENOTDIR", -20, "not a directory"),
                    39 => ("ENOTEMPTY", -39, "directory not empty"),
                    9 => ("EBADF", -9, "bad file descriptor"),
                    38 => ("ENOSYS", -38, "function not implemented"),
                    _ => ("EIO", -5, "input/output error"),
                }
            } else {
                ("EIO", -5, "input/output error")
            }
        }
    }
}

fn make_fs_error<'js>(
    ctx: &rquickjs::Ctx<'js>,
    err: &std::io::Error,
    syscall: &str,
    path: Option<&str>,
) -> rquickjs::Object<'js> {
    let obj = rquickjs::Object::new(ctx.clone()).unwrap();
    let (code, errno, description) = map_error_code(err);
    obj.set("errno", errno).unwrap();
    obj.set("code", code).unwrap();
    obj.set("syscall", syscall).unwrap();
    let msg = if let Some(p) = path {
        format!("{code}: {description}, {syscall} '{p}'")
    } else {
        format!("{code}: {description}, {syscall}")
    };
    obj.set("message", msg.clone()).unwrap();
    if let Some(p) = path {
        obj.set("path", p).unwrap();
    }
    obj
}

fn make_badf_error<'js>(ctx: &rquickjs::Ctx<'js>, syscall: &str) -> rquickjs::Object<'js> {
    let obj = rquickjs::Object::new(ctx.clone()).unwrap();
    obj.set("errno", -9).unwrap();
    obj.set("code", "EBADF").unwrap();
    obj.set("syscall", syscall).unwrap();
    let msg = format!("EBADF: bad file descriptor, {syscall}");
    obj.set("message", msg).unwrap();
    obj
}

fn stdio_stat_obj<'js>(ctx: &rquickjs::Ctx<'js>) -> rquickjs::Object<'js> {
    let obj = rquickjs::Object::new(ctx.clone()).unwrap();
    obj.set("dev", 0_f64).unwrap();
    obj.set("ino", 0_f64).unwrap();
    obj.set("mode", 8592_f64).unwrap(); // 0o20620 = S_IFCHR | 0620
    obj.set("nlink", 1_f64).unwrap();
    obj.set("uid", 0_f64).unwrap();
    obj.set("gid", 0_f64).unwrap();
    obj.set("rdev", 0_f64).unwrap();
    obj.set("blksize", 0_f64).unwrap();
    obj.set("blocks", 0_f64).unwrap();
    obj.set("size", 0_f64).unwrap();
    obj.set("atimeMs", 0_f64).unwrap();
    obj.set("mtimeMs", 0_f64).unwrap();
    obj.set("ctimeMs", 0_f64).unwrap();
    obj.set("birthtimeMs", 0_f64).unwrap();
    obj.set("isFile", false).unwrap();
    obj.set("isDirectory", false).unwrap();
    obj.set("isSymlink", false).unwrap();
    obj
}

fn metadata_to_obj<'js>(
    ctx: &rquickjs::Ctx<'js>,
    meta: &std::fs::Metadata,
) -> rquickjs::Object<'js> {
    let obj = rquickjs::Object::new(ctx.clone()).unwrap();

    #[cfg(unix)]
    {
        obj.set("dev", meta.dev() as f64).unwrap();
        obj.set("ino", meta.ino() as f64).unwrap();
        obj.set("mode", meta.mode() as f64).unwrap();
        obj.set("nlink", meta.nlink() as f64).unwrap();
        obj.set("uid", meta.uid() as f64).unwrap();
        obj.set("gid", meta.gid() as f64).unwrap();
        obj.set("rdev", meta.rdev() as f64).unwrap();
        obj.set("blksize", meta.blksize() as f64).unwrap();
        obj.set("blocks", meta.blocks() as f64).unwrap();
    }
    #[cfg(not(unix))]
    {
        obj.set("dev", 0_f64).unwrap();
        obj.set("ino", 0_f64).unwrap();
        let mode: f64 = if meta.is_dir() {
            16877.0 // 0o40755
        } else {
            33188.0 // 0o100644
        };
        obj.set("mode", mode).unwrap();
        obj.set("nlink", 1_f64).unwrap();
        obj.set("uid", 0_f64).unwrap();
        obj.set("gid", 0_f64).unwrap();
        obj.set("rdev", 0_f64).unwrap();
        obj.set("blksize", 4096_f64).unwrap();
        obj.set("blocks", ((meta.len() + 511) / 512) as f64)
            .unwrap();
    }

    obj.set("size", meta.len() as f64).unwrap();

    let atime_ms = meta
        .accessed()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs_f64() * 1000.0)
        .unwrap_or(0.0);
    let mtime_ms = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs_f64() * 1000.0)
        .unwrap_or(0.0);
    let ctime_ms = mtime_ms; // ctime not directly available, use mtime
    let birthtime_ms = meta
        .created()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs_f64() * 1000.0)
        .unwrap_or(0.0);

    obj.set("atimeMs", atime_ms).unwrap();
    obj.set("mtimeMs", mtime_ms).unwrap();
    obj.set("ctimeMs", ctime_ms).unwrap();
    obj.set("birthtimeMs", birthtime_ms).unwrap();

    obj.set("isFile", meta.is_file()).unwrap();
    obj.set("isDirectory", meta.is_dir()).unwrap();
    obj.set("isSymlink", meta.is_symlink()).unwrap();

    obj
}

#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    use encoding_rs::Encoding;
    use rquickjs::prelude::List;
    use rquickjs::{Array, Ctx, Object, TypedArray, Value};
    use std::path::Path;

    // --- Existing functions (unchanged) ---

    #[rquickjs::function]
    pub fn read_file_with_encoding(
        path: String,
        encoding: String,
    ) -> List<(Option<String>, Option<String>)> {
        let path = Path::new(&path);
        match std::fs::read(path) {
            Ok(bytes) => match Encoding::for_label(encoding.as_bytes()) {
                Some(encoding) => {
                    let (decoded, _) = encoding.decode_with_bom_removal(&bytes);
                    let decoded_string = decoded.into_owned();
                    List((Some(decoded_string), None))
                }
                None => List((None, Some(format!("Unsupported encoding: {encoding}")))),
            },
            Err(err) => {
                let error_message = format!("Failed to read file {path:?}: {err}");
                List((None, Some(error_message)))
            }
        }
    }

    #[rquickjs::function]
    pub fn read_file(
        path: String,
        ctx: Ctx<'_>,
    ) -> List<(Option<TypedArray<'_, u8>>, Option<String>)> {
        let path = Path::new(&path);
        match std::fs::read(path) {
            Ok(bytes) => {
                let typed_array =
                    TypedArray::new_copy(ctx.clone(), &bytes).expect("Failed to create TypedArray");
                List((Some(typed_array), None))
            }
            Err(err) => {
                let error_message = format!("Failed to read file {path:?}: {err}");
                List((None, Some(error_message)))
            }
        }
    }

    #[rquickjs::function]
    pub fn write_file_with_encoding(
        path: String,
        encoding: String,
        content: String,
    ) -> Option<String> {
        if encoding != "utf8" {
            Some("Only 'utf8' encoding is supported".to_string())
        } else {
            let bytes = content.as_bytes();
            let path = Path::new(&path);
            if let Some(parent) = path.parent()
                && let Err(err) = std::fs::create_dir_all(parent)
            {
                return Some(format!(
                    "Failed to create directory {}: {}",
                    parent.display(),
                    err
                ));
            }
            if let Err(err) = std::fs::write(path, bytes) {
                Some(format!("Failed to write file {path:?}: {err}"))
            } else {
                None // Success
            }
        }
    }

    #[rquickjs::function]
    pub fn write_file(path: String, content: TypedArray<'_, u8>) -> Option<String> {
        if let Some(bytes) = content.as_bytes() {
            let path = Path::new(&path);
            if let Some(parent) = path.parent()
                && let Err(err) = std::fs::create_dir_all(parent)
            {
                return Some(format!(
                    "Failed to create directory {}: {}",
                    parent.display(),
                    err
                ));
            }
            if let Err(err) = std::fs::write(path, bytes) {
                Some(format!("Failed to write file {path:?}: {err}"))
            } else {
                None // Success
            }
        } else {
            Some("The typed array has been detached".to_string())
        }
    }

    #[rquickjs::function]
    pub fn unlink(path: String) -> Option<String> {
        match std::fs::remove_file(Path::new(&path)) {
            Ok(_) => None,
            Err(err) => Some(format!("Failed to unlink {path:?}: {err}")),
        }
    }

    #[rquickjs::function]
    pub fn rename(old_path: String, new_path: String) -> Option<String> {
        match std::fs::rename(Path::new(&old_path), Path::new(&new_path)) {
            Ok(_) => None,
            Err(err) => Some(format!(
                "Failed to rename {old_path:?} to {new_path:?}: {err}"
            )),
        }
    }

    #[rquickjs::function]
    pub fn mkdir(path: String, recursive: bool) -> Option<String> {
        let path = Path::new(&path);
        let result = if recursive {
            std::fs::create_dir_all(path)
        } else {
            std::fs::create_dir(path)
        };
        match result {
            Ok(_) => None,
            Err(err) => Some(format!("Failed to create directory {path:?}: {err}")),
        }
    }

    // --- New functions ---

    #[rquickjs::function]
    pub fn fs_open(ctx: Ctx<'_>, path: String, flags: i32, _mode: i32) -> Object<'_> {
        use std::fs::OpenOptions;
        use std::io::{Seek, SeekFrom};

        let result = Object::new(ctx.clone()).unwrap();
        let mut opts = OpenOptions::new();

        let read = flags & 2 != 0 || flags & 1 == 0; // O_RDWR or O_RDONLY
        let write = flags & 1 != 0 || flags & 2 != 0; // O_WRONLY or O_RDWR

        opts.read(read);
        opts.write(write);

        if flags & 64 != 0 {
            opts.create(true); // O_CREAT
        }
        if flags & 128 != 0 {
            opts.create_new(true); // O_EXCL
        }
        if flags & 512 != 0 {
            opts.truncate(true); // O_TRUNC
        }
        if flags & 1024 != 0 {
            opts.append(true); // O_APPEND
        }

        match opts.open(&path) {
            Ok(mut file) => {
                // If O_APPEND, seek to end
                if flags & 1024 != 0 {
                    let _ = file.seek(SeekFrom::End(0));
                }
                let fd = super::FD_TABLE.lock().unwrap().insert(file);
                result.set("fd", fd).unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "open", Some(&path)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_close(ctx: Ctx<'_>, fd: i32) -> Option<Object<'_>> {
        let removed = super::FD_TABLE.lock().unwrap().remove(fd);
        if removed.is_some() {
            None
        } else {
            Some(super::make_badf_error(&ctx, "close"))
        }
    }

    #[rquickjs::function]
    pub fn fs_read<'js>(
        ctx: Ctx<'js>,
        fd: i32,
        length: usize,
        position: Value<'js>,
    ) -> Object<'js> {
        use std::io::{Read, Seek, SeekFrom};

        let result = Object::new(ctx.clone()).unwrap();
        let mut table = super::FD_TABLE.lock().unwrap();

        match table.get_mut(fd) {
            Some(file) => {
                if !position.is_null() && !position.is_undefined() {
                    if let Some(pos) = position.as_number() {
                        let pos = pos as u64;
                        if let Err(err) = file.seek(SeekFrom::Start(pos)) {
                            result
                                .set("error", super::make_fs_error(&ctx, &err, "read", None))
                                .unwrap();
                            return result;
                        }
                    }
                }

                let mut buf = vec![0u8; length];
                match file.read(&mut buf) {
                    Ok(bytes_read) => {
                        buf.truncate(bytes_read);
                        let typed_array = TypedArray::new_copy(ctx.clone(), &buf)
                            .expect("Failed to create TypedArray");
                        result.set("bytesRead", bytes_read as f64).unwrap();
                        result.set("buffer", typed_array).unwrap();
                    }
                    Err(err) => {
                        result
                            .set("error", super::make_fs_error(&ctx, &err, "read", None))
                            .unwrap();
                    }
                }
            }
            None => {
                result
                    .set("error", super::make_badf_error(&ctx, "read"))
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_write_buffer<'js>(
        ctx: Ctx<'js>,
        fd: i32,
        buffer: TypedArray<'js, u8>,
        offset: usize,
        length: usize,
        position: Value<'js>,
    ) -> Object<'js> {
        use std::io::{Seek, SeekFrom, Write};

        let result = Object::new(ctx.clone()).unwrap();

        let Some(bytes) = buffer.as_bytes() else {
            result
                .set(
                    "error",
                    super::make_fs_error(
                        &ctx,
                        &std::io::Error::new(std::io::ErrorKind::InvalidInput, "detached buffer"),
                        "write",
                        None,
                    ),
                )
                .unwrap();
            return result;
        };

        let end = (offset + length).min(bytes.len());
        let data = &bytes[offset..end];

        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(file) => {
                if !position.is_null() && !position.is_undefined() {
                    if let Some(pos) = position.as_number() {
                        let pos = pos as u64;
                        if let Err(err) = file.seek(SeekFrom::Start(pos)) {
                            result
                                .set("error", super::make_fs_error(&ctx, &err, "write", None))
                                .unwrap();
                            return result;
                        }
                    }
                }
                match file.write(data) {
                    Ok(written) => {
                        result.set("bytesWritten", written as f64).unwrap();
                    }
                    Err(err) => {
                        result
                            .set("error", super::make_fs_error(&ctx, &err, "write", None))
                            .unwrap();
                    }
                }
            }
            None => {
                result
                    .set("error", super::make_badf_error(&ctx, "write"))
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_write_string<'js>(
        ctx: Ctx<'js>,
        fd: i32,
        data: String,
        position: Value<'js>,
    ) -> Object<'js> {
        use std::io::{Seek, SeekFrom, Write};

        let result = Object::new(ctx.clone()).unwrap();
        let mut table = super::FD_TABLE.lock().unwrap();

        match table.get_mut(fd) {
            Some(file) => {
                if !position.is_null() && !position.is_undefined() {
                    if let Some(pos) = position.as_number() {
                        let pos = pos as u64;
                        if let Err(err) = file.seek(SeekFrom::Start(pos)) {
                            result
                                .set("error", super::make_fs_error(&ctx, &err, "write", None))
                                .unwrap();
                            return result;
                        }
                    }
                }
                let bytes = data.as_bytes();
                match file.write(bytes) {
                    Ok(written) => {
                        result.set("bytesWritten", written as f64).unwrap();
                    }
                    Err(err) => {
                        result
                            .set("error", super::make_fs_error(&ctx, &err, "write", None))
                            .unwrap();
                    }
                }
            }
            None => {
                result
                    .set("error", super::make_badf_error(&ctx, "write"))
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_ftruncate(ctx: Ctx<'_>, fd: i32, len: f64) -> Option<Object<'_>> {
        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(file) => {
                if let Err(err) = file.set_len(len as u64) {
                    Some(super::make_fs_error(&ctx, &err, "ftruncate", None))
                } else {
                    None
                }
            }
            None => Some(super::make_badf_error(&ctx, "ftruncate")),
        }
    }

    #[rquickjs::function]
    pub fn fs_fsync(ctx: Ctx<'_>, fd: i32) -> Option<Object<'_>> {
        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(file) => {
                if let Err(err) = file.sync_all() {
                    Some(super::make_fs_error(&ctx, &err, "fsync", None))
                } else {
                    None
                }
            }
            None => Some(super::make_badf_error(&ctx, "fsync")),
        }
    }

    #[rquickjs::function]
    pub fn fs_fdatasync(ctx: Ctx<'_>, fd: i32) -> Option<Object<'_>> {
        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(file) => {
                if let Err(err) = file.sync_data() {
                    Some(super::make_fs_error(&ctx, &err, "fdatasync", None))
                } else {
                    None
                }
            }
            None => Some(super::make_badf_error(&ctx, "fdatasync")),
        }
    }

    #[rquickjs::function]
    pub fn fs_stat(ctx: Ctx<'_>, path: String) -> Object<'_> {
        let result = Object::new(ctx.clone()).unwrap();
        match std::fs::metadata(&path) {
            Ok(meta) => {
                result
                    .set("stat", super::metadata_to_obj(&ctx, &meta))
                    .unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "stat", Some(&path)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_lstat(ctx: Ctx<'_>, path: String) -> Object<'_> {
        let result = Object::new(ctx.clone()).unwrap();
        match std::fs::symlink_metadata(&path) {
            Ok(meta) => {
                result
                    .set("stat", super::metadata_to_obj(&ctx, &meta))
                    .unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "lstat", Some(&path)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_fstat(ctx: Ctx<'_>, fd: i32) -> Object<'_> {
        let result = Object::new(ctx.clone()).unwrap();

        // Handle stdin/stdout/stderr (fd 0, 1, 2) which are not in FD_TABLE
        if fd >= 0 && fd <= 2 {
            let stat = super::stdio_stat_obj(&ctx);
            result.set("stat", stat).unwrap();
            return result;
        }

        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(file) => match file.metadata() {
                Ok(meta) => {
                    result
                        .set("stat", super::metadata_to_obj(&ctx, &meta))
                        .unwrap();
                }
                Err(err) => {
                    result
                        .set("error", super::make_fs_error(&ctx, &err, "fstat", None))
                        .unwrap();
                }
            },
            None => {
                result
                    .set("error", super::make_badf_error(&ctx, "fstat"))
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_readdir(ctx: Ctx<'_>, path: String, with_file_types: bool) -> Object<'_> {
        let result = Object::new(ctx.clone()).unwrap();
        match std::fs::read_dir(&path) {
            Ok(entries) => {
                let arr = Array::new(ctx.clone()).unwrap();
                let mut idx = 0usize;
                for entry in entries {
                    match entry {
                        Ok(entry) => {
                            if with_file_types {
                                let obj = Object::new(ctx.clone()).unwrap();
                                let name = entry.file_name().to_string_lossy().to_string();
                                obj.set("name", name).unwrap();
                                let ft = entry.file_type();
                                let file_type = match ft {
                                    Ok(ft) if ft.is_file() => "file",
                                    Ok(ft) if ft.is_dir() => "directory",
                                    Ok(ft) if ft.is_symlink() => "symlink",
                                    _ => "unknown",
                                };
                                obj.set("fileType", file_type).unwrap();
                                arr.set(idx, obj).unwrap();
                            } else {
                                let name = entry.file_name().to_string_lossy().to_string();
                                arr.set(idx, name).unwrap();
                            }
                            idx += 1;
                        }
                        Err(_) => continue,
                    }
                }
                result.set("entries", arr).unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "scandir", Some(&path)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_access(ctx: Ctx<'_>, path: String, _mode: i32) -> Option<Object<'_>> {
        // For WASI, just check if the path exists (and is accessible)
        match std::fs::metadata(&path) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "access", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_realpath(ctx: Ctx<'_>, path: String) -> Object<'_> {
        let result = Object::new(ctx.clone()).unwrap();
        match std::fs::canonicalize(&path) {
            Ok(resolved) => {
                result
                    .set("result", resolved.to_string_lossy().to_string())
                    .unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "realpath", Some(&path)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_truncate(ctx: Ctx<'_>, path: String, len: f64) -> Option<Object<'_>> {
        match std::fs::OpenOptions::new().write(true).open(&path) {
            Ok(file) => {
                if let Err(err) = file.set_len(len as u64) {
                    Some(super::make_fs_error(&ctx, &err, "truncate", Some(&path)))
                } else {
                    None
                }
            }
            Err(err) => Some(super::make_fs_error(&ctx, &err, "truncate", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_copy_file(ctx: Ctx<'_>, src: String, dest: String) -> Option<Object<'_>> {
        match std::fs::copy(&src, &dest) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "copyfile", Some(&src))),
        }
    }

    #[rquickjs::function]
    pub fn fs_link(ctx: Ctx<'_>, existing_path: String, new_path: String) -> Option<Object<'_>> {
        match std::fs::hard_link(&existing_path, &new_path) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(
                &ctx,
                &err,
                "link",
                Some(&existing_path),
            )),
        }
    }

    #[rquickjs::function]
    pub fn fs_symlink(ctx: Ctx<'_>, target: String, _path: String) -> Option<Object<'_>> {
        #[cfg(unix)]
        {
            match std::os::unix::fs::symlink(&target, &_path) {
                Ok(_) => None,
                Err(err) => Some(super::make_fs_error(&ctx, &err, "symlink", Some(&target))),
            }
        }
        #[cfg(not(unix))]
        {
            let err = std::io::Error::new(std::io::ErrorKind::Unsupported, "symlink not supported");
            Some(super::make_fs_error(&ctx, &err, "symlink", Some(&target)))
        }
    }

    #[rquickjs::function]
    pub fn fs_readlink(ctx: Ctx<'_>, path: String) -> Object<'_> {
        let result = Object::new(ctx.clone()).unwrap();
        match std::fs::read_link(&path) {
            Ok(target) => {
                result
                    .set("result", target.to_string_lossy().to_string())
                    .unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "readlink", Some(&path)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_chmod(ctx: Ctx<'_>, path: String, _mode: u32) -> Option<Object<'_>> {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let perms = std::fs::Permissions::from_mode(_mode);
            match std::fs::set_permissions(&path, perms) {
                Ok(_) => None,
                Err(err) => Some(super::make_fs_error(&ctx, &err, "chmod", Some(&path))),
            }
        }
        #[cfg(not(unix))]
        {
            // chmod is not supported on WASI/Windows; verify path exists
            match std::fs::metadata(&path) {
                Ok(_) => None,
                Err(err) => Some(super::make_fs_error(&ctx, &err, "chmod", Some(&path))),
            }
        }
    }

    #[rquickjs::function]
    pub fn fs_fchmod(ctx: Ctx<'_>, fd: i32, _mode: u32) -> Option<Object<'_>> {
        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(_file) => {
                #[cfg(unix)]
                {
                    use std::fs::Permissions;
                    use std::os::unix::fs::PermissionsExt;
                    let perms = Permissions::from_mode(_mode);
                    match _file.set_permissions(perms) {
                        Ok(_) => None,
                        Err(err) => Some(super::make_fs_error(&ctx, &err, "fchmod", None)),
                    }
                }
                #[cfg(not(unix))]
                {
                    // fchmod is not supported on WASI/Windows; no-op
                    None
                }
            }
            None => Some(super::make_badf_error(&ctx, "fchmod")),
        }
    }

    #[rquickjs::function]
    pub fn fs_chown(ctx: Ctx<'_>, path: String, _uid: u32, _gid: u32) -> Option<Object<'_>> {
        // chown is not supported on WASI; just verify path exists
        match std::fs::metadata(&path) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "chown", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_fchown(ctx: Ctx<'_>, fd: i32, _uid: u32, _gid: u32) -> Option<Object<'_>> {
        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(_) => None,
            None => Some(super::make_badf_error(&ctx, "fchown")),
        }
    }

    #[rquickjs::function]
    pub fn fs_lchown(ctx: Ctx<'_>, path: String, _uid: u32, _gid: u32) -> Option<Object<'_>> {
        match std::fs::symlink_metadata(&path) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "lchown", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_utimes(
        ctx: Ctx<'_>,
        path: String,
        _atime_secs: f64,
        _mtime_secs: f64,
    ) -> Option<Object<'_>> {
        // utimes is not well-supported on WASI; verify path exists, no-op otherwise
        match std::fs::metadata(&path) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "utimes", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_futimes(
        ctx: Ctx<'_>,
        fd: i32,
        _atime_secs: f64,
        _mtime_secs: f64,
    ) -> Option<Object<'_>> {
        let mut table = super::FD_TABLE.lock().unwrap();
        match table.get_mut(fd) {
            Some(_) => None,
            None => Some(super::make_badf_error(&ctx, "futimes")),
        }
    }

    #[rquickjs::function]
    pub fn fs_mkdir(ctx: Ctx<'_>, path: String, recursive: bool) -> Option<Object<'_>> {
        let p = Path::new(&path);
        let result = if recursive {
            std::fs::create_dir_all(p)
        } else {
            std::fs::create_dir(p)
        };
        match result {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "mkdir", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_rmdir(ctx: Ctx<'_>, path: String) -> Option<Object<'_>> {
        match std::fs::remove_dir(&path) {
            Ok(_) => None,
            Err(err) => Some(super::make_fs_error(&ctx, &err, "rmdir", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_rm(ctx: Ctx<'_>, path: String, recursive: bool, force: bool) -> Option<Object<'_>> {
        let meta = std::fs::symlink_metadata(&path);
        match meta {
            Ok(m) => {
                if m.is_dir() {
                    let result = if recursive {
                        std::fs::remove_dir_all(&path)
                    } else {
                        std::fs::remove_dir(&path)
                    };
                    match result {
                        Ok(_) => None,
                        Err(err) => Some(super::make_fs_error(&ctx, &err, "rm", Some(&path))),
                    }
                } else {
                    match std::fs::remove_file(&path) {
                        Ok(_) => None,
                        Err(err) => Some(super::make_fs_error(&ctx, &err, "rm", Some(&path))),
                    }
                }
            }
            Err(err) => {
                if force && err.kind() == std::io::ErrorKind::NotFound {
                    None
                } else {
                    Some(super::make_fs_error(&ctx, &err, "rm", Some(&path)))
                }
            }
        }
    }

    #[rquickjs::function]
    pub fn fs_mkdtemp(ctx: Ctx<'_>, prefix: String) -> Object<'_> {
        use rand::Rng;

        let result = Object::new(ctx.clone()).unwrap();
        let mut rng = rand::rng();
        let chars: Vec<char> = (0..6)
            .map(|_| {
                let idx: u32 = rng.random_range(0..36);
                if idx < 10 {
                    (b'0' + idx as u8) as char
                } else {
                    (b'a' + (idx - 10) as u8) as char
                }
            })
            .collect();
        let suffix: String = chars.into_iter().collect();
        let dir_path = format!("{prefix}{suffix}");

        match std::fs::create_dir(&dir_path) {
            Ok(_) => {
                result.set("result", dir_path).unwrap();
            }
            Err(err) => {
                result
                    .set(
                        "error",
                        super::make_fs_error(&ctx, &err, "mkdtemp", Some(&prefix)),
                    )
                    .unwrap();
            }
        }
        result
    }

    #[rquickjs::function]
    pub fn fs_append_file<'js>(
        ctx: Ctx<'js>,
        path: String,
        data: TypedArray<'js, u8>,
    ) -> Option<Object<'js>> {
        let Some(bytes) = data.as_bytes() else {
            return Some(super::make_fs_error(
                &ctx,
                &std::io::Error::new(std::io::ErrorKind::InvalidInput, "detached buffer"),
                "appendFile",
                Some(&path),
            ));
        };

        let file = std::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(&path);

        match file {
            Ok(mut f) => {
                use std::io::Write;
                if let Err(err) = f.write_all(bytes) {
                    Some(super::make_fs_error(&ctx, &err, "appendFile", Some(&path)))
                } else {
                    None
                }
            }
            Err(err) => Some(super::make_fs_error(&ctx, &err, "open", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_append_file_string(ctx: Ctx<'_>, path: String, data: String) -> Option<Object<'_>> {
        let file = std::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(&path);

        match file {
            Ok(mut f) => {
                use std::io::Write;
                if let Err(err) = f.write_all(data.as_bytes()) {
                    Some(super::make_fs_error(&ctx, &err, "appendFile", Some(&path)))
                } else {
                    None
                }
            }
            Err(err) => Some(super::make_fs_error(&ctx, &err, "open", Some(&path))),
        }
    }

    #[rquickjs::function]
    pub fn fs_exists(path: String) -> bool {
        std::path::Path::new(&path).exists()
    }
}

// JS functions for the fs implementation
pub const FS_JS: &str = include_str!("fs.js");

pub const FS_PROMISES_JS: &str = include_str!("fs_promises.js");

// Re-exports for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:fs'; export { default } from 'node:fs';"#;
pub const REEXPORT_PROMISES_JS: &str =
    r#"export * from 'node:fs/promises'; export { default } from 'node:fs/promises';"#;
