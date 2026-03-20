---
name: regenerating-goldenfiles
description: "Regenerates DTS goldenfiles after d.ts generation logic changes. Use when dts tests fail due to expected output changes, when asked to update goldenfiles, or after modifying the d.ts generator."
---

# Regenerating DTS Goldenfiles

The `dts` tests compare generated `.d.ts` output against checked-in golden files in `tests/goldenfiles/`.

## When to Regenerate

When you modify the d.ts generation logic in `crates/wasm-rquickjs/src/` and the `dts` tests fail because the output has intentionally changed.

## Steps

```bash
# 1. Regenerate the golden files
UPDATE_GOLDENFILES=1 cargo test --test dts

# 2. Review the changes
git diff tests/goldenfiles/

# 3. Verify the changes are intentional before committing
```

## Verification

After regenerating, run the tests normally to confirm they pass:

```bash
cargo test --test dts -- --nocapture
```
