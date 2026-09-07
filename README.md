# CodeClash

A 1v1 competitive programming platform — two players are matched into a real-time coding duel, race to solve the same problem, and get judged against hidden test cases. Pixel-art western theme ("Wanted Poster" profile cards, sunset gradients, wood textures).

## Screenshots
**Home Page**

<img width="1919" height="899" alt="image" src="https://github.com/user-attachments/assets/c5069516-bd5e-432f-bb4d-559c9c560049" />

**Profile Page**

<img width="1915" height="881" alt="image" src="https://github.com/user-attachments/assets/5b2647b2-14ce-4c1e-ae88-6c1b30a39560" />

**Match/IDE Page**

<img width="1900" height="902" alt="image" src="https://github.com/user-attachments/assets/d7699544-1e65-4c0d-b8b6-f003c4f530ae" />





<!-- Drop screenshots into docs/screenshots/ with these exact filenames, or update the paths above. -->

## Tech Stack

**Frontend** (`/frontend`)
- Next.js (App Router) + TypeScript
- Redux Toolkit for client state (auth, problem)
- Socket.IO client for real-time match events
- Monaco Editor for the in-browser code editor
- Tailwind CSS, `react-markdown` + KaTeX for rendering problem statements with math

**Backend** (`/backend`)
- Express + TypeScript
- Prisma ORM (`@prisma/adapter-pg`) over PostgreSQL
- Redis (`ioredis`) — used for matchmaking / Socket.IO adapter
- Socket.IO server for real-time match state
- Passport (GitHub OAuth) + JWT + bcrypt for auth
- Wandbox API for remote code execution/judging

## Project Structure

```
backend/
  prisma/
    schema.prisma       # DB models: User, Match, Submission, Problem
    seed.ts             # Seeds Problem table from script/data.json
  src/
    config/             # db (Prisma + pg adapter), passport, redis
    controllers/        # match, submission, user
    middlewares/         # auth
    routes/             # /auth, /matches, /execute
    services/           # judge, match, matchmaking, problem, submission, user, wandbox
    sockets/            # real-time match events (auth + handlers)

frontend/
  src/
    app/                # Next.js routes: /, /login, /signup, /matches/[matchId], /profile, /auth/callback
    components/
      auth/             # login/signup/logout/GitHub buttons, profile button
      layout/           # SunsetBackground (theme)
      match/            # CodeEditor, StartMatchButton
      profile/          # StatCard ("Wanted Poster" stats)
    redux/
      slices/           # authSlice, problemSlice
    lib/socket.ts       # Socket.IO client setup
```

## Data Model (Prisma)

- **User** — auth (email/password or GitHub OAuth), `elo`, `wins`, `losses`
- **Problem** — `title`, `slug`, `description`, `difficulty` (EASY/MEDIUM/HARD), `constraints`, `starterCode` (Json, per-language templates), `publicTestCases` / `hiddenTestCases` (Json arrays of `{input, output}`)
- **Match** — links two `User`s (`player1`, `player2`), a `Problem`, tracks `status` (IN_PROGRESS/FINISHED/ABANDONED), `winner`, Elo deltas (`p1EloChange`, `p2EloChange`)
- **Submission** — a player's code for a given match/problem, judged `status` (PENDING → RUNNING → ACCEPTED/WRONG_ANSWER/etc.), execution time/memory

## API Routes

- `POST /auth/signup`, `/auth/register`, `/auth/login` — email/password auth
- `GET /auth/me` — current user profile (JWT-protected)
- `GET /auth/github`, `/auth/github/callback` — GitHub OAuth flow
- `POST /matches/startMatch` — create/join a match (JWT-protected)
- `GET /matches/:matchId` — fetch match details (JWT-protected)
- `POST /matches/finishMatch` — mark a match resolved (JWT-protected)
- `/execute/*` — submission/judging endpoints

## Database Seeding

Problem data lives in `backend/script/data.json` (gitignored — not committed) and is loaded via:

```bash
cd backend
npx prisma db push     # sync schema to the DB
npm run db:seed        # tsx prisma/seed.ts
```

`seed.ts` clears existing `Submission`/`Match`/`Problem` rows and re-inserts from `data.json`, normalizing `input`/`output` fields to strings and building starter code templates per language. Some seeded problems carry very large `hiddenTestCases` payloads (tens of MB) — low-memory free-tier Postgres instances can OOM on the insert; a compute tier with more RAM (or compressing the test case payloads) avoids this.

## Local Development

```bash
# Infra (Postgres + Redis)
docker-compose up -d

# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Required backend env vars (`.env`): `DATABASE_URL`, `FRONTEND_URL`, JWT secret, GitHub OAuth client ID/secret, Redis connection.

## Planned Next

- Adopt Redux Thunk for async match-flow actions (currently mixed patterns in `redux/slices`)
- Toast notifications for match results (win/loss/Elo change) instead of current UI feedback
