from app import app, db
from models import User
from sqlalchemy import func

with app.app_context():
    # query all distinct roles actually present in the data
    roles = db.session.query(User.role).distinct().all()
    roles = [r[0] for r in roles]
    
    print("\n" + "="*40)
    print("ACTUAL ROLES FOUND IN DB")
    print("="*40)
    print(f"Roles found: {roles}")
    
    # Also check TeamMember roles just in case user is confused
    try:
        from models import TeamMember
        team_roles = db.session.query(TeamMember.role).distinct().all()
        team_roles = [r[0] for r in team_roles]
        print(f"Team Member Roles found: {team_roles}")
    except:
        print("Could not query TeamMember roles")
        
    print("="*40 + "\n")
