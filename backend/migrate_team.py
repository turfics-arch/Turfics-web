from app import app, db
from models import Team
from sqlalchemy import text

def recreate_teams_table():
    with app.app_context():
        print("dropping old teams table...")
        # Drop table if exists (using raw SQL because models.py change doesn't auto-migrate without flask-migrate commands which are tricky here)
        # Using SQLAlchemy metadata to drop/create is safer
        Team.__table__.drop(db.engine, checkfirst=True)
        print("Dropped teams table.")
        
        print("Creating new teams table...")
        Team.__table__.create(db.engine)
        print("Created teams table.")
        
        print("Migration done.")

if __name__ == "__main__":
    recreate_teams_table()
