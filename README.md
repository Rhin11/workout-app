# FitTrack

A unified fitness app: Workout Logger, Macro Tracker, and Barbell Path Analyzer.

## Tech Stack

- **Frontend**: React (web) + Vite + TypeScript, React Router, Tailwind CSS v4, Zustand, Axios
- **Backend**: Node.js + Express + Prisma (SQLite in dev)
- **CV Service**: Python FastAPI + OpenCV + MediaPipe

---

## Phase 1 — Project Scaffolding (COMPLETE)

### Run the frontend

```bash
cd fittrack
npm run dev
# Vite serves on http://localhost:5173
# Routes: /workout, /macros, /barbell (/ redirects to /workout)
```

### Run the backend

```bash
cd backend
npm run dev
# Starts Express on http://localhost:3000
# GET /health → { status: "ok" }
```

### Run the cv-service

```bash
cd cv-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# GET /health → { status: "ok" }
```

---

## Folder Structure

```
fittrack/          React (Vite) web app
backend/           Node.js + Express API
cv-service/        Python FastAPI barbell tracker
```

### Frontend `src/`

| Path | Purpose |
|------|---------|
| `constants/theme.ts` | Color tokens (no hardcoded hex in components) |
| `App.tsx` | Top nav bar + React Router routes (Workout / Macros / Barbell) |
| `main.tsx` | Mounts app inside `<BrowserRouter>` |
| `pages/` | One file per route page |
| `components/` | Reusable UI components grouped by feature |
| `store/` | Zustand stores |
| `services/api.ts` | Axios instance — all API calls go through here |
| `services/foodApi.ts` | Open Food Facts helpers (Phase 4) |
| `services/db.ts` | Client persistence placeholder (IndexedDB/backend, later phase) |

---

## Phases

| Phase | Status |
|-------|--------|
| 1 — Scaffolding | ✅ Complete (React web) |
| 2 — Auth System | ⏳ Next |
| 3 — Workout Logger | ⏳ |
| 4 — Macro Tracker | ⏳ |
| 5 — Barbell Path Analyzer | ⏳ |
| 6 — Polish + Deployment | ⏳ |
