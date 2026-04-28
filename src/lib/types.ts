// ============================================================
// MigrateAI – Shared Types
// ============================================================

/** Supported migration types */
export type MigrationType =
  | "auto"
  | "react-17-to-19"
  | "jest-to-vitest"
  | "cjs-to-esm"
  | "python-2-to-3"
  | "rest-to-trpc"
  | "tailwind-3-to-4";

/** Human-readable labels & descriptions for each migration type */
export interface MigrationOption {
  id: MigrationType;
  label: string;
  from: string;
  to: string;
  description: string;
  icon: string;
  fileExtensions: string[];
}

/** Request body for POST /api/migrate */
export interface MigrateRequest {
  repoUrl: string;
  migrationType: MigrationType;
  isDemo?: boolean;
}

/** A single file change produced by the migration */
export interface FileChange {
  path: string;
  originalContent: string;
  migratedContent: string;
  changeDescription: string;
}

/** Response from Claude's migration analysis */
export interface MigrationPlan {
  files: FileChange[];
  summary: string;
  breakingChanges: string[];
  estimatedRisk: "low" | "medium" | "high";
}

/** Overall migration result returned by the API */
export interface MigrationResult {
  id: string;
  migrationType: MigrationType;
  repoUrl: string;
  plan: MigrationPlan;
  unifiedDiff: string;
  patchContent: string;
  stats: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  prDescription?: string;
  completedAt: string;
}

/** SSE log event streamed to the frontend */
export interface LogEvent {
  timestamp: string;
  step: string;
  message: string;
  status: "running" | "done" | "error";
  progress?: number; // 0-100
}

/** API error shape */
export interface ApiError {
  error: string;
  details?: string;
}

// ============================================================
// Migration options catalog
// ============================================================

export const MIGRATION_OPTIONS: MigrationOption[] = [
  {
    id: "auto",
    label: "Auto-Detect",
    from: "Unknown",
    to: "Modern",
    description:
      "Automatically analyze your codebase to identify the best migration path.",
    icon: "🔍",
    fileExtensions: ["*"],
  },
  {
    id: "react-17-to-19",
    label: "React 17 → 19",
    from: "React 17",
    to: "React 19",
    description:
      "Upgrade to React 19 with automatic JSX runtime, new hooks, and Server Components support.",
    icon: "⚛️",
    fileExtensions: [".tsx", ".jsx", ".ts", ".js"],
  },
  {
    id: "jest-to-vitest",
    label: "Jest → Vitest",
    from: "Jest",
    to: "Vitest",
    description:
      "Migrate test suites from Jest to Vitest with native ESM support and faster execution.",
    icon: "🧪",
    fileExtensions: [".test.ts", ".test.tsx", ".test.js", ".spec.ts", ".spec.tsx", ".spec.js"],
  },
  {
    id: "cjs-to-esm",
    label: "CommonJS → ESM",
    from: "CommonJS",
    to: "ES Modules",
    description:
      "Convert require/module.exports to import/export syntax for modern JavaScript.",
    icon: "📦",
    fileExtensions: [".js", ".cjs", ".ts"],
  },
  {
    id: "python-2-to-3",
    label: "Python 2 → 3",
    from: "Python 2",
    to: "Python 3",
    description:
      "Modernize Python 2 code to Python 3 with print functions, unicode strings, and more.",
    icon: "🐍",
    fileExtensions: [".py"],
  },
  {
    id: "rest-to-trpc",
    label: "REST → tRPC",
    from: "REST API",
    to: "tRPC",
    description:
      "Transform REST API routes into type-safe tRPC procedures with end-to-end typing.",
    icon: "🔗",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  {
    id: "tailwind-3-to-4",
    label: "Tailwind v3 → v4",
    from: "Tailwind CSS v3",
    to: "Tailwind CSS v4",
    description:
      "Upgrade Tailwind CSS from v3 to v4 with new utility classes and configuration format.",
    icon: "🎨",
    fileExtensions: [".tsx", ".jsx", ".html", ".css", ".ts", ".js"],
  },
];
