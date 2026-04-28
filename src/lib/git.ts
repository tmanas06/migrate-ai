// ============================================================
// Git utilities – clone repos to tmp directories
// ============================================================
import simpleGit from "simple-git";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Clone a public GitHub repository into a temporary directory.
 * Returns the path to the cloned repo.
 */
export async function cloneRepo(repoUrl: string): Promise<string> {
  // Validate URL
  if (!isValidGitHubUrl(repoUrl)) {
    throw new Error(
      "Invalid GitHub URL. Please provide a valid public GitHub repository URL."
    );
  }

  // Create temp dir
  const tmpDir = await mkdtemp(join(tmpdir(), "migrateai-"));

  try {
    const git = simpleGit();
    await git.clone(repoUrl, tmpDir, ["--depth", "1"]);
    return tmpDir;
  } catch (error) {
    // Cleanup on failure
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(
      `Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clean up a cloned repo directory.
 */
export async function cleanupRepo(repoPath: string): Promise<void> {
  try {
    await rm(repoPath, { recursive: true, force: true });
  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Validate that a URL looks like a GitHub repository.
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "github.com" || parsed.hostname === "www.github.com") &&
      parsed.pathname.split("/").filter(Boolean).length >= 2
    );
  } catch {
    return false;
  }
}
