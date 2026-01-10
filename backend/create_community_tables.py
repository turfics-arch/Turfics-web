from app import app, db
from models import Community, CommunityMember, CommunityMessage

with app.app_context():
    print("Creating community tables...")
    try:
        # Create specific tables
        Community.__table__.create(db.engine)
        CommunityMember.__table__.create(db.engine)
        CommunityMessage.__table__.create(db.engine)
        print("Community tables created successfully!")
    except Exception as e:
        print(f"Error creating tables (they might already exist): {e}")
