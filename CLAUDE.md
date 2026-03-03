# Sky Skills — Claude Instructions

## Project overview
Next.js 16 (App Router) cognitive skills practice platform. TypeScript is the primary backend via Next.js Route Handlers. Python FastAPI (`api/`) is a secondary, computation-only add-on.

---

## Folder structure

```
src/
├── app/
│   ├── api/                    ← TS backend (Next.js Route Handlers)
│   │   ├── topics/route.ts     ← GET /api/topics
│   │   └── [topic]/
│   │       ├── questions/route.ts   ← GET /api/[topic]/questions
│   │       └── submit/route.ts      ← POST /api/[topic]/submit
│   ├── [topic-slug]/
│   │   └── page.tsx            ← One folder per topic (FE page)
│   ├── layout.tsx              ← Root layout (fonts, metadata)
│   ├── globals.css             ← Tailwind v4 + CSS variables
│   └── page.tsx                ← Landing page (/)
├── components/
│   └── TopicLayout.tsx         ← Shared wrapper for all topic pages
├── lib/
│   └── topics.ts               ← Single source of truth for topic data
└── types/
    └── index.ts                ← Shared TypeScript interfaces

api/                            ← Python FastAPI (computation add-on only)
prisma/
└── schema.prisma               ← PostgreSQL schema (Prisma ORM)
```

---

## Rules to always follow

### General
- Use TypeScript for everything in `src/`. Never use plain JS.
- Use the `@/` alias for all internal imports (e.g. `@/lib/topics`, `@/types`).
- Never add a topic to `page.tsx` directly — add it to `src/lib/topics.ts` and it propagates everywhere.

### Frontend
- All pages live in `src/app/[slug]/page.tsx` — one folder per topic.
- Every topic page must use `<TopicLayout>` from `@/components/TopicLayout`.
- Styles use Tailwind CSS v4 utility classes only. No inline styles, no CSS modules.
- Dark mode is supported via `dark:` variants — always include them for any new UI.

### Backend (TypeScript)
- All TS API routes live in `src/app/api/`. Use Next.js Route Handlers (`route.ts`).
- Export named functions `GET`, `POST`, etc. — never a default export.
- Always validate the `[topic]` dynamic param against `topicSlugs` from `@/lib/topics`.
- Return `NextResponse.json({ error: "..." }, { status: 4xx })` for all error cases.
- Import shared types from `@/types`, never redefine them inline.

### Backend (Python)
- Python is for computation only (e.g. generating questions, complex algorithms).
- Python routes are prefixed `/api/py/` and live in `api/index.py`.
- The TS backend calls Python via `fetch("/api/py/...")` — never expose Python directly to the frontend.

### Types
- All shared interfaces live in `src/types/index.ts`.
- Current types: `Topic`, `Question`, `SubmitPayload`, `SubmitResult`.
- Add new interfaces to `src/types/index.ts` before using them.

### Adding a new topic
1. Add the entry to the `topics` array in `src/lib/topics.ts`.
2. Create `src/app/[slug]/page.tsx` using `<TopicLayout>`.
3. Add question logic to `src/app/api/[topic]/questions/route.ts`.
4. No changes needed to `page.tsx` or the route handlers' slug validation (uses the shared `topicSlugs` set).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| DB ORM | Prisma (PostgreSQL via Supabase) |
| Python BE | FastAPI + Uvicorn |
| MCP | Supabase MCP (`.mcp.json`) |
