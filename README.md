# FlowBoard — Web App

Multi-tenant SaaS project & task management dashboard built with Next.js 14, Supabase, Prisma, and NextAuth.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                │
│                  Next.js 14 — App Router                       │
│             Tailwind CSS · Recharts · dnd-kit                  │
│                   Deployed on Vercel (free)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (API Routes /api/*)
┌────────────────────────▼────────────────────────────────────────┐
│                    NEXT.JS API LAYER                            │
│          NextAuth.js  ·  Prisma ORM  ·  REST endpoints         │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │ HTTP
┌────────────▼────────────────┐  ┌────────────▼──────────────────┐
│     SUPABASE POSTGRESQL     │  │    FASTAPI MICROSERVICE       │
│     Serverless Postgres     │  │    Python · Render (free)     │
│     + Realtime subscriptions│  │    POST /summarize            │
│     + Row Level Security    │  │    POST /prioritize           │
│     via Prisma ORM          │  │    Uses Groq API (free)      │
└─────────────────────────────┘  └───────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| Auth | NextAuth.js v5 (Google OAuth + Credentials) |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Deployment | Vercel (free tier) |

## Features

- **Multi-tenant workspaces** — create workspaces, invite members, role-based access
- **Kanban boards** — drag-and-drop tasks across To Do / In Progress / Done columns
- **Realtime updates** — Supabase Realtime keeps boards in sync across users without refresh
- **Dashboard** — task stats and pie chart overview
- **AI summaries** — one-click project summary via FastAPI + Groq (see [flowboard-ai](https://github.com/your-username/flowboard-ai))
- **Google OAuth** — sign in with Google

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/flowboard-web.git
cd flowboard-web
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (Transaction pooler) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string (Direct) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Connect → Framework → Publishable key |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID/SECRET` | Google Cloud Console → OAuth 2.0 credentials |
| `AI_SERVICE_URL` | URL of your running flowboard-ai instance |

### 3. Push the database schema

```bash
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel — free)

1. Push this repo to GitHub
2. Import it on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy — Vercel auto-deploys on every push to `main`

## Project Structure

```
src/
├── app/
│   ├── login/                # sign in page
│   ├── register/             # sign up page
│   ├── dashboard/            # protected routes
│   │   ├── page.tsx          # dashboard home + stats
│   │   ├── projects/         # projects list + kanban board
│   │   └── settings/
│   └── api/                  # REST endpoints
│       ├── auth/
│       ├── workspaces/
│       ├── projects/
│       ├── tasks/
│       └── ai/summarize/
├── components/
│   ├── Sidebar.tsx
│   ├── KanbanBoard.tsx       # Supabase Realtime + dnd-kit
│   ├── KanbanColumn.tsx
│   ├── TaskCard.tsx
│   ├── StatsCards.tsx
│   ├── TaskChart.tsx
│   └── AISummaryButton.tsx
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   ├── auth.ts
│   └── utils.ts
└── middleware.ts             # route protection
prisma/
└── schema.prisma
```

## Related

- **[flowboard-ai](https://github.com/your-username/flowboard-ai)** — FastAPI AI microservice powered by Groq
