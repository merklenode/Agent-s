import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const profile = await db.githubProfile.upsert({
    where: { login: "octocat" },
    update: {},
    create: {
      login: "octocat",
      name: "The Octocat",
      bio: "Sample GitHub profile",
      avatarUrl: "https://github.com/images/error/octocat_happy.gif",
      htmlUrl: "https://github.com/octocat",
      followers: 100,
      following: 10,
      publicRepos: 20,
    },
  });
  console.log("github_profiles:", profile.login);

  const repo = await db.repository.upsert({
    where: { githubId: 1296269 },
    update: {},
    create: {
      githubId: 1296269,
      name: "Hello-World",
      fullName: "octocat/Hello-World",
      description: "My first repository",
      language: "TypeScript",
      starCount: 42,
      forkCount: 7,
      htmlUrl: "https://github.com/octocat/Hello-World",
      pushedAt: new Date("2024-01-01"),
    },
  });
  console.log("repositories:", repo.fullName);

  const activity = await db.githubActivity.create({
    data: {
      type: "commit",
      title: "Initial commit",
      repoName: "octocat/Hello-World",
      url: "https://github.com/octocat/Hello-World/commit/abc123",
      sha: "abc123",
      occurredAt: new Date("2024-01-01"),
    },
  });
  console.log("github_activities:", activity.type, activity.sha);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekly = await db.weeklyReport.create({
    data: {
      weekStart,
      weekEnd,
      content: "## Week in Review\n\n- Set up Next.js project\n- Configured Supabase database",
      filePath: "content/reports/weekly/2024-01-01.md",
    },
  });
  console.log("weekly_reports: id", weekly.id);

  const monthly = await db.monthlyReport.upsert({
    where: { month_year: { month: now.getMonth() + 1, year: now.getFullYear() } },
    update: {},
    create: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      content: "## Monthly Summary\n\n- Bootstrapped OXE dashboard\n- Connected Supabase",
      filePath: "content/reports/monthly/2024-01.md",
    },
  });
  console.log("monthly_reports:", monthly.year, monthly.month);

  const resume = await db.resumeVersion.create({
    data: {
      version: 1,
      content: "# Resume\n\n## Skills\n- TypeScript\n- Next.js\n- PostgreSQL",
      htmlPath: "content/resumes/v1.html",
    },
  });
  console.log("resume_versions: v", resume.version);

  const email = await db.emailLog.create({
    data: {
      to: "you@example.com",
      subject: "Monthly Report — sample",
      status: "sent",
    },
  });
  console.log("email_logs: id", email.id);

  const run = await db.workflowRun.create({
    data: {
      workflow: "collect:github",
      status: "success",
      finishedAt: new Date(),
    },
  });
  console.log("workflow_runs: id", run.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
