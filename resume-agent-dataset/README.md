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
