# Vercel deployment

The repository root is the Vercel project root. The API entrypoint is:

```text
api/index.py
```

It loads the FastAPI app from `backend/main.py` and keeps the backend's existing
local imports working.

The frontend is built from `frontend/` by the root `vercel.json` configuration.
Set the Vercel project root to the repository root; do not set it to `frontend/`
or `backend/`.

## Required Vercel environment variable

In the Vercel project settings, add this variable for Preview and Production:

```text
DATABASE_URL=postgresql://...
```

Use the hosted PostgreSQL/Supabase connection string. Do not commit the value
to the repository.

## Deploy

From the repository root:

```powershell
vercel
```

The production frontend calls the API through `/api`. Local development still
uses `http://127.0.0.1:8000`.
