from app import app, db, User, Booking, MatchRequest, MatchJoinRequest
from flask_jwt_extended import create_access_token

def test_self_join():
    with app.app_context():
        # 1. Get User
        user = User.query.filter_by(username='Player Test 1').first()
        if not user:
            print("User 'Player Test 1' not found")
            return

        print(f"Testing with User: {user.username} (ID: {user.id})")

        # 2. Find a booking to link (any booking)
        booking = Booking.query.first()
        if not booking:
            print("No bookings found to create a match stub.")
            return

        # 3. Create a MatchRequest stub (if one doesn't exist for this user)
        match = MatchRequest.query.filter_by(creator_id=user.id).first()
        if not match:
            print("Creating test match...")
            match = MatchRequest(
                creator_id=user.id,
                booking_id=booking.id, # Link to any booking
                sport='ValidationBall',
                players_needed=5,
                cost_per_player=100,
                status='open'
            )
            db.session.add(match)
            db.session.commit()
        else:
            print(f"Using existing match {match.id}")
            # Ensure it is open
            match.status = 'open'
            db.session.commit()

        # 4. Attempt to Join using test_client
        with app.test_client() as client:
            # Generate token (identity as string to match standard JWT (usually strings), but checking cast logic)
            token = create_access_token(identity=str(user.id)) 
            
            headers = {'Authorization': f'Bearer {token}'}
            
            # Clear existing join request if any to allow fresh test
            existing = MatchJoinRequest.query.filter_by(match_id=match.id, user_id=user.id).first()
            if existing:
                print("Clearing existing join request...")
                db.session.delete(existing)
                db.session.commit()
                
            print(f"Attempting to join match {match.id} as user {user.id}...")
            res = client.post(f'/api/matches/{match.id}/join', headers=headers)
            
            print(f"Response Status: {res.status_code}")
            print(f"Response Data: {res.get_json()}")
            
            if res.status_code == 201:
                print("VALIDATION SUCCESS: User joined their own match.")
            else:
                print("VALIDATION FAILURE: Could not join match.")

if __name__ == "__main__":
    test_self_join()
