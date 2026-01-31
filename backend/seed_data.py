from app import app, db, User, Turf, TurfGame, TurfUnit, UnitImage, Booking
from datetime import datetime, timedelta
import random

def seed_data():
    with app.app_context():
        print("Starting Seeding...")

        # 1. Create Owner User
        owner_email = "owner@demo.com"
        owner = User.query.filter_by(email=owner_email).first()
        if not owner:
            owner = User(
                username="Demo Owner",
                email=owner_email,
                role="owner"
            )
            owner.set_password("password123")
            db.session.add(owner)
            db.session.commit()
            print(f"Created Owner: {owner.username}")
        else:
            print(f"Owner exists: {owner.username}")

        # 2. Create Turf
        turf_name = "Premier Sports Arena"
        turf = Turf.query.filter_by(name=turf_name).first()
        if not turf:
            turf = Turf(
                name=turf_name,
                location="123, Stadium Road, Tech City",
                latitude=12.9716,
                longitude=77.5946,
                owner_id=owner.id,
                amenities="Parking, Changing Rooms, Showers, Floodlights, Cafe",
                facilities="Scoreboard, First Aid",
                rating=4.8,
                image_url="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                opening_time="06:00",
                closing_time="23:00",
                status='active'
            )
            db.session.add(turf)
            db.session.commit()
            print(f"Created Turf: {turf.name}")
        else:
            print(f"Turf exists: {turf.name}")

        # 3. Create Games & Units
        
        # Game 1: Football 5v5
        football_game = TurfGame.query.filter_by(turf_id=turf.id, sport_type="Football").first()
        if not football_game:
            football_game = TurfGame(
                turf_id=turf.id,
                sport_type="Football",
                game_category="team",
                default_price=1200.0,
                slot_duration=60,
                is_active=True
            )
            db.session.add(football_game)
            db.session.commit()
            print("Created Game: Football")

            # Units for Football
            pitch_a = TurfUnit(
                turf_game_id=football_game.id,
                name="Pitch A (Pro)",
                unit_type="PITCH",
                capacity=10,
                size="5-a-side",
                price_override=1500.0,
                has_lighting=True,
                status='active'
            )
            pitch_b = TurfUnit(
                turf_game_id=football_game.id,
                name="Pitch B (Standard)",
                unit_type="PITCH",
                capacity=10,
                size="5-a-side",
                has_lighting=True,
                status='active'
            )
            db.session.add_all([pitch_a, pitch_b])
            db.session.commit()
            print("Created Football Pitches")

            # Images
            img1 = UnitImage(unit_id=pitch_a.id, image_url="https://images.unsplash.com/photo-1556056504-5c7696c4c28d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1353&q=80", caption="Pitch A View 1")
            img2 = UnitImage(unit_id=pitch_b.id, image_url="https://images.unsplash.com/photo-1524012431247-524949b2ee0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", caption="Pitch B View 1")
            db.session.add_all([img1, img2])
            db.session.commit()

        # Game 2: Cricket Box
        cricket_game = TurfGame.query.filter_by(turf_id=turf.id, sport_type="Cricket").first()
        if not cricket_game:
            cricket_game = TurfGame(
                turf_id=turf.id,
                sport_type="Cricket",
                game_category="team",
                default_price=1000.0,
                slot_duration=60,
                is_active=True
            )
            db.session.add(cricket_game)
            db.session.commit()
            print("Created Game: Cricket")

            # Units for Cricket
            net_1 = TurfUnit(
                turf_game_id=cricket_game.id,
                name="Net 1",
                unit_type="NET",
                capacity=12,
                size="Box Cricket",
                has_lighting=True,
                status='active'
            )
            db.session.add(net_1)
            db.session.commit()
            print("Created Cricket Net")
            
            img3 = UnitImage(unit_id=net_1.id, image_url="https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1347&q=80", caption="Net 1 View")
            db.session.add(img3)
            db.session.commit()

        # 4. Create Sample Bookings for TODAY
        print("Seeding Bookings for Today...")
        today = datetime.now().date()
        
        # User for bookings
        player_email = "player@demo.com"
        player = User.query.filter_by(email=player_email).first()
        if not player:
            player = User(username="Rohan Player", email=player_email, role="user")
            player.set_password("password123")
            db.session.add(player)
            db.session.commit()

        # Fetch units
        pitch_a = TurfUnit.query.filter_by(name="Pitch A (Pro)").first()
        
        if pitch_a and player:
             # 1. Confirmed Booking (09:00 - 10:00)
             b1 = Booking(
                 user_id=player.id,
                 turf_unit_id=pitch_a.id,
                 turf_id=turf.id,
                 start_time=datetime.combine(today, datetime.strptime("09:00", "%H:%M").time()),
                 end_time=datetime.combine(today, datetime.strptime("10:00", "%H:%M").time()),
                 total_price=1200.0,
                 status="confirmed",
                 payment_status="paid",
                 payment_mode="online", 
                 booking_source="online"
             )

             # 2. Pending Walk-in (10:00 - 11:00)
             b2 = Booking(
                 user_id=owner.id, # Walk-ins often booked by owner/staff
                 turf_unit_id=pitch_a.id,
                 turf_id=turf.id,
                 start_time=datetime.combine(today, datetime.strptime("10:00", "%H:%M").time()),
                 end_time=datetime.combine(today, datetime.strptime("11:00", "%H:%M").time()),
                 total_price=1200.0,
                 status="confirmed", # Slot is taken
                 payment_status="pending", # Payment pending
                 payment_mode="cash",
                 booking_source="walk-in",
                 guest_name="Walk-in Guest",
                 guest_phone="9876543210"
             )

             # 3. Confirmed Evening (18:00 - 19:00)
             b3 = Booking(
                 user_id=player.id,
                 turf_unit_id=pitch_a.id,
                 turf_id=turf.id,
                 start_time=datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()),
                 end_time=datetime.combine(today, datetime.strptime("19:00", "%H:%M").time()),
                 total_price=1500.0, # Peak price mock
                 status="confirmed",
                 payment_status="paid",
                 payment_mode="upi",
                 booking_source="online"
             )
             
             db.session.add_all([b1, b2, b3])
             db.session.commit()
             print("Created 3 Bookings for Today")

        print("Seeding Complete!")

if __name__ == "__main__":
    seed_data()
