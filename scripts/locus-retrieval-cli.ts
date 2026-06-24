import { existsSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import {
  checkLocusCredentials,
  createLocusClient,
  runWorkflow,
  validateOutput,
  LocusValidationError,
  type LocusWorkflowConfig,
  type LocusRetrievalOutput,
} from "./locus-retrieval";

const SCRIPT_DIR = dirname(__filename);
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = resolve(REPO_ROOT, "generated/locus-retrieval/locus-retrieval.json");

// ---------------------------------------------------------------------------
// Default config — wires the resume-agent retrieval task
// Override by setting LOCUSGRAPH_AGENT_SECRET and LOCUSGRAPH_GRAPH_ID in env.
// Future: parse optional --query / --limit / --context-ids flags from argv.
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: LocusWorkflowConfig = {
  taskLabel: "resume-evidence-backend-reliability",
  retrieval: {
    graphId: process.env["LOCUSGRAPH_GRAPH_ID"] ?? "",
    query: "resume evidence for backend reliability work",
    limit: 10,
    contextIds: ["fact:resume_evidence"],
    contextTypes: { fact: ["resume_evidence"] },
  },
  insight: {
    graphId: process.env["LOCUSGRAPH_GRAPH_ID"] ?? "",
    task: "What resume evidence best supports this target role?",
    locusQuery: "project evidence impact metrics target role",
    limit: 10,
  },
};

// ---------------------------------------------------------------------------
// Retrieve command
// ---------------------------------------------------------------------------

async function retrieve(): Promise<void> {
  const credError = checkLocusCredentials();
  if (credError) {
    console.error(`ERROR: ${credError}`);
    process.exit(1);
  }

  const client = createLocusClient();
  const warnings: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  console.log("Querying LocusGraph...");
  console.log(`  graph:   ${DEFAULT_CONFIG.retrieval.graphId}`);
  console.log(`  query:   ${DEFAULT_CONFIG.retrieval.query}`);
  console.log(`  limit:   ${DEFAULT_CONFIG.retrieval.limit}`);

  let output: LocusRetrievalOutput;
  try {
    output = await runWorkflow(client, DEFAULT_CONFIG, warnings, today);
  } catch (e) {
    console.error(`ERROR: ${(e as Error).message}`);
    process.exit(1);
  }

  try {
    validateOutput(output);
  } catch (e) {
    if (e instanceof LocusValidationError) {
      console.error(`ERROR: Output validation failed: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");

  console.log(`\nOutput written: ${OUTPUT_PATH}`);
  console.log(`
Summary:
  items_found:  ${output.items_found}
  memories:     ${output.memories.length}
  confidence:   ${output.resume_relevance_insight.confidence}
  warnings:     ${output.retrieval_warnings.length}`);

  if (output.retrieval_warnings.length > 0) {
    console.log("\nWarnings:");
    for (const w of output.retrieval_warnings) {
      console.log(`  [WARN] ${w}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check command
// ---------------------------------------------------------------------------

function check(): void {
  if (!existsSync(OUTPUT_PATH)) {
    console.error(`ERROR: ${OUTPUT_PATH} does not exist.`);
    console.error("Run 'pnpm locus:retrieval' first.");
    process.exit(1);
  }

  let raw: string;
  try {
    raw = readFileSync(OUTPUT_PATH, "utf-8");
  } catch (e) {
    console.error(`ERROR: Cannot read file: ${(e as Error).message}`);
    process.exit(1);
  }

  let data: LocusRetrievalOutput;
  try {
    data = JSON.parse(raw) as LocusRetrievalOutput;
  } catch (e) {
    console.error(`ERROR: JSON parse failed: ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`Checking: ${OUTPUT_PATH}`);

  try {
    validateOutput(data);
  } catch (e) {
    if (e instanceof LocusValidationError) {
      console.error(`ERROR: Validation failed: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  console.log(
    `  items_found: ${data.items_found}, updated: ${data.updated}, task: ${data.task_label}`
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const command = process.argv[2];

if (command === "retrieve") {
  retrieve().catch((e: unknown) => {
    console.error(`FATAL: ${(e as Error).message ?? String(e)}`);
    process.exit(1);
  });
} else if (command === "check") {
  check();
} else {
  console.error("Usage: tsx scripts/locus-retrieval-cli.ts [retrieve|check]");
  process.exit(1);
}
