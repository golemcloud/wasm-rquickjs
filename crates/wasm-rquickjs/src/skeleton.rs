use anyhow::anyhow;
use camino::Utf8Path;
use include_dir::{Dir, include_dir};
use toml_edit::{DocumentMut, value};

static SKELETON: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/skeleton");

/// Generates a `Cargo.toml` file for the wrapper crate in the `output` directory,
/// based on `skeleton/Cargo.toml`.
pub fn generate_cargo_toml(crate_name: &str, output: &Utf8Path) -> anyhow::Result<()> {
    let cargo_toml = SKELETON
        .get_file("Cargo.toml")
        .ok_or_else(|| anyhow!("Missing Cargo.toml skeleton"))?
        .contents_utf8()
        .ok_or_else(|| anyhow!("Cargo.toml skeleton is not valid UTF-8"))?;

    let mut doc = cargo_toml
        .parse::<DocumentMut>()
        .map_err(|err| anyhow!("Cargo.toml skeleton is not a valid TOML: {err}"))?;

    doc["package"]["name"] = value(crate_name);

    let output_path = output.join("Cargo.toml");
    std::fs::write(output_path, doc.to_string())?;
    Ok(())
}

pub fn copy_skeleton_sources(output: &Utf8Path) -> anyhow::Result<()> {
    let target = output.join("src");
    if let Some(src) = SKELETON.get_dir("src") {
        for file in src.files() {
            let src_path = Utf8Path::from_path(file.path())
                .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
            let dest_path = output.join(src_path);
            std::fs::write(dest_path, file.contents())?;
        }
    }
    Ok(())
}
