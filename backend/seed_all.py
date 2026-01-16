import datetime
import os
from app import app, db
from models import (
    User, Turf, TurfGame, TurfUnit, Academy, Coach, 
    AcademyProgram, AcademyBatch, AcademyEnrollment,
    Tournament, TournamentRegistration, Community, 
    CommunityMember, CommunityMessage, MatchRequest
)

def seed_all():
    with app.app_context():
        if os.getenv('CLEAN_RESET') == 'true':
            print("Dropping all existing tables for a clean sync...")
            db.drop_all()
        
        print("Ensuring tables are created...")
        db.create_all()
        print("Starting master database seeding...")

        # 1. USERS
        users_data = [
            {"username": "admin", "email": "admin@turfics.com", "role": "admin", "password": "password123"},
            {"username": "owner1", "email": "owner@demo.com", "role": "owner", "password": "password123"},
            {"username": "coach1", "email": "coach@demo.com", "role": "coach", "password": "password123"},
            {"username": "player1", "email": "player1@demo.com", "role": "user", "password": "password123"},
            {"username": "player2", "email": "player2@demo.com", "role": "user", "password": "password123"},
            {"username": "academy_admin", "email": "academy@demo.com", "role": "academy", "password": "password123"}
        ]

        users = {}
        for u_data in users_data:
            u = User.query.filter_by(email=u_data["email"]).first()
            if not u:
                u = User(
                    username=u_data["username"], 
                    email=u_data["email"], 
                    role=u_data["role"]
                )
                u.set_password(u_data["password"])
                db.session.add(u)
                db.session.commit()
                print(f"Created User: {u.username}")
            else:
                print(f"User {u.username} exists.")
            users[u_data["username"]] = u

        # 2. TURFS
        turfs_data = [
            {
                "name": "City Sports Arena",
                "location": "123 Main St, Downtown",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "owner_id": users["owner1"].id,
                "amenities": "Parking, WiFi, Changing Rooms",
                "image_url": "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=800"
            },
            {
                "name": "Smash Badminton Center",
                "location": "456 Side Rd, Westvale",
                "latitude": 12.9720,
                "longitude": 77.5950,
                "owner_id": users["owner1"].id,
                "amenities": "Pro Shop, Locker Rooms, Water",
                "image_url": "https://images.unsplash.com/photo-1626224583764-84786c713608?w=800"
            },
            # --- COIMBATORE TURFS ---
            {
                "name": "Kovai TURF",
                "location": "Avinashi Road, Peelamedu, Coimbatore",
                "latitude": 11.0260,
                "longitude": 77.0050,
                "owner_id": users["owner1"].id,
                "amenities": "Floodlights, Cafe, Parking",
                "image_url": "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800"
            },
            {
                "name": "ProZone Arena",
                "location": "Saravanampatti, Coimbatore",
                "latitude": 11.0800,
                "longitude": 76.9958,
                "owner_id": users["owner1"].id,
                "amenities": "Multiple Courts, AC Lounge, Showers",
                "image_url": "https://images.unsplash.com/photo-1577708577587-c83407983633?w=800"
            },
            {
                "name": "Race Course Grounds",
                "location": "Race Course, Coimbatore",
                "latitude": 11.0001,
                "longitude": 76.9750,
                "owner_id": users["owner1"].id,
                "amenities": "Jogging Track, Open Air, Vending Machines",
                "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
            },
            {
                "name": "Gandhipuram Sports Hub",
                "location": "Gandhipuram, Coimbatore",
                "latitude": 11.0180,
                "longitude": 76.9650,
                "owner_id": users["owner1"].id,
                "amenities": "Central Location, 24/7 Access, Equipment Rental",
                "image_url": "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800"
            },
            {
                "name": "Tusker Football Club",
                "location": "Thudiyalur, Coimbatore",
                "latitude": 11.0768,
                "longitude": 76.9258,
                "owner_id": users["owner1"].id,
                "amenities": "FIFA Standard Turf, Dugouts, Stands",
                "image_url": "https://images.unsplash.com/photo-1487466365202-1afdb86c764e?w=800"
            },
            # --- OTHER CITIES ---
            {
                "name": "Marina Smash",
                "location": "Marina Beach Road, Chennai",
                "latitude": 13.0500,
                "longitude": 80.2824,
                "owner_id": users["owner1"].id,
                "amenities": "Sea View, Pro Shop, Refreshments",
                "image_url": "https://images.unsplash.com/photo-1626224583764-84786c713608?w=800"
            },
            {
                "name": "Indiranagar Kicks",
                "location": "100ft Road, Indiranagar, Bangalore",
                "latitude": 12.9784,
                "longitude": 77.6408,
                "owner_id": users["owner1"].id,
                "amenities": "Rooftop Arena, Sports Bar, Valet Parking",
                "image_url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800"
            }
        ]

        for t_data in turfs_data:
            t = Turf.query.filter_by(name=t_data["name"]).first()
            if not t:
                t = Turf(**t_data)
                db.session.add(t)
                db.session.commit()
                print(f"Created Turf: {t.name}")
                
                # Add Games & Units for this turf
                
                # Add Games & Units for this turf
                if t.name == "City Sports Arena":
                    g = TurfGame(turf_id=t.id, sport_type="Football", default_price=1200)
                    db.session.add(g)
                    db.session.commit()
                    u1 = TurfUnit(turf_game_id=g.id, name="Main Pitch", unit_type="PITCH", capacity=14, size="7-a-side")
                    db.session.add(u1)
                    print("Added Football game and Pitch to City Sports Arena")
                
                elif t.name == "Smash Badminton Center" or t.name == "ProZone Arena" or t.name == "Marina Smash":
                    g = TurfGame(turf_id=t.id, sport_type="Badminton", default_price=400)
                    db.session.add(g)
                    db.session.commit()
                    u1 = TurfUnit(turf_game_id=g.id, name="Court 1", unit_type="COURT", capacity=4)
                    u2 = TurfUnit(turf_game_id=g.id, name="Court 2", unit_type="COURT", capacity=4)
                    db.session.add_all([u1, u2])
                    print(f"Added Badminton game and Courts to {t.name}")

                elif t.name == "Kovai TURF" or t.name == "Tusker Football Club" or t.name == "Indiranagar Kicks":
                    g = TurfGame(turf_id=t.id, sport_type="Football", default_price=1500)
                    db.session.add(g)
                    db.session.commit()
                    u1 = TurfUnit(turf_game_id=g.id, name="Turf A", unit_type="PITCH", capacity=14, size="7-a-side")
                    u2 = TurfUnit(turf_game_id=g.id, name="Turf B", unit_type="PITCH", capacity=10, size="5-a-side")
                    db.session.add_all([u1, u2])
                    print(f"Added Football game and Pitches to {t.name}")

                elif t.name == "Race Course Grounds":
                    g = TurfGame(turf_id=t.id, sport_type="Cricket", default_price=2000)
                    db.session.add(g)
                    db.session.commit()
                    u1 = TurfUnit(turf_game_id=g.id, name="Net 1", unit_type="NET", capacity=10)
                    u2 = TurfUnit(turf_game_id=g.id, name="Net 2", unit_type="NET", capacity=10)
                    db.session.add_all([u1, u2])
                    print(f"Added Cricket game and Nets to {t.name}")
                
                elif t.name == "Gandhipuram Sports Hub":
                    # Multi Sport
                    g1 = TurfGame(turf_id=t.id, sport_type="Football", default_price=1000)
                    g2 = TurfGame(turf_id=t.id, sport_type="Badminton", default_price=500)
                    db.session.add_all([g1, g2])
                    db.session.commit()
                    u1 = TurfUnit(turf_game_id=g1.id, name="Futsal Court", unit_type="PITCH", capacity=10, size="5-a-side")
                    u2 = TurfUnit(turf_game_id=g2.id, name="Shuttle Court", unit_type="COURT", capacity=4)
                    db.session.add_all([u1, u2])
                    print(f"Added Multi-Sport games to {t.name}")

                db.session.commit()
            else:
                print(f"Turf {t.name} exists.")

        # 3. ACADEMIES & COACHES
        # Coach Profile
        cp = Coach.query.filter_by(user_id=users["coach1"].id).first()
        if not cp:
            cp = Coach(
                user_id=users["coach1"].id,
                name="Coach Carter",
                specialization="Football & Fitness",
                experience=8,
                price_per_session=600,
                location="City Sports Arena"
            )
            db.session.add(cp)
            db.session.commit()
            print("Created Coach Profile for coach1")

        # Academy Profile
        ap = Academy.query.filter_by(user_id=users["academy_admin"].id).first()
        if not ap:
            ap = Academy(
                user_id=users["academy_admin"].id,
                name="Elite Sports Academy",
                location="Main Stadium",
                sports="Cricket, Football",
                description="Professional training for young athletes."
            )
            db.session.add(ap)
            db.session.commit()
            print("Created Academy Profile")
            
            # Program & Batch
            prog = AcademyProgram(academy_id=ap.id, sport="Football", head_coach_id=cp.id)
            db.session.add(prog)
            db.session.commit()
            
            batch = AcademyBatch(
                program_id=prog.id, 
                name="Junior Strikers", 
                days="Mon, Wed, Fri", 
                start_time="17:00", 
                end_time="19:00",
                price_per_month=2500,
                age_group="U-15"
            )
            db.session.add(batch)
            db.session.commit()
            print("Added Football Program and Junior Strikers Batch to Academy")

        # 4. TOURNAMENTS
        tourney = Tournament.query.filter_by(name="Winter Monsoon Cup").first()
        if not tourney:
            tourney = Tournament(
                name="Winter Monsoon Cup",
                organizer_id=users["admin"].id,
                sport="Football",
                entry_fee=3000,
                prize_pool=20000,
                start_date=datetime.datetime.now() + datetime.timedelta(days=15),
                end_date=datetime.datetime.now() + datetime.timedelta(days=17),
                location="City Sports Arena",
                status="published",
                image_url="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
                description="The ultimate football battle of the season."
            )
            db.session.add(tourney)
            db.session.commit()
            print("Created Tournament: Winter Monsoon Cup")
            
            # Registration
            reg = TournamentRegistration(
                tournament_id=tourney.id,
                user_id=users["player1"].id,
                team_name="Red Devils",
                captain_name="Player 1",
                contact_number="9876543210",
                status="approved",
                payment_status="paid"
            )
            db.session.add(reg)
            db.session.commit()
            print("Registered Player 1 for Tournament")

        # 5. COMMUNITIES
        comm_names = ["Football Addicts", "Badminton Pros", "Cricket Crazy"]
        for cname in comm_names:
            c = Community.query.filter_by(name=cname).first()
            if not c:
                c = Community(
                    name=cname,
                    description=f"A community for {cname.lower()} fans.",
                    created_by=users["admin"].id
                )
                db.session.add(c)
                db.session.commit()
                
                # Add Admin as member
                m = CommunityMember(community_id=c.id, user_id=users["admin"].id, role="admin")
                db.session.add(m)
                
                # Add a message
                msg = CommunityMessage(community_id=c.id, sender_id=users["admin"].id, content=f"Welcome to {cname}!")
                db.session.add(msg)
                print(f"Seeded Community: {cname}")
        db.session.commit()

        # 6. MATCHMAKING
        mr = MatchRequest.query.filter_by(creator_id=users["player2"].id).first()
        if not mr:
            mr = MatchRequest(
                creator_id=users["player2"].id,
                sport="Football",
                players_needed=3,
                description="Need 3 players for a friendly 7v7 match.",
                status="open"
            )
            db.session.add(mr)
            db.session.commit()
            print("Created Match Request for Player 2")

        print("✅ Seeding completed successfully!")

if __name__ == "__main__":
    seed_all()
