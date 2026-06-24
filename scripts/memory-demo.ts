// ---------------------------------------------------------------------------
// End-to-end demo: store and retrieve generated agent data in LocusGraph.
//
// Prerequisites:
//   1. Install the LocusGraph SDK (see scripts/memory/client.ts TODO)
//   2. export LOCUS_API_KEY=<your-key>
//   3. export LOCUS_GRAPH_ID=<your-graph-id>
//   4. pnpm github:evidence   (generates the evidence file this demo reads)
//
// Run:
//   pnpm memory:demo
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import {
  createClientFromEnv,
  storeMemory,
  getMemoryContext,
  listMemoryContexts,
  retrieveMemories,
} from './memory/index.js';

const SCRIPT_DIR = dirname(__filename);
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const EVIDENCE_PATH = resolve(REPO_ROOT, 'generated/github-evidence/github-evidence.json');
const CANDIDATE_PATH = resolve(REPO_ROOT, 'resume-agent-dataset/candidate/candidate-profile.json');

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  // 1. Initialize client from environment
  // -------------------------------------------------------------------------
  let session: ReturnType<typeof createClientFromEnv>;
  try {
    session = createClientFromEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }

  const { client, graphId } = session;
  log(`Connected. Graph: ${graphId}`);

  // -------------------------------------------------------------------------
  // 2. Load generated GitHub evidence
  // -------------------------------------------------------------------------
  if (!existsSync(EVIDENCE_PATH)) {
    process.stderr.write(
      'GitHub evidence file not found. Run `pnpm github:evidence` first.\n'
    );
    process.exit(1);
  }

  const evidenceRaw = readFileSync(EVIDENCE_PATH, 'utf-8');
  const evidenceData = JSON.parse(evidenceRaw) as Record<string, unknown>;
  log(`Loaded evidence: ${Object.keys(evidenceData).length} top-level keys`);

  // -------------------------------------------------------------------------
  // 3. Load candidate profile
  // -------------------------------------------------------------------------
  const candidateRaw = readFileSync(CANDIDATE_PATH, 'utf-8');
  const candidateData = JSON.parse(candidateRaw) as Record<string, unknown>;

  // -------------------------------------------------------------------------
  // 4. Store facts
  // -------------------------------------------------------------------------
  log('\n-- Storing facts --');

  await storeMemory(client, graphId, {
    event_kind: 'fact',
    context_id: 'fact:github_evidence',
    source: 'agent',
    payload: { data: evidenceData },
  });
  log('Stored: fact:github_evidence');

  await storeMemory(client, graphId, {
    event_kind: 'fact',
    context_id: 'fact:candidate_profile',
    source: 'agent',
    payload: { data: candidateData },
    related_to: ['fact:github_evidence'],
  });
  log('Stored: fact:candidate_profile (related_to: fact:github_evidence)');

  // -------------------------------------------------------------------------
  // 5. Store a decision — demonstrates a non-fact event kind
  // -------------------------------------------------------------------------
  await storeMemory(client, graphId, {
    event_kind: 'decision',
    context_id: 'decision:last_evidence_run',
    source: 'agent',
    payload: {
      data: {
        ran_at: new Date().toISOString(),
        owner: 'merklenode',
        scope: 'all_repositories_including_private',
      },
    },
    reinforces: ['fact:github_evidence'],
  });
  log('Stored: decision:last_evidence_run');

  // -------------------------------------------------------------------------
  // 6. Retrieve a specific context
  // -------------------------------------------------------------------------
  log('\n-- Retrieving fact:github_evidence --');
  const ctx = await getMemoryContext(client, graphId, 'fact:github_evidence');
  if (ctx === null) {
    log('Context not found (returned null — this is expected on first run if the store has not synced yet)');
  } else {
    log(`Retrieved: ${JSON.stringify(ctx).slice(0, 120)}...`);
  }

  // -------------------------------------------------------------------------
  // 7. Bulk retrieve
  // -------------------------------------------------------------------------
  log('\n-- Bulk retrieve --');
  const results = await retrieveMemories(client, graphId, [
    'fact:github_evidence',
    'fact:candidate_profile',
    'fact:nonexistent_context',
  ]);
  results.forEach((r, i) => {
    const ids = ['fact:github_evidence', 'fact:candidate_profile', 'fact:nonexistent_context'] as const;
    log(`  ${ids[i]}: ${r === null ? 'null (not found)' : 'found'}`);
  });

  // -------------------------------------------------------------------------
  // 8. List all fact-type contexts
  // -------------------------------------------------------------------------
  log('\n-- Listing fact contexts (limit 50) --');
  const allFacts = await listMemoryContexts(client, graphId, 'fact', 50);
  log(`Found ${allFacts.length} fact context(s)`);

  log('\nDone.');
}

main().catch((err: unknown) => {
  process.stderr.write(`Unhandled error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
