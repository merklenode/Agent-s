import { db } from "./db";
import { writeLocusFacts } from "../tools/locusgraph.tool";

type ActivityLike = {
  type: string;
  repoName: string;
  title: string;
  occurredAt?: Date;
};

export async function storeWeeklyLocusFacts(input: {
  weekStart: string;
  weekEnd: string;
  content: string;
  activities: ActivityLike[];
}) {
  const repos = [...new Set(input.activities.map((activity) => activity.repoName))].slice(0, 12);

  return writeLocusFacts([
    {
      type: "weekly",
      title: `Weekly report ${input.weekStart} to ${input.weekEnd}`,
      content: [
        `Week: ${input.weekStart} to ${input.weekEnd}`,
        `Repos touched: ${repos.join(", ") || "none"}`,
        "Report:",
        input.content,
      ].join("\n"),
      metadata: {
        weekStart: input.weekStart,
        weekEnd: input.weekEnd,
        repos,
      },
    },
  ]);
}

export async function storeMonthlyLocusFacts(input: {
  year: number;
  month: number;
  content: string;
  activityCount: number;
  weeklyReportCount: number;
}) {
  const label = `${input.year}-${String(input.month).padStart(2, "0")}`;

  return writeLocusFacts([
    {
      type: "monthly",
      title: `Monthly report ${label}`,
      content: [
        `Month: ${label}`,
        `Activity count: ${input.activityCount}`,
        `Weekly reports included: ${input.weeklyReportCount}`,
        "Report:",
        input.content,
      ].join("\n"),
      metadata: {
        year: input.year,
        month: input.month,
        activityCount: input.activityCount,
        weeklyReportCount: input.weeklyReportCount,
      },
    },
  ]);
}

export async function storeGithubLocusFacts() {
  const [repos, activities] = await Promise.all([
    db.repository.findMany({ orderBy: { pushedAt: "desc" }, take: 20 }),
    db.githubActivity.findMany({ orderBy: { occurredAt: "desc" }, take: 80 }),
  ]);

  const languages = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1);
  }

  const projectFacts = repos.slice(0, 10).map((repo) => ({
    type: "project" as const,
    title: `Project ${repo.fullName}`,
    content: [
      `Repository: ${repo.fullName}`,
      repo.description ? `Description: ${repo.description}` : null,
      repo.language ? `Primary language: ${repo.language}` : null,
      `Stars: ${repo.starCount}`,
      `Forks: ${repo.forkCount}`,
      repo.pushedAt ? `Last pushed: ${repo.pushedAt.toISOString().slice(0, 10)}` : null,
    ].filter(Boolean).join("\n"),
    metadata: {
      repo: repo.fullName,
      language: repo.language ?? "",
      stars: repo.starCount,
      forks: repo.forkCount,
    },
  }));

  const skillFact = {
    type: "skill" as const,
    title: "Developer skill history from GitHub activity",
    content: [
      "Languages seen in recent repositories:",
      [...languages.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([language, count]) => `- ${language}: ${count} repos`)
        .join("\n") || "- No language metadata available",
      "",
      "Recent activity signals:",
      activities.slice(0, 20).map((activity) => `- [${activity.type}] ${activity.repoName}: ${activity.title}`).join("\n") || "- No activity available",
    ].join("\n"),
    metadata: {
      languages: [...languages.keys()],
      activityCount: activities.length,
    },
  };

  return writeLocusFacts([...projectFacts, skillFact]);
}
