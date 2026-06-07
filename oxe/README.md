# OXE — Developer Activity Dashboard

Personal dashboard for GitHub activity, weekly/monthly reports, and resume generation.

## Setup

```bash
cp .env.example .env
# fill in DATABASE_URL, GITHUB_TOKEN, GITHUB_USER, and OPENAI_API_KEY in .env

pnpm install
pnpm db:migrate
pnpm seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm db:migrate` | Run DB migrations |
| `pnpm seed` | Seed sample data |
| `pnpm collect:github` | Collect GitHub activity |
| `pnpm generate:weekly` | Generate weekly report |
| `pnpm generate:monthly` | Generate monthly report |
| `pnpm generate:resume` | Generate resume Markdown, HTML, and PDF |
| `pnpm send:email` | Email the latest monthly report with the latest resume PDF |

## GitHub Actions Secrets

Set these repository secrets before enabling the scheduled workflows:

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
