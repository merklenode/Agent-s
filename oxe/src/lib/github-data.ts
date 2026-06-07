import { db } from "./db";

export async function getGithubSummary() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    profile,
    repos,
    recentActivity,
    weekActivity,
    monthActivity,
    weekRepos,
    monthRepos,
  ] = await Promise.all([
    db.githubProfile.findFirst(),
    db.repository.findMany({ orderBy: { pushedAt: "desc" } }),
    db.githubActivity.findMany({ orderBy: { occurredAt: "desc" }, take: 20 }),
    db.githubActivity.count({ where: { occurredAt: { gte: weekAgo } } }),
    db.githubActivity.count({ where: { occurredAt: { gte: monthAgo } } }),
    db.githubActivity.findMany({
      where: { occurredAt: { gte: weekAgo } },
      distinct: ["repoName"],
      select: { repoName: true },
    }),
    db.githubActivity.findMany({
      where: { occurredAt: { gte: monthAgo } },
      distinct: ["repoName"],
      select: { repoName: true },
    }),
  ]);

  // language distribution
  const langMap: Record<string, number> = {};
  for (const r of repos) {
    if (r.language) langMap[r.language] = (langMap[r.language] ?? 0) + 1;
  }
  const languages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // activity by day (last 30 days)
  const timeline: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    timeline[d.toISOString().slice(0, 10)] = 0;
  }
  const allActivity = await db.githubActivity.findMany({
    where: { occurredAt: { gte: monthAgo } },
    select: { occurredAt: true },
  });
  for (const a of allActivity) {
    const key = a.occurredAt.toISOString().slice(0, 10);
    if (key in timeline) timeline[key]++;
  }

  return {
    profile,
    repos,
    recentActivity,
    weekActivity,
    monthActivity,
    languages,
    reposThisWeek: weekRepos.length,
    reposThisMonth: monthRepos.length,
    timeline: Object.entries(timeline).map(([date, count]) => ({ date, count })),
  };
}
