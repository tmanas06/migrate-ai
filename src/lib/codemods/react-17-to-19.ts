// ============================================================
// Codemod: React 17 → 19
// ============================================================
import type { FileChange } from "../types";

/**
 * Apply React 17 → 19 transforms to files.
 * Handles: automatic JSX runtime, deprecated APIs, new hook patterns,
 * ref forwarding changes, etc.
 */
export function applyReact17to19(
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    let migrated = file.content;
    const descriptions: string[] = [];

    // 1. Remove `import React from 'react'` when only used for JSX
    //    (React 19 uses automatic JSX transform)
    if (/import\s+React\s+from\s+['"]react['"]/.test(migrated)) {
      // Check if React is used directly (not just for JSX)
      const hasReactUsage =
        /React\.(createElement|Fragment|memo|forwardRef|lazy|Suspense|useEffect|useState|useRef|useCallback|useMemo|useContext|useReducer|useLayoutEffect|useImperativeHandle|useDebugValue|Children|cloneElement|isValidElement|createContext|createRef)/.test(
          migrated
        );

      if (!hasReactUsage) {
        migrated = migrated.replace(
          /import\s+React\s+from\s+['"]react['"];?\n?/g,
          ""
        );
        descriptions.push("Removed unused React import (automatic JSX runtime)");
      }
    }

    // 2. Replace `React.FC` with direct function type annotations
    if (/React\.FC/.test(migrated)) {
      migrated = migrated.replace(/:\s*React\.FC<([^>]+)>/g, "(props: $1)");
      migrated = migrated.replace(/:\s*React\.FC\b/g, "()");
      descriptions.push("Replaced React.FC with explicit prop types");
    }

    // 3. Update forwardRef patterns (React 19 passes ref as a prop)
    if (/React\.forwardRef/.test(migrated) || /forwardRef/.test(migrated)) {
      migrated = migrated.replace(
        /(?:React\.)?forwardRef\s*<([^,>]+),?\s*([^>]*)>\s*\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*{/g,
        "function Component({ ...$3, ref: $4 }: $1 & { ref?: React.Ref<$2> }) {"
      );
      descriptions.push("Updated forwardRef to ref-as-prop pattern (React 19)");
    }

    // 4. Update deprecated lifecycle methods
    if (/componentWillMount|componentWillReceiveProps|componentWillUpdate/.test(migrated)) {
      migrated = migrated
        .replace(/componentWillMount/g, "UNSAFE_componentWillMount")
        .replace(/componentWillReceiveProps/g, "UNSAFE_componentWillReceiveProps")
        .replace(/componentWillUpdate/g, "UNSAFE_componentWillUpdate");
      descriptions.push("Prefixed deprecated lifecycle methods with UNSAFE_");
    }

    // 5. Add `use` hook imports where applicable
    if (/useContext\(/.test(migrated) && !/import.*\buse\b.*from\s+['"]react['"]/.test(migrated)) {
      // Suggest use() hook as a replacement comment
      migrated = migrated.replace(
        /(useContext\([^)]+\))/g,
        "$1 /* Consider using use() hook in React 19 */"
      );
      descriptions.push("Added React 19 use() hook migration hints");
    }

    if (migrated !== file.content) {
      changes.push({
        path: file.path,
        originalContent: file.content,
        migratedContent: migrated,
        changeDescription: descriptions.join("; "),
      });
    }
  }

  return changes;
}
