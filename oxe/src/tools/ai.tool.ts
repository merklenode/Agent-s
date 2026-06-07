import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const MODELS = [
  process.env.OPENAI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
].filter((model, index, models): model is string => Boolean(model) && models.indexOf(model) === index);

export async function generateText(prompt: string): Promise<string> {
  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
        });
        return res.choices[0].message.content ?? "";
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 503 || status === 500 || status === 502 || status === 504) {
          const wait = (attempt + 1) * 5000;
          console.warn(`Model ${model} returned ${status}, retrying in ${wait / 1000}s (attempt ${attempt + 1}/3)...`);
          lastError = err;
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        if (status === 404 || status === 429 || status === 403) {
          console.warn(`Model ${model} failed with ${status}, trying next model...`);
          lastError = err;
          break;
        }
        throw err;
      }
    }
  }
  throw lastError;
}
