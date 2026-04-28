"use client";
// ============================================================
// MigrationLog – Animated terminal-style log output
// ============================================================
import { useEffect, useRef } from "react";
import type { LogEvent } from "@/lib/types";

interface MigrationLogProps {
  logs: LogEvent[];
  isComplete: boolean;
}

export default function MigrationLog({ logs, isComplete }: MigrationLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Calculate overall progress
  const progress = logs.length > 0 ? logs[logs.length - 1].progress ?? 0 : 0;

  return (
    <div className="flex flex-col h-full bg-[#0a0e14] rounded-xl border border-white/10 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111820] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-3 text-xs text-gray-400 font-mono">
            migrateai — migration process
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs text-indigo-400 font-mono">Running</span>
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-400 font-mono">Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Log output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 scrollbar-thin"
      >
        {logs.map((log, i) => (
          <LogLine key={i} log={log} isLatest={i === logs.length - 1 && !isComplete} />
        ))}

        {/* Cursor blink */}
        {!isComplete && (
          <div className="flex items-center mt-2">
            <span className="text-indigo-400 mr-2">❯</span>
            <span className="w-2 h-4 bg-indigo-400 animate-blink" />
          </div>
        )}

        {isComplete && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300 ml-2">
              Migration completed successfully
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LogLine({ log, isLatest }: { log: LogEvent; isLatest: boolean }) {
  const statusIcon = getStatusIcon(log.status);
  const statusColor = getStatusColor(log.status);
  const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={`flex items-start gap-2 py-0.5 animate-fadeIn ${
        isLatest ? "text-white" : "text-gray-400"
      }`}
    >
      <span className="text-gray-600 text-xs shrink-0 mt-0.5 w-16">
        {time}
      </span>
      <span className={`shrink-0 mt-0.5 ${statusColor}`}>{statusIcon}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${getStepBg(
          log.step
        )}`}
      >
        {log.step}
      </span>
      <span className="text-gray-300 text-sm">{log.message}</span>
      {log.progress !== undefined && (
        <span className="ml-auto text-xs text-gray-500 shrink-0">
          {log.progress}%
        </span>
      )}
    </div>
  );
}

function getStatusIcon(status: LogEvent["status"]): string {
  switch (status) {
    case "running":
      return "◌";
    case "done":
      return "✓";
    case "error":
      return "✗";
  }
}

function getStatusColor(status: LogEvent["status"]): string {
  switch (status) {
    case "running":
      return "text-indigo-400";
    case "done":
      return "text-green-400";
    case "error":
      return "text-red-400";
  }
}

function getStepBg(step: string): string {
  const colors: Record<string, string> = {
    init: "bg-gray-500/20 text-gray-300",
    clone: "bg-blue-500/20 text-blue-300",
    read: "bg-cyan-500/20 text-cyan-300",
    analyze: "bg-purple-500/20 text-purple-300",
    codemod: "bg-yellow-500/20 text-yellow-300",
    transform: "bg-yellow-500/20 text-yellow-300",
    ai: "bg-indigo-500/20 text-indigo-300",
    diff: "bg-teal-500/20 text-teal-300",
    finalize: "bg-green-500/20 text-green-300",
    complete: "bg-green-500/20 text-green-300",
    fallback: "bg-orange-500/20 text-orange-300",
    error: "bg-red-500/20 text-red-300",
  };
  return colors[step] || "bg-gray-500/20 text-gray-300";
}
