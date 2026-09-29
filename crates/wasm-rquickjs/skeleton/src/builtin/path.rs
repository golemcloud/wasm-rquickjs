// JS implementation of the node:path module
pub const PATH_JS: &str = include_str!("path.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:path'; export { default } from 'node:path';"#;

// Subpath implementations expose the same supported method surface as node:path,
// but bind the default methods to the requested path flavor.
pub const PATH_POSIX_REEXPORT_JS: &str = r#"
import { posix, win32 } from 'node:path';
const {
    sep, delimiter, basename, dirname, extname, isAbsolute, join, normalize,
    relative, resolve, parse, format, matchesGlob, toNamespacedPath,
} = posix;
export {
    sep, delimiter, basename, dirname, extname, isAbsolute, join, normalize,
    relative, resolve, parse, format, matchesGlob, toNamespacedPath, posix, win32,
};
export default posix;
"#;
pub const PATH_WIN32_REEXPORT_JS: &str = r#"
import { posix, win32 } from 'node:path';
const {
    sep, delimiter, basename, dirname, extname, isAbsolute, join, normalize,
    relative, resolve, parse, format, matchesGlob, toNamespacedPath,
} = win32;
export {
    sep, delimiter, basename, dirname, extname, isAbsolute, join, normalize,
    relative, resolve, parse, format, matchesGlob, toNamespacedPath, posix, win32,
};
export default win32;
"#;

pub const PATH_POSIX_BARE_REEXPORT_JS: &str =
    r#"export * from 'node:path/posix'; export { default } from 'node:path/posix';"#;
pub const PATH_WIN32_BARE_REEXPORT_JS: &str =
    r#"export * from 'node:path/win32'; export { default } from 'node:path/win32';"#;
