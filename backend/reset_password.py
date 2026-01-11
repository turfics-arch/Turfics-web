from app import app, db
from models import User, bcrypt

with app.app_context():
    user = User.query.filter_by(username='turf_owner').first()
    if user:
        user.set_password('password123')
        db.session.commit()
        print("Password for 'turf_owner' reset to 'password123'")
    else:
        print("User 'turf_owner' not found")
