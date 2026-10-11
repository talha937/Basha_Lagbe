import os
from dotenv import load_dotenv

load_dotenv()


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is missing from backend/.env")
    return value


JWT_SECRET_KEY = _required("JWT_SECRET_KEY")
if len(JWT_SECRET_KEY) < 32:
    raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters")
JWT_ALGORITHM = "HS256"  # pinned on purpose
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

SUPABASE_URL = _required("SUPABASE_URL").rstrip("/")
SUPABASE_SERVICE_KEY = _required("SUPABASE_SERVICE_KEY")
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "property-images")