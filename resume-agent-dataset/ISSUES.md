# Dataset Restructuring Issues

Updated: 2026-06-23

These issues describe what is still needed to make this dataset a stronger input for a resume-building AI agent.

## Issue 1: Add Candidate Profile Data

Status: open

Problem:
The dataset describes target profiles and resume requirements, but it does not include the candidate's personal profile inside this folder.

Needed fields:

- full name
- email
- phone
- location
- GitHub
- LinkedIn
- portfolio
- education
- graduation date
- work authorization
- availability
- preferred roles
- preferred locations

Suggested file:

- `candidate/candidate-profile.json`

## Issue 2: Add Project Evidence Records

Status: open

Problem:
The dataset says project proof is required, but each project still needs structured evidence.

Needed fields per project:

- project name
- short description
- target resume profiles
- tech stack
- GitHub URL
- live demo URL
- screenshots
- architecture summary
- what the candidate personally built
- strongest resume bullets
- measurable impact if true
- known limitations

Suggested file:

- `evidence/project-evidence.json`

## Issue 3: Add Resume Variant Definitions

Status: open

Problem:
The dataset lists target profiles, but it does not yet define complete resume variants.

Needed variants:

- software-engineer-general
- backend-platform-engineer
- ai-automation-engineer
- developer-tools-engineer
- full-stack-product-engineer
- systems-blockchain-engineer
- data-search-engineer

Needed fields per variant:

- target role family
- summary style
- skills to prioritize
- projects to prioritize
- projects to avoid or downplay
- ATS keywords
- section order
- tone

Suggested file:

- `knowledge/resume-variants.json`

## Issue 4: Add Agent Task Examples

Status: open

Problem:
The dataset is a knowledge base, not yet a training/evaluation set.

Needed examples:

- user asks for a backend resume
- user asks for an AI automation resume
- user asks for an MNC ATS resume
- user asks for a startup resume
- user asks what proof is missing
- user asks which projects fit a role

Suggested format:

- JSONL records with `instruction`, `input`, `expected_output`, and `source_fields`.

Suggested file:

- `training/agent-task-examples.jsonl`

## Issue 5: Add Validation Schema

Status: open

Problem:
The JSON file has useful structure, but no schema exists to validate future edits.

Needed schema rules:

- required top-level keys
- required fields for each developing profile
- allowed status values
- array fields must not be empty
- project names should match known project evidence records

Suggested file:

- `schema/resume-agent-knowledge-base.schema.json`

## Issue 6: Add Completeness Scoring

Status: open

Problem:
The agent needs a way to decide whether a resume can be generated directly or should ask follow-up questions.

Suggested scoring categories:

- personal profile completeness
- project proof completeness
- role-targeting completeness
- skills evidence completeness
- links/demo completeness
- ATS readiness

Suggested file:

- `knowledge/completeness-rules.json`

## Issue 7: Separate Knowledge Base From Training Data

Status: closed

Problem:
The current folder is a knowledge base. If training or evaluation data is added later, it should not be mixed into the same file.

Recommended structure:

```text
resume-agent-dataset/
├── README.md
├── ISSUES.md
├── knowledge/
│   ├── resume-agent-knowledge-base.json
│   ├── resume-variants.json
│   └── completeness-rules.json
├── candidate/
│   └── candidate-profile.json
├── evidence/
│   └── project-evidence.json
├── training/
│   └── agent-task-examples.jsonl
├── schema/
│   └── resume-agent-knowledge-base.schema.json
└── docs/
    ├── resume-agent-requirements.md
    └── resume-requirement-matrix.csv
```

## Priority Order

1. Add `candidate/candidate-profile.json`.
2. Add `evidence/project-evidence.json`.
3. Add `knowledge/resume-variants.json`.
4. Add `knowledge/completeness-rules.json`.
5. Add JSON schema.
6. Add agent task examples.
7. Move files into the recommended folder structure.
