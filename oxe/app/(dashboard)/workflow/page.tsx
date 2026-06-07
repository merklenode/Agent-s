import Header from "@/app/components/Header";
import { db } from "@/src/lib/db";
import {
  collectGithubAction,
  generateWeeklyReportAction,
  generateMonthlyReportAction,
  generateResumeAction,
  sendEmailAction,
} from "@/src/actions/reports";
import { connection } from "next/server";

function statusClass(status: string) {
  if (status === "success" || status === "sent")
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  if (status === "failed")
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
}

function TriggerButton({ action, label }: { action: (fd: FormData) => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
      >
        {label}
      </button>
    </form>
  );
}

export default async function WorkflowPage() {
  await connection();

  const [runs, emailLogs] = await Promise.all([
    db.workflowRun.findMany({ orderBy: { startedAt: "desc" }, take: 30 }),
    db.emailLog.findMany({ orderBy: { sentAt: "desc" }, take: 10 }),
  ]);

  return (
    <>
      <Header title="Workflow" />
      <main className="flex-1 p-6 space-y-8">

        {/* Trigger buttons */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Run Workflows</h2>
          <div className="flex flex-wrap gap-3">
            <TriggerButton action={collectGithubAction} label="Collect GitHub" />
            <TriggerButton action={generateWeeklyReportAction} label="Weekly Report" />
            <TriggerButton action={generateMonthlyReportAction} label="Monthly Report" />
            <TriggerButton action={generateResumeAction} label="Generate Resume + PDF" />
            <TriggerButton action={sendEmailAction} label="Send Monthly Email" />
          </div>
        </section>

        {/* Email log */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Email Log</h2>
          {emailLogs.length === 0 ? (
            <p className="text-zinc-500 text-sm">No emails sent yet.</p>
          ) : (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-[2fr_0.6fr_1fr] gap-4 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 text-xs font-medium text-zinc-500">
                <div>Subject</div><div>Status</div><div>Sent</div>
              </div>
              {emailLogs.map((log) => (
                <div key={log.id} className="grid grid-cols-[2fr_0.6fr_1fr] gap-4 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0 dark:border-zinc-900">
                  <div className="truncate">{log.subject}</div>
                  <div><span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusClass(log.status)}`}>{log.status}</span></div>
                  <div className="text-zinc-500">{log.sentAt.toISOString().slice(0, 19).replace("T", " ")}</div>
                  {log.error && <div className="col-span-3 text-xs text-red-500">{log.error}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Run history */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Run History</h2>
          {runs.length === 0 ? (
            <p className="text-zinc-500 text-sm">No workflow runs yet.</p>
          ) : (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr] gap-4 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 text-xs font-medium text-zinc-500">
                <div>Workflow</div><div>Status</div><div>Started</div><div>Finished</div>
              </div>
              {runs.map((run) => (
                <div key={run.id} className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr] gap-4 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0 dark:border-zinc-900">
                  <div className="font-medium">{run.workflow}</div>
                  <div><span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusClass(run.status)}`}>{run.status}</span></div>
                  <div className="text-zinc-500">{run.startedAt.toISOString().slice(0, 19).replace("T", " ")}</div>
                  <div className="text-zinc-500">{run.finishedAt ? run.finishedAt.toISOString().slice(0, 19).replace("T", " ") : "-"}</div>
                  {run.error && <div className="col-span-4 text-xs text-red-500">{run.error}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </>
  );
}
