import sys
import os
from datetime import datetime, timedelta
from app import app, db
from models import User, Turf, TurfGame, TurfUnit, Booking

def seed_test_owner():
    with app.app_context():
        print("--- Seeding Test Owner Data ---")

        # 1. Create Test Owner
        owner_email = "testowner@example.com"
        owner_username = "testowner"
        owner_phone = "9998887770"
        
        # Check by email or username to avoid unique constraint errors
        owner = User.query.filter((User.email == owner_email) | (User.username == owner_username)).first()
        
        if not owner:
            owner = User(
                username=owner_username, 
                email=owner_email, 
                role='owner',
                phone_number=owner_phone
            )
            owner.set_password("pass123")
            db.session.add(owner)
            db.session.commit()
            print(f"Created Owner: {owner.username} (ID: {owner.id}) / Pass: pass123")
        else:
            print(f"Owner {owner.username} already exists (ID: {owner.id})")
            # Ensure password is known
            owner.set_password("pass123")
            db.session.commit()
            print("Reset password to 'pass123'")

        # 2. Create Turf: "Premier Arena"
        turf = Turf.query.filter_by(name="Premier Arena", owner_id=owner.id).first()
        if not turf:
            turf = Turf(
                name="Premier Arena",
                location="123 Sports Road, Bangalore",
                owner_id=owner.id,
                rating=4.8,
                image_url="https://images.unsplash.com/photo-1529900748604-07564a03e7a6",
                latitude=12.9716,
                longitude=77.5946,
                status='active',
                amenities="Parking,Restrooms,Water",
                opening_time="06:00",
                closing_time="23:00"
            )
            db.session.add(turf)
            db.session.commit()
            print(f"Created Turf: {turf.name} (ID: {turf.id})")
        else:
            print(f"Turf {turf.name} already exists (ID: {turf.id})")

        # 3. Create Games (Sports)
        # Football
        football_game = TurfGame.query.filter_by(turf_id=turf.id, sport_type="Football").first()
        if not football_game:
            football_game = TurfGame(
                turf_id=turf.id,
                sport_type="Football",
                game_category="Team",
                default_price=1200.0,
                slot_duration=60,
                is_active=True
            )
            db.session.add(football_game)
            db.session.commit()
            print(f"Created Game: Football (ID: {football_game.id})")
        
        # Cricket
        cricket_game = TurfGame.query.filter_by(turf_id=turf.id, sport_type="Cricket").first()
        if not cricket_game:
            cricket_game = TurfGame(
                turf_id=turf.id,
                sport_type="Cricket",
                game_category="Team",
                default_price=1500.0, # Box Cricket price
                slot_duration=60,
                is_active=True
            )
            db.session.add(cricket_game)
            db.session.commit()
            print(f"Created Game: Cricket (ID: {cricket_game.id})")

        # 4. Create Units (Pitches/Courts)
        # Football Pitches
        pitch_a = TurfUnit.query.filter_by(turf_game_id=football_game.id, name="Pitch A").first()
        if not pitch_a:
            pitch_a = TurfUnit(turf_game_id=football_game.id, name="Pitch A", unit_type="PITCH", capacity=10, size="5-a-side")
            db.session.add(pitch_a)
            print("Created Unit: Pitch A")

        pitch_b = TurfUnit.query.filter_by(turf_game_id=football_game.id, name="Pitch B").first()
        if not pitch_b:
            pitch_b = TurfUnit(turf_game_id=football_game.id, name="Pitch B", unit_type="PITCH", capacity=14, size="7-a-side", price_override=1800.0)
            db.session.add(pitch_b)
            print("Created Unit: Pitch B")

        # Cricket Net/Box
        box_1 = TurfUnit.query.filter_by(turf_game_id=cricket_game.id, name="Box Cricket 1").first()
        if not box_1:
            box_1 = TurfUnit(turf_game_id=cricket_game.id, name="Box Cricket 1", unit_type="COURT", capacity=16)
            db.session.add(box_1)
            print("Created Unit: Box Cricket 1")
        
        db.session.commit()

        # 5. Create Sample Bookings (Today & Tomorrow)
        today = datetime.now().date()
        base_time = datetime(today.year, today.month, today.day)
        
        # Helper to create booking
        def create_booking_if_not_exists(unit, start_dt, end_dt, guest_name, price):
            existing = Booking.query.filter_by(turf_unit_id=unit.id, start_time=start_dt).first()
            if not existing:
                booking = Booking(
                    user_id=owner.id, # Self booking or guest
                    turf_id=turf.id,
                    turf_unit_id=unit.id,
                    start_time=start_dt,
                    end_time=end_dt,
                    total_price=price,
                    status='confirmed',
                    guest_name=guest_name,
                    booking_source='online'
                )
                db.session.add(booking)
                print(f"Created Booking: {guest_name} @ {start_dt.strftime('%H:%M')}")
        
        # Refresh objects
        pitch_a = TurfUnit.query.filter_by(turf_game_id=football_game.id, name="Pitch A").first()
        pitch_b = TurfUnit.query.filter_by(turf_game_id=football_game.id, name="Pitch B").first()
        
        # Today Bookings
        create_booking_if_not_exists(pitch_a, base_time.replace(hour=10), base_time.replace(hour=11), "Rohan (Ext)", 1200)
        create_booking_if_not_exists(pitch_a, base_time.replace(hour=18), base_time.replace(hour=19), "Football Club", 1200)
        create_booking_if_not_exists(pitch_b, base_time.replace(hour=19), base_time.replace(hour=20.5), "Corporate Match", 2700) # 1.5 hr

        # Commit
        db.session.commit()
        print("--- Seeding Complete ---")

if __name__ == "__main__":
    seed_test_owner()
