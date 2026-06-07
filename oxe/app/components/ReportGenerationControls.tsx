import {
  generateMonthlyReportAction,
  generateWeeklyReportAction,
  generateResumeAction,
  sendEmailAction,
} from "@/src/actions/reports";

const secondary = "rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900";

export default function ReportGenerationControls() {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={generateWeeklyReportAction}>
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300">
          Generate weekly
        </button>
      </form>
      <form action={generateMonthlyReportAction}>
        <button type="submit" className={secondary}>Generate monthly</button>
      </form>
      <form action={generateResumeAction}>
        <button type="submit" className={secondary}>Generate resume + PDF</button>
      </form>
      <form action={sendEmailAction}>
        <button type="submit" className={secondary}>Send monthly email</button>
      </form>
    </div>
  );
}
