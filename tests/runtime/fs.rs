use crate::common::{CompiledTest, TestInstance};
use camino::Utf8Path;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "fs")]
fn compiled_fs() -> CompiledTest {
    let path = Utf8Path::new("examples/fs");
    CompiledTest::new(path, false).expect("Failed to compile fs")
}

#[test]
async fn fs(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance.invoke_and_capture_output(None, "run", &[]).await;
    let _result = r?;

    let result_file = String::from_utf8(std::fs::read(
        instance.temp_dir_path().join("test").join("output.txt"),
    )?)?;

    assert_eq!(
        output,
        "Current working directory: /\nArguments: [ 'first-arg', 'second-arg' ]\nEnvironment variables:\nTEST_KEY: TEST_VALUE\nTEST_KEY_2: TEST_VALUE_2\n@@ TEST_KEY: TEST_VALUE\n@@ TEST_KEY_2: TEST_VALUE_2\n"
    );
    assert_eq!(result_file, "test file contents - Processed by test");
    Ok(())
}

#[test]
async fn fs_async(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "run-async", &[])
        .await;
    let _result = r?;

    let result_file = String::from_utf8(std::fs::read(
        instance.temp_dir_path().join("test").join("output.txt"),
    )?)?;

    assert_eq!(output, "test file contents\n");
    assert_eq!(result_file, "test file contents - Processed by test");
    Ok(())
}

#[test]
async fn fs_promises_write_file(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-fs-promises-write-file", &[])
        .await;
    let _result = r?;

    assert!(output.contains("writeFile succeeded"));

    let result_file = String::from_utf8(std::fs::read(
        instance
            .temp_dir_path()
            .join("test")
            .join("promises-output.txt"),
    )?)?;

    assert_eq!(result_file, "written via fs/promises");
    Ok(())
}

#[test]
async fn fs_promises_rename(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-fs-promises-rename", &[])
        .await;
    let _result = r?;

    // Check that the old file doesn't exist
    assert!(
        !instance
            .temp_dir_path()
            .join("test")
            .join("before-rename.txt")
            .exists()
    );

    // Check that the new file exists with the correct content
    let result_file = String::from_utf8(std::fs::read(
        instance
            .temp_dir_path()
            .join("test")
            .join("after-rename.txt"),
    )?)?;

    assert!(output.contains("rename succeeded"));
    assert_eq!(result_file, "content to rename");
    Ok(())
}

#[test]
async fn fs_promises_mkdir(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-fs-promises-mkdir", &[])
        .await;
    let _result = r?;

    assert!(output.contains("mkdir succeeded"));
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("new-dir")
            .exists()
    );
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("new-dir")
            .is_dir()
    );
    Ok(())
}

#[test]
async fn fs_promises_mkdir_recursive(
    #[tagged_as("fs")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-fs-promises-mkdir-recursive", &[])
        .await;
    let _result = r?;

    assert!(output.contains("mkdir recursive succeeded"));
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("nested")
            .join("deep")
            .join("dir")
            .exists()
    );
    Ok(())
}

#[test]
async fn fs_promises_unlink(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-fs-promises-unlink", &[])
        .await;
    let _result = r?;

    assert!(output.contains("unlink succeeded"));
    assert!(
        !instance
            .temp_dir_path()
            .join("test")
            .join("to-delete.txt")
            .exists()
    );
    Ok(())
}

#[test]
async fn fs_rename_sync(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-rename-sync", &[])
        .await;
    let _result = r?;

    assert!(output.contains("renameSync succeeded"));
    assert!(
        !instance
            .temp_dir_path()
            .join("test")
            .join("rename-sync-before.txt")
            .exists()
    );
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("rename-sync-after.txt")
            .exists()
    );
    Ok(())
}

#[test]
async fn fs_rename_callback(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-rename-callback", &[])
        .await;
    let _result = r?;

    assert!(output.contains("rename callback succeeded"));
    assert!(
        !instance
            .temp_dir_path()
            .join("test")
            .join("rename-cb-before.txt")
            .exists()
    );
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("rename-cb-after.txt")
            .exists()
    );
    Ok(())
}

#[test]
async fn fs_mkdir_sync(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-mkdir-sync", &[])
        .await;
    let _result = r?;

    assert!(output.contains("mkdirSync succeeded"));
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("mkdir-sync-dir")
            .is_dir()
    );
    Ok(())
}

#[test]
async fn fs_mkdir_sync_recursive(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-mkdir-sync-recursive", &[])
        .await;
    let _result = r?;

    assert!(output.contains("mkdirSync recursive succeeded"));
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("mkdir-sync-nested")
            .join("deep")
            .join("dir")
            .is_dir()
    );
    Ok(())
}

#[test]
async fn fs_mkdir_callback(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-mkdir-callback", &[])
        .await;
    let _result = r?;

    assert!(output.contains("mkdir callback succeeded"));
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("mkdir-cb-dir")
            .is_dir()
    );
    Ok(())
}

#[test]
async fn fs_mkdir_callback_recursive(
    #[tagged_as("fs")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-mkdir-callback-recursive", &[])
        .await;
    let _result = r?;

    assert!(output.contains("mkdir callback recursive succeeded"));
    assert!(
        instance
            .temp_dir_path()
            .join("test")
            .join("mkdir-cb-nested")
            .join("deep")
            .join("dir")
            .is_dir()
    );
    Ok(())
}

#[test]
async fn fs_unlink_sync(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-unlink-sync", &[])
        .await;
    let _result = r?;

    assert!(output.contains("unlinkSync succeeded"));
    assert!(
        !instance
            .temp_dir_path()
            .join("test")
            .join("unlink-sync-file.txt")
            .exists()
    );
    Ok(())
}

#[test]
async fn fs_unlink_callback(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "test-unlink-callback", &[])
        .await;
    let _result = r?;

    assert!(output.contains("unlink callback succeeded"));
    assert!(
        !instance
            .temp_dir_path()
            .join("test")
            .join("unlink-cb-file.txt")
            .exists()
    );
    Ok(())
}
