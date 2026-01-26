import os
from app import app, db
from models import User
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

with app.app_context():
    print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    try:
        # Test connection
        db.session.execute(db.text('SELECT 1'))
        print("Database connection successful.")
        
        # Test User
        user = User.query.first()
        if user:
            print(f"Found user: {user.username}, Role: {user.role}")
            print(f"Hash: {user.password_hash}")
            
            # Test Hash
            test_pass = "password123" 
            try:
                is_valid = bcrypt.check_password_hash(user.password_hash, test_pass)
                print(f"Password check for '{test_pass}': {is_valid}")
            except Exception as e:
                print(f"Bcrypt Error: {e}")
        else:
            print("No users found in DB.")
            
    except Exception as e:
        print(f"Database Error: {e}")
