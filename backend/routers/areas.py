from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Area
from schemas import AreaOut

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaOut])
def list_areas(db: Session = Depends(get_db)):
    return db.query(Area).filter(Area.is_active.is_(True)).order_by(Area.name).all()