# PharmCare MIS

A full‑stack Pharmacy Management Information System.

- Client: React 18 + TypeScript + Vite + Tailwind (pnpm)
- Server: Django 5 + DRF + SimpleJWT
- DB: PostgreSQL (default) or SQLite (dev)
- Auth: JWT (access/refresh)

## Features
- Medicines, Suppliers, Stock, and Sales modules
- React Query caching, search and filtering in UI
- Admin theming via Jazzmin
- JWT auth with refresh, API error handling
- Production CORS, security, and static file handling (Whitenoise)

## Monorepo Layout
```
client/   # React app (Vite)
server/   # Django API (DRF)
```

## Quick Start (Local)

### Prerequisites
- Node 18+ and pnpm (recommended) or npm
- Python 3.11+ (virtualenv recommended)
- PostgreSQL 14+ (optional; SQLite works for dev)

### 1) Server (Django API)
```
cd server
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp example.env .env
# Edit .env as needed (see Environment section)

# Run migrations and start
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver 0.0.0.0:8000
```
API will be available at http://localhost:8000/.

### 2) Client (Vite React)
```
cd client
pnpm install
# or: npm install

# Set API base URL for local dev
# .env.local
VITE_API_BASE_URL=http://localhost:8000

pnpm dev  # or: npm run dev
```
App runs at http://localhost:5173/ (default Vite port).

## Environment

### Client `.env`
- `VITE_API_BASE_URL` (required in production): Base URL of the Django API.
- Optional:
  - `VITE_APP_NAME`
  - `VITE_APP_VERSION`
  - `VITE_ENABLE_ANALYTICS` ("1"/"0")
  - `VITE_ENABLE_DEBUG` ("1"/"0")

### Server `.env` (see `server/example.env`)
- `ENVIRONMENT` = `development` | `production`
- `DJANGO_SECRET_KEY` (required in production)
- `DJANGO_DEBUG` = `0|1` (defaults to 0 in prod, 1 in dev)
- `DJANGO_ALLOWED_HOSTS` = `host1,host2`
- DB (Postgres by default):
  - `DB_ENGINE` = `postgres` | `sqlite`
  - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- CORS (prod):
  - `CORS_ALLOWED_ORIGINS` = `https://your-site.netlify.app,https://example.com`
- JWT:
  - `JWT_ACCESS_MINUTES` (default 60 in prod, 30 dev)
  - `JWT_REFRESH_DAYS` (default 7)
- Optional platform vars (auto‑handled if present):
  - `RENDER_EXTERNAL_HOSTNAME`, `RENDER_EXTERNAL_URL`, `REDIS_URL`

## Development Commands

### Client
```
pnpm dev        # start dev server
pnpm build      # production build
pnpm preview    # preview production build
pnpm lint       # lint code
```

### Server
```
python manage.py migrate
python manage.py runserver
python manage.py createsuperuser
```

## API Overview
Default pagination is PageNumberPagination with `PAGE_SIZE=50`.
List endpoints return either arrays (dev) or paginated objects in production (`{ results: [...] }`). The client normalizes both.

Key routes (prefix `api/`):
- `medicines/` CRUD
- `suppliers/` CRUD
- `stock/` CRUD and summaries
  - `stock/summary/`
  - `stock/low_stock_alerts/`
  - `stock/expiring_soon/`
  - `stock/expired/`
- `sales/` create/list
- Auth (see `core/auth.py`): SimpleJWT endpoints for login/refresh

## Deployment

### Client on Netlify
- Base directory: `client`
- Build command: `pnpm install && pnpm run build`
- Publish directory: `client/dist`
- Env vars: set `VITE_API_BASE_URL` to your API URL
- SPA routing: `client/public/_redirects` exists with:
```
/*    /index.html   200
```

### Server on Render (or any container platform)
- `server/Dockerfile`, `server/docker-compose.yml`, `server/nginx.conf`, `server/gunicorn.conf.py` provided
- Ensure env vars from the “Server `.env`” section are set
- Static files: served by Whitenoise; run `python manage.py collectstatic` in CI/CD if needed
- Allowed hosts and CORS:
  - add your domain(s) to `DJANGO_ALLOWED_HOSTS`
  - set `CORS_ALLOWED_ORIGINS` to your frontend origin(s)

## Docker (Optional)
A compose file is provided for local containers.
```
cd server
docker compose up --build
```
Adjust environment in `server/docker-compose.yml` or export from your shell.

## Notes & Conventions
- Client package manager: pnpm (repo includes a pnpm lock)
- TypeScript strictness and ESLint configured for client
- React Query used for caching; mutations invalidate relevant queries
- Server defaults to Postgres; set `DB_ENGINE=sqlite` for simple local runs

## Troubleshooting
- Client 404s on refresh: ensure Netlify `_redirects` is deployed
- CORS errors in production: set `CORS_ALLOWED_ORIGINS` to the exact frontend origin(s)
- 401s after token expiry: refresh handled automatically; confirm refresh endpoint is reachable
- Build failing on Netlify with esbuild/swc scripts: enable with `pnpm approve-builds` if using restricted scripts, or run default build as configured

## License
MIT (or your preferred license). Update this section if different.
