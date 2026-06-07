# OXE System Plan

## Goal

Build a personal system that helps you understand your weekly and monthly developer progress, then automatically creates an ATS-friendly resume.

The system should answer:

- What did I work on this week?
- What did I improve this month?
- Which projects did I touch?
- Which skills did I use?
- What should I add to my resume?
- What is my latest ATS-friendly resume PDF?
- Was the report and resume emailed successfully?

## Final Product

OXE will be a dashboard app with automation built in.

You will open the dashboard and see:

- weekly progress
- monthly progress
- GitHub activity
- skills used
- projects worked on
- resume preview
- PDF download
- email status
- workflow status

## Recommended Approach

Use one Next.js app first.

This is simpler than building separate backend and frontend projects.

```text
Next.js app
   -> dashboard pages
   -> API routes
   -> automation scripts
   -> SQLite database
   -> PDF/email tools
```

Later, if the system grows, we can split it into:

```text
dashboard app
automation worker
database
```

For version 1, one app is better.

## What We Will Use

### Next.js

Used for:

- dashboard pages
- resume preview page
- API routes
- app structure

### TypeScript

Used for:

- safer code
- cleaner data models
- easier maintenance

### SQLite

Used for:

- weekly reports
- monthly reports
- GitHub activity records
- resume versions
- email delivery logs

SQLite is enough for one personal system.

### Prisma

Used for:

- database schema
- database queries
- migrations

### Octokit

Used for:

- GitHub profile
- repositories
- commits
- pull requests
- issues
- activity

### AI Provider

Use Gemini first if you already have Gemini keys. OpenAI can also be supported later.

Used for:

- summarizing weekly work
- generating monthly progress reports
- turning GitHub activity into resume bullets
- improving resume wording

### Puppeteer

Used for:

- converting ATS-friendly resume HTML into PDF

### Nodemailer

Used for:

- sending monthly email
- attaching resume PDF

### GitHub Actions

Used for:

- weekend progress report
- monthly resume generation
- scheduled email

### LocusGraph

Use later, not first.

Used for:

- long-term AI memory
- remembering old project facts
- remembering writing style
- remembering skills and career direction

Do not use LocusGraph as the main database.

## Build Versions

## Version 1 - Local Dashboard

Goal: show GitHub activity and reports locally.

Features:

- setup Next.js
- setup SQLite and Prisma
- connect GitHub API
- save GitHub activity
- dashboard overview page
- reports page

## Version 2 - Weekly Reports

Goal: generate weekend progress reports.

Features:

- weekly data collector
- weekly report generator
- report saved in database
- report visible in dashboard
- GitHub Actions weekly schedule

## Version 3 - Monthly Resume

Goal: create monthly ATS resume.

Features:

- monthly report generator
- resume builder
- resume preview page
- ATS-friendly HTML template
- PDF export
- resume versions saved

## Version 4 - Email Automation

Goal: send resume and monthly report to email.

Features:

- Gmail SMTP setup
- email sender
- PDF attachment
- email status saved
- dashboard workflow status

## Version 5 - LocusGraph Memory

Goal: improve AI memory.

Features:

- store compact weekly facts
- store monthly summary facts
- retrieve past project/skill memory
- improve resume generation using long-term memory

## What To Avoid At Start

Avoid these until version 1-3 are working:

- complex backend server
- PostgreSQL
- Docker
- authentication
- large AI agent framework
- LocusGraph as primary storage
- multiple apps

The first version should be easy to run and easy to understand.
