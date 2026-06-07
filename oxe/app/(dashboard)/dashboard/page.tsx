import Header from "@/app/components/Header";
import ReportGenerationControls from "@/app/components/ReportGenerationControls";
import { getGithubSummary } from "@/src/lib/github-data";
import { connection } from "next/server";

export default async function DashboardPage() {
  await connection();

  const { profile, repos, weekActivity, monthActivity, reposThisWeek, recentActivity } =
    await getGithubSummary();

  const lastActive = recentActivity[0]?.occurredAt?.toISOString().slice(0, 10) ?? "—";

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {profile ? (
            <p className="text-sm text-zinc-500">
              Logged as <span className="font-medium text-zinc-700 dark:text-zinc-300">@{profile.login}</span>
              {" · "}last activity <span className="font-medium text-zinc-700 dark:text-zinc-300">{lastActive}</span>
            </p>
          ) : (
            <p className="text-sm text-zinc-500">Collect GitHub data before generating reports.</p>
          )}
          <ReportGenerationControls />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total repos", value: repos.length },
            { label: "Activity this week", value: weekActivity },
            { label: "Activity this month", value: monthActivity },
            { label: "Repos touched (week)", value: reposThisWeek },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-zinc-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {recentActivity.length > 0 && (
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-medium mb-3">Recent Activity</div>
            <div className="space-y-2">
              {recentActivity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-zinc-400 w-20 shrink-0">{a.occurredAt.toISOString().slice(0, 10)}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    a.type === "commit" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : a.type === "pr" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                  }`}>{a.type}</span>
                  <span className="truncate text-zinc-700 dark:text-zinc-300">{a.title}</span>
                  <span className="text-xs text-zinc-400 shrink-0 ml-auto">{a.repoName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  );
}
