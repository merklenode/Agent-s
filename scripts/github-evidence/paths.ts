import { resolve, dirname } from "node:path";

const SCRIPT_DIR = dirname(__filename);
export const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
export const OUTPUT_PATH = resolve(REPO_ROOT, "generated/github-evidence/github-evidence.json");
export const PROTECTED_PATH = resolve(REPO_ROOT, "resume-agent-dataset/evidence/project-evidence.json");
export const OWNER = "merklenode";
