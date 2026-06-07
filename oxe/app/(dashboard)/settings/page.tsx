import Header from "@/app/components/Header";
import { db } from "@/src/lib/db";
import { saveProfileAction } from "@/src/actions/settings";
import { connection } from "next/server";

const ENV_VARS: { key: string; label: string }[] = [
  { key: "DATABASE_URL",             label: "Database URL" },
  { key: "GITHUB_TOKEN",             label: "GitHub Token" },
  { key: "GITHUB_USER",              label: "GitHub User" },
  { key: "OPENAI_API_KEY",           label: "OpenAI API Key" },
  { key: "OPENAI_BASE_URL",          label: "OpenAI Base URL" },
  { key: "OPENAI_MODEL",             label: "OpenAI Model" },
  { key: "SMTP_USER",                label: "SMTP User" },
  { key: "EMAIL_TO",                 label: "Email To" },
  { key: "LOCUSGRAPH_SERVER_URL",    label: "LocusGraph Server URL" },
  { key: "LOCUSGRAPH_AGENT_SECRET",  label: "LocusGraph Agent Secret" },
  { key: "LOCUSGRAPH_GRAPH_ID",      label: "LocusGraph Graph ID" },
];

function EnvRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-900 last:border-0">
      <span className="text-sm">{label}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
        present
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
      }`}>
        {present ? "set" : "missing"}
      </span>
    </div>
  );
}

function Field({
  name, label, value, textarea,
}: { name: string; label: string; value?: string | null; textarea?: boolean }) {
  const base =
    "w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {textarea ? (
        <textarea name={name} defaultValue={value ?? ""} rows={3} className={base} />
      ) : (
        <input name={name} defaultValue={value ?? ""} className={base} />
      )}
    </div>
  );
}

export default async function SettingsPage() {
  await connection();
  const profile = await db.userProfile.findFirst();

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 p-6 space-y-8 max-w-2xl">

        {/* Environment Status */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Environment Config</h2>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2">
            {ENV_VARS.map(({ key, label }) => (
              <EnvRow key={key} label={label} present={!!process.env[key]} />
            ))}
          </div>
        </section>

        {/* Profile / Resume Inputs */}
        <section>
          <h2 className="text-sm font-semibold mb-1">Profile &amp; Resume Data</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Stored in the database and used by the resume generator.
          </p>
          <form action={saveProfileAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field name="fullName"  label="Full Name"       value={profile?.fullName} />
              <Field name="email"     label="Contact Email"   value={profile?.email} />
              <Field name="location"  label="Location"        value={profile?.location} />
              <Field name="website"   label="Website / Portfolio" value={profile?.website} />
              <Field name="linkedin"  label="LinkedIn URL"    value={profile?.linkedin} />
              <Field name="skills"    label="Skills (comma-separated)" value={profile?.skills} />
            </div>
            <Field name="education"  label="Education"        value={profile?.education}  textarea />
            <Field name="experience" label="Experience Notes" value={profile?.experience} textarea />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="text-xs font-medium px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
              >
                Save Profile
              </button>
              {profile?.updatedAt && (
                <span className="text-xs text-zinc-400">
                  Last saved {profile.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                </span>
              )}
            </div>
          </form>
        </section>

      </main>
    </>
  );
}
