use crate::common::{CompiledTest, invoke_and_capture_output};
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("dns")]
    CompiledTest
);

#[test]
async fn dns_module_api(#[tagged_as("dns")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test", &[]).await;
    let result = result?;

    if let Some(Val::String(json_str)) = result {
        let result_obj: serde_json::Value = serde_json::from_str(&json_str)?;

        // Error codes
        assert!(
            result_obj["hasErrorCodes"].as_bool().unwrap_or(false),
            "dns error codes should exist"
        );

        // Functions exist
        assert!(
            result_obj["hasLookup"].as_bool().unwrap_or(false),
            "dns.lookup should exist"
        );
        assert!(
            result_obj["hasResolve"].as_bool().unwrap_or(false),
            "dns.resolve should exist"
        );
        assert!(
            result_obj["hasResolve4"].as_bool().unwrap_or(false),
            "dns.resolve4 should exist"
        );
        assert!(
            result_obj["hasResolve6"].as_bool().unwrap_or(false),
            "dns.resolve6 should exist"
        );
        assert!(
            result_obj["hasReverse"].as_bool().unwrap_or(false),
            "dns.reverse should exist"
        );
        assert!(
            result_obj["hasSetServers"].as_bool().unwrap_or(false),
            "dns.setServers should exist"
        );
        assert!(
            result_obj["hasGetServers"].as_bool().unwrap_or(false),
            "dns.getServers should exist"
        );
        assert!(
            result_obj["hasSetDefaultResultOrder"]
                .as_bool()
                .unwrap_or(false),
            "dns.setDefaultResultOrder should exist"
        );
        assert!(
            result_obj["hasGetDefaultResultOrder"]
                .as_bool()
                .unwrap_or(false),
            "dns.getDefaultResultOrder should exist"
        );

        // Resolver class
        assert!(
            result_obj["hasResolver"].as_bool().unwrap_or(false),
            "dns.Resolver should exist"
        );
        assert!(
            result_obj["resolverHasResolve"].as_bool().unwrap_or(false),
            "Resolver.resolve should exist"
        );
        assert!(
            result_obj["resolverHasLookup"].as_bool().unwrap_or(false),
            "Resolver.lookup should exist"
        );

        // Promises API
        assert!(
            result_obj["hasPromises"].as_bool().unwrap_or(false),
            "dns.promises should exist"
        );
        assert!(
            result_obj["promisesHasLookup"].as_bool().unwrap_or(false),
            "dns.promises.lookup should exist"
        );
        assert!(
            result_obj["promisesHasResolve"].as_bool().unwrap_or(false),
            "dns.promises.resolve should exist"
        );
        assert!(
            result_obj["promisesHasResolve4"].as_bool().unwrap_or(false),
            "dns.promises.resolve4 should exist"
        );
        assert!(
            result_obj["promisesHasResolve6"].as_bool().unwrap_or(false),
            "dns.promises.resolve6 should exist"
        );

        // setDefaultResultOrder / getDefaultResultOrder
        assert!(
            result_obj["resultOrderSet"].as_bool().unwrap_or(false),
            "setDefaultResultOrder should work"
        );

        // setServers / getServers
        assert!(
            result_obj["serversSet"].as_bool().unwrap_or(false),
            "setServers/getServers should work"
        );

        // IP passthrough
        assert!(
            result_obj["ipPassthrough"].as_bool().unwrap_or(false),
            "lookup('127.0.0.1') should pass through"
        );
        assert!(
            result_obj["ipv6Passthrough"].as_bool().unwrap_or(false),
            "lookup('::1') should pass through"
        );
        assert!(
            result_obj["nullHostname"].as_bool().unwrap_or(false),
            "lookup('') should return loopback"
        );
        assert!(
            result_obj["lookupAll"].as_bool().unwrap_or(false),
            "lookup with all:true should work"
        );

        // Promise lookup
        assert!(
            result_obj["promiseLookup"].as_bool().unwrap_or(false),
            "promises.lookup should work with IP"
        );

        // Family mismatch
        assert!(
            result_obj["familyMismatch"].as_bool().unwrap_or(false),
            "family mismatch should return ENOTFOUND"
        );

        // Unsupported record types
        assert!(
            result_obj["unsupportedMx"].as_bool().unwrap_or(false),
            "resolveMx should return ENOTIMP"
        );

        // Hint flags
        assert!(
            result_obj["hasAddrconfig"].as_bool().unwrap_or(false),
            "ADDRCONFIG should be 1024"
        );
        assert!(
            result_obj["hasV4mapped"].as_bool().unwrap_or(false),
            "V4MAPPED should be 8"
        );
        assert!(
            result_obj["hasAll"].as_bool().unwrap_or(false),
            "ALL should be 16"
        );
    } else {
        anyhow::bail!("Expected string result from test function");
    }

    Ok(())
}
