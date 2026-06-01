import dotenv from "dotenv";
dotenv.config({ override: true });
import { LocusGraphClient } from "@locusgraph/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { fetchGitHubActivity } from "./lib/github.js";
import { WEEKLY_SUMMARY_PROMPT } from "./lib/prompts.js";
import { writePortfolioContent } from "./lib/content.js";

async function main(): Promise<void> {
  const {
    GITHUB_TOKEN,
    GITHUB_USER,
    GEMINI_API_KEY,
    LOCUSGRAPH_SERVER_URL,
    LOCUSGRAPH_AGENT_SECRET,
    GRAPH_ID = "default",
    OUTPUT_PATH = "content/weekly.md",
  } = process.env;

  const missingVars = [];
  if (!GITHUB_TOKEN) missingVars.push("GITHUB_TOKEN");
  if (!GITHUB_USER) missingVars.push("GITHUB_USER");
  if (!GEMINI_API_KEY) missingVars.push("GEMINI_API_KEY");
  if (!LOCUSGRAPH_AGENT_SECRET) missingVars.push("LOCUSGRAPH_AGENT_SECRET");

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
    console.error(
      "Please check your .env file and ensure all required variables are set.",
    );
    process.exit(1);
  }

  // 1. Initialize Clients
  const locusClient = new LocusGraphClient({
    serverUrl: LOCUSGRAPH_SERVER_URL || "https://api.locusgraph.com",
    graphId: GRAPH_ID,
    ...(LOCUSGRAPH_AGENT_SECRET ? { agentSecret: LOCUSGRAPH_AGENT_SECRET } : {}),
  });

  const model = new ChatGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY as string,
    temperature: 0,
    model: "gemini-3.1-flash-lite",
  });

  try {
    // 2. Fetch GitHub Activity
    console.log(`Fetching activity for ${GITHUB_USER}...`);
    const events = await fetchGitHubActivity({
      user: GITHUB_USER as string,
      token: GITHUB_TOKEN as string,
    });

    if (events.length === 0) {
      console.log("No GitHub activity found in the last 7 days. Exiting.");
      return;
    }

    // 3. Retrieve Memory from LocusGraph
    console.log("Retrieving context from LocusGraph...");
    const context = await locusClient.retrieveMemories({
      query:
        "What is the user's writing style, preferences, and what were the key highlights from previous weekly updates?",
      limit: 10,
    });

    // 4. Generate Weekly Summary
    console.log("Generating weekly summary...");
    const prompt = await WEEKLY_SUMMARY_PROMPT.format({
      events: JSON.stringify(events, null, 2),
      memory: context?.memories || "No previous context found.",
    });

    const response = await model.invoke(prompt);
    const summary = response.content as string;

    // 5. Write to Portfolio
    await writePortfolioContent(summary, OUTPUT_PATH);

    // 6. Store Memory in LocusGraph
    console.log("Storing summary in LocusGraph memory...");
    await locusClient.storeEvent({
      graph_id: GRAPH_ID,
      event_kind: "fact",
      source: "agent",
      context_id: `weekly:update:${new Date().toISOString().split("T")[0]}`,
      payload: {
        data: {
          type: "weekly_summary",
          content: summary,
          timestamp: new Date().toISOString(),
          event_count: events.length,
        },
      },
    });

    console.log("Weekly update completed successfully!");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to update portfolio:", message);
    process.exit(1);
  }
}

main();
