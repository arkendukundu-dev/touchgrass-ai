# touchgrass 🌱

https://touchgrass-ai.vercel.app/

**A little less scrolling. A little more living.**

Touchgrass is an open-source, offline-first micro-adventure companion. It uses open-weight AI (Ollama + Qwen 2.5 by default) to suggest tiny real-world missions that get people away from the screen and back into the world. It also has a built-in quest engine, so the app remains useful when a model or internet connection is unavailable.

## Why open AI?

- **Runs locally:** connect Ollama on your own machine instead of sending prompts to a paid, closed AI API.
- **Your data stays yours:** quest completion, streaks, and XP are stored in browser local storage. No account or analytics are required.
- **Swappable models:** set `OLLAMA_MODEL` to another model you have pulled in Ollama.
- **Works without AI:** the deterministic built-in quest library is the fallback, not a dead-end error page.
- **Built for real life:** generated quests are constrained to be practical, low-cost, inclusive, and not dependent on sharing location or buying anything.

## Features

- Responsive, editorial-style dashboard with a Hacktoberfest-friendly open-source aesthetic
- Daily quest cards, completion states, XP, streak and progress indicators
- Remix quests based on time, energy and preferred category
- Add your own quests
- My Journey timeline and Field Notes inspiration page
- Browser-persisted progress
- Optional local AI generation via Ollama / Qwen 2.5 3B
- FastAPI backend with `/api/health`, `/api/quests`, and `/api/custom-quest`
- Offline fallback quest engine

## Tech stack

- Frontend: React, Vite, Lucide icons, plain CSS
- Backend: Python, FastAPI, Pydantic, HTTPX
- Open model: Ollama (default `qwen2.5:3b`)

## Run locally

Requirements: Node.js 18+, Python 3.10+, and optionally [Ollama](https://ollama.com/).

### 1. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install and run:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API docs are at `http://localhost:8000/docs`.

### 2. (Optional) Enable local open-weight AI

Install Ollama, then run:

```bash
ollama pull qwen2.5:3b
ollama serve
```

If Ollama is running on the same machine as the backend, the app detects it automatically. If it is elsewhere, set `OLLAMA_URL` before starting FastAPI. You can change the model with `OLLAMA_MODEL`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the FastAPI server at port 8000. The frontend still works without the backend; quest remixing falls back to the local built-in quest library.

## Environment variables

Copy `backend/.env.example` to `backend/.env` and set values as needed. For a deployed frontend, copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` to your backend origin. For a simple local setup, defaults work. FastAPI does not automatically load `.env` files; export the variables in your shell or install `python-dotenv` and load it explicitly if you want automatic loading.

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server address |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Open-weight model to use |
| `CORS_ORIGINS` | local Vite origins | Comma-separated allowed browser origins |

## API

- `GET /api/health` — API status and whether the configured Ollama model is available
- `GET /api/quests` — returns three offline quests
- `POST /api/quests` — generates quests from the local model when available, otherwise uses the built-in library
- `POST /api/custom-quest` — validates and formats a user-created quest

Example request:

```json
{
  "category": "Notice more",
  "energy": "A little low",
  "minutes": 15,
  "count": 3
}
```

## Deployment notes

- **Frontend:** deploy `frontend` as a Vite project to Vercel or Netlify. Set `VITE_API_BASE_URL` to your deployed backend origin (for example, `https://your-api.onrender.com`). Vite’s dev proxy only applies locally. A starter Render blueprint is included in `render.yaml`.
- **Backend:** deploy `backend/main.py` to a Python host using `uvicorn main:app --host 0.0.0.0 --port $PORT` and configure `CORS_ORIGINS` to your deployed frontend domain.
- **Local model hosting:** a hosted backend cannot reach Ollama on your laptop by default. For a real public demo, run Ollama on a reachable machine or leave the offline fallback enabled. Do not expose an unauthenticated Ollama endpoint to the public internet.

## Hacktoberfest / contributing

Contributions welcome! Good first issues:

- Add translations for quest cards and field notes
- Add accessible keyboard focus and screen-reader polish
- Add a weekly reflection view
- Add more locally useful, inclusive quests
- Add unit tests for the quest fallback and API validation
- Add a PWA manifest and cache the static shell for offline launch

Please keep the core principle intact: the app should help people leave the screen, not trap them in another feed.

## License

MIT. See [LICENSE](LICENSE).
