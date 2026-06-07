import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { generateText } from "../tools/ai.tool";
import { queryLocusMemory } from "../tools/locusgraph.tool";
import { htmlToPdf } from "../tools/pdf.tool";

const isCli = process.argv[1]?.endsWith("resume.generator.ts") || process.argv[1]?.endsWith("resume.generator.js");

async function main() {
  const { runWorkflow } = await import("../lib/workflow");
  await runWorkflow("generate:resume", generateResume);
  await db.$disconnect();
}

export async function generateResume() {
  const [profile, repos, latestMonthly, recentActivities, userProfile] = await Promise.all([
    db.githubProfile.findFirst(),
    db.repository.findMany({ orderBy: { pushedAt: "desc" }, take: 20 }),
    db.monthlyReport.findFirst({ orderBy: { generatedAt: "desc" } }),
    db.githubActivity.findMany({ orderBy: { occurredAt: "desc" }, take: 50 }),
    db.userProfile.findFirst(),
  ]);

  const repoList = repos
    .map((r) => `- ${r.fullName}${r.description ? `: ${r.description}` : ""}${r.language ? ` [${r.language}]` : ""}`)
    .join("\n");

  const activitySummary = recentActivities
    .slice(0, 20)
    .map((a) => `- [${a.type}] ${a.repoName}: ${a.title}`)
    .join("\n");

  let memoryContext = "";
  try {
    memoryContext = await queryLocusMemory(
      "developer accomplishments project history skills strengths resume evidence",
      10
    );
  } catch (error) {
    console.warn("LocusGraph resume memory skipped:", error instanceof Error ? error.message : error);
  }

  const prompt = `You are building a developer resume. Output ONLY valid JSON — no markdown, no code fences, no explanation.

Use this exact shape:
{
  "name": "string",
  "contact": { "email": "string", "phone": "string", "location": "string", "website": "string", "linkedin": "string", "github": "string" },
  "about": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "Role - Company", "period": "MM/YYYY - MM/YYYY", "bullets": ["bullet1"] }
  ],
  "projects": [
    { "title": "Project Name", "role": "Role", "period": "MM/YYYY - MM/YYYY", "bullets": ["bullet1"], "technologies": "tech1, tech2" }
  ],
  "education": [
    { "date": "MM/YYYY", "degree": "Degree Name", "institution": "School", "courses": "course1, course2" }
  ],
  "profiles": ["https://linkedin.com/in/...", "https://github.com/..."]
}

## Source Data

Name: ${userProfile?.fullName ?? profile?.name ?? profile?.login ?? "Developer"}
Email: ${userProfile?.email ?? ""}
Phone: (from experience notes if present)
Location: ${userProfile?.location ?? ""}
Website: ${userProfile?.website ?? ""}
LinkedIn: ${userProfile?.linkedin ?? ""}
GitHub: https://github.com/${profile?.login ?? ""}
Bio: ${profile?.bio ?? ""}

Skills (manually provided): ${userProfile?.skills ?? "infer from repos and activity"}

Recent Projects (GitHub):
${repoList || "none"}

Recent Activity:
${activitySummary || "none"}

Education: ${userProfile?.education ?? ""}
Experience Notes: ${userProfile?.experience ?? "infer from activity"}
Monthly Summary: ${latestMonthly?.content ?? ""}
Long-Term Memory: ${memoryContext || ""}

Rules:
- Be factual. Do not invent specifics not supported by the data.
- skills array: each item is a single skill string.
- experience bullets: start each with a verb.
- If a field has no data, use an empty string or empty array.`;

  console.log("Generating resume...");
  const raw = await generateText(prompt);

  // Strip any accidental markdown fences
  const jsonStr = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  let data: ResumeData;
  try {
    data = JSON.parse(jsonStr) as ResumeData;
  } catch {
    // Fallback: save raw as markdown only, no structured HTML
    console.error("Resume JSON parse failed, saving raw markdown only.");
    data = { name: "Resume", contact: { email: "", phone: "", location: "", website: "", linkedin: "", github: "" }, about: raw, skills: [], experience: [], projects: [], education: [], profiles: [] };
  }

  const content = toMarkdown(data);

  // Determine next version number
  const latest = await db.resumeVersion.findFirst({ orderBy: { version: "desc" } });
  const version = (latest?.version ?? 0) + 1;

  const slug = new Date().toISOString().slice(0, 10);
  const mdPath = path.join("content", "resumes", `resume-v${version}-${slug}.md`);
  const htmlPath = path.join("content", "resumes", `resume-v${version}-${slug}.html`);

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, content);
  fs.writeFileSync(htmlPath, buildHtml(data, version, slug));

  console.log("Converting to PDF...");
  const pdfPath = await htmlToPdf(htmlPath);

  await db.resumeVersion.create({
    data: { version, content, htmlPath, pdfPath },
  });

  console.log(`✓ Resume v${version} saved to ${mdPath}`);
}

interface ResumeContact { email: string; phone: string; location: string; website: string; linkedin: string; github: string; }
interface ResumeExp    { title: string; period: string; bullets: string[]; }
interface ResumeProj   { title: string; role: string; period: string; bullets: string[]; technologies: string; }
interface ResumeEdu    { date: string; degree: string; institution: string; courses: string; }
interface ResumeData   { name: string; contact: ResumeContact; about: string; skills: string[]; experience: ResumeExp[]; projects: ResumeProj[]; education: ResumeEdu[]; profiles: string[]; }

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function toMarkdown(d: ResumeData): string {
  const c = d.contact;
  const lines: string[] = [`# ${d.name}`];
  const contact = [c.email, c.phone, c.location, c.website, c.linkedin, c.github].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  lines.push("", "## About", d.about);
  if (d.skills.length) lines.push("", "## Skills", d.skills.map(s => `- ${s}`).join("\n"));
  if (d.experience.length) {
    lines.push("", "## Experience");
    for (const e of d.experience) {
      lines.push(`\n**${e.title}**`, e.period, ...e.bullets.map(b => `- ${b}`));
    }
  }
  if (d.projects.length) {
    lines.push("", "## Projects");
    for (const p of d.projects) {
      lines.push(`\n**${p.title}** — ${p.role} (${p.period})`, ...p.bullets.map(b => `- ${b}`));
      if (p.technologies) lines.push(`Technologies: ${p.technologies}`);
    }
  }
  if (d.education.length) {
    lines.push("", "## Education");
    for (const e of d.education) lines.push(`\n${e.date}\n**${e.degree}** — ${e.institution}`, e.courses ? `Courses: ${e.courses}` : "");
  }
  if (d.profiles.length) lines.push("", "## Profiles", d.profiles.map(p => `- ${p}`).join("\n"));
  return lines.join("\n");
}

function buildHtml(d: ResumeData, version: number, date: string): string {
  const c = d.contact;

  const contactHtml = [c.email, c.phone, c.location]
    .filter(Boolean)
    .map(v => `<div>${esc(v)}</div>`)
    .join("");

  const skillsHtml = d.skills.map(s => `<li>${esc(s)}</li>`).join("");

  const educationHtml = d.education.map(e => `
    <div class="edu-block">
      ${e.date ? `<div class="date">${esc(e.date)}</div>` : ""}
      <div><strong>${esc(e.degree)}</strong></div>
      <div>${esc(e.institution)}</div>
      ${e.courses ? `<div class="courses">${esc(e.courses)}</div>` : ""}
    </div>`).join("");

  const profilesHtml = d.profiles.map(p => `<li><a href="${esc(p)}">${esc(p)}</a></li>`).join("");

  const websiteLink = c.website ? `<li><a href="${esc(c.website)}">${esc(c.website)}</a></li>` : "";
  const linkedinLink = c.linkedin ? `<li><a href="${esc(c.linkedin)}">${esc(c.linkedin)}</a></li>` : "";
  const githubLink = c.github ? `<li><a href="${esc(c.github)}">${esc(c.github)}</a></li>` : "";
  const linksHtml = [websiteLink, linkedinLink, githubLink].filter(Boolean).join("");

  const experienceHtml = d.experience.map(e => `
    <div class="entry">
      <div class="entry-title">${esc(e.title)}</div>
      <div class="entry-period">${esc(e.period)}</div>
      <ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
    </div>`).join("");

  const projectsHtml = d.projects.map(p => `
    <li>
      <strong>${esc(p.title)}</strong>${p.role ? `, ${esc(p.role)}` : ""}${p.period ? `, ${esc(p.period)}` : ""}
      ${p.bullets.length ? ", " + p.bullets.map(b => esc(b)).join(", ") : ""}
      ${p.technologies ? `<br><span class="tech">Technologies: ${esc(p.technologies)}</span>` : ""}
    </li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(d.name)} — Resume v${version} — ${date}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar { width: 220px; min-width: 220px; background: #f4f4f4; padding: 24px 16px; border-right: 4px solid #5a5a8a; }
  .sidebar .contact { margin-bottom: 20px; font-size: 12.5px; line-height: 1.7; }
  .sidebar h2 { font-size: 14px; font-weight: 700; margin: 18px 0 8px; }
  .sidebar ul { list-style: disc; padding-left: 14px; }
  .sidebar ul li { margin-bottom: 3px; line-height: 1.5; }
  .sidebar a { color: #222; word-break: break-all; }
  .edu-block { margin-bottom: 14px; line-height: 1.5; }
  .edu-block .date { font-size: 12px; color: #555; }
  .edu-block .courses { font-size: 11.5px; color: #444; margin-top: 3px; }

  /* Main */
  .main { flex: 1; padding: 28px 36px; }
  .main h1 { font-size: 36px; font-weight: 700; color: #222; margin-bottom: 24px; }
  .main h2 { font-size: 18px; font-weight: 700; color: #222; margin: 24px 0 10px; }
  .entry { margin-bottom: 18px; }
  .entry-title { font-weight: 700; font-size: 13px; }
  .entry-period { font-size: 12px; color: #555; margin-bottom: 6px; font-style: italic; }
  .main ul { padding-left: 18px; margin-top: 6px; }
  .main ul li { margin-bottom: 5px; line-height: 1.55; }
  .tech { font-size: 11.5px; color: #555; }

  @media print {
    body { font-size: 11px; }
    .sidebar { width: 190px; min-width: 190px; padding: 16px 12px; }
    .main { padding: 20px 28px; }
    .main h1 { font-size: 28px; }
  }
</style>
</head>
<body>

<aside class="sidebar">
  <div class="contact">${contactHtml}</div>

  ${d.skills.length ? `<h2>Skills</h2><ul>${skillsHtml}</ul>` : ""}

  ${d.education.length ? `<h2>Education</h2>${educationHtml}` : ""}

  ${(d.profiles.length || linksHtml) ? `<h2>Profiles</h2><ul>${profilesHtml}${linksHtml}</ul>` : ""}
</aside>

<main class="main">
  <h1>${esc(d.name)}</h1>

  ${d.about ? `<h2>About</h2><p>${esc(d.about)}</p>` : ""}

  ${d.experience.length ? `<h2>Experience</h2>${experienceHtml}` : ""}

  ${d.projects.length ? `<h2>Projects</h2><ul>${projectsHtml}</ul>` : ""}
</main>

</body>
</html>`;
}

if (isCli) {
  main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
}
