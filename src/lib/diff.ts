// ============================================================
// Diff generation utilities
// ============================================================
import { createPatch, structuredPatch } from "diff";
import type { FileChange } from "./types";

/**
 * Generate a unified diff string from an array of file changes.
 */
export function generateUnifiedDiff(files: FileChange[]): string {
  const patches: string[] = [];

  for (const file of files) {
    if (file.originalContent !== file.migratedContent) {
      const patch = createPatch(
        file.path,
        file.originalContent,
        file.migratedContent,
        "original",
        "migrated"
      );
      patches.push(patch);
    }
  }

  return patches.join("\n");
}

/**
 * Generate a downloadable .patch file content from file changes.
 */
export function generatePatchContent(files: FileChange[]): string {
  const patches: string[] = [];

  for (const file of files) {
    if (file.originalContent !== file.migratedContent) {
      const patch = createPatch(
        file.path,
        file.originalContent,
        file.migratedContent,
        "a/" + file.path,
        "b/" + file.path
      );
      patches.push(patch);
    }
  }

  return patches.join("\n");
}

/**
 * Calculate diff statistics (files changed, lines added, lines removed).
 */
export function calculateDiffStats(files: FileChange[]): {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
} {
  let filesChanged = 0;
  let linesAdded = 0;
  let linesRemoved = 0;

  for (const file of files) {
    if (file.originalContent !== file.migratedContent) {
      filesChanged++;
      const structured = structuredPatch(
        file.path,
        file.path,
        file.originalContent,
        file.migratedContent
      );

      for (const hunk of structured.hunks) {
        for (const line of hunk.lines) {
          if (line.startsWith("+") && !line.startsWith("+++")) {
            linesAdded++;
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            linesRemoved++;
          }
        }
      }
    }
  }

  return { filesChanged, linesAdded, linesRemoved };
}
