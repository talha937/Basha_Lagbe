import io
import logging

import httpx
from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

import settings

log = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_IMAGES_PER_PROPERTY = 10
MAX_PIXELS = 30_000_000
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

_HEADERS = {
    "apikey": settings.SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
}
_BASE = f"{settings.SUPABASE_URL}/storage/v1/object"


def process_image(upload: UploadFile) -> bytes:
    """Validate by actual content (not file name), fix phone rotation, shrink, convert to WebP.
    Re-encoding also strips EXIF metadata, including GPS coordinates from phone photos."""
    data = upload.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"{upload.filename}: photo is larger than 5 MB")
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ALLOWED_FORMATS or img.width * img.height > MAX_PIXELS:
            raise ValueError("unsupported image")
        img = ImageOps.exif_transpose(img).convert("RGB")
    except (UnidentifiedImageError, ValueError, OSError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail=f"{upload.filename}: not a valid JPG, PNG or WebP photo")

    img.thumbnail((1600, 1600))
    out = io.BytesIO()
    img.save(out, format="WEBP", quality=82)
    return out.getvalue()


def upload_image(path: str, data: bytes) -> str:
    try:
        r = httpx.post(
            f"{_BASE}/{settings.STORAGE_BUCKET}/{path}",
            headers={**_HEADERS, "Content-Type": "image/webp", "x-upsert": "false"},
            content=data,
            timeout=20,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Photo storage is unreachable. Please try again.")
    if r.status_code >= 300:
        log.error("Storage upload failed with status %s", r.status_code)
        raise HTTPException(status_code=502, detail="Could not save the photo. Please try again.")
    return f"{_BASE}/public/{settings.STORAGE_BUCKET}/{path}"


def delete_image(path: str) -> None:
    try:
        httpx.delete(f"{_BASE}/{settings.STORAGE_BUCKET}/{path}", headers=_HEADERS, timeout=10)
    except httpx.HTTPError:
        log.warning("Could not delete stored photo %s", path)  # an orphan file is harmless