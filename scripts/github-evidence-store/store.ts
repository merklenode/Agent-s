import { storeMemory } from "../memory/write.js";
import type { LocusGraphMemoryClient, ContextId } from "../memory/types.js";
import type { GithubEvidenceFile, StoreSummary } from "./types.js";

export async function storeEvidenceEvents(
  client: LocusGraphMemoryClient,
  graphId: string,
  evidence: GithubEvidenceFile,
  filePath: string,
  storedAt: string
): Promise<StoreSummary> {
  const factId: ContextId = "fact:github_evidence";

  await storeMemory(client, graphId, {
    event_kind: "fact",
    context_id: factId,
    source: "tool",
    payload: {
      data: {
        updated: evidence.updated,
        owner: evidence.owner,
        scope: evidence.scope,
        generated_by: evidence.generated_by,
        stored_by: "pnpm github:evidence:store",
        repository_count: evidence.repositories.length,
        stored_at: storedAt,
      },
    },
  });

  try {
    await storeMemory(client, graphId, {
      event_kind: "action",
      context_id: "action:github_evidence_stored",
      source: "tool",
      payload: {
        data: {
          file_path: filePath,
          stored_by: "pnpm github:evidence:store",
          evidence_updated: evidence.updated,
          repository_count: evidence.repositories.length,
          stored_at: storedAt,
        },
      },
      reinforces: [factId],
    });
  } catch (e) {
    console.error(
      "Partial write: fact:github_evidence was stored but action:github_evidence_stored failed."
    );
    throw e;
  }

  return { eventsStored: 2, graphId, storedAt };
}
