import type { GithubEvidenceOutput } from "./types.js";

export function validateOutput(data: GithubEvidenceOutput): void {
  const errors: string[] = [];

  if (!data.updated || !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) {
    errors.push("updated field missing or not in YYYY-MM-DD format");
  }
  if (data.source !== "github") errors.push("source must be 'github'");
  if (!data.owner) errors.push("owner is missing");
  if (!Array.isArray(data.repositories)) errors.push("repositories must be an array");

  for (const repo of data.repositories ?? []) {
    if (!repo.repo_name) errors.push("a repository record is missing repo_name");
    if (!repo.full_name?.includes("/")) {
      errors.push(`full_name malformed: ${repo.full_name}`);
    }
    if (!["public", "private"].includes(repo.visibility)) {
      errors.push(`invalid visibility '${repo.visibility}' in ${repo.repo_name}`);
    }
    if (!["low", "medium", "high"].includes(repo.resume_evidence_signals?.confidence)) {
      errors.push(`invalid confidence in ${repo.repo_name}`);
    }
  }

  if (errors.length > 0) {
    console.error("\nValidation errors:");
    for (const e of errors) console.error(`  [ERROR] ${e}`);
    process.exit(1);
  }

  console.log("Validation passed.");
}
