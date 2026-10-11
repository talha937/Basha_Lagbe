import sys

from database import SessionLocal
from models import User
from schemas import normalize_phone


def main():
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py 01XXXXXXXXX")
        return
    phone = normalize_phone(sys.argv[1])
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == phone).first()
        if user is None:
            print("No user with that number. Register first, then run this again.")
            return
        user.role = "admin"
        db.commit()
        print(f"{user.name} is now an admin")
    finally:
        db.close()


main()