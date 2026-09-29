# Generated component licenses

`tools/check-component-licenses.sh` audits the locked dependency graph used by generated
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

`--check` fails for missing, unknown, unapproved, or stale license information. Changes to
`about.toml` require explicit maintainer/legal review; cargo-about output is not legal advice.

The generator copies the matching retained notice to
`THIRD_PARTY_COMPONENT_LICENSES.txt` in every generated crate. Distributors must ship that file
with the compiled component and add notices for their application dependencies. Profiles using
capabilities outside `normal` / `normal-p3` must be audited separately.
