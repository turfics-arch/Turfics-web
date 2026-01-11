from app import app, db
from models import User

with app.app_context():
    users = User.query.all()
    print(f"Resetting passwords for {len(users)} users...")
    
    for user in users:
        user.set_password('password123')
        print(f" - Password reset for: {user.username}")
    
    db.session.commit()
    print("\nSUCCESS: All user passwords have been reset to 'password123'")
