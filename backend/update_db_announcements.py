from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE tournament_announcements ADD COLUMN title VARCHAR(100)"))
        db.session.commit()
        print("Column 'title' added successfully to 'tournament_announcements' table.")
    except Exception as e:
        db.session.rollback()
        print(f"Error adding column: {e}")
