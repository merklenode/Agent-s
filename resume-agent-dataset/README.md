# Resume Agent Dataset

Updated: 2026-06-23

This folder is a resume-building knowledge dataset for an AI agent.

It does not track companies, links, rankings, or application status. It keeps reusable information needed to build resumes across MNC, startup, AI, backend, platform, full-stack, systems, and data/search roles.

## Files

- `resume-agent-knowledge-base.json`: canonical structured knowledge base for an agent.
- `resume-agent-requirements.md`: human-readable planning document.
- `resume-requirement-matrix.csv`: spreadsheet-friendly skill and resume matrix.
- `ISSUES.md`: restructuring and data-completion issue list.

## Purpose

Use this data to build stronger resume variants for many companies, not only the companies already researched.

The dataset answers:

- What profile should the candidate develop?
- What skills and knowledge are repeatedly required?
- What evidence should be added to the resume?
- What special notes matter for MNCs, startups, AI companies, backend roles, cloud roles, and systems roles?

## Canonical Input For Agent

Use `resume-agent-knowledge-base.json` as the main machine-readable source.

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
