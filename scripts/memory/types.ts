import type {
  ContextListResponse,
  ContextTypesResponse,
  CreateEventApiRequest,
  GetContextResponse,
} from '@locusgraph/client';

export type EventKind = CreateEventApiRequest['event_kind'];
export type EventSource = NonNullable<CreateEventApiRequest['source']>;

// ---------------------------------------------------------------------------
// Context ID — enforces the `type:name` stable format at compile time
// ---------------------------------------------------------------------------

export type ContextId = `${EventKind}:${string}`;

// ---------------------------------------------------------------------------
// Context relationship links
// ---------------------------------------------------------------------------

export interface ContextLinks {
  related_to?: ContextId[];
  extends?: ContextId[];
  reinforces?: ContextId[];
  contradicts?: ContextId[];
}

// ---------------------------------------------------------------------------
// Typed params for storeMemory
// ---------------------------------------------------------------------------

export interface StoreMemoryParams<T extends Record<string, unknown>> extends ContextLinks {
  event_kind: EventKind;
  context_id: ContextId;
  source?: EventSource;
  payload: {
    data: T;
  };
}

// ---------------------------------------------------------------------------
// LocusGraph client interface — structural, derived from SDK method signatures.
// Any object whose methods match this shape satisfies it; no nominal coupling.
//
// Note: storeEvent uses graph_id (snake_case) while getContext / listContexts
// use graphId (camelCase). This mirrors the SDK's own inconsistency exactly.
// ---------------------------------------------------------------------------

export interface LocusGraphMemoryClient {
  storeEvent(params: CreateEventApiRequest): Promise<unknown>;

  getContext(params: {
    graphId: string;
    context_id: string;
  }): Promise<GetContextResponse>;

  listContextTypes(graphId?: string, options?: { page_size?: number }): Promise<ContextTypesResponse>;
  listContextsByType(
    contextType: string,
    graphId?: string,
    options?: { page_size?: number }
  ): Promise<ContextListResponse>;
}
