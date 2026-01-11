
from app import app, db, User

def reset_password():
    username = "turf_owner"
    new_pass = "123456"
    
    print(f"--- Resetting Password for '{username}' on REMOTE DB ---")
    
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user:
            print(f"Found user: {user.username} (ID: {user.id})")
            user.set_password(new_pass)
            db.session.commit()
            print(f"✅ Success! Password for '{username}' has been set to '{new_pass}'")
        else:
            print(f"❌ User '{username}' not found!")
            
        # Also let's print all users just in case
        print("\n--- Available Users ---")
        users = User.query.all()
        for u in users:
            print(f"- {u.username} (Role: {u.role})")

if __name__ == '__main__':
    reset_password()
