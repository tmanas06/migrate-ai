// ============================================================
// Groq AI API Wrapper – MigrateAI
// ============================================================
import Groq from "groq-sdk";
import type { MigrationPlan, MigrationType } from "./types";

const getClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes("ZZZZ") || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is not configured or is a placeholder. Please set a valid key in .env or .env.local"
    );
  }
  return new Groq({ apiKey });
};

type ChatParams = Omit<Parameters<Groq["chat"]["completions"]["create"]>[0], "model"> & {
  model?: string;
};

let activeModelsCache: string[] | null = null;

/**
 * Fetch available models dynamically from Groq or return preferred fallbacks.
 */
async function getAvailableModels(client: Groq): Promise<string[]> {
  if (activeModelsCache && activeModelsCache.length > 0) {
    return activeModelsCache;
  }

  try {
    const list = await client.models.list();
    const modelIds = list.data.map((m) => m.id);
    console.log("[Groq] Available active models for API key:", modelIds);

    // Filter out audio, whisper, guard, vision-only
    const chatModels = modelIds.filter(
      (id) =>
        !id.includes("whisper") &&
        !id.includes("guard") &&
        !id.includes("tts") &&
        !id.includes("embed")
    );

    if (chatModels.length > 0) {
      activeModelsCache = chatModels;
      return chatModels;
    }
  } catch (err) {
    console.warn("[Groq] Could not query models list dynamically:", err);
  }

  // Known fallback candidates
  return [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ];
}

/**
 * Execute chat completion with fallback models if the primary model is unavailable or decommissioned.
 */
async function createChatCompletionWithFallback(
  client: Groq,
  params: ChatParams
): Promise<Groq.Chat.ChatCompletion> {
  const availableModels = await getAvailableModels(client);

  const userModel = process.env.GROQ_MODEL;
  const modelsToTry: string[] = [];

  if (userModel) {
    modelsToTry.push(userModel);
  }

  // Add available models in order
  for (const m of availableModels) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  let lastError: unknown;
  for (const model of modelsToTry) {
    try {
      console.log(`[Groq] Attempting completion with model: ${model}`);
      return (await client.chat.completions.create({
        ...params,
        model,
        stream: false,
      })) as Groq.Chat.ChatCompletion;
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const message = (err as { message?: string })?.message || "";
      const code = (err as { error?: { code?: string } })?.error?.code || "";

      const isModelError =
        status === 404 ||
        status === 400 ||
        code === "model_decommissioned" ||
        code === "model_not_found" ||
        message.includes("model_not_found") ||
        message.includes("decommissioned") ||
        message.includes("does not exist") ||
        message.includes("access");

      if (isModelError) {
        console.warn(`[Groq] Model '${model}' failed (${code || status}): ${message}. Attempting fallback model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

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

  const response = await createChatCompletionWithFallback(client, {
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

  const response = await createChatCompletionWithFallback(client, {
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
 * Heuristically detect migration type from files and package.json when AI is unavailable.
 */
export function detectMigrationHeuristically(
  files: { path: string; content: string }[]
): MigrationType {
  const pkgFile = files.find((f) => f.path === "package.json");
  const pkgContent = pkgFile?.content || "";

  // 1. Python 2 to 3
  if (files.some((f) => f.path.endsWith(".py"))) {
    return "python-2-to-3";
  }

  // 2. Tailwind 3 to 4
  if (
    files.some((f) => f.path.includes("tailwind.config")) ||
    pkgContent.includes('"tailwindcss"')
  ) {
    if (!files.some((f) => f.content.includes('@import "tailwindcss"') || f.content.includes("@theme"))) {
      return "tailwind-3-to-4";
    }
  }

  // 3. Jest to Vitest
  if (
    pkgContent.includes('"jest"') ||
    files.some((f) => f.path.includes("jest.config") || f.content.includes("jest.fn") || f.content.includes("jest.mock"))
  ) {
    return "jest-to-vitest";
  }

  // 4. REST to tRPC
  if (
    files.some((f) => f.path.includes("pages/api/") || (f.path.includes("app/api/") && !f.path.includes("api/trpc")))
  ) {
    return "rest-to-trpc";
  }

  // 5. CommonJS to ESM
  const hasRequireOrModuleExports = files.some(
    (f) =>
      /(?:^|\s)require\s*\(/.test(f.content) ||
      /module\.exports\s*=/.test(f.content) ||
      /exports\.\w+\s*=/.test(f.content)
  );
  if (hasRequireOrModuleExports && !pkgContent.includes('"type": "module"')) {
    return "cjs-to-esm";
  }

  // 6. React 17 to 19 (default for web/React repos)
  return "react-17-to-19";
}

/**
 * Automatically detect the best migration type based on repository file structure and metadata.
 */
export async function autoDetectMigration(
  files: { path: string; content: string }[]
): Promise<MigrationType> {
  try {
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

    const response = await createChatCompletionWithFallback(client, {
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

    return detectMigrationHeuristically(files);
  } catch (error) {
    console.warn("AI auto-detection unavailable, falling back to heuristics:", error instanceof Error ? error.message : error);
    return detectMigrationHeuristically(files);
  }
}
