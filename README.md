# PDF to E-Course Platform

Convert any PDF document into a structured, interactive learning course using AI. Upload a PDF, get a full course with chapters, lessons, progress tracking, an AI chatbot, and auto-generated quizzes.

**Live app:** https://pdf-course-platform-peach.vercel.app
**Repository:** https://github.com/04varshithareddy-arch/pdf-course-platform

---

## Features

- **Google Authentication** — secure sign-in via NextAuth (Auth.js v5)
- **PDF Upload** — multi-page text extraction, metadata stored per user
- **AI Course Generation** — Groq (Llama 3.3 70B) converts extracted text into a structured course: title, description, difficulty level, chapters, lessons, and key takeaways
- **Course Viewer** — clean, organized reading experience by chapter and lesson
- **Progress Tracking** — mark lessons complete, live completion percentage, persisted per user
- **Dashboard** — all of a user's courses with progress at a glance
- **Search** — real-time filtering across course titles, descriptions, chapters, and lesson titles
- **AI Learning Companion (Chatbot)** — context-aware Q&A about the uploaded course content
- **Quiz Generation** — auto-generated multiple choice / true-false / short answer quizzes per chapter, with scoring
- **Row Level Security (RLS)** — all Supabase tables have RLS enabled; the public API key cannot read or write data directly. All database access happens server-side through a service role key, gated behind an authenticated NextAuth session.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Auth | NextAuth (Auth.js v5), Google OAuth |
| Database | Supabase (PostgreSQL) |
| AI | Groq API (Llama 3.3 70B Versatile) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Google Cloud OAuth Client (Web application type)
- A Groq API key (free tier available at console.groq.com)

### 1. Clone and install

```bash
git clone https://github.com/04varshithareddy-arch/pdf-course-platform.git
cd pdf-course-platform
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root with the following:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   AUTH_SECRET=generate_with_openssl_rand_base64_32
   AUTH_URL=http://localhost:3000
   GROQ_API_KEY=your_groq_api_key
**Important:** `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_` — it is used server-side only and bypasses Row Level Security. Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose to the browser.

Generate a secure `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 3. Google OAuth setup

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth Client:

- **Authorized JavaScript origins:** `http://localhost:3000` (and your production URL)
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google` (and your production equivalent)

### 4. Database setup

Run the schema (see `Database Schema` section below) in the Supabase SQL editor, then enable RLS on every table:

```sql
alter table documents enable row level security;
alter table courses enable row level security;
alter table chapters enable row level security;
alter table lessons enable row level security;
alter table progress enable row level security;
alter table chat_messages enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;
alter table users enable row level security;
```

No additional policies are needed — the app's backend uses the service role key, which bypasses RLS, while the public anon key is fully locked out of direct access.

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | User records linked to Google account email |
| `documents` | Uploaded PDF metadata and extracted text |
| `courses` | AI-generated course metadata (title, description, difficulty, etc.) |
| `chapters` | Chapters belonging to a course |
| `lessons` | Lessons belonging to a chapter (content, key takeaways) |
| `progress` | Per-user, per-lesson completion tracking |
| `chat_messages` | Chatbot conversation history |
| `quizzes` | Auto-generated quiz questions per chapter |
| `quiz_attempts` | User quiz attempts and scores |

All tables reference `user_id` to scope data per user. RLS is enabled on every table; access is enforced at the application layer via authenticated API routes using the Supabase service role key.

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication handlers |
| `/api/upload` | POST | Upload a PDF, extract text, store document metadata |
| `/api/generate-course` | POST | Send extracted text to Groq, generate structured course, persist to DB |
| `/api/generate-quiz` | POST | Generate quiz questions for a chapter via Groq |
| `/api/submit-quiz` | POST | Score a quiz attempt and persist the result |
| `/api/progress` | POST | Mark a lesson complete/incomplete |
| `/api/chat` | POST | Send a message to the AI chatbot with course context |

All routes verify the NextAuth session before performing any database operation.

### Example: POST /api/upload

Request (multipart/form-data):
Response:
```json
{
  "message": "Upload successful",
  "filename": "example.pdf",
  "pageCount": 11
}
```

### Example: POST /api/progress

Request:
```json
{
  "lessonId": "uuid-of-lesson",
  "completed": true
}
```

Response:
```json
{
  "success": true
}
```

---

## Security

- Row Level Security (RLS) is enabled on every table in Supabase.
- The public `NEXT_PUBLIC_SUPABASE_ANON_KEY` cannot read or write any data directly.
- All database access happens server-side via `SUPABASE_SERVICE_ROLE_KEY`, which is never exposed to the browser.
- Every API route checks for a valid authenticated session before touching the database.

---

## Known Limitations / Future Improvements

- Currently on Groq's free tier, which has daily token limits — a production deployment would benefit from a paid tier or additional rate-limit handling.
- Search is client-side and keyword-based; a future improvement could add semantic search via embeddings.
- No dedicated learning history / chat history page yet (in progress).

---

## License

This project was built as part of an internship assignment for In2peta.