use std::collections::BTreeSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode, Output, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

type Result<T> = std::result::Result<T, String>;

#[derive(Clone, Copy)]
struct Suite {
    name: &'static str,
    manifest: &'static str,
    report_prefix: &'static str,
    validate_env: &'static str,
    reports_env: &'static str,
    manifest_reports_env: &'static str,
    source_root_env: &'static str,
    expected_source_env: &'static str,
}

const AGENTIC_TS: Suite = Suite {
    name: "agentic-ts",
    manifest: "tests/agentic_ts/results/current-reports.txt",
    report_prefix: "tests/agentic_ts/results/",
    validate_env: "AGENTIC_TS_VALIDATE_REPORTS",
    reports_env: "AGENTIC_TS_REPORTS_TO_CHECK",
    manifest_reports_env: "AGENTIC_TS_CURRENT_REPORTS",
    source_root_env: "AGENTIC_TS_SOURCE_ROOT",
    expected_source_env: "AGENTIC_TS_EXPECTED_SOURCE_REF",
};

const NPM_METADATA: Suite = Suite {
    name: "npm-metadata",
    manifest: "tests/npm_metadata/results/current-reports.txt",
    report_prefix: "tests/npm_metadata/results/",
    validate_env: "NPM_METADATA_VALIDATE_REPORTS",
    reports_env: "NPM_METADATA_REPORTS_TO_CHECK",
    manifest_reports_env: "NPM_METADATA_CURRENT_REPORTS",
    source_root_env: "NPM_METADATA_SOURCE_ROOT",
    expected_source_env: "NPM_METADATA_EXPECTED_SOURCE_REF",
};

#[derive(Clone, Debug)]
struct Manifest {
    source_ref: String,
    reports: [String; 2],
}

#[derive(Debug, Eq, PartialEq)]
struct CurrentnessPlan {
    agentic_reports: Vec<String>,
    npm_reports: Vec<String>,
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<()> {
    let mut args = env::args().skip(1);
    match args.next().as_deref() {
        Some("plan") => {
            let event = args.next().ok_or_else(|| {
                "usage: performance-report-currentness plan <event> <push-before> [pr-head]"
                    .to_string()
            })?;
            let push_before = args.next().unwrap_or_default();
            let pr_head = args.next().unwrap_or_default();
            ensure_no_more(args)?;
            let plan = create_plan(&repo_root()?, &event, &push_before, &pr_head)?;
            print_plan(&plan);
            Ok(())
        }
        Some("check") => check(&repo_root()?, args.collect()),
        Some("self-test") => {
            ensure_no_more(args)?;
            self_test()
        }
        _ => Err("usage: performance-report-currentness <plan|check|self-test> ...".to_string()),
    }
}

fn ensure_no_more(mut args: impl Iterator<Item = String>) -> Result<()> {
    if let Some(argument) = args.next() {
        return Err(format!("unexpected argument: {argument}"));
    }
    Ok(())
}

fn suite(name: &str) -> Result<Suite> {
    match name {
        "agentic-ts" => Ok(AGENTIC_TS),
        "npm-metadata" => Ok(NPM_METADATA),
        _ => Err(format!("unknown performance-report suite: {name}")),
    }
}

fn repo_root() -> Result<PathBuf> {
    let output = command_output(Command::new("git").args(["rev-parse", "--show-toplevel"]))?;
    Ok(PathBuf::from(output.trim()))
}

fn load_manifest(root: &Path, suite: Suite) -> Result<Manifest> {
    let manifest_path = root.join(suite.manifest);
    let contents = fs::read_to_string(&manifest_path)
        .map_err(|error| format!("failed to read {}: {error}", manifest_path.display()))?;
    let mut source_ref = None;
    let mut reports = Vec::new();
    for (index, line) in contents.lines().enumerate() {
        if line.trim().is_empty() {
            return Err(format!(
                "blank current-report entry in {} at line {}",
                suite.manifest,
                index + 1
            ));
        }
        let fields = line.split_whitespace().collect::<Vec<_>>();
        if fields.len() != 2 || !is_git_sha(fields[0]) {
            return Err(format!(
                "invalid current-report entry in {} at line {}: {line}",
                suite.manifest,
                index + 1
            ));
        }
        validate_report_path(root, suite, fields[1])?;
        if let Some(expected) = source_ref.as_deref() {
            if expected != fields[0] {
                return Err(format!(
                    "current reports in {} name different source revisions",
                    suite.manifest
                ));
            }
        } else {
            source_ref = Some(fields[0].to_string());
        }
        if reports.iter().any(|report| report == fields[1]) {
            return Err(format!(
                "duplicate current report in {}: {}",
                suite.manifest, fields[1]
            ));
        }
        reports.push(fields[1].to_string());
    }
    if reports.len() != 2 {
        return Err(format!(
            "current-report manifest must name exactly one P2/P3 pair: {}",
            suite.manifest
        ));
    }
    let p2 = reports
        .iter()
        .find(|report| report.contains("-p2-"))
        .ok_or_else(|| format!("{} has no P2 report", suite.manifest))?;
    let p3 = reports
        .iter()
        .find(|report| report.contains("-p3-"))
        .ok_or_else(|| format!("{} has no P3 report", suite.manifest))?;
    if reports
        .iter()
        .filter(|report| report.contains("-p2-"))
        .count()
        != 1
        || reports
            .iter()
            .filter(|report| report.contains("-p3-"))
            .count()
            != 1
        || p2.replacen("-p2-", "-p3-", 1) != *p3
    {
        return Err(format!(
            "current-report manifest does not name a companion P2/P3 pair: {}",
            suite.manifest
        ));
    }
    reports.sort();
    Ok(Manifest {
        source_ref: source_ref.expect("two manifest entries have a source"),
        reports: [reports[0].clone(), reports[1].clone()],
    })
}

fn validate_report_path(root: &Path, suite: Suite, report: &str) -> Result<()> {
    if !report.starts_with(suite.report_prefix)
        || !report.ends_with(".json")
        || Path::new(report).is_absolute()
        || Path::new(report)
            .components()
            .any(|component| component.as_os_str() == "..")
    {
        return Err(format!(
            "current report is outside {}: {report}",
            suite.report_prefix
        ));
    }
    if !root.join(report).is_file() {
        return Err(format!("current report does not exist: {report}"));
    }
    Ok(())
}

fn is_git_sha(value: &str) -> bool {
    value.len() == 40
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn create_plan(
    root: &Path,
    event: &str,
    push_before: &str,
    pr_head: &str,
) -> Result<CurrentnessPlan> {
    let agentic = load_manifest(root, AGENTIC_TS)?;
    let npm = load_manifest(root, NPM_METADATA)?;
    let diff_base = event_diff_base(root, event, push_before, pr_head)?;
    let changed = match diff_base {
        Some(base) => changed_report_paths(root, &base)?,
        None => BTreeSet::new(),
    };
    Ok(CurrentnessPlan {
        agentic_reports: selected_reports(&agentic, AGENTIC_TS, &changed),
        npm_reports: selected_reports(&npm, NPM_METADATA, &changed),
    })
}

fn print_plan(plan: &CurrentnessPlan) {
    print_output(
        "reports-to-check",
        "AGENTIC_TS_REPORTS",
        &plan.agentic_reports,
    );
    print_output(
        "npm-reports-to-check",
        "NPM_METADATA_REPORTS",
        &plan.npm_reports,
    );
}

fn event_diff_base(
    root: &Path,
    event: &str,
    push_before: &str,
    pr_head: &str,
) -> Result<Option<String>> {
    match event {
        "pull_request" => {
            if pr_head.is_empty() {
                return Err("pull-request head SHA is missing".to_string());
            }
            let parents = git_output(root, &["rev-list", "--parents", "-n", "1", "HEAD"])?;
            let parents = parents.split_whitespace().collect::<Vec<_>>();
            if parents.len() != 3 {
                return Err("pull-request checkout is not a two-parent synthetic merge".to_string());
            }
            let expected_head = git_output(root, &["rev-parse", pr_head])?;
            if parents[2] != expected_head {
                return Err(
                    "synthetic merge second parent does not match the pull-request head"
                        .to_string(),
                );
            }
            Ok(Some(parents[1].to_string()))
        }
        "push" => {
            if push_before.is_empty() || push_before.bytes().all(|byte| byte == b'0') {
                return Ok(None);
            }
            if !git_commit_exists(root, push_before) {
                return Err(format!(
                    "push before commit is unavailable in the checked-out history: {push_before}"
                ));
            }
            Ok(Some(push_before.to_string()))
        }
        _ => Err(format!("unsupported GitHub event: {event}")),
    }
}

fn changed_report_paths(root: &Path, base: &str) -> Result<BTreeSet<String>> {
    let output = git_output(
        root,
        &[
            "diff",
            "--name-only",
            "--diff-filter=ACMR",
            base,
            "HEAD",
            "--",
            "tests/agentic_ts/results/*.json",
            "tests/npm_metadata/results/*.json",
            AGENTIC_TS.manifest,
            NPM_METADATA.manifest,
        ],
    )?;
    Ok(output
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(str::to_string)
        .collect())
}

fn selected_reports(manifest: &Manifest, suite: Suite, changed: &BTreeSet<String>) -> Vec<String> {
    if changed.contains(suite.manifest) {
        return manifest.reports.to_vec();
    }
    manifest
        .reports
        .iter()
        .filter(|report| changed.contains(*report))
        .cloned()
        .collect()
}

fn print_output(name: &str, delimiter: &str, reports: &[String]) {
    println!("{name}<<{delimiter}");
    for report in reports {
        println!("{report}");
    }
    println!("{delimiter}");
}

fn check(root: &Path, args: Vec<String>) -> Result<()> {
    check_with_report_environment(root, args, env::var("PERFORMANCE_REPORTS_TO_CHECK").ok())
}

fn check_with_report_environment(
    root: &Path,
    args: Vec<String>,
    reports_from_environment: Option<String>,
) -> Result<()> {
    let separator = args
        .iter()
        .position(|argument| argument == "--")
        .ok_or_else(|| {
            "usage: performance-report-currentness check <suite> [report ...] -- <command>"
                .to_string()
        })?;
    if separator == 0 || separator + 1 == args.len() {
        return Err(
            "usage: performance-report-currentness check <suite> [report ...] -- <command>"
                .to_string(),
        );
    }
    let suite = suite(&args[0])?;
    let mut requested = args[1..separator].to_vec();
    if let Some(from_environment) = reports_from_environment {
        let from_environment = from_environment
            .lines()
            .filter(|line| !line.trim().is_empty())
            .map(|line| line.trim().to_string())
            .collect::<Vec<_>>();
        if !requested.is_empty() && !from_environment.is_empty() {
            return Err(
                "current reports were provided as both arguments and PERFORMANCE_REPORTS_TO_CHECK"
                    .to_string(),
            );
        }
        requested.extend(from_environment);
    }
    let command = &args[separator + 1..];
    let manifest = load_manifest(root, suite)?;
    let requested = normalize_requested_reports(root, suite, &manifest, requested)?;

    let mut prepared = None;
    let source_root = if requested.is_empty() {
        root.to_path_buf()
    } else if git_commit_exists(root, &manifest.source_ref) {
        let worktree = PreparedWorktree::new(root, &manifest.source_ref)?;
        let path = worktree.source.clone();
        prepared = Some(worktree);
        path
    } else {
        eprintln!(
            "measured source {} is unavailable; validating recorded input hashes against the checked-out tree",
            manifest.source_ref
        );
        root.to_path_buf()
    };

    let mut child = Command::new(&command[0]);
    child
        .args(&command[1..])
        .current_dir(root)
        .env(suite.validate_env, "1")
        .env(suite.reports_env, requested.join("\n"))
        .env(suite.manifest_reports_env, manifest.reports.join("\n"))
        .env(suite.source_root_env, &source_root)
        .env(suite.expected_source_env, &manifest.source_ref);
    let status = child.status().map_err(|error| {
        format!(
            "failed to run currentness validation for {}: {error}",
            suite.name
        )
    })?;
    drop(prepared);
    if !status.success() {
        return Err(format!(
            "currentness validation for {} failed with {status}",
            suite.name
        ));
    }
    Ok(())
}

fn normalize_requested_reports(
    root: &Path,
    suite: Suite,
    manifest: &Manifest,
    requested: Vec<String>,
) -> Result<Vec<String>> {
    let mut normalized = BTreeSet::new();
    for report in requested {
        let path = Path::new(&report);
        let relative = if path.is_absolute() {
            path.strip_prefix(root).map_err(|_| {
                format!(
                    "current report path is outside {}: {report}",
                    root.display()
                )
            })?
        } else {
            path.strip_prefix("./").unwrap_or(path)
        };
        let relative = relative
            .to_str()
            .ok_or_else(|| format!("non-UTF-8 current report path: {}", relative.display()))?
            .replace('\\', "/");
        validate_report_path(root, suite, &relative)?;
        if !manifest.reports.contains(&relative) {
            return Err(format!(
                "current report is not named in {}: {relative}",
                suite.manifest
            ));
        }
        if !normalized.insert(relative.clone()) {
            return Err(format!("duplicate current report requested: {relative}"));
        }
    }
    Ok(normalized.into_iter().collect())
}

struct PreparedWorktree {
    repo_root: PathBuf,
    parent: PathBuf,
    source: PathBuf,
}

impl PreparedWorktree {
    fn new(repo_root: &Path, source_ref: &str) -> Result<Self> {
        let template = env::temp_dir().join("wasm-rquickjs-currentness.XXXXXX");
        let parent = PathBuf::from(command_output(
            Command::new("mktemp").args(["-d", &template.to_string_lossy()]),
        )?);
        let source = parent.join("source");
        let status = Command::new("git")
            .current_dir(repo_root)
            .args(["worktree", "add", "--quiet", "--detach"])
            .arg(&source)
            .arg(source_ref)
            .status()
            .map_err(|error| format!("failed to create currentness worktree: {error}"))?;
        if !status.success() {
            let _ = fs::remove_dir_all(&parent);
            return Err(format!(
                "failed to create currentness worktree at {source_ref}: {status}"
            ));
        }
        Ok(Self {
            repo_root: repo_root.to_path_buf(),
            parent,
            source,
        })
    }
}

impl Drop for PreparedWorktree {
    fn drop(&mut self) {
        let _ = Command::new("git")
            .current_dir(&self.repo_root)
            .args(["worktree", "remove", "--force"])
            .arg(&self.source)
            .status();
        let _ = fs::remove_dir_all(&self.parent);
    }
}

fn git_commit_exists(root: &Path, source_ref: &str) -> bool {
    Command::new("git")
        .current_dir(root)
        .args(["cat-file", "-e", &format!("{source_ref}^{{commit}}")])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .is_ok_and(|status| status.success())
}

fn git_output(root: &Path, args: &[&str]) -> Result<String> {
    command_output(Command::new("git").current_dir(root).args(args))
}

fn command_output(command: &mut Command) -> Result<String> {
    let Output {
        status,
        stdout,
        stderr,
    } = command
        .output()
        .map_err(|error| format!("failed to execute command: {error}"))?;
    if !status.success() {
        return Err(format!(
            "command failed with {status}: {}",
            String::from_utf8_lossy(&stderr).trim()
        ));
    }
    String::from_utf8(stdout)
        .map(|output| output.trim().to_string())
        .map_err(|error| format!("command output is not UTF-8: {error}"))
}

struct ScratchDirectory(PathBuf);

impl Drop for ScratchDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn scratch_directory(label: &str) -> Result<ScratchDirectory> {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_nanos();
    let scratch = ScratchDirectory(env::temp_dir().join(format!(
        "wasm-rquickjs-currentness-{label}-{}-{unique}",
        std::process::id()
    )));
    fs::create_dir_all(&scratch.0).map_err(|error| error.to_string())?;
    Ok(scratch)
}

fn self_test() -> Result<()> {
    self_test_manifest_contract()?;
    self_test_git_integration()?;
    println!("performance report currentness self-test passed");
    Ok(())
}

fn self_test_manifest_contract() -> Result<()> {
    let scratch = scratch_directory("manifest-self-test")?;
    let root = &scratch.0;
    fs::create_dir_all(root.join("tests/agentic_ts/results")).map_err(|error| error.to_string())?;
    fs::create_dir_all(root.join("tests/npm_metadata/results"))
        .map_err(|error| error.to_string())?;
    let source = "1111111111111111111111111111111111111111";
    write_pair(&root, AGENTIC_TS, source, "current")?;
    write_pair(&root, NPM_METADATA, source, "current")?;

    let agentic = load_manifest(&root, AGENTIC_TS)?;
    let npm = load_manifest(&root, NPM_METADATA)?;
    if agentic.source_ref != source || npm.source_ref != source {
        return Err("manifest source was not preserved".to_string());
    }
    let changed = BTreeSet::from([agentic.reports[0].clone()]);
    if selected_reports(&agentic, AGENTIC_TS, &changed) != vec![agentic.reports[0].clone()] {
        return Err("changed current report was not selected".to_string());
    }
    let changed = BTreeSet::from([AGENTIC_TS.manifest.to_string()]);
    if selected_reports(&agentic, AGENTIC_TS, &changed) != agentic.reports {
        return Err("manifest change did not select its P2/P3 pair".to_string());
    }
    let changed = BTreeSet::from([format!(
        "{}historical-p2-report.json",
        AGENTIC_TS.report_prefix
    )]);
    if !selected_reports(&agentic, AGENTIC_TS, &changed).is_empty() {
        return Err("historical report was selected for currentness".to_string());
    }

    let invalid_manifest = root.join(NPM_METADATA.manifest);
    fs::write(
        &invalid_manifest,
        format!(
            "{source} {}current-p2-report.json\n{} {}current-p3-report.json\n",
            NPM_METADATA.report_prefix,
            "2222222222222222222222222222222222222222",
            NPM_METADATA.report_prefix
        ),
    )
    .map_err(|error| error.to_string())?;
    if load_manifest(&root, NPM_METADATA).is_ok() {
        return Err("mixed manifest source revisions were accepted".to_string());
    }
    write_pair(&root, NPM_METADATA, source, "current")?;
    fs::write(
        &invalid_manifest,
        format!(
            "{source} {}current-p2-report.json\n{source} {}other-p3-report.json\n",
            NPM_METADATA.report_prefix, NPM_METADATA.report_prefix
        ),
    )
    .map_err(|error| error.to_string())?;
    fs::write(
        root.join(format!(
            "{}other-p3-report.json",
            NPM_METADATA.report_prefix
        )),
        "{}\n",
    )
    .map_err(|error| error.to_string())?;
    if load_manifest(&root, NPM_METADATA).is_ok() {
        return Err("non-companion manifest pair was accepted".to_string());
    }

    Ok(())
}

fn self_test_git_integration() -> Result<()> {
    let scratch = scratch_directory("git-self-test")?;
    let root = &scratch.0;
    git_output(root, &["init", "-q", "-b", "main"])?;
    git_output(root, &["config", "user.email", "ci-test@example.invalid"])?;
    git_output(root, &["config", "user.name", "CI contract test"])?;
    fs::create_dir_all(root.join("tests/agentic_ts/results")).map_err(|error| error.to_string())?;
    fs::create_dir_all(root.join("tests/npm_metadata/results"))
        .map_err(|error| error.to_string())?;

    write_text(root.join("build-input.txt"), "base\n")?;
    let base_source = git_commit_all(root, "base source")?;
    write_pair(root, AGENTIC_TS, &base_source, "base")?;
    write_pair(root, NPM_METADATA, &base_source, "base")?;
    let base = git_commit_all(root, "base reports")?;

    git_output(root, &["switch", "-q", "-c", "report-branch"])?;
    write_text(root.join("report-source.txt"), "report source\n")?;
    let report_source = git_commit_all(root, "report source")?;
    write_pair(root, AGENTIC_TS, &report_source, "report")?;
    write_pair(root, NPM_METADATA, &report_source, "report")?;
    let report_head = git_commit_all(root, "reports")?;
    let report_plan = CurrentnessPlan {
        agentic_reports: load_manifest(root, AGENTIC_TS)?.reports.to_vec(),
        npm_reports: load_manifest(root, NPM_METADATA)?.reports.to_vec(),
    };

    git_output(root, &["switch", "-q", "main"])?;
    write_text(root.join("build-input.txt"), "concurrent main change\n")?;
    let main_parent = git_commit_all(root, "concurrent main")?;
    git_output(
        root,
        &[
            "merge",
            "-q",
            "--no-ff",
            "report-branch",
            "-m",
            "merge reports",
        ],
    )?;
    let merge_head = git_output(root, &["rev-parse", "HEAD"])?;
    ensure_plan(
        create_plan(root, "pull_request", "", &report_head)?,
        &report_plan,
        "synthetic pull request",
    )?;
    ensure_plan(
        create_plan(root, "push", &main_parent, "")?,
        &report_plan,
        "merge push",
    )?;
    if create_plan(root, "pull_request", "", &base).is_ok() {
        return Err("mismatched pull-request head was accepted".to_string());
    }

    write_text(root.join("direct-source.txt"), "direct source\n")?;
    let direct_source = git_commit_all(root, "direct source")?;
    write_pair(root, AGENTIC_TS, &direct_source, "direct")?;
    write_pair(root, NPM_METADATA, &direct_source, "direct")?;
    let direct_head = git_commit_all(root, "direct reports")?;
    let direct_plan = CurrentnessPlan {
        agentic_reports: load_manifest(root, AGENTIC_TS)?.reports.to_vec(),
        npm_reports: load_manifest(root, NPM_METADATA)?.reports.to_vec(),
    };
    ensure_plan(
        create_plan(root, "push", &merge_head, "")?,
        &direct_plan,
        "direct push",
    )?;

    write_text(
        root.join("tests/agentic_ts/results/historical-p2-report.json"),
        "{}\n",
    )?;
    write_text(
        root.join("tests/npm_metadata/results/historical-p2-report.json"),
        "{}\n",
    )?;
    git_commit_all(root, "historical reports")?;
    let empty_plan = CurrentnessPlan {
        agentic_reports: Vec::new(),
        npm_reports: Vec::new(),
    };
    ensure_plan(
        create_plan(root, "push", &direct_head, "")?,
        &empty_plan,
        "historical-report filtering",
    )?;
    ensure_plan(
        create_plan(root, "push", "0000000000000000000000000000000000000000", "")?,
        &empty_plan,
        "zero-before push",
    )?;
    let missing = "0000000000000000000000000000000000000001";
    let missing_error = create_plan(root, "push", missing, "")
        .expect_err("missing push base must fail currentness planning");
    if !missing_error.contains("push before commit is unavailable") {
        return Err(format!("unexpected missing-base error: {missing_error}"));
    }

    let agentic = load_manifest(root, AGENTIC_TS)?;
    let expected_reports = agentic.reports.join("\n");
    let capture = root.join("reachable-source-root.txt");
    check_with_report_environment(
        root,
        vec![
            "agentic-ts".to_string(),
            agentic.reports[0].clone(),
            agentic.reports[1].clone(),
            "--".to_string(),
            "sh".to_string(),
            "-c".to_string(),
            format!(
                "test \"$AGENTIC_TS_SOURCE_ROOT\" != \"{}\" && \
                 test \"$(git -C \"$AGENTIC_TS_SOURCE_ROOT\" rev-parse HEAD)\" = \"{direct_source}\" && \
                 test \"$AGENTIC_TS_REPORTS_TO_CHECK\" = \"{expected_reports}\" && \
                 test \"$AGENTIC_TS_CURRENT_REPORTS\" = \"{expected_reports}\" && \
                 test -f \"$AGENTIC_TS_SOURCE_ROOT/direct-source.txt\" && \
                 printf '%s\\n' \"$AGENTIC_TS_SOURCE_ROOT\" > \"{}\"",
                root.display(),
                capture.display()
            ),
        ],
        None,
    )?;
    let prepared_source = PathBuf::from(
        fs::read_to_string(&capture)
            .map_err(|error| error.to_string())?
            .trim(),
    );
    if prepared_source.exists()
        || git_output(root, &["worktree", "list", "--porcelain"])?
            .contains(&prepared_source.to_string_lossy().to_string())
    {
        return Err("reachable-source worktree was not cleaned up".to_string());
    }

    let unavailable_source = "1111111111111111111111111111111111111111";
    write_pair(root, AGENTIC_TS, unavailable_source, "fallback")?;
    let fallback = load_manifest(root, AGENTIC_TS)?;
    check_with_report_environment(
        root,
        vec![
            "agentic-ts".to_string(),
            fallback.reports[0].clone(),
            fallback.reports[1].clone(),
            "--".to_string(),
            "sh".to_string(),
            "-c".to_string(),
            format!(
                "test \"$AGENTIC_TS_SOURCE_ROOT\" = \"{}\" && \
                 test \"$AGENTIC_TS_EXPECTED_SOURCE_REF\" = \"{unavailable_source}\"",
                root.display()
            ),
        ],
        None,
    )?;

    Ok(())
}

fn write_text(path: PathBuf, contents: &str) -> Result<()> {
    fs::write(&path, contents)
        .map_err(|error| format!("failed to write {}: {error}", path.display()))
}

fn git_commit_all(root: &Path, message: &str) -> Result<String> {
    git_output(root, &["add", "."])?;
    git_output(root, &["commit", "-qm", message])?;
    git_output(root, &["rev-parse", "HEAD"])
}

fn ensure_plan(actual: CurrentnessPlan, expected: &CurrentnessPlan, context: &str) -> Result<()> {
    if &actual != expected {
        return Err(format!(
            "{context} produced the wrong currentness plan: actual={actual:?}, expected={expected:?}"
        ));
    }
    Ok(())
}

fn write_pair(root: &Path, suite: Suite, source: &str, stem: &str) -> Result<()> {
    let p2 = format!("{}{stem}-p2-report.json", suite.report_prefix);
    let p3 = format!("{}{stem}-p3-report.json", suite.report_prefix);
    fs::write(root.join(&p2), "{}\n").map_err(|error| error.to_string())?;
    fs::write(root.join(&p3), "{}\n").map_err(|error| error.to_string())?;
    fs::write(
        root.join(suite.manifest),
        format!("{source} {p2}\n{source} {p3}\n"),
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}
