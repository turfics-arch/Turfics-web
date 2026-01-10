from app import app, db
from models import User

with app.app_context():
    print("Checking for users with role 'player'...")
    
    # 1. Find users with 'player' role
    players = User.query.filter_by(role='player').all()
    count = len(players)
    
    if count == 0:
        print("No users found with role 'player'.")
    else:
        print(f"Found {count} users with role 'player'. Migrating them to 'user'...")
        
        # 2. Update role to 'user'
        for u in players:
            print(f" - Updating user: {u.username} (ID: {u.id})")
            u.role = 'user'
            
        # 3. Commit changes
        try:
            db.session.commit()
            print("✅ Successfully migrated all 'player' roles to 'user'.")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {e}")
            
    # 4. Verify
    remaining = User.query.filter_by(role='player').count()
    print(f"\nRemaining users with role 'player': {remaining}")
    
    # List one last time
    from sqlalchemy import func
    roles_stats = db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    print("\nCurrent Roles Distribution:")
    for role, c in roles_stats:
        print(f" - {role}: {c}")
