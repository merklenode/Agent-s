import { existsSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { checkPrerequisites, listRepos, normalizeTopics } from "./gh.js";
import { OWNER, OUTPUT_PATH, PROTECTED_PATH } from "./paths.js";
import { buildResumeSignals, detectFrameworks } from "./detection.js";
import {
  fetchLanguages,
  fetchReadme,
  fetchRecentCommitCount,
  fetchRootTree,
} from "./repo.js";
import { validateOutput } from "./validation.js";
import type { GithubEvidenceOutput, RepoRecord } from "./types.js";

export function extract(): void {
  checkPrerequisites();

  const globalWarnings: string[] = [];
  const repos = listRepos(globalWarnings);
  const records: RepoRecord[] = [];
  let totalWarnings = globalWarnings.length;

  console.log(`Found ${repos.length} repositories for ${OWNER}.`);

  for (const repo of repos) {
    const repoName = repo.name;
    const warnings: string[] = [];
    const branch = repo.defaultBranchRef?.name ?? "main";

    console.log(`Processing ${repoName}...`);

    const languages = fetchLanguages(repoName, warnings);
    const readme = fetchReadme(repoName, warnings);
    const tree = fetchRootTree(repoName, branch, warnings);
    const recentCommitCount = fetchRecentCommitCount(repoName, warnings);
    const frameworks = detectFrameworks(
      readme.plain_text_excerpt,
      tree.dependencyFiles,
      tree.toolsDetected
    );
    const signals = buildResumeSignals(
      repo.primaryLanguage?.name ?? null,
      languages,
      frameworks,
      readme.plain_text_excerpt,
      repo.description ?? ""
    );

    totalWarnings += warnings.length;
    records.push({
      repo_name: repoName,
      full_name: `${OWNER}/${repoName}`,
      github_url: repo.url,
      visibility: repo.isPrivate ? "private" : "public",
      is_fork: repo.isFork,
      is_archived: repo.isArchived,
      description: repo.description ?? "",
      topics: normalizeTopics(repo.repositoryTopics),
      homepage_url: repo.homepageUrl,
      default_branch: branch,
      primary_language: repo.primaryLanguage?.name ?? null,
      languages_detected: languages,
      dependency_files_detected: tree.dependencyFiles,
      frameworks_detected: frameworks,
      tools_detected: tree.toolsDetected,
      important_files_detected: tree.importantFiles,
      readme,
      activity: {
        last_pushed_at: repo.pushedAt,
        created_at: repo.createdAt,
        updated_at: repo.updatedAt,
        recent_commit_count: recentCommitCount,
      },
      resume_evidence_signals: signals,
      extraction_warnings: warnings,
    });
  }

  const output: GithubEvidenceOutput = {
    updated: new Date().toISOString().slice(0, 10),
    source: "github",
    owner: OWNER,
    scope: "all_repositories_including_private",
    generated_by: "pnpm github:evidence",
    repositories: records,
  };

  if (OUTPUT_PATH === PROTECTED_PATH) {
    console.error("FATAL: output path collision with project-evidence.json. Aborting.");
    process.exit(1);
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`\nOutput written: ${OUTPUT_PATH}`);

  validateOutput(output);

  console.log(`
Summary:
  Repositories processed: ${records.length}
  Total warnings:         ${totalWarnings}
  Output path:            ${OUTPUT_PATH}`);

  if (totalWarnings > 0) {
    console.log("\nWarning details:");
    for (const repo of records) {
      for (const w of repo.extraction_warnings) {
        console.log(`  [WARN] ${repo.repo_name}: ${w}`);
      }
    }
    for (const w of globalWarnings) {
      console.log(`  [WARN] ${w}`);
    }
  }
}

export function check(): void {
  if (!existsSync(OUTPUT_PATH)) {
    console.error(`ERROR: ${OUTPUT_PATH} does not exist.`);
    console.error("Run 'pnpm github:evidence' first.");
    process.exit(1);
  }

  let raw: string;
  try {
    raw = readFileSync(OUTPUT_PATH, "utf-8");
  } catch (e) {
    console.error(`ERROR: Cannot read file: ${(e as Error).message}`);
    process.exit(1);
  }

  let data: GithubEvidenceOutput;
  try {
    data = JSON.parse(raw) as GithubEvidenceOutput;
  } catch (e) {
    console.error(`ERROR: JSON parse failed: ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`Checking: ${OUTPUT_PATH}`);
  validateOutput(data);
  console.log(
    `  repositories: ${data.repositories.length}, updated: ${data.updated}`
  );
}
