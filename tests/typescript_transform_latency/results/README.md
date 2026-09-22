# Result reports

`run.sh` writes one JSON report for each P2/P3 and strip/transform combination.
Reports contain the complete path/size matrix, raw samples, control latency,
sibling responsiveness, and the guest linear-memory high-water observation.

Checked-in timings are local evidence and are not enforced as CI thresholds.

Each configured size is a requested source-byte target. Generated declarations and
case-specific suffixes can make the actual source slightly larger; samples in the
requested 64-KiB profile contain 65,602–65,637 source bytes.

The reports' `environment.commitHint` records the exact ESM whitespace-scan
candidate used for the workload capture (`012a07cc`), while the runtime and
benchmark input hashes are the currentness keys.

`run.sh --check` validates the checked-in report schema and complete P2/P3 by
strip/transform matrix without claiming that historical timings describe the
current runtime. `run.sh --check-current` additionally compares the stored input
hashes with the checkout. A failure there requires a deliberate new measurement
capture, not validation-only replacement of the runtime hash.

## 2026-09-21 macOS arm64 candidate

All values below are milliseconds for the requested 64-KiB profile unless noted
otherwise.

| Target/mode | Direct API median / max | Inline median | Entry median | ESM median | Prepared ESM median | CJS median |
|---|---:|---:|---:|---:|---:|---:|
| P2 strip | 18.88 / 18.95 | 193.52 | 325.43 | 329.13 | 190.68 | 331.21 |
| P2 transform | 17.63 / 17.65 | 196.22 | 315.67 | 315.02 | 176.35 | 313.67 |
| P3 strip | 19.11 / 19.19 | 192.83 | 325.96 | 325.08 | 188.89 | 330.94 |
| P3 transform | 17.65 / 17.85 | 196.13 | 316.10 | 314.39 | 175.94 | 313.02 |

The same-runtime 1 ms timer was delayed by 16.51–19.47 ms while the synchronous
public transform API ran. A 1 ms execution timeout completed in 192.29–194.39 ms;
the cancellation callback was issued in 185.90–190.03 ms and completed in
193.95–198.23 ms. Those execution-control values include fresh runtime startup and
must not be described as native-transform time or preemption.

The highest observed guest linear-memory reservation was 22,609,920 bytes. This is
an instance-wide monotone high-water mark, not retained memory. The preceding
uninstrumented 2026-09-21 re-capture at pre-fix revision `90629f25` supplied
the requested 64-KiB strip-mode prepared-ESM medians: 11,088.28 ms for P2
and 10,859.98 ms for P3. Its raw reports were replaced by the post-fix capture;
the [phase experiment results](../../esm_module_load_phases/results/README.md)
also record these baseline medians. After the whitespace-scan change they are
190.68 ms and 188.89 ms, reductions of 98.28% and 98.26%. Entry and ordinary
ESM paths now track the approximately 313–331 ms CommonJS range instead of
taking roughly 11 seconds.
The phase experiment retains the raw P2/P3 attribution samples and documents the
two source scanners responsible for the baseline delay.
