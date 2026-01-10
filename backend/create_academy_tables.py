from app import app, db
from models import AcademyProgram, AcademyBatch, AcademyEnrollment

with app.app_context():
    print("Creating database tables...")
    try:
        db.create_all()
        print("✅ Tables created successfully (if they didn't exist).")
        
        # Verify table existence (simple query)
        try:
            db.session.query(AcademyProgram).first()
            print("✅ Verified 'academy_programs' table exists.")
        except Exception as e:
            print(f"❌ Verification failed for 'academy_programs': {e}")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
