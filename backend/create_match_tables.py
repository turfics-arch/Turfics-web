from app import app, db
from models import MatchRequest, MatchJoinRequest

with app.app_context():
    db.create_all()
    print("Matchmaking tables created successfully!")
