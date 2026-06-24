import { LocusCredentialError } from "./errors.js";
import type { LocusGraphClientConstructor, LocusGraphClientLike } from "./types.js";

export function checkLocusCredentials(): string | null {
  if (!process.env["LOCUSGRAPH_AGENT_SECRET"]) {
    return "LOCUSGRAPH_AGENT_SECRET environment variable is not set.";
  }
  if (!process.env["LOCUSGRAPH_GRAPH_ID"]) {
    return "LOCUSGRAPH_GRAPH_ID environment variable is not set.";
  }
  return null;
}

export function createLocusClient(): LocusGraphClientLike {
  const agentSecret = process.env["LOCUSGRAPH_AGENT_SECRET"];
  if (!agentSecret) {
    throw new LocusCredentialError(
      "LOCUSGRAPH_AGENT_SECRET environment variable is not set."
    );
  }

  let LocusGraphClient: LocusGraphClientConstructor;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@locusgraph/client") as {
      LocusGraphClient: LocusGraphClientConstructor;
    };
    LocusGraphClient = mod.LocusGraphClient;
  } catch {
    throw new LocusCredentialError(
      "@locusgraph/client is not installed. Run: pnpm install"
    );
  }

  if (typeof LocusGraphClient !== "function") {
    throw new LocusCredentialError(
      "@locusgraph/client does not export LocusGraphClient"
    );
  }

  return new LocusGraphClient({
    ...(process.env["LOCUSGRAPH_SERVER_URL"] ? { serverUrl: process.env["LOCUSGRAPH_SERVER_URL"] } : {}),
    agentSecret,
  });
}
