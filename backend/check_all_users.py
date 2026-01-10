from app import app, db
from models import User

with app.app_context():
    print("\nchecking specific users...")
    academy_user = User.query.filter_by(email='academy@demo.com').first()
    if academy_user:
        print(f"Academy User: {academy_user.username}, Role: '{academy_user.role}'")
    else:
        print("Academy User NOT found")

    users = User.query.all()
    print(f"\nTotal users: {len(users)}")
    for u in users:
        print(f" - {u.username} ({u.email}) [{u.role}]")
