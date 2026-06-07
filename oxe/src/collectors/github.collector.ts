import { Octokit } from "@octokit/rest";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { db } from "../lib/db";
import { storeGithubLocusFacts } from "../lib/locus-memory";

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USER;
const isCli = process.argv[1]?.endsWith("github.collector.ts") || process.argv[1]?.endsWith("github.collector.js");

if (!token || !username) {
  if (isCli) {
    console.error("GITHUB_TOKEN and GITHUB_USER must be set in .env");
    process.exit(1);
  }
}

const PaginatedOctokit = Octokit.plugin(paginateRest);
const octokit = new PaginatedOctokit({ auth: token });

function requireGithubConfig() {
  if (!token || !username) {
    throw new Error("GITHUB_TOKEN and GITHUB_USER must be set in .env");
  }
}

async function collectProfile() {
  requireGithubConfig();
  const { data } = await octokit.rest.users.getByUsername({ username: username! });
  await db.githubProfile.upsert({
    where: { login: data.login },
    update: {
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      htmlUrl: data.html_url,
      followers: data.followers,
      following: data.following,
      publicRepos: data.public_repos,
    },
    create: {
      login: data.login,
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      htmlUrl: data.html_url,
      followers: data.followers,
      following: data.following,
      publicRepos: data.public_repos,
    },
  });
  console.log(`✓ Profile: ${data.login}`);
}

async function collectRepos() {
  requireGithubConfig();
  const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
    username: username!,
    per_page: 100,
    sort: "pushed",
  });

  for (const repo of repos) {
    await db.repository.upsert({
      where: { githubId: repo.id },
      update: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        starCount: repo.stargazers_count ?? 0,
        forkCount: repo.forks_count ?? 0,
        isPrivate: repo.private,
        htmlUrl: repo.html_url,
        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      },
      create: {
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        starCount: repo.stargazers_count ?? 0,
        forkCount: repo.forks_count ?? 0,
        isPrivate: repo.private,
        htmlUrl: repo.html_url,
        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      },
    });
  }
  console.log(`✓ Repos: ${repos.length}`);
}

async function collectCommits() {
  requireGithubConfig();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: "pushed",
    visibility: "all",
  });

  let count = 0;
  for (const repo of repos) {
    try {
      const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
        owner: repo.owner.login,
        repo: repo.name,
        author: username!,
        since,
        per_page: 100,
      });
      for (const commit of commits) {
        const existing = await db.githubActivity.findFirst({ where: { sha: commit.sha } });
        if (!existing) {
          await db.githubActivity.create({
            data: {
              type: "commit",
              title: commit.commit.message.split("\n")[0].slice(0, 255),
              repoName: repo.full_name,
              sha: commit.sha,
              occurredAt: new Date(commit.commit.author?.date ?? commit.commit.committer?.date ?? Date.now()),
            },
          });
          count++;
        }
      }
    } catch {
      // skip repos we can't access
    }
  }
  console.log(`✓ Commits: ${count} new`);
}

async function collectPRs() {
  requireGithubConfig();
  const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
    q: `author:${username} type:pr`,
    sort: "updated",
    per_page: 50,
  });

  for (const pr of prs.items) {
    const existing = await db.githubActivity.findFirst({ where: { url: pr.html_url } });
    const data = {
      type: "pr",
      title: pr.title.slice(0, 255),
      repoName: pr.repository_url.split("/").slice(-2).join("/"),
      url: pr.html_url,
      occurredAt: new Date(pr.updated_at),
    };
    if (existing) {
      await db.githubActivity.update({ where: { id: existing.id }, data });
    } else {
      await db.githubActivity.create({ data });
    }
  }
  console.log(`✓ PRs: ${prs.items.length} synced`);
}

async function collectIssues() {
  requireGithubConfig();
  const { data: issues } = await octokit.rest.search.issuesAndPullRequests({
    q: `author:${username} type:issue`,
    sort: "updated",
    per_page: 50,
  });

  for (const issue of issues.items) {
    const existing = await db.githubActivity.findFirst({ where: { url: issue.html_url } });
    const data = {
      type: "issue",
      title: issue.title.slice(0, 255),
      repoName: issue.repository_url.split("/").slice(-2).join("/"),
      url: issue.html_url,
      occurredAt: new Date(issue.updated_at),
    };
    if (existing) {
      await db.githubActivity.update({ where: { id: existing.id }, data });
    } else {
      await db.githubActivity.create({ data });
    }
  }
  console.log(`✓ Issues: ${issues.items.length} synced`);
}

async function main() {
  const { runWorkflow } = await import("../lib/workflow");
  await runWorkflow("collect:github", collectGithub);
  console.log("Done.");
  await db.$disconnect();
}

export async function collectGithub() {
  requireGithubConfig();
  console.log(`Collecting GitHub data for: ${username}`);
  await collectProfile();
  await collectRepos();
  await collectCommits();
  await collectPRs();
  await collectIssues();

  try {
    const result = await storeGithubLocusFacts();
    if (result.stored > 0) console.log(`✓ LocusGraph facts: ${result.stored} stored`);
  } catch (error) {
    console.warn("LocusGraph memory sync skipped:", error instanceof Error ? error.message : error);
  }
}

if (isCli) {
  main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
}
