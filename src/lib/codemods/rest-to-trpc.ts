// ============================================================
// Codemod: REST → tRPC
// ============================================================
import type { FileChange } from "../types";

/**
 * Apply REST API → tRPC transforms.
 * Handles: fetch/axios calls → tRPC client calls,
 * API route files → tRPC router procedures, etc.
 */
export function applyRestToTrpc(
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    let migrated = file.content;
    const descriptions: string[] = [];

    // 1. Convert fetch() calls to tRPC-style calls
    if (/fetch\s*\(\s*['"`]\/api\//.test(migrated)) {
      migrated = migrated.replace(
        /(?:const|let)\s+(\w+)\s*=\s*await\s+fetch\s*\(\s*['"`]\/api\/(\w+)['"`]\s*(?:,\s*\{[^}]*method:\s*['"]GET['"][^}]*\})?\s*\)\s*;?\s*(?:const|let)\s+(\w+)\s*=\s*await\s+\1\.json\(\)\s*;?/g,
        (_, _fetchVar: string, endpoint: string, dataVar: string) => {
          descriptions.push(`Converted fetch('/api/${endpoint}') to tRPC query`);
          return `const ${dataVar} = await trpc.${endpoint}.query();`;
        }
      );

      // POST fetch calls
      migrated = migrated.replace(
        /(?:const|let)\s+(\w+)\s*=\s*await\s+fetch\s*\(\s*['"`]\/api\/(\w+)['"`]\s*,\s*\{[^}]*method:\s*['"]POST['"][^}]*body:\s*JSON\.stringify\(([^)]+)\)[^}]*\}\s*\)\s*;?/g,
        (_, _fetchVar: string, endpoint: string, bodyArg: string) => {
          descriptions.push(`Converted POST fetch('/api/${endpoint}') to tRPC mutation`);
          return `const result = await trpc.${endpoint}.mutate(${bodyArg});`;
        }
      );
    }

    // 2. Convert axios calls to tRPC
    if (/axios\.(get|post|put|delete|patch)\s*\(\s*['"`]\/api\//.test(migrated)) {
      migrated = migrated.replace(
        /axios\.get\s*\(\s*['"`]\/api\/(\w+)['"`]\s*\)/g,
        (_, endpoint: string) => {
          descriptions.push(`Converted axios.get('/api/${endpoint}') to tRPC query`);
          return `trpc.${endpoint}.query()`;
        }
      );
      migrated = migrated.replace(
        /axios\.post\s*\(\s*['"`]\/api\/(\w+)['"`]\s*,\s*([^)]+)\)/g,
        (_, endpoint: string, data: string) => {
          descriptions.push(`Converted axios.post('/api/${endpoint}') to tRPC mutation`);
          return `trpc.${endpoint}.mutate(${data.trim()})`;
        }
      );
    }

    // 3. Convert Express/Next.js API route handlers to tRPC procedures
    if (
      /export\s+(?:default\s+)?(?:async\s+)?function\s+handler/.test(migrated) ||
      /export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)/.test(migrated)
    ) {
      const routerTemplate = `import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

// TODO: Define input schema based on original request body
// This is a converted tRPC procedure from the original REST endpoint

export const appRouter = router({
  // Original handler converted to tRPC procedure
  ${file.path.includes("get") || migrated.includes("GET") ? "query" : "mutation"}: publicProcedure
    .input(z.object({
      // Define your input schema here
    }))
    .${file.path.includes("get") || migrated.includes("GET") ? "query" : "mutation"}(async ({ input }) => {
      // Migrate your handler logic here
      // Original code preserved below for reference
    }),
});

/*
 * Original REST handler (preserved for reference):
 * ${migrated.split("\n").join("\n * ")}
 */
`;
      migrated = routerTemplate;
      descriptions.push("Converted REST API handler to tRPC router procedure");
    }

    if (migrated !== file.content) {
      changes.push({
        path: file.path,
        originalContent: file.content,
        migratedContent: migrated,
        changeDescription:
          descriptions.length > 0
            ? descriptions.join("; ")
            : "Converted REST patterns to tRPC",
      });
    }
  }

  return changes;
}
