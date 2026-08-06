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

## Common workflows

| Command or workflow | Status | Intended boundary |
|---|---|---|
| `npm --version` | Supported | Guest CLI startup, isolated output, and exit status on Node 22.14.0/npm 10.9.2. |
| `npm --help` | Supported | Top-level usage output and npm's exit status. Command-specific help that delegates to a host man viewer is not claimed. |
| `npm config get` | Constrained | Effective cache and prefix values from isolated `npm_config_*` state are covered; config listing and mounted npmrc precedence are not covered yet. |
| `npm install` | Constrained | Local `file:` and deterministic-registry pure-JavaScript dependencies work with scripts disabled; a simple local `node` postinstall is covered. Public registries, proxies, authentication, and complex resolution are not covered. |
| `npm ci` | Constrained | A lockfile cleanly replaces `node_modules`, installs a local pure-JavaScript dependency, and leaves it loadable by a fresh execution job. |
| `npm ls`, `npm explain` | Constrained | `npm ls --json` reconstructs a guest-created tree, but currently reports a local `file:` dependency as invalid with `ELSPROBLEMS`; correct link identity is gated by GOL-388. `npm explain` coverage is retained separately. |
| `npm uninstall`, `npm update`, `npm dedupe` | Constrained | Local pure-JavaScript tree mutation with lifecycle scripts and bin links disabled. Revisiting a persisted `.bin` placeholder is gated by GOL-388; registry resolution and complex trees are not covered. |
| `npm pack` | Constrained | JSON metadata and file selection for a local pure-JavaScript project are covered with `--dry-run --ignore-scripts`; archive creation is not covered yet. |
| `npm run` | Constrained | Simple `node <script>` commands work with cwd, argv, npm environment, output, and exit status. Shell operators and external executables remain unsupported. Child scripts currently execute inline in the npm runtime rather than in a fresh runtime. |
| `npm test`, `npm start`, `npm restart`, `npm stop` | Planned | These aliases use lifecycle execution but are not directly covered yet. |
| `npm exec` | Deferred | GOL-388 must persist npm's emulated `.bin` symlink identity across fresh execution jobs. The current CLI fails explicitly with `ENOSYS` instead of invoking a wrong target. |
| `npx` | Deferred | Uses the same package-bin execution path as `npm exec`; local and acquired binaries require the GOL-388 symlink fix first. |
| `npm init` | Constrained | `npm init --yes` creates the default package manifest; interactive prompting and initializer packages are not covered. |
| npm workspaces and `npm link` | Deferred | GOL-388 must establish correct symlink and package identity behavior. |
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
| Lifecycle | `--ignore-scripts`, `--foreground-scripts` | Constrained | Scripts-disabled installation and a foreground `node` postinstall are covered. Shell operators and external executables fail explicitly. |
| Links | `--bin-links`, `--install-links` | Deferred | File dependencies can be materialized, and mutation works with `--bin-links=false`; persistent symlink identity and `.bin` launchers require GOL-388. |
| Network and cache | `--registry`, `--offline`, `--prefer-offline`, retry and proxy settings | Constrained | Registry metadata/tarballs go through `wasi:http`; fresh `npm ci --offline` restores from cache. A hanging request times out and releases execution capacity. Prefer-offline, proxies, and redacted failures remain planned. |
| Workspaces | `--workspace`, `--workspaces`, `--include-workspace-root` | Deferred | Requires the GOL-388 workspace/link identity work. |
| npm exec and npx | `--package`, `--call`, `--yes`, `--` | Deferred | The actual frontends are covered through their explicit `.bin`/`ENOSYS` failure; success requires GOL-388. |
| Global installation | `--global`, `--prefix` | Planned | The isolated prefix is observable, but global installation is not an initial supported workflow. |

## Package classes

| Package class | Status | Current boundary |
|---|---|---|
| Pure ESM, no scripts | Constrained | Covered from both `file:` and deterministic registry sources and imported in a later fresh job. |
| Pure CommonJS and mixed ESM/CommonJS | Constrained | Local installed fixtures are loaded in a later fresh job through CommonJS, ESM, and conditional export-map branches. Registry variants are not yet covered. |
| JavaScript-only lifecycle scripts | Constrained | A dependency postinstall consisting of one `node <script>` command is covered with cwd and npm environment assertions. |
| TypeScript entry points | Constrained | With the `typescript-transform-runtime` feature, a workspace `.ts` entry with transform-required syntax imports and runs an npm-installed JavaScript dependency in a fresh execution job. Raw TypeScript below `node_modules` retains Node's `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` boundary. |
| Packages invoking shell operators or external executables | Unsupported | General shells and host processes are unavailable; the tested shell-operator lifecycle fails with `ENOSYS` and performs no partial work. |
| Platform and optional dependencies | Constrained | Optional inclusion/omission is covered; OS/CPU filtering and tolerated optional installation failures remain planned. |
| Native addons and `node-gyp` | Unsupported | Components cannot load host `.node` files or spawn host compiler toolchains. |
| Packages containing portable WASM | Planned | WASM loading/runtime APIs require separate compatibility evidence. |
| `file:` dependencies | Constrained | Materialization and execution work; link validity, `.bin`, workspaces, and link identity remain gated by GOL-388. |
| Registry tarballs | Constrained | Deterministic metadata, download, cache reuse, offline ci, and later execution pass through `wasi:http`. |
| Workspaces, `npm link`, linked Git dependencies | Deferred | Requires persistent symlink/package identity from GOL-388; Git also requires an unavailable external executable. |

## Remaining progression

The P2 and P3 baseline covers CLI startup, config inspection, local and registry
installation, ci, offline cache restoration, fresh-job loading, JavaScript
lifecycle/run scripts, a `typescript-transform-runtime` workspace entry
consuming an installed JavaScript dependency, tree inspection and mutation,
init, pack dry-run, and the actual npm exec/npx failure boundary. Separate
component instances also perform different installs concurrently, and one then
repeats a clean install without workspace state crossing between them.

Next coverage should add peer-resolution and platform-filtering flags, network
error redaction, and public-registry smoke tests outside deterministic CI.
GOL-388 is the prerequisite for successful
`.bin`, npm exec/npx, workspace, and link workflows.
