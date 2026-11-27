#[rquickjs::module]
pub mod native_module {}

pub const SQLITE_JS: &str = r#"
const msg = 'node:sqlite is not available (sqlite feature is not enabled)';
class Database { constructor() { throw new Error(msg); } }
class Statement { constructor() { throw new Error(msg); } }
const DatabaseSync = Database;
const StatementSync = Statement;
const constants = {};
export { Database, DatabaseSync, Statement, StatementSync, constants };
export default { Database, DatabaseSync, Statement, StatementSync, constants };
"#;
