from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from limiter import limiter
from routers import areas, auth, inquiries, landlord, listings

app = FastAPI(title="Basha Finder API", version="0.2.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(areas.router)
app.include_router(listings.router)
app.include_router(inquiries.router)
app.include_router(landlord.router)


@app.get("/")
def root():
    return {"message": "Basha Finder API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}