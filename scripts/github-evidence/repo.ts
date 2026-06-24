import { OWNER } from "./paths.js";
import { ghRun } from "./gh.js";
import type {
  GhCommit,
  GhReadmeResponse,
  GhTreeResponse,
  ReadmeData,
} from "./types.js";

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

export function fetchLanguages(repoName: string, warnings: string[]): string[] {
  const data = ghRun<Record<string, number>>(
    ["api", `repos/${OWNER}/${repoName}/languages`],
    warnings
  );
  if (!data) return [];
  return Object.keys(data).sort((a, b) => (data[b] ?? 0) - (data[a] ?? 0));
}

export function fetchReadme(repoName: string, warnings: string[]): ReadmeData {
  const data = ghRun<GhReadmeResponse>(
    ["api", `repos/${OWNER}/${repoName}/readme`],
    warnings
  );

  if (!data) {
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
    plain_text_excerpt: plainText.slice(0, 800),
    detected_sections: sections,
  };
}

export function fetchRootTree(
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
  const toolsSet = new Set<string>();

  for (const [file, tool] of TOOL_FILE_MAP.entries()) {
    if (pathSet.has(file)) toolsSet.add(tool);
  }
  if (paths.some((p) => p.startsWith(".github/workflows"))) {
    toolsSet.add("GitHub Actions");
  }

  return {
    dependencyFiles: paths.filter((p) => DEPENDENCY_FILES.has(p)),
    toolsDetected: Array.from(toolsSet).sort(),
    importantFiles: paths.filter((p) => IMPORTANT_FILES.has(p)),
  };
}

export function fetchRecentCommitCount(repoName: string, warnings: string[]): number {
  const commits = ghRun<GhCommit[]>(
    ["api", `repos/${OWNER}/${repoName}/commits?per_page=100`],
    warnings
  );
  return commits?.length ?? 0;
}
