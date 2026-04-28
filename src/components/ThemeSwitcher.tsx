"use client";
// ============================================================
// ThemeSwitcher – Buttons to select UI color palette
// ============================================================
import { useTheme } from "./ThemeProvider";
import type { ThemeType } from "./ThemeProvider";

const THEMES: { id: ThemeType; label: string; color: string }[] = [
  { id: "midnight", label: "Midnight", color: "bg-[#0f172a]" },
  { id: "emerald", label: "Emerald", color: "bg-[#052e16]" },
  { id: "bordeaux", label: "Bordeaux", color: "bg-[#2d0a0a]" },
  { id: "ivory", label: "Ivory", color: "bg-[#fdfcf0]" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`group relative w-7 h-7 rounded-full ${t.color} border-2 transition-all hover:scale-110 active:scale-95
            ${theme === t.id ? "border-indigo-500 scale-110" : "border-white/20"}
          `}
          title={`${t.label} Theme`}
        >
          {theme === t.id && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            </div>
          )}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}
