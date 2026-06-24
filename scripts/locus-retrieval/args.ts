import { LocusValidationError } from "./errors.js";
import type { CliArgs } from "./types.js";

export function parseCliArgs(argv: string[]): CliArgs {
  const result: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === "--query") {
      const next = argv[i + 1];
      if (next !== undefined) {
        result.query = next;
        i++;
      }
    } else if (arg === "--limit") {
      const next = argv[i + 1];
      if (next !== undefined) {
        const n = Number(next);
        if (isNaN(n) || n <= 0 || !Number.isInteger(n)) {
          throw new LocusValidationError("--limit must be a positive integer");
        }
        result.limit = n;
        i++;
      } else {
        throw new LocusValidationError("--limit requires a value");
      }
    } else if (arg === "--context-ids") {
      const next = argv[i + 1];
      if (next !== undefined) {
        result.contextIds = next.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
        i++;
      }
    }
  }
  return result;
}
