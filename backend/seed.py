from database import SessionLocal, Base, engine
from models import Property

Base.metadata.create_all(bind=engine)

# SAMPLE DATA for development only. Replace with real listings before launch.
SAMPLES = [
    dict(title="2 BHK Apartment", area="Dhanmondi", rent=18000, bedrooms=2, bathrooms=2, sqft=900,
         description="Well-maintained 2 bedroom apartment with a dining area and modern kitchen."),
    dict(title="3 BHK Apartment", area="Mirpur", rent=25000, bedrooms=3, bathrooms=3, sqft=1200,
         description="Spacious 3 bedroom apartment with parking and 24/7 security."),
    dict(title="1 Room (Single)", area="Uttara", rent=12000, bedrooms=1, bathrooms=1, sqft=450,
         description="Compact single room, ideal for students or a single professional."),
    dict(title="3 BHK Apartment", area="Gulshan", rent=30000, bedrooms=3, bathrooms=3, sqft=1500,
         description="Bright 3 bedroom apartment close to markets, schools and hospitals."),
    dict(title="2 BHK Apartment", area="Bashundhara", rent=15000, bedrooms=2, bathrooms=2, sqft=1000,
         description="Quiet 2 bedroom apartment with lift access and a generator."),
    dict(title="2 BHK Apartment", area="Dhanmondi", rent=22000, bedrooms=2, bathrooms=2, sqft=1100,
         description="Renovated 2 bedroom apartment in a calm lane near the lake."),
]

db = SessionLocal()
try:
    if db.query(Property).count() == 0:
        db.add_all([Property(**s) for s in SAMPLES])
        db.commit()
        print(f"Added {len(SAMPLES)} sample properties")
    else:
        print("Table already has data, nothing added")
finally:
    db.close()