from app import app, db, User, Team, team_members
from sqlalchemy import insert

def seed_team_data():
    with app.app_context():
        # 1. Find the user
        username = 'Player Test 1'
        captain = User.query.filter_by(username=username).first()
        
        if not captain:
            print(f"User '{username}' not found!")
            return

        print(f"Found User: {captain.username} (ID: {captain.id})")

        # 2. Check for existing team or create one
        team = Team.query.filter_by(captain_id=captain.id).first()
        
        if not team:
            print("Creating new team...")
            team = Team(
                name="Thunder Strikers",
                captain_id=captain.id,
                sport="Football",
                skill_level="Intermediate",
                description="A passionate team looking for competitive matches.",
                city="Chennai",
                area="Anna Nagar",
                logo_url="https://ui-avatars.com/api/?name=Thunder+Strikers&background=random",
                open_for_requests=True
            )
            db.session.add(team)
            db.session.commit()
            print(f"Team '{team.name}' created!")
        else:
            print(f"Using existing team: {team.name}")

        # 3. Add Sample Members (if they don't exist)
        sample_members = [
            {'username': 'StrikerPro', 'email': 'striker@example.com', 'role': 'member'},
            {'username': 'GoalWall', 'email': 'goalie@example.com', 'role': 'member'},
            {'username': 'MidFieldMaestro', 'email': 'mid@example.com', 'role': 'member'}
        ]

        for member_data in sample_members:
            # Create dummy user if not exists
            user = User.query.filter_by(email=member_data['email']).first()
            if not user:
                user = User(
                    username=member_data['username'],
                    email=member_data['email'],
                    role='user',
                    skill_level='Intermediate'
                )
                user.set_password('password123')
                db.session.add(user)
                db.session.commit()
                print(f"Created dummy user: {user.username}")

            # Add to team associations manually via the association table
            # Check if already in team
            stmt = team_members.select().where(
                (team_members.c.user_id == user.id) & 
                (team_members.c.team_id == team.id)
            )
            existing_member = db.session.execute(stmt).first()
            
            if not existing_member:
                ins = team_members.insert().values(
                    user_id=user.id, 
                    team_id=team.id, 
                    role=member_data['role'], 
                    status='active'
                )
                db.session.execute(ins)
                print(f"Added {user.username} to team.")
            else:
                print(f"{user.username} is already in the team.")

        # Ensure captain themselves is in the members list (often required for queries)
        stmt = team_members.select().where(
            (team_members.c.user_id == captain.id) & 
            (team_members.c.team_id == team.id)
        )
        existing_cap = db.session.execute(stmt).first()
        if not existing_cap:
             ins = team_members.insert().values(
                user_id=captain.id, 
                team_id=team.id, 
                role='captain', 
                status='active'
            )
             db.session.execute(ins)
             print("Added Captain to team members list.")

        db.session.commit()
        print("Data Seeding Complete!")

if __name__ == "__main__":
    seed_team_data()
