# Resume Agent Dataset

Updated: 2026-06-23

This folder is a resume-building knowledge dataset for an AI agent.

It does not track companies, links, rankings, or application status. It keeps reusable information needed to build resumes across MNC, startup, AI, backend, platform, full-stack, systems, and data/search roles.

## Directory Structure

```
resume-agent-dataset/
├── README.md
├── ISSUES.md
├── knowledge/                          # machine-readable knowledge files for the agent
│   └── resume-agent-knowledge-base.json
├── candidate/                          # candidate personal profile (future: candidate-profile.json)
├── evidence/                           # per-project evidence records (future: project-evidence.json)
├── training/                           # agent task examples (future: agent-task-examples.jsonl)
├── schema/                             # JSON schemas for validation (future: resume-agent-knowledge-base.schema.json)
└── docs/                               # human-readable planning documents
    ├── resume-agent-requirements.md
    └── resume-requirement-matrix.csv
```

## Files

- `knowledge/resume-agent-knowledge-base.json`: canonical structured knowledge base for an agent.
- `docs/resume-agent-requirements.md`: human-readable planning document.
- `docs/resume-requirement-matrix.csv`: spreadsheet-friendly skill and resume matrix.
- `ISSUES.md`: restructuring and data-completion issue list.

## Purpose

Use this data to build stronger resume variants for many companies, not only the companies already researched.

The dataset answers:

- What profile should the candidate develop?
- What skills and knowledge are repeatedly required?
- What evidence should be added to the resume?
- What special notes matter for MNCs, startups, AI companies, backend roles, cloud roles, and systems roles?

## Canonical Input For Agent

Use `knowledge/resume-agent-knowledge-base.json` as the main machine-readable source.

The agent should use:

- `developing_profiles` to choose resume direction.
- `resume_sections` to decide which sections to generate.
- `highest_priority_projects` to request or place project evidence.
- `main_missing_items` to ask follow-up questions before finalizing a resume.

## Current Dataset Status

- Profile requirements: available.
- Resume section requirements: available.
- Skill and knowledge map: available.
- Candidate personal data: missing from this folder.
- Detailed project evidence: missing from this folder.
- Finished resume examples: missing.
- Training/evaluation examples: missing.

## Validation

The schema at `schema/resume-agent-knowledge-base.schema.json` (JSON Schema Draft 7) validates `resume-agent-knowledge-base.json`.

It enforces:

- All required top-level keys are present.
- Each profile in `developing_profiles` has all required fields.
- `current_status` is one of the allowed values.
- No array field (`required_knowledge`, `required_skills`, `proof_to_add`, `excluded_fields`, etc.) is empty.
- No unrecognised keys exist at the top level, in profiles, or in `resume_sections`.

**Validate with Node.js (ajv-cli):**

```sh
npx ajv-cli validate -s schema/resume-agent-knowledge-base.schema.json -d resume-agent-knowledge-base.json
```

**Validate with Python (check-jsonschema):**

```sh
pip install check-jsonschema
check-jsonschema --schemafile schema/resume-agent-knowledge-base.schema.json resume-agent-knowledge-base.json
```

Both commands should exit 0 and report the file as valid.

**Project name cross-reference:** Project names in `developing_profiles[*].proof_to_add` may reference entries from `highest_priority_projects`. Once `project-evidence.json` exists (Issue #2), they should also match its `name` fields. This rule is documented by convention; JSON Schema cannot enforce it across separate files.

## GitHub Evidence Extractor

`../generated/github-evidence/github-evidence.json` is **generated automatically** from the GitHub API. It is the raw technical source layer for the resume agent. Do not edit it by hand — run the extractor to refresh it.

`evidence/project-evidence.json` is the **curated, human-reviewed** file. The extractor never touches it.

### Prerequisites

- [GitHub CLI](https://cli.github.com/) installed and on `PATH`
- Authenticated: `gh auth login`
- pnpm installed: `npm install -g pnpm`

To include private repositories, authenticate with a token that has `repo` scope.

### Usage

```sh
# One-time: install dev dependencies
pnpm install

# Fetch all merklenode repositories and extract evidence
pnpm github:evidence

# Validate the existing generated GitHub evidence without fetching GitHub
pnpm github:evidence:check
```

`pnpm github:evidence` will:
1. Verify `gh` is installed and authenticated.
2. Fetch all accessible repos for `merklenode` (up to 1000, including private).
3. For each repo, fetch: language breakdown, README, root file tree, and recent commit count.
4. Detect dependency files, tools, frameworks, and resume-relevant keywords.
5. Write `generated/github-evidence/github-evidence.json`.
6. Print a summary with repo count and warning count.

Missing READMEs, empty repos, or API errors are recorded as `extraction_warnings` on the affected repo record and never crash the full run.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `gh CLI not found` | Install from https://cli.github.com/ |
| `gh auth check failed` | Run `gh auth login` |
| Private repos missing | Re-authenticate with `repo` scope: `gh auth login --scopes repo` |
| Rate limit warnings | Wait a few minutes and re-run; authenticated limit is 5,000 req/hr |
| JSON parse failed | A GitHub API endpoint returned unexpected output; file still written with partial data |

### Schema

`schema/github-evidence.schema.json` (JSON Schema Draft 7) validates the output file.

```sh
npx ajv-cli validate \
  -s schema/github-evidence.schema.json \
  -d ../generated/github-evidence/github-evidence.json
```

### Implementation notes

**Archived and forked repos** are included with `is_archived: true` / `is_fork: true` flags rather than skipped. This preserves language and topic signal that may be useful for the resume agent. Callers can filter by these flags.

**Full refresh on every run.** Incremental updates (using `activity.updated_at` to skip unchanged repos) would meaningfully cut API calls for large accounts but add complexity. For a personal account with ~30 repos, a full run completes in under 2 minutes. Add `--incremental` if the repo count grows.

**Sequential API calls, no artificial delay.** GitHub's authenticated rate limit is 5,000 requests/hour. A full run uses ~4 calls per repo. Rate-limit errors surface as per-repo warnings rather than hard failures.

**Two-layer validation.** Structural validation runs inline (no external deps) after each extraction. The JSON Schema file (`github-evidence.schema.json`) enables independent validation by the resume agent or CI.

**Field naming: `repo_name` vs `project_name`.** `generated/github-evidence/github-evidence.json` uses `repo_name` (the raw GitHub repository name). `project-evidence.json` uses `project_name` (a curated human label). These are intentionally different. A future review/merge workflow will map between them.

**Mapping to `project-evidence.json`.** In v1, the extractor writes only to `generated/github-evidence/github-evidence.json`. A future step (outside this script) should allow a human reviewer to promote specific GitHub facts into `project-evidence.json` as curated resume bullets.
