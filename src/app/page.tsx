"use client";
// ============================================================
// Home Page – Hero with migration input
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import MigrationSelector from "@/components/MigrationSelector";
import { MIGRATION_OPTIONS } from "@/lib/types";
import type { MigrationType } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [migrationType, setMigrationType] = useState<MigrationType>("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMigrate = async (isDemo = false) => {

    if (!isDemo && !repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setError("");
    setIsLoading(true);

    // Store the request in sessionStorage and navigate to the processing page
    const request = {
      repoUrl: isDemo ? "https://github.com/demo/sample-project" : repoUrl.trim(),
      migrationType,
      isDemo,
    };
    sessionStorage.setItem("migrateai-request", JSON.stringify(request));
    router.push("/migrate");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070b11]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[128px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[160px] animate-pulse-slow" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Migrate<span className="text-indigo-400">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://dorahacks.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Built for Boring AI Hackathon
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-8">
        <div className="max-w-3xl w-full mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Boring AI Hackathon 2026
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fadeInUp">
            Stop doing{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              boring upgrades.
            </span>
            <br />
            Let AI do them.
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-12 animate-fadeInUp animation-delay-200">
            Paste a GitHub repo, pick a migration type, and watch AI transform
            your codebase in seconds. Beautiful diffs, download patches, and
            auto-generated PR descriptions.
          </p>

          {/* Migration form */}
          <div className="bg-[#0d1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-left animate-fadeInUp animation-delay-400 shadow-2xl shadow-indigo-500/5">
            {/* Repo URL input */}
            <div className="mb-6">
              <label
                htmlFor="repo-url"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                GitHub Repository URL
              </label>
              <input
                id="repo-url"
                type="url"
                placeholder="https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setError("");
                }}
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                  hover:border-white/20 transition-all"
              />
            </div>

            {/* Migration type selector */}
            <div className="mb-6">
              <MigrationSelector
                value={migrationType}
                onChange={(val) => {
                  setMigrationType(val);
                  setError("");
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-fadeIn">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="migrate-button"
                onClick={() => handleMigrate(false)}
                disabled={isLoading}
                className="flex-1 relative group px-6 py-4 rounded-xl font-semibold text-white text-sm
                  bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400
                  shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Migrate Now
                    </>
                  )}
                </span>
              </button>

              <button
                id="demo-button"
                onClick={() => handleMigrate(true)}
                disabled={isLoading}
                className="px-6 py-4 rounded-xl font-semibold text-sm
                  bg-white/5 border border-white/10 text-gray-300
                  hover:bg-white/10 hover:border-white/20 hover:text-white
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-[0.98]"
              >
                ✨ Try Demo
              </button>
            </div>
          </div>

          {/* Supported migrations grid */}
          <div className="mt-16 animate-fadeInUp animation-delay-600">
            <p className="text-sm text-gray-500 mb-6 uppercase tracking-wider font-medium">
              Supported Migrations
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MIGRATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMigrationType(opt.id)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                    ${
                      migrationType === opt.id
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                        : "bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.05] hover:border-white/10 hover:text-gray-200"
                    }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      {opt.from} → {opt.to}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats / social proof */}
          <div className="mt-16 flex items-center justify-center gap-12 text-gray-500 animate-fadeInUp animation-delay-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">6</p>
              <p className="text-xs mt-1">Migration Types</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">AI + AST</p>
              <p className="text-xs mt-1">Dual Engine</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">1-Click</p>
              <p className="text-xs mt-1">PR Ready</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-gray-600 text-xs">
        Built with Groq AI, Next.js & jscodeshift •{" "}
        <a
          href="https://dorahacks.io"
          className="text-indigo-400/60 hover:text-indigo-400 transition-colors"
        >
          Boring AI Hackathon 2026
        </a>
      </footer>
    </div>
  );
}
