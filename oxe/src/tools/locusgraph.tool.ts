import { LocusGraphClient, type StoreEventResponse } from "@locusgraph/client";

type LocusMemoryType = "weekly" | "monthly" | "project" | "skill";

type LocusFact = {
  type: LocusMemoryType;
  title: string;
  content: string;
  metadata?: Record<string, string | number | boolean | string[]>;
};

const DEFAULT_GRAPH_ID = "oxe";

function locusConfig() {
  const serverUrl = process.env.LOCUSGRAPH_SERVER_URL;
  const agentSecret = process.env.LOCUSGRAPH_AGENT_SECRET;
  const graphId = process.env.LOCUSGRAPH_GRAPH_ID ?? DEFAULT_GRAPH_ID;

  return {
    enabled: Boolean(agentSecret),
    serverUrl,
    agentSecret,
    graphId,
  };
}

function getClient() {
  const config = locusConfig();
  return new LocusGraphClient({
    serverUrl: config.serverUrl,
    agentSecret: config.agentSecret,
    graphId: config.graphId,
  });
}

function contextName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "memory";
}

export function isLocusGraphEnabled() {
  return locusConfig().enabled;
}

export async function writeLocusFact(fact: LocusFact) {
  const config = locusConfig();
  if (!config.enabled) return { stored: false, reason: "LocusGraph is not configured." };

  const result: StoreEventResponse = await getClient().storeEvent({
    graph_id: config.graphId,
    event_kind: "fact",
    source: "agent",
    context_id: `${fact.type}:${contextName(fact.title)}`,
    payload: {
      data: {
        source: "oxe",
        memoryType: fact.type,
        title: fact.title,
        text: fact.content,
        metadata: fact.metadata ?? {},
        occurredAt: new Date().toISOString(),
      },
    },
  });

  return {
    stored: result.status === "recorded",
    status: result.status,
    relevance: result.relevance,
    eventId: result.event_id,
  };
}

export async function writeLocusFacts(facts: LocusFact[]) {
  if (!isLocusGraphEnabled() || facts.length === 0) {
    return { stored: 0, skipped: facts.length };
  }

  let stored = 0;
  let skipped = 0;
  for (const fact of facts) {
    const result = await writeLocusFact(fact);
    if (result.stored) stored++;
    else skipped++;
  }

  return { stored, skipped };
}

export async function queryLocusMemory(query: string, limit = 8) {
  const config = locusConfig();
  if (!config.enabled) return "";

  const result = await getClient().retrieveMemories({
    graphId: config.graphId,
    query,
    limit,
  });

  return result.memories ?? "";
}
