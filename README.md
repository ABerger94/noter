# Noter

A simple, private note-taking app for studies — write text notes (Markdown supported)
and attach images (scanned pages, whiteboard photos, diagrams), organize them by
course/subject and tags, and search across everything.

## Features

- Notes with Markdown content (headings, lists, bold/italic, tables, quotes, etc.)
- Image attachments per note (multiple images, stored in the database)
- Organize notes by **course/subject** and freeform **tags**
- Full-text search across note titles and content, plus filtering by course/tag
- Single shared password login (good for personal/private use)

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL
- Session auth via a signed cookie (no user database, just one shared password)

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — a PostgreSQL connection string. For local development you can
     run Postgres yourself, or use a free hosted database (see below).
   - `APP_PASSWORD` — the password you'll use to log in.
   - `AUTH_SECRET` — a random string used to sign session cookies. Generate one with
     `openssl rand -base64 32`.

3. Apply the database schema:

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and log in with your
   `APP_PASSWORD`.

## Deploying

This app is a standard Next.js app, so it deploys well to [Vercel](https://vercel.com)
or any Node hosting platform. You'll need a hosted PostgreSQL database — free options
that work well here include [Neon](https://neon.tech), [Supabase](https://supabase.com),
or [Vercel Postgres](https://vercel.com/storage/postgres).

Steps for Vercel:

1. Push this repo to GitHub (already done if you're reading this from there).
2. Create a Postgres database (e.g. on Neon, including via the Neon integration in
   Vercel's Storage tab) and copy its connection string.
3. Import the repo into Vercel and set the environment variables from `.env.example`
   (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`) in the Vercel project settings.
4. Deploy. The build command (`prisma migrate deploy && next build`) applies any
   pending database migrations automatically before building, so there's no manual
   migration step — every deploy keeps the schema in sync. Log in with the
   `APP_PASSWORD` you set.

Images are stored directly in the Postgres database (as binary data), so there's no
separate file/blob storage to configure — one database is all you need.

## Notes on the data model

- **Course** — a subject/class (e.g. "Statistics 501"), with a color for quick visual
  grouping. A note can belong to at most one course.
- **Tag** — freeform labels (e.g. "exam-prep", "week3") that can be attached to any
  number of notes, for cross-cutting organization.
- **Note** — title, Markdown content, optional course, any number of tags and image
  attachments.
- **Attachment** — an image file's bytes, stored inline in the database and served via
  `/api/attachments/[id]`.
