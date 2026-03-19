// Native functions for the os implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    /// Returns the operating system CPU architecture.
    /// Possible values: 'arm', 'arm64', 'ia32', 'loong64', 'mips', 'mipsel', 'ppc64', 'riscv64', 's390x', 'x64'
    #[rquickjs::function]
    pub fn arch() -> String {
        "wasi".to_string()
    }

    /// Returns an estimate of the default amount of parallelism a program should use. Always returns a value greater than zero.
    #[rquickjs::function]
    pub fn available_parallelism() -> u16 {
        1
    }

    /// Returns the endianness of the CPU ('BE' or 'LE').
    #[rquickjs::function]
    pub fn endianness() -> String {
        "LE".to_string()
    }

    /// Returns the operating system platform.
    /// Possible values: 'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32'
    #[rquickjs::function]
    pub fn platform() -> String {
        "wasm".to_string()
    }

    /// Returns the operating system release version.
    #[rquickjs::function]
    pub fn release() -> String {
        "0.2.3".to_string()
    }

    /// Returns the operating system name/type.
    /// Possible values: 'Linux', 'Darwin', 'Windows_NT', 'SunOS', 'FreeBSD', etc.
    #[rquickjs::function]
    pub fn type_() -> String {
        "wasm-rquickjs".to_string()
    }

    /// Returns the hostname of the machine.
    #[rquickjs::function]
    pub fn hostname() -> String {
        "localhost".to_string()
    }

    /// Returns the home directory path of the current user.
    #[rquickjs::function]
    pub fn homedir() -> String {
        "/".to_string()
    }

    /// Returns the machine type as a string, such as arm, arm64, aarch64, mips, mips64, ppc64, ppc64le, s390x, i386, i686, x86_64.
    #[rquickjs::function]
    pub fn machine() -> String {
        "wasm-rquickjs".to_string()
    }

    /// Returns the system uptime in seconds.
    #[rquickjs::function]
    pub fn uptime() -> f64 {
        let now_ns = wasip2::clocks::monotonic_clock::now();
        (now_ns as f64) / 1_000_000_000.0
    }

    /// Returns a string identifying the kernel version.
    #[rquickjs::function]
    pub fn version() -> String {
        "0.2.3".to_string()
    }
}

// JS functions for the os implementation
pub const OS_JS: &str = include_str!("os.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:os'; export { default } from 'node:os';"#;
