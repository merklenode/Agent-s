import { check, extract } from "./commands.js";

const command = process.argv[2];

if (command === "extract") {
  extract();
} else if (command === "check") {
  check();
} else {
  console.error("Usage: tsx scripts/github-evidence/cli.ts [extract|check]");
  process.exit(1);
}
