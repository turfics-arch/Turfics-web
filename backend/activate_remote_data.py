
from app import app, db, Turf, Coach, Tournament, Community, Team, Academy, AcademyProgram, AcademyBatch

def activate_all_data():
    print("--- ACTIVATING ALL DATA IN REMOTE DB ---")
    
    with app.app_context():
        # 1. Activate Turfs
        turfs = Turf.query.all()
        for t in turfs:
            if t.status != 'active':
                t.status = 'active'
                print(f"Activated Turf: {t.name}")
        
        # 2. Activate Tournaments
        tourneys = Tournament.query.all()
        for tr in tourneys:
            # If draft, make published. If completed, leave it.
            if tr.status == 'draft':
                tr.status = 'published'
                print(f"Published Tournament: {tr.name}")
        
        # 3. Academies (no status field on Academy, but Programs/Batches have is_active)
        programs = AcademyProgram.query.all()
        for p in programs:
            p.is_active = True
        
        batches = AcademyBatch.query.all()
        for b in batches:
            b.is_active = True
            
        db.session.commit()
        print("✅ Data activation complete.")

if __name__ == '__main__':
    activate_all_data()
