import { LocusGraphClient } from "@locusgraph/client";

// ---------------------------------------------------------------------------
// Config defaults
// ---------------------------------------------------------------------------

const DEFAULT_SERVER_URL = "https://api.locusgraph.com";
const DEFAULT_GRAPH_ID = "default";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocusGraphConfig {
  serverUrl: string;
  agentSecret: string;
  graphId: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLocusGraphClient(): LocusGraphClient {
  const agentSecret = process.env["LOCUSGRAPH_AGENT_SECRET"];
  if (!agentSecret) {
    throw new Error(
      "Missing required environment variable: LOCUSGRAPH_AGENT_SECRET. " +
        "Copy .env.example to .env and set your agent secret."
    );
  }

  const config: LocusGraphConfig = {
    serverUrl: process.env["LOCUSGRAPH_SERVER_URL"] ?? DEFAULT_SERVER_URL,
    agentSecret,
    graphId: process.env["LOCUSGRAPH_GRAPH_ID"] ?? DEFAULT_GRAPH_ID,
  };

  return new LocusGraphClient(config);
}
