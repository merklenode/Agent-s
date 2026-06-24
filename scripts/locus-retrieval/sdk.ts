import { LocusRetrievalError } from "./errors.js";
import type {
  ContextResult,
  InsightResult,
  LocusGraphClientLike,
  LocusInsightConfig,
  LocusRetrievalConfig,
} from "./types.js";

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
