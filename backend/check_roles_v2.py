from app import app, db
from models import User

with app.app_context():
    roles = db.session.query(User.role).distinct().all()
    roles = sorted([r[0] for r in roles])
    
    print("ROLES_LIST_START")
    for r in roles:
        print(f"- {r}")
    print("ROLES_LIST_END")
