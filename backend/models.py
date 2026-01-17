from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

# Association table for User-Team (Many-to-Many)
team_members = db.Table('team_members',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('team_id', db.Integer, db.ForeignKey('teams.id'), primary_key=True),
    db.Column('role', db.String(50), default='member'), # captain, member
    db.Column('status', db.String(50), default='active') # active, trial
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user') # 'admin', 'user', 'coach', 'owner', 'academy'
    
    # Profile details
    skill_level = db.Column(db.String(20)) # Beginner, Intermediate, Advanced
    rating = db.Column(db.Float, default=0.0)
    
    # Relationships
    teams = db.relationship('Team', secondary=team_members, backref=db.backref('members', lazy='dynamic'))
    bookings = db.relationship('Booking', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class Turf(db.Model):
    """Venue Level - The physical location/facility"""
    __tablename__ = 'turfs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(500), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Venue Details
    amenities = db.Column(db.String(500))  # "Parking, WiFi, Changing Rooms"
    facilities = db.Column(db.String(500))  # "Floodlights, Scoreboard"
    rating = db.Column(db.Float, default=0.0)
    image_url = db.Column(db.String(255))
    
    # Operating Hours
    opening_time = db.Column(db.String(10), default='06:00')
    closing_time = db.Column(db.String(10), default='23:00')
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, inactive, maintenance
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    games = db.relationship('TurfGame', backref='turf', lazy=True, cascade='all, delete-orphan')

class TurfGame(db.Model):
    """Game/Sport Configuration Level"""
    __tablename__ = 'turf_games'
    id = db.Column(db.Integer, primary_key=True)
    turf_id = db.Column(db.Integer, db.ForeignKey('turfs.id'), nullable=False)
    
    # Sport Configuration
    sport_type = db.Column(db.String(50), nullable=False)  # Football, Badminton, Tennis, Cricket, Swimming
    game_category = db.Column(db.String(20), default='team')  # team, individual
    
    # Pricing & Timing
    default_price = db.Column(db.Float, nullable=False)
    slot_duration = db.Column(db.Integer, default=30)  # minutes
    
    # Availability
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Dynamic Pricing Config (JSON String)
    # e.g., {"weekend_multiplier": 1.2, "peak_hour_multiplier": 1.5, "peak_start": 18, "peak_end": 22}
    pricing_rules = db.Column(db.String(500), default='{}')

    # Relationships
    units = db.relationship('TurfUnit', backref='game', lazy=True, cascade='all, delete-orphan')

class TurfUnit(db.Model):
    """Bookable Unit Level - Pitch/Court/Pool/Space"""
    __tablename__ = 'turf_units'
    id = db.Column(db.Integer, primary_key=True)
    turf_game_id = db.Column(db.Integer, db.ForeignKey('turf_games.id'), nullable=False)
    
    # Unit Details
    name = db.Column(db.String(100), nullable=False)  # "Court 1", "Pitch A", "Pool 1"
    unit_type = db.Column(db.String(20), nullable=False)  # COURT, PITCH, POOL, SPACE, NET
    
    # Specifications
    capacity = db.Column(db.Integer)  # Max players
    size = db.Column(db.String(50))  # "7-a-side", "Full Size", "25m"
    
    # Pricing Override
    price_override = db.Column(db.Float)  # If null, use game's default_price
    
    # Features
    indoor = db.Column(db.Boolean, default=False)
    has_lighting = db.Column(db.Boolean, default=True)
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, maintenance, disabled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    # Relationships
    bookings = db.relationship('Booking', backref='unit', lazy=True)
    images = db.relationship('UnitImage', backref='unit', lazy=True, cascade="all, delete-orphan")

class UnitImage(db.Model):
    __tablename__ = 'unit_images'
    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('turf_units.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    captain_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sport = db.Column(db.String(50), nullable=False) # Football, Cricket
    skill_level = db.Column(db.String(20)) # Beginner, Intermediate... (Renaming skill_required)
    
    # Location
    city = db.Column(db.String(50))
    area = db.Column(db.String(100))
    
    # Details
    description = db.Column(db.String(255))
    logo_url = db.Column(db.String(255))
    open_for_requests = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    captain = db.relationship('User', foreign_keys=[captain_id], backref='teams_captained')
    
class Booking(db.Model):
    """Bookings are ALWAYS at the Unit level"""
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    turf_unit_id = db.Column(db.Integer, db.ForeignKey('turf_units.id'), nullable=False)  # Changed from turf_id
    # Relationship optimization
    turf_id = db.Column(db.Integer, db.ForeignKey('turfs.id'), nullable=True) # Denormalized for faster querying (Nullable for migration compatibility)
    
    # Booking Details
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    
    # Pricing
    total_price = db.Column(db.Float, nullable=False)
    
    # Status Flow: HOLD → CONFIRMED → COMPLETED / CANCELLED
    status = db.Column(db.String(20), default='hold')  # hold, confirmed, completed, cancelled
    
    # Payment & Source
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, refunded, partial
    payment_mode = db.Column(db.String(20)) # cash, upi, card, online
    booking_source = db.Column(db.String(20), default='online') # online, walk-in, phone
    
    # Walk-in / Guest Details
    guest_name = db.Column(db.String(100))
    guest_phone = db.Column(db.String(20))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Coach(db.Model):
    __tablename__ = 'coaches'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100)) # e.g. "Goalkeeping", "Batting"
    experience = db.Column(db.Integer) # Years
    price_per_session = db.Column(db.Float)
    location = db.Column(db.String(200))
    rating = db.Column(db.Float, default=0.0)
    bio = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    availability = db.Column(db.String(255)) # Simple string for now "Mon-Fri 9-5"

class Academy(db.Model):
    __tablename__ = 'academies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(200))
    sports = db.Column(db.String(200))
    price_per_month = db.Column(db.Float)
    rating = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))

class AcademyProgram(db.Model):
    __tablename__ = 'academy_programs'
    id = db.Column(db.Integer, primary_key=True)
    academy_id = db.Column(db.Integer, db.ForeignKey('academies.id'), nullable=False)
    sport = db.Column(db.String(50))  # Cricket, Football, etc.
    description = db.Column(db.String(255))
    head_coach_id = db.Column(db.Integer, db.ForeignKey('coaches.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    academy = db.relationship('Academy', backref=db.backref('programs', lazy=True))
    head_coach = db.relationship('Coach', backref=db.backref('academy_programs', lazy=True))

class AcademyBatch(db.Model):
    __tablename__ = 'academy_batches'
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('academy_programs.id'), nullable=False)
    name = db.Column(db.String(100))  # "Morning Batch (U-14)"
    description = db.Column(db.String(255))
    days = db.Column(db.String(100))  # "Mon, Wed, Fri"
    start_time = db.Column(db.String(10))
    end_time = db.Column(db.String(10))
    price_per_month = db.Column(db.Float)
    capacity = db.Column(db.Integer, default=20)
    age_group = db.Column(db.String(50))  # "U-14", "Open", etc.
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    program = db.relationship('AcademyProgram', backref=db.backref('batches', lazy=True))

class AcademyEnrollment(db.Model):
    __tablename__ = 'academy_enrollments'
    id = db.Column(db.Integer, primary_key=True)
    academy_id = db.Column(db.Integer, db.ForeignKey('academies.id'), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('academy_batches.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')  # pending, active, completed, cancelled
    payment_status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.String(255))
    
    # Relationships
    academy = db.relationship('Academy', backref=db.backref('enrollments', lazy=True))
    batch = db.relationship('AcademyBatch', backref=db.backref('enrollments', lazy=True))
    student = db.relationship('User', backref=db.backref('academy_enrollments', lazy=True))


class Tournament(db.Model):
    __tablename__ = 'tournaments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id')) # Creator
    
    # Venue Configuration
    venue_type = db.Column(db.String(20), default='manual') # manual, own_turf, external_turf, academy_venue
    turf_id = db.Column(db.Integer, db.ForeignKey('turfs.id'), nullable=True) # Linked Turf
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True) # Linked Booking (if external)
    location = db.Column(db.String(200)) # Text location fallback
    
    sport = db.Column(db.String(50))
    format = db.Column(db.String(20), default='team') # team, individual
    entry_fee = db.Column(db.Float)
    prize_pool = db.Column(db.Float)
    
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    
    max_teams = db.Column(db.Integer)
    image_url = db.Column(db.String(255))
    description = db.Column(db.Text)
    rules = db.Column(db.Text)
    
    # Management
    status = db.Column(db.String(20), default='draft') # draft, published, ongoing, completed
    wallet_balance = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    registrations = db.relationship('TournamentRegistration', backref='tournament', lazy=True)
    matches = db.relationship('TournamentMatch', backref='tournament', lazy=True, cascade='all, delete-orphan')
    announcements = db.relationship('TournamentAnnouncement', backref='tournament', lazy=True, cascade='all, delete-orphan')
    venue = db.relationship('Turf', backref='tournaments_hosted', lazy=True)

class TournamentRegistration(db.Model):
    __tablename__ = 'tournament_registrations'
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Link to registered user
    
    team_name = db.Column(db.String(100), nullable=False)
    captain_name = db.Column(db.String(100))
    contact_number = db.Column(db.String(20))
    
    # Detailed Registration Data
    players_data = db.Column(db.Text) # JSON string of player details [{name, age}, ...]
    consent = db.Column(db.Boolean, default=False)
    payment_ref = db.Column(db.String(100)) # Payment Gateway Reference
    
    payment_status = db.Column(db.String(20), default='pending') # pending, paid
    status = db.Column(db.String(20), default='pending') # pending, approved, rejected
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TournamentMatch(db.Model):
    __tablename__ = 'tournament_matches'
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    
    round_name = db.Column(db.String(50)) # "Round 1", "Quarter Final", "Final"
    
    team1_name = db.Column(db.String(100))
    team2_name = db.Column(db.String(100))
    
    score_team1 = db.Column(db.String(20), default='0')
    score_team2 = db.Column(db.String(20), default='0')
    
    status = db.Column(db.String(20), default='scheduled') # scheduled, live, completed
    scheduled_time = db.Column(db.DateTime)
    
    winner = db.Column(db.String(100))
    notes = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TournamentAnnouncement(db.Model):
    __tablename__ = 'tournament_announcements'
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    title = db.Column(db.String(100))
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    turf_id = db.Column(db.Integer, db.ForeignKey('turfs.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True) # Optional link to verified booking
    rating = db.Column(db.Integer, nullable=False) # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CoachBooking(db.Model):
    __tablename__ = 'coach_bookings'
    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey('coaches.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('coach_batches.id'), nullable=True) # Link to specific batch
    
    # Booking Details
    booking_time = db.Column(db.DateTime, nullable=False) # The session time
    duration_mins = db.Column(db.Integer, default=60)
    total_price = db.Column(db.Float)
    
    # Status
    status = db.Column(db.String(20), default='pending') # pending, confirmed, rejected, completed
    
    # Message
    notes = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    coach = db.relationship('Coach', backref=db.backref('bookings', lazy=True))
    player = db.relationship('User', backref=db.backref('coach_bookings', lazy=True))
    batch = db.relationship('CoachBatch', backref=db.backref('enrollments', lazy=True))

class CoachBatch(db.Model):
    __tablename__ = 'coach_batches'
    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey('coaches.id'), nullable=False)
    
    # Batch Details
    sport = db.Column(db.String(50)) # e.g. Football
    name = db.Column(db.String(100)) # "Morning Pro Batch"
    description = db.Column(db.String(255)) # "Intensive training for advanced players"
    days = db.Column(db.String(100)) # "Mon, Wed, Fri"
    start_time = db.Column(db.String(10)) # "07:00"
    end_time = db.Column(db.String(10)) # "08:30"
    
    price_per_month = db.Column(db.Float)
    capacity = db.Column(db.Integer, default=20)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to Coach is handled via backref in Coach model (if added) OR here
    # Adding simplified backref here if needed, but foreign key is sufficient.
    coach_ref = db.relationship('Coach', backref=db.backref('batches', lazy=True))

# --- COMMUNITY FEATURE MODELS ---

class Community(db.Model):
    __tablename__ = 'communities'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    type = db.Column(db.String(20), default='public') # public, private
    image_url = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    members = db.relationship('CommunityMember', backref='community', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('CommunityMessage', backref='community', lazy=True, cascade='all, delete-orphan')
    creator = db.relationship('User', backref='created_communities', foreign_keys=[created_by])

class CommunityMember(db.Model):
    __tablename__ = 'community_members'
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey('communities.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), default='member') # admin, member
    status = db.Column(db.String(20), default='active') # active, pending, invited, rejected
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_read_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='community_memberships', foreign_keys=[user_id])
    
    __table_args__ = (db.UniqueConstraint('community_id', 'user_id', name='_community_user_uc'),)

class CommunityMessage(db.Model):
    __tablename__ = 'community_messages'
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey('communities.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_broadcast = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = db.relationship('User', backref='sent_community_messages', foreign_keys=[sender_id])

# --- MATCHMAKING / TEAM FINDER MODELS ---

class MatchRequest(db.Model):
    __tablename__ = 'match_requests'
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True) # Nullable to allow creation before booking confirms if needed, but intended to be linked
    
    sport = db.Column(db.String(50), nullable=False)
    gender_preference = db.Column(db.String(100), default="Any") # "Male", "Female", "Mixed", "Any"
    skill_level = db.Column(db.String(50), default="Any") 
    players_needed = db.Column(db.Integer, nullable=False)
    cost_per_player = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text)
    
    status = db.Column(db.String(20), default='open') # open, full, cancelled, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='created_matches', foreign_keys=[creator_id])
    booking = db.relationship('Booking', backref='match_request')
    join_requests = db.relationship('MatchJoinRequest', backref='match', lazy=True, cascade='all, delete-orphan')

class MatchJoinRequest(db.Model):
    __tablename__ = 'match_join_requests'
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('match_requests.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    status = db.Column(db.String(20), default='pending') # pending, approved, rejected, paid
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='match_join_requests', foreign_keys=[user_id])
    
    __table_args__ = (db.UniqueConstraint('match_id', 'user_id', name='_match_user_uc'),)
