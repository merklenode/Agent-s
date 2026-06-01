import { PromptTemplate } from "@langchain/core/prompts";

export const WEEKLY_SUMMARY_PROMPT = PromptTemplate.fromTemplate(`
You are an AI assistant updating a developer's portfolio site. 
Based on the provided GitHub activity from the last 7 days and user preferences, generate a weekly update.

Output requirements:
1) A 3-bullet "Weekly Highlights" section.
2) A 1-paragraph summary (80-120 words).

Constraints:
- Professional tone.
- No emojis.
- No speculation (stick to the facts in the activity).
- Mention specific repositories and activities (e.g., "pushed 5 commits to X", "opened PR in Y").

GitHub Activity (JSON):
{events}

User Preferences and Past Context:
{memory}

Weekly Update:
`);
