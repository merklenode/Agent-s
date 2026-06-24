import type { LocusGraphClient, StoreMemoryParams } from './types.js';

export async function storeMemory<T extends Record<string, unknown>>(
  client: LocusGraphClient,
  graphId: string,
  params: StoreMemoryParams<T>
): Promise<void> {
  const { event_kind, context_id, source, payload, related_to, reinforces, contradicts } = params;

  // `extends` is destructured separately because it is a reserved word — it
  // cannot appear in a destructuring shorthand without an alias.
  const extendsLinks = params.extends;

  await client.storeEvent({
    graph_id: graphId,
    event_kind,
    source,
    context_id,
    payload: { data: payload.data as Record<string, unknown> },
    ...(related_to !== undefined && { related_to }),
    ...(extendsLinks !== undefined && { extends: extendsLinks }),
    ...(reinforces !== undefined && { reinforces }),
    ...(contradicts !== undefined && { contradicts }),
  });
}
