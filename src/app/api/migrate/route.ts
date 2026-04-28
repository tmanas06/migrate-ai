// ============================================================
// POST /api/migrate – Main migration endpoint
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { cloneRepo, cleanupRepo, isValidGitHubUrl } from "@/lib/git";
import { readRepoFiles } from "@/lib/files";
import { analyzeMigration, autoDetectMigration } from "@/lib/ai";
import { applyCodemods } from "@/lib/codemods";
import { generateUnifiedDiff, generatePatchContent, calculateDiffStats } from "@/lib/diff";
import { generateDemoResult } from "@/lib/demo";
import { pushLog } from "@/lib/log-store";
import { MIGRATION_OPTIONS } from "@/lib/types";
import type { MigrateRequest, MigrationType, FileChange, MigrationResult, ApiError } from "@/lib/types";

export const maxDuration = 60; // Vercel function timeout

export async function POST(request: NextRequest) {
  let repoPath: string | null = null;

  try {
    const body = (await request.json()) as MigrateRequest;
    const { repoUrl, migrationType, isDemo } = body;

    // Validate migration type
    const validTypes = MIGRATION_OPTIONS.map((o) => o.id);
    if (!validTypes.includes(migrationType)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid migration type", details: `Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const migrationId = uuidv4();

    // ──────────────────────────────────────
    // Demo mode – return hardcoded results
    // ──────────────────────────────────────
    if (isDemo) {
      pushLog(migrationId, "init", "Starting demo migration...", "running", 0);
      await delay(300);
      pushLog(migrationId, "clone", "Loading demo repository...", "running", 10);
      await delay(300);
      pushLog(migrationId, "clone", "Demo repository loaded", "done", 20);
      pushLog(migrationId, "analyze", "Analyzing demo files...", "running", 30);
      await delay(300);
      pushLog(migrationId, "analyze", "File analysis complete", "done", 50);
      pushLog(migrationId, "transform", "Applying codemods...", "running", 60);
      await delay(300);
      pushLog(migrationId, "transform", "Codemods applied successfully", "done", 80);
      pushLog(migrationId, "diff", "Generating diffs...", "running", 90);
      await delay(200);

      const result = generateDemoResult(migrationType);
      result.id = migrationId;

      pushLog(migrationId, "complete", "Migration complete!", "done", 100);

      return NextResponse.json(result);
    }

    // ──────────────────────────────────────
    // Real migration
    // ──────────────────────────────────────

    // Validate repo URL
    if (!repoUrl || !isValidGitHubUrl(repoUrl)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid GitHub URL", details: "Please provide a valid public GitHub repository URL" },
        { status: 400 }
      );
    }

    // Step 1: Clone repo
    pushLog(migrationId, "clone", `Cloning ${repoUrl}...`, "running", 5);

    try {
      repoPath = await cloneRepo(repoUrl);
    } catch (error) {
      pushLog(migrationId, "clone", `Failed to clone: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      return NextResponse.json<ApiError>(
        { error: "Failed to clone repository", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 400 }
      );
    }

    pushLog(migrationId, "clone", "Repository cloned successfully", "done", 15);

    // Step 2: Read relevant files
    pushLog(migrationId, "read", "Reading source files...", "running", 20);

    // If auto-detecting, we need to read a broad set of files first
    const detectionExtensions = ["js", "jsx", "ts", "tsx", "py", "json"];
    const initialFiles = await readRepoFiles(repoPath, migrationType === "auto" ? detectionExtensions : (MIGRATION_OPTIONS.find(o => o.id === migrationType)?.fileExtensions || ["*"]));

    if (initialFiles.length === 0) {
      pushLog(migrationId, "read", "No relevant files found in repository", "error");
      await cleanupRepo(repoPath);
      return NextResponse.json<ApiError>(
        { error: "No relevant files found", details: "The repository appears to be empty or contains no supported code files." },
        { status: 400 }
      );
    }

    pushLog(migrationId, "read", `Found ${initialFiles.length} relevant files`, "done", 30);

    // Step 2.5: Handle auto-detection
    let finalMigrationType = migrationType;
    let sourceFiles = initialFiles;

    if (migrationType === "auto") {
      pushLog(migrationId, "analyze", "Auto-detecting best migration type...", "running", 32);
      finalMigrationType = await autoDetectMigration(initialFiles);
      const detectedOption = MIGRATION_OPTIONS.find((o) => o.id === finalMigrationType)!;
      pushLog(
        migrationId,
        "analyze",
        `Detected migration: ${detectedOption.label}`,
        "done",
        35
      );
      
      // Filter source files based on the detected migration type for efficiency
      sourceFiles = initialFiles.filter(f => 
        detectedOption.fileExtensions.includes("*") || 
        detectedOption.fileExtensions.some(ext => f.path.endsWith(`.${ext}`)) ||
        f.path === "package.json" ||
        f.path === "tailwind.config.js" ||
        f.path === "jest.config.js"
      );
    }

    // Step 3: Apply local codemods first
    pushLog(migrationId, "codemod", "Applying local codemods...", "running", 38);

    let fileChanges: FileChange[];

    try {
      fileChanges = applyCodemods(sourceFiles, finalMigrationType);
      pushLog(
        migrationId,
        "codemod",
        `Local codemods applied: ${fileChanges.length} files modified`,
        "done",
        45
      );
    } catch (error) {
      pushLog(migrationId, "codemod", "Local codemods failed, falling back to AI-only analysis", "error");
      fileChanges = [];
    }

    // Step 4: Send to AI for deep analysis
    pushLog(migrationId, "ai", "Running AI structural analysis...", "running", 50);

    try {
      const aiPlan = await analyzeMigration(sourceFiles, finalMigrationType);

      // Merge AI changes with codemod changes (AI takes priority for overlapping files)
      const codemodPaths = new Set(fileChanges.map((f) => f.path));
      const aiOnlyChanges = aiPlan.files.filter((f) => !codemodPaths.has(f.path));
      fileChanges = [...fileChanges, ...aiOnlyChanges];

      pushLog(migrationId, "ai", `AI analysis complete: ${aiPlan.files.length} files analyzed`, "done", 75);

      // Step 5: Generate diffs
      pushLog(migrationId, "diff", "Generating diffs and patch file...", "running", 80);

      const unifiedDiff = generateUnifiedDiff(fileChanges);
      const patchContent = generatePatchContent(fileChanges);
      const stats = calculateDiffStats(fileChanges);

      pushLog(migrationId, "diff", `Diffs generated: ${stats.filesChanged} files, +${stats.linesAdded}/-${stats.linesRemoved} lines`, "done", 90);

      // Step 6: Build result
      pushLog(migrationId, "finalize", "Building migration result...", "running", 95);

      const result: MigrationResult = {
        id: migrationId,
        migrationType: finalMigrationType,
        repoUrl,
        plan: {
          files: fileChanges,
          summary: aiPlan.summary,
          breakingChanges: aiPlan.breakingChanges,
          estimatedRisk: aiPlan.estimatedRisk,
        },
        unifiedDiff,
        patchContent,
        stats,
        completedAt: new Date().toISOString(),
      };

      pushLog(migrationId, "complete", "Migration complete!", "done", 100);

      // Cleanup
      await cleanupRepo(repoPath);

      return NextResponse.json(result);
    } catch (error) {
      pushLog(migrationId, "ai", `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");

      // If we have codemod-only results, return those
      if (fileChanges.length > 0) {
        pushLog(migrationId, "fallback", "Using codemod-only results...", "running", 80);

        const unifiedDiff = generateUnifiedDiff(fileChanges);
        const patchContent = generatePatchContent(fileChanges);
        const stats = calculateDiffStats(fileChanges);

        const result: MigrationResult = {
          id: migrationId,
          migrationType: finalMigrationType,
          repoUrl,
          plan: {
            files: fileChanges,
            summary: `Migration applied using local codemods (AI analysis unavailable). ${fileChanges.length} files modified.`,
            breakingChanges: ["AI analysis was unavailable – manual review strongly recommended"],
            estimatedRisk: "medium",
          },
          unifiedDiff,
          patchContent,
          stats,
          completedAt: new Date().toISOString(),
        };

        pushLog(migrationId, "complete", "Migration complete (codemod-only mode)", "done", 100);
        await cleanupRepo(repoPath);
        return NextResponse.json(result);
      }

      await cleanupRepo(repoPath);
      return NextResponse.json<ApiError>(
        {
          error: "Migration failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (repoPath) {
      await cleanupRepo(repoPath);
    }
    return NextResponse.json<ApiError>(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
