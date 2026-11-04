// JS functions for the node streams implementation
pub const STREAM_JS: &str = include_str!("stream.js");

// Legacy public modules capture the corresponding constructor when first
// loaded. Their facades share that default while owning separate named exports.
pub const READABLE_ALIAS_JS: &str = r#"
import stream from 'node:stream';
export default stream.Readable;
"#;
pub const WRITABLE_ALIAS_JS: &str = r#"
import stream from 'node:stream';
export default stream.Writable;
"#;
pub const DUPLEX_ALIAS_JS: &str = r#"
import stream from 'node:stream';
export default stream.Duplex;
"#;

// Export-name metadata only: these sources are parsed by the facade generator,
// never evaluated. CJS must not read constructor statics; the public ESM facade
// owns their initial value snapshot and later synchronization.
pub const READABLE_ALIAS_EXPORTS_JS: &str = r#"
import stream from 'node:stream';
const ctor = stream.Readable;
export default ctor;
export const ReadableState = ctor.ReadableState;
export const _fromList = ctor._fromList;
export const from = ctor.from;
export const fromWeb = ctor.fromWeb;
export const toWeb = ctor.toWeb;
export const wrap = ctor.wrap;
"#;
pub const WRITABLE_ALIAS_EXPORTS_JS: &str = r#"
import stream from 'node:stream';
const ctor = stream.Writable;
export default ctor;
export const WritableState = ctor.WritableState;
export const fromWeb = ctor.fromWeb;
export const toWeb = ctor.toWeb;
"#;
pub const DUPLEX_ALIAS_EXPORTS_JS: &str = r#"
import stream from 'node:stream';
const ctor = stream.Duplex;
export default ctor;
export const from = ctor.from;
export const fromWeb = ctor.fromWeb;
export const toWeb = ctor.toWeb;
"#;
pub const TRANSFORM_ALIAS_JS: &str = r#"
import stream from 'node:stream';
export default stream.Transform;
"#;
pub const PASSTHROUGH_ALIAS_JS: &str = r#"
import stream from 'node:stream';
export default stream.PassThrough;
"#;

// JS functions for the node stream/promises implementation
pub const STREAM_PROMISES_JS: &str = include_str!("stream_promises.js");

// JS functions for the node stream/consumers implementation
pub const STREAM_CONSUMERS_JS: &str = include_str!("stream_consumers.js");

// Re-exports for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:stream'; export { default } from 'node:stream';"#;
pub const REEXPORT_PROMISES_JS: &str =
    r#"export * from 'node:stream/promises'; export { default } from 'node:stream/promises';"#;
pub const REEXPORT_CONSUMERS_JS: &str =
    r#"export * from 'node:stream/consumers'; export { default } from 'node:stream/consumers';"#;
