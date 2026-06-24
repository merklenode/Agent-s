import { createClientFromEnv } from "../memory/client.js";
import { checkStoreCredentials, readEvidenceFile, storeEvidenceEvents } from "./index.js";
import { EVIDENCE_PATH } from "./paths.js";
import type { LocusGraphMemoryClient } from "../memory/types.js";
import type { GithubEvidenceFile } from "./types.js";

async function store(): Promise<void> {
  const credError = checkStoreCredentials();
  if (credError) {
    console.error(`ERROR: ${credError}`);
    process.exit(1);
  }

  let evidence: GithubEvidenceFile;
  try {
    evidence = readEvidenceFile(EVIDENCE_PATH);
  } catch (e) {
    console.error(`ERROR: ${(e as Error).message}`);
    process.exit(1);
  }

  let client: LocusGraphMemoryClient;
  let graphId: string;
  try {
    const session = createClientFromEnv();
    client = session.client;
    graphId = session.graphId;
  } catch (e) {
    console.error(`ERROR: ${(e as Error).message}`);
    process.exit(1);
  }

  const storedAt = new Date().toISOString();
  const summary = await storeEvidenceEvents(
    client,
    graphId,
    evidence,
    EVIDENCE_PATH,
    storedAt
  );

  console.log(`Stored ${summary.eventsStored} events to graph: ${summary.graphId}`);
  console.log(`  fact:github_evidence           (${evidence.repositories.length} repos, updated ${evidence.updated})`);
  console.log("  action:github_evidence_stored  (reinforces fact:github_evidence)");
}

const command = process.argv[2];

if (command === "store") {
  store().catch((e: unknown) => {
    console.error(`ERROR: ${(e as Error).message ?? String(e)}`);
    process.exit(1);
  });
} else {
  console.error("Usage: tsx scripts/github-evidence-store/cli.ts store");
  process.exit(1);
}
