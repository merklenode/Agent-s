import { LocusValidationError } from "./errors.js";
import type {
  ContextResult,
  InsightResult,
  LocusRetrievalOutput,
  LocusWorkflowConfig,
} from "./types.js";

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
