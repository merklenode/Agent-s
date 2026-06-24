import type { ContextQuery, ContextResult, InsightQuery, InsightResult } from "@locusgraph/client";

export interface LocusGraphClientLike {
  retrieveMemories(query: ContextQuery): Promise<ContextResult>;
  generateInsights(query: InsightQuery): Promise<InsightResult>;
}

export type LocusGraphClientConstructor = new (config: {
  serverUrl?: string;
  agentSecret?: string;
  graphId?: string;
}) => LocusGraphClientLike;

export type { ContextResult, InsightResult };

export interface LocusRetrievalConfig {
  graphId: string;
  query: string;
  limit: number;
  contextIds?: string[];
  contextTypes?: Record<string, string[]>;
}

export interface LocusInsightConfig {
  graphId: string;
  task: string;
  locusQuery: string;
  limit: number;
}

export interface LocusWorkflowConfig {
  taskLabel: string;
  retrieval: LocusRetrievalConfig;
  insight: LocusInsightConfig;
}

export interface ResumeRelevanceInsight {
  insight: string;
  recommendation: string;
  confidence: "low" | "medium" | "high";
}

export interface LocusRetrievalOutput {
  updated: string;
  source: "locusgraph";
  generated_by: "pnpm locus:retrieval";
  graph_id: string;
  task_label: string;
  query_used: string;
  context_ids_used: string[] | null;
  context_types_used: Record<string, string[]> | null;
  limit_used: number;
  items_found: number;
  memories: string;
  resume_relevance_insight: ResumeRelevanceInsight;
  retrieval_warnings: string[];
}

export interface CliArgs {
  query?: string;
  limit?: number;
  contextIds?: string[];
}
