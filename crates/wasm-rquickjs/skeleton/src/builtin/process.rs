// Native functions for the process implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use std::collections::HashMap;

    #[rquickjs::function]
    pub fn get_args() -> Vec<String> {
        std::env::args().collect()
    }

    #[rquickjs::function]
    pub fn get_env() -> HashMap<String, String> {
        std::env::vars().collect()
    }
}

// JS functions for the process implementation
pub const PROCESS_JS: &str = include_str!("process.js");
