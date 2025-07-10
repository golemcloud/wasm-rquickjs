use anyhow::anyhow;
use camino::Utf8PathBuf;
use std::fs;

pub fn collect_example_paths() -> anyhow::Result<Vec<Utf8PathBuf>> {
    let mut result = Vec::new();
    let paths = fs::read_dir("examples")?;
    for example_path in paths {
        let example_path = example_path?;
        let metadata = example_path.metadata()?;
        if metadata.is_dir() {
            let path = Utf8PathBuf::from_path_buf(example_path.path())
                .map_err(|_| anyhow!("Non UTF-8 example path"))?;
            result.push(path);
        }
    }
    Ok(result)
}
