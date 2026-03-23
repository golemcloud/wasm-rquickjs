use anyhow::{Context, anyhow};
use camino::Utf8Path;
use wasm_encoder::reencode::{Error, Reencode, ReencodeComponent};

/// Magic bytes identifying a wasm-rquickjs JS injection marker.
pub const SLOT_MAGIC: &[u8; 16] = b"WASM_RQJS_SLOT\x01\x00";

/// Magic bytes at the end of a marker, used to validate integrity.
pub const SLOT_END_MAGIC: &[u8; 16] = b"WASM_RQJS_SLTND\x00";

/// Total size of the marker: MAGIC(16) + JS_OFFSET(4) + END_MAGIC(16) = 36 bytes.
/// The JS_OFFSET field is a pointer into linear memory. Value 0 = no JS injected.
const MARKER_SIZE: usize = 36;

const WASM_PAGE_SIZE: u32 = 65536;

/// Creates a 36-byte marker file. Layout:
///
/// ```text
/// [MAGIC 16 bytes][JS_OFFSET u32 LE = 0][END_MAGIC 16 bytes]
/// ```
///
/// JS_OFFSET=0 indicates no JS has been injected. After injection, JS_OFFSET
/// points to a memory location containing `[JS_LEN u32 LE][JS bytes]`.
pub fn create_marker_file() -> Vec<u8> {
    let mut data = Vec::with_capacity(MARKER_SIZE);
    data.extend_from_slice(SLOT_MAGIC);
    data.extend_from_slice(&0u32.to_le_bytes()); // js_offset = 0 (not injected)
    data.extend_from_slice(SLOT_END_MAGIC);
    data
}

/// Injects JavaScript source code into a compiled WASM component that was built with
/// `EmbeddingMode::BinarySlot`.
///
/// This structurally rewrites the WASM component using `wasmparser` + `wasm-encoder`:
/// 1. Finds the data segment containing the 36-byte marker and patches the JS_OFFSET
///    field in-place (no size change, no address shifting).
/// 2. Grows the core module's memory to fit the new JS data.
/// 3. Adds a new active data segment at the end of memory containing the JS.
/// 4. Updates the DataCount section to account for the extra segment.
///
/// There is no capacity limit — the JS can be any size.
pub fn inject_js_into_component(
    input: &Utf8Path,
    output: &Utf8Path,
    js_source: &str,
) -> anyhow::Result<()> {
    let wasm_bytes = std::fs::read(input.as_std_path())
        .with_context(|| format!("Failed to read input component: {input}"))?;

    let patched = inject_js_into_bytes(&wasm_bytes, js_source)?;

    std::fs::write(output.as_std_path(), &patched)
        .with_context(|| format!("Failed to write output component: {output}"))?;

    Ok(())
}

/// Injects JavaScript source into WASM component bytes, returning the patched bytes.
pub fn inject_js_into_bytes(wasm_bytes: &[u8], js_source: &str) -> anyhow::Result<Vec<u8>> {
    let js_bytes = js_source.as_bytes();

    // Build the JS payload stored in linear memory: LEN(4) + JS bytes
    let mut js_payload = Vec::with_capacity(4 + js_bytes.len());
    js_payload.extend_from_slice(&(js_bytes.len() as u32).to_le_bytes());
    js_payload.extend_from_slice(js_bytes);

    let mut rewriter = MarkerRewriter {
        js_payload,
        marker_found: false,
        max_data_end: 0,
        js_mem_offset: 0,
        original_memory_min: 0,
    };

    let parser = wasmparser_encoder::Parser::new(0);
    let mut component = wasm_encoder::Component::new();
    rewriter
        .parse_component(&mut component, parser, wasm_bytes)
        .map_err(|e| match e {
            Error::UserError(e) => e,
            Error::ParseError(e) => anyhow!("Failed to parse WASM component: {e}"),
            other => anyhow!("Failed to reencode WASM component: {other}"),
        })?;

    if !rewriter.marker_found {
        return Err(anyhow!(
            "No JS injection marker found in the WASM component. \
             Was it compiled with EmbeddingMode::BinarySlot?"
        ));
    }

    let mut output = component.finish();

    // Final binary patch: set JS_OFFSET in the marker to point to the JS data.
    // We do this as a post-pass because during Reencode we don't know the final
    // memory offset until after the data section has been fully processed.
    patch_js_offset_in_output(&mut output, rewriter.js_mem_offset)?;

    Ok(output)
}

/// Returns true if `data[offset..]` starts with a valid 36-byte marker pattern:
/// SLOT_MAGIC + any 4 bytes + SLOT_END_MAGIC
fn is_marker_at(data: &[u8], offset: usize) -> bool {
    offset + MARKER_SIZE <= data.len()
        && &data[offset..offset + 16] == SLOT_MAGIC
        && &data[offset + 20..offset + MARKER_SIZE] == SLOT_END_MAGIC
}

/// Finds the marker's byte offset within a data segment's raw bytes.
fn find_marker_in_data(data: &[u8]) -> Option<usize> {
    if data.len() < MARKER_SIZE {
        return None;
    }
    (0..=data.len() - MARKER_SIZE).find(|&i| is_marker_at(data, i))
}

struct MarkerRewriter {
    js_payload: Vec<u8>,
    marker_found: bool,
    /// Tracks the highest memory address used by existing active data segments.
    max_data_end: u32,
    /// The memory offset where the JS payload will be placed.
    js_mem_offset: u32,
    /// The original memory minimum pages (before we grow it).
    original_memory_min: u32,
}

impl Reencode for MarkerRewriter {
    type Error = anyhow::Error;

    fn parse_data(
        &mut self,
        data: &mut wasm_encoder::DataSection,
        datum: wasmparser_encoder::Data<'_>,
    ) -> Result<(), Error<Self::Error>> {
        // Track the highest memory address used by active data segments on memory 0
        if let wasmparser_encoder::DataKind::Active {
            memory_index: 0,
            offset_expr,
        } = &datum.kind
        {
            if let Some(offset) = eval_const_i32(offset_expr) {
                let end = offset.saturating_add(datum.data.len() as u32);
                self.max_data_end = self.max_data_end.max(end);
            }
        }

        // Check if this segment contains the marker
        if find_marker_in_data(datum.data).is_some() {
            if self.marker_found {
                return Err(Error::UserError(anyhow!(
                    "Found multiple JS injection markers — expected exactly 1"
                )));
            }
            self.marker_found = true;
        }

        // Emit segment unchanged — the marker's JS_OFFSET stays 0 for now.
        // We'll patch JS_OFFSET in the final output via patch_js_offset_in_output.
        wasm_encoder::reencode::utils::parse_data(self, data, datum)
    }

    fn parse_data_section(
        &mut self,
        data: &mut wasm_encoder::DataSection,
        section: wasmparser_encoder::DataSectionReader<'_>,
    ) -> Result<(), Error<Self::Error>> {
        // Process all existing segments
        wasm_encoder::reencode::utils::parse_data_section(self, data, section)?;

        if self.marker_found {
            // Place JS payload page-aligned after all existing data
            self.js_mem_offset = page_align(self.max_data_end);

            // Add a new active data segment with JS payload at the computed offset
            let offset = wasm_encoder::ConstExpr::i32_const(self.js_mem_offset as i32);
            data.active(0, &offset, self.js_payload.iter().copied());
        }

        Ok(())
    }

    fn data_count(&mut self, count: u32) -> Result<u32, Error<Self::Error>> {
        // Add 1 for the extra JS data segment we'll append.
        Ok(count + 1)
    }

    fn parse_memory_section(
        &mut self,
        memories: &mut wasm_encoder::MemorySection,
        section: wasmparser_encoder::MemorySectionReader<'_>,
    ) -> Result<(), Error<Self::Error>> {
        for memory in section {
            let memory = memory.map_err(Error::ParseError)?;

            self.original_memory_min = memory.initial as u32;

            // Grow memory to fit the JS payload placed at the end.
            // We use original_min_pages * PAGE_SIZE as an upper bound for max_data_end
            // (actual max_data_end computed later, but it can't exceed the original memory).
            // The JS payload goes at page_align(max_data_end) which is at most
            // original_min * PAGE_SIZE (already page-aligned).
            let js_end_upper =
                self.original_memory_min * WASM_PAGE_SIZE + self.js_payload.len() as u32;
            let pages_needed = (js_end_upper + WASM_PAGE_SIZE - 1) / WASM_PAGE_SIZE;
            let new_min = pages_needed.max(memory.initial as u32);
            let new_max = memory.maximum.map(|m| (m as u64).max(new_min as u64));

            memories.memory(wasm_encoder::MemoryType {
                minimum: new_min as u64,
                maximum: new_max,
                memory64: memory.memory64,
                shared: memory.shared,
                page_size_log2: memory.page_size_log2,
            });
        }
        Ok(())
    }
}

impl ReencodeComponent for MarkerRewriter {}

/// Evaluate a const expression to an i32 value (handles i32.const only).
fn eval_const_i32(expr: &wasmparser_encoder::ConstExpr<'_>) -> Option<u32> {
    let mut reader = expr.get_operators_reader();
    if let Ok(op) = reader.read() {
        if let wasmparser_encoder::Operator::I32Const { value } = op {
            return Some(value as u32);
        }
    }
    None
}

fn page_align(addr: u32) -> u32 {
    (addr + WASM_PAGE_SIZE - 1) & !(WASM_PAGE_SIZE - 1)
}

/// Post-pass: find the marker in the output bytes and patch JS_OFFSET from 0
/// to the actual JS memory offset. This is a 4-byte in-place write.
fn patch_js_offset_in_output(output: &mut [u8], js_mem_offset: u32) -> anyhow::Result<()> {
    let mut found = None;
    for i in 0..output.len().saturating_sub(MARKER_SIZE) {
        if is_marker_at(output, i) {
            // Only patch markers with JS_OFFSET == 0 (unpatched)
            let current = u32::from_le_bytes(output[i + 16..i + 20].try_into().unwrap());
            if current == 0 {
                if found.is_some() {
                    return Err(anyhow!("Multiple unpatched markers found in output"));
                }
                found = Some(i);
            }
        }
    }
    let pos = found.ok_or_else(|| anyhow!("Could not find marker in reencoded output"))?;
    output[pos + 16..pos + 20].copy_from_slice(&js_mem_offset.to_le_bytes());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_marker_file() {
        let marker = create_marker_file();
        assert_eq!(marker.len(), MARKER_SIZE);
        assert_eq!(&marker[..16], SLOT_MAGIC.as_slice());
        assert_eq!(u32::from_le_bytes(marker[16..20].try_into().unwrap()), 0);
        assert_eq!(&marker[20..], SLOT_END_MAGIC.as_slice());
    }

    #[test]
    fn test_find_marker_in_data() {
        let marker = create_marker_file();
        assert_eq!(find_marker_in_data(&marker), Some(0));

        // Marker embedded in larger data
        let mut data = vec![0xAA; 100];
        data.extend_from_slice(&marker);
        data.extend_from_slice(&[0xBB; 50]);
        assert_eq!(find_marker_in_data(&data), Some(100));

        // No marker
        assert_eq!(find_marker_in_data(&[0u8; 100]), None);
        assert_eq!(find_marker_in_data(&[0u8; 10]), None);
    }

    #[test]
    fn test_inject_no_marker() {
        let component = wasm_encoder::Component::new();
        let bytes = component.finish();
        let result = inject_js_into_bytes(&bytes, "x");
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("No JS injection marker found"));
    }

    #[test]
    fn test_page_align() {
        assert_eq!(page_align(0), 0);
        assert_eq!(page_align(1), WASM_PAGE_SIZE);
        assert_eq!(page_align(WASM_PAGE_SIZE), WASM_PAGE_SIZE);
        assert_eq!(page_align(WASM_PAGE_SIZE + 1), 2 * WASM_PAGE_SIZE);
    }
}
