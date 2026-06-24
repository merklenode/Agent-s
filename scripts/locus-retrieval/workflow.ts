import { buildOutput } from "./output.js";
import { runInsights, runRetrieval } from "./sdk.js";
import type {
  LocusGraphClientLike,
  LocusRetrievalOutput,
  LocusWorkflowConfig,
} from "./types.js";

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

  // generateInsights queries the graph independently via locusQuery.
  const insightResult = await runInsights(client, config.insight);

  return buildOutput(config, retrievalResult, insightResult, warnings, updatedAt);
}
