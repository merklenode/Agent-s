import type { ContextQuery, ContextResult, InsightQuery, InsightResult } from "@locusgraph/client";

// ---------------------------------------------------------------------------
// Types: LocusGraph SDK surface (structural interface — injectable for tests)
// ---------------------------------------------------------------------------

export interface LocusGraphClientLike {
  retrieveMemories(query: ContextQuery): Promise<ContextResult>;
  generateInsights(query: InsightQuery): Promise<InsightResult>;
}

// Re-export SDK types used in output so consumers don't need a direct import
export type { ContextResult, InsightResult };

// ---------------------------------------------------------------------------
// Types: workflow configuration
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types: output shape
// ---------------------------------------------------------------------------

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
  /** Exact query string used — documents which memories were retrieved */
  query_used: string;
  context_ids_used: string[] | null;
  context_types_used: Record<string, string[]> | null;
  limit_used: number;
  items_found: number;
  /** Formatted memory text returned by the API */
  memories: string;
  resume_relevance_insight: ResumeRelevanceInsight;
  retrieval_warnings: string[];
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class LocusCredentialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocusCredentialError";
  }
}

export class LocusRetrievalError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LocusRetrievalError";
  }
}

export class LocusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocusValidationError";
  }
}

// ---------------------------------------------------------------------------
// Credential validation
// ---------------------------------------------------------------------------

export function checkLocusCredentials(): string | null {
  if (!process.env["LOCUSGRAPH_AGENT_SECRET"]) {
    return "LOCUSGRAPH_AGENT_SECRET environment variable is not set.";
  }
  if (!process.env["LOCUSGRAPH_GRAPH_ID"]) {
    return "LOCUSGRAPH_GRAPH_ID environment variable is not set.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export function createLocusClient(): LocusGraphClientLike {
  const agentSecret = process.env["LOCUSGRAPH_AGENT_SECRET"];
  if (!agentSecret) {
    throw new LocusCredentialError(
      "LOCUSGRAPH_AGENT_SECRET environment variable is not set."
    );
  }

  let LocusGraphClient: new (config: {
    serverUrl?: string;
    agentSecret?: string;
    graphId?: string;
  }) => LocusGraphClientLike;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@locusgraph/client") as {
      LocusGraphClient: typeof LocusGraphClient;
    };
    LocusGraphClient = mod.LocusGraphClient;
  } catch {
    throw new LocusCredentialError(
      "@locusgraph/client is not installed. Run: pnpm install"
    );
  }

  return new LocusGraphClient({
    serverUrl: process.env["LOCUSGRAPH_SERVER_URL"],
    agentSecret,
  });
}

// ---------------------------------------------------------------------------
// Core SDK calls
// ---------------------------------------------------------------------------

export async function runRetrieval(
  client: LocusGraphClientLike,
  config: LocusRetrievalConfig
): Promise<ContextResult> {
  try {
    return await client.retrieveMemories({
      graphId: config.graphId,
      query: config.query,
      limit: config.limit,
      contextIds: config.contextIds,
      contextTypes: config.contextTypes,
    });
  } catch (e) {
    throw new LocusRetrievalError(
      `retrieveMemories failed: ${(e as Error).message ?? String(e)}`,
      e
    );
  }
}

export async function runInsights(
  client: LocusGraphClientLike,
  config: LocusInsightConfig
): Promise<InsightResult> {
  try {
    return await client.generateInsights({
      graphId: config.graphId,
      task: config.task,
      locusQuery: config.locusQuery,
      limit: config.limit,
    });
  } catch (e) {
    throw new LocusRetrievalError(
      `generateInsights failed: ${(e as Error).message ?? String(e)}`,
      e
    );
  }
}

// ---------------------------------------------------------------------------
// Output assembly
// ---------------------------------------------------------------------------

export function buildOutput(
  config: LocusWorkflowConfig,
  retrievalResult: ContextResult,
  insightResult: InsightResult,
  warnings: string[],
  updatedAt: string
): LocusRetrievalOutput {
  return {
    updated: updatedAt,
    source: "locusgraph",
    generated_by: "pnpm locus:retrieval",
    graph_id: config.retrieval.graphId,
    task_label: config.taskLabel,
    query_used: config.retrieval.query,
    context_ids_used: config.retrieval.contextIds ?? null,
    context_types_used: config.retrieval.contextTypes ?? null,
    limit_used: config.retrieval.limit,
    items_found: retrievalResult.items_found,
    memories: retrievalResult.memories,
    resume_relevance_insight: {
      insight: insightResult.insight,
      recommendation: insightResult.recommendation,
      confidence: insightResult.confidence,
    },
    retrieval_warnings: warnings,
  };
}

// ---------------------------------------------------------------------------
// Output validation
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: (keyof LocusRetrievalOutput)[] = [
  "updated",
  "source",
  "generated_by",
  "graph_id",
  "task_label",
  "query_used",
  "items_found",
  "memories",
  "resume_relevance_insight",
];

export function validateOutput(data: LocusRetrievalOutput): void {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      throw new LocusValidationError(`Output missing required field: ${field}`);
    }
  }

  if (typeof data.memories !== "string") {
    throw new LocusValidationError("memories must be a string");
  }
  if (typeof data.items_found !== "number") {
    throw new LocusValidationError("items_found must be a number");
  }

  const { resume_relevance_insight: insight } = data;
  if (typeof insight.insight !== "string") {
    throw new LocusValidationError("resume_relevance_insight.insight must be a string");
  }
  if (typeof insight.recommendation !== "string") {
    throw new LocusValidationError("resume_relevance_insight.recommendation must be a string");
  }
  if (!["low", "medium", "high"].includes(insight.confidence)) {
    throw new LocusValidationError(
      `resume_relevance_insight.confidence must be low|medium|high, got: ${insight.confidence}`
    );
  }
}

// ---------------------------------------------------------------------------
// Full workflow
// ---------------------------------------------------------------------------

export async function runWorkflow(
  client: LocusGraphClientLike,
  config: LocusWorkflowConfig,
  warnings: string[],
  updatedAt: string
): Promise<LocusRetrievalOutput> {
  const retrievalResult = await runRetrieval(client, config.retrieval);

  if (retrievalResult.items_found === 0) {
    warnings.push("retrieveMemories returned 0 items — graph may be empty or query too specific");
  }

  const insightResult = await runInsights(client, config.insight);

  return buildOutput(config, retrievalResult, insightResult, warnings, updatedAt);
}
