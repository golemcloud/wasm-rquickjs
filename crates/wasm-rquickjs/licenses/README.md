# Generated component licenses

`tools/check-component-licenses.sh` audits the locked Cargo dependency graph used by generated
components. It checks both `typescript-runtime` and `typescript-transform-runtime` for the
standard P2 `normal` and P3 `normal-p3` profiles, all targeting `wasm32-wasip2`.

The repository retains one notice per WASI generation covering the union of both public
TypeScript feature closures rather than four near-duplicates. Build dependencies are included;
development dependencies are not. The policy is feature-driven and intentionally does not name
the current TypeScript backend, so replacing it changes the audited graph without bypassing the
gate.

Run the checker with cargo-about 0.9.2:

```bash
tools/check-component-licenses.sh --check
tools/check-component-licenses.sh --write
```

`--check` fails for missing, unknown, unapproved, stale, or known-placeholder license information.
The checked-in clarifications pin exact upstream or packaged license texts by SHA-256 when a
published crate does not carry usable attribution. Changes to `about.toml` require explicit
maintainer/legal review; cargo-about output is not legal advice.

There are two fail-closed local fallbacks where cargo-about 0.9.2 cannot resolve the published
repository metadata directly. `swc_sourcemap 10.0.2` points at the SWC monorepo while its VCS
revision and license live in the separate `swc-project/swc-sourcemap` repository. The
`rquickjs-core 0.10.0` and `rquickjs-macro 0.10.0` manifests use a repository URL ending in
`.git`, which cargo-about 0.9.2 passes through to GitHub's raw-content path and receives a 404.
The checker therefore replaces only those crates' exact generic fallback blocks with
`clarifications/swc_sourcemap-10.0.2-LICENSE` and
`clarifications/rquickjs-0.10.0-LICENSE`; both SHA-256 values are pinned in the script. The SWC
text is the upstream `swc-project/swc-sourcemap` BSD-3-Clause license introduced at commit
`8e6963c4e880190b1c680634bda3c565d1522daf`; a shape or hash change fails generation.

The generator copies the matching retained notice to
`THIRD_PARTY_COMPONENT_LICENSES.txt` in every generated crate. It is deliberately a target-specific
superset when a user enables fewer features than the standard TypeScript profile. Distributors
must ship that file with the compiled component and add notices for their application dependencies.
Profiles using capabilities outside `normal` / `normal-p3` must be audited separately.

This Cargo audit is only one release-compliance input. It does not inventory the Rust standard
library, `core`, `alloc`, `compiler_builtins`, a WASI SDK/sysroot, separately licensed native files
vendored inside a crate, bundled JavaScript in the skeleton (including third-party code adapted from
Node.js, Deno, and web-streams-polyfill), or upstream Apache `NOTICE` files. Release owners must
audit those inputs for the concrete toolchain and distribution, along with any application
JavaScript and Rust code. Source-level copyright headers already present in the skeleton remain in
the generated crate, but this Cargo notice does not claim to inventory them. The unpublished
repository-owned skeleton root is excluded from the Cargo third-party list. Code generation also
removes its `publish = false` marker (and any future skeleton license field), because wrapper-crate
publication and licensing belong to the owner of the embedded application.
