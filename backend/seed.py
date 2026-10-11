import re
from areas_data import AREAS_BY_THANA
from database import Base, SessionLocal, engine
from models import Area, Property



def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# SAMPLE listings for development only. Delete before the public launch.
SAMPLES = [
    dict(title="2 BHK Apartment", area="Dhanmondi", rent=18000, bedrooms=2, bathrooms=2, sqft=900,
         description="Well-maintained 2 bedroom apartment with a dining area and modern kitchen."),
    dict(title="3 BHK Apartment", area="Mirpur 10", rent=25000, bedrooms=3, bathrooms=3, sqft=1200,
         description="Spacious 3 bedroom apartment with parking and 24/7 security."),
    dict(title="1 Room (Single)", area="Uttara Sector 7", rent=12000, bedrooms=1, bathrooms=1, sqft=450,
         description="Compact single room, ideal for students or a single professional."),
    dict(title="3 BHK Apartment", area="Gulshan 1", rent=30000, bedrooms=3, bathrooms=3, sqft=1500,
         description="Bright 3 bedroom apartment close to markets, schools and hospitals."),
    dict(title="2 BHK Apartment", area="Bashundhara R/A", rent=15000, bedrooms=2, bathrooms=2, sqft=1000,
         description="Quiet 2 bedroom apartment with lift access and a generator."),
    dict(title="2 BHK Apartment", area="Lalmatia", rent=22000, bedrooms=2, bathrooms=2, sqft=1100,
         description="Renovated 2 bedroom apartment in a calm lane."),
]

db = SessionLocal()
try:
    # 1. Areas: add any that are missing
    existing = {slug for (slug,) in db.query(Area.slug).all()}
    added = 0
    for thana, names in AREAS_BY_THANA.items():
        for name in names:
            slug = slugify(name)
            if slug not in existing:
                db.add(Area(name=name, thana=thana, slug=slug))
                existing.add(slug)
                added += 1
    db.commit()
    print(f"Areas added: {added}")

    # 2. Sample properties only if the table is empty
    if db.query(Property).count() == 0:
        for s in SAMPLES:
            area = db.query(Area).filter(Area.name == s["area"]).one()
            data = {k: v for k, v in s.items() if k != "area"}
            db.add(Property(area_id=area.id, **data))
        db.commit()
        print(f"Sample properties added: {len(SAMPLES)}")
finally:
    db.close()