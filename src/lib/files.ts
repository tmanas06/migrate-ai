// ============================================================
// File reader – recursively read relevant files from a repo
// ============================================================
import { readdir, readFile, stat } from "fs/promises";
import { join, extname, relative } from "path";

/** Directories to always skip */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "env",
  ".tox",
  ".mypy_cache",
]);

/** Max file size to read (100KB) */
const MAX_FILE_SIZE = 100_000;

/** Max total files to process */
const MAX_FILES = 100;

/**
 * Recursively read all relevant source files from a directory.
 * Filters by file extensions and respects skip directories.
 */
export async function readRepoFiles(
  repoPath: string,
  relevantExtensions: string[]
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];

  async function walk(dir: string) {
    if (files.length >= MAX_FILES) return;

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;

      const fullPath = join(dir, entry.name);
      const relativePath = relative(repoPath, fullPath);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name);

        // Check if this file has a relevant extension
        const isRelevant = relevantExtensions.some((re) => {
          const normalizedRe = re.startsWith(".") ? re : `.${re}`;
          return entry.name.endsWith(normalizedRe);
        });

        if (isRelevant) {
          try {
            const fileStat = await stat(fullPath);
            if (fileStat.size <= MAX_FILE_SIZE) {
              const content = await readFile(fullPath, "utf-8");
              // Skip binary/non-text files
              if (!content.includes("\0")) {
                files.push({ path: relativePath, content });
              }
            }
          } catch {
            // Skip files we can't read
          }
        }
      }
    }
  }

  await walk(repoPath);
  return files;
}
