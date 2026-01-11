
import os
from flask import Flask
from models import db, User
from dotenv import load_dotenv

# Using the same remote URL that worked for setup
NEON_DB_URL = "postgresql+psycopg2://neondb_owner:npg_YAhykjb15uXz@ep-odd-sea-ahy6x0t8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = NEON_DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def create_initial_user():
    print("Connecting to REMOTE Neon Database to create user...")
    with app.app_context():
        try:
            # Check if user exists
            if User.query.filter_by(username='admin').first():
                print("User 'admin' already exists!")
                return

            # Create User
            new_user = User(username='admin', email='admin@turfics.com', role='admin')
            new_user.set_password('admin123')
            
            db.session.add(new_user)
            db.session.commit()
            
            print("SUCCESS! Created user:")
            print("Username: admin")
            print("Password: admin123")
            print("Role: admin")
            
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    create_initial_user()
