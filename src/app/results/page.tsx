"use client";
// ============================================================
// /results – Diff viewer + PR description + download
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DiffViewer from "@/components/DiffViewer";
import Logo from "@/components/Logo";
import { MIGRATION_OPTIONS } from "@/lib/types";
import type { MigrationResult } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [prDescription, setPrDescription] = useState("");
  const [isPrLoading, setIsPrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "pr" | "patch">("diff");

  useEffect(() => {
    const stored = sessionStorage.getItem("migrateai-result");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const data = JSON.parse(stored) as MigrationResult;
      setResult(data);
      if (data.prDescription) {
        setPrDescription(data.prDescription);
      }
    } catch {
      router.push("/");
    }
  }, [router]);

  const generatePR = useCallback(async () => {
    if (!result) return;
    setIsPrLoading(true);
    try {
      const res = await fetch("/api/generate-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          migrationType: result.migrationType,
          summary: result.plan.summary,
          filesChanged: result.stats.filesChanged,
          linesAdded: result.stats.linesAdded,
          linesRemoved: result.stats.linesRemoved,
          breakingChanges: result.plan.breakingChanges,
        }),
      });
      const data = await res.json();
      if (data.prDescription) {
        setPrDescription(data.prDescription);
      } else if (data.error) {
        setPrDescription(`Error: ${data.error}\n\n${data.details || ""}`);
      }
    } catch (err) {
      setPrDescription(
        `Failed to generate PR description: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsPrLoading(false);
    }
  }, [result]);

  const downloadPatch = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result.patchContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration-${result.migrationType}-${Date.now()}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  const copyPR = useCallback(async () => {
    await navigator.clipboard.writeText(prDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prDescription]);

  if (!result) {
    return (
      <div className="min-h-screen bg-[#070b11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const migrationOption = MIGRATION_OPTIONS.find(
    (o) => o.id === result.migrationType
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <Logo size={32} />
            <span className="text-lg font-bold text-foreground tracking-tight">
              Migrate<span className="text-indigo-400">AI</span>
            </span>
          </button>

          <div className="flex items-center gap-6">
            <ThemeSwitcher />
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-sm
                hover:bg-white/10 hover:text-foreground transition-all"
            >
              ← New Migration
            </button>
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <div className="px-8 py-6 border-b border-white/5 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            {migrationOption && (
              <>
                <span className="text-2xl">{migrationOption.icon}</span>
                <h1 className="text-xl font-bold text-foreground">
                  {migrationOption.label} Migration Results
                </h1>
              </>
            )}
            <RiskBadge risk={result.plan.estimatedRisk} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Files changed */}
            <StatCard
              label="Files Changed"
              value={result.stats.filesChanged.toString()}
              icon="📁"
              color="indigo"
            />
            {/* Lines added */}
            <StatCard
              label="Lines Added"
              value={`+${result.stats.linesAdded}`}
              icon="➕"
              color="green"
            />
            {/* Lines removed */}
            <StatCard
              label="Lines Removed"
              value={`-${result.stats.linesRemoved}`}
              icon="➖"
              color="red"
            />
            {/* Risk */}
            <StatCard
              label="Estimated Risk"
              value={result.plan.estimatedRisk.charAt(0).toUpperCase() + result.plan.estimatedRisk.slice(1)}
              icon={result.plan.estimatedRisk === "low" ? "🟢" : result.plan.estimatedRisk === "medium" ? "🟡" : "🔴"}
              color="yellow"
            />
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <p className="text-sm text-gray-300">{result.plan.summary}</p>
          </div>

          {/* Breaking changes */}
          {result.plan.breakingChanges.length > 0 && (
            <div className="mt-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-medium text-amber-400 mb-2 uppercase tracking-wider">
                ⚠️ Breaking Changes
              </p>
              <ul className="space-y-1">
                {result.plan.breakingChanges.map((change, i) => (
                  <li key={i} className="text-sm text-amber-200/80 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-white/5 shrink-0">
        <div className="max-w-7xl mx-auto flex gap-1">
          <TabButton
            active={activeTab === "diff"}
            onClick={() => setActiveTab("diff")}
            label="Diff Viewer"
            icon="📝"
          />
          <TabButton
            active={activeTab === "pr"}
            onClick={() => setActiveTab("pr")}
            label="PR Description"
            icon="📋"
          />
          <TabButton
            active={activeTab === "patch"}
            onClick={() => setActiveTab("patch")}
            label="Patch File"
            icon="📎"
          />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "diff" && (
          <div className="h-[calc(100vh-420px)] min-h-[400px]">
            <DiffViewer files={result.plan.files} />
          </div>
        )}

        {activeTab === "pr" && (
          <div className="max-w-4xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                PR Description
              </h2>
              <div className="flex items-center gap-2">
                {!prDescription && (
                  <button
                    onClick={generatePR}
                    disabled={isPrLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm
                      hover:bg-indigo-500/30 transition-all disabled:opacity-50"
                  >
                    {isPrLoading ? "Generating with Claude..." : "🤖 Generate with AI"}
                  </button>
                )}
                {prDescription && (
                  <button
                    onClick={copyPR}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm
                      hover:bg-white/10 transition-all"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                )}
              </div>
            </div>

            {prDescription ? (
              <div className="bg-[#0d1117] border border-white/10 rounded-xl p-6 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {prDescription}
              </div>
            ) : (
              <div className="bg-[#0d1117] border border-white/10 rounded-xl p-12 text-center text-gray-500">
                <p className="text-4xl mb-4">📋</p>
                <p className="text-sm">
                  Click &ldquo;Generate with AI&rdquo; to create a professional PR description, or it
                  was included automatically with your migration results.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "patch" && (
          <div className="max-w-4xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Patch File</h2>
              <button
                onClick={downloadPatch}
                className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm
                  hover:bg-green-500/30 transition-all flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download .patch
              </button>
            </div>

            <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 bg-[#161b22] text-xs text-gray-400 font-mono">
                migration-{result.migrationType}.patch
              </div>
              <div className="p-4 font-mono text-xs text-gray-400 max-h-[500px] overflow-auto leading-5">
                <pre className="whitespace-pre-wrap">{result.patchContent || "No changes in patch."}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const borderColors: Record<string, string> = {
    indigo: "border-indigo-500/20",
    green: "border-green-500/20",
    red: "border-red-500/20",
    yellow: "border-yellow-500/20",
  };
  const bgColors: Record<string, string> = {
    indigo: "bg-indigo-500/5",
    green: "bg-green-500/5",
    red: "bg-red-500/5",
    yellow: "bg-yellow-500/5",
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl border ${borderColors[color] || "border-white/10"} ${bgColors[color] || "bg-white/5"}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground font-mono">{value}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    low: "bg-green-500/10 text-green-400 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border ${styles[risk] || styles.medium}`}
    >
      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
    </span>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
        active
          ? "border-indigo-400 text-foreground"
          : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"
      }`}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </button>
  );
}
