import { resolve, dirname } from "node:path";

const SCRIPT_DIR = dirname(__filename);
export const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
export const EVIDENCE_PATH = resolve(
  REPO_ROOT,
  "generated/github-evidence/github-evidence.json"
);
