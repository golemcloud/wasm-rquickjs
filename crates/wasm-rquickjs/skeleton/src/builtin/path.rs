use rquickjs::JsLifetime;
use rquickjs::class::Trace;

// Native functions for the node:path implementation (POSIX only)
#[rquickjs::module]
pub mod native_module {
    use rquickjs::prelude::*;
    use rquickjs::{JsLifetime, class::Trace};
    use std::path::Path;

    // Result type for parse function
    #[derive(JsLifetime, Trace, Clone, Default)]
    #[rquickjs::class]
    pub struct ParsedPath {
        #[qjs(get, set)]
        pub root: String,
        #[qjs(get, set)]
        pub dir: String,
        #[qjs(get, set)]
        pub base: String,
        #[qjs(get, set)]
        pub ext: String,
        #[qjs(get, set)]
        pub name: String,
    }

    #[rquickjs::methods]
    impl ParsedPath {
        #[qjs(constructor)]
        pub fn new(root: String, dir: String, base: String, ext: String, name: String) -> Self {
            Self {
                root,
                dir,
                base,
                ext,
                name,
            }
        }
    }

    #[rquickjs::function]
    pub fn basename(path: String, suffix: Opt<String>) -> String {
        let path = Path::new(&path);
        let basename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        if let Some(suffix) = suffix.0 {
            if basename.ends_with(&suffix) {
                basename[..basename.len() - suffix.len()].to_string()
            } else {
                basename.to_string()
            }
        } else {
            basename.to_string()
        }
    }

    #[rquickjs::function]
    pub fn dirname(path: String) -> String {
        let path = Path::new(&path);
        path.parent()
            .and_then(|d| d.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    #[rquickjs::function]
    pub fn extname(path: String) -> String {
        let path = Path::new(&path);
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| format!(".{}", ext))
            .unwrap_or_default()
    }

    #[rquickjs::function]
    pub fn is_absolute(path: String) -> bool {
        Path::new(&path).is_absolute()
    }

    fn normalize_impl(path: String) -> String {
        if path.is_empty() {
            return ".".to_string();
        }

        let is_absolute = path.starts_with('/');

        // Split and filter out empty segments and "."
        let parts: Vec<&str> = path
            .split('/')
            .filter(|p| !p.is_empty() && p != &".")
            .collect();

        let mut result = Vec::new();
        for part in parts {
            if part == ".." {
                if !result.is_empty() {
                    let last = result.last().unwrap();
                    if *last == ".." {
                        result.push("..");
                    } else {
                        result.pop();
                    }
                } else if is_absolute {
                    // For absolute paths, .. at root is ignored
                } else {
                    result.push("..");
                }
            } else {
                result.push(part);
            }
        }

        if result.is_empty() {
            if is_absolute {
                "/".to_string()
            } else {
                ".".to_string()
            }
        } else {
            let normalized = result.join("/");
            if is_absolute {
                format!("/{}", normalized)
            } else {
                normalized
            }
        }
    }

    #[rquickjs::function]
    pub fn join(paths: Vec<String>) -> String {
        if paths.is_empty() {
            return ".".to_string();
        }

        let joined = paths.iter()
            .filter(|p| !p.is_empty())
            .cloned()
            .collect::<Vec<String>>()
            .join("/");
        
        // If the result is empty (e.g. join("", "")), return "."
        if joined.is_empty() {
            return ".".to_string();
        }

        normalize_impl(joined)
    }

    #[rquickjs::function]
    pub fn normalize(path: String) -> String {
        normalize_impl(path)
    }

    fn resolve_impl(paths: &[String]) -> String {
        let mut resolved = String::new();
        let mut resolved_absolute = false;

        for path in paths.iter().rev() {
            if path.is_empty() {
                continue;
            }
            
            if resolved.is_empty() {
                resolved = path.clone();
            } else {
                resolved = format!("{}/{}", path, resolved);
            }
            
            if path.starts_with('/') {
                resolved_absolute = true;
                break;
            }
        }

        if !resolved_absolute {
            if resolved.is_empty() {
                resolved = "/".to_string();
            } else {
                resolved = format!("/{}", resolved);
            }
        }

        normalize_impl(resolved)
    }

    #[rquickjs::function]
    pub fn resolve(paths: Vec<String>) -> String {
        resolve_impl(&paths)
    }

    #[rquickjs::function]
    pub fn relative(from: String, to: String) -> String {
        let from_res = resolve_impl(&[from]);
        let to_res = resolve_impl(&[to]);
        
        let from_parts: Vec<&str> = from_res.split('/').filter(|s| !s.is_empty()).collect();
        let to_parts: Vec<&str> = to_res.split('/').filter(|s| !s.is_empty()).collect();
        
        let mut common_len = 0;
        for (f, t) in from_parts.iter().zip(to_parts.iter()) {
            if f == t {
                common_len += 1;
            } else {
                break;
            }
        }
        
        let mut result = Vec::new();
        
        for _ in common_len..from_parts.len() {
            result.push("..");
        }
        
        for i in common_len..to_parts.len() {
            result.push(to_parts[i]);
        }
        
        if result.is_empty() {
            "".to_string()
        } else {
            result.join("/")
        }
    }

    #[rquickjs::function]
    pub fn parse(path: String) -> ParsedPath {
        if path.is_empty() {
            return ParsedPath::default();
        }

        let path = Path::new(&path);

        let root = if path.has_root() {
            "/".to_string()
        } else {
            "".to_string()
        };

        let dir = path
            .parent()
            .map(|p| p.to_str().unwrap_or("").to_string())
            .unwrap_or("".to_string());

        let base = path
            .file_name()
            .map(|n| n.to_str().unwrap_or("").to_string())
            .unwrap_or("".to_string());

        let ext = path
            .extension()
            .map(|ext| format!(".{}", ext.to_str().unwrap_or("")))
            .unwrap_or("".to_string());

        let name = if ext.is_empty() {
            base.clone()
        } else {
            base.strip_suffix(&ext)
                .map(|r| r.to_string())
                .unwrap_or(base.clone())
        };

        ParsedPath {
            root,
            dir,
            base,
            ext,
            name,
        }
    }

    #[rquickjs::function]
    pub fn format(path_obj: ParsedPath) -> String {
        let dir = if !path_obj.dir.is_empty() {
            path_obj.dir.clone()
        } else {
            path_obj.root.clone()
        };

        let base = if !path_obj.base.is_empty() {
            path_obj.base.clone()
        } else {
            let ext = if !path_obj.ext.is_empty() && !path_obj.ext.starts_with('.') {
                format!(".{}", path_obj.ext)
            } else {
                path_obj.ext.clone()
            };
            format!("{}{}", path_obj.name, ext)
        };

        if dir.is_empty() {
            return base;
        }

        if dir == path_obj.root {
            format!("{}{}", dir, base)
        } else {
            format!("{}/{}", dir, base)
        }
    }
}

// JS functions for the path implementation
pub const PATH_JS: &str = include_str!("path.js");
