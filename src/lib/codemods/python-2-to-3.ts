// ============================================================
// Codemod: Python 2 → 3
// ============================================================
import type { FileChange } from "../types";

/**
 * Apply Python 2 → 3 transforms.
 * Handles: print statements, unicode, division, dict methods,
 * exception syntax, range/xrange, etc.
 */
export function applyPython2to3(
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    let migrated = file.content;
    const descriptions: string[] = [];

    // 1. Convert print statements to print() function
    //    `print "hello"` → `print("hello")`
    //    `print "a", "b"` → `print("a", "b")`
    migrated = migrated.replace(
      /^(\s*)print\s+(?![\(\)])(.*?)$/gm,
      (_, indent: string, args: string) => {
        // Handle print with >> (stderr)
        if (args.startsWith(">>")) {
          const parts = args.replace(/^>>\s*\w+\s*,\s*/, "");
          descriptions.push("Converted print >> to print() with file parameter");
          return `${indent}print(${parts.trim()}, file=sys.stderr)`;
        }
        descriptions.push("Converted print statement to print() function");
        return `${indent}print(${args.trim()})`;
      }
    );

    // 2. Convert `except Exception, e:` → `except Exception as e:`
    if (/except\s+\w+\s*,\s*\w+/.test(migrated)) {
      migrated = migrated.replace(
        /except\s+(\w+)\s*,\s*(\w+)/g,
        "except $1 as $2"
      );
      descriptions.push("Updated exception syntax to use 'as' keyword");
    }

    // 3. Convert `raise Exception, "message"` → `raise Exception("message")`
    if (/raise\s+\w+\s*,\s*/.test(migrated)) {
      migrated = migrated.replace(
        /raise\s+(\w+)\s*,\s*(.+)/g,
        "raise $1($2)"
      );
      descriptions.push("Updated raise syntax");
    }

    // 4. Replace xrange with range
    if (/\bxrange\b/.test(migrated)) {
      migrated = migrated.replace(/\bxrange\b/g, "range");
      descriptions.push("Replaced xrange() with range()");
    }

    // 5. Replace raw_input with input
    if (/\braw_input\b/.test(migrated)) {
      migrated = migrated.replace(/\braw_input\b/g, "input");
      descriptions.push("Replaced raw_input() with input()");
    }

    // 6. Replace `has_key` dict method
    if (/\.has_key\s*\(/.test(migrated)) {
      migrated = migrated.replace(
        /(\w+)\.has_key\s*\(\s*(.+?)\s*\)/g,
        "$2 in $1"
      );
      descriptions.push("Replaced dict.has_key() with 'in' operator");
    }

    // 7. Replace `dict.iteritems()` → `dict.items()`
    if (/\.iteritems\(\)/.test(migrated)) {
      migrated = migrated.replace(/\.iteritems\(\)/g, ".items()");
      descriptions.push("Replaced dict.iteritems() with dict.items()");
    }
    if (/\.itervalues\(\)/.test(migrated)) {
      migrated = migrated.replace(/\.itervalues\(\)/g, ".values()");
      descriptions.push("Replaced dict.itervalues() with dict.values()");
    }
    if (/\.iterkeys\(\)/.test(migrated)) {
      migrated = migrated.replace(/\.iterkeys\(\)/g, ".keys()");
      descriptions.push("Replaced dict.iterkeys() with dict.keys()");
    }

    // 8. Replace `unicode` with `str`
    if (/\bunicode\b/.test(migrated)) {
      migrated = migrated.replace(/\bunicode\b/g, "str");
      descriptions.push("Replaced unicode type with str");
    }

    // 9. Replace `long` with `int`
    if (/\blong\b/.test(migrated)) {
      migrated = migrated.replace(/\blong\b(?!\w)/g, "int");
      descriptions.push("Replaced long type with int");
    }

    // 10. Update integer division
    if (/(?<!\/)\/(?!\/)/.test(migrated) && !/from __future__/.test(migrated)) {
      // Add future import for division if not present
      if (!migrated.includes("from __future__ import")) {
        migrated = `from __future__ import division\n\n` + migrated;
        descriptions.push("Added __future__ division import for Python 3 compatibility");
      }
    }

    // 11. Replace `<>` with `!=`
    if (/<>/.test(migrated)) {
      migrated = migrated.replace(/<>/g, "!=");
      descriptions.push("Replaced <> with != operator");
    }

    if (migrated !== file.content) {
      changes.push({
        path: file.path,
        originalContent: file.content,
        migratedContent: migrated,
        changeDescription:
          descriptions.length > 0
            ? descriptions.join("; ")
            : "Migrated Python 2 syntax to Python 3",
      });
    }
  }

  return changes;
}
