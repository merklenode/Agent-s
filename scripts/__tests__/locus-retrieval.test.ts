import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  checkLocusCredentials,
  runRetrieval,
  runInsights,
  buildOutput,
  validateOutput,
  runWorkflow,
  LocusRetrievalError,
  LocusValidationError,
  type LocusGraphClientLike,
  type LocusWorkflowConfig,
  type ContextResult,
  type InsightResult,
} from "../locus-retrieval";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const MOCK_MEMORIES_TEXT =
  "## Backend Reliability Evidence\n\n" +
  "**Agent-s** (2024): Designed async job orchestration over GitHub webhooks. " +
  "Processed 500+ events/day with zero data loss across automated CI pipelines.\n\n" +
  "**fin_Tech** (2024): Built REST API with FastAPI + PostgreSQL. " +
  "Implemented connection pooling and query optimisation cutting p99 latency by 40%.";

const MOCK_INSIGHT_RESULT: InsightResult = {
  insight: "Agent-s demonstrates automation capability at production scale with measurable reliability outcomes",
  recommendation: "Lead with Agent-s for AI automation and platform roles; pair with fin_Tech for backend reliability claims",
  confidence: "high",
};

function makeMockClient(
  overrides?: Partial<LocusGraphClientLike>
): LocusGraphClientLike {
  return {
    retrieveMemories: async (_query) => ({
      memories: MOCK_MEMORIES_TEXT,
      items_found: 2,
    }),
    generateInsights: async (_query) => ({ ...MOCK_INSIGHT_RESULT }),
    ...overrides,
  };
}

const FIXTURE_CONFIG: LocusWorkflowConfig = {
  taskLabel: "resume-evidence-backend-reliability",
  retrieval: {
    graphId: "graph-test-123",
    query: "resume evidence for backend reliability work",
    limit: 10,
    contextIds: ["fact:resume_evidence"],
    contextTypes: { fact: ["resume_evidence"] },
  },
  insight: {
    graphId: "graph-test-123",
    task: "What resume evidence best supports this target role?",
    locusQuery: "project evidence impact metrics target role",
    limit: 10,
  },
};

const MOCK_RETRIEVAL_RESULT: ContextResult = {
  memories: MOCK_MEMORIES_TEXT,
  items_found: 2,
};

// ---------------------------------------------------------------------------
// checkLocusCredentials
// ---------------------------------------------------------------------------

describe("checkLocusCredentials", () => {
  let savedAgentSecret: string | undefined;
  let savedGraphId: string | undefined;

  before(() => {
    savedAgentSecret = process.env["LOCUSGRAPH_AGENT_SECRET"];
    savedGraphId = process.env["LOCUSGRAPH_GRAPH_ID"];
  });

  after(() => {
    if (savedAgentSecret !== undefined) {
      process.env["LOCUSGRAPH_AGENT_SECRET"] = savedAgentSecret;
    } else {
      delete process.env["LOCUSGRAPH_AGENT_SECRET"];
    }
    if (savedGraphId !== undefined) {
      process.env["LOCUSGRAPH_GRAPH_ID"] = savedGraphId;
    } else {
      delete process.env["LOCUSGRAPH_GRAPH_ID"];
    }
  });

  it("returns error string when LOCUSGRAPH_AGENT_SECRET is missing", () => {
    delete process.env["LOCUSGRAPH_AGENT_SECRET"];
    delete process.env["LOCUSGRAPH_GRAPH_ID"];
    const result = checkLocusCredentials();
    assert.ok(result !== null, "expected non-null error string");
    const msg = result ?? "";
    assert.ok(
      msg.includes("LOCUSGRAPH_AGENT_SECRET"),
      `error should mention LOCUSGRAPH_AGENT_SECRET, got: ${msg}`
    );
  });

  it("returns error string when LOCUSGRAPH_GRAPH_ID is missing", () => {
    process.env["LOCUSGRAPH_AGENT_SECRET"] = "test-secret";
    delete process.env["LOCUSGRAPH_GRAPH_ID"];
    const result = checkLocusCredentials();
    assert.ok(result !== null, "expected non-null error string");
    const msg = result ?? "";
    assert.ok(
      msg.includes("LOCUSGRAPH_GRAPH_ID"),
      `error should mention LOCUSGRAPH_GRAPH_ID, got: ${msg}`
    );
  });

  it("returns null when both credentials are set", () => {
    process.env["LOCUSGRAPH_AGENT_SECRET"] = "test-secret";
    process.env["LOCUSGRAPH_GRAPH_ID"] = "test-graph-id";
    const result = checkLocusCredentials();
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// runRetrieval
// ---------------------------------------------------------------------------

describe("runRetrieval", () => {
  it("returns empty result without throwing when SDK reports 0 items", async () => {
    const emptyClient = makeMockClient({
      retrieveMemories: async (_q) => ({ memories: "", items_found: 0 }),
    });
    const result = await runRetrieval(emptyClient, FIXTURE_CONFIG.retrieval);
    assert.equal(result.items_found, 0);
    assert.equal(result.memories, "");
  });

  it("passes memories string and item count through from a successful response", async () => {
    const client = makeMockClient();
    const result = await runRetrieval(client, FIXTURE_CONFIG.retrieval);
    assert.equal(result.items_found, 2);
    assert.ok(
      result.memories.includes("Agent-s"),
      "memories text should contain expected content"
    );
  });

  it("wraps SDK errors as LocusRetrievalError with cause", async () => {
    const failClient = makeMockClient({
      retrieveMemories: async (_q) => {
        throw new Error("network timeout");
      },
    });
    await assert.rejects(
      () => runRetrieval(failClient, FIXTURE_CONFIG.retrieval),
      (err: unknown) => {
        assert.ok(err instanceof LocusRetrievalError, "should be LocusRetrievalError");
        assert.ok(
          (err as LocusRetrievalError).message.includes("network timeout"),
          "message should include original error"
        );
        assert.ok(
          (err as LocusRetrievalError).cause instanceof Error,
          "cause should be the original Error"
        );
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// runInsights
// ---------------------------------------------------------------------------

describe("runInsights", () => {
  it("returns structured insight fields from a successful SDK response", async () => {
    const client = makeMockClient();
    const result = await runInsights(client, FIXTURE_CONFIG.insight);
    assert.ok(result.insight.length > 0, "insight should be non-empty");
    assert.ok(result.recommendation.length > 0, "recommendation should be non-empty");
    assert.ok(
      ["low", "medium", "high"].includes(result.confidence),
      `confidence should be low|medium|high, got: ${result.confidence}`
    );
  });

  it("wraps SDK errors as LocusRetrievalError", async () => {
    const failClient = makeMockClient({
      generateInsights: async (_q) => {
        throw new Error("quota exceeded");
      },
    });
    await assert.rejects(
      () => runInsights(failClient, FIXTURE_CONFIG.insight),
      (err: unknown) => {
        assert.ok(err instanceof LocusRetrievalError);
        assert.ok((err as LocusRetrievalError).message.includes("quota exceeded"));
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// buildOutput
// ---------------------------------------------------------------------------

describe("buildOutput", () => {
  it("includes all traceability fields documenting which inputs were used", () => {
    const output = buildOutput(
      FIXTURE_CONFIG,
      MOCK_RETRIEVAL_RESULT,
      MOCK_INSIGHT_RESULT,
      [],
      "2026-01-01"
    );
    assert.equal(output.query_used, FIXTURE_CONFIG.retrieval.query);
    assert.equal(output.graph_id, FIXTURE_CONFIG.retrieval.graphId);
    assert.equal(output.task_label, FIXTURE_CONFIG.taskLabel);
    assert.equal(output.limit_used, FIXTURE_CONFIG.retrieval.limit);
    assert.deepEqual(output.context_ids_used, ["fact:resume_evidence"]);
    assert.deepEqual(output.context_types_used, { fact: ["resume_evidence"] });
  });

  it("propagates items_found and memories from retrieval result", () => {
    const output = buildOutput(
      FIXTURE_CONFIG,
      MOCK_RETRIEVAL_RESULT,
      MOCK_INSIGHT_RESULT,
      [],
      "2026-01-01"
    );
    assert.equal(output.items_found, 2);
    assert.equal(output.memories, MOCK_MEMORIES_TEXT);
  });

  it("maps insight fields explicitly onto resume_relevance_insight", () => {
    const output = buildOutput(
      FIXTURE_CONFIG,
      MOCK_RETRIEVAL_RESULT,
      MOCK_INSIGHT_RESULT,
      [],
      "2026-01-01"
    );
    assert.equal(output.resume_relevance_insight.insight, MOCK_INSIGHT_RESULT.insight);
    assert.equal(output.resume_relevance_insight.recommendation, MOCK_INSIGHT_RESULT.recommendation);
    assert.equal(output.resume_relevance_insight.confidence, "high");
  });

  it("sets source and generated_by correctly", () => {
    const output = buildOutput(
      FIXTURE_CONFIG,
      MOCK_RETRIEVAL_RESULT,
      MOCK_INSIGHT_RESULT,
      [],
      "2026-01-01"
    );
    assert.equal(output.source, "locusgraph");
    assert.equal(output.generated_by, "pnpm locus:retrieval");
  });

  it("sets context_ids_used to null when contextIds is omitted", () => {
    const configWithoutFilters: LocusWorkflowConfig = {
      ...FIXTURE_CONFIG,
      retrieval: {
        ...FIXTURE_CONFIG.retrieval,
        contextIds: undefined,
        contextTypes: undefined,
      },
    };
    const output = buildOutput(
      configWithoutFilters,
      MOCK_RETRIEVAL_RESULT,
      MOCK_INSIGHT_RESULT,
      [],
      "2026-01-01"
    );
    assert.equal(output.context_ids_used, null);
    assert.equal(output.context_types_used, null);
  });
});

// ---------------------------------------------------------------------------
// validateOutput
// ---------------------------------------------------------------------------

describe("validateOutput", () => {
  function makeValidOutput() {
    return buildOutput(
      FIXTURE_CONFIG,
      MOCK_RETRIEVAL_RESULT,
      MOCK_INSIGHT_RESULT,
      [],
      "2026-01-01"
    );
  }

  it("does not throw for a fully valid output object", () => {
    assert.doesNotThrow(() => validateOutput(makeValidOutput()));
  });

  it("throws LocusValidationError when memories field is missing", () => {
    const output = makeValidOutput();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).memories = undefined;
    assert.throws(() => validateOutput(output), LocusValidationError);
  });

  it("throws LocusValidationError when confidence is not a valid value", () => {
    const output = makeValidOutput();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output.resume_relevance_insight as any).confidence = "very-high";
    assert.throws(() => validateOutput(output), LocusValidationError);
  });

  it("throws LocusValidationError when items_found is missing", () => {
    const output = makeValidOutput();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).items_found = undefined;
    assert.throws(() => validateOutput(output), LocusValidationError);
  });
});

// ---------------------------------------------------------------------------
// runWorkflow (end-to-end with mock client)
// ---------------------------------------------------------------------------

describe("runWorkflow", () => {
  it("produces output that passes validateOutput", async () => {
    const client = makeMockClient();
    const warnings: string[] = [];
    const output = await runWorkflow(client, FIXTURE_CONFIG, warnings, "2026-01-01");
    assert.doesNotThrow(() => validateOutput(output));
  });

  it("records a warning when retrieval returns 0 items (empty result)", async () => {
    const client = makeMockClient({
      retrieveMemories: async (_q) => ({ memories: "", items_found: 0 }),
    });
    const warnings: string[] = [];
    const output = await runWorkflow(client, FIXTURE_CONFIG, warnings, "2026-01-01");
    assert.equal(output.items_found, 0);
    assert.ok(warnings.length > 0, "should emit a warning for empty retrieval");
    assert.ok(
      warnings[0]?.includes("0 items"),
      `unexpected warning text: ${warnings[0] ?? ""}`
    );
  });

  it("includes both memories text and insight in the output", async () => {
    const client = makeMockClient();
    const output = await runWorkflow(client, FIXTURE_CONFIG, [], "2026-01-01");
    assert.ok(output.memories.length > 0, "memories should be non-empty");
    assert.ok(output.resume_relevance_insight.insight.length > 0, "insight should be non-empty");
    assert.equal(output.resume_relevance_insight.confidence, "high");
  });
});
