import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  checkStoreCredentials,
  readEvidenceFile,
  storeEvidenceEvents,
  type GithubEvidenceFile,
  type StoreSummary,
} from '../github-evidence-store/index.js';
import type { LocusGraphMemoryClient } from '../memory/types';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeMockClient(overrides?: Partial<LocusGraphMemoryClient>): LocusGraphMemoryClient {
  return {
    storeEvent: async (_params) => ({}),
    getContext: async (_params) => ({
      context_id: 'fact:test',
      context: {
        context_id: 'fact:test',
        context_type: 'fact',
        context_name: 'test',
        created_at: 0,
        updated_at: 0,
        reference_count: 0,
      },
      locus_id: 'locus_test',
      payload: {},
    }),
    listContextTypes: async (_graphId, _options) => ({
      context_types: [],
      total: 0,
      page: 0,
      page_size: 0,
    }),
    listContextsByType: async (_contextType, _graphId, _options) => ({
      contexts: [],
      total: 0,
      page: 0,
      page_size: 0,
    }),
    ...overrides,
  };
}

const FIXTURE_EVIDENCE: GithubEvidenceFile = {
  updated: '2026-06-24',
  source: 'github',
  owner: 'merklenode',
  scope: 'all_repositories_including_private',
  generated_by: 'pnpm github:evidence',
  repositories: [
    { repo_name: 'Agent-s' },
    { repo_name: 'fin_Tech' },
  ],
};

const STORED_AT = '2026-06-24T12:00:00.000Z';

// ---------------------------------------------------------------------------
// checkStoreCredentials
// ---------------------------------------------------------------------------

describe('checkStoreCredentials', () => {
  let savedSecret: string | undefined;

  before(() => {
    savedSecret = process.env['LOCUSGRAPH_AGENT_SECRET'];
  });

  after(() => {
    if (savedSecret !== undefined) {
      process.env['LOCUSGRAPH_AGENT_SECRET'] = savedSecret;
    } else {
      delete process.env['LOCUSGRAPH_AGENT_SECRET'];
    }
  });

  it('returns error string when LOCUSGRAPH_AGENT_SECRET is missing', () => {
    delete process.env['LOCUSGRAPH_AGENT_SECRET'];
    const result = checkStoreCredentials();
    assert.ok(result !== null, 'expected an error string');
    assert.ok(
      result.includes('LOCUSGRAPH_AGENT_SECRET'),
      'error message should mention the missing env var'
    );
  });

  it('returns null when LOCUSGRAPH_AGENT_SECRET is set', () => {
    process.env['LOCUSGRAPH_AGENT_SECRET'] = 'test-secret';
    const result = checkStoreCredentials();
    assert.equal(result, null);
  });

  it('does not require LOCUSGRAPH_GRAPH_ID', () => {
    process.env['LOCUSGRAPH_AGENT_SECRET'] = 'test-secret';
    delete process.env['LOCUSGRAPH_GRAPH_ID'];
    const result = checkStoreCredentials();
    assert.equal(result, null, 'LOCUSGRAPH_GRAPH_ID has a default and must not block');
  });
});

// ---------------------------------------------------------------------------
// readEvidenceFile
// ---------------------------------------------------------------------------

describe('readEvidenceFile', () => {
  const tmpPath = resolve('/tmp', 'store-github-evidence-test-fixture.json');

  before(() => {
    writeFileSync(tmpPath, JSON.stringify(FIXTURE_EVIDENCE, null, 2), 'utf-8');
  });

  after(() => {
    if (existsSync(tmpPath)) {
      unlinkSync(tmpPath);
    }
  });

  it('throws when the file does not exist', () => {
    assert.throws(
      () => readEvidenceFile('/tmp/does-not-exist-xyzzy.json'),
      (e: unknown) => {
        assert.ok(e instanceof Error);
        assert.ok(
          e.message.includes('not found') || e.message.includes('pnpm github:evidence'),
          'error should guide the user to run pnpm github:evidence'
        );
        return true;
      }
    );
  });

  it('throws when the file is not valid JSON', () => {
    const badPath = resolve('/tmp', 'store-github-evidence-test-bad.json');
    writeFileSync(badPath, 'this is not json', 'utf-8');
    try {
      assert.throws(
        () => readEvidenceFile(badPath),
        (e: unknown) => {
          assert.ok(e instanceof Error);
          assert.ok(e.message.includes('JSON'), 'error should mention JSON');
          return true;
        }
      );
    } finally {
      if (existsSync(badPath)) {
        unlinkSync(badPath);
      }
    }
  });

  it('parses and returns a valid evidence file', () => {
    const result = readEvidenceFile(tmpPath);
    assert.equal(result.updated, FIXTURE_EVIDENCE.updated);
    assert.equal(result.owner, FIXTURE_EVIDENCE.owner);
    assert.equal(result.repositories.length, 2);
  });
});

// ---------------------------------------------------------------------------
// storeEvidenceEvents
// ---------------------------------------------------------------------------

describe('storeEvidenceEvents', () => {
  it('calls storeEvent exactly twice', async () => {
    let callCount = 0;
    const client = makeMockClient({
      storeEvent: async (_params) => { callCount++; return {}; },
    });
    await storeEvidenceEvents(client, 'graph-test', FIXTURE_EVIDENCE, '/fake/path.json', STORED_AT);
    assert.equal(callCount, 2);
  });

  it('first event is fact:github_evidence with correct payload', async () => {
    const calls: Parameters<LocusGraphMemoryClient['storeEvent']>[0][] = [];
    const client = makeMockClient({
      storeEvent: async (params) => { calls.push(params); return {}; },
    });

    await storeEvidenceEvents(client, 'graph-test', FIXTURE_EVIDENCE, '/fake/path.json', STORED_AT);

    const first = calls[0];
    assert.ok(first, 'first storeEvent call must exist');
    assert.equal(first.context_id, 'fact:github_evidence');
    assert.equal(first.event_kind, 'fact');
    assert.equal(first.graph_id, 'graph-test');
    assert.equal(first.source, 'tool');
    assert.equal(
      (first.payload.data as Record<string, unknown>)['repository_count'],
      2
    );
    assert.equal(
      (first.payload.data as Record<string, unknown>)['owner'],
      'merklenode'
    );
    assert.equal(
      (first.payload.data as Record<string, unknown>)['stored_at'],
      STORED_AT
    );
    assert.equal(
      (first.payload.data as Record<string, unknown>)['stored_by'],
      'pnpm github:evidence:store'
    );
  });

  it('second event is action:github_evidence_stored with reinforces link', async () => {
    const calls: Parameters<LocusGraphMemoryClient['storeEvent']>[0][] = [];
    const client = makeMockClient({
      storeEvent: async (params) => { calls.push(params); return {}; },
    });

    await storeEvidenceEvents(client, 'graph-test', FIXTURE_EVIDENCE, '/fake/path.json', STORED_AT);

    const second = calls[1];
    assert.ok(second, 'second storeEvent call must exist');
    assert.equal(second.context_id, 'action:github_evidence_stored');
    assert.equal(second.event_kind, 'action');
    assert.ok(
      Array.isArray(second.reinforces) && second.reinforces.includes('fact:github_evidence'),
      'action event must reinforce fact:github_evidence'
    );
    assert.equal(
      (second.payload.data as Record<string, unknown>)['file_path'],
      '/fake/path.json'
    );
  });

  it('returns StoreSummary with correct fields', async () => {
    const client = makeMockClient();
    const summary: StoreSummary = await storeEvidenceEvents(
      client,
      'graph-xyz',
      FIXTURE_EVIDENCE,
      '/fake/path.json',
      STORED_AT
    );
    assert.equal(summary.eventsStored, 2);
    assert.equal(summary.graphId, 'graph-xyz');
    assert.equal(summary.storedAt, STORED_AT);
  });

  it('propagates SDK errors', async () => {
    const client = makeMockClient({
      storeEvent: async () => { throw new Error('SDK unavailable'); },
    });
    await assert.rejects(
      () => storeEvidenceEvents(client, 'graph-test', FIXTURE_EVIDENCE, '/fake/path.json', STORED_AT),
      /SDK unavailable/
    );
  });
});
