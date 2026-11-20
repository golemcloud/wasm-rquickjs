use rquickjs::{Ctx, Exception};

use wasip3::sockets::ip_name_lookup::{ErrorCode, resolve_addresses};
use wasip3::sockets::types::IpAddress;

#[rquickjs::module]
pub mod native_module {
    pub use super::DnsResult;

    /// Resolve a hostname to a list of IP addresses.
    /// Returns a list of DnsResult objects with `address` (string) and `family` (4 or 6).
    #[rquickjs::function]
    pub async fn resolve(
        ctx: rquickjs::Ctx<'_>,
        hostname: String,
    ) -> rquickjs::Result<Vec<DnsResult>> {
        super::resolve_impl(&ctx, &hostname).await
    }
}

#[derive(rquickjs::class::Trace, rquickjs::JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct DnsResult {
    address: String,
    family: u32,
}

#[rquickjs::methods]
impl DnsResult {
    #[qjs(constructor)]
    pub fn new(address: String, family: u32) -> Self {
        Self { address, family }
    }

    #[qjs(get)]
    pub fn address(&self) -> &str {
        &self.address
    }

    #[qjs(get)]
    pub fn family(&self) -> u32 {
        self.family
    }
}

fn ip_address_to_string(addr: &IpAddress) -> String {
    match addr {
        IpAddress::Ipv4((a, b, c, d)) => format!("{a}.{b}.{c}.{d}"),
        IpAddress::Ipv6((a, b, c, d, e, f, g, h)) => {
            format!("{a:x}:{b:x}:{c:x}:{d:x}:{e:x}:{f:x}:{g:x}:{h:x}")
        }
    }
}

fn ip_address_family(addr: &IpAddress) -> u32 {
    match addr {
        IpAddress::Ipv4(_) => 4,
        IpAddress::Ipv6(_) => 6,
    }
}

// The Preview 3 `wasi:sockets/ip-name-lookup` `error-code` enum only carries the five variants
// below; the async ABI no longer surfaces `timeout`, `out-of-memory` or `not-supported`.
fn error_code_to_js(error: ErrorCode) -> &'static str {
    match error {
        ErrorCode::NameUnresolvable => "ENOTFOUND",
        ErrorCode::TemporaryResolverFailure => "ESERVFAIL",
        ErrorCode::PermanentResolverFailure => "ESERVFAIL",
        ErrorCode::AccessDenied => "EREFUSED",
        ErrorCode::InvalidArgument => "EBADNAME",
        _ => "ESERVFAIL",
    }
}

// On Preview 3 `resolve-addresses` is a single async call returning the full address list, so no
// stream polling is required.
async fn resolve_impl(ctx: &Ctx<'_>, hostname: &str) -> rquickjs::Result<Vec<DnsResult>> {
    crate::internal::preinit::check("DNS resolution", "hostname");
    match resolve_addresses(hostname.to_string()).await {
        Ok(addresses) => Ok(addresses
            .iter()
            .map(|addr| DnsResult {
                address: ip_address_to_string(addr),
                family: ip_address_family(addr),
            })
            .collect()),
        Err(e) => {
            let code = error_code_to_js(e);
            Err(Exception::throw_message(
                ctx,
                &format!("{{\"code\":\"{code}\",\"hostname\":\"{hostname}\"}}"),
            ))
        }
    }
}

pub const DNS_JS: &str = include_str!("dns.js");
pub const DNS_PROMISES_JS: &str = include_str!("dns_promises.js");

pub const REEXPORT_JS: &str = r#"export * from 'node:dns'; export { default } from 'node:dns';"#;
pub const REEXPORT_PROMISES_JS: &str =
    r#"export * from 'node:dns/promises'; export { default } from 'node:dns/promises';"#;
