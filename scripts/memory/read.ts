import type { ContextId, EventKind, LocusGraphClient } from './types.js';

// Returns null when the context does not exist yet — expected during first
// runs. Re-throws anything else so real errors don't get silently swallowed.
export async function getMemoryContext(
  client: LocusGraphClient,
  graphId: string,
  contextId: ContextId
): Promise<Record<string, unknown> | null> {
  try {
    return await client.getContext({ graphId, context_id: contextId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // FIXME(sdk-blocker): replace this string-match with a typed check (error.status === 404,
    // error.code, or the SDK's error class) when the SDK PR lands — do not merge the SDK
    // integration without resolving this. A message-text change in the SDK will silently
    // break callers that depend on null being returned for not-found contexts.
    if (message.includes('Context not found')) {
      return null;
    }
    throw err;
  }
}

export async function listMemoryContexts(
  client: LocusGraphClient,
  graphId: string,
  type?: EventKind,
  limit = 50
): Promise<Record<string, unknown>[]> {
  return client.listContexts({
    graphId,
    ...(type !== undefined && { context_type: type }),
    limit,
  });
}

// Fetches multiple contexts in parallel. Each position in the result maps
// 1-to-1 with the input ids: null means that context doesn't exist yet.
export async function retrieveMemories(
  client: LocusGraphClient,
  graphId: string,
  contextIds: ContextId[]
): Promise<Array<Record<string, unknown> | null>> {
  return Promise.all(
    contextIds.map((id) => getMemoryContext(client, graphId, id))
  );
}
