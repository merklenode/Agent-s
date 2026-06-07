import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { storeWeeklyLocusFacts } from "../lib/locus-memory";
import { generateText } from "../tools/ai.tool";
import { queryLocusMemory } from "../tools/locusgraph.tool";

export async function generateWeeklyReport() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activities = await db.githubActivity.findMany({
    where: { occurredAt: { gte: weekAgo } },
    orderBy: { occurredAt: "desc" },
  });

  if (activities.length === 0) {
    return {
      created: false,
      message: "No activity in the last 7 days.",
    };
  }

  const activityText = activities
    .map((a) => `- [${a.type}] ${a.repoName}: ${a.title}`)
    .join("\n");

  let memoryContext = "";
  try {
    memoryContext = await queryLocusMemory("developer weekly patterns project progress recurring themes", 6);
  } catch (error) {
    console.warn("LocusGraph weekly context skipped:", error instanceof Error ? error.message : error);
  }

  const prompt = `You are a developer writing a personal weekly progress report.
Here is the GitHub activity from the last 7 days:

${activityText}

Long-term memory context:
${memoryContext || "No LocusGraph memory available."}

Write a concise weekly progress report in Markdown. Include:
1. Summary of what was worked on
2. Key accomplishments
3. Repos touched
4. Any patterns or themes

Keep it personal, factual, and under 400 words.`;

  console.log("Generating weekly report...");
  const content = await generateText(prompt);

  const weekStart = weekAgo.toISOString().slice(0, 10);
  const weekEnd = now.toISOString().slice(0, 10);

  // Save to DB
  const report = await db.weeklyReport.create({
    data: { weekStart: weekAgo, weekEnd: now, content },
  });

  // Save to file
  const fileName = `${weekStart}.md`;
  const filePath = path.join("content", "reports", "weekly", fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `# Weekly Report: ${weekStart} -> ${weekEnd}\n\n${content}\n`);

  // Update DB record with filePath
  await db.weeklyReport.update({
    where: { id: report.id },
    data: { filePath },
  });

  try {
    const result = await storeWeeklyLocusFacts({ weekStart, weekEnd, content, activities });
    if (result.stored > 0) console.log(`✓ LocusGraph weekly facts: ${result.stored} stored`);
  } catch (error) {
    console.warn("LocusGraph weekly memory skipped:", error instanceof Error ? error.message : error);
  }

  return {
    created: true,
    filePath,
    reportId: report.id,
  };
}

async function main() {
  const { runWorkflow } = await import("../lib/workflow");
  const result = await runWorkflow("generate:weekly", generateWeeklyReport);

  if (!result.created) {
    console.log(result.message);
    await db.$disconnect();
    return;
  }

  console.log(`✓ Report saved to ${result.filePath}`);
  await db.$disconnect();
}

if (process.argv[1]?.endsWith("weekly.generator.ts") || process.argv[1]?.endsWith("weekly.generator.js")) {
  main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
}
