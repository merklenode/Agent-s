# OXE Architecture

## Simple Explanation

OXE has five main parts:

1. Collector
2. Database
3. Generator
4. Delivery
5. Dashboard

## 1. Collector

The collector gets real activity from GitHub.

It collects:

- repositories
- commits
- pull requests
- issues
- languages
- project topics
- profile information

Output:

```text
GitHub raw data -> clean activity records
```

## 2. Database

The database stores exact records.

Use SQLite first.

Tables:

- `github_profiles`
- `repositories`
- `github_activities`
- `weekly_reports`
- `monthly_reports`
- `resume_versions`
- `email_logs`
- `workflow_runs`

The dashboard reads from this database.

## 3. Generator

The generator uses activity data and AI to create useful documents.

It generates:

- weekly progress report
- monthly progress report
- resume bullets
- full ATS-friendly resume
- email body

Important rule:

AI should summarize and rewrite. It should not invent fake experience.

## 4. Delivery

Delivery handles output.

It creates:

- Markdown reports
- HTML resume
- PDF resume
- email with PDF attachment

## 5. Dashboard

The dashboard shows your progress visually.

Pages:

- `/dashboard`
- `/github`
- `/reports`
- `/resume`
- `/workflow`
- `/settings`

## Full Data Flow

```text
GitHub API
   -> Collector
   -> SQLite database
   -> Weekly generator
   -> Weekly report
   -> Dashboard

SQLite database
   -> Monthly generator
   -> Monthly report
   -> Resume builder
   -> PDF exporter
   -> Email sender
   -> Dashboard workflow status
```

## Dashboard Pages

## `/dashboard`

Shows the main overview:

- this week's activity count
- this month's activity count
- repos touched
- top skills
- latest report
- latest resume version
- last email status

## `/github`

Shows GitHub tracking:

- repositories touched
- commits
- pull requests
- issues
- languages
- activity timeline

## `/reports`

Shows:

- weekly reports
- monthly reports
- report details
- date filter

## `/resume`

Shows:

- latest resume preview
- resume sections
- generated bullets
- PDF download
- resume version history

## `/workflow`

Shows automation state:

- last weekly run
- last monthly run
- PDF generation status
- email status
- errors

## `/settings`

Shows configuration:

- GitHub username
- report schedule
- email target
- AI provider

Do not show secret values.

## LocusGraph Role

LocusGraph is optional in the first version.

Add it only after the base system works.

Use LocusGraph for:

- long-term memory
- project facts
- skill history
- previous summary memory
- writing style

Do not use LocusGraph for:

- dashboard tables
- exact report list
- resume file paths
- email status
- workflow status

Those belong in SQLite.

## Suggested Folder Structure

```text
oxe/
  app/
    dashboard/
    github/
    reports/
    resume/
    workflow/
    settings/
    api/
  src/
    collectors/
      github.collector.ts
    generators/
      weekly.generator.ts
      monthly.generator.ts
      resume.generator.ts
    tools/
      ai.tool.ts
      email.tool.ts
      pdf.tool.ts
      locusgraph.tool.ts
    services/
      workflow.service.ts
      report.service.ts
      resume.service.ts
    templates/
      resume.html
  prisma/
    schema.prisma
  content/
    reports/
    resumes/
  docs/
  TODO.md
```

## First Version Rule

The first working version should do this:

```text
Fetch GitHub data
Save it in SQLite
Show it on dashboard
Generate one weekly report
```

After that, add resume PDF and email.
