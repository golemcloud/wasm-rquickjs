# Result reports

`run.sh` writes one JSON report for each P2/P3 and strip/transform combination.
Reports contain the complete path/size matrix, raw samples, control latency,
sibling responsiveness, and the guest linear-memory high-water observation.

Checked-in timings are local evidence and are not enforced as CI thresholds.

## 2026-09-01 macOS arm64 baseline

All values below are milliseconds at the 64-KiB input unless noted otherwise.

| Target/mode | Direct API median / max | Inline median | Entry median | ESM median | Prepared ESM median | CJS median |
|---|---:|---:|---:|---:|---:|---:|
| P2 strip | 19.46 / 20.50 | 202.95 | 11,040.89 | 11,094.26 | 10,944.89 | 372.51 |
| P2 transform | 18.99 / 19.03 | 200.90 | 322.43 | 323.80 | 198.70 | 343.44 |
| P3 strip | 19.62 / 20.77 | 207.63 | 11,036.76 | 11,169.50 | 10,934.69 | 366.03 |
| P3 transform | 18.28 / 18.78 | 210.57 | 356.63 | 341.15 | 191.91 | 355.45 |

The same-runtime 1 ms timer was delayed by 18.90–22.10 ms while the synchronous
public transform API ran. A 1 ms execution timeout completed in 205.53–208.59 ms;
the cancellation callback was issued in 194.94–204.99 ms and completed in
203.84–214.18 ms. Those execution-control values include fresh runtime startup and
must not be described as native-transform time or preemption.

The highest observed guest linear-memory reservation was 22,544,384 bytes. This is
an instance-wide monotone high-water mark, not retained memory. Strip-mode prepared
ESM reproduces nearly all of the end-to-end ESM delay after transformation has
already finished, while similarly sized inputs with the same dense stripped padding
complete inline in about 203 ms and through CommonJS in about 370 ms. The separate
bottleneck is therefore in the ESM module-loading path, not generic compilation of
whitespace-preserving output; GOL-347 owns its phase-level profiling and measured
mitigation.
