export interface ReadmeData {
  exists: boolean;
  path: string | null;
  plain_text_excerpt: string;
  detected_sections: string[];
}

export interface ActivityData {
  last_pushed_at: string;
  created_at: string;
  updated_at: string;
  recent_commit_count: number;
}

export interface ResumeEvidenceSignals {
  possible_profiles: string[];
  technical_keywords: string[];
  confidence: "low" | "medium" | "high";
}

export interface RepoRecord {
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

export interface GithubEvidenceOutput {
  updated: string;
  source: "github";
  owner: string;
  scope: "all_repositories_including_private";
  generated_by: "pnpm github:evidence";
  repositories: RepoRecord[];
}

export interface GhLanguage {
  name: string;
}

export interface GhTopic {
  topic: { name: string } | null;
}

export interface GhBranchRef {
  name: string;
}

export interface GhRepoListItem {
  name: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  url: string;
  primaryLanguage: GhLanguage | null;
  repositoryTopics: GhTopic[] | null;
  defaultBranchRef: GhBranchRef | null;
  homepageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface GhReadmeResponse {
  path: string;
  content: string;
  encoding: string;
}

export interface GhTreeItem {
  path: string;
  type: "blob" | "tree";
}

export interface GhTreeResponse {
  tree: GhTreeItem[];
}

export interface GhCommit {
  sha: string;
}
