// ============================================================
// Codemod: Jest → Vitest
// ============================================================
import type { FileChange } from "../types";

/**
 * Apply Jest → Vitest transforms to test files.
 * Handles: import changes, global API differences, mock patterns,
 * configuration updates, etc.
 */
export function applyJestToVitest(
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    let migrated = file.content;
    const descriptions: string[] = [];

    // 1. Add vitest imports
    const vitestImports: string[] = [];
    if (/\b(describe|it|test|expect|beforeEach|afterEach|beforeAll|afterAll)\b/.test(migrated)) {
      const globals = ["describe", "it", "test", "expect", "beforeEach", "afterEach", "beforeAll", "afterAll"];
      const used = globals.filter((g) => new RegExp(`\\b${g}\\b`).test(migrated));
      vitestImports.push(...used);
    }
    if (/\bjest\.(fn|mock|spyOn|useFakeTimers|useRealTimers|clearAllMocks|resetAllMocks)\b/.test(migrated)) {
      vitestImports.push("vi");
    }

    if (vitestImports.length > 0) {
      const importStatement = `import { ${[...new Set(vitestImports)].join(", ")} } from 'vitest';\n`;
      // Add import at the top (after existing imports or at very top)
      const lastImportMatch = migrated.match(/^import .+$/m);
      if (lastImportMatch) {
        migrated = importStatement + migrated;
      } else {
        migrated = importStatement + "\n" + migrated;
      }
      descriptions.push("Added vitest imports");
    }

    // 2. Replace jest.fn() → vi.fn()
    if (/jest\.fn\b/.test(migrated)) {
      migrated = migrated.replace(/jest\.fn\b/g, "vi.fn");
      descriptions.push("Replaced jest.fn() with vi.fn()");
    }

    // 3. Replace jest.mock() → vi.mock()
    if (/jest\.mock\b/.test(migrated)) {
      migrated = migrated.replace(/jest\.mock\b/g, "vi.mock");
      descriptions.push("Replaced jest.mock() with vi.mock()");
    }

    // 4. Replace jest.spyOn() → vi.spyOn()
    if (/jest\.spyOn\b/.test(migrated)) {
      migrated = migrated.replace(/jest\.spyOn\b/g, "vi.spyOn");
      descriptions.push("Replaced jest.spyOn() with vi.spyOn()");
    }

    // 5. Replace jest timer utilities
    if (/jest\.useFakeTimers/.test(migrated)) {
      migrated = migrated.replace(/jest\.useFakeTimers\b/g, "vi.useFakeTimers");
      descriptions.push("Replaced jest.useFakeTimers with vi.useFakeTimers");
    }
    if (/jest\.useRealTimers/.test(migrated)) {
      migrated = migrated.replace(/jest\.useRealTimers\b/g, "vi.useRealTimers");
      descriptions.push("Replaced jest.useRealTimers with vi.useRealTimers");
    }
    if (/jest\.advanceTimersByTime/.test(migrated)) {
      migrated = migrated.replace(/jest\.advanceTimersByTime\b/g, "vi.advanceTimersByTime");
      descriptions.push("Replaced jest.advanceTimersByTime with vi.advanceTimersByTime");
    }

    // 6. Replace jest.clearAllMocks / resetAllMocks
    migrated = migrated.replace(/jest\.clearAllMocks\b/g, "vi.clearAllMocks");
    migrated = migrated.replace(/jest\.resetAllMocks\b/g, "vi.resetAllMocks");
    migrated = migrated.replace(/jest\.restoreAllMocks\b/g, "vi.restoreAllMocks");

    // 7. Replace jest.requireActual → vi.importActual
    if (/jest\.requireActual/.test(migrated)) {
      migrated = migrated.replace(/jest\.requireActual\b/g, "vi.importActual");
      descriptions.push("Replaced jest.requireActual with vi.importActual");
    }

    // 8. Update config file name
    if (file.path.includes("jest.config")) {
      migrated = `/// <reference types="vitest" />\nimport { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  test: {\n    globals: true,\n    environment: 'jsdom',\n  },\n});\n`;
      descriptions.push("Converted jest.config to vitest.config");
    }

    if (migrated !== file.content) {
      changes.push({
        path: file.path,
        originalContent: file.content,
        migratedContent: migrated,
        changeDescription: descriptions.join("; "),
      });
    }
  }

  return changes;
}
