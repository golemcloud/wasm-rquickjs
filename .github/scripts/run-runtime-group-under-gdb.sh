#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <runtime-group>" >&2
  exit 2
fi

group="$1"
mkdir -p target

if ! command -v gdb >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  sudo apt-get update
  sudo apt-get install -y gdb
fi

cargo test --test runtime --no-run

test_bin="$({
  find target/debug/deps -maxdepth 1 -type f -name 'runtime-*' -executable -printf '%T@ %p\n' 2>/dev/null || true
} | sort -n | tail -n1 | cut -d' ' -f2-)"

if [[ -z "${test_bin}" ]]; then
  echo "failed to locate runtime test binary under target/debug/deps" >&2
  exit 1
fi

gdb_cmds="target/gdb-runtime-group${group}.cmds"
gdb_log="target/gdb-runtime-group${group}.log"

cat > "${gdb_cmds}" <<'EOF'
set confirm off
set pagination off
set print thread-events off
set debuginfod enabled off
handle SIGSEGV stop print nopass
handle SIGABRT stop print nopass
run --nocapture --report-time --format ctrf --logfile target/ctrf.json ':tag:group__GROUP__'
if $_isvoid($_exitcode) && $_isvoid($_exitsignal)
  echo \n=== Thread Backtraces ===\n
  thread apply all bt full
  quit 1
end
if !$_isvoid($_exitsignal)
  quit 1
end
if !$_isvoid($_exitcode) && $_exitcode != 0
  quit $_exitcode
end
quit 0
EOF

sed -i "s/__GROUP__/${group}/g" "${gdb_cmds}"

set +e
timeout --signal=TERM 20m \
  gdb -q -batch -return-child-result -x "${gdb_cmds}" --args "${test_bin}" \
  2>&1 | tee "${gdb_log}"
status=${PIPESTATUS[0]}
set -e

if [[ ${status} -eq 124 ]]; then
  echo "gdb timed out after 20 minutes" >&2
fi

exit "${status}"
