export function checkStoreCredentials(): string | null {
  if (!process.env["LOCUSGRAPH_AGENT_SECRET"]) {
    return (
      "LOCUSGRAPH_AGENT_SECRET is not set.\n" +
      "Copy .env.example to .env and fill in your LocusGraph agent secret."
    );
  }
  return null;
}
