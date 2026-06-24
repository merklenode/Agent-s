// ---------------------------------------------------------------------------
// Core event kinds — mirrors the LocusGraph SDK's event_kind enum
// ---------------------------------------------------------------------------

export type EventKind =
  | 'fact'        // persistent generated data, preferences, knowledge
  | 'action'      // completed operations
  | 'decision'    // choices made by the agent
  | 'observation' // general notes
  | 'feedback';   // user or validator feedback

// ---------------------------------------------------------------------------
// Context ID — enforces the `type:name` stable format at compile time
// ---------------------------------------------------------------------------

export type ContextId = `${EventKind}:${string}`;

// ---------------------------------------------------------------------------
// Context relationship links
// ---------------------------------------------------------------------------

export interface ContextLinks {
  related_to?: string[];
  extends?: string[];
  reinforces?: string[];
  contradicts?: string[];
}

// ---------------------------------------------------------------------------
// Typed params for storeMemory
// ---------------------------------------------------------------------------

export interface StoreMemoryParams<T extends Record<string, unknown>> extends ContextLinks {
  event_kind: EventKind;
  context_id: ContextId;
  source: string;
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

export interface LocusGraphClient {
  storeEvent(params: {
    graph_id: string;
    event_kind: EventKind;
    source: string;
    context_id: string;
    payload: { data: Record<string, unknown> };
    related_to?: string[];
    extends?: string[];
    reinforces?: string[];
    contradicts?: string[];
  }): Promise<unknown>;

  getContext(params: {
    graphId: string;
    context_id: string;
  }): Promise<unknown>;

  listContexts(params: {
    graphId: string;
    context_type?: EventKind;
    limit?: number;
  }): Promise<unknown[]>;
}
