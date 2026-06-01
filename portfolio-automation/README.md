# AI Portfolio Automation (LangChain + LocusGraph + Gemini)

This project provides a weekly, fully automated workflow that updates a portfolio site using GitHub activity, LangChain, and LocusGraph memory. The automation runs on GitHub Actions, generates content using Google Gemini, commits updates, and deploys the site.

## Goals
- Generate a consistent weekly update from GitHub activity.
- Use LocusGraph as long-term memory for preferences, tone, and past summaries.
- Keep the system deterministic and stable.
- Publish automatically on schedule via GitHub Actions.

## Tech Stack
- **Language**: TypeScript
- **Package Manager**: pnpm
- **LLM**: Google Gemini (via `@langchain/google-genai`)
- **Memory**: LocusGraph SDK
- **Data Source**: GitHub REST API

## Project Directory Layout
```
.
├─ .github/workflows/weekly-portfolio-update.yml
├─ scripts/
│  ├─ weekly-update.ts    # Main orchestration script
│  └─ lib/
│     ├─ github.ts        # GitHub API integration
│     ├─ prompts.ts       # LangChain prompt templates
│     └─ content.ts      # File system operations
├─ content/
│  └─ weekly.md           # Generated portfolio update
├─ dist/                  # Compiled JavaScript (ignored)
└─ tsconfig.json          # TypeScript configuration
```

## Required Secrets
- `GITHUB_TOKEN`: Personal Access Token with `public_repo` (or `repo`), `workflow`, and `read:user` scopes.
- `GITHUB_USER`: Your GitHub username.
- `GEMINI_API_KEY`: Google Gemini API key from Google AI Studio.
- `LOCUSGRAPH_SERVER_URL`: Your LocusGraph server URL.
- `LOCUSGRAPH_AGENT_SECRET`: Your LocusGraph agent secret.
- `GRAPH_ID`: (Optional) The LocusGraph graph ID (defaults to `default`).

## LocusGraph Memory Strategy
Use context IDs to keep memory organized:
- `fact:user-preferences`
- `fact:writing-style`
- `weekly:update:YYYY-MM-DD`

The system retrieves past summaries to maintain consistency in tone and avoid repetition.

## Scripts
- `pnpm start`: Runs the automation directly from TypeScript using `tsx` (ideal for local testing).
- `pnpm build`: Cleans the `dist` folder and compiles TypeScript to JavaScript.
- `pnpm clean`: Removes the `dist` folder.

## GitHub Actions Workflow
The workflow is configured to run every Sunday at midnight and can be triggered manually. It performs the following:
1. Sets up Node.js and pnpm.
2. Installs dependencies and builds the project.
3. Runs the update script with environment variables from secrets.
4. Commits and pushes the generated `content/weekly.md` back to the repository.

## Troubleshooting
- **Empty output**: Check GitHub API rate limits or if there was any activity in the last 7 days.
- **Memory not retrieved**: Verify `LOCUSGRAPH_SERVER_URL` and `LOCUSGRAPH_AGENT_SECRET`.
- **Permission Denied**: Ensure `GITHUB_TOKEN` has the `workflow` and `repo` scopes.
