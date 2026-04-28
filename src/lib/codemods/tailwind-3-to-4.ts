// ============================================================
// Codemod: Tailwind v3 → v4
// ============================================================
import type { FileChange } from "../types";

/**
 * Apply Tailwind CSS v3 → v4 transforms.
 * Handles: updated class names, new configuration format,
 * deprecated utilities, etc.
 */
export function applyTailwind3to4(
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    let migrated = file.content;
    const descriptions: string[] = [];

    // 1. Update deprecated background opacity classes
    //    `bg-red-500/50` style is fine, but `bg-opacity-50` is deprecated
    if (/bg-opacity-(\d+)/.test(migrated)) {
      migrated = migrated.replace(
        /bg-(\w+-\d+)\s+bg-opacity-(\d+)/g,
        (_, color: string, opacity: string) => {
          descriptions.push("Replaced bg-opacity with slash notation");
          return `bg-${color}/${opacity}`;
        }
      );
    }

    // 2. Update text opacity
    if (/text-opacity-(\d+)/.test(migrated)) {
      migrated = migrated.replace(
        /text-(\w+-\d+)\s+text-opacity-(\d+)/g,
        (_, color: string, opacity: string) => {
          descriptions.push("Replaced text-opacity with slash notation");
          return `text-${color}/${opacity}`;
        }
      );
    }

    // 3. Update border opacity
    if (/border-opacity-(\d+)/.test(migrated)) {
      migrated = migrated.replace(
        /border-(\w+-\d+)\s+border-opacity-(\d+)/g,
        (_, color: string, opacity: string) => {
          descriptions.push("Replaced border-opacity with slash notation");
          return `border-${color}/${opacity}`;
        }
      );
    }

    // 4. Replace `decoration-slice` with `box-decoration-slice`
    if (/\bdecoration-slice\b/.test(migrated)) {
      migrated = migrated.replace(/\bdecoration-slice\b/g, "box-decoration-slice");
      descriptions.push("Updated decoration-slice to box-decoration-slice");
    }
    if (/\bdecoration-clone\b/.test(migrated)) {
      migrated = migrated.replace(/\bdecoration-clone\b/g, "box-decoration-clone");
      descriptions.push("Updated decoration-clone to box-decoration-clone");
    }

    // 5. Replace `flex-grow` / `flex-shrink` shorthand
    if (/\bgrow-0\b/.test(migrated)) {
      migrated = migrated.replace(/\bgrow-0\b/g, "grow-0");
    }
    if (/\bflex-grow-0\b/.test(migrated)) {
      migrated = migrated.replace(/\bflex-grow-0\b/g, "grow-0");
      descriptions.push("Simplified flex-grow-0 to grow-0");
    }
    if (/\bflex-grow\b(?!-)/.test(migrated)) {
      migrated = migrated.replace(/\bflex-grow\b(?!-)/g, "grow");
      descriptions.push("Simplified flex-grow to grow");
    }
    if (/\bflex-shrink-0\b/.test(migrated)) {
      migrated = migrated.replace(/\bflex-shrink-0\b/g, "shrink-0");
      descriptions.push("Simplified flex-shrink-0 to shrink-0");
    }
    if (/\bflex-shrink\b(?!-)/.test(migrated)) {
      migrated = migrated.replace(/\bflex-shrink\b(?!-)/g, "shrink");
      descriptions.push("Simplified flex-shrink to shrink");
    }

    // 6. Update tailwind.config.js → CSS-based config
    if (file.path.includes("tailwind.config")) {
      migrated = `/* Tailwind CSS v4 – CSS-based configuration
 * Move your theme customizations into your main CSS file using @theme.
 * See: https://tailwindcss.com/docs/v4-beta#css-first-configuration
 */

@import "tailwindcss";

@theme {
  /* Add your custom theme values here */
  /* --color-primary: #7c6af7; */
  /* --font-sans: 'Inter', sans-serif; */
}
`;
      descriptions.push("Converted JS-based config to CSS-based @theme configuration");
    }

    // 7. Replace `overflow-ellipsis` with `text-ellipsis`
    if (/\boverflow-ellipsis\b/.test(migrated)) {
      migrated = migrated.replace(/\boverflow-ellipsis\b/g, "text-ellipsis");
      descriptions.push("Replaced overflow-ellipsis with text-ellipsis");
    }

    if (migrated !== file.content) {
      changes.push({
        path: file.path,
        originalContent: file.content,
        migratedContent: migrated,
        changeDescription:
          descriptions.length > 0
            ? descriptions.join("; ")
            : "Updated Tailwind CSS v3 classes to v4",
      });
    }
  }

  return changes;
}
