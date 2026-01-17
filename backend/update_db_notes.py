from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        # Check if column exists first (Postgres/SQLite syntax varies but we can try generic or catch error)
        # Assuming SQLite or Postgres based on the environment
        db.session.execute(text("ALTER TABLE tournament_matches ADD COLUMN notes VARCHAR(255)"))
        db.session.commit()
        print("Column 'notes' added successfully to 'tournament_matches' table.")
    except Exception as e:
        db.session.rollback()
        print(f"Error adding column: {e}")
        # If it says it already exists, that's fine too
