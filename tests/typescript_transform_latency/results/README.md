# Result reports

`run.sh` writes one JSON report for each P2/P3 and strip/transform combination.
Reports contain the complete path/size matrix, raw samples, control latency,
sibling responsiveness, and the guest linear-memory high-water observation.

Checked-in timings are local evidence and are not enforced as CI thresholds.

Each configured size is a requested source-byte target. Generated declarations and
case-specific suffixes can make the actual source slightly larger; samples in the
requested 64-KiB profile contain 65,602–65,637 source bytes.

The reports' `environment.commitHint` records the exact consolidated npm-loader
candidate used for the workload capture (`8bbdc5f3`), while the runtime and
benchmark input hashes are the currentness keys.

`run.sh --check` validates the checked-in report schema and complete P2/P3 by
strip/transform matrix without claiming that historical timings describe the
current runtime. `run.sh --check-current` additionally compares the stored input
hashes with the checkout. A failure there requires a deliberate new measurement
capture, not validation-only replacement of the runtime hash.

## 2026-09-21 macOS arm64 baseline

All values below are milliseconds for the requested 64-KiB profile unless noted
otherwise.

| Target/mode | Direct API median / max | Inline median | Entry median | ESM median | Prepared ESM median | CJS median |
|---|---:|---:|---:|---:|---:|---:|
| P2 strip | 19.49 / 19.52 | 197.21 | 10,945.91 | 11,324.12 | 11,088.28 | 371.14 |
| P2 transform | 24.77 / 25.73 | 244.56 | 439.50 | 370.64 | 307.44 | 843.67 |
| P3 strip | 19.90 / 19.94 | 204.18 | 10,897.92 | 11,265.03 | 10,859.98 | 334.93 |
| P3 transform | 17.54 / 17.65 | 196.31 | 316.13 | 316.76 | 175.63 | 314.23 |

The same-runtime 1 ms timer was delayed by 17.82–20.55 ms while the synchronous
public transform API ran. A 1 ms execution timeout completed in 193.86–218.45 ms;
the cancellation callback was issued in 187.78–210.80 ms and completed in
195.87–221.79 ms. Those execution-control values include fresh runtime startup and
must not be described as native-transform time or preemption.

The highest observed guest linear-memory reservation was 22,609,920 bytes. This is
an instance-wide monotone high-water mark, not retained memory. Strip-mode prepared
ESM reproduces nearly all of the end-to-end ESM delay after transformation has
already finished, while similarly sized inputs with the same dense stripped padding
complete inline in 197–204 ms and through CommonJS in 335–371 ms. The separate
bottleneck is therefore in the ESM module-loading path, not generic compilation of
whitespace-preserving output; GOL-347 owns its phase-level profiling and measured
mitigation.

The P2 transform-mode execution rows were noisier than the other profiles, including
three 64-KiB CommonJS samples spanning 621–1,381 ms. This serial refresh is not a
controlled cross-date A/B, so those movements are descriptive and are not attributed
to the npm-loader cache change. The stable cross-target result is the roughly
11-second strip-mode ESM path reproduced after transformation has already completed.
