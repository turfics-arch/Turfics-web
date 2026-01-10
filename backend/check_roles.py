from app import app, db
from models import User
from sqlalchemy import func

with app.app_context():
    # Get distinct roles and their counts
    roles_stats = db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    
    print("\n" + "="*40)
    print("EXISTING USER ROLES")
    print("="*40)
    
    if not roles_stats:
        print("No users found in database.")
    else:
        for role, count in roles_stats:
            print(f"Role: '{role}' \t(Users: {count})")
    
    print("="*40 + "\n")
