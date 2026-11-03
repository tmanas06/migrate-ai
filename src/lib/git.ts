// ============================================================
// Git utilities – clone repos to tmp directories
// Works both locally (via git) and on Vercel/serverless (via HTTP tarball)
// ============================================================
import simpleGit from "simple-git";
import { mkdtemp, rm } from "fs/promises";
import { writeFileSync, mkdirSync } from "fs";
import { gunzipSync } from "zlib";
import { tmpdir } from "os";
import { join, dirname } from "path";

/**
 * Extract an uncompressed POSIX tar buffer to disk.
 */
function extractTar(tarBuffer: Buffer, targetDir: string): void {
  let offset = 0;
  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    offset += 512;
    if (header[0] === 0) break; // End of archive

    // Extract filename (bytes 0..100)
    let nameEnd = 0;
    while (nameEnd < 100 && header[nameEnd] !== 0) nameEnd++;
    let name = header.subarray(0, nameEnd).toString("utf-8");

    // Check ustar prefix (bytes 345..500)
    if (header.subarray(257, 262).toString("ascii") === "ustar") {
      let prefixEnd = 345;
      while (prefixEnd < 500 && header[prefixEnd] !== 0) prefixEnd++;
      const prefix = header.subarray(345, prefixEnd).toString("utf-8");
      if (prefix) {
        name = prefix + "/" + name;
      }
    }

    // Read size (octal)
    const sizeStr = header.subarray(124, 136).toString("utf-8").trim().replace(/\0/g, "");
    const size = parseInt(sizeStr, 8) || 0;
    const typeflag = String.fromCharCode(header[156]);

    const dataOffset = offset;
    offset += Math.ceil(size / 512) * 512;

    // Strip the root folder name from GitHub archive (e.g. "repo-main/")
    const pathParts = name.split("/").filter(Boolean);
    if (pathParts.length <= 1) continue;
    const relativePath = pathParts.slice(1).join("/");
    const fullPath = join(targetDir, relativePath);

    if (typeflag === "5" || name.endsWith("/")) {
      mkdirSync(fullPath, { recursive: true });
    } else if (typeflag === "0" || typeflag === "\0" || typeflag === "") {
      mkdirSync(dirname(fullPath), { recursive: true });
      const content = tarBuffer.subarray(dataOffset, dataOffset + size);
      writeFileSync(fullPath, content);
    }
  }
}

/**
 * Download and extract a GitHub repository tarball via HTTP.
 * This does not require git binary and works on Vercel / AWS Lambda.
 */
async function downloadRepoTarball(owner: string, repo: string, targetDir: string): Promise<void> {
  const candidateUrls = [
    `https://github.com/${owner}/${repo}/archive/refs/heads/main.tar.gz`,
    `https://github.com/${owner}/${repo}/archive/refs/heads/master.tar.gz`,
    `https://github.com/${owner}/${repo}/archive/HEAD.tar.gz`,
  ];

  let lastError: unknown;
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "MigrateAI/1.0",
          Accept: "application/x-gzip, application/octet-stream, */*",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const compressedBuffer = Buffer.from(arrayBuffer);
      const tarBuffer = gunzipSync(compressedBuffer);
      extractTar(tarBuffer, targetDir);
      return;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `Could not download repo tarball: ${lastError instanceof Error ? lastError.message : "Not found"}`
  );
}

/**
 * Parse owner and repository name from GitHub URL.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, ""),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clone or download a public GitHub repository into a temporary directory.
 * Returns the path to the extracted files.
 */
export async function cloneRepo(repoUrl: string): Promise<string> {
  if (!isValidGitHubUrl(repoUrl)) {
    throw new Error(
      "Invalid GitHub URL. Please provide a valid public GitHub repository URL."
    );
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error("Could not parse repository owner and name from GitHub URL.");
  }

  const tmpDir = await mkdtemp(join(tmpdir(), "migrateai-"));

  // 1. Try local git clone first (depth=1)
  try {
    const git = simpleGit();
    await git.clone(repoUrl, tmpDir, ["--depth", "1"]);
    return tmpDir;
  } catch (gitError) {
    console.warn(
      `Git clone failed (${gitError instanceof Error ? gitError.message : gitError}), falling back to HTTP tarball download...`
    );
  }

  // 2. Fallback to direct HTTP tarball download (works on Vercel without git binary)
  try {
    await downloadRepoTarball(parsed.owner, parsed.repo, tmpDir);
    return tmpDir;
  } catch (downloadError) {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(
      `Failed to clone or download repository: ${
        downloadError instanceof Error ? downloadError.message : String(downloadError)
      }`
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
