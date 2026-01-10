from app import app, db
from models import User, Academy, Coach, AcademyProgram, AcademyBatch, AcademyEnrollment
from datetime import datetime

with app.app_context():
    print("Seeding full academy flow...")

    # 1. Get Actors
    academy_user = User.query.filter_by(email='academy@demo.com').first()
    coach_user = User.query.filter_by(email='coach@demo.com').first()
    player_user = User.query.filter_by(email='player1@demo.com').first()

    if not (academy_user and coach_user and player_user):
        print("Error: Missing one of the required users (academy, coach, player1). Run setup scripts first.")
        exit(1)

    print(f"Actors found: Academy({academy_user.username}), Coach({coach_user.username}), Player({player_user.username})")

    # 2. Get Profiles
    academy_profile = Academy.query.filter_by(user_id=academy_user.id).first()
    coach_profile = Coach.query.filter_by(user_id=coach_user.id).first()

    if not academy_profile:
        print("Creating Academy Profile...")
        academy_profile = Academy(
            user_id=academy_user.id,
            name="Elite Sports Academy",
            location="Sports Complex, Downtown",
            sports="Cricket, Football, Tennis",
            description="Premium sports training facility."
        )
        db.session.add(academy_profile)
        db.session.commit()

    if not coach_profile:
        print("Creating Coach Profile...")
        coach_profile = Coach(
            user_id=coach_user.id,
            name="Coach Carter",
            specialization="General Fitness",
            experience=10,
            price_per_session=500,
            location="Downtown"
        )
        db.session.add(coach_profile)
        db.session.commit()

    print(f"Profiles: Academy({academy_profile.name}), Coach({coach_profile.name})")

    # 3. Create Program linked to Coach
    program = AcademyProgram.query.filter_by(academy_id=academy_profile.id, sport="Cricket").first()
    if not program:
        print("Creating 'Elite Cricket' Program...")
        program = AcademyProgram(
            academy_id=academy_profile.id,
            sport="Cricket",
            description="Professional Cricket Coaching for all ages.",
            head_coach_id=coach_profile.id  # LINKING ACADEMY TO COACH
        )
        db.session.add(program)
        db.session.commit()
    else:
        # Update head coach if not set
        if not program.head_coach_id:
            program.head_coach_id = coach_profile.id
            db.session.commit()
            print("Updated Cricket Program with Head Coach")

    print(f"Program: {program.sport} (Head Coach: {program.head_coach.name})")

    # 4. Create Batch
    batch = AcademyBatch.query.filter_by(program_id=program.id, name="Morning Squad").first()
    if not batch:
        print("Creating 'Morning Squad' Batch...")
        batch = AcademyBatch(
            program_id=program.id,
            name="Morning Squad",
            description="Intensive morning drills.",
            days="Mon, Wed, Fri",
            start_time="07:00",
            end_time="09:00",
            price_per_month=3000,
            age_group="U-16"
        )
        db.session.add(batch)
        db.session.commit()
    
    print(f"Batch: {batch.name}")

    # 5. Create Enrollment
    enrollment = AcademyEnrollment.query.filter_by(
        academy_id=academy_profile.id,
        batch_id=batch.id,
        user_id=player_user.id
    ).first()

    if not enrollment:
        print("Creating Enrollment Request for Player1...")
        enrollment = AcademyEnrollment(
            academy_id=academy_profile.id,
            batch_id=batch.id,
            user_id=player_user.id,
            status='pending',
            notes="I want to join this week."
        )
        db.session.add(enrollment)
        db.session.commit()
        print("Enrollment created (Status: Pending)")
    else:
        print(f"Player already enrolled (Status: {enrollment.status})")

    print("\n✅ Sample Data Injection Complete!")
    print("------------------------------------------------")
    print("RELATIONSHIP VERIFICATION:")
    print(f"- Academy '{academy_profile.name}' has Program '{program.sport}'")
    print(f"- Program '{program.sport}' is led by Head Coach '{program.head_coach.name}' (User: {coach_profile.user_id})")
    print(f"- Batch '{batch.name}' belongs to Program '{program.sport}'")
    print(f"- Player '{player_user.username}' has enrollment in '{batch.name}' (Status: {enrollment.status})")
