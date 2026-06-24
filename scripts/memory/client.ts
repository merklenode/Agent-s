import type { LocusGraphClient } from './types.js';

export interface LocusGraphSession {
  client: LocusGraphClient;
  graphId: string;
}

export function createClientFromEnv(): LocusGraphSession {
  const agentSecret = process.env['LOCUSGRAPH_AGENT_SECRET'];
  const graphId = process.env['LOCUSGRAPH_GRAPH_ID'] ?? 'default';
  const serverUrl = process.env['LOCUSGRAPH_SERVER_URL'];

  if (!agentSecret) {
    throw new Error(
      'Missing required env var: LOCUSGRAPH_AGENT_SECRET.\n' +
      'Copy .env.example to .env and fill in your LocusGraph agent secret.'
    );
  }

  let LocusGraphClientCtor: new (config: {
    serverUrl?: string;
    agentSecret?: string;
  }) => LocusGraphClient;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@locusgraph/client') as {
      LocusGraphClient: typeof LocusGraphClientCtor;
    };
    LocusGraphClientCtor = mod.LocusGraphClient;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error('@locusgraph/client is not installed. Run: pnpm install');
    }
    throw new Error('@locusgraph/client failed to load: ' + (e as Error).message);
  }

  if (typeof LocusGraphClientCtor !== 'function') {
    throw new Error('@locusgraph/client does not export LocusGraphClient');
  }

  const client = new LocusGraphClientCtor({
    ...(serverUrl ? { serverUrl } : {}),
    agentSecret,
  });
  return { client, graphId };
}

// Accepts an already-constructed SDK client — useful in tests and when the
// caller manages the SDK lifecycle itself.
export function createSession(
  client: LocusGraphClient,
  graphId: string
): LocusGraphSession {
  return { client, graphId };
}
