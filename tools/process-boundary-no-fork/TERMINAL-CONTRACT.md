# Terminal process completion contract

This is an opt-in integration target, exercised by an isolated fixture. It is
not an implemented public WRQ API or the shipped Golem tool contract.

## Ownership

The native component export owns the invocation, status and output attachments.
Its Rust controller owns dispatch while the CLI runs. The CLI executes in the
existing fresh sidecar runtime, including its Wizer-initialized source and module
state. It does not create a nested runtime. Once stopped, that runtime is never
resumed or reused. Ordinary reusable components keep their current behavior.

The current fixture creates one runtime per invocation. It does **not** yet
exercise an existing Wizer runtime or concurrent component export admission.

## Output and completion

1. Validate input and acquire exclusive runtime ownership before CLI dispatch.
2. Accept output bytes into bounded Rust-owned buffers synchronously at the
   write boundary. Do not defer acceptance through a JavaScript Promise chain.
3. Freeze acceptance when exit is requested. Synchronous exit listeners run
   before this point. Queued callbacks do not run afterwards.
4. On natural completion, drain referenced work and read the exit code before
   freezing. Exit-code mutation alone does not terminate work.
5. Release all native handles that keep QuickJS alive, destroy the terminal
   runtime, and verify destruction before native transport finalization.
6. Rust sends accepted bytes and finalizes both output attachments. It may await
   native transport backpressure; no QuickJS driver or callback is used.
7. Return the typed exit code only after both attachments finish successfully.
   A nonzero process code is a valid tool result. Transport failure is not.

Limits apply to byte prefixes independently for stdout and stderr. Chunking must
not change the accepted prefix. Truncation is distinct from transport failure.
Buffers cannot silently grow beyond their limits or transcode binary output.
The fixture returns truncation flags as test status; production reporting must
use the tool's declared metadata/output policy, not add an undeclared result shape.

The `NativeOutput` completion lease starts once after freezing. Failed, cancelled
or completed leases cannot restart. Dropping an in-flight finalizer marks its
lease cancelled. Output may have partially reached the transport before failure
or cancellation; do not retry it, fabricate successful attachment completion,
or return a successful tool result. The caller must discard the sidecar.

The controller—not `NativeOutput` itself—must prove that the runtime has been
destroyed. The fixture checks its weak handle before beginning completion.

## Dispatch

Use synchronous context entry and execute QuickJS jobs individually under one
lock, checking termination after each job. Sleep on registered scheduler wakeups
instead of polling pending I/O in a loop. Check inside callbacks that can perform
more than one JavaScript entry in a single future poll.

The Promise adapter must check before host polling, after readiness, after
conversion, and before resolve/reject. A converting result can request exit;
calling a resolver afterwards can invoke a user-controlled `then` getter.
The wrapper-owned adapter uses `Promise::new`, `Ctx::spawn`, and existing native
function/exception APIs. It does not need private scheduler or queue disposal APIs.
An upstream engine/dependency fork is not required for this bounded implementation.

The isolated fixture now uses upstream function/method macros with their public
`crate` option. A WRQ-owned namespace facade re-exports the original API and
substitutes only `promise::Promised`; without an installed terminal signal it
uses the stock adapter. Original argument extraction and class borrowing are
unchanged. The opt-in skeleton now redirects builtin async function/method
macros, guards timers and rejection-tracker re-entry, and drives native process
completion in its real-builtin test probe. Generated WIT import adapters are not
yet redirected.

Retained writers, parked exports, generated imports, async macros and module
evaluation all still need an admission/dispatch audit. Merely guarding literal
`Ctx::spawn` calls does not cover macro-generated Promise adapters. No Promise
prototype patch, callback classification, or exit-state reset is permitted.

## Golem integration seam

The current TypeScript SDK owns result encoding and stream finalization in JS.
The current `runCli` output bridge also queues writes in JS. Keeping these paths
and simply adding a terminal runtime wait is not sufficient.

An opt-in native component completion bridge must retain the actual stdout/stderr
attachment writers in Rust and encode the declared tool exit result there. It
must not resume the parked JS tool handler. The diagnostic `complete` export in
this fixture is not that bridge. No executor-native host tool, WASI exit trap,
new server configuration, or JSON stdout/stderr wrapping is proposed here.

Ordinary stdio still uses its existing string path. The native controller
installs byte-safe terminal writers and accepts typed byte views directly in
Rust. Real-builtin tests preserve Buffer and Uint8Array bytes, including view
offsets and synchronous exit-listener output, without JS `Array.from`. The final
Golem writer-resource transport remains unimplemented.

## Acceptance gates

- Real Node builtins, generated adapters/imports and real filesystem/network I/O
  on P2 and P3; async failures, cancellation and exclusive export admission.
- Actual Golem stream failure/backpressure and SDK result encoding.
- Wizer restoration with one sidecar runtime, not a second runtime initialized
  after the snapshot.
- Bundled npm installation from an empty workspace/cache and focused tsc checks
  in fresh isolated environments; latency, memory, host calls and output cost.
- No default runtime behavior or performance changes. Any repeatable tool
  latency/memory regression requires investigation before adoption.
