# Simple Explanation

OXE is your personal career progress machine.

It watches your GitHub work, makes reports, builds your resume, and shows everything in a dashboard.

## The System In One Line

```text
GitHub work -> progress tracking -> reports -> resume PDF -> email -> dashboard
```

## What Happens Every Week

1. The system checks your GitHub.
2. It finds what you worked on.
3. It saves the activity.
4. It creates a weekly progress report.
5. The report appears in the dashboard.

## What Happens Every Month

1. The system reads all weekly reports.
2. It creates a monthly summary.
3. It updates your resume.
4. It creates an ATS-friendly PDF.
5. It emails the PDF to you.
6. The dashboard shows the result.

## What You See In The Dashboard

- how many commits you made
- which repos you worked on
- which skills you used
- weekly reports
- monthly reports
- latest resume
- PDF download
- email status
- automation status

## What We Build First

First build only this:

```text
GitHub data -> SQLite -> dashboard -> weekly report
```

After that works, build:

```text
monthly report -> resume -> PDF -> email
```

After that works, add:

```text
LocusGraph memory
```

## Why LocusGraph Is Later

LocusGraph is useful for memory, but it can make the first version confusing.

So first we use SQLite because it is simple and exact.

Later, LocusGraph can remember things like:

- what kind of developer you are becoming
- old project facts
- skills you keep using
- writing style for reports
- resume improvement history

## Final Build Order

1. Dashboard app
2. Database
3. GitHub collector
4. Weekly report
5. Monthly report
6. Resume builder
7. PDF export
8. Email sender
9. GitHub Actions automation
10. LocusGraph memory
