# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This is a small hackathon project that integrates with the ElevenLabs API. The repository is split into a minimal Python/Flask backend and a React + Vite frontend.

## High-level architecture

### Top-level layout

- `backend/`: Python backend implemented with Flask. Current entrypoint is `backend/app.py`.
- `frontend/`: React single-page application bootstrapped with Vite. Main entry is `frontend/src/main.jsx`, which renders `frontend/src/App.jsx`.
- `backend/venv/`: A committed Python virtual environment. Treat this directory as generated/ephemeral — do not edit files inside it. Prefer using a local venv instead when modifying dependencies.

### Backend (Flask)

- `backend/app.py` defines a single Flask application instance and one route:
  - `GET /`: returns a simple string ("Flask is running!") and serves as a health check / sanity check endpoint.
- There is no current integration code for ElevenLabs in the backend; expect future work to add routes and service code here to call the ElevenLabs API.
- No dedicated configuration, dependency tracking file (e.g. `requirements.txt`), or test suite is present yet.

### Frontend (React + Vite)

- The frontend is a standard Vite + React setup:
  - `frontend/src/main.jsx` mounts `<App />` into the `#root` DOM node.
  - `frontend/src/App.jsx` is the main component; currently it is the default Vite starter (logo, counter, etc.).
- Tooling:
  - Vite config lives in `frontend/vite.config.js` and uses `@vitejs/plugin-react`.
  - ESLint is configured via `eslint.config.js` and wired through the `lint` npm script.
- There are no frontend tests or testing dependencies configured yet.

## Commands and workflows

All commands below assume you run them from the repository root unless noted otherwise.

### Frontend: install, develop, build, lint

From `frontend/`:

- Install dependencies:
  - `cd frontend`
  - `npm install`
- Run the dev server (hot reload):
  - `npm run dev`
- Build for production:
  - `npm run build`
- Preview the production build locally:
  - `npm run preview`
- Lint the frontend codebase:
  - `npm run lint`

> Note: There is no test runner configured for the frontend (no Jest, Vitest, etc.). Once a test framework is added, extend this section with the appropriate `npm test` / single-test commands.

### Backend: run the Flask app

From `backend/`:

- Ensure Python and Flask are available in your environment.
- Recommended approach is to create a local virtual environment (rather than relying on the committed `backend/venv/`), install dependencies into it, and keep dependency metadata in a requirements-style file.
- Run the Flask dev server:
  - `cd backend`
  - `python app.py`

This starts the app in debug mode, bound to `0.0.0.0:5000`, exposing a single `/` route that returns a plain text response.

> Note: There is currently no backend test suite or linting configuration (e.g. pytest, flake8, ruff). When such tooling is introduced, add the corresponding commands (including how to run an individual test) here.

## Guidance for future Warp agents

- Prefer editing application code in `backend/app.py` and `frontend/src/**` rather than touching the committed virtual environment under `backend/venv/`.
- When adding ElevenLabs integration, centralize external API calls in dedicated modules (e.g. a service layer in `backend/`) so both routes and potential background jobs can share them.
- If you introduce new tooling (tests, formatters, type checkers), update this `WARP.md` with the exact commands for running the whole suite and a single test or file, so future agents can use them reliably.
