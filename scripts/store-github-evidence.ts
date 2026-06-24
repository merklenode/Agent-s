import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { storeMemory } from './memory/write.js';
import { createClientFromEnv } from './memory/client.js';
import type { LocusGraphClient, ContextId } from './memory/types.js';

const SCRIPT_DIR = dirname(__filename);
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const EVIDENCE_PATH = resolve(
  REPO_ROOT,
  'generated/github-evidence/github-evidence.json'
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GithubEvidenceFile {
  updated: string;
  source: 'github';
  owner: string;
  scope: string;
  generated_by: string;
  repositories: Record<string, unknown>[];
}

export interface StoreSummary {
  eventsStored: number;
  graphId: string;
  storedAt: string;
}

// ---------------------------------------------------------------------------
// Credential check
// ---------------------------------------------------------------------------

export function checkStoreCredentials(): string | null {
  if (!process.env['LOCUSGRAPH_AGENT_SECRET']) {
    return (
      'LOCUSGRAPH_AGENT_SECRET is not set.\n' +
      'Copy .env.example to .env and fill in your LocusGraph agent secret.'
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

export function readEvidenceFile(filePath: string): GithubEvidenceFile {
  if (!existsSync(filePath)) {
    throw new Error(
      `Evidence file not found: ${filePath}\n` +
      "Run 'pnpm github:evidence' first to generate it."
    );
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch (e) {
    throw new Error(`Cannot read evidence file: ${(e as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Evidence file is not valid JSON: ${(e as Error).message}`);
  }

  const data = parsed as GithubEvidenceFile;
  if (!data.updated || !data.owner || !Array.isArray(data.repositories)) {
    throw new Error(
      'Evidence file is missing required fields (updated, owner, repositories).\n' +
      "Re-run 'pnpm github:evidence' to regenerate it."
    );
  }

  return data;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function storeEvidenceEvents(
  client: LocusGraphClient,
  graphId: string,
  evidence: GithubEvidenceFile,
  filePath: string,
  storedAt: string
): Promise<StoreSummary> {
  const factId: ContextId = 'fact:github_evidence';

  await storeMemory(client, graphId, {
    event_kind: 'fact',
    context_id: factId,
    source: 'pnpm github:evidence:store',
    payload: {
      data: {
        updated: evidence.updated,
        owner: evidence.owner,
        scope: evidence.scope,
        generated_by: evidence.generated_by,
        repository_count: evidence.repositories.length,
        stored_at: storedAt,
      },
    },
  });

  await storeMemory(client, graphId, {
    event_kind: 'action',
    context_id: 'action:github_evidence_stored',
    source: 'pnpm github:evidence:store',
    payload: {
      data: {
        file_path: filePath,
        evidence_updated: evidence.updated,
        repository_count: evidence.repositories.length,
        stored_at: storedAt,
      },
    },
    reinforces: [factId],
  });

  return { eventsStored: 2, graphId, storedAt };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

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

  let client: LocusGraphClient;
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
  console.log(`  action:github_evidence_stored  (reinforces fact:github_evidence)`);
}

if (require.main === module) {
  const command = process.argv[2];

  if (command === 'store') {
    store().catch((e: unknown) => {
      console.error(`ERROR: ${(e as Error).message ?? String(e)}`);
      process.exit(1);
    });
  } else {
    console.error('Usage: tsx scripts/store-github-evidence.ts store');
    process.exit(1);
  }
}
