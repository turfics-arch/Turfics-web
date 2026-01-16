import os
from app import app, db
from models import User

def verify_auth():
    print("Connecting to database...")
    with app.app_context():
        # Check specific user
        username = "admin"
        print(f"Checking user: {username}")
        user = User.query.filter_by(username=username).first()
        
        if user:
            print(f"✅ User found: {user.username} (ID: {user.id})")
            print(f"   Email: {user.email}")
            print(f"   Hash stored: {user.password_hash[:20]}...")
            
            # Check password
            password = "password123"
            is_valid = user.check_password(password)
            print(f"   Password '{password}' valid? {is_valid}")
            
            if not is_valid:
                print("   ❌ Password mismatch! Attempting to reset...")
                # Try setting it again to see if environment differs
                user.set_password(password)
                db.session.commit()
                print("   Password reset. verifying again...")
                print(f"   Now valid? {user.check_password(password)}")
        else:
            print(f"❌ User '{username}' not found in database!")

if __name__ == "__main__":
    verify_auth()
