# Agent-s

Private tooling for the merklenode resume agent project.

## Project structure

- `scripts/` — TypeScript utilities executed directly with `tsx` (no build step needed)
- `resume-agent-dataset/` — knowledge base, evidence records, training data, and JSON schemas

See [resume-agent-dataset/README.md](resume-agent-dataset/README.md) for dataset documentation.

## Setup

**Prerequisites:** Node.js ≥ 18, pnpm (`npm install -g pnpm`), and the [GitHub CLI](https://cli.github.com/) (`gh`) authenticated for GitHub evidence scripts.

```bash
pnpm install
cp .env.example .env
# edit .env and fill in real values
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOCUSGRAPH_AGENT_SECRET` | Yes | — | LocusGraph agent authentication secret |
| `LOCUSGRAPH_SERVER_URL` | No | `https://api.locusgraph.com` | LocusGraph API endpoint |
| `LOCUSGRAPH_GRAPH_ID` | No | `default` | LocusGraph graph identifier |

Never commit `.env` to version control.

## Scripts

| Command | Description |
|---|---|
| `pnpm github:evidence` | Fetch all GitHub repos and extract resume evidence |
| `pnpm github:evidence:check` | Validate a previously extracted evidence file |
