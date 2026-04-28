"use client";
// ============================================================
// /migrate – Processing page with real-time streaming logs
// ============================================================
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MigrationLog from "@/components/MigrationLog";
import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { MigrateRequest, MigrationResult, LogEvent } from "@/lib/types";
import { MIGRATION_OPTIONS } from "@/lib/types";

export default function MigratePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState<MigrateRequest | null>(null);
  const hasStarted = useRef(false);

  const startMigration = useCallback(async (req: MigrateRequest) => {
    // Add initial log
    setLogs([
      {
        timestamp: new Date().toISOString(),
        step: "init",
        message: `Starting ${req.isDemo ? "demo " : ""}migration...`,
        status: "running",
        progress: 0,
      },
    ]);

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Migration failed");
      }

      const result: MigrationResult = await response.json();

      // Simulate streaming logs for demo mode
      if (req.isDemo) {
        const steps = [
          { step: "clone", message: "Cloning demo repository...", progress: 10 },
          { step: "clone", message: "Repository cloned successfully", progress: 20 },
          { step: "analyze", message: `Scanning ${result.plan.files.length} source files...`, progress: 30 },
          { step: "analyze", message: "Identifying migration patterns...", progress: 40 },
          { step: "codemod", message: "Applying AST transformations...", progress: 50 },
          { step: "ai", message: "Running Groq AI analysis...", progress: 60 },
          { step: "ai", message: "Groq AI generated migration plan", progress: 70 },
          { step: "transform", message: `Transforming ${result.stats.filesChanged} files...`, progress: 80 },
          { step: "diff", message: `Generated diffs: +${result.stats.linesAdded}/-${result.stats.linesRemoved} lines`, progress: 90 },
          { step: "complete", message: "Migration complete!", progress: 100 },
        ];

        for (let i = 0; i < steps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 200));
          const s = steps[i];
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              step: s.step,
              message: s.message,
              status: s.step === "complete" ? "done" : i === steps.length - 1 ? "done" : "running",
              progress: s.progress,
            },
          ]);
        }
      } else {
        // For real migrations, add completion log
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            step: "complete",
            message: `Migration complete! ${result.stats.filesChanged} files changed.`,
            status: "done",
            progress: 100,
          },
        ]);
      }

      setIsComplete(true);

      // Store result and navigate to results page
      sessionStorage.setItem("migrateai-result", JSON.stringify(result));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          step: "error",
          message,
          status: "error",
        },
      ]);
    }
  }, [router]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const stored = sessionStorage.getItem("migrateai-request");
    if (!stored) {
      router.push("/");
      return;
    }

    try {
      const req = JSON.parse(stored) as MigrateRequest;
      setRequest(req);
      startMigration(req);
    } catch {
      router.push("/");
    }
  }, [router, startMigration]);

  const migrationOption = request
    ? MIGRATION_OPTIONS.find((o) => o.id === request.migrationType)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Logo size={32} />
            <span className="text-lg font-bold text-foreground tracking-tight">
              Migrate<span className="text-indigo-400">AI</span>
            </span>
          </button>

          <div className="flex items-center gap-6">
            <ThemeSwitcher />
            {migrationOption && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-lg">{migrationOption.icon}</span>
                <span>{migrationOption.label}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="max-w-3xl w-full mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isComplete
                ? "Migration Complete ✓"
                : error
                ? "Migration Failed"
                : "Migrating..."}
            </h1>
            {request && (
              <p className="text-muted-foreground text-sm">
                {request.isDemo
                  ? "Running demo migration"
                  : request.repoUrl}
                {migrationOption && ` • ${migrationOption.label}`}
              </p>
            )}
          </div>

          {/* Log panel */}
          <div className="h-[500px]">
            <MigrationLog logs={logs} isComplete={isComplete} />
          </div>

          {/* Error state */}
          {error && (
            <div className="mt-6 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-medium
                  hover:bg-white/10 transition-all"
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
