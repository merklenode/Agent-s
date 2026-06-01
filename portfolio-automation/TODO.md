# Project TODO (Portfolio Automation)

- [x] Decide the portfolio generator and the exact output path (`content/weekly.md`).
- [x] Initialize Node project with pnpm and ESM support.
- [x] Install dependencies: `@locusgraph/client`, `@langchain/google-genai`, `@octokit/rest`, `tsx`, `typescript`.
- [x] Implement GitHub activity fetch with date filtering (last 7 days).
- [x] Implement core modules in TypeScript:
  - `github.ts`: Fetch activity from GitHub.
  - `prompts.ts`: Gemini-optimized prompt templates.
  - `content.ts`: File I/O for portfolio updates.
- [x] Implement LocusGraph memory retrieval and storage strategy.
- [x] Orchestrate the weekly update workflow in `weekly-update.ts`.
- [x] Create GitHub Actions workflow with weekly cron + manual trigger.
- [x] Add `pnpm clean` and `pnpm build` scripts for TypeScript compilation.
- [ ] Configure secrets: `GEMINI_API_KEY`, `GITHUB_TOKEN`, `GITHUB_USER`, `LOCUSGRAPH_AGENT_SECRET`, `LOCUSGRAPH_SERVER_URL`.
- [ ] Run the script locally (`pnpm start`) and validate output.
- [ ] Trigger a manual workflow run and verify deployment.
- [ ] Add simple monitoring (workflow failure notifications).
