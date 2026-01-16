from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE community_members ADD COLUMN last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("Successfully added last_read_at column to community_members table.")
    except Exception as e:
        print(f"Error (column might already exist): {e}")
