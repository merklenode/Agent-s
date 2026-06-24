export interface GithubEvidenceFile {
  updated: string;
  source: "github";
  owner: string;
  scope: string;
  generated_by: string;
  repositories: Record<string, unknown>[];
}

export interface StoreSummary {
  eventsStored: number;
  graphId: string;
  storedAt: string;
}
