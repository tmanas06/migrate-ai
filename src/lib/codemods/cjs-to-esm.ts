// ============================================================
// Codemod: CommonJS → ESM
// ============================================================
import type { FileChange } from "../types";

/**
 * Apply CommonJS → ESM transforms.
 * Handles: require → import, module.exports → export, __dirname/__filename,
 * dynamic requires, etc.
 */
export function applyCjsToEsm(
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    let migrated = file.content;
    const descriptions: string[] = [];

    // 1. Convert `const x = require('module')` → `import x from 'module'`
    migrated = migrated.replace(
      /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g,
      (_, varName: string, modulePath: string) => {
        descriptions.push(`Converted require('${modulePath}') to import`);
        return `import ${varName} from '${modulePath}';`;
      }
    );

    // 2. Convert `const { a, b } = require('module')` → `import { a, b } from 'module'`
    migrated = migrated.replace(
      /const\s+\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g,
      (_, imports: string, modulePath: string) => {
        const cleanImports = imports
          .split(",")
          .map((i: string) => i.trim())
          .filter(Boolean)
          .join(", ");
        descriptions.push(`Converted destructured require('${modulePath}') to import`);
        return `import { ${cleanImports} } from '${modulePath}';`;
      }
    );

    // 3. Convert `let` and `var` requires similarly
    migrated = migrated.replace(
      /(?:let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g,
      (_, varName: string, modulePath: string) => {
        return `import ${varName} from '${modulePath}';`;
      }
    );
    migrated = migrated.replace(
      /(?:let|var)\s+\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g,
      (_, imports: string, modulePath: string) => {
        const cleanImports = imports
          .split(",")
          .map((i: string) => i.trim())
          .filter(Boolean)
          .join(", ");
        return `import { ${cleanImports} } from '${modulePath}';`;
      }
    );

    // 4. Convert `module.exports = { ... }` → `export { ... }` or `export default`
    if (/module\.exports\s*=/.test(migrated)) {
      migrated = migrated.replace(
        /module\.exports\s*=\s*\{([^}]+)\}\s*;?/g,
        (_, exports: string) => {
          const exportNames = exports
            .split(",")
            .map((e: string) => e.trim().split(":")[0].trim())
            .filter(Boolean);
          descriptions.push("Converted module.exports to named exports");
          return `export { ${exportNames.join(", ")} };`;
        }
      );
      // Single default export
      migrated = migrated.replace(
        /module\.exports\s*=\s*(\w+)\s*;?/g,
        (_, name: string) => {
          descriptions.push("Converted module.exports to default export");
          return `export default ${name};`;
        }
      );
    }

    // 5. Convert `exports.name = value` → `export const name = value`
    migrated = migrated.replace(
      /exports\.(\w+)\s*=\s*(.+);?/g,
      (_, name: string, value: string) => {
        descriptions.push(`Converted exports.${name} to named export`);
        return `export const ${name} = ${value};`;
      }
    );

    // 6. Replace __dirname with import.meta equivalents
    if (/__dirname/.test(migrated)) {
      if (!migrated.includes("import { fileURLToPath }")) {
        migrated =
          `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n` +
          migrated;
        descriptions.push("Added ESM-compatible __dirname replacement");
      }
    }

    // 7. Replace __filename
    if (/__filename/.test(migrated) && !migrated.includes("fileURLToPath")) {
      migrated =
        `import { fileURLToPath } from 'url';\n\nconst __filename = fileURLToPath(import.meta.url);\n\n` +
        migrated;
      descriptions.push("Added ESM-compatible __filename replacement");
    }

    if (migrated !== file.content) {
      changes.push({
        path: file.path,
        originalContent: file.content,
        migratedContent: migrated,
        changeDescription:
          descriptions.length > 0
            ? descriptions.join("; ")
            : "Converted CommonJS to ESM syntax",
      });
    }
  }

  return changes;
}
