from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models  # noqa: F401  (registers the tables)
from routers import listings

# Creates tables if they don't exist. Switch to Alembic before a real launch.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Basha Finder API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(listings.router)


@app.get("/")
def root():
    return {"message": "Basha Finder API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
