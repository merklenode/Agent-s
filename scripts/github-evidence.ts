import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const OWNER = "merklenode";
const SCRIPT_DIR = dirname(__filename);
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = resolve(REPO_ROOT, "resume-agent-dataset/evidence/github-evidence.json");
const PROTECTED_PATH = resolve(REPO_ROOT, "resume-agent-dataset/evidence/project-evidence.json");

// ---------------------------------------------------------------------------
// Types: output shape
// ---------------------------------------------------------------------------

interface ReadmeData {
  exists: boolean;
  path: string | null;
  plain_text_excerpt: string;
  detected_sections: string[];
}

interface ActivityData {
  last_pushed_at: string;
  created_at: string;
  updated_at: string;
  recent_commit_count: number;
}

interface ResumeEvidenceSignals {
  possible_profiles: string[];
  technical_keywords: string[];
  confidence: "low" | "medium" | "high";
}

interface RepoRecord {
  repo_name: string;
  full_name: string;
  github_url: string;
  visibility: "public" | "private";
  is_fork: boolean;
  is_archived: boolean;
  description: string;
  topics: string[];
  homepage_url: string | null;
  default_branch: string;
  primary_language: string | null;
  languages_detected: string[];
  dependency_files_detected: string[];
  frameworks_detected: string[];
  tools_detected: string[];
  important_files_detected: string[];
  readme: ReadmeData;
  activity: ActivityData;
  resume_evidence_signals: ResumeEvidenceSignals;
  extraction_warnings: string[];
}

interface GithubEvidenceOutput {
  updated: string;
  source: "github";
  owner: string;
  scope: "all_repositories_including_private";
  generated_by: "pnpm github:evidence";
  repositories: RepoRecord[];
}

// ---------------------------------------------------------------------------
// Types: raw gh CLI responses
// ---------------------------------------------------------------------------

interface GhLanguage {
  name: string;
}

interface GhTopic {
  topic: { name: string };
}

interface GhBranchRef {
  name: string;
}

interface GhRepoListItem {
  name: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  url: string;
  primaryLanguage: GhLanguage | null;
  repositoryTopics: GhTopic[];
  defaultBranchRef: GhBranchRef | null;
  homepageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

interface GhReadmeResponse {
  path: string;
  content: string;
  encoding: string;
}

interface GhTreeItem {
  path: string;
  type: "blob" | "tree";
}

interface GhTreeResponse {
  tree: GhTreeItem[];
}

interface GhCommit {
  sha: string;
}

// ---------------------------------------------------------------------------
// gh CLI wrapper
// ---------------------------------------------------------------------------

function ghRun<T>(args: string[], warnings: string[]): T | null {
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

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------

function checkPrerequisites(): void {
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

// ---------------------------------------------------------------------------
// Repo list
// ---------------------------------------------------------------------------

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

function listRepos(warnings: string[]): GhRepoListItem[] {
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

// ---------------------------------------------------------------------------
// Per-repo data fetchers
// ---------------------------------------------------------------------------

function fetchLanguages(repoName: string, warnings: string[]): string[] {
  const data = ghRun<Record<string, number>>(
    ["api", `repos/${OWNER}/${repoName}/languages`],
    warnings
  );
  if (!data) return [];
  return Object.keys(data).sort((a, b) => (data[b] ?? 0) - (data[a] ?? 0));
}

function fetchReadme(repoName: string, warnings: string[]): ReadmeData {
  const data = ghRun<GhReadmeResponse>(
    ["api", `repos/${OWNER}/${repoName}/readme`],
    warnings
  );

  if (!data) {
    // 404 is expected for repos without a README; remove the warning if it's just a 404
    const lastWarning = warnings[warnings.length - 1];
    if (lastWarning?.includes("404") || lastWarning?.includes("Not Found")) {
      warnings.pop();
    }
    return { exists: false, path: null, plain_text_excerpt: "", detected_sections: [] };
  }

  let raw: string;
  try {
    raw = Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    warnings.push(`${repoName}: README base64 decode failed`);
    return { exists: true, path: data.path, plain_text_excerpt: "", detected_sections: [] };
  }

  const plainText = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const excerpt = plainText.slice(0, 800);

  const sectionPattern = /^#{1,3}\s+(.+)$/gm;
  const sections: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(raw)) !== null) {
    const heading = match[1]?.trim();
    if (heading) sections.push(heading);
  }

  return {
    exists: true,
    path: data.path,
    plain_text_excerpt: excerpt,
    detected_sections: sections,
  };
}

// Files that indicate a dependency manager is in use
const DEPENDENCY_FILES = new Set([
  "package.json",
  "requirements.txt",
  "Pipfile",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json",
  "Package.swift",
  "mix.exs",
]);

// Files that indicate specific tools
const TOOL_FILE_MAP = new Map<string, string>([
  ["Dockerfile", "Docker"],
  ["docker-compose.yml", "Docker Compose"],
  ["docker-compose.yaml", "Docker Compose"],
  ["Makefile", "Make"],
  ["CMakeLists.txt", "CMake"],
  ["hardhat.config.js", "Hardhat"],
  ["hardhat.config.ts", "Hardhat"],
  ["jest.config.js", "Jest"],
  ["jest.config.ts", "Jest"],
  ["vitest.config.ts", "Vitest"],
  ["vitest.config.js", "Vitest"],
  [".eslintrc.json", "ESLint"],
  [".eslintrc.js", "ESLint"],
  [".eslintrc.yaml", "ESLint"],
  [".eslintrc.yml", "ESLint"],
  ["eslint.config.js", "ESLint"],
  ["eslint.config.ts", "ESLint"],
  [".prettierrc", "Prettier"],
  [".prettierrc.json", "Prettier"],
  [".prettierrc.yaml", "Prettier"],
  ["prettier.config.js", "Prettier"],
  ["foundry.toml", "Foundry"],
  ["truffle-config.js", "Truffle"],
  ["anchor.toml", "Anchor"],
]);

const IMPORTANT_FILES = new Set([
  "README.md",
  "README.rst",
  "README.txt",
  "readme.md",
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "SECURITY.md",
  ".github/CODEOWNERS",
]);

function fetchRootTree(
  repoName: string,
  branch: string,
  warnings: string[]
): { dependencyFiles: string[]; toolsDetected: string[]; importantFiles: string[] } {
  const data = ghRun<GhTreeResponse>(
    ["api", `repos/${OWNER}/${repoName}/git/trees/${branch}?recursive=false`],
    warnings
  );

  if (!data) {
    return { dependencyFiles: [], toolsDetected: [], importantFiles: [] };
  }

  const paths = data.tree.map((item) => item.path);
  const pathSet = new Set(paths);

  const dependencyFiles = paths.filter((p) => DEPENDENCY_FILES.has(p));

  const toolsSet = new Set<string>();
  for (const [file, tool] of TOOL_FILE_MAP.entries()) {
    if (pathSet.has(file)) toolsSet.add(tool);
  }
  if (paths.some((p) => p.startsWith(".github/workflows"))) {
    toolsSet.add("GitHub Actions");
  }

  const importantFiles = paths.filter((p) => IMPORTANT_FILES.has(p));

  return {
    dependencyFiles,
    toolsDetected: Array.from(toolsSet).sort(),
    importantFiles,
  };
}

function fetchRecentCommitCount(repoName: string, warnings: string[]): number {
  const commits = ghRun<GhCommit[]>(
    ["api", `repos/${OWNER}/${repoName}/commits?per_page=100`],
    warnings
  );
  return commits?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Detection: frameworks and resume signals
// ---------------------------------------------------------------------------

const README_FRAMEWORK_PATTERNS: Array<[RegExp, string]> = [
  [/\bReact\b/i, "React"],
  [/\bNext\.js\b/i, "Next.js"],
  [/\bVue\b/i, "Vue.js"],
  [/\bSvelte\b/i, "Svelte"],
  [/\bAngular\b/i, "Angular"],
  [/\bFastAPI\b/i, "FastAPI"],
  [/\bDjango\b/i, "Django"],
  [/\bFlask\b/i, "Flask"],
  [/\bExpress\b/i, "Express"],
  [/\bFastify\b/i, "Fastify"],
  [/\bNestJS\b/i, "NestJS"],
  [/\bPrisma\b/i, "Prisma"],
  [/\bSolidity\b/i, "Solidity"],
  [/\bHardhat\b/i, "Hardhat"],
  [/\bFoundry\b/i, "Foundry"],
  [/\bAnchor\b/i, "Anchor"],
  [/\bIPFS\b/i, "IPFS"],
  [/\bPostgreSQL\b|postgres/i, "PostgreSQL"],
  [/\bMySQL\b/i, "MySQL"],
  [/\bMongoDB\b/i, "MongoDB"],
  [/\bRedis\b/i, "Redis"],
  [/\bOpenAI\b/i, "OpenAI API"],
  [/\banthropic\b|claude api/i, "Anthropic / Claude API"],
  [/\bLangChain\b/i, "LangChain"],
  [/\bWebAssembly\b|wasm\b/i, "WebAssembly"],
  [/\bSolana\b/i, "Solana"],
  [/\bEthereum\b/i, "Ethereum"],
  [/\bGraphQL\b/i, "GraphQL"],
  [/\bgRPC\b/i, "gRPC"],
];

function detectFrameworks(readmeExcerpt: string, dependencyFiles: string[], toolsDetected: string[]): string[] {
  const found = new Set<string>();

  for (const [pattern, name] of README_FRAMEWORK_PATTERNS) {
    if (pattern.test(readmeExcerpt)) found.add(name);
  }

  if (dependencyFiles.includes("Cargo.toml")) found.add("Rust / Cargo");
  if (toolsDetected.includes("CMake")) found.add("CMake");
  if (dependencyFiles.includes("go.mod")) found.add("Go modules");
  if (toolsDetected.includes("Hardhat")) found.add("Hardhat");
  if (toolsDetected.includes("Foundry")) found.add("Foundry");
  if (toolsDetected.includes("Anchor")) found.add("Anchor");

  return Array.from(found).sort();
}

const TECH_KEYWORD_PATTERNS: Array<[RegExp, string]> = [
  [/\bTypeScript\b/i, "TypeScript"],
  [/\bJavaScript\b/i, "JavaScript"],
  [/\bPython\b/i, "Python"],
  [/\bRust\b/i, "Rust"],
  [/\bC\+\+/, "C++"],
  [/\bGolang\b|\bGo\s+lang/i, "Go"],
  [/\bSolidity\b/i, "Solidity"],
  [/\bReact\b/i, "React"],
  [/\bNext\.js\b/i, "Next.js"],
  [/\bNode\.js\b/i, "Node.js"],
  [/\bFastAPI\b/i, "FastAPI"],
  [/\bDjango\b/i, "Django"],
  [/\bFlask\b/i, "Flask"],
  [/\bPostgreSQL\b|postgres/i, "PostgreSQL"],
  [/\bMySQL\b/i, "MySQL"],
  [/\bMongoDB\b/i, "MongoDB"],
  [/\bRedis\b/i, "Redis"],
  [/\bPrisma\b/i, "Prisma"],
  [/\bDocker\b/i, "Docker"],
  [/\bKubernetes\b|k8s\b/i, "Kubernetes"],
  [/\bOpenAI\b/i, "OpenAI API"],
  [/\banthropic\b|claude\b/i, "Anthropic / Claude"],
  [/\bLLM\b/i, "LLM"],
  [/\bRAG\b/i, "RAG"],
  [/\bagent\b/i, "agent workflows"],
  [/\bIPFS\b/i, "IPFS"],
  [/\bEthereum\b/i, "Ethereum"],
  [/\bSolana\b/i, "Solana"],
  [/\bHardhat\b/i, "Hardhat"],
  [/\bWebAssembly\b|wasm/i, "WebAssembly"],
  [/\bMerkle\b/i, "Merkle tree"],
  [/\bREST API\b/i, "REST API"],
  [/\bGraphQL\b/i, "GraphQL"],
  [/\bgRPC\b/i, "gRPC"],
  [/\bgithub actions\b/i, "GitHub Actions"],
  [/\bCI\/CD\b/i, "CI/CD"],
  [/\bSQL\b/i, "SQL"],
  [/\bElasticsearch\b/i, "Elasticsearch"],
];

const PROFILE_SIGNAL_PATTERNS: Array<[RegExp, string]> = [
  [
    /react|next\.js|vue|svelte|frontend|ui\b|ux\b|tailwind/i,
    "Frontend / Full-stack Product Engineer",
  ],
  [
    /fastapi|django|flask|express|nestjs|fastify|backend|rest api|postgres|mysql|prisma/i,
    "Backend / Platform Engineer",
  ],
  [
    /openai|anthropic|claude|llm|agent|prompt|rag|langchain|automation/i,
    "AI Automation / AI Product Engineer",
  ],
  [
    /cli\b|devtool|developer experience|devex|developer workflow|dx\b/i,
    "Developer Tools / DX Engineer",
  ],
  [
    /docker|kubernetes|k8s|deploy|cloud\b|aws\b|gcp\b|azure|terraform|helm/i,
    "Cloud / Infrastructure Engineer",
  ],
  [
    /solidity|ethereum|blockchain|smart contract|ipfs|merkle|solana|hardhat|foundry|anchor|defi|nft/i,
    "Systems / Blockchain Engineer",
  ],
  [
    /c\+\+|cmake|wasm|webassembly|performance\b|systems programming|low.level/i,
    "Systems / Performance Engineer",
  ],
  [
    /postgresql|mysql|sql\b|schema|indexing|search|vector|elasticsearch|mongodb/i,
    "Data / Search / Database Engineer",
  ],
];

function buildResumeSignals(
  primaryLanguage: string | null,
  languages: string[],
  frameworks: string[],
  readmeExcerpt: string,
  description: string
): ResumeEvidenceSignals {
  const corpus = [description, readmeExcerpt, ...frameworks, primaryLanguage ?? ""].join(" ");

  const keywords = new Set<string>();
  for (const [pattern, kw] of TECH_KEYWORD_PATTERNS) {
    if (pattern.test(corpus)) keywords.add(kw);
  }
  for (const lang of [primaryLanguage, ...languages]) {
    if (lang) keywords.add(lang);
  }

  const profiles = new Set<string>();
  for (const [pattern, profile] of PROFILE_SIGNAL_PATTERNS) {
    if (pattern.test(corpus)) profiles.add(profile);
  }

  const kwCount = keywords.size;
  const confidence: "low" | "medium" | "high" =
    kwCount >= 5 ? "high" : kwCount >= 2 ? "medium" : "low";

  return {
    possible_profiles: Array.from(profiles).sort(),
    technical_keywords: Array.from(keywords).sort(),
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateOutput(data: GithubEvidenceOutput): void {
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

// ---------------------------------------------------------------------------
// Extract command
// ---------------------------------------------------------------------------

function extract(): void {
  checkPrerequisites();

  console.log(`\nFetching repository list for ${OWNER}...`);
  const globalWarnings: string[] = [];
  const repos = listRepos(globalWarnings);
  console.log(`Found ${repos.length} repositories.\n`);

  const records: RepoRecord[] = [];
  let totalWarnings = globalWarnings.length;

  for (const repo of repos) {
    const warnings: string[] = [];
    const branch = repo.defaultBranchRef?.name ?? "main";
    const repoName = repo.name;

    process.stdout.write(`  ${repoName} ... `);

    const languages = fetchLanguages(repoName, warnings);
    const readme = fetchReadme(repoName, warnings);
    const tree = fetchRootTree(repoName, branch, warnings);
    const recentCommitCount = fetchRecentCommitCount(repoName, warnings);
    const frameworks = detectFrameworks(readme.plain_text_excerpt, tree.dependencyFiles, tree.toolsDetected);
    const signals = buildResumeSignals(
      repo.primaryLanguage?.name ?? null,
      languages,
      frameworks,
      readme.plain_text_excerpt,
      repo.description ?? ""
    );

    const warnCount = warnings.length;
    totalWarnings += warnCount;
    process.stdout.write(warnCount > 0 ? `${warnCount} warning(s)\n` : "ok\n");

    records.push({
      repo_name: repoName,
      full_name: `${OWNER}/${repoName}`,
      github_url: repo.url,
      visibility: repo.isPrivate ? "private" : "public",
      is_fork: repo.isFork,
      is_archived: repo.isArchived,
      description: repo.description ?? "",
      topics: repo.repositoryTopics.map((t) => t.topic.name),
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

  const today = new Date().toISOString().slice(0, 10);
  const output: GithubEvidenceOutput = {
    updated: today,
    source: "github",
    owner: OWNER,
    scope: "all_repositories_including_private",
    generated_by: "pnpm github:evidence",
    repositories: records,
  };

  // Safety guard: never overwrite the curated evidence file
  if (OUTPUT_PATH === PROTECTED_PATH) {
    console.error("FATAL: output path collision with project-evidence.json. Aborting.");
    process.exit(1);
  }

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

// ---------------------------------------------------------------------------
// Check command
// ---------------------------------------------------------------------------

function check(): void {
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

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const command = process.argv[2];

if (command === "extract") {
  extract();
} else if (command === "check") {
  check();
} else {
  console.error("Usage: tsx scripts/github-evidence.ts [extract|check]");
  process.exit(1);
}
