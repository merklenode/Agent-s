import Header from "@/app/components/Header";
import { getGithubSummary } from "@/src/lib/github-data";
import { connection } from "next/server";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
  C: "#555555",
  "C++": "#f34b7d",
};

function langColor(name: string) {
  return LANG_COLORS[name] ?? "#71717a";
}

export default async function GitHubPage() {
  await connection();

  const { profile, repos, recentActivity, weekActivity, monthActivity, languages, reposThisWeek, reposThisMonth, timeline } =
    await getGithubSummary();

  const maxCount = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <>
      <Header title="GitHub" />
      <main className="flex-1 p-6 space-y-6">

        {/* Profile */}
        {profile ? (
          <div className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {profile.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.login} className="w-14 h-14 rounded-full" />
            )}
            <div>
              <div className="font-semibold text-base">{profile.name ?? profile.login}</div>
              {profile.bio && <div className="text-sm text-zinc-500 mt-0.5">{profile.bio}</div>}
              <a href={profile.htmlUrl ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-blue-500 mt-0.5 block">
                @{profile.login}
              </a>
            </div>
            <div className="ml-auto flex gap-6 text-center">
              <div><div className="text-lg font-bold">{profile.publicRepos}</div><div className="text-xs text-zinc-500">Repos</div></div>
              <div><div className="text-lg font-bold">{profile.followers}</div><div className="text-xs text-zinc-500">Followers</div></div>
              <div><div className="text-lg font-bold">{profile.following}</div><div className="text-xs text-zinc-500">Following</div></div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No profile data. Run <code>pnpm collect:github</code>.</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Activity this week", value: weekActivity },
            { label: "Activity this month", value: monthActivity },
            { label: "Repos touched (week)", value: reposThisWeek },
            { label: "Repos touched (month)", value: reposThisMonth },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-zinc-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm font-medium mb-3">Activity — last 30 days</div>
          <div className="flex items-end gap-0.5 h-16">
            {timeline.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count}`}
                className="flex-1 rounded-sm bg-blue-500 opacity-80 min-h-[2px]"
                style={{ height: `${Math.max(2, (count / maxCount) * 64)}px` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{timeline[0]?.date}</span>
            <span>{timeline[timeline.length - 1]?.date}</span>
          </div>
        </div>

        {/* Language Chart */}
        {languages.length > 0 && (
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-medium mb-3">Languages</div>
            <div className="space-y-2">
              {languages.slice(0, 8).map(({ name, count }) => {
                const total = languages.reduce((s, l) => s + l.count, 0);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-zinc-600 dark:text-zinc-400 shrink-0">{name}</div>
                    <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: langColor(name) }} />
                    </div>
                    <div className="text-xs text-zinc-400 w-8 text-right">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-medium mb-3">Recent Activity</div>
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    a.type === "commit" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : a.type === "pr" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                  }`}>{a.type}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">{a.title}</a> : a.title}</div>
                    <div className="text-xs text-zinc-400">{a.repoName}</div>
                  </div>
                  <div className="text-xs text-zinc-400 shrink-0">{a.occurredAt.toISOString().slice(0, 10)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Repos */}
        {repos.length > 0 && (
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-medium mb-3">Repositories ({repos.length})</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {repos.slice(0, 10).map((r) => (
                <div key={r.id} className="p-3 rounded border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <a href={r.htmlUrl ?? "#"} target="_blank" rel="noreferrer" className="font-medium text-sm hover:underline truncate">{r.name}</a>
                    {r.isPrivate && <span className="text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-1">private</span>}
                  </div>
                  {r.description && <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{r.description}</div>}
                  <div className="flex gap-3 mt-2 text-xs text-zinc-400">
                    {r.language && <span style={{ color: langColor(r.language) }}>● {r.language}</span>}
                    <span>★ {r.starCount}</span>
                    {r.pushedAt && <span>{r.pushedAt.toISOString().slice(0, 10)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  );
}
