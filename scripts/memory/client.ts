// ---------------------------------------------------------------------------
// LocusGraph client factory
//
// To use this module, install the SDK and replace the stub below:
//   pnpm add @merklenode/locusgraph-sdk   (confirm exact package name with team)
//
// Then swap the `createClient` body for:
//   import { LocusGraphSdk } from '@merklenode/locusgraph-sdk';
//   const sdk = new LocusGraphSdk({ apiKey });
//   return { client: sdk, graphId };
// ---------------------------------------------------------------------------

import type { LocusGraphClient } from './types.js';

export interface LocusGraphSession {
  client: LocusGraphClient;
  graphId: string;
}

export function createClientFromEnv(): LocusGraphSession {
  const apiKey = process.env['LOCUS_API_KEY'];
  const graphId = process.env['LOCUS_GRAPH_ID'];

  if (!apiKey || !graphId) {
    throw new Error(
      'Missing required env vars: set LOCUS_API_KEY and LOCUS_GRAPH_ID before running this script.'
    );
  }

  // TODO: replace with real SDK once package name is confirmed.
  // Import the SDK client here and pass `apiKey` to its constructor.
  throw new Error(
    'LocusGraph SDK not yet installed. ' +
    'See the TODO in scripts/memory/client.ts and install the SDK package first.'
  );
}

// Accepts an already-constructed SDK client — useful in tests and when the
// caller manages the SDK lifecycle itself.
export function createSession(
  client: LocusGraphClient,
  graphId: string
): LocusGraphSession {
  return { client, graphId };
}
