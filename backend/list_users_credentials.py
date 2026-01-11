from app import app, db
from models import User

with app.app_context():
    users = User.query.all()
    print("\n--- USER LIST ---")
    for u in users:
        print(f"User: {u.username}, Email: {u.email}, Role: {u.role}")
    print("-----------------\n")
