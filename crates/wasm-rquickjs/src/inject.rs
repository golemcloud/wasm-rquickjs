use anyhow::{Context, anyhow};
use camino::Utf8Path;
use wasm_encoder::reencode::{Error, Reencode, ReencodeComponent};

/// Magic bytes identifying a wasm-rquickjs JS injection marker.
pub const SLOT_MAGIC: &[u8; 16] = b"WASM_RQJS_SLOT\x01\x00";

/// Magic bytes at the end of a marker, used to validate integrity.
pub const SLOT_END_MAGIC: &[u8; 16] = b"WASM_RQJS_SLTND\x00";

/// Total size of the marker: MAGIC(16) + MODULE_INDEX(4) + JS_OFFSET(4) + END_MAGIC(16) = 40 bytes.
/// MODULE_INDEX identifies which JS module slot this is (0 = primary, 1+ = additional).
/// JS_OFFSET is a pointer into linear memory. Value 0 = no JS injected.
const MARKER_SIZE: usize = 40;

const WASM_PAGE_SIZE: u32 = 65536;

/// Creates a 40-byte marker file. Layout:
///
/// ```text
/// [MAGIC 16 bytes][MODULE_INDEX u32 LE][JS_OFFSET u32 LE = 0][END_MAGIC 16 bytes]
/// ```
///
/// MODULE_INDEX identifies which JS module this slot is for (0 = primary export module,
/// 1+ = additional modules in order).
/// JS_OFFSET=0 indicates no JS has been injected. After injection, JS_OFFSET
/// points to a memory location containing `[JS_LEN u32 LE][JS bytes]`.
pub fn create_marker_file(module_index: u32) -> Vec<u8> {
    let mut data = Vec::with_capacity(MARKER_SIZE);
    data.extend_from_slice(SLOT_MAGIC);
    data.extend_from_slice(&module_index.to_le_bytes());
    data.extend_from_slice(&0u32.to_le_bytes()); // js_offset = 0 (not injected)
    data.extend_from_slice(SLOT_END_MAGIC);
    data
}

/// Injects JavaScript source code into a compiled WASM component that was built with
/// `EmbeddingMode::BinarySlot`.
///
/// This structurally rewrites the WASM component using `wasmparser` + `wasm-encoder`:
/// 1. Finds data segments containing 40-byte markers and records their module indices.
/// 2. Grows the core module's memory to fit all new JS data segments.
/// 3. Adds new active data segments at the end of memory containing the JS for each module.
/// 4. Updates the DataCount section to account for the extra segments.
///
/// There is no capacity limit — each JS source can be any size.
///
/// The `js_sources` slice maps by position to marker MODULE_INDEX: the first entry
/// is injected into the marker with MODULE_INDEX=0, the second into MODULE_INDEX=1, etc.
pub fn inject_js_into_component(
    input: &Utf8Path,
    output: &Utf8Path,
    js_sources: &[&str],
) -> anyhow::Result<()> {
    let wasm_bytes = std::fs::read(input.as_std_path())
        .with_context(|| format!("Failed to read input component: {input}"))?;

    let patched = inject_js_into_bytes(&wasm_bytes, js_sources)?;

    std::fs::write(output.as_std_path(), &patched)
        .with_context(|| format!("Failed to write output component: {output}"))?;

    Ok(())
}

/// Injects JavaScript sources into WASM component bytes, returning the patched bytes.
///
/// Each entry in `js_sources` corresponds to a marker MODULE_INDEX (0, 1, 2, ...).
pub fn inject_js_into_bytes(wasm_bytes: &[u8], js_sources: &[&str]) -> anyhow::Result<Vec<u8>> {
    if js_sources.is_empty() {
        return Err(anyhow!("No JS sources provided for injection"));
    }

    // Build JS payloads: for each source, LEN(4) + JS bytes
    let js_payloads: Vec<Vec<u8>> = js_sources
        .iter()
        .map(|src| {
            let js_bytes = src.as_bytes();
            let mut payload = Vec::with_capacity(4 + js_bytes.len());
            payload.extend_from_slice(&(js_bytes.len() as u32).to_le_bytes());
            payload.extend_from_slice(js_bytes);
            payload
        })
        .collect();

    let total_payload_size: usize = js_payloads.iter().map(|p| p.len()).sum();

    let mut rewriter = MarkerRewriter {
        js_payloads,
        total_payload_size,
        markers_found: Vec::new(),
        max_data_end: 0,
        js_mem_offsets: Vec::new(),
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

    if rewriter.markers_found.is_empty() {
        return Err(anyhow!(
            "No JS injection markers found in the WASM component. \
             Was it compiled with EmbeddingMode::BinarySlot?"
        ));
    }

    // Verify all expected markers were found
    for i in 0..js_sources.len() as u32 {
        if !rewriter.markers_found.contains(&i) {
            return Err(anyhow!(
                "JS injection marker with MODULE_INDEX={i} not found in the WASM component. \
                 Expected {expected} markers but only found: {found:?}",
                expected = js_sources.len(),
                found = rewriter.markers_found,
            ));
        }
    }

    let mut output = component.finish();

    // Final binary patch: set JS_OFFSET in each marker to point to its JS data.
    patch_js_offsets_in_output(&mut output, &rewriter.js_mem_offsets)?;

    Ok(output)
}

/// Returns true if `data[offset..]` starts with a valid 40-byte marker pattern:
/// SLOT_MAGIC(16) + MODULE_INDEX(4) + JS_OFFSET(4) + SLOT_END_MAGIC(16)
fn is_marker_at(data: &[u8], offset: usize) -> bool {
    offset + MARKER_SIZE <= data.len()
        && &data[offset..offset + 16] == SLOT_MAGIC
        && &data[offset + 24..offset + MARKER_SIZE] == SLOT_END_MAGIC
}

/// Reads the MODULE_INDEX field from a marker at the given offset.
fn marker_module_index(data: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes(data[offset + 16..offset + 20].try_into().unwrap())
}

/// Reads the JS_OFFSET field from a marker at the given offset.
fn marker_js_offset(data: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes(data[offset + 20..offset + 24].try_into().unwrap())
}

/// Finds the marker's byte offset within a data segment's raw bytes.
fn find_marker_in_data(data: &[u8]) -> Option<usize> {
    if data.len() < MARKER_SIZE {
        return None;
    }
    (0..=data.len() - MARKER_SIZE).find(|&i| is_marker_at(data, i))
}

struct MarkerRewriter {
    /// JS payloads indexed by module index: payloads[0] for MODULE_INDEX=0, etc.
    js_payloads: Vec<Vec<u8>>,
    /// Total size of all JS payloads combined (for memory growth calculation).
    total_payload_size: usize,
    /// Module indices of markers found during the data section scan.
    markers_found: Vec<u32>,
    /// Tracks the highest memory address used by existing active data segments.
    max_data_end: u32,
    /// Memory offsets where each JS payload will be placed, indexed by module index.
    js_mem_offsets: Vec<(u32, u32)>,
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
            && let Some(offset) = eval_const_i32(offset_expr)
        {
            let end = offset.saturating_add(datum.data.len() as u32);
            self.max_data_end = self.max_data_end.max(end);
        }

        // Check if this segment contains a marker and record its module index
        if let Some(marker_offset) = find_marker_in_data(datum.data) {
            let module_index = marker_module_index(datum.data, marker_offset);
            if self.markers_found.contains(&module_index) {
                return Err(Error::UserError(anyhow!(
                    "Found duplicate JS injection marker with MODULE_INDEX={module_index}"
                )));
            }
            self.markers_found.push(module_index);
        }

        // Emit segment unchanged — the marker's JS_OFFSET stays 0 for now.
        // We'll patch JS_OFFSET in the final output via patch_js_offsets_in_output.
        wasm_encoder::reencode::utils::parse_data(self, data, datum)
    }

    fn parse_data_section(
        &mut self,
        data: &mut wasm_encoder::DataSection,
        section: wasmparser_encoder::DataSectionReader<'_>,
    ) -> Result<(), Error<Self::Error>> {
        // Process all existing segments
        wasm_encoder::reencode::utils::parse_data_section(self, data, section)?;

        // For each found marker (sorted by module index), add a data segment.
        //
        // Placement must be past BOTH:
        //   - the highest existing active data segment (`max_data_end`), and
        //   - the original linear-memory floor (`original_memory_min * PAGE`).
        //
        // wasm-ld typically reserves a heap region between `__heap_base`
        // (right after `__data_end`) and `memory.initial * PAGE_SIZE` for
        // `dlmalloc` / the Rust global allocator. `max_data_end` lives below
        // that region, so a naive `page_align(max_data_end)` placement would
        // drop the new JS data segment INSIDE the live heap window — and at
        // cold-start the allocator would walk those JS source bytes as free-
        // chunk metadata and trap OOB. Clamping to the original memory floor
        // pushes the JS into fresh memory grown by `parse_memory_section`.
        let mut current_offset =
            page_align(self.max_data_end).max(self.original_memory_min * WASM_PAGE_SIZE);
        let mut sorted_indices = self.markers_found.clone();
        sorted_indices.sort();

        for module_index in sorted_indices {
            if let Some(payload) = self.js_payloads.get(module_index as usize) {
                let offset_expr = wasm_encoder::ConstExpr::i32_const(current_offset as i32);
                data.active(0, &offset_expr, payload.iter().copied());
                self.js_mem_offsets.push((module_index, current_offset));
                current_offset = page_align(current_offset + payload.len() as u32);
            }
        }

        Ok(())
    }

    fn data_count(&mut self, count: u32) -> Result<u32, Error<Self::Error>> {
        // Add 1 for each extra JS data segment we'll append.
        Ok(count + self.js_payloads.len() as u32)
    }

    fn parse_memory_section(
        &mut self,
        memories: &mut wasm_encoder::MemorySection,
        section: wasmparser_encoder::MemorySectionReader<'_>,
    ) -> Result<(), Error<Self::Error>> {
        for memory in section {
            let memory = memory.map_err(Error::ParseError)?;

            self.original_memory_min = memory.initial as u32;

            // Grow memory to fit all JS payloads placed at the end.
            // Upper bound: original memory + total payload size + page alignment padding per payload.
            let max_padding = self.js_payloads.len() as u32 * WASM_PAGE_SIZE;
            let js_end_upper = self.original_memory_min * WASM_PAGE_SIZE
                + self.total_payload_size as u32
                + max_padding;
            let pages_needed = js_end_upper.div_ceil(WASM_PAGE_SIZE);
            let new_min = pages_needed.max(memory.initial as u32);
            let new_max = memory.maximum.map(|m| m.max(new_min as u64));

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
    if let Ok(wasmparser_encoder::Operator::I32Const { value }) = reader.read() {
        return Some(value as u32);
    }
    None
}

fn page_align(addr: u32) -> u32 {
    (addr + WASM_PAGE_SIZE - 1) & !(WASM_PAGE_SIZE - 1)
}

/// Post-pass: find all markers in the output bytes and patch JS_OFFSET for each.
/// `offsets` is a list of (module_index, js_mem_offset) pairs.
fn patch_js_offsets_in_output(output: &mut [u8], offsets: &[(u32, u32)]) -> anyhow::Result<()> {
    // Collect all marker positions with their module indices
    let mut marker_positions: Vec<(usize, u32)> = Vec::new();
    for i in 0..output.len().saturating_sub(MARKER_SIZE) {
        if is_marker_at(output, i) {
            let module_idx = marker_module_index(output, i);
            let js_off = marker_js_offset(output, i);
            // Only patch markers with JS_OFFSET == 0 (unpatched)
            if js_off == 0 {
                marker_positions.push((i, module_idx));
            }
        }
    }

    for &(module_index, js_mem_offset) in offsets {
        let pos = marker_positions
            .iter()
            .find(|(_, idx)| *idx == module_index)
            .map(|(pos, _)| *pos)
            .ok_or_else(|| {
                anyhow!(
                    "Could not find unpatched marker with MODULE_INDEX={module_index} \
                     in reencoded output"
                )
            })?;
        // Patch JS_OFFSET at offset 20 (after MAGIC(16) + MODULE_INDEX(4))
        output[pos + 20..pos + 24].copy_from_slice(&js_mem_offset.to_le_bytes());
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Capability gates patching
// ---------------------------------------------------------------------------

/// Magic prefix of the capability-gates slot embedded by the skeleton.
pub const CAPABILITY_GATES_MAGIC: &[u8; 16] = b"WASM_RQJS_CAPS\x01\x00";

/// Magic suffix of the capability-gates slot, used to validate the slot's
/// integrity before patching.
pub const CAPABILITY_GATES_END_MAGIC: &[u8; 16] = b"WASM_RQJS_CAPSND";

/// Total size of the capability-gates slot: MAGIC(16) + GATES(8) + END_MAGIC(16).
const CAPABILITY_GATES_SLOT_SIZE: usize = 40;

/// Locate every capability-gates slot in the raw bytes of `wasm`. Returns the
/// offsets of the magic prefixes, in the order they appear.
///
/// The slot is embedded by the skeleton via `#[link_section]` and ends up
/// inside an active data segment, so its 16-byte magic is preserved verbatim
/// in the wasm binary. Searching for the magic + end-magic pair is sufficient
/// to locate it without parsing the module structure.
///
/// A wasm component embedding the skeleton may contain the slot more than once
/// (e.g. the same module appearing in multiple core modules of a component, or
/// post-wizer snapshot data). All copies must be patched together so they
/// agree on the same gate values.
fn find_capability_gates_slots(wasm: &[u8]) -> Vec<usize> {
    let mut out = Vec::new();
    if wasm.len() < CAPABILITY_GATES_SLOT_SIZE {
        return out;
    }
    let limit = wasm.len() - CAPABILITY_GATES_SLOT_SIZE;
    let mut i = 0;
    while i <= limit {
        if &wasm[i..i + 16] == CAPABILITY_GATES_MAGIC
            && &wasm[i + 24..i + CAPABILITY_GATES_SLOT_SIZE] == CAPABILITY_GATES_END_MAGIC
        {
            out.push(i);
            // Slots cannot overlap; skip past the matched region.
            i += CAPABILITY_GATES_SLOT_SIZE;
        } else {
            i += 1;
        }
    }
    out
}

/// Patch every capability-gates bitset embedded in `wasm` to the given value.
///
/// Bit `i` corresponds to the skeleton's `Capability` variant with discriminant
/// `i`. Setting a bit enables that capability; clearing it disables the
/// capability so the skeleton skips its module registration and global wiring.
/// Combined with a downstream wasm-level dead-code elimination pass, disabled
/// capabilities also drop their host imports (`wasi:filesystem`, `wasi:sockets`,
/// etc.).
///
/// Returns an error if the capability-gates marker is not present in `wasm`,
/// which generally means the skeleton was built without the capability-gates
/// support or the slot has been stripped already.
pub fn patch_capability_gates_in_bytes(
    wasm: &[u8],
    enabled_bits: u64,
) -> anyhow::Result<Vec<u8>> {
    let positions = find_capability_gates_slots(wasm);
    if positions.is_empty() {
        return Err(anyhow!(
            "Capability-gates marker not found in WASM. The component does not appear \
             to support per-capability trimming, or the marker has been stripped."
        ));
    }

    let mut out = wasm.to_vec();
    let bytes = enabled_bits.to_le_bytes();
    for pos in positions {
        out[pos + 16..pos + 24].copy_from_slice(&bytes);
    }
    Ok(out)
}

/// Read the current capability-gates bitset from `wasm`. Useful for round-trip
/// testing and for letting callers see what the slot was patched with last.
///
/// If multiple slots are present, this returns the value from the first one
/// and asserts that they all agree. Disagreement indicates a partial patch
/// (likely a bug) and is reported as an error.
pub fn read_capability_gates_from_bytes(wasm: &[u8]) -> anyhow::Result<u64> {
    let positions = find_capability_gates_slots(wasm);
    let first = *positions
        .first()
        .ok_or_else(|| anyhow!("Capability-gates marker not found in WASM"))?;
    let value = u64::from_le_bytes(wasm[first + 16..first + 24].try_into().unwrap());
    for &pos in &positions[1..] {
        let v = u64::from_le_bytes(wasm[pos + 16..pos + 24].try_into().unwrap());
        if v != value {
            return Err(anyhow!(
                "Capability-gates slots disagree: slot at offset {first} = {value:#x}, \
                 slot at offset {pos} = {v:#x}. The wasm has been partially patched."
            ));
        }
    }
    Ok(value)
}

/// File-level convenience wrapper around [`patch_capability_gates_in_bytes`].
pub fn patch_capability_gates(
    input: &Utf8Path,
    output: &Utf8Path,
    enabled_bits: u64,
) -> anyhow::Result<()> {
    let bytes = std::fs::read(input.as_std_path())
        .with_context(|| format!("Failed to read input component: {input}"))?;
    let patched = patch_capability_gates_in_bytes(&bytes, enabled_bits)?;
    std::fs::write(output.as_std_path(), &patched)
        .with_context(|| format!("Failed to write output component: {output}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_marker_file() {
        let marker = create_marker_file(0);
        assert_eq!(marker.len(), MARKER_SIZE);
        assert_eq!(&marker[..16], SLOT_MAGIC.as_slice());
        assert_eq!(u32::from_le_bytes(marker[16..20].try_into().unwrap()), 0); // module_index
        assert_eq!(u32::from_le_bytes(marker[20..24].try_into().unwrap()), 0); // js_offset
        assert_eq!(&marker[24..], SLOT_END_MAGIC.as_slice());

        let marker1 = create_marker_file(1);
        assert_eq!(u32::from_le_bytes(marker1[16..20].try_into().unwrap()), 1);
        assert_eq!(u32::from_le_bytes(marker1[20..24].try_into().unwrap()), 0);
    }

    #[test]
    fn test_find_marker_in_data() {
        let marker = create_marker_file(0);
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
        let result = inject_js_into_bytes(&bytes, &["x"]);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("No JS injection markers found")
        );
    }

    #[test]
    fn test_page_align() {
        assert_eq!(page_align(0), 0);
        assert_eq!(page_align(1), WASM_PAGE_SIZE);
        assert_eq!(page_align(WASM_PAGE_SIZE), WASM_PAGE_SIZE);
        assert_eq!(page_align(WASM_PAGE_SIZE + 1), 2 * WASM_PAGE_SIZE);
    }

    /// Build a synthetic 40-byte capability-gates slot with the given bitset
    /// to mirror the layout produced by the skeleton's static initializer.
    fn build_test_gates_slot(gates: u64) -> Vec<u8> {
        let mut v = Vec::with_capacity(CAPABILITY_GATES_SLOT_SIZE);
        v.extend_from_slice(CAPABILITY_GATES_MAGIC);
        v.extend_from_slice(&gates.to_le_bytes());
        v.extend_from_slice(CAPABILITY_GATES_END_MAGIC);
        v
    }

    #[test]
    fn test_capability_gates_magic_lengths() {
        assert_eq!(CAPABILITY_GATES_MAGIC.len(), 16);
        assert_eq!(CAPABILITY_GATES_END_MAGIC.len(), 16);
        assert_ne!(CAPABILITY_GATES_MAGIC, CAPABILITY_GATES_END_MAGIC);
    }

    #[test]
    fn test_find_capability_gates_slot_at_zero() {
        let slot = build_test_gates_slot(u64::MAX);
        assert_eq!(find_capability_gates_slots(&slot), vec![0]);
    }

    #[test]
    fn test_find_capability_gates_slot_embedded() {
        let mut wasm = vec![0xAA; 1234];
        let slot = build_test_gates_slot(0x1234_5678_9abc_def0);
        wasm.extend_from_slice(&slot);
        wasm.extend_from_slice(&[0xBB; 100]);
        assert_eq!(find_capability_gates_slots(&wasm), vec![1234]);
    }

    #[test]
    fn test_find_capability_gates_slot_missing() {
        let buf = vec![0u8; 1024];
        assert!(find_capability_gates_slots(&buf).is_empty());
        // Too small to contain a slot at all
        assert!(find_capability_gates_slots(&[0u8; 10]).is_empty());
    }

    #[test]
    fn test_find_and_patch_multiple_capability_gates_slots() {
        // Components can embed the skeleton's data more than once. Make sure we
        // find each occurrence and that patching updates them all coherently.
        let mut wasm = vec![0u8; 0];
        wasm.extend_from_slice(&build_test_gates_slot(u64::MAX));
        wasm.extend_from_slice(&[0u8; 200]);
        wasm.extend_from_slice(&build_test_gates_slot(u64::MAX));
        wasm.extend_from_slice(&[0u8; 50]);
        wasm.extend_from_slice(&build_test_gates_slot(u64::MAX));

        let positions = find_capability_gates_slots(&wasm);
        assert_eq!(positions.len(), 3);

        let new_bits: u64 = 0x0123_4567_89ab_cdef;
        let patched = patch_capability_gates_in_bytes(&wasm, new_bits).unwrap();

        // All slots should now hold the same patched value, so reading reports it.
        assert_eq!(read_capability_gates_from_bytes(&patched).unwrap(), new_bits);

        // Sanity: each individual slot in the patched buffer carries the new value.
        let bytes = new_bits.to_le_bytes();
        for pos in find_capability_gates_slots(&patched) {
            assert_eq!(&patched[pos + 16..pos + 24], &bytes);
        }
    }

    #[test]
    fn test_patch_and_read_capability_gates_roundtrip() {
        let mut wasm = vec![0xCD; 200];
        wasm.extend_from_slice(&build_test_gates_slot(u64::MAX));
        wasm.extend_from_slice(&[0xEF; 200]);

        // Default reads as all-enabled.
        assert_eq!(read_capability_gates_from_bytes(&wasm).unwrap(), u64::MAX);

        // Patch to a specific bitset and confirm.
        let new_bits: u64 = 0xCAFE_BABE_DEAD_BEEF;
        let patched = patch_capability_gates_in_bytes(&wasm, new_bits).unwrap();
        assert_eq!(read_capability_gates_from_bytes(&patched).unwrap(), new_bits);

        // Surrounding bytes must be untouched.
        assert_eq!(&patched[..200], &wasm[..200]);
        assert_eq!(&patched[200 + CAPABILITY_GATES_SLOT_SIZE..], &wasm[200 + CAPABILITY_GATES_SLOT_SIZE..]);

        // Magic markers must be preserved across the patch.
        assert_eq!(&patched[200..200 + 16], CAPABILITY_GATES_MAGIC.as_slice());
        assert_eq!(
            &patched[200 + 24..200 + CAPABILITY_GATES_SLOT_SIZE],
            CAPABILITY_GATES_END_MAGIC.as_slice()
        );
    }

    #[test]
    fn test_patch_capability_gates_no_marker() {
        let buf = vec![0u8; 100];
        let result = patch_capability_gates_in_bytes(&buf, 0);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Capability-gates marker not found")
        );
    }

    #[test]
    fn test_capability_enabled_bits_helper() {
        use crate::capability_scan::{Capability, enabled_bits};

        // Empty set ⇒ all-zero bitmask
        assert_eq!(enabled_bits(std::iter::empty::<Capability>()), 0);

        // Single capability sets exactly its bit.
        let only_console = enabled_bits([Capability::Console]);
        assert_eq!(only_console, 1u64 << Capability::Console.bit_index());

        // Two unrelated capabilities OR together.
        let pair = enabled_bits([Capability::Fs, Capability::Sqlite]);
        assert_eq!(
            pair,
            (1u64 << Capability::Fs.bit_index()) | (1u64 << Capability::Sqlite.bit_index())
        );

        // The enum is laid out so all 52 bits fit inside the lower half of u64.
        let all_known: u64 = enabled_bits(crate::capability_scan::ALL_CAPABILITIES.iter().copied());
        assert_eq!(all_known.count_ones(), 52);
        // Bits 52..64 must be unused.
        assert_eq!(all_known & !((1u64 << 52) - 1), 0);
    }
}
