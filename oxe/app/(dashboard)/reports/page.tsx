import Header from "@/app/components/Header";
import ReportGenerationControls from "@/app/components/ReportGenerationControls";
import { db } from "@/src/lib/db";
import { connection } from "next/server";

export default async function ReportsPage() {
  await connection();

  const [weeklyReports, monthlyReports] = await Promise.all([
    db.weeklyReport.findMany({
      orderBy: { weekStart: "desc" },
      take: 12,
    }),
    db.monthlyReport.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    }),
  ]);

  return (
    <>
      <Header title="Reports" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Reports</h1>
            <p className="text-sm text-zinc-500">Generate progress summaries from collected GitHub activity.</p>
          </div>
          <ReportGenerationControls />
        </div>

        {weeklyReports.length === 0 && monthlyReports.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
            <p className="text-zinc-500 text-sm">No reports yet. Generate a weekly or monthly report to create one.</p>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold">Monthly Reports</h2>
              {monthlyReports.length === 0 ? (
                <p className="text-zinc-500 text-sm">No monthly reports yet.</p>
              ) : (
                monthlyReports.map((r) => (
                  <div key={r.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-sm">
                        {r.year}-{String(r.month).padStart(2, "0")}
                      </h3>
                      <span className="text-xs text-zinc-400">{r.generatedAt.toISOString().slice(0, 10)}</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {r.content}
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold">Weekly Reports</h2>
              {weeklyReports.length === 0 ? (
                <p className="text-zinc-500 text-sm">No weekly reports yet.</p>
              ) : (
                weeklyReports.map((r) => (
                  <div key={r.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-sm">
                        {r.weekStart.toISOString().slice(0, 10)} {"->"} {r.weekEnd.toISOString().slice(0, 10)}
                      </h3>
                      <span className="text-xs text-zinc-400">{r.generatedAt.toISOString().slice(0, 10)}</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {r.content}
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
