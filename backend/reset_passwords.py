from app import app, db
from models import User

with app.app_context():
    print("Resetting password for academy@demo.com...")
    user = User.query.filter_by(email='academy@demo.com').first()
    if user:
        user.set_password('password123')
        db.session.commit()
        print(f"Password for {user.email} has been reset to 'password123'.")
    else:
        print("User academy@demo.com not found.")
        
    print("\nResetting password for coach@demo.com...")
    coach = User.query.filter_by(email='coach@demo.com').first()
    if coach:
        coach.set_password('password123')
        db.session.commit()
        print(f"Password for {coach.email} has been reset to 'password123'.")
        
    print("\nResetting password for player1@demo.com...")
    player = User.query.filter_by(email='player1@demo.com').first()
    if player:
        player.set_password('password123')
        db.session.commit()
        print(f"Password for {player.email} has been reset to 'password123'.")

    print("\nResetting password for admin@turfics.com...")
    admin = User.query.filter_by(email='admin@turfics.com').first()
    if admin:
        admin.set_password('password123')
        db.session.commit()
        print(f"Password for {admin.email} has been reset to 'password123'.")

    print("\nResetting password for owner@turf.com...")
    owner = User.query.filter_by(email='owner@turf.com').first()
    if owner:
        owner.set_password('password123')
        db.session.commit()
        print(f"Password for {owner.email} has been reset to 'password123'.")
