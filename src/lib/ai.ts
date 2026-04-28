// ============================================================
// Groq AI API Wrapper – MigrateAI
// ============================================================
import Groq from "groq-sdk";
import type { MigrationPlan, MigrationType } from "./types";

const getClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your .env file."
    );
  }
  return new Groq({ apiKey });
};

/** Mapping from migration type to human-readable source → target labels */
const MIGRATION_LABELS: Record<MigrationType, { from: string; to: string }> = {
  "auto": { from: "Unknown", to: "Modern" },
  "react-17-to-19": { from: "React 17", to: "React 19" },
  "jest-to-vitest": { from: "Jest", to: "Vitest" },
  "cjs-to-esm": { from: "CommonJS (require/module.exports)", to: "ES Modules (import/export)" },
  "python-2-to-3": { from: "Python 2", to: "Python 3" },
  "rest-to-trpc": { from: "REST API", to: "tRPC" },
  "tailwind-3-to-4": { from: "Tailwind CSS v3", to: "Tailwind CSS v4" },
};

/**
 * Send a codebase to Groq for migration analysis and get back a structured
 * migration plan.
 */
export async function analyzeMigration(
  files: { path: string; content: string }[],
  migrationType: MigrationType
): Promise<MigrationPlan> {
  const client = getClient();
  const { from: sourceFramework, to: targetFramework } = MIGRATION_LABELS[migrationType];

  const filesSummary = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const systemPrompt = `You are an expert code migration engineer. Analyze the provided codebase and create a precise migration plan for upgrading from ${sourceFramework} to ${targetFramework}. Return ONLY valid JSON with this schema: { "files": [{ "path": "string", "originalContent": "string", "migratedContent": "string", "changeDescription": "string" }], "summary": "string", "breakingChanges": ["string"], "estimatedRisk": "low" | "medium" | "high" }. Be thorough. Apply all necessary transforms.

Important rules:
- estimatedRisk must be one of: "low", "medium", "high"
- Only include files that actually need changes
- originalContent should be the exact original file content
- migratedContent should be the fully transformed content
- changeDescription should explain what was changed and why
- breakingChanges should list any breaking changes users need to be aware of
- Return ONLY the JSON object, no markdown fences, no explanations. Do not include any text outside the JSON.`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Here are the files to migrate:\n\n${filesSummary}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned no response");
  }

  try {
    const plan = JSON.parse(content) as MigrationPlan;
    // Validate shape
    if (!Array.isArray(plan.files) || typeof plan.summary !== "string") {
      throw new Error("Invalid migration plan structure");
    }
    return plan;
  } catch (e) {
    // Attempt to extract JSON if parsing failed
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    try {
       return JSON.parse(jsonStr) as MigrationPlan;
    } catch (innerError) {
      throw new Error(
        `Failed to parse Groq migration plan: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

/**
 * Generate a professional GitHub PR description from a migration summary.
 */
export async function generatePRDescription(
  migrationType: MigrationType,
  summary: string,
  filesChanged: number,
  linesAdded: number,
  linesRemoved: number,
  breakingChanges: string[]
): Promise<string> {
  const client = getClient();
  const { from: sourceFramework, to: targetFramework } = MIGRATION_LABELS[migrationType];

  const systemPrompt = `You are a senior engineer writing a GitHub PR description. Write a clear, professional PR description for this automated migration. Use markdown. Include: ## Summary, ## Changes, ## Testing, ## Breaking Changes. Be specific about what changed and why.`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Migration: ${sourceFramework} → ${targetFramework}

Summary: ${summary}

Stats: ${filesChanged} files changed, ${linesAdded} lines added, ${linesRemoved} lines removed

Breaking Changes: ${breakingChanges.length > 0 ? breakingChanges.join(", ") : "None"}

Write the PR description now.`,
      },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned no response for PR description");
  }

  return content;
}

/**
 * Automatically detect the best migration type based on repository file structure and metadata.
 */
export async function autoDetectMigration(
  files: { path: string; content: string }[]
): Promise<MigrationType> {
  const client = getClient();

  // Create a summary of the repository for the AI
  const fileList = files.map(f => f.path).join("\n");
  const packageJson = files.find(f => f.path === "package.json")?.content || "No package.json found";
  
  const systemPrompt = `You are an expert software architect. Analyze the provided repository metadata and identify which of the following migration types is MOST appropriate for this codebase.

Supported Migration Types:
1. react-17-to-19: If the project uses React 17 or older and has many .tsx/.jsx files.
2. jest-to-vitest: If the project has many .test.js/.ts files and uses Jest in package.json.
3. cjs-to-esm: If the project uses CommonJS (require/module.exports) and no ESM.
4. python-2-to-3: If the project uses Python (.py files) and appears to be Python 2.
5. rest-to-trpc: If the project is a TypeScript/JavaScript project with many REST API routes (e.g., in pages/api).
6. tailwind-3-to-4: If the project uses Tailwind CSS (tailwind.config.js) and is likely on v3.

Return ONLY the ID of the migration type (e.g., "react-17-to-19"). If none seem highly appropriate, default to "react-17-to-19" if it's a web project or "cjs-to-esm" if it's node. If completely unsure, return "react-17-to-19".`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Repository Files:\n${fileList}\n\nPackage.json Content:\n${packageJson}`,
      },
    ],
    temperature: 0.1,
  });

  const detected = response.choices[0]?.message?.content?.trim() as MigrationType;
  
  // Validate detected type
  const validTypes: MigrationType[] = [
    "react-17-to-19",
    "jest-to-vitest",
    "cjs-to-esm",
    "python-2-to-3",
    "rest-to-trpc",
    "tailwind-3-to-4",
  ];

  if (validTypes.includes(detected)) {
    return detected;
  }

  return "react-17-to-19"; // Fallback
}
