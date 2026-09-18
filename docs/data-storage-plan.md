# FitTrack — User Data & Video Storage Plan

Covers three concerns: account credentials (usernames/passwords), regular app data (workouts, macros, etc.), and barbell-tracker video storage. Written against the current stack: Node/Express + Prisma (SQLite in dev) backend, Python FastAPI CV service, React/Vite frontend.

## 1. Core principle: don't put videos in the database

Relational databases (SQLite/Postgres) are for structured records, not large binary blobs. Videos should live in **object storage** (a file/bucket store), and the database should only hold a *pointer* to each video plus its metadata. This keeps the DB small and fast, and makes video storage swappable later without touching app data.

- **Dev / early stage**: store video files on local disk under something like `cv-service/storage/videos/{userId}/{videoId}.mp4`. Simple, zero cost, fine for one user (you) testing locally.
- **Production**: move to an S3-compatible object store. Recommended options for a side project:
  - **Cloudflare R2** — S3-compatible API, no egress fees (cheapest if people will actually watch their videos back).
  - **Backblaze B2** — also cheap, S3-compatible.
  - **AWS S3** — the default choice, more tooling/support, but charges for egress.
  The migration from local disk to any of these later is a small change (swap the file read/write layer for an SDK call) as long as you don't hardcode local paths outside one storage module.

## 2. Authentication & password storage

Never store passwords in plain text or with reversible encryption — always a one-way hash.

- Use **argon2id** (preferred) or **bcrypt** (cost factor ~12) to hash passwords. Both have solid, well-maintained Node libraries (`argon2`, `bcrypt`). Store only the hash.
- Minimum `User` fields: `id`, `email` (unique, case-insensitive), `passwordHash`, `createdAt`, `updatedAt`.
- Sessions: for an app this size, a server-side session table + an `httpOnly`, `Secure`, `SameSite=Lax` cookie is simpler and safer than raw JWTs, because you can revoke a session instantly (e.g. on logout or a suspected compromise) just by deleting the row. JWTs are fine too, but need a revocation strategy (short expiry + refresh tokens) which is more moving parts than this app needs yet.
- Add, even if not on day one:
  - Rate limiting on login attempts (protects against brute force).
  - Email verification on signup.
  - A password reset flow using a signed, time-limited, single-use token (never email the password itself).
- Enforce HTTPS in production; cookies without `Secure` are sent over plain HTTP too.

## 3. Prisma schema sketch

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  sessions     Session[]
  workouts     Workout[]
  macroLogs    MacroLog[]
  videos       Video[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Workout {
  id        String       @id @default(cuid())
  userId    String
  user      User         @relation(fields: [userId], references: [id])
  date      DateTime     @default(now())
  notes     String?
  sets      WorkoutSet[]
}

model WorkoutSet {
  id         String  @id @default(cuid())
  workoutId  String
  workout    Workout @relation(fields: [workoutId], references: [id])
  exercise   String
  weight     Float
  reps       Int
  rpe        Float?
}

model MacroLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      DateTime @default(now())
  food      String
  calories  Int
  protein   Float
  carbs     Float
  fat       Float
}

model Video {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  storageKey      String    // e.g. "videos/{userId}/{id}.mp4" — path in object storage, not a public URL
  status          String    @default("uploaded") // uploaded | processing | done | failed
  durationSeconds Float?
  createdAt       DateTime  @default(now())
  analysis        BarbellAnalysis?
}

model BarbellAnalysis {
  id            String  @id @default(cuid())
  videoId       String  @unique
  video         Video   @relation(fields: [videoId], references: [id])
  barPathJson   String  // serialized path/velocity/sticking-point data from the CV service
  outputKey     String? // storage key of the annotated output video, if you generate one
  createdAt     DateTime @default(now())
}
```

This is a starting point, not gospel — adjust field names/types once Phase 2/3 (Auth, Workout Logger) are actually built out.

## 4. Video upload & processing flow

Recommended flow once you move past local-disk dev storage:

1. Frontend requests a **pre-signed upload URL** from the backend (`POST /videos/upload-url`). The backend creates a `Video` row (`status: uploaded`) and returns a short-lived URL scoped to that one object key.
2. Frontend uploads the video **directly to object storage** using that URL — it never passes through your Express server. This matters once videos get large; proxying big file uploads through your own backend wastes bandwidth and memory.
3. Frontend tells the backend the upload finished (`POST /videos/:id/complete`). Backend flips status to `processing` and enqueues a job for the cv-service (a simple queue table, or a message queue like Redis/BullMQ if this grows).
4. The cv-service pulls the video from object storage, runs the OpenCV/MediaPipe analysis, writes results back (bar path JSON + optionally an annotated output video), and calls back to the Express API to save a `BarbellAnalysis` row and flip `Video.status` to `done` (or `failed`, with a reason, if it errors).
5. Frontend polls or subscribes for status, then fetches a **short-lived signed playback URL** for the video/output when ready — never serve raw permanent public URLs to videos, since these are personal recordings of the user's body.

Practical limits worth setting from the start: max upload size (e.g. 250MB), max duration (e.g. 2 minutes — plenty for a single lift), and accepted formats (mp4/mov). Reject anything else client-side before it burns bandwidth.

## 5. Access control & privacy

- Every video and analysis record is scoped to `userId`. Every query in the API must filter by the logged-in user's id — never trust a video ID alone from the client without checking ownership.
- Object storage keys should be namespaced per user (`videos/{userId}/...`) so a bug in one place doesn't leak across users just from a guessable ID.
- Treat videos as sensitive personal data (they're recordings of someone's body/face). Don't log video contents or URLs in plaintext application logs, and don't make bucket objects publicly readable — always serve via signed, time-limited URLs.
- Worth adding eventually: an account settings option to delete all of a user's videos, and a full account-deletion flow that also purges their object storage files, not just the DB rows.

## 6. Retention & cost control

Videos are the expensive part of this system (storage + bandwidth), so decide a retention policy rather than keeping everything forever by default:

- Option A: keep raw uploaded video only until analysis completes, then delete it and keep just the (much smaller) annotated output + JSON metrics.
- Option B: let the user choose per-video whether to keep the original ("save to my library" vs. "analyze and discard").
- Either way, a scheduled cleanup job (cron, or a serverless scheduled function) that deletes videos past a retention window keeps storage costs predictable as usage grows.

## 7. Environment progression

| Environment | Database | Video storage |
|---|---|---|
| Local dev | SQLite (already the plan per README) | Local disk folder |
| Production | Postgres (e.g. Supabase, Neon, or Railway — all have generous free tiers) | Cloudflare R2 or Backblaze B2 |

Keep all storage access (both DB and video) behind a small service module (e.g. `services/storage.ts`) so swapping local disk for R2/S3 later is a one-file change, not a rewrite.

## Open decisions worth revisiting with Reed

- Which object storage provider (R2 vs B2 vs S3) — depends on expected usage/budget once this has real users.
- Session-cookie auth vs JWT — recommended session-cookie above, but revisit if this ever needs a separate mobile app talking to the same API.
- Retention policy for raw videos (keep forever vs. delete after processing) — affects both storage cost and whether users can re-run analysis later with improved CV models.

## 8. Self-hosting on a home Linux server (revised for actual deployment plan)

Reed's plan: run this on an old Linux machine at home, accessed over the private LAN via browser (not exposed to the public internet). This actually simplifies most of the "production" section above — no cloud dependency is needed at all, since the machine itself is the permanent home for everything.

### What changes from the cloud-hosted assumptions above

- **Video storage**: local disk on the Linux box (e.g. `/srv/fittrack/videos/{userId}/...`) *is* the production storage — no need for S3/R2/B2. You own the disk, there's no bandwidth cost on a LAN, and nothing needs to be internet-reachable.
- **Database**: SQLite is fine to keep permanently for a single-household app with low concurrent write volume. Only consider Postgres if multiple people saving data at the exact same moment ever causes lock contention (unlikely at family scale).
- **Backups matter more now, not less**: everything lives on one physical machine, so a drive failure is total data loss with no cloud redundancy behind it. Periodically back up `dev.db` and the videos folder to an external drive or a cheap cloud backup target.

### Deployment steps on the Linux machine

1. Install Node.js, Python, and git on that machine (same tools as your Mac).
2. `git clone https://github.com/Rhin11/workout-app.git` there instead of copying files by hand, so future updates are just `git pull`.
3. Set real values in `.env` on that machine — especially a real random `JWT_SECRET`, not the `change-me` placeholder.
4. Run each service (backend, cv-service, and the built frontend) as a background service that survives reboots — a systemd unit per service, or `pm2` for the Node processes — rather than leaving a terminal window open.
5. Build the frontend for production (`npm run build` inside `fittrack/`) and serve the static output with something like nginx, instead of running the Vite dev server permanently. Bind the backend and cv-service to `0.0.0.0` (not `127.0.0.1`) so other devices on the network can reach them.
6. Give the machine a fixed local IP — a static IP or a DHCP reservation in your router — so the address doesn't change and break bookmarks/shortcuts on your phone.
7. Open the relevant port(s) in that machine's own firewall (e.g. `ufw allow 3000`) so other devices on the LAN can connect. You do **not** need to open anything on your home router or expose it to the internet — this stays LAN-only.
8. Access it from any device in the house at `http://<machine's LAN IP>:<port>` — e.g. `http://192.168.1.50:3000`.

### Catch: live camera recording needs HTTPS

If you ever want to record barbell videos directly from a phone/laptop browser (rather than uploading a file that was already recorded with the phone's normal camera app), browsers only allow camera access (`getUserMedia`) from a "secure context" — plain `http://` on a LAN IP will be blocked, only `https://` or `localhost` qualify. Two LAN-friendly ways around this:

- Put a reverse proxy like **Caddy** in front of everything — it can generate and serve HTTPS automatically, including for a purely local setup (using its own local CA you trust once per device).
- Use **Tailscale** (free for personal use) to give the machine a stable name with automatic HTTPS via MagicDNS — this also lets you reach it from outside the house if you ever want that, without opening your home router at all.

If you're fine always uploading a pre-recorded video file instead of recording live in the browser, you can skip HTTPS entirely and this concern goes away.
