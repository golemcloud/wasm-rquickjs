#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    use encoding_rs::Encoding;
    use rquickjs::prelude::List;
    use rquickjs::{Ctx, TypedArray};
    use std::path::Path;

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
            Err(err) => Some(format!("Failed to rename {old_path:?} to {new_path:?}: {err}")),
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
}

// JS functions for the fs implementation
pub const FS_JS: &str = include_str!("fs.js");

pub const FS_PROMISES_JS: &str = include_str!("fs_promises.js");

// Re-exports for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:fs'; export { default } from 'node:fs';"#;
pub const REEXPORT_PROMISES_JS: &str = r#"export * from 'node:fs/promises'; export { default } from 'node:fs/promises';"#;
