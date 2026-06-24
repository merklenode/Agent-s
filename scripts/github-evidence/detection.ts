import type { ResumeEvidenceSignals } from "./types.js";

const README_FRAMEWORK_PATTERNS: Array<[RegExp, string]> = [
  [/\bReact\b/i, "React"],
  [/\bNext\.js\b/i, "Next.js"],
  [/\bVue\b/i, "Vue.js"],
  [/\bSvelte\b/i, "Svelte"],
  [/\bAngular\b/i, "Angular"],
  [/\bFastAPI\b/i, "FastAPI"],
  [/\bDjango\b/i, "Django"],
  [/\bFlask\b/i, "Flask"],
  [/\bExpress\b/i, "Express"],
  [/\bFastify\b/i, "Fastify"],
  [/\bNestJS\b/i, "NestJS"],
  [/\bPrisma\b/i, "Prisma"],
  [/\bSolidity\b/i, "Solidity"],
  [/\bHardhat\b/i, "Hardhat"],
  [/\bFoundry\b/i, "Foundry"],
  [/\bAnchor\b/i, "Anchor"],
  [/\bIPFS\b/i, "IPFS"],
  [/\bPostgreSQL\b|postgres/i, "PostgreSQL"],
  [/\bMySQL\b/i, "MySQL"],
  [/\bMongoDB\b/i, "MongoDB"],
  [/\bRedis\b/i, "Redis"],
  [/\bOpenAI\b/i, "OpenAI API"],
  [/\banthropic\b|claude api/i, "Anthropic / Claude API"],
  [/\bLangChain\b/i, "LangChain"],
  [/\bWebAssembly\b|wasm\b/i, "WebAssembly"],
  [/\bSolana\b/i, "Solana"],
  [/\bEthereum\b/i, "Ethereum"],
  [/\bGraphQL\b/i, "GraphQL"],
  [/\bgRPC\b/i, "gRPC"],
];

const TECH_KEYWORD_PATTERNS: Array<[RegExp, string]> = [
  [/\bTypeScript\b/i, "TypeScript"],
  [/\bJavaScript\b/i, "JavaScript"],
  [/\bPython\b/i, "Python"],
  [/\bRust\b/i, "Rust"],
  [/\bC\+\+/, "C++"],
  [/\bGolang\b|\bGo\s+lang/i, "Go"],
  [/\bSolidity\b/i, "Solidity"],
  [/\bReact\b/i, "React"],
  [/\bNext\.js\b/i, "Next.js"],
  [/\bNode\.js\b/i, "Node.js"],
  [/\bFastAPI\b/i, "FastAPI"],
  [/\bDjango\b/i, "Django"],
  [/\bFlask\b/i, "Flask"],
  [/\bPostgreSQL\b|postgres/i, "PostgreSQL"],
  [/\bMySQL\b/i, "MySQL"],
  [/\bMongoDB\b/i, "MongoDB"],
  [/\bRedis\b/i, "Redis"],
  [/\bPrisma\b/i, "Prisma"],
  [/\bDocker\b/i, "Docker"],
  [/\bKubernetes\b|k8s\b/i, "Kubernetes"],
  [/\bOpenAI\b/i, "OpenAI API"],
  [/\banthropic\b|claude\b/i, "Anthropic / Claude"],
  [/\bLLM\b/i, "LLM"],
  [/\bRAG\b/i, "RAG"],
  [/\bagent\b/i, "agent workflows"],
  [/\bIPFS\b/i, "IPFS"],
  [/\bEthereum\b/i, "Ethereum"],
  [/\bSolana\b/i, "Solana"],
  [/\bHardhat\b/i, "Hardhat"],
  [/\bWebAssembly\b|wasm/i, "WebAssembly"],
  [/\bMerkle\b/i, "Merkle tree"],
  [/\bREST API\b/i, "REST API"],
  [/\bGraphQL\b/i, "GraphQL"],
  [/\bgRPC\b/i, "gRPC"],
  [/\bgithub actions\b/i, "GitHub Actions"],
  [/\bCI\/CD\b/i, "CI/CD"],
  [/\bSQL\b/i, "SQL"],
  [/\bElasticsearch\b/i, "Elasticsearch"],
];

const PROFILE_SIGNAL_PATTERNS: Array<[RegExp, string]> = [
  [/react|next\.js|vue|svelte|frontend|ui\b|ux\b|tailwind/i, "Frontend / Full-stack Product Engineer"],
  [/fastapi|django|flask|express|nestjs|fastify|backend|rest api|postgres|mysql|prisma/i, "Backend / Platform Engineer"],
  [/openai|anthropic|claude|llm|agent|prompt|rag|langchain|automation/i, "AI Automation / AI Product Engineer"],
  [/cli\b|devtool|developer experience|devex|developer workflow|dx\b/i, "Developer Tools / DX Engineer"],
  [/docker|kubernetes|k8s|deploy|cloud\b|aws\b|gcp\b|azure|terraform|helm/i, "Cloud / Infrastructure Engineer"],
  [/solidity|ethereum|blockchain|smart contract|ipfs|merkle|solana|hardhat|foundry|anchor|defi|nft/i, "Systems / Blockchain Engineer"],
  [/c\+\+|cmake|wasm|webassembly|performance\b|systems programming|low.level/i, "Systems / Performance Engineer"],
  [/postgresql|mysql|sql\b|schema|indexing|search|vector|elasticsearch|mongodb/i, "Data / Search / Database Engineer"],
];

export function detectFrameworks(
  readmeExcerpt: string,
  dependencyFiles: string[],
  toolsDetected: string[]
): string[] {
  const found = new Set<string>();

  for (const [pattern, name] of README_FRAMEWORK_PATTERNS) {
    if (pattern.test(readmeExcerpt)) found.add(name);
  }

  if (dependencyFiles.includes("Cargo.toml")) found.add("Rust / Cargo");
  if (toolsDetected.includes("CMake")) found.add("CMake");
  if (dependencyFiles.includes("go.mod")) found.add("Go modules");
  if (toolsDetected.includes("Hardhat")) found.add("Hardhat");
  if (toolsDetected.includes("Foundry")) found.add("Foundry");
  if (toolsDetected.includes("Anchor")) found.add("Anchor");

  return Array.from(found).sort();
}

export function buildResumeSignals(
  primaryLanguage: string | null,
  languages: string[],
  frameworks: string[],
  readmeExcerpt: string,
  description: string
): ResumeEvidenceSignals {
  const corpus = [description, readmeExcerpt, ...frameworks, primaryLanguage ?? ""].join(" ");

  const keywords = new Set<string>();
  for (const [pattern, kw] of TECH_KEYWORD_PATTERNS) {
    if (pattern.test(corpus)) keywords.add(kw);
  }
  for (const lang of [primaryLanguage, ...languages]) {
    if (lang) keywords.add(lang);
  }

  const profiles = new Set<string>();
  for (const [pattern, profile] of PROFILE_SIGNAL_PATTERNS) {
    if (pattern.test(corpus)) profiles.add(profile);
  }

  const kwCount = keywords.size;
  const confidence: "low" | "medium" | "high" =
    kwCount >= 5 ? "high" : kwCount >= 2 ? "medium" : "low";

  return {
    possible_profiles: Array.from(profiles).sort(),
    technical_keywords: Array.from(keywords).sort(),
    confidence,
  };
}
