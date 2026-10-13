# Running Basha Finder

## Start the complete project

Open PowerShell in the repository root:

```powershell
cd F:\Projects\Basha-Finder
npm run dev
```

This opens two terminal windows:

- Frontend: http://localhost:5173/
- Backend: http://127.0.0.1:8000/health

Keep both windows open while using the app.

## Build only

```powershell
cd F:\Projects\Basha-Finder\frontend
npm run build
```

`npm run build` checks and generates the production frontend files. It does not start the development server.

## Start only the frontend

```powershell
cd F:\Projects\Basha-Finder\frontend
npm run dev
```

The backend must still be running separately for listings, authentication, and other API features.
