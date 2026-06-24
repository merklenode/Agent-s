import { spawnSync } from "node:child_process";
import { OWNER } from "./paths.js";
import type { GhRepoListItem } from "./types.js";

export function ghRun<T>(args: string[], warnings: string[]): T | null {
  const result = spawnSync("gh", args, { encoding: "utf-8", timeout: 15_000 });
  if (result.status !== 0 || result.error) {
    const msg = result.stderr?.trim() ?? result.error?.message ?? "unknown error";
    warnings.push(`gh ${args[0]} ${args[1] ?? ""}: ${msg.split("\n")[0] ?? msg}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    warnings.push(`gh ${args[0]} ${args[1] ?? ""}: JSON parse failed`);
    return null;
  }
}

export function checkPrerequisites(): void {
  const ghVersion = spawnSync("gh", ["--version"], { encoding: "utf-8" });
  if (ghVersion.status !== 0 || ghVersion.error) {
    console.error("ERROR: gh CLI not found. Install from https://cli.github.com/");
    process.exit(1);
  }

  const authStatus = spawnSync("gh", ["auth", "status"], { encoding: "utf-8" });
  if (authStatus.status !== 0 || authStatus.error) {
    console.error("ERROR: gh auth check failed.");
    console.error("Run: gh auth login");
    process.exit(1);
  }

  console.log("gh CLI found and authenticated.");
}

const REPO_LIST_FIELDS = [
  "name",
  "description",
  "isPrivate",
  "isFork",
  "isArchived",
  "url",
  "primaryLanguage",
  "repositoryTopics",
  "defaultBranchRef",
  "homepageUrl",
  "createdAt",
  "updatedAt",
  "pushedAt",
].join(",");

export function listRepos(warnings: string[]): GhRepoListItem[] {
  const result = ghRun<GhRepoListItem[]>(
    ["repo", "list", OWNER, "--limit", "1000", "--json", REPO_LIST_FIELDS],
    warnings
  );
  if (!result) {
    console.error("ERROR: Failed to fetch repository list. Cannot continue.");
    process.exit(1);
  }
  return result;
}

export function normalizeTopics(topics: GhRepoListItem["repositoryTopics"]): string[] {
  if (!Array.isArray(topics)) return [];
  return topics
    .map((item) => item.topic?.name)
    .filter((name): name is string => Boolean(name));
}
