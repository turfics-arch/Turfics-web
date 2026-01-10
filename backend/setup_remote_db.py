
import os
from flask import Flask
from sqlalchemy import text # Import text specifically
from models import db
from dotenv import load_dotenv

# Hardcode the Neon DB URL for this one-time setup script
# Note: We need to change 'postgresql' to 'postgresql+psycopg2' for SQLAlchemy to be happy
NEON_DB_URL = "postgresql+psycopg2://neondb_owner:npg_YAhykjb15uXz@ep-odd-sea-ahy6x0t8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = NEON_DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def setup_remote_db():
    print("Connecting to REMOTE Neon Database...")
    with app.app_context():
        try:
            # Test connection
            db.session.execute(text('SELECT 1')) # Use text() here
            print("Connection Successful!")
            
            print("Creating tables...")
            db.create_all()
            print("Tables created successfully!")
            
            print("Database setup complete. You are ready to deploy backend!")
            
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    setup_remote_db()
