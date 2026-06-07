import Header from "@/app/components/Header";
import { db } from "@/src/lib/db";
import { connection } from "next/server";

export default async function ResumePage() {
  await connection();

  const resume = await db.resumeVersion.findFirst({ orderBy: { version: "desc" } });

  return (
    <>
      <Header title="Resume" />
      <main className="flex-1 p-6">
        {!resume ? (
          <p className="text-zinc-500 text-sm">
            No resume yet. Run <code>pnpm generate:resume</code> to generate one.
          </p>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-zinc-500">
                v{resume.version} · generated {resume.generatedAt.toISOString().slice(0, 10)}
              </span>
              {resume.pdfPath && (
                <a
                  href="/api/resume/download"
                  download
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
                >
                  Download PDF
                </a>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {resume.content}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
