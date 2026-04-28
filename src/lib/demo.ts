// ============================================================
// Demo data – hardcoded sample files for demo mode
// ============================================================
import type { MigrationType, MigrationResult } from "./types";

/** Sample source files for each migration type */
const DEMO_FILES: Record<MigrationType, { path: string; content: string }[]> = {
  "react-17-to-19": [
    {
      path: "src/components/UserCard.tsx",
      content: `import React from 'react';

interface UserCardProps {
  name: string;
  email: string;
  avatar: string;
}

const UserCard: React.FC<UserCardProps> = ({ name, email, avatar }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className="user-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
      {isHovered && <span className="tooltip">Click to view profile</span>}
    </div>
  );
};

export default UserCard;`,
    },
    {
      path: "src/components/Button.tsx",
      content: `import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ label, onClick, variant = 'primary' }, ref) => {
    return (
      <button
        ref={ref}
        className={\`btn btn-\${variant}\`}
        onClick={onClick}
      >
        {label}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;`,
    },
    {
      path: "src/App.tsx",
      content: `import React from 'react';
import UserCard from './components/UserCard';
import Button from './components/Button';

const App: React.FC = () => {
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div className="app">
      <h1>User Directory</h1>
      {users.map((user: any) => (
        <UserCard key={user.id} {...user} />
      ))}
      <Button label="Load More" onClick={() => {}} />
    </div>
  );
};

export default App;`,
    },
  ],
  "jest-to-vitest": [
    {
      path: "src/utils/__tests__/math.test.ts",
      content: `import { add, subtract, multiply } from '../math';

describe('Math utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(-1, 1)).toBe(0);
  });

  it('should subtract two numbers', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  it('should multiply two numbers', () => {
    expect(multiply(3, 4)).toBe(12);
  });
});

describe('Async operations', () => {
  it('should fetch data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: 'test' }),
    });
    global.fetch = mockFetch;

    const response = await fetch('/api/data');
    const data = await response.json();

    expect(data).toEqual({ data: 'test' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle timers', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    setTimeout(callback, 1000);
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
    jest.useRealTimers();
  });
});`,
    },
    {
      path: "src/services/__tests__/api.test.ts",
      content: `import { ApiService } from '../api';

jest.mock('../config', () => ({
  API_URL: 'https://api.test.com',
}));

describe('ApiService', () => {
  let service: ApiService;

  beforeAll(() => {
    service = new ApiService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should make GET requests', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }))
    );

    const result = await service.get('/health');
    expect(result).toEqual({ status: 'ok' });
    expect(spy).toHaveBeenCalledWith('https://api.test.com/health', expect.any(Object));
  });
});`,
    },
  ],
  "cjs-to-esm": [
    {
      path: "src/utils/helpers.js",
      content: `const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

const CONFIG_PATH = path.join(__dirname, '../config.json');

function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function createLogger(name) {
  const emitter = new EventEmitter();
  return {
    log: (msg) => {
      console.log(\`[\${name}] \${msg}\`);
      emitter.emit('log', msg);
    },
    on: emitter.on.bind(emitter),
  };
}

module.exports = {
  readConfig,
  createLogger,
};`,
    },
    {
      path: "src/server.js",
      content: `const express = require('express');
const cors = require('cors');
const { readConfig, createLogger } = require('./utils/helpers');

const app = express();
const logger = createLogger('server');
const config = readConfig();

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  logger.log('Status check');
  res.json({ status: 'ok', version: config.version });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`,
    },
  ],
  "python-2-to-3": [
    {
      path: "app/main.py",
      content: `#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os

class UserManager:
    def __init__(self):
        self.users = {}

    def add_user(self, name, email):
        if self.users.has_key(name):
            print "User already exists:", name
            raise ValueError, "Duplicate user"
        self.users[name] = email
        print "Added user:", name

    def get_users(self):
        for name, email in self.users.iteritems():
            print name, "->", email

    def search(self, query):
        results = []
        for name in self.users.iterkeys():
            if name <> query and unicode(name).lower().find(unicode(query).lower()) >= 0:
                results.append(name)
        return results


def process_data(data):
    numbers = range(1000000)
    total = long(0)
    for n in xrange(len(numbers)):
        total = total + numbers[n]

    user_input = raw_input("Enter filter: ")
    filtered = filter(lambda x: x > int(user_input), numbers)
    print "Total:", total
    print "Filtered count:", len(list(filtered))

    try:
        result = 10 / 0
    except ZeroDivisionError, e:
        print >> sys.stderr, "Error:", e

if __name__ == '__main__':
    mgr = UserManager()
    mgr.add_user("Alice", "alice@test.com")
    mgr.add_user("Bob", "bob@test.com")
    mgr.get_users()
    process_data(None)`,
    },
  ],
  "rest-to-trpc": [
    {
      path: "src/pages/api/users.ts",
      content: `import type { NextApiRequest, NextApiResponse } from 'next';

const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const { name, email } = req.body;
    const newUser = { id: users.length + 1, name, email };
    users.push(newUser);
    return res.status(201).json(newUser);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}`,
    },
    {
      path: "src/hooks/useUsers.ts",
      content: `import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  async function addUser(name: string, email: string) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const newUser = await response.json();
    setUsers(prev => [...prev, newUser]);
  }

  return { users, loading, addUser };
}`,
    },
  ],
  "tailwind-3-to-4": [
    {
      path: "src/components/Card.tsx",
      content: `export function Card({ title, description, image }: CardProps) {
  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg overflow-ellipsis p-6">
      <img src={image} className="w-full h-48 object-cover rounded-md" />
      <h3 className="text-gray-900 text-opacity-80 text-xl font-bold mt-4 flex-grow">
        {title}
      </h3>
      <p className="text-gray-600 text-opacity-70 mt-2 flex-shrink-0 decoration-slice">
        {description}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <span className="bg-blue-500 bg-opacity-20 text-blue-700 px-3 py-1 rounded-full text-sm">
          Featured
        </span>
        <span className="border-green-500 border-opacity-50 border px-3 py-1 rounded-full text-sm flex-grow-0">
          Active
        </span>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  description: string;
  image: string;
}`,
    },
    {
      path: "tailwind.config.js",
      content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7c6af7',
        secondary: '#4fd1c7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};`,
    },
  ],
  "auto": [], // Handled via redirection
};

/**
 * Generate a complete demo migration result for a given migration type.
 */
export function generateDemoResult(migrationType: MigrationType): MigrationResult {
  const type = migrationType === "auto" ? "react-17-to-19" : migrationType;
  const demoFiles = DEMO_FILES[type];

  // Apply basic transforms based on type (simplified for demo)
  const fileChanges = demoFiles.map((file) => {
    let migratedContent = file.content;

    switch (migrationType) {
      case "react-17-to-19":
        migratedContent = migratedContent
          .replace(/import React from 'react';\n\n/g, "")
          .replace(/import React from 'react';\n/g, "")
          .replace(/: React\.FC<(\w+)>/g, "(props: $1)")
          .replace(/: React\.FC/g, "()")
          .replace(/React\.useState/g, "useState")
          .replace(/React\.useEffect/g, "useEffect")
          .replace(/React\.forwardRef<HTMLButtonElement, ButtonProps>\(\n  \({ label, onClick, variant = 'primary' }, ref\) => {/g, 
            "function Button({ label, onClick, variant = 'primary', ref }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {");
        // Add necessary imports
        if (migratedContent.includes("useState") && !migratedContent.includes("import {")) {
          migratedContent = `import { useState } from 'react';\n\n` + migratedContent;
        }
        if (migratedContent.includes("useEffect") && migratedContent.includes("useState") && !migratedContent.includes("useEffect")) {
          migratedContent = migratedContent.replace(
            "import { useState } from 'react';",
            "import { useState, useEffect } from 'react';"
          );
        }
        if (migratedContent.includes("useEffect") && !migratedContent.includes("import {")) {
          migratedContent = `import { useEffect } from 'react';\n\n` + migratedContent;
        }
        if (migratedContent.includes("useState") && migratedContent.includes("useEffect") && migratedContent.includes("import { useState }")) {
          migratedContent = migratedContent.replace(
            "import { useState } from 'react';",
            "import { useState, useEffect } from 'react';"
          );
        }
        break;

      case "jest-to-vitest":
        migratedContent = migratedContent
          .replace(/jest\.fn\b/g, "vi.fn")
          .replace(/jest\.mock\b/g, "vi.mock")
          .replace(/jest\.spyOn\b/g, "vi.spyOn")
          .replace(/jest\.clearAllMocks\b/g, "vi.clearAllMocks")
          .replace(/jest\.restoreAllMocks\b/g, "vi.restoreAllMocks")
          .replace(/jest\.useFakeTimers\b/g, "vi.useFakeTimers")
          .replace(/jest\.useRealTimers\b/g, "vi.useRealTimers")
          .replace(/jest\.advanceTimersByTime\b/g, "vi.advanceTimersByTime");
        migratedContent = `import { describe, it, test, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';\n\n` + migratedContent;
        break;

      case "cjs-to-esm":
        migratedContent = migratedContent
          .replace(/const (\w+) = require\('([^']+)'\);/g, "import $1 from '$2';")
          .replace(/const \{ ([^}]+) \} = require\('([^']+)'\);/g, "import { $1 } from '$2';")
          .replace(/module\.exports = \{([^}]+)\};/g, (_, exports) => {
            const names = exports.split(',').map((e: string) => e.trim().split(':')[0].trim()).filter(Boolean);
            return `export { ${names.join(', ')} };`;
          })
          .replace(/module\.exports = (\w+);/g, "export default $1;");
        if (migratedContent.includes("__dirname")) {
          migratedContent = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n` + migratedContent;
        }
        break;

      case "python-2-to-3":
        migratedContent = migratedContent
          .replace(/^(\s*)print\s+(?!\()(.+)$/gm, '$1print($2)')
          .replace(/print\((.+),\s*(.+)\)$/gm, 'print($1, $2)')
          .replace(/except (\w+), (\w+)/g, "except $1 as $2")
          .replace(/raise (\w+), (".*?")/g, "raise $1($2)")
          .replace(/\bxrange\b/g, "range")
          .replace(/\braw_input\b/g, "input")
          .replace(/\.has_key\((\w+)\)/g, "($1 in self.users)")
          .replace(/\.iteritems\(\)/g, ".items()")
          .replace(/\.iterkeys\(\)/g, ".keys()")
          .replace(/\bunicode\b/g, "str")
          .replace(/\blong\b(?!\w)/g, "int")
          .replace(/<>/g, "!=")
          .replace(/print >> sys\.stderr,/g, "print(")
          .replace(/print\(("Error:"), (e)\s*$/gm, 'print($1, $2, file=sys.stderr)');
        break;

      case "rest-to-trpc":
        // For demo, show a meaningful transformation
        if (file.path.includes("api/users")) {
          migratedContent = `import { router, publicProcedure } from '@/server/trpc';
import { z } from 'zod';

const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
];

export const usersRouter = router({
  list: publicProcedure
    .query(() => {
      return users;
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(({ input }) => {
      const newUser = { id: users.length + 1, ...input };
      users.push(newUser);
      return newUser;
    }),
});`;
        } else {
          migratedContent = `import { trpc } from '@/utils/trpc';

interface User {
  id: number;
  name: string;
  email: string;
}

export function useUsers() {
  const { data: users = [], isLoading: loading } = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.useUtils().users.list.invalidate();
    },
  });

  async function addUser(name: string, email: string) {
    await createMutation.mutateAsync({ name, email });
  }

  return { users, loading, addUser };
}`;
        }
        break;

      case "tailwind-3-to-4":
        migratedContent = migratedContent
          .replace(/bg-(\w+-\d+)\s+bg-opacity-(\d+)/g, "bg-$1/$2")
          .replace(/text-(\w+-\d+)\s+text-opacity-(\d+)/g, "text-$1/$2")
          .replace(/border-(\w+-\d+)\s+border-opacity-(\d+)/g, "border-$1/$2")
          .replace(/\boverflow-ellipsis\b/g, "text-ellipsis")
          .replace(/\bflex-grow\b(?!-)/g, "grow")
          .replace(/\bflex-grow-0\b/g, "grow-0")
          .replace(/\bflex-shrink-0\b/g, "shrink-0")
          .replace(/\bdecoration-slice\b/g, "box-decoration-slice");
        if (file.path.includes("tailwind.config")) {
          migratedContent = `@import "tailwindcss";

@theme {
  --color-primary: #7c6af7;
  --color-secondary: #4fd1c7;
  --font-sans: 'Inter', sans-serif;
}`;
        }
        break;
    }

    return {
      path: file.path,
      originalContent: file.content,
      migratedContent,
      changeDescription: `Demo migration applied for ${migrationType}`,
    };
  });

  // Build unified diff
  const diffLines: string[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;

  for (const fc of fileChanges) {
    if (fc.originalContent === fc.migratedContent) continue;
    const origLines = fc.originalContent.split("\n");
    const migrLines = fc.migratedContent.split("\n");

    diffLines.push(`--- a/${fc.path}`);
    diffLines.push(`+++ b/${fc.path}`);
    diffLines.push(`@@ -1,${origLines.length} +1,${migrLines.length} @@`);

    for (const line of origLines) {
      diffLines.push(`-${line}`);
      totalRemoved++;
    }
    for (const line of migrLines) {
      diffLines.push(`+${line}`);
      totalAdded++;
    }
    diffLines.push("");
  }

  const unifiedDiff = diffLines.join("\n");

  const migrationLabels: Record<MigrationType, string> = {
    "auto": "Auto-Detected Migration",
    "react-17-to-19": "React 17 → React 19",
    "jest-to-vitest": "Jest → Vitest",
    "cjs-to-esm": "CommonJS → ES Modules",
    "python-2-to-3": "Python 2 → Python 3",
    "rest-to-trpc": "REST API → tRPC",
    "tailwind-3-to-4": "Tailwind CSS v3 → v4",
  };

  return {
    id: "demo-" + Date.now(),
    migrationType,
    repoUrl: "https://github.com/demo/sample-project",
    plan: {
      files: fileChanges,
      summary: `Demo migration: ${migrationLabels[migrationType]}. Applied automated transforms to ${fileChanges.length} files with syntax-level codemods and AI-guided analysis.`,
      breakingChanges: getBreakingChanges(migrationType),
      estimatedRisk: "low",
    },
    unifiedDiff,
    patchContent: unifiedDiff,
    stats: {
      filesChanged: fileChanges.filter((f) => f.originalContent !== f.migratedContent).length,
      linesAdded: totalAdded,
      linesRemoved: totalRemoved,
    },
    prDescription: generateDemoPRDescription(type, fileChanges.length, totalAdded, totalRemoved),
    completedAt: new Date().toISOString(),
  };
}

function getBreakingChanges(type: MigrationType): string[] {
  const changes: Record<MigrationType, string[]> = {
    "auto": [],
    "react-17-to-19": [
      "React.FC no longer includes children prop by default",
      "forwardRef API changed – ref is now a regular prop",
      "Legacy context API removed",
    ],
    "jest-to-vitest": [
      "Some jest-specific matchers may need vitest equivalents",
      "jest.config.js replaced with vitest.config.ts",
      "Module mocking syntax differs slightly",
    ],
    "cjs-to-esm": [
      "__dirname and __filename require polyfill via import.meta.url",
      "Dynamic require() must use dynamic import()",
      "package.json needs \"type\": \"module\"",
    ],
    "python-2-to-3": [
      "Integer division now returns float by default",
      "print is now a function, not a statement",
      "dict.keys(), .values(), .items() return views instead of lists",
    ],
    "rest-to-trpc": [
      "All API routes converted to tRPC procedures",
      "Client-side fetch calls replaced with tRPC hooks",
      "Requires tRPC server and client setup",
    ],
    "tailwind-3-to-4": [
      "Configuration moved from JS to CSS @theme directive",
      "Some utility class names have changed",
      "Plugin system has been redesigned",
    ],
  };
  return changes[type] || [];
}

function generateDemoPRDescription(
  type: MigrationType,
  filesChanged: number,
  linesAdded: number,
  linesRemoved: number
): string {
  const labels: Record<MigrationType, { from: string; to: string }> = {
    "auto": { from: "Unknown", to: "Modern" },
    "react-17-to-19": { from: "React 17", to: "React 19" },
    "jest-to-vitest": { from: "Jest", to: "Vitest" },
    "cjs-to-esm": { from: "CommonJS", to: "ES Modules" },
    "python-2-to-3": { from: "Python 2", to: "Python 3" },
    "rest-to-trpc": { from: "REST API", to: "tRPC" },
    "tailwind-3-to-4": { from: "Tailwind CSS v3", to: "Tailwind CSS v4" },
  };
  const { from, to } = labels[type];

  return `## Summary

Automated migration from **${from}** to **${to}** using MigrateAI.

This PR applies comprehensive code transforms across ${filesChanged} files, with ${linesAdded} lines added and ${linesRemoved} lines removed.

## Changes

- Applied automated codemods for ${from} → ${to} migration patterns
- Updated import statements and module syntax
- Modernized API usage to align with ${to} best practices
- Updated configuration files where applicable

## Testing

- [ ] Run existing test suite to verify no regressions
- [ ] Manual smoke test of core functionality
- [ ] Verify build completes without errors
- [ ] Check for runtime warnings or deprecation notices

## Breaking Changes

${getBreakingChanges(type).map((c) => `- ⚠️ ${c}`).join("\n")}

---

*Generated by [MigrateAI](https://github.com/migrateai) — AI-powered code migration*`;
}
