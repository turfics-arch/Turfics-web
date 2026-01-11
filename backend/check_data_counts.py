
from app import app, db, Turf, Coach, Tournament, Community, Team

def check_counts():
    print("--- CHECKING REMOTE DATABASE COUNTS ---")
    
    with app.app_context():
        try:
            turf_count = Turf.query.count()
            coach_count = Coach.query.count()
            tourney_count = Tournament.query.count()
            comm_count = Community.query.count()
            team_count = Team.query.count()
            
            print(f"✅ Turfs: {turf_count}")
            print(f"✅ Coaches: {coach_count}")
            print(f"✅ Tournaments: {tourney_count}")
            print(f"✅ Communities: {comm_count}")
            print(f"✅ Teams: {team_count}")
            
            if turf_count > 0:
                print("\nSample Turf:", Turf.query.first().name)
                
        except Exception as e:
            print(f"❌ Error checking counts: {e}")

if __name__ == '__main__':
    check_counts()
