from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from limiter import limiter
from models import User
from schemas import LoginIn, TokenOut, UserCreate, UserOut, normalize_phone
from security import create_access_token, hash_password, verify_dummy, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

BAD_LOGIN = "Incorrect mobile/email or password"


def _token_response(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=201)
@limiter.limit("10/hour")
def register(request: Request, data: UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower() if data.email else None

    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=409, detail="This mobile number is already registered")
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="This email is already registered")

    user = User(
        name=data.name,
        phone=data.phone,
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This mobile number or email is already registered")
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
def login(request: Request, data: LoginIn, db: Session = Depends(get_db)):
    identifier = data.identifier.strip()
    user = None
    if "@" in identifier:
        user = db.query(User).filter(User.email == identifier.lower()).first()
    else:
        try:
            user = db.query(User).filter(User.phone == normalize_phone(identifier)).first()
        except ValueError:
            user = None

    if user is None:
        verify_dummy(data.password)
        raise HTTPException(status_code=401, detail=BAD_LOGIN)
    if not verify_password(data.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=401, detail=BAD_LOGIN)
    return _token_response(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user