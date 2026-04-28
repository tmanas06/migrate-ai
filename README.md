<![CDATA[<div align="center">

# 🚀 MigrateAI

### AI-Powered Code Migration — Stop doing boring upgrades. Let AI do them.

[![Built for Boring AI Hackathon](https://img.shields.io/badge/Boring%20AI-Hackathon%202026-7c6af7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMyAxMFYzTDQgMTRoN3Y3bDktMTFoLTd6Ii8+PC9zdmc+)](https://dorahacks.io)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Groq AI](https://img.shields.io/badge/Groq-Llama--3.3--70b--versatile-orange?style=flat-square)](https://groq.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000?style=flat-square)](https://ui.shadcn.com)

---

**Paste a GitHub repo → Pick a migration → Get transformed code, beautiful diffs, and PR-ready patches.**

[Live Demo](#demo) · [How It Works](#how-it-works) · [Quick Start](#quick-start) · [Migrations](#supported-migrations)

</div>

---

## ✨ What is MigrateAI?

MigrateAI is an AI-powered code migration tool that automatically upgrades your codebase. It combines **AST-based codemods** with **Claude AI analysis** to deliver thorough, intelligent migrations — complete with side-by-side diffs, downloadable patch files, and auto-generated PR descriptions.

No more spending days on repetitive upgrade work. Just paste, click, migrate.

---

## 🔄 How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                  │     │                  │     │                  │
│   1. PASTE URL   │────▶│  2. AI ANALYZES  │────▶│  3. GET RESULTS  │
│                  │     │                  │     │                  │
│  Enter GitHub    │     │  Groq AI +       │     │  Beautiful diffs │
│  repo URL and    │     │  jscodeshift     │     │  PR description  │
│  select type     │     │  codemods run    │     │  Patch download  │
│                  │     │                  │     │                  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Paste** — Enter a public GitHub repo URL and select your migration type
2. **Analyze** — The app clones the repo, runs AST codemods, and sends files to Groq AI for deep analysis
3. **Results** — Get a split-pane diff viewer, stats, breaking changes, downloadable `.patch` file, and a professional PR description

---

## 🎯 Supported Migrations

| Migration | From | To | Description |
|-----------|------|-----|-------------|
| ⚛️ React | React 17 | React 19 | JSX runtime, forwardRef, hooks, FC removal |
| 🧪 Testing | Jest | Vitest | Import changes, mock API, timer utils, config |
| 📦 Modules | CommonJS | ESM | require→import, module.exports→export, __dirname |
| 🐍 Python | Python 2 | Python 3 | print, exceptions, unicode, xrange, dict methods |
| 🔗 API | REST | tRPC | fetch/axios→tRPC, API routes→procedures |
| 🎨 Styling | Tailwind v3 | Tailwind v4 | Opacity syntax, utility classes, CSS config |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- [Anthropic API key](https://console.anthropic.com/) (for AI features; demo mode works without it)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/migrate-ai.git
cd migrate-ai

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're ready to go!

### 🎮 Demo Mode

Don't have a repo handy? Click **"✨ Try Demo"** on the home page to see a full migration walkthrough with sample files. No GitHub URL or API key needed.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **AI** | Groq (Llama-3.3-70b-versatile) |
| **Codemods** | jscodeshift + custom AST visitors |
| **Diffs** | `diff` package for unified diffs |
| **Git** | `simple-git` for repo cloning |
| **Deployment** | Vercel-ready (includes vercel.json) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home – hero + migration input
│   ├── migrate/page.tsx      # Processing – real-time log viewer
│   ├── results/page.tsx      # Results – diff viewer + PR + patch
│   ├── layout.tsx            # Root layout with fonts + metadata
│   ├── globals.css           # Custom theme + animations
│   └── api/
│       ├── migrate/route.ts  # POST – main migration pipeline
│       ├── generate-pr/route.ts  # POST – AI PR description
│       └── stream-logs/route.ts  # GET – SSE log streaming
├── components/
│   ├── DiffViewer.tsx        # Split/unified diff viewer
│   ├── MigrationLog.tsx      # Terminal-style log output
│   └── MigrationSelector.tsx # Migration type dropdown
└── lib/
    ├── ai.ts                 # Groq AI API wrapper
    ├── git.ts                # Repo cloning utilities
    ├── diff.ts               # Diff generation
    ├── files.ts              # File reader
    ├── demo.ts               # Demo data
    ├── log-store.ts          # SSE log pub/sub
    ├── types.ts              # TypeScript types
    └── codemods/
        ├── index.ts          # Codemod router
        ├── react-17-to-19.ts
        ├── jest-to-vitest.ts
        ├── cjs-to-esm.ts
        ├── python-2-to-3.ts
        ├── rest-to-trpc.ts
        └── tailwind-3-to-4.ts
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | For AI features | Your Groq API key for Llama. Demo mode works without it. |

---

## 🎬 Demo

> 📹 *Demo video coming soon*

### Screenshots

**Home Page** — Animated gradient hero with migration selector
**Processing** — Real-time terminal-style log output
**Results** — Side-by-side diff viewer with stats

---

## 🏆 Built for Boring AI Hackathon

This project was built for the **[Boring AI Hackathon](https://dorahacks.io)** on DoraHacks.

**Theme:** Automate the boring stuff with AI
**Prize:** $3,000

MigrateAI tackles one of the most tedious tasks in software engineering: framework and library upgrades. By combining deterministic AST transforms with AI-powered analysis, it delivers reliable, comprehensive migrations in seconds instead of days.

---

## 📝 License

MIT © 2026

---

<div align="center">

**Built with Groq AI, Next.js & jscodeshift**

[⬆ Back to top](#-migrateai)

</div>
]]>
# migrate-ai
