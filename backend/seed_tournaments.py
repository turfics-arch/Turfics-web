
import datetime
from app import app, db, Tournament, User, TournamentRegistration

# Setup Context
ctx = app.app_context()
ctx.push()

print("Seeding Sample Tournaments...")

# 1. Get Users
host_user = User.query.filter_by(role='owner').first()
player1 = User.query.filter_by(username='player1').first() 
player2 = User.query.filter_by(username='player2').first() 

# Auto-create users if missing for testing
if not host_user:
    print("Creating host user 'owner'...")
    host_user = User(username='owner', email='owner@test.com', role='owner', password_hash='hashed_placeholder')
    db.session.add(host_user)
    db.session.commit()

if not player1:
    print("Creating player1...")
    player1 = User(username='player1', email='player1@test.com', role='user', password_hash='hashed_placeholder')
    db.session.add(player1)
    db.session.commit()

# 2. Key Checks
def get_or_create_tournament(name, **kwargs):
    t = Tournament.query.filter_by(name=name).first()
    if not t:
        t = Tournament(name=name, **kwargs)
        db.session.add(t)
        db.session.commit()
        print(f"Created Tournament: {name}")
    else:
        print(f"Tournament {name} already exists.")
    return t

t1 = get_or_create_tournament(
    name="Champions League 2026",
    organizer_id=host_user.id,
    sport="Football",
    entry_fee=5000,
    prize_pool=50000,
    start_date=datetime.datetime.now() + datetime.timedelta(days=10),
    end_date=datetime.datetime.now() + datetime.timedelta(days=12),
    location="City Arena",
    venue_type="manual",
    status="published",
    image_url="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=500",
    description="The biggest 5v5 football showdown in the city.",
    max_teams=16
)

t2 = get_or_create_tournament(
    name="Badminton Smash Open",
    organizer_id=host_user.id,
    sport="Badminton",
    entry_fee=1500,
    prize_pool=10000,
    start_date=datetime.datetime.now() + datetime.timedelta(days=5),
    end_date=datetime.datetime.now() + datetime.timedelta(days=6),
    location="Smash Courts",
    venue_type="manual",
    status="ongoing",
    image_url="https://images.unsplash.com/photo-1626224583764-8478ab2e15bc?w=500",
    description="Open for all intermediate players.",
    max_teams=32
)

# 3. Add Registrations
def add_reg_if_missing(t_id, u_id, team_name, status, payment):
    if not u_id: return
    exists = TournamentRegistration.query.filter_by(tournament_id=t_id, user_id=u_id).first()
    if not exists:
        r = TournamentRegistration(
            tournament_id=t_id,
            user_id=u_id,
            team_name=team_name,
            captain_name="Test Captain",
            contact_number="9988776655",
            status=status,
            payment_status=payment
        )
        db.session.add(r)
        print(f"Added registration for {team_name}")
    else:
        print(f"Registration for {team_name} exists")

add_reg_if_missing(t1.id, player1.id, "Thunder Strikers", "approved", "paid")
add_reg_if_missing(t2.id, player1.id, "Shuttle Masters", "pending", "pending")
if player2:
    add_reg_if_missing(t1.id, player2.id, "Red Devils", "approved", "paid")

db.session.commit()
print("Done.")
