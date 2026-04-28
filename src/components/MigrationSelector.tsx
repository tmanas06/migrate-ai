"use client";
// ============================================================
// MigrationSelector – Dropdown for choosing migration type
// ============================================================
import { MIGRATION_OPTIONS } from "@/lib/types";
import type { MigrationType } from "@/lib/types";

interface MigrationSelectorProps {
  value: MigrationType;
  onChange: (value: MigrationType) => void;
}

export default function MigrationSelector({
  value,
  onChange,
}: MigrationSelectorProps) {
  return (
    <div className="relative">
      <label
        htmlFor="migration-type"
        className="block text-sm font-medium text-gray-400 mb-2"
      >
        Migration Type
      </label>
      <div className="relative group">
        <select
          id="migration-type"
          value={value}
          onChange={(e) => onChange(e.target.value as MigrationType)}
          className="w-full appearance-none bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
            hover:border-white/20 transition-all cursor-pointer"
        >

          {MIGRATION_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Show selected migration info */}
      {value && (
        <div className="mt-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-fadeIn">
          {(() => {
            const opt = MIGRATION_OPTIONS.find((o) => o.id === value);
            if (!opt) return null;
            return (
              <div className="flex items-start gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {opt.from} → {opt.to}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {opt.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Files:{" "}
                    <span className="font-mono text-gray-400">
                      {opt.fileExtensions.join(", ")}
                    </span>
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
