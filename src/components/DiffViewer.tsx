"use client";
// ============================================================
// DiffViewer – Beautiful side-by-side diff viewer
// ============================================================
import { useState, useMemo } from "react";
import type { FileChange } from "@/lib/types";

interface DiffViewerProps {
  files: FileChange[];
}

export default function DiffViewer({ files }: DiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState(0);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const changedFiles = useMemo(
    () => files.filter((f) => f.originalContent !== f.migratedContent),
    [files]
  );

  if (changedFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No file changes to display</p>
      </div>
    );
  }

  const currentFile = changedFiles[selectedFile];
  const originalLines = currentFile.originalContent.split("\n");
  const migratedLines = currentFile.migratedContent.split("\n");

  return (
    <div className="flex flex-col h-full">
      {/* File tabs + view mode toggle */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1117] px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {changedFiles.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(idx)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-all ${
                idx === selectedFile
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {file.path.split("/").pop()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-4 shrink-0">
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              viewMode === "split"
                ? "bg-indigo-500/20 text-indigo-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode("unified")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              viewMode === "unified"
                ? "bg-indigo-500/20 text-indigo-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Unified
          </button>
        </div>
      </div>

      {/* File path bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-white/5">
        <span className="text-xs font-mono text-gray-300">
          {currentFile.path}
        </span>
        <span className="text-xs text-gray-500">—</span>
        <span className="text-xs text-gray-400">
          {currentFile.changeDescription}
        </span>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto bg-[#0d1117]">
        {viewMode === "split" ? (
          <SplitView original={originalLines} migrated={migratedLines} />
        ) : (
          <UnifiedView original={originalLines} migrated={migratedLines} />
        )}
      </div>
    </div>
  );
}

// ─── Split View ──────────────────────────────────────────

function SplitView({
  original,
  migrated,
}: {
  original: string[];
  migrated: string[];
}) {
  const maxLines = Math.max(original.length, migrated.length);

  return (
    <div className="flex">
      {/* Original */}
      <div className="flex-1 border-r border-white/5">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-red-400/60 bg-red-500/5 border-b border-white/5 font-semibold">
          Original
        </div>
        <div className="font-mono text-[13px] leading-6">
          {Array.from({ length: maxLines }, (_, i) => {
            const line = original[i] ?? "";
            const isRemoved = i < original.length && (i >= migrated.length || original[i] !== migrated[i]);

            return (
              <div
                key={`orig-${i}`}
                className={`flex ${
                  isRemoved
                    ? "bg-red-500/10 border-l-2 border-red-500/40"
                    : ""
                }`}
              >
                <span className="w-12 shrink-0 text-right pr-3 text-gray-600 select-none text-xs leading-6">
                  {i < original.length ? i + 1 : ""}
                </span>
                <pre className="flex-1 px-2 overflow-hidden">
                  <code className={isRemoved ? "text-red-300" : "text-gray-300"}>
                    {line || " "}
                  </code>
                </pre>
              </div>
            );
          })}
        </div>
      </div>

      {/* Migrated */}
      <div className="flex-1">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-green-400/60 bg-green-500/5 border-b border-white/5 font-semibold">
          Migrated
        </div>
        <div className="font-mono text-[13px] leading-6">
          {Array.from({ length: maxLines }, (_, i) => {
            const line = migrated[i] ?? "";
            const isAdded = i < migrated.length && (i >= original.length || original[i] !== migrated[i]);

            return (
              <div
                key={`migr-${i}`}
                className={`flex ${
                  isAdded
                    ? "bg-green-500/10 border-l-2 border-green-500/40"
                    : ""
                }`}
              >
                <span className="w-12 shrink-0 text-right pr-3 text-gray-600 select-none text-xs leading-6">
                  {i < migrated.length ? i + 1 : ""}
                </span>
                <pre className="flex-1 px-2 overflow-hidden">
                  <code className={isAdded ? "text-green-300" : "text-gray-300"}>
                    {line || " "}
                  </code>
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Unified View ────────────────────────────────────────

function UnifiedView({
  original,
  migrated,
}: {
  original: string[];
  migrated: string[];
}) {
  // Build a simple unified diff display
  const lines: { type: "context" | "removed" | "added"; content: string; lineNum: number }[] =
    [];

  const maxLen = Math.max(original.length, migrated.length);

  // Simple line-by-line comparison
  for (let i = 0; i < maxLen; i++) {
    const origLine = original[i];
    const migrLine = migrated[i];

    if (origLine === migrLine) {
      if (origLine !== undefined) {
        lines.push({ type: "context", content: origLine, lineNum: i + 1 });
      }
    } else {
      if (origLine !== undefined) {
        lines.push({ type: "removed", content: origLine, lineNum: i + 1 });
      }
      if (migrLine !== undefined) {
        lines.push({ type: "added", content: migrLine, lineNum: i + 1 });
      }
    }
  }

  return (
    <div className="font-mono text-[13px] leading-6">
      {lines.map((line, i) => {
        const bgClass =
          line.type === "removed"
            ? "bg-red-500/10"
            : line.type === "added"
            ? "bg-green-500/10"
            : "";
        const textClass =
          line.type === "removed"
            ? "text-red-300"
            : line.type === "added"
            ? "text-green-300"
            : "text-gray-300";
        const prefix =
          line.type === "removed" ? "-" : line.type === "added" ? "+" : " ";
        const borderClass =
          line.type === "removed"
            ? "border-l-2 border-red-500/40"
            : line.type === "added"
            ? "border-l-2 border-green-500/40"
            : "";

        return (
          <div key={i} className={`flex ${bgClass} ${borderClass}`}>
            <span className="w-8 shrink-0 text-center text-gray-600 select-none text-xs">
              {prefix}
            </span>
            <span className="w-12 shrink-0 text-right pr-3 text-gray-600 select-none text-xs leading-6">
              {line.lineNum}
            </span>
            <pre className="flex-1 px-2 overflow-hidden">
              <code className={textClass}>{line.content || " "}</code>
            </pre>
          </div>
        );
      })}
    </div>
  );
}
