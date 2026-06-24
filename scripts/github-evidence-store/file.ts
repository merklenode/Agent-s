import { existsSync, readFileSync } from "node:fs";
import type { GithubEvidenceFile } from "./types.js";

export function readEvidenceFile(filePath: string): GithubEvidenceFile {
  if (!existsSync(filePath)) {
    throw new Error(
      `Evidence file not found: ${filePath}\n` +
      "Run 'pnpm github:evidence' first to generate it."
    );
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (e) {
    throw new Error(`Cannot read evidence file: ${(e as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Evidence file is not valid JSON: ${(e as Error).message}`);
  }

  const data = parsed as GithubEvidenceFile;
  if (!data.updated || !data.owner || !Array.isArray(data.repositories)) {
    throw new Error(
      "Evidence file is missing required fields (updated, owner, repositories).\n" +
      "Re-run 'pnpm github:evidence' to regenerate it."
    );
  }

  return data;
}
