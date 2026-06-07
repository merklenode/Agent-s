import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { storeMonthlyLocusFacts } from "../lib/locus-memory";
import { generateText } from "../tools/ai.tool";
import { queryLocusMemory } from "../tools/locusgraph.tool";

export async function generateMonthlyReport() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const [activities, weeklyReports] = await Promise.all([
    db.githubActivity.findMany({
      where: { occurredAt: { gte: monthStart, lt: monthEnd } },
      orderBy: { occurredAt: "desc" },
    }),
    db.weeklyReport.findMany({
      where: { weekStart: { gte: monthStart, lt: monthEnd } },
      orderBy: { weekStart: "asc" },
    }),
  ]);

  if (activities.length === 0 && weeklyReports.length === 0) {
    return {
      created: false,
      message: "No activity this month.",
    };
  }

  const activityText = activities
    .map((a) => `- [${a.type}] ${a.repoName}: ${a.title}`)
    .join("\n");

  const weeklyText = weeklyReports
    .map((r) => `### Week of ${r.weekStart.toISOString().slice(0, 10)}\n${r.content}`)
    .join("\n\n");

  let memoryContext = "";
  try {
    memoryContext = await queryLocusMemory("developer monthly progress skills project history accomplishments", 8);
  } catch (error) {
    console.warn("LocusGraph monthly context skipped:", error instanceof Error ? error.message : error);
  }

  const prompt = `You are a developer writing a personal monthly progress report.

## GitHub Activity This Month
${activityText || "No tracked activity."}

## Weekly Reports This Month
${weeklyText || "No weekly reports."}

## Long-Term Memory
${memoryContext || "No LocusGraph memory available."}

Write a concise monthly summary in Markdown. Include:
1. Overall theme of the month
2. Key accomplishments
3. Projects worked on
4. Skills demonstrated or improved
5. What to focus on next month

Keep it personal, factual, and under 600 words.`;

  console.log("Generating monthly report...");
  const content = await generateText(prompt);

  const monthLabel = `${year}-${String(month).padStart(2, "0")}`;

  await db.monthlyReport.upsert({
    where: { month_year: { month, year } },
    update: { content },
    create: { month, year, content },
  });

  const filePath = path.join("content", "reports", "monthly", `${monthLabel}.md`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `# Monthly Report: ${monthLabel}\n\n${content}\n`);

  await db.monthlyReport.update({
    where: { month_year: { month, year } },
    data: { filePath },
  });

  try {
    const result = await storeMonthlyLocusFacts({
      year,
      month,
      content,
      activityCount: activities.length,
      weeklyReportCount: weeklyReports.length,
    });
    if (result.stored > 0) console.log(`✓ LocusGraph monthly facts: ${result.stored} stored`);
  } catch (error) {
    console.warn("LocusGraph monthly memory skipped:", error instanceof Error ? error.message : error);
  }

  return {
    created: true,
    filePath,
    month,
    year,
  };
}

async function main() {
  const { runWorkflow } = await import("../lib/workflow");
  const result = await runWorkflow("generate:monthly", generateMonthlyReport);

  if (!result.created) {
    console.log(result.message);
    await db.$disconnect();
    return;
  }

  console.log(`✓ Report saved to ${result.filePath}`);
  await db.$disconnect();
}

if (process.argv[1]?.endsWith("monthly.generator.ts") || process.argv[1]?.endsWith("monthly.generator.js")) {
  main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
}
