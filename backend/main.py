from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from limiter import limiter
from routers import (
    admin, areas, auth, contact_requests, landlord, listings, reports,
)

app = FastAPI(title="Basha Finder API", version="0.3.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def strip_vercel_api_prefix(request, call_next):
    """Services rewrites preserve /api; backend routes are defined without it."""
    path = request.scope["path"]
    if path == "/api" or path.startswith("/api/"):
        request.scope["path"] = path[4:] or "/"
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(areas.router)
app.include_router(listings.router)
app.include_router(contact_requests.router)
app.include_router(reports.router)
app.include_router(landlord.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Basha Finder API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}