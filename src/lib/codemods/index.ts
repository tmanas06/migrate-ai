// ============================================================
// Codemod index – route to the right transform
// ============================================================
import type { FileChange, MigrationType } from "../types";
import { applyReact17to19 } from "./react-17-to-19";
import { applyJestToVitest } from "./jest-to-vitest";
import { applyCjsToEsm } from "./cjs-to-esm";
import { applyPython2to3 } from "./python-2-to-3";
import { applyRestToTrpc } from "./rest-to-trpc";
import { applyTailwind3to4 } from "./tailwind-3-to-4";

/**
 * Apply the local codemods for a given migration type.
 * Returns file changes that were possible via local AST/regex transforms.
 * Claude handles the rest with AI-powered analysis.
 */
export function applyCodemods(
  files: { path: string; content: string }[],
  migrationType: MigrationType
): FileChange[] {
  switch (migrationType) {
    case "react-17-to-19":
      return applyReact17to19(files);
    case "jest-to-vitest":
      return applyJestToVitest(files);
    case "cjs-to-esm":
      return applyCjsToEsm(files);
    case "python-2-to-3":
      return applyPython2to3(files);
    case "rest-to-trpc":
      return applyRestToTrpc(files);
    case "tailwind-3-to-4":
      return applyTailwind3to4(files);
    default:
      return [];
  }
}
