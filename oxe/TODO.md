# OXE Implementation TODO

This TODO is for building OXE from zero.

## Phase 0 - Project Setup

- [x] Create Next.js app in this directory.
- [x] Use TypeScript.
- [x] Add Tailwind CSS.
- [x] Add ESLint.
- [x] Add basic app layout.
- [x] Add environment file example.
- [x] Add README setup instructions.

Expected result:

```text
pnpm dev
```

opens a working dashboard app.

## Phase 1 - Database Setup

- [x] Install Prisma.
- [x] Add Supabase (PostgreSQL) database.
- [x] Create Prisma schema.
- [x] Add tables:
  - [x] `github_profiles`
  - [x] `repositories`
  - [x] `github_activities`
  - [x] `weekly_reports`
  - [x] `monthly_reports`
  - [x] `resume_versions`
  - [x] `email_logs`
  - [x] `workflow_runs`
- [x] Add database client helper (`src/lib/db.ts`).
- [x] Add seed/test data command (`pnpm seed`).

Expected result:

```text
pnpm db:migrate
pnpm seed
```

creates database tables and sample dashboard data.

## Phase 2 - Dashboard Shell

- [x] Create sidebar navigation.
- [x] Create top header.
- [x] Create `/dashboard` page.
- [x] Create `/github` page.
- [x] Create `/reports` page.
- [x] Create `/resume` page.
- [x] Create `/workflow` page.
- [x] Create `/settings` page.
- [x] Add empty states for all pages.

Expected result:

You can move between all dashboard pages.

## Phase 3 - GitHub Collector

- [x] Install Octokit.
- [x] Add `GITHUB_TOKEN` and `GITHUB_USER` env variables.
- [x] Create `src/collectors/github.collector.ts`.
- [x] Fetch GitHub profile.
- [x] Fetch repositories.
- [x] Fetch recent commits.
- [x] Fetch recent pull requests.
- [x] Fetch recent issues.
- [x] Save collected data to Supabase.
- [x] Add manual command:

```text
pnpm collect:github
```

Expected result:

GitHub data appears in the database and dashboard.

## Phase 4 - GitHub Dashboard

- [x] Show profile summary.
- [x] Show repo count.
- [x] Show recent activity count.
- [x] Show repos touched this week.
- [x] Show repos touched this month.
- [x] Show language chart.
- [x] Show activity timeline.
- [x] Show recent commits/PRs/issues.

Expected result:

The dashboard visually shows what you worked on.

## Phase 5 - Weekly Report Generator

- [x] Add AI provider env variables.
- [x] Create `src/tools/ai.tool.ts`.
- [x] Create `src/generators/weekly.generator.ts`.
- [x] Read last 7 days of GitHub data from Supabase.
- [x] Generate weekly progress report.
- [x] Save report to `weekly_reports`.
- [x] Save report Markdown to `content/reports/weekly/`.
- [x] Add manual command:
- [x] Add dashboard/report-page button.
- [x] Track runs in `workflow_runs`.

```text
pnpm generate:weekly
```

Expected result:

Weekly report is generated and visible on `/reports`.

## Phase 6 - Monthly Report Generator

- [x] Create `src/generators/monthly.generator.ts`.
- [x] Read current month's GitHub data from Supabase.
- [x] Read weekly reports from this month.
- [x] Generate monthly summary.
- [x] Save report to `monthly_reports`.
- [x] Save report Markdown to `content/reports/monthly/`.
- [x] Add manual command:
- [x] Add dashboard/report-page button.
- [x] Track runs in `workflow_runs`.

```text
pnpm generate:monthly
```

Expected result:

Monthly report is generated and visible on `/reports`.

## Phase 7 - Resume Builder

- [x] Create `src/generators/resume.generator.ts`.
- [x] Create ATS-friendly resume prompt.
- [x] Use GitHub profile, project data, monthly report, and saved skills.
- [x] Generate resume Markdown.
- [x] Create resume HTML template.
- [x] Save resume version to `resume_versions`.
- [x] Save resume files to `content/resumes/`.
- [x] Add workflow-page button.
- [x] Show latest resume on `/resume`.

Expected result:

Dashboard shows latest generated resume.

## Phase 8 - PDF Export

- [x] Install Puppeteer.
- [x] Create `src/tools/pdf.tool.ts`.
- [x] Convert resume HTML to PDF.
- [x] Save PDF to `content/resumes/`.
- [x] Store PDF path in `resume_versions`.
- [x] Add `/api/resume/download` route.
- [x] Add PDF download button on `/resume`.

Expected result:

You can download the latest ATS-friendly resume PDF.

## Phase 9 - Email Automation

- [x] Install Nodemailer.
- [x] Add SMTP env variables:
  - [x] `SMTP_HOST`
  - [x] `SMTP_PORT`
  - [x] `SMTP_SECURE`
  - [x] `SMTP_USER`
  - [x] `SMTP_PASS`
  - [x] `EMAIL_TO`
- [x] Create `src/tools/email.tool.ts`.
- [x] Send monthly report email.
- [x] Attach resume PDF.
- [x] Save email result to `email_logs`.
- [x] Add manual command:
- [x] Add workflow-page button.
- [x] Show email status on `/workflow`.

```text
pnpm send:email
```

Expected result:

The system sends your monthly resume PDF to your mailbox.

## Phase 10 - Workflow Status

- [x] Create workflow service.
- [x] Track collector runs.
- [x] Track weekly report runs.
- [x] Track monthly report runs.
- [x] Track PDF generation.
- [x] Track email sending.
- [x] Add workflow trigger buttons for collector, reports, resume/PDF, and email.
- [x] Show run status on `/workflow`.

Expected result:

You can see what ran, when it ran, and whether it succeeded.

## Phase 11 - GitHub Actions

- [x] Add weekly GitHub Actions workflow.
- [x] Run GitHub collector.
- [x] Generate weekly report.
- [x] Commit generated content if needed.
- [x] Add monthly GitHub Actions workflow.
- [x] Generate monthly report.
- [x] Generate resume PDF.
- [x] Send email.
- [x] Commit generated content if needed.

Expected result:

Reports and resume generation run automatically.

Required repository secrets:

```text
DATABASE_URL
DIRECT_URL
OXE_GITHUB_TOKEN
GH_USER
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
EMAIL_TO
LOCUSGRAPH_SERVER_URL
LOCUSGRAPH_AGENT_SECRET
LOCUSGRAPH_GRAPH_ID
```

## Phase 12 - LocusGraph Memory

Do this only after the normal system works.

- [x] Add LocusGraph client integration.
- [x] Create `src/tools/locusgraph.tool.ts`.
- [x] Store compact weekly facts.
- [x] Store compact monthly facts.
- [x] Store project facts.
- [x] Store skill history.
- [x] Retrieve memory before resume generation.
- [x] Use memory to improve reports and resume.
- [x] Add LocusGraph env variables to `.env.example`.
- [x] Add LocusGraph secrets to GitHub Actions workflows.

Implementation note:

OXE uses the official `@locusgraph/client` TypeScript SDK:

```text
LOCUSGRAPH_SERVER_URL=https://api.locusgraph.com
LOCUSGRAPH_AGENT_SECRET
LOCUSGRAPH_GRAPH_ID=oxe
```

Expected result:

AI generation becomes better over time, but dashboard still uses Supabase for exact data.

## First Milestone

The first useful milestone is:

- [x] Next.js app runs.
- [x] Supabase database works.
- [x] GitHub collector works.
- [x] Dashboard shows GitHub activity.
- [x] Weekly report is generated.

Do this before monthly resume, PDF, email, or LocusGraph.

## Current Status

- [x] Local checks pass: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- [x] Database-backed pages render dynamically instead of using stale build-time data.
- [x] Report generation is available from `/dashboard` and `/reports`.
- [x] Operational workflows can be triggered from `/workflow`.
- [x] LocusGraph memory integration is implemented and remains optional unless credentials are configured.

## Phase 13 - Settings Page

- [x] Add `UserProfile` Prisma model (`user_profiles` table).
- [x] Run migration: `prisma migrate dev --name add_user_profiles`.
- [x] Create `src/actions/settings.ts` with `saveProfileAction` (upserts profile row).
- [x] Build `/settings` page with two sections:
  - [x] **Environment Config**: read-only grid showing set/missing badge for all 11 env vars.
  - [x] **Profile & Resume Data**: editable form (fullName, email, location, website, linkedin, skills, education, experience) saved to DB.
- [x] Update `resume.generator.ts` to read `userProfile` and inject personal data into the prompt.

Expected result:

`/settings` shows which env vars are configured and lets you save personal resume data that the generator uses.
