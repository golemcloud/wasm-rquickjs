# npm and npx compatibility

This suite tracks package-management workflows that execute **inside**
wasm-rquickjs. It is separate from `tests/node_modules_apps`, where host npm
installs dependencies before the resulting filesystem tree is mounted into the
component.

The compatibility baseline is Node.js 22.14.0 with its bundled npm 10.9.2. The
test harness mounts that npm distribution from the host Node installation. It
does not download npm or use a mutable global npm installation as test state.

## Status vocabulary

| Status | Meaning |
|---|---|
| Supported | CI exercises the workflow through the guest npm/npx CLI. |
| Constrained | CI exercises the documented subset; unsupported cases fail explicitly. |
| Planned | The workflow is in scope but does not yet have passing guest coverage. |
| Deferred | Another named runtime capability must land first. |
| Unsupported | The component cannot honestly provide the required host capability. |

Command support and package support are independent. A working `npm install`
command does not imply that lifecycle scripts, native addons, Git dependencies,
or external executables work.

The npm 10.9.2 registry-install fixture also exercises its bundled
minizlib/node-tar stack. Supporting the private zlib handle shape used by that
pinned stack is version-scoped npm compatibility, not a general guarantee for
Node.js private zlib internals. The covered flow releases the private handle
without reusing the stream; post-close private-handle reuse is not supported.

## Common workflows

| Command or workflow | Status | Intended boundary |
|---|---|---|
| `npm --version` | Supported | Guest CLI startup, isolated output, and exit status on Node 22.14.0/npm 10.9.2. |
| `npm --help` | Supported | Top-level usage output and npm's exit status. Command-specific help that delegates to a host man viewer is not claimed. |
| `npm config get` | Constrained | Effective cache and prefix values from isolated `npm_config_*` state are covered; config listing and mounted npmrc precedence are not covered yet. |
| `npm install` | Constrained | Local `file:` and deterministic-registry pure-JavaScript dependencies work with scripts disabled; a simple local `node` postinstall is covered. Public registries, proxies, authentication, and complex resolution are not covered. |
| `npm ci` | Constrained | A lockfile cleanly replaces `node_modules`, installs a local pure-JavaScript dependency, and leaves it loadable by a fresh execution job. |
| `npm ls`, `npm explain` | Constrained | `npm ls --json` reconstructs a guest-created tree, but still reports the materialized local `file:` dependency as invalid with `ELSPROBLEMS`; this is distinct from linked-package realpath identity. `npm explain` coverage is retained separately. |
| `npm uninstall`, `npm update`, `npm dedupe` | Constrained | Local pure-JavaScript tree mutation with lifecycle scripts and bin links disabled. Registry resolution and complex linked trees are not covered. |
| `npm pack` | Constrained | JSON metadata and file selection for a local pure-JavaScript project are covered with `--dry-run --ignore-scripts`; archive creation is not covered yet. |
| `npm run` | Constrained | Simple `node <script>` commands dispatched by npm's literal `sh -c` form work with cwd, argv, npm environment, output, and exit status. `/bin/sh`, `shell: true`, shell operators, shell expansions, and external executables are not part of this data-only adapter and fail explicitly. Child scripts currently execute inline in the npm runtime rather than in a fresh runtime. |
| `npm test`, `npm start`, `npm restart`, `npm stop` | Planned | These aliases use lifecycle execution but are not directly covered yet. |
| `npm exec` | Constrained | Local and deterministic-registry JavaScript bins execute through persistent `.bin` symlinks in fresh runtimes. WASI does not expose executable permission bits, so only linked launchers with a supported Node shebang receive this portable-bin treatment; direct regular scripts still require the emulated executable bit. Native binaries, arbitrary shells, and host executables remain unsupported. |
| `npx` | Constrained | Local JavaScript bins use the same supported execution path as `npm exec`; package acquisition is covered through the equivalent `npm exec --package` frontend. |
| `npm init` | Constrained | `npm init --yes` creates the default package manifest; interactive prompting and initializer packages are not covered. |
| npm workspaces and `npm link` | Constrained | Local JavaScript workspace and `npm link` packages preserve realpath and single-module identity. Native executables and Windows hosts without symlink privilege remain outside this boundary. |
| `npm view` | Constrained | Version lookup against the deterministic registry is covered; public registry metadata variants and authentication are not. |
| `npm audit`, `npm search`, `npm outdated` | Planned | Additional registry endpoints and response formats are not part of the current deterministic fixture. |
| publish, login, token, access, and ownership commands | Unsupported initially | Remote mutation and credential management are outside the first compatibility target. |
| native addons, `node-gyp`, host compilers | Unsupported | WASI cannot load host `.node` files or spawn host toolchains. |
| arbitrary shell scripts and host executables | Unsupported | A component has no general host process or shell capability. |

## Flag families

| Family | Representative flags | Status | Current evidence and boundary |
|---|---|---|---|
| Output and diagnostics | `--json`, `--dry-run`, `--silent`, `--loglevel` | Constrained | JSON output and dry-run pack output are parsed; silent/loglevel combinations remain planned. |
| Dependency selection | `--omit`, `--include`, `--production` | Constrained | Required/dev/optional local fixtures verify repeated `--omit` and `--include`; the production alias and platform filtering remain planned. |
| Tree resolution | `--install-links`, `--install-strategy`, `--legacy-peer-deps`, `--strict-peer-deps` | Constrained | Local `file:` installation with `--install-links` is covered; peer and alternate tree strategies are not. |
| Lockfiles | `--package-lock`, `--package-lock-only` | Constrained | Install creates a lockfile, ci consumes it to replace the tree, and package-lock-only resolves local dependencies without materializing `node_modules`. |
| Lifecycle | `--ignore-scripts`, `--foreground-scripts` | Constrained | Scripts-disabled installation and a foreground `node` postinstall are covered. Shell operators, shell expansions, and external executables fail explicitly. |
| Links | `--bin-links`, `--install-links` | Constrained | Persistent `.bin`, workspace, `npm link`, and representative pnpm-style relative links preserve readlink, realpath, and module identity. Rooted targets cannot be resolved within a WASI preopen, so the adapter rejects them at creation. |
| Network and cache | `--registry`, `--offline`, `--prefer-offline`, retry and proxy settings | Constrained | Registry metadata/tarballs go through `wasi:http`; Agent-provided socket hooks are ignored with a warning rather than bypassing the component transport. Proxy Agents are therefore not enforced and must not be relied on to route or isolate traffic. Fresh `npm ci --offline` restores from cache. A hanging request times out and releases execution capacity. Prefer-offline, proxy-aware fail-closed behavior, and redacted failures remain planned. |
| Workspaces | `--workspace`, `--workspaces`, `--include-workspace-root` | Constrained | Default local workspace installation and linked package identity are covered; workspace-selection flags remain planned. |
| npm exec and npx | `--package`, `--call`, `--yes`, `--` | Constrained | Local bins and deterministic-registry acquisition cover `--package`, `--yes`, and argument forwarding through `--`; `--call` remains planned. |
| Global installation | `--global`, `--prefix` | Planned | The isolated prefix is observable, but global installation is not an initial supported workflow. |

## Package classes

| Package class | Status | Current boundary |
|---|---|---|
| Pure ESM, no scripts | Constrained | Covered from both `file:` and deterministic registry sources and imported in a later fresh job. |
| Pure CommonJS and mixed ESM/CommonJS | Constrained | Local installed fixtures are loaded in a later fresh job through CommonJS, ESM, and conditional export-map branches. Registry variants are not yet covered. |
| JavaScript-only lifecycle scripts | Constrained | A dependency postinstall consisting of one `node <script>` command is covered with cwd and npm environment assertions. |
| TypeScript entry points | Constrained | With the `typescript-transform-runtime` feature, a workspace `.ts` entry with transform-required syntax imports and runs an npm-installed JavaScript dependency in a fresh execution job. Raw TypeScript below `node_modules` retains Node's `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` boundary. |
| Packages invoking shell operators, shell expansions, or external executables | Unsupported | General shells and host processes are unavailable; tested operator, command-substitution, variable-expansion, glob, and line-continuation lifecycles fail with `ENOSYS` and perform no partial work. |
| Platform and optional dependencies | Constrained | Optional inclusion/omission is covered; OS/CPU filtering and tolerated optional installation failures remain planned. |
| Native addons and `node-gyp` | Unsupported | Components cannot load host `.node` files or spawn host compiler toolchains. |
| Packages containing portable WASM | Planned | WASM loading/runtime APIs require separate compatibility evidence. |
| `file:` dependencies | Constrained | Materialization, execution, `.bin`, workspace links, npm links, and later fresh-runtime identity are covered. |
| Registry tarballs | Constrained | Deterministic metadata, download, cache reuse, offline ci, and later execution pass through `wasi:http`. |
| Workspaces and `npm link` | Constrained | Local JavaScript packages preserve linked package identity. |
| Linked Git dependencies | Unsupported | Git requires an unavailable external executable. |

## Remaining progression

The P2 and P3 baseline covers CLI startup, config inspection, local and registry
installation, ci, offline cache restoration, fresh-job loading, JavaScript
lifecycle/run scripts, a `typescript-transform-runtime` workspace entry
consuming an installed JavaScript dependency, tree inspection and mutation,
init, pack dry-run, local npm exec/npx success, deterministic-registry bin
acquisition, workspaces, npm link, and pnpm-style module identity. Separate
component instances also perform different installs concurrently, and one then
repeats a clean install without workspace state crossing between them.

Next coverage should add peer-resolution and platform-filtering flags, network
error redaction, and public-registry smoke tests outside deterministic CI.
Linked workflows require persistent relative WASI symlinks. Production Golem
and macOS/Linux local development support them; Windows local development
currently requires Developer Mode or an equivalent privilege. Rooted symlink
targets are unsupported by WASI and fail atomically with `EINVAL`.
