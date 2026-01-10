import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from models import db, bcrypt, User, Turf, TurfGame, TurfUnit, UnitImage, Team, Booking, team_members, Coach, CoachBatch, CoachBooking, Academy, AcademyProgram, AcademyBatch, AcademyEnrollment, Tournament, TournamentRegistration, Review, Community, CommunityMember, CommunityMessage, MatchRequest, MatchJoinRequest
import google.generativeai as genai

# --- GEMINI SETUP ---
GEMINI_API_KEY = "AIzaSyCLxC5EUl_ceAWNF3yEPQhVwyGoBZoGdIY"
genai.configure(api_key=GEMINI_API_KEY)

# Initialize model globally to restart only on app reload
try:
    SYSTEM_PROMPT = """You are Alex, the Senior Service Team Lead at Turfics.
    Turfics is a sports venue booking and management platform.
    Your Persona: Professional, empathetic, efficient, and authoritative.
    You deal with booking issues, payments, registration, and general "how-to" questions.
    
    KEY INFO:
    - Users: Players, Owners, Coaches, Academies.
    - Bookings: Discovery -> Slot -> Payment -> QR Code.
    - Matches: Users host/join pick-up games.
    - Payments: We simulate payments (Razorpay mock). Refunds: >24h full, <24h 50%.
    - Support: You are the top tier support.
    
    If you don't know, ask clarifying questions. Keep responses concise."""
    
    chat_model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_PROMPT)
except Exception as e:
    print(f"Gemini Init Error: {e}")
    chat_model = None
import google.generativeai as genai

# --- GEMINI SETUP ---
GEMINI_API_KEY = "AIzaSyCLxC5EUl_ceAWNF3yEPQhVwyGoBZoGdIY"
genai.configure(api_key=GEMINI_API_KEY)
# Initialize model globally to restart only on app reload
try:
    SYSTEM_PROMPT = """You are Alex, the Senior Service Team Lead at Turfics.
    Turfics is a sports venue booking and management platform.
    Your Persona: Professional, empathetic, efficient, and authoritative.
    You deal with booking issues, payments, registration, and general "how-to" questions.
    
    KEY INFO:
    - Users: Players, Owners, Coaches, Academies.
    - Bookings: Discovery -> Slot -> Payment -> QR Code.
    - Matches: Users host/join pick-up games.
    - Payments: We simulate payments (Razorpay mock). Refunds: >24h full, <24h 50%.
    - Support: You are the top tier support.
    
    If you don't know, ask clarifying questions. Keep responses concise."""
    
    chat_model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_PROMPT)
except Exception as e:
    print(f"Gemini Init Error: {e}")
    chat_model = None


load_dotenv()

app = Flask(__name__)
# Allow CORS for all domains for development
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
# Configuration
raw_db_url = os.getenv('DATABASE_URL')
print(f"DEBUG: Raw DATABASE_URL length: {len(raw_db_url) if raw_db_url else 0}")

if raw_db_url:
    # 1. Clean whitespace and quotes
    clean_url = raw_db_url.strip().strip("'").strip('"').strip()
    
    # NEW FIX: Remove accidental 'psql ' prefix copy-pasted from Neon dashboard
    if clean_url.startswith("psql '") or clean_url.startswith('psql "') or clean_url.startswith('psql '):
       # user copied the full command "psql 'postgres://...'"
       # Find first instance of postgres and take from there
       start_idx = clean_url.find("postgres")
       if start_idx != -1:
           clean_url = clean_url[start_idx:]
           # Also strip trailing quote if it was '...'
           clean_url = clean_url.strip("'").strip('"')

    # 2. Fix Protocol
    # SQLAlchemy requires 'postgresql://', but some providers give 'postgres://'
    if clean_url.startswith("postgres://"):
        clean_url = clean_url.replace("postgres://", "postgresql://", 1)
    
    # 3. Validation / Fallback
    # Check if it looks like a valid URL (has scheme and @)
    if "://" not in clean_url:
        print(f"CRITICAL ERROR: DATABASE_URL does not look like a URL. First 10 chars: {clean_url[:10]}")
        # Fallback to prevent crash during import, allowing partial startup for logs
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///error_fallback.db'
    else:
        # Mask password for logs: scheme://user:***@host...
        try:
            from urllib.parse import urlparse
            parsed = urlparse(clean_url)
            safe_netloc = f"{parsed.username}:******@{parsed.hostname}" if parsed.username else parsed.netloc
            print(f"DEBUG: Using DB URL: {parsed.scheme}://{safe_netloc}{parsed.path}")
        except Exception:
            print("DEBUG: Could not parse URL for logging (might be malformed)")
            
        app.config['SQLALCHEMY_DATABASE_URI'] = clean_url
else:
    print("WARNING: DATABASE_URL not found. Using local SQLite.")
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///local.db'

# Universal config
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'turfics-secret-key-v2') 

# Initialize Extensions
try:
    db.init_app(app)
except Exception as e:
    print(f"CRITICAL: db.init_app failed: {e}")
    # Do not raise here if you want the app to at least boot and show this error in /health
    # But usually better to crash hard if DB is critical. 
    # Re-raising to show in logs
    raise e
bcrypt.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"JWT INVALID: {error}")
    return jsonify({"message": f"Invalid token: {error}"}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"JWT MISSING: {error}")
    return jsonify({"message": f"Missing token: {error}"}), 401
    
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    print(f"JWT EXPIRED: {jwt_data}")
    return jsonify({"message": "Token has expired", "error": "token_expired"}), 401

# Helper function to get current user from JWT
def get_current_user():
    """Get current user info from JWT token"""
    from flask_jwt_extended import get_jwt, get_jwt_identity
    user_id = get_jwt_identity()  # This is now a string (user ID)
    claims = get_jwt()  # Get additional claims
    return {
        'id': int(user_id),
        'role': claims.get('role'),
        'username': claims.get('username')
    }

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Turfics Backend API"})

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "database": str(e)}), 500

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user') 

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    # Rules: Platform admins can only be created by platform admins (handled in a separate route or restricted)
    # For now, normal registration is for 'user'. 
    if role == 'admin':
         # In a real app, strict check here. For MVP/Demo, allowing it if secret provided or initial setup
         pass

    new_user = User(username=username, email=email, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Allow login with either username or email
    user = User.query.filter((User.username == username) | (User.email == username)).first()
    if user and user.check_password(password):
        # Create token with user ID as subject (string) and additional claims
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'username': user.username}
        )
        return jsonify({'access_token': access_token, 'role': user.role, 'user_id': user.id}), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

# Admin Routes (Example)
@app.route('/api/admin/create-admin', methods=['POST'])
@jwt_required()
def create_admin():
    current_user = get_current_user()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Access denied"}), 403
    
    # Reuse register logic or create specific logic
    return register()

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user = get_current_user()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Access denied"}), 403
    
    users = User.query.all()
    user_list = []
    for user in users:
        user_list.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            # Add other fields as needed
        })
    return jsonify(user_list), 200

@app.route('/api/turfs', methods=['GET'])
def get_turfs():
    turfs = Turf.query.filter_by(status='active').all()
    turf_list = []
    
    for turf in turfs:
        # Aggregate data from games
        sports = set()
        min_price = float('inf')
        
        for game in turf.games:
            if game.is_active:
                sports.add(game.sport_type)
                if game.default_price < min_price:
                    min_price = game.default_price
        
        # If no active games, set defaults
        if min_price == float('inf'):
            min_price = 0
            
        turf_list.append({
            'id': turf.id,
            'name': turf.name,
            'location': turf.location,
            'latitude': turf.latitude,
            'longitude': turf.longitude,
            'min_price': min_price,
            'sports': list(sports),
            'amenities': turf.amenities,
            'facilities': turf.facilities,
            'rating': turf.rating,
            'image_url': turf.image_url,
            'opening_time': turf.opening_time,
            'closing_time': turf.closing_time,
            'games': [{
                'id': g.id,
                'sport_type': g.sport_type,
                'game_category': g.game_category, # e.g., '5v5', 'Singles'
                'default_price': g.default_price,
                'slot_duration': g.slot_duration,
                'is_active': g.is_active
            } for g in turf.games if g.is_active]        })
    return jsonify(turf_list), 200

# --- Turf Owner Management Routes ---


@app.route('/api/turfs/my-turfs', methods=['GET'])
@jwt_required()
def get_my_turfs():
    current_user = get_current_user()
    turfs = Turf.query.filter_by(owner_id=current_user['id']).all()
    
    turf_list = []
    for turf in turfs:
        turf_list.append({
            'id': turf.id,
            'name': turf.name,
            'location': turf.location,
            'latitude': turf.latitude,
            'longitude': turf.longitude,
            'opening_time': turf.opening_time,
            'closing_time': turf.closing_time,
            'amenities': turf.amenities,
            'facilities': turf.facilities,
            'image_url': turf.image_url,
            'rating': turf.rating,
            'status': turf.status
        })
    return jsonify(turf_list), 200

@app.route('/api/turfs/create', methods=['POST'])
@jwt_required()
def create_turf():
    current_user = get_current_user()
    data = request.get_json()
    
    try:
        new_turf = Turf(
            name=data.get('name'),
            location=data.get('location'),
            amenities=data.get('amenities', ''),
            facilities=data.get('facilities', ''),
            image_url=data.get('image_url', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=500'),
            owner_id=current_user['id'],
            rating=4.5,  # Default rating
            latitude=float(data.get('latitude') or 0.0),
            longitude=float(data.get('longitude') or 0.0),
            opening_time=data.get('opening_time', '06:00'),
            closing_time=data.get('closing_time', '22:00'),
            status='active'
        )
            
        db.session.add(new_turf)
        db.session.commit()
        
        return jsonify({
            'message': 'Turf created successfully',
            'turf_id': new_turf.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating turf: {str(e)}'}), 500

@app.route('/api/turfs/<int:turf_id>', methods=['PUT'])
@jwt_required()
def update_turf(turf_id):
    current_user = get_current_user()
    turf = Turf.query.get_or_404(turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    try:
        turf.name = data.get('name', turf.name)
        turf.location = data.get('location', turf.location)
        turf.amenities = data.get('amenities', turf.amenities)
        turf.facilities = data.get('facilities', turf.facilities)
        turf.image_url = data.get('image_url', turf.image_url)
        turf.opening_time = data.get('opening_time', turf.opening_time)
        turf.closing_time = data.get('closing_time', turf.closing_time)
        
        # Update coordinates if provided
        if 'latitude' in data and data['latitude'] is not None:
            turf.latitude = float(data['latitude'])
        if 'longitude' in data and data['longitude'] is not None:
            turf.longitude = float(data['longitude'])
        
        db.session.commit()
        
        return jsonify({'message': 'Turf updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating turf: {str(e)}'}), 500

@app.route('/api/turfs/<int:turf_id>', methods=['DELETE'])
@jwt_required()
def delete_turf(turf_id):
    current_user = get_current_user()
    turf = Turf.query.get_or_404(turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    try:
        db.session.delete(turf)
        db.session.commit()
        return jsonify({'message': 'Turf deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting turf: {str(e)}'}), 500


# ============================================
# HIERARCHICAL TURF MANAGEMENT APIs
# Turf → Game → Unit Structure
# ============================================

# --- GAME MANAGEMENT ---

@app.route('/api/turfs/<int:turf_id>/games', methods=['GET'])
@jwt_required()
def get_turf_games(turf_id):
    """Get all games (sports) for a turf with their units"""
    current_user = get_current_user()
    turf = Turf.query.get_or_404(turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    games = TurfGame.query.filter_by(turf_id=turf_id).all()
    
    games_list = []
    for game in games:
        units = TurfUnit.query.filter_by(turf_game_id=game.id).all()
        games_list.append({
            'id': game.id,
            'sport_type': game.sport_type,
            'game_category': game.game_category,
            'default_price': game.default_price,
            'slot_duration': game.slot_duration,
            'is_active': game.is_active,
            'units_count': len(units),
            'units': [{
                'id': u.id,
                'name': u.name,
                'unit_type': u.unit_type,
                'capacity': u.capacity,
                'size': u.size,
                'price_override': u.price_override,
                'indoor': u.indoor,
                'has_lighting': u.has_lighting,
                'status': u.status,
                'images': [{'id': img.id, 'url': img.image_url, 'caption': img.caption} for img in u.images]
            } for u in units]
        })
    
    return jsonify(games_list), 200

@app.route('/api/turfs/<int:turf_id>/games', methods=['POST'])
@jwt_required()
def create_game(turf_id):
    """Add a new sport/game to a turf"""
    current_user = get_current_user()
    turf = Turf.query.get_or_404(turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    try:
        new_game = TurfGame(
            turf_id=turf_id,
            sport_type=data.get('sport_type'),
            game_category=data.get('game_category', 'team'),
            default_price=float(data.get('default_price')),
            slot_duration=int(data.get('slot_duration', 60))
        )
        
        db.session.add(new_game)
        db.session.commit()
        
        return jsonify({
            'message': 'Game added successfully',
            'game_id': new_game.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating game: {str(e)}'}), 500

@app.route('/api/games/<int:game_id>', methods=['PUT'])
@jwt_required()
def update_game(game_id):
    """Update game configuration"""
    current_user = get_current_user()
    game = TurfGame.query.get_or_404(game_id)
    turf = Turf.query.get_or_404(game.turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    try:
        game.sport_type = data.get('sport_type', game.sport_type)
        game.game_category = data.get('game_category', game.game_category)
        game.default_price = float(data.get('default_price', game.default_price))
        game.slot_duration = int(data.get('slot_duration', game.slot_duration))
        game.is_active = data.get('is_active', game.is_active)
        
        db.session.commit()
        return jsonify({'message': 'Game updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating game: {str(e)}'}), 500

@app.route('/api/games/<int:game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id):
    """Delete a game and all its units"""
    current_user = get_current_user()
    game = TurfGame.query.get_or_404(game_id)
    turf = Turf.query.get_or_404(game.turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    try:
        db.session.delete(game)  # Cascade will delete units
        db.session.commit()
        return jsonify({'message': 'Game deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting game: {str(e)}'}), 500

# --- UNIT MANAGEMENT ---

@app.route('/api/games/<int:game_id>/units', methods=['POST'])
@jwt_required()
def create_unit(game_id):
    """Add a new unit (court/pitch/pool) to a game"""
    current_user = get_current_user()
    game = TurfGame.query.get_or_404(game_id)
    turf = Turf.query.get_or_404(game.turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    try:
        new_unit = TurfUnit(
            turf_game_id=game_id,
            name=data.get('name'),
            unit_type=data.get('unit_type'),
            capacity=data.get('capacity'),
            size=data.get('size', ''),
            price_override=data.get('price_override'),
            indoor=data.get('indoor', False),
            has_lighting=data.get('has_lighting', True)
        )
        
        db.session.add(new_unit)
        db.session.commit()
        
        return jsonify({
            'message': 'Unit created successfully',
            'unit_id': new_unit.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating unit: {str(e)}'}), 500

@app.route('/api/units/<int:unit_id>', methods=['PUT'])
@jwt_required()
def update_unit(unit_id):
    """Update unit details"""
    current_user = get_current_user()
    unit = TurfUnit.query.get_or_404(unit_id)
    game = TurfGame.query.get_or_404(unit.turf_game_id)
    turf = Turf.query.get_or_404(game.turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    try:
        unit.name = data.get('name', unit.name)
        unit.unit_type = data.get('unit_type', unit.unit_type)
        unit.capacity = data.get('capacity', unit.capacity)
        unit.size = data.get('size', unit.size)
        unit.price_override = data.get('price_override', unit.price_override)
        unit.indoor = data.get('indoor', unit.indoor)
        unit.has_lighting = data.get('has_lighting', unit.has_lighting)
        unit.status = data.get('status', unit.status)
        
        db.session.commit()
        return jsonify({'message': 'Unit updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating unit: {str(e)}'}), 500

@app.route('/api/units/<int:unit_id>', methods=['DELETE'])
@jwt_required()
def delete_unit(unit_id):
    """Delete a unit (soft delete by setting status to disabled)"""
    current_user = get_current_user()
    unit = TurfUnit.query.get_or_404(unit_id)
    game = TurfGame.query.get_or_404(unit.turf_game_id)
    turf = Turf.query.get_or_404(game.turf_id)
    
    # Verify ownership
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    try:
        # Soft delete - set status to disabled
        unit.status = 'disabled'
        db.session.commit()
        return jsonify({'message': 'Unit disabled successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error disabling unit: {str(e)}'}), 500

# --- UNIT IMAGE MANAGEMENT ---

@app.route('/api/units/<int:unit_id>/images', methods=['POST'])
@jwt_required()
def add_unit_image(unit_id):
    current_user = get_current_user()
    unit = TurfUnit.query.get_or_404(unit_id)
    game = TurfGame.query.get(unit.turf_game_id)
    turf = Turf.query.get(game.turf_id)
    
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    image_url = data.get('image_url')
    
    if not image_url:
        return jsonify({'message': 'Image URL is required'}), 400
        
    new_image = UnitImage(
        unit_id=unit.id,
        image_url=image_url,
        caption=data.get('caption', '')
    )
    
    db.session.add(new_image)
    db.session.commit()
    
    return jsonify({
        'message': 'Image added',
        'image': {'id': new_image.id, 'url': new_image.image_url, 'caption': new_image.caption}
    }), 201

@app.route('/api/unit-images/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_unit_image(image_id):
    current_user = get_current_user()
    image = UnitImage.query.get_or_404(image_id)
    unit = TurfUnit.query.get(image.unit_id)
    game = TurfGame.query.get(unit.turf_game_id)
    turf = Turf.query.get(game.turf_id)
    
    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    db.session.delete(image)
    db.session.commit()
    
    return jsonify({'message': 'Image deleted'}), 200

# --- PLAYER/PUBLIC APIs ---








@app.route('/api/turfs/<int:turf_id>', methods=['GET'])
def get_turf_details(turf_id):
    turf = Turf.query.get_or_404(turf_id)
    return jsonify({
        'id': turf.id,
        'name': turf.name,
        'location': turf.location,
        'latitude': turf.latitude,
        'longitude': turf.longitude,
        'price_per_hour': turf.price_per_hour,
        'sports': turf.sports,
        'amenities': turf.amenities,
        'rating': turf.rating,
        'image_url': turf.image_url,
        'surface_type': turf.surface_type,
        'description': "Experience premium sporting action at " + turf.name # Placeholder description
    }), 200

@app.route('/api/turfs/<int:turf_id>/slots', methods=['GET'])
def get_slots(turf_id):
    date_str = request.args.get('date') # YYYY-MM-DD
    if not date_str:
        return jsonify({'message': 'Date is required'}), 400
    
    # Generate standard slots (e.g., 6 AM to 11 PM)
    slots = []
    start_hour = 6
    end_hour = 23
    
    # Fetch existing bookings for this turf and date
    # Note: In a real app, do proper date filtering. 
    # Here we are just mocking the "Busy" logic slightly for demo purposes or checking Booking table
    
    try:
        query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format'}), 400

    # Find bookings that overlap with this day
    # Robust query using joins
    start_of_day = datetime.combine(query_date, datetime.min.time())
    end_of_day = datetime.combine(query_date, datetime.max.time())
    
    existing_bookings = Booking.query\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(
            Turf.id == turf_id,
            Booking.start_time >= start_of_day,
            Booking.start_time <= end_of_day,
            Booking.status.in_(['confirmed', 'held'])
        ).all()
    
    booked_hours = [b.start_time.hour for b in existing_bookings]

    for hour in range(start_hour, end_hour):
        time_label = f"{hour:02d}:00"
        status = 'available'
        
        if hour in booked_hours:
            status = 'busy'
        
        slots.append({
            'time': time_label,
            'hour': hour,
            'status': status
        })
        
    return jsonify(slots), 200

@app.route('/api/bookings/hold', methods=['POST'])
@jwt_required()
def hold_slot():
    try:
        current_user = get_current_user()
        data = request.get_json()
        print(f"DEBUG HOLD: User={current_user} Data={data}") # Debug logging

        turf_id = int(data.get('turf_id')) # Ensure int
        date_str = data.get('date')
        hour = int(data.get('hour')) # Ensure int
        
        # Calculate start and end time
        time_str = f"{hour:02d}:00" 
        start_time = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        end_time = start_time + timedelta(hours=1)
        
        # Check availability again
        
        # Determine Unit Assignment (Intelligent Slot Management P1)
        # Find all units for this turf
        units = TurfUnit.query.join(TurfGame).filter(TurfGame.turf_id == turf_id, TurfUnit.status == 'active').all()
        if not units:
             return jsonify({'message': 'No active units found for this turf'}), 400

        # Find booked units at this time
        # Robust query using joins
        booked_unit_ids = db.session.query(Booking.turf_unit_id)\
            .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
            .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
            .join(Turf, TurfGame.turf_id == Turf.id)\
            .filter(
                Turf.id == turf_id,
                Booking.start_time == start_time,
                Booking.status.in_(['confirmed', 'held'])
            ).all()
        booked_unit_ids = [b[0] for b in booked_unit_ids]

        # Select first available unit
        selected_unit = next((u for u in units if u.id not in booked_unit_ids), None)
        
        if not selected_unit:
            return jsonify({'message': 'Slot is no longer available'}), 409

        booking = Booking(
            user_id=current_user['id'],
            turf_id=turf_id,
            turf_unit_id=selected_unit.id,
            start_time=start_time,
            end_time=end_time,
            total_price=data.get('price', 0), 
            status='held'
        )
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({'message': 'Slot held successfully', 'booking_id': booking.id, 'assigned_unit': selected_unit.name, 'expires_in': 480}), 201
    except ValueError as e:
        print(f"Format Error: {e}")
        return jsonify({'message': f"Invalid data format: {str(e)}"}), 422 
    except Exception as e:
        print(f"Hold Error: {e}")
        db.session.rollback()
        return jsonify({'message': f"Server error: {str(e)}"}), 500

@app.route('/api/owner/bookings/walk-in', methods=['POST'])
@jwt_required()
def create_walk_in_booking():
    current_user = get_current_user()
    # Verify owner/admin
    if current_user['role'] not in ['owner', 'admin']:
         return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    try:
        turf_id = int(data.get('turf_id'))
        unit_id = int(data.get('unit_id'))
        start_time_iso = data.get('start_time') # Expecting ISO string or YYYY-MM-DD HH:MM
        duration_mins = int(data.get('duration_mins', 60))
        
        # Parse start time
        try:
             start_time = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
        except:
             start_time = datetime.strptime(start_time_iso, "%Y-%m-%d %H:%M")

        end_time = start_time + timedelta(minutes=duration_mins)

        # Check availability
        conflict = Booking.query.filter(
            Booking.turf_unit_id == unit_id,
            Booking.start_time < end_time,
            Booking.end_time > start_time,
            Booking.status.in_(['confirmed', 'held'])
        ).first()

        if conflict:
            return jsonify({'message': 'Slot conflict detected'}), 409

        # Create Booking
        booking = Booking(
            user_id=current_user['id'], # Owner books it
            turf_id=turf_id,
            turf_unit_id=unit_id,
            start_time=start_time,
            end_time=end_time,
            total_price=float(data.get('price', 0)),
            status='confirmed',
            payment_status=data.get('payment_status', 'pending'), # e.g., 'paid'
            payment_mode=data.get('payment_mode', 'cash'),      # e.g., 'cash', 'upi'
            booking_source='walk-in',
            guest_name=data.get('guest_name', 'Walk-In Customer'),
            guest_phone=data.get('guest_phone', '')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({'message': 'Walk-in booking created', 'booking_id': booking.id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Walk-in Error: {e}")
        return jsonify({'message': f"Error: {str(e)}"}), 500

@app.route('/api/owner/bookings/block', methods=['POST'])
@jwt_required()
def block_slot():
    current_user = get_current_user()
    if current_user['role'] not in ['owner', 'admin']:
         return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    try:
        turf_id = int(data.get('turf_id'))
        unit_id = int(data.get('unit_id'))
        start_time_iso = data.get('start_time')
        duration_mins = int(data.get('duration_mins', 60))
        reason = data.get('reason', 'Maintenance')
        
        try:
             start_time = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
        except:
             start_time = datetime.strptime(start_time_iso, "%Y-%m-%d %H:%M")

        end_time = start_time + timedelta(minutes=duration_mins)

        # Check availability
        conflict = Booking.query.filter(
            Booking.turf_unit_id == unit_id,
            Booking.start_time < end_time,
            Booking.end_time > start_time,
            Booking.status.in_(['confirmed', 'held', 'blocked'])
        ).first()

        if conflict:
            return jsonify({'message': 'Slot is already booked or blocked'}), 409

        # Create Blocking
        booking = Booking(
            user_id=current_user['id'],
            turf_id=turf_id,
            turf_unit_id=unit_id,
            start_time=start_time,
            end_time=end_time,
            total_price=0,
            status='blocked',
            booking_source='owner-block',
            guest_name=f"Blocked: {reason}"
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({'message': 'Slot blocked successfully', 'booking_id': booking.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f"Error: {str(e)}"}), 500

@app.route('/api/owner/bookings/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_owner_booking(booking_id):
    current_user = get_current_user()
    if current_user['role'] not in ['owner', 'admin']:
         return jsonify({'message': 'Unauthorized'}), 403

    booking = Booking.query.get_or_404(booking_id)
    # Check ownership via unit->game->turf
    unit = TurfUnit.query.get(booking.turf_unit_id)
    game = TurfGame.query.get(unit.turf_game_id)
    turf = Turf.query.get(game.turf_id)

    if turf.owner_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    try:
        if 'guest_name' in data:
            booking.guest_name = data['guest_name']
        if 'guest_phone' in data:
            booking.guest_phone = data['guest_phone']
        if 'total_price' in data:
            booking.total_price = float(data['total_price'])
        if 'payment_status' in data:
            booking.payment_status = data['payment_status']
        if 'status' in data: # Allow unblocking or changing status
            booking.status = data['status']
            
        db.session.commit()
        return jsonify({'message': 'Booking updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f"Error updating booking: {str(e)}"}), 500

@app.route('/api/bookings/confirm', methods=['POST'])
@jwt_required()
def confirm_booking():
    data = request.get_json()
    booking_id = data.get('booking_id')
    
    booking = Booking.query.get_or_404(booking_id)
    current_user = get_current_user()
    
    # Permission Check: Allow Owner or Admin to confirm
    # (Checking if user is the Owner of the Turf)
    unit = TurfUnit.query.get(booking.turf_unit_id)
    game = TurfGame.query.get(unit.turf_game_id)
    turf = Turf.query.get(game.turf_id)
    
    is_owner = (turf.owner_id == current_user['id'])
    is_admin = (current_user['role'] == 'admin')
    
    if not (is_owner or is_admin):
         return jsonify({'message': 'Unauthorized: Only Turf Owner can confirm'}), 403
        
    booking.status = 'confirmed'
    db.session.commit()
    
    return jsonify({'message': 'Booking confirmed!', 'status': 'confirmed'}), 200

# --- Team Building & Social Routes ---

@app.route('/api/teams', methods=['GET'])
def get_teams():
    # Simple AI Matching Logic (Filter by skill/location)
    skill_filter = request.args.get('skill')
    query = Team.query
    if skill_filter and skill_filter != 'All':
        query = query.filter_by(skill_required=skill_filter)
    
    teams = query.all()
    team_list = []
    for team in teams:
        team_list.append({
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'skill_required': team.skill_required,
            'members_count': team.members.count()
        })
    return jsonify(team_list), 200

@app.route('/api/teams/create', methods=['POST'])
@jwt_required()
def create_team():
    current_user = get_current_user() # Dict
    data = request.get_json()
    
    new_team = Team(
        name=data.get('name'),
        description=data.get('description'),
        skill_required=data.get('skill_required')
    )
    db.session.add(new_team)
    db.session.commit()
    
    # Add creator as captain
    # Need to handle the M2M relationship insert manually or via ORM
    # For simplicity using raw SQL or helper if defined, but secondary table logic:
    stmt = team_members.insert().values(user_id=current_user['id'], team_id=new_team.id, role='captain', status='active')
    db.session.execute(stmt)
    db.session.commit()
    
    return jsonify({'message': 'Team created successfully', 'team_id': new_team.id}), 201

@app.route('/api/teams/<int:team_id>/join', methods=['POST'])
@jwt_required()
def join_team(team_id):
    current_user = get_current_user()
    data = request.get_json()
    join_type = data.get('type') # 'instant', 'trial', 'request'
    
    status = 'active'
    if join_type == 'trial':
        status = 'trial_7_days'
    elif join_type == 'request':
        status = 'pending'
        
    # Check if already member
    # (Skipping complex check for MVP speed)
    
    stmt = team_members.insert().values(user_id=current_user['id'], team_id=team_id, role='member', status=status)
    try:
        db.session.execute(stmt)
        db.session.commit()
        return jsonify({'message': f'Joined team successfully via {join_type}!'}), 200
    except Exception as e:
        return jsonify({'message': 'Already a member or error occurred'}), 400

@app.route('/api/activity', methods=['GET'])
def get_activity_feed():
    # Mock Activity Feed for "Social" aspect
    # In real app, query a proper ActivityLog table
    activities = [
        {"id": 1, "text": "John D. joined 'Thunder Strikers'", "time": "2 mins ago", "type": "join"},
        {"id": 2, "text": "Green Valley Arena just got a 5-star rating!", "time": "15 mins ago", "type": "rating"},
        {"id": 3, "text": "New Tournament 'Summer Cup' announced.", "time": "1 hour ago", "type": "tournament"},
        {"id": 4, "text": "Team 'Red Bulls' are looking for a Goalkeeper.", "time": "2 hours ago", "type": "recruit"},
    ]
    return jsonify(activities), 200


@app.route('/api/coaches', methods=['GET'])
def get_coaches():
    coaches = Coach.query.all()
    coach_list = []
    for c in coaches:
        coach_list.append({
            'id': c.id,
            'name': c.name,
            'specialization': c.specialization,
            'experience': c.experience,
            'price_per_session': c.price_per_session,
            'location': c.location,
            'rating': c.rating,
            'image_url': c.image_url,
            'availability': c.availability,
            'bio': c.bio
        })
    return jsonify(coach_list), 200

@app.route('/api/academies', methods=['GET'])
def get_academies():
    academies = Academy.query.all()
    academy_list = []
    for a in academies:
        academy_list.append({
            'id': a.id,
            'name': a.name,
            'location': a.location,
            'sports': a.sports,
            'price_per_month': a.price_per_month,
            'rating': a.rating,
            'image_url': a.image_url,
            'description': a.description
        })
    return jsonify(academy_list), 200




# ============================================
# PUBLIC PLAYER APIs (HIERARCHY SUPPORT)
# ============================================

@app.route('/api/turfs/<int:turf_id>/full', methods=['GET'])
def get_turf_full_details(turf_id):
    """Get turf with all games and units (for player booking)"""
    turf = Turf.query.get_or_404(turf_id)
    
    # Only show active games
    games = TurfGame.query.filter_by(turf_id=turf_id, is_active=True).all()
    
    games_data = []
    for game in games:
        # Only show active units
        units = TurfUnit.query.filter_by(turf_game_id=game.id, status='active').all()
        # Only add game if it has units (optional, but good UX)
        if units:
            games_data.append({
                'id': game.id,
                'sport_type': game.sport_type,
                'game_category': game.game_category,
                'default_price': game.default_price,
                'slot_duration': game.slot_duration,
                'units': [{
                    'id': u.id,
                    'name': u.name,
                    'unit_type': u.unit_type,
                    'capacity': u.capacity,
                    'size': u.size,
                    'price': u.price_override or game.default_price,
                    'indoor': u.indoor,
                    'has_lighting': u.has_lighting,
                    'images': [{'id': img.id, 'url': img.image_url, 'caption': img.caption} for img in u.images]
                } for u in units]
            })
    
    return jsonify({
        'turf': {
            'id': turf.id,
            'name': turf.name,
            'location': turf.location,
            'latitude': turf.latitude,
            'longitude': turf.longitude,
            'amenities': turf.amenities,
            'facilities': turf.facilities,
            'rating': turf.rating,
            'image_url': turf.image_url,
            'opening_time': turf.opening_time,
            'closing_time': turf.closing_time
        },
        'games': games_data
    }), 200

@app.route('/api/units/<int:unit_id>/slots', methods=['GET'])
def get_unit_slots(unit_id):
    try:
        """Get available time slots for a specific unit on a given date"""
        unit = TurfUnit.query.get_or_404(unit_id)
        if not unit.turf_game_id:
             return jsonify({'message': 'Unit not associated with a game'}), 500
             
        game = TurfGame.query.get(unit.turf_game_id)
        if not game:
            return jsonify({'message': 'Game configuration not found'}), 404
            
        turf = Turf.query.get(game.turf_id)
        if not turf:
            return jsonify({'message': 'Turf not found'}), 404
        
        date_str = request.args.get('date')  # YYYY-MM-DD
        if not date_str:
            return jsonify({'message': 'Date is required'}), 400
        
        try:
            search_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400
            
        # Get existing bookings for this unit on this date
        start_of_day = datetime.combine(search_date, datetime.min.time())
        end_of_day = datetime.combine(search_date, datetime.max.time())
        
        existing_bookings = Booking.query.filter(
            Booking.turf_unit_id == unit_id,
            Booking.start_time >= start_of_day,
            Booking.start_time <= end_of_day,
            Booking.status != 'cancelled'
        ).all()

        # Filter active bookings (Confirmed OR (Held + < 8 mins))
        active_bookings = []
        now_utc = datetime.utcnow()
        for b in existing_bookings:
            if b.status == 'hold':
                age = (now_utc - b.created_at).total_seconds()
                if age > 480: # 8 minutes
                    continue # Expired
            active_bookings.append(b)

        # Generate slots based on opening hours
        slots = []
        
        # Parse opening/closing times (HH:MM)
        try:
            if turf.opening_time:
                open_h, open_m = map(int, turf.opening_time.split(':'))
            else:
                open_h, open_m = 6, 0
            
            if turf.closing_time:
                close_h, close_m = map(int, turf.closing_time.split(':'))
            else:
                close_h, close_m = 23, 0
        except Exception as e:
            print(f"Time parsing error: {e}")
            open_h, open_m = 6, 0
            close_h, close_m = 23, 0
            
        current_time = datetime.combine(search_date, datetime.min.time().replace(hour=open_h, minute=open_m))
        close_time = datetime.combine(search_date, datetime.min.time().replace(hour=close_h, minute=close_m))
        
        duration_min = game.slot_duration or 60
        
        while current_time + timedelta(minutes=duration_min) <= close_time:
            slot_start = current_time
            slot_end = current_time + timedelta(minutes=duration_min)
            
            # Check for overlap with active bookings
            status = 'available'
            for b in active_bookings:
                # Overlap: (StartA < EndB) and (EndA > StartB)
                if b.start_time < slot_end and b.end_time > slot_start:
                    status = 'booked'
                    break
            
            # Determine AM/PM display
            hour = current_time.hour
            ampm = 'AM' if hour < 12 else 'PM'
            display_hour = hour if hour <= 12 else hour - 12
            display_hour = 12 if display_hour == 0 else display_hour
            minute = current_time.minute
            display_time = f"{display_hour}:{minute:02d} {ampm}"
            
            slots.append({
                'id': slot_start.strftime('%H:%M'),
                'time': display_time,
                'status': status,
                'price': unit.price_override or game.default_price,
                'start_iso': slot_start.isoformat(),
                'end_iso': slot_end.isoformat()
            })
            
            current_time = slot_end
            
        return jsonify(slots), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify([]), 200
    
    users = User.query.filter(User.username.ilike(f'%{query}%')).limit(10).all()
    return jsonify([{'id': u.id, 'username': u.username} for u in users]), 200



@app.route('/api/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    current_user = get_current_user()
    data = request.get_json()
    
    unit_id = data.get('turf_unit_id')
    start_time_iso = data.get('start_time')
    end_time_iso = data.get('end_time')
    
    if not unit_id or not start_time_iso or not end_time_iso:
        return jsonify({'message': 'Missing required fields'}), 400
        
    # Check for conflicts (Active Bookings only)
    start_time = datetime.fromisoformat(start_time_iso)
    end_time = datetime.fromisoformat(end_time_iso)
    
    potential_conflicts = Booking.query.filter(
        Booking.turf_unit_id == unit_id,
        Booking.start_time < end_time,
        Booking.end_time > start_time,
        Booking.status != 'cancelled'
    ).all()
    
    now_utc = datetime.utcnow()
    for conflict in potential_conflicts:
        if conflict.status == 'hold':
            age = (now_utc - conflict.created_at).total_seconds()
            if age > 480: # 8 minutes
                continue # Expired hold is not a conflict
        
        # If we reach here, it's a valid conflict (Confirmed or Active Hold)
        return jsonify({'message': 'Slot is already booked'}), 409
        
    new_booking = Booking(
        user_id=current_user['id'],
        turf_unit_id=unit_id,
        start_time=start_time,
        end_time=end_time,
        status='pending', # Default to PENDING for manual owner review
        total_price=data.get('total_price', 0),
        booking_source='online'
    )
    
    db.session.add(new_booking)
    db.session.commit()
    
    return jsonify({
        'message': 'Slot held successfully',
        'booking_id': new_booking.id,
        'expires_at': (new_booking.created_at + timedelta(minutes=8)).isoformat()
    }), 201


# --- OWNER BOOKING & STATS APIs ---

@app.route('/api/owner/bookings', methods=['GET'])
@jwt_required()
def get_owner_bookings():
    current_user = get_current_user()
    
    # Query to fetch all bookings for turfs owned by this user
    # Using explicit joins
    bookings_query = db.session.query(Booking, TurfUnit, TurfGame, Turf)\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .order_by(Booking.start_time.desc())
        
    results = bookings_query.all()
    
    data = []
    for booking, unit, game, turf in results:
        data.append({
            'booking_id': f"BK-{booking.id:04d}", # Generated ref ID
            'turf_name': turf.name,
            'game_type': game.sport_type,
            'unit_name': unit.name,
            'start_time': booking.start_time.isoformat(),
            'end_time': booking.end_time.isoformat(),
            'total_price': booking.total_price,
            'status': booking.status,
            'user_id': booking.user_id,
            'created_at': booking.created_at.isoformat()
        })
        
    return jsonify(data), 200

@app.route('/api/owner/stats', methods=['GET'])
@jwt_required()
def get_owner_stats():
    current_user = get_current_user()
    
    # --- NEW KPI CALCULATIONS ---
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    month_start = datetime(now.year, now.month, 1)

    # 1. Revenue (This Month)
    revenue_month = db.session.query(db.func.sum(Booking.total_price))\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.status.in_(['confirmed', 'completed']))\
        .filter(Booking.start_time >= month_start)\
        .scalar() or 0

    # 2. Bookings (Today)
    bookings_query = db.session.query(Booking)\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.start_time >= today_start)

    bookings_list_today = bookings_query.all()
    bookings_today = len(bookings_list_today)

    # Breakdowns
    confirmed_count = sum(1 for b in bookings_list_today if b.status in ['confirmed', 'completed'])
    pending_count = sum(1 for b in bookings_list_today if b.status in ['hold', 'pending']) # Including 'pending' just in case
    
    manual_count = sum(1 for b in bookings_list_today if b.booking_source in ['walk-in', 'phone', 'offline'])
    online_count = sum(1 for b in bookings_list_today if b.booking_source == 'online')

    # 3. Revenue (Today)
    revenue_today = db.session.query(db.func.sum(Booking.total_price))\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.status.in_(['confirmed', 'completed']))\
        .filter(Booking.start_time >= today_start)\
        .scalar() or 0
        
    # Keep total revenue as well just in case
    revenue_total = db.session.query(db.func.sum(Booking.total_price))\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.status.in_(['confirmed', 'completed']))\
        .scalar() or 0

    # ... (skipping to response construction) ...

    # 3. 30-Day Revenue Trend
    thirty_days_ago = now - timedelta(days=30)
    
    recent_bookings = db.session.query(Booking.start_time, Booking.total_price)\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.status.in_(['confirmed', 'completed']))\
        .filter(Booking.start_time >= thirty_days_ago)\
        .all()
        
    dashboard_data = {} 
    
    # Initialize last 30 days with 0
    for i in range(30):
        d = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        dashboard_data[d] = 0

    for b_time, b_price in recent_bookings:
        date_str = b_time.strftime('%Y-%m-%d')
        if date_str in dashboard_data:
            dashboard_data[date_str] += b_price
        
    trend = [{'date': k, 'revenue': v} for k, v in dashboard_data.items()]
    trend.sort(key=lambda x: x['date']) # Sort chronological
    
    # ... (sport stats, peak hours, status breakdown, recent activity logic remains same) ...
    # Re-fetch them concisely for the replace block
    
    # 4. Sport Popularity
    sport_stats = db.session.query(TurfGame.sport_type, db.func.sum(Booking.total_price))\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.status.in_(['confirmed', 'completed']))\
        .group_by(TurfGame.sport_type)\
        .all()
    sport_data = [{'name': s[0], 'value': float(s[1] or 0)} for s in sport_stats]

    # 5. Peak Hours
    hour_stats = db.session.query(db.func.extract('hour', Booking.start_time), db.func.count(Booking.id))\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.status.in_(['confirmed', 'completed', 'blocked']))\
        .group_by(db.func.extract('hour', Booking.start_time))\
        .all()
    peak_hours = [{'hour': int(h), 'count': count} for h, count in hour_stats]
    peak_hours.sort(key=lambda x: x['hour'])

    # 6. Status Breakdown
    status_stats = db.session.query(Booking.status, db.func.count(Booking.id))\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .group_by(Booking.status)\
        .all()
    status_data = [{'name': s[0], 'value': s[1]} for s in status_stats]

    # 7. Recent Activity
    recent_activity = db.session.query(Booking, Turf.name, TurfGame.sport_type)\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .order_by(Booking.created_at.desc())\
        .limit(10)\
        .all()
        
    activity_feed = []
    for booking, turf_name, sport in recent_activity:
        # Structured data for dashboard table
        activity_feed.append({
            'id': booking.id,
            'turf': turf_name,
            'action': f"Booking for {sport}", # Displayed as subtitle
            'time': booking.created_at.strftime('%H:%M %d/%m'),
            'status': booking.status,
            'amount': booking.total_price
        })

    return jsonify({
        'stats': {
            'revenue_month': revenue_month,
            'bookings_today': bookings_today,
            'revenue_today': revenue_today,
            'confirmed_bookings': confirmed_count,
            'pending_bookings': pending_count
        },
        'revenue_trend': trend,
        'sport_stats': sport_data,
        'peak_hours': peak_hours,
        'status_stats': status_data,
        'recent_activity': activity_feed
    }), 200

# --- PLAYER SPECIFIC ROUTES ---

@app.route('/api/my-bookings', methods=['GET'])
@jwt_required()
def get_my_player_bookings():
    """Get bookings for the logged-in player"""
    print("DEBUG: Accessing get_my_player_bookings")
    current_user = get_current_user()
    
    start_filter = request.args.get('filter') # 'upcoming', 'history'
    
    query = db.session.query(Booking, TurfUnit, TurfGame, Turf)\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Booking.user_id == current_user['id'])
        
    now = datetime.utcnow()
    
    # Debug Pre-filter
    all_user_bookings = query.all()
    print(f"DEBUG: Found {len(all_user_bookings)} bookings for user {current_user['id']} (Pre-filter)")
    for b_row in all_user_bookings:
        print(f" - ID: {b_row[0].id}, Time: {b_row[0].start_time}, Status: {b_row[0].status}")

    if start_filter == 'upcoming':
        # Booking must be in future OR today... simple check: start_time > now
        query = query.filter(Booking.start_time >= now).filter(Booking.status != 'cancelled')
    elif start_filter == 'history':
        query = query.filter(Booking.start_time < now)
        
    # Sort by nearest upcoming or most recent history
    if start_filter == 'history':
        query = query.order_by(Booking.start_time.desc())
    else:
        query = query.order_by(Booking.start_time.asc())
        
    results = query.all()
    print(f"DEBUG: Returning {len(results)} bookings after filter '{start_filter}' (Now: {now})")
    
    bookings_data = []
    
    for booking, unit, game, turf in results:
        bookings_data.append({
            'id': booking.id,
            'booking_id': f"BK-{booking.id:04d}", # Generated ref ID
            'date': booking.start_time.strftime('%b %d, %Y'),
            'start_time': booking.start_time.strftime('%I:%M %p'),
            'end_time': booking.end_time.strftime('%I:%M %p'),
            'turf_name': turf.name,
            'turf_image': turf.image_url,
            'location': turf.location,
            'sport': game.sport_type,
            'game_category': game.game_category,
            'unit_name': unit.name,
            'price': float(booking.total_price),
            'status': booking.status,
            'turf_id': turf.id # Ensure turf_id is explicitly included
        })
        
    return jsonify(bookings_data), 200

@app.route('/api/turfs/<int:turf_id>/reviews', methods=['POST'])
@jwt_required()
def add_turf_review(turf_id):
    current_user = get_current_user()
    data = request.get_json()
    
    # Simple validation
    if not data.get('rating'):
         return jsonify({'message': 'Rating is required'}), 400
         
    # Ensure database tables exist (hack for dev if no migration run yet)
    with app.app_context():
        db.create_all()
        
    try:
        new_review = Review(
            turf_id=turf_id,
            user_id=current_user['id'],
            booking_id=data.get('booking_id'),
            rating=int(data.get('rating')),
            comment=data.get('comment', '')
        )
        
        db.session.add(new_review)
        db.session.commit()
        
        return jsonify({'message': 'Review added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding review: {str(e)}'}), 500

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_player_booking(booking_id):
    current_user = get_current_user()
    booking = Booking.query.get_or_404(booking_id)
    
    if booking.user_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    if booking.start_time < datetime.utcnow():
        return jsonify({'message': 'Cannot cancel past bookings'}), 400
        
    try:
        booking.status = 'cancelled'
        db.session.commit()
        return jsonify({'message': 'Booking cancelled successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error cancelling booking: {str(e)}'}), 500

@app.route('/api/owner/analytics/detailed', methods=['GET'])
@jwt_required()
def get_owner_analytics_detailed():
    current_user = get_current_user()
    time_range = request.args.get('range', 'month')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # 1. Date Filter Logic
    now = datetime.utcnow()
    
    # Defaults
    query_start = now - timedelta(days=30)
    query_end = now
    
    if start_date and end_date:
        # Custom Range Logic
        try:
             query_start = datetime.fromisoformat(start_date)
             # If exact date provided as YYYY-MM-DD, end_date usually needs to be end of day
             # But assuming frontend sends ISOs or full dates.
             query_end = datetime.fromisoformat(end_date) 
             # Adjust end_date to include the full day if it's midnight
             if query_end.hour == 0 and query_end.minute == 0:
                 query_end = query_end + timedelta(days=1, seconds=-1)
        except:
             pass # Fallback to defaults
    elif time_range == 'day':
        query_start = datetime(now.year, now.month, now.day)
    elif time_range == 'week':
        query_start = now - timedelta(days=7)
    elif time_range == 'month':
        query_start = now - timedelta(days=30)
    elif time_range == 'year':
        query_start = now - timedelta(days=365)
    elif time_range == 'all':
        query_start = datetime(2020, 1, 1)

    # 2. Base Query
    bookings = db.session.query(Booking, TurfUnit, TurfGame, Turf)\
        .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
        .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
        .join(Turf, TurfGame.turf_id == Turf.id)\
        .filter(Turf.owner_id == current_user['id'])\
        .filter(Booking.created_at >= query_start)\
        .filter(Booking.created_at <= query_end)\
        .all()

    # 3. Financial Breakdown (Advance vs Pending vs Revenue Types)
    total_rev = 0
    advance_collected = 0
    pending_collection = 0
    
    revenue_by_type = {'online': 0, 'manual': 0}

    for b, u, g, t in bookings:
        if b.status in ['confirmed', 'completed']:
            total_rev += b.total_price
            if b.booking_source == 'online':
                # Assuming online is paid in advance or at least digitally tracked
                revenue_by_type['online'] += b.total_price
                if b.payment_status == 'paid':
                     advance_collected += b.total_price
                else:
                     pending_collection += b.total_price # e.g. pay at venue
            else:
                revenue_by_type['manual'] += b.total_price
                pending_collection += b.total_price # Walk-ins usually pay at counter

    rev_breakdown = [
        {'name': 'Online Bookings', 'value': revenue_by_type['online']},
        {'name': 'Manual/Walk-in', 'value': revenue_by_type['manual']}
    ]

    # 4. Booking Time vs Play Time (Scatter Logic)
    # X: Hour of Booking (0-23), Y: Hour of Play (0-23), Z: Count
    scatter_map = {} # Key: "booked_h-played_h" -> count
    
    for b, u, g, t in bookings:
         booked_h = b.created_at.hour
         played_h = b.start_time.hour
         key = f"{booked_h}-{played_h}"
         scatter_map[key] = scatter_map.get(key, 0) + 1
         
    booking_scatter = []
    for k, v in scatter_map.items():
        bh, ph = k.split('-')
        booking_scatter.append({'x': int(bh), 'y': int(ph), 'z': v * 20}) # Scale Z for visibility

    # 5. User Retention (New vs Recurring)
    # We need to look at ALL TIME history for these users to determine if they are new
    unique_users = set(b.user_id for b, u, g, t in bookings)
    retention_counts = {'New': 0, 'Returning': 0}
    
    for uid in unique_users:
        # Check if user had bookings BEFORE start_date
        prev_count = db.session.query(db.func.count(Booking.id))\
            .join(TurfUnit, Booking.turf_unit_id == TurfUnit.id)\
            .join(TurfGame, TurfUnit.turf_game_id == TurfGame.id)\
            .join(Turf, TurfGame.turf_id == Turf.id)\
            .filter(Turf.owner_id == current_user['id'])\
            .filter(Booking.user_id == uid)\
            .filter(Booking.created_at < start_date)\
            .scalar()
            
        if prev_count > 0:
            retention_counts['Returning'] += 1
        else:
            retention_counts['New'] += 1
            
    user_retention = [
        {'name': 'New Customers', 'value': retention_counts['New']},
        {'name': 'Returning', 'value': retention_counts['Returning']}
    ]

    # 6. Tournament Stats (Mock data or real if available)
    # Since Tournament model is separate, let's fetch basic stats
    tournaments = Tournament.query.filter_by(organizer_id=current_user['id']).all()
    tourney_stats = []
    for t in tournaments:
        p_count = TournamentRegistration.query.filter_by(tournament_id=t.id).count()
        tourney_stats.append({'name': t.name, 'participants': p_count})

    # 7. Region Analysis (Mocking based on simple user profile or random for demo if no data)
    # In real app, we'd use User.location or IP geolocation
    top_regions = [
        {'region': 'Local Area', 'count': int(len(bookings) * 0.6)},
        {'region': 'City Center', 'count': int(len(bookings) * 0.3)},
        {'region': 'Outskirts', 'count': int(len(bookings) * 0.1)}
    ]

    # Calculate avg payment time (Mock logic: diff between created and updated if paid)
    avg_payment_time = "12 mins" 

    return jsonify({
        'revenue_breakdown': rev_breakdown,
        'advance_collected': advance_collected,
        'pending_collection': pending_collection,
        'booking_scatter': booking_scatter,
        'user_retention': user_retention,
        'tournament_stats': tourney_stats,
        'top_regions': top_regions,
        'avg_payment_time': avg_payment_time
    }), 200

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id):
    current_user = get_current_user()
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404

        # Permission Check
        # 1. Admin can delete anything
        if current_user['role'] == 'admin':
            pass
        else:
            # 2. Owner of the turf
            # Use relationship optimization if available, else query
             turf = Turf.query.filter(Turf.id == booking.turf_id).first()
             if not turf:
                 # Fallback if turf_id is null (legacy data), check via unit->game->turf
                 unit = TurfUnit.query.get(booking.turf_unit_id)
                 game = TurfGame.query.get(unit.turf_game_id)
                 turf = Turf.query.get(game.turf_id)

             if turf.owner_id != current_user['id']:
                 return jsonify({'message': 'Unauthorized'}), 403

        db.session.delete(booking)
        db.session.commit()
        
        return jsonify({'message': 'Booking removed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f"Error: {str(e)}"}), 500

# --- COACH SPECIFIC ROUTES ---

@app.route('/api/coach/me', methods=['GET'])
@jwt_required()
def get_coach_profile():
    current_user = get_current_user()
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    
    if not coach:
        return jsonify({'message': 'Profile not found'}), 404
        
    return jsonify({
        'id': coach.id,
        'name': coach.name,
        'specialization': coach.specialization,
        'experience': coach.experience,
        'price_per_session': coach.price_per_session,
        'location': coach.location,
        'bio': coach.bio,
        'availability': coach.availability,
        'rating': coach.rating
    }), 200

@app.route('/api/coach/profile', methods=['PUT'])
@jwt_required()
def update_coach_profile():
    current_user = get_current_user()
    data = request.get_json()
    
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    
    if not coach:
        # Create new profile
        coach = Coach(user_id=current_user['id'])
        db.session.add(coach)
    
    # Update fields
    coach.name = data.get('name', current_user['username']) # Default to username if not sent?
    coach.specialization = data.get('specialization', coach.specialization)
    coach.experience = int(data.get('experience', coach.experience or 0))
    coach.price_per_session = float(data.get('price_per_session', coach.price_per_session or 0))
    coach.location = data.get('location', coach.location)
    coach.bio = data.get('bio', coach.bio)
    coach.availability = data.get('availability', coach.availability)
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/coach/bookings', methods=['GET'])
@jwt_required()
def get_coach_bookings():
    current_user = get_current_user()
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    
    if not coach:
        return jsonify([]), 200 # No legacy bookings if no profile
        
    bookings = CoachBooking.query.filter_by(coach_id=coach.id).order_by(CoachBooking.created_at.desc()).all()
    
    # Enriched data
    result = []
    for b in bookings:
        player_name = b.player.username if b.player else 'Unknown'
        result.append({
            'id': b.id,
            'player_name': player_name,
            'booking_time': b.booking_time.strftime('%Y-%m-%dT%H:%M:%S'),
            'duration_mins': b.duration_mins,
            'status': b.status,
            'notes': b.notes,
            'price': b.total_price
        })
        
    return jsonify(result), 200

@app.route('/api/coach/bookings/<int:booking_id>/action', methods=['POST'])
@jwt_required()
def action_coach_booking(booking_id):
    current_user = get_current_user()
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    
    if not coach:
        return jsonify({'message': 'Unauthorized'}), 403
        
    booking = CoachBooking.query.get_or_404(booking_id)
    
    if booking.coach_id != coach.id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    action = data.get('action') # 'confirm' or 'reject'
    
    if action == 'confirm':
        booking.status = 'confirmed'
    elif action == 'reject':
        booking.status = 'rejected'
    else:
        return jsonify({'message': 'Invalid action'}), 400
        
    db.session.commit()
    return jsonify({'message': f"Booking {booking.status}"}), 200

# --- COACH BATCH APIs ---

@app.route('/api/coach/batches', methods=['GET'])
@jwt_required()
def get_coach_batches():
    current_user = get_current_user()
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    if not coach: return jsonify([]), 200
    
    batches = CoachBatch.query.filter_by(coach_id=coach.id).all()
    result = []
    for b in batches:
        # Count confirmed students
        student_count = CoachBooking.query.filter_by(batch_id=b.id, status='confirmed').count()
        result.append({
            'id': b.id,
            'name': b.name,
            'sport': b.sport,
            'description': b.description,
            'days': b.days,
            'start_time': b.start_time,
            'end_time': b.end_time,
            'price_per_month': b.price_per_month,
            'capacity': b.capacity,
            'student_count': student_count
        })
    return jsonify(result), 200

@app.route('/api/coach/batches', methods=['POST'])
@jwt_required()
def create_coach_batch():
    current_user = get_current_user()
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    if not coach: return jsonify({'message': 'Profile required'}), 400
    
    data = request.get_json()
    new_batch = CoachBatch(
        coach_id=coach.id,
        name=data['name'],
        sport=data['sport'],
        description=data.get('description', ''),
        days=data.get('days'),
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        price_per_month=float(data.get('price_per_month', 0)),
        capacity=int(data.get('capacity', 20))
    )
    db.session.add(new_batch)
    db.session.commit()
    return jsonify({'message': 'Batch created'}), 201

@app.route('/api/coach/batches/<int:batch_id>/students', methods=['GET'])
@jwt_required()
def get_batch_students(batch_id):
    current_user = get_current_user()
    coach = Coach.query.filter_by(user_id=current_user['id']).first()
    batch = CoachBatch.query.get_or_404(batch_id)
    if not coach or batch.coach_id != coach.id: return jsonify({'message': 'Unauthorized'}), 403
    
    enrollments = CoachBooking.query.filter_by(batch_id=batch.id, status='confirmed').all()
    result = []
    for en in enrollments:
        if en.player:
            result.append({
                'id': en.player.id,
                'name': en.player.username,
                'email': en.player.email,
                'joined_date': en.created_at.strftime('%Y-%m-%d'),
                'skill_level': en.player.skill_level or 'Not rated',
                'payment_status': 'Paid' # Mocking based on confirmed
            })
    return jsonify(result), 200

# --- PUBLIC COACH APIs ---

@app.route('/api/coaches', methods=['GET'])
def get_all_coaches():
    coaches = Coach.query.all()
    result = []
    for c in coaches:
        result.append({
            'id': c.id,
            'name': c.name,
            'specialization': c.specialization,
            'rating': c.rating or 5.0,
            'experience': c.experience,
            'price_per_session': c.price_per_session,
            'image_url': f"https://ui-avatars.com/api/?name={c.name}&background=random" 
        })
    return jsonify(result), 200

@app.route('/api/coaches/<int:coach_id>', methods=['GET'])
def get_public_coach_profile(coach_id):
    coach = Coach.query.get_or_404(coach_id)
    return jsonify({
        'id': coach.id,
        'name': coach.name,
        'specialization': coach.specialization,
        'experience': coach.experience,
        'price_per_session': coach.price_per_session,
        'location': coach.location,
        'bio': coach.bio,
        'availability': coach.availability,
        'rating': coach.rating
    }), 200

@app.route('/api/coaches/<int:coach_id>/batches', methods=['GET'])
def get_public_coach_batches(coach_id):
    batches = CoachBatch.query.filter_by(coach_id=coach_id).all()
    result = []
    for b in batches:
        result.append({
            'id': b.id,
            'name': b.name,
            'sport': b.sport,
            'description': b.description,
            'days': b.days,
            'start_time': b.start_time,
            'end_time': b.end_time,
            'price_per_month': b.price_per_month,
            'capacity': b.capacity
        })
    return jsonify(result), 200

@app.route('/api/bookings/coach', methods=['POST'])
@jwt_required()
def create_coach_booking():
    current_user = get_current_user()
    data = request.get_json()
    
    coach_id = data.get('coach_id')
    batch_id = data.get('batch_id') # Optional
    
    if batch_id:
        batch = CoachBatch.query.get_or_404(batch_id)
        if not batch: return jsonify({'message': 'Batch not found'}), 404
        
        booking = CoachBooking(
            coach_id=batch.coach_id,
            user_id=current_user['id'],
            batch_id=batch.id,
            booking_time=datetime.utcnow(), 
            status='pending',
            total_price=batch.price_per_month,
            notes=data.get('notes', 'Batch Enrollment')
        )
    else:
        # 1-on-1 booking
        booking = CoachBooking(
            coach_id=coach_id,
            user_id=current_user['id'],
            # Parse ISO string "2023-01-01T10:00:00"
            booking_time=datetime.fromisoformat(data['booking_time'].replace('Z', '+00:00')),
            duration_mins=60,
            total_price=data.get('price'),
            status='pending',
            notes=data.get('notes')
        )
        
    db.session.add(booking)
    db.session.commit()
    return jsonify({'message': 'Booking request sent'}), 201

# --- ACADEMY ADMIN APIs ---

@app.route('/api/academy/me', methods=['GET'])
@jwt_required()
def get_academy_profile():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify({'message': 'Academy profile not found'}), 404
    
    return jsonify({
        'id': academy.id,
        'name': academy.name,
        'location': academy.location,
        'sports': academy.sports,
        'description': academy.description,
        'rating': academy.rating,
        'image_url': academy.image_url
    }), 200

@app.route('/api/academy/profile', methods=['PUT'])
@jwt_required()
def update_academy_profile():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify({'message': 'Academy profile not found'}), 404
    
    data = request.get_json()
    academy.name = data.get('name', academy.name)
    academy.location = data.get('location', academy.location)
    academy.sports = data.get('sports', academy.sports)
    academy.description = data.get('description', academy.description)
    academy.image_url = data.get('image_url', academy.image_url)
    
    db.session.commit()
    return jsonify({'message': 'Profile updated'}), 200

@app.route('/api/academy/programs', methods=['GET'])
@jwt_required()
def get_academy_programs():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify([]), 200
    
    programs = AcademyProgram.query.filter_by(academy_id=academy.id).all()
    result = []
    for p in programs:
        batch_count = AcademyBatch.query.filter_by(program_id=p.id).count()
        result.append({
            'id': p.id,
            'sport': p.sport,
            'description': p.description,
            'head_coach_id': p.head_coach_id,
            'head_coach_name': p.head_coach.name if p.head_coach else None,
            'is_active': p.is_active,
            'batch_count': batch_count,
            'created_at': p.created_at.strftime('%Y-%m-%d')
        })
    return jsonify(result), 200

@app.route('/api/academy/programs', methods=['POST'])
@jwt_required()
def create_academy_program():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify({'message': 'Academy profile required'}), 400
    
    data = request.get_json()
    new_program = AcademyProgram(
        academy_id=academy.id,
        sport=data['sport'],
        description=data.get('description', ''),
        head_coach_id=data.get('head_coach_id')
    )
    db.session.add(new_program)
    db.session.commit()
    return jsonify({'message': 'Program created', 'id': new_program.id}), 201

@app.route('/api/academy/programs/<int:program_id>', methods=['PUT'])
@jwt_required()
def update_academy_program(program_id):
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    program = AcademyProgram.query.get_or_404(program_id)
    
    if not academy or program.academy_id != academy.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    program.sport = data.get('sport', program.sport)
    program.description = data.get('description', program.description)
    program.head_coach_id = data.get('head_coach_id', program.head_coach_id)
    program.is_active = data.get('is_active', program.is_active)
    
    db.session.commit()
    return jsonify({'message': 'Program updated'}), 200

@app.route('/api/academy/programs/<int:program_id>', methods=['DELETE'])
@jwt_required()
def delete_academy_program(program_id):
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    program = AcademyProgram.query.get_or_404(program_id)
    
    if not academy or program.academy_id != academy.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    db.session.delete(program)
    db.session.commit()
    return jsonify({'message': 'Program deleted'}), 200

@app.route('/api/academy/batches', methods=['GET'])
@jwt_required()
def get_academy_batches():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify([]), 200
    
    programs = AcademyProgram.query.filter_by(academy_id=academy.id).all()
    program_ids = [p.id for p in programs]
    
    batches = AcademyBatch.query.filter(AcademyBatch.program_id.in_(program_ids)).all()
    result = []
    for b in batches:
        student_count = AcademyEnrollment.query.filter_by(batch_id=b.id, status='active').count()
        result.append({
            'id': b.id,
            'program_id': b.program_id,
            'program_sport': b.program.sport,
            'name': b.name,
            'description': b.description,
            'days': b.days,
            'start_time': b.start_time,
            'end_time': b.end_time,
            'price_per_month': b.price_per_month,
            'capacity': b.capacity,
            'age_group': b.age_group,
            'student_count': student_count,
            'is_active': b.is_active
        })
    return jsonify(result), 200

@app.route('/api/academy/batches', methods=['POST'])
@jwt_required()
def create_academy_batch():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify({'message': 'Academy profile required'}), 400
    
    data = request.get_json()
    program = AcademyProgram.query.get(data['program_id'])
    if not program or program.academy_id != academy.id:
        return jsonify({'message': 'Invalid program'}), 400
    
    new_batch = AcademyBatch(
        program_id=data['program_id'],
        name=data['name'],
        description=data.get('description', ''),
        days=data.get('days'),
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        price_per_month=float(data.get('price_per_month', 0)),
        capacity=int(data.get('capacity', 20)),
        age_group=data.get('age_group', 'Open')
    )
    db.session.add(new_batch)
    db.session.commit()
    return jsonify({'message': 'Batch created', 'id': new_batch.id}), 201

@app.route('/api/academy/batches/<int:batch_id>/students', methods=['GET'])
@jwt_required()
def get_academy_batch_students(batch_id):
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    batch = AcademyBatch.query.get_or_404(batch_id)
    
    if not academy or batch.program.academy_id != academy.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    enrollments = AcademyEnrollment.query.filter_by(batch_id=batch.id, status='active').all()
    result = []
    for en in enrollments:
        if en.student:
            result.append({
                'id': en.student.id,
                'name': en.student.username,
                'email': en.student.email,
                'enrollment_date': en.enrollment_date.strftime('%Y-%m-%d'),
                'payment_status': en.payment_status
            })
    return jsonify(result), 200

@app.route('/api/academy/enrollments', methods=['GET'])
@jwt_required()
def get_academy_enrollments():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify([]), 200
    
    status_filter = request.args.get('status')
    query = AcademyEnrollment.query.filter_by(academy_id=academy.id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    enrollments = query.all()
    result = []
    for en in enrollments:
        result.append({
            'id': en.id,
            'student_name': en.student.username if en.student else 'Unknown',
            'student_email': en.student.email if en.student else '',
            'batch_name': en.batch.name if en.batch else '',
            'program_sport': en.batch.program.sport if en.batch and en.batch.program else '',
            'enrollment_date': en.enrollment_date.strftime('%Y-%m-%d'),
            'status': en.status,
            'payment_status': en.payment_status,
            'notes': en.notes
        })
    return jsonify(result), 200

@app.route('/api/academy/enrollments/<int:enrollment_id>/action', methods=['POST'])
@jwt_required()
def academy_enrollment_action(enrollment_id):
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    enrollment = AcademyEnrollment.query.get_or_404(enrollment_id)
    
    if not academy or enrollment.academy_id != academy.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    
    if action == 'approve':
        enrollment.status = 'active'
    elif action == 'reject':
        enrollment.status = 'cancelled'
    else:
        return jsonify({'message': 'Invalid action'}), 400
    
    db.session.commit()
    return jsonify({'message': f'Enrollment {action}d'}), 200

@app.route('/api/academy/stats', methods=['GET'])
@jwt_required()
def get_academy_stats():
    current_user = get_current_user()
    academy = Academy.query.filter_by(user_id=current_user['id']).first()
    if not academy:
        return jsonify({}), 200
    
    programs_count = AcademyProgram.query.filter_by(academy_id=academy.id).count()
    
    program_ids = [p.id for p in AcademyProgram.query.filter_by(academy_id=academy.id).all()]
    batches_count = AcademyBatch.query.filter(AcademyBatch.program_id.in_(program_ids)).count()
    
    total_students = AcademyEnrollment.query.filter_by(academy_id=academy.id, status='active').count()
    pending_enrollments = AcademyEnrollment.query.filter_by(academy_id=academy.id, status='pending').count()
    
    return jsonify({
        'programs': programs_count,
        'batches': batches_count,
        'active_students': total_students,
        'pending_enrollments': pending_enrollments
    }), 200

# --- PUBLIC ACADEMY APIs (for players) ---

@app.route('/api/academies/<int:academy_id>', methods=['GET'])
def get_public_academy_profile(academy_id):
    academy = Academy.query.get_or_404(academy_id)
    return jsonify({
        'id': academy.id,
        'name': academy.name,
        'location': academy.location,
        'sports': academy.sports,
        'description': academy.description,
        'rating': academy.rating,
        'image_url': academy.image_url
    }), 200

@app.route('/api/academies/<int:academy_id>/programs', methods=['GET'])
def get_public_academy_programs(academy_id):
    programs = AcademyProgram.query.filter_by(academy_id=academy_id, is_active=True).all()
    result = []
    for p in programs:
        batches = AcademyBatch.query.filter_by(program_id=p.id, is_active=True).all()
        batch_list = []
        for b in batches:
            batch_list.append({
                'id': b.id,
                'name': b.name,
                'description': b.description,
                'days': b.days,
                'start_time': b.start_time,
                'end_time': b.end_time,
                'price_per_month': b.price_per_month,
                'age_group': b.age_group,
                'capacity': b.capacity
            })
        
        result.append({
            'id': p.id,
            'sport': p.sport,
            'description': p.description,
            'head_coach': {
                'id': p.head_coach.id,
                'name': p.head_coach.name
            } if p.head_coach else None,
            'batches': batch_list
        })
    return jsonify(result), 200

@app.route('/api/academies/enroll', methods=['POST'])
@jwt_required()
def create_academy_enrollment():
    current_user = get_current_user()
    data = request.get_json()
    
    batch_id = data.get('batch_id')
    batch = AcademyBatch.query.get_or_404(batch_id)
    
    # Check if already enrolled
    existing = AcademyEnrollment.query.filter_by(
        user_id=current_user['id'],
        batch_id=batch_id
    ).first()
    
    if existing:
        return jsonify({'message': 'Already enrolled in this batch'}), 400
    
    enrollment = AcademyEnrollment(
        academy_id=batch.program.academy_id,
        batch_id=batch_id,
        user_id=current_user['id'],
        status='pending',
        notes=data.get('notes', 'Enrollment request')
    )
    
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'message': 'Enrollment request submitted'}), 201


# ============================================
# TOURNAMENT MANAGEMENT APIs
# ============================================

@app.route('/api/tournaments', methods=['POST'])
@jwt_required()
def create_tournament():
    current_user = get_current_user()
    data = request.get_json()
    
    # 1. Permission check (Anyone can create, but maybe restrict to certain roles if needed?)
    # For now, allow all logged-in users to create, but 'organizer_id' tracks who.
    
    try:
        # 2. Extract Data
        venue_type = data.get('venue_type', 'manual')
        turf_id = data.get('booking_turf_id') # For booking logic
        
        # 3. Handle Booking (If hosting on a turf)
        booking_id = None
        if venue_type in ['own_turf', 'external_turf'] and turf_id:
            # Logic to book/block the turf for the duration
            # Simplified: Just create a "held" booking for the whole duration or specific slots
            # This part can be complex (multi-day booking). For MVP, we assume manual coordination or single block.
            pass 

        new_tournament = Tournament(
            name=data.get('name'),
            organizer_id=current_user['id'],
            sport=data.get('sport'),
            entry_fee=float(data.get('entry_fee') or 0),
            prize_pool=float(data.get('prize_pool') or 0),
            start_date=datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')) if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data['end_date'].replace('Z', '+00:00')) if data.get('end_date') else None,
            location=data.get('location'),
            max_teams=int(data.get('max_teams', 0)),
            image_url=data.get('image_url'),
            description=data.get('description'),
            rules=data.get('rules'),
            venue_type=venue_type,
            turf_id=data.get('turf_id') if venue_type == 'own_turf' else None, # Link if own turf
            status='published' # Default to published for now
        )
        
        db.session.add(new_tournament)
        db.session.add(new_tournament)
        db.session.flush() # Get ID

        # Auto-create "BOOKING" for the duration
        if new_tournament.turf_id:
            start = datetime.strptime(data.get('start_date'), '%Y-%m-%d')
            end = datetime.strptime(data.get('end_date'), '%Y-%m-%d')
            
            # Parse custom times (HH:MM)
            start_str = data.get('daily_start_time', '09:00').split(':')
            end_str = data.get('daily_end_time', '18:00').split(':')
            start_h, start_m = int(start_str[0]), int(start_str[1])
            end_h, end_m = int(end_str[0]), int(end_str[1])
            
            delta = end - start
            
            for i in range(delta.days + 1):
                day = start + timedelta(days=i)
                
                b = Booking(
                    user_id=current_user['id'],
                    turf_id=new_tournament.turf_id,
                    turf_unit_id=1,
                    start_time=day.replace(hour=start_h, minute=start_m),
                    end_time=day.replace(hour=end_h, minute=end_m),
                    total_price=0, # Owner/Organizer booking
                    status='confirmed',
                    payment_status='paid',
                    booking_source='tournament_host'
                )
                db.session.add(b)

        db.session.commit()
        
        return jsonify({
            'message': 'Tournament created successfully',
            'tournament_id': new_tournament.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Tournament Creation Error: {e}")
        return jsonify({'message': f'Error creating tournament: {str(e)}'}), 500

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    filter_type = request.args.get('filter', 'all')
    sport_filter = request.args.get('sport')
    
    query = Tournament.query
    
    if filter_type == 'upcoming':
        query = query.filter(Tournament.start_date >= datetime.now())
        
    if sport_filter and sport_filter != 'All':
        query = query.filter(Tournament.sport.ilike(f"%{sport_filter}%"))
    
    tournaments = query.order_by(Tournament.start_date.asc()).all()
    
    result = []
    for t in tournaments:
        result.append({
            'id': t.id,
            'name': t.name,
            'sport': t.sport,
            'start_date': t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
            'end_date': t.end_date.strftime('%Y-%m-%d') if t.end_date else None,
            'location': t.location,
            'entry_fee': t.entry_fee,
            'prize_pool': t.prize_pool,
            'image_url': t.image_url,
            'status': t.status
        })
        
    return jsonify(result), 200

@app.route('/api/tournaments/<int:tournament_id>', methods=['GET'])
def get_tournament_detail(tournament_id):
    t = Tournament.query.get_or_404(tournament_id)
    
    # Matches
    matches = [{
        'id': m.id,
        'round': m.round_name,
        'team1': m.team1_name,
        'team2': m.team2_name,
        'score1': m.score_team1,
        'score2': m.score_team2,
        'status': m.status,
        'time': m.scheduled_time.strftime('%H:%M %d/%m') if m.scheduled_time else None
    } for m in t.matches]
    
    # Announcements
    announcements = [{
        'id': a.id,
        'content': a.content,
        'created_at': a.created_at.strftime('%Y-%m-%d %H:%M')
    } for a in t.announcements]
    
    # Registrations (Public Count)
    reg_count = TournamentRegistration.query.filter_by(tournament_id=t.id).count()
    
    return jsonify({
        'id': t.id,
        'name': t.name,
        'sport': t.sport,
        'description': t.description,
        'rules': t.rules,
        'start_date': t.start_date.isoformat() if t.start_date else None,
        'end_date': t.end_date.isoformat() if t.end_date else None,
        'location': t.location,
        'entry_fee': t.entry_fee,
        'prize_pool': t.prize_pool,
        'image_url': t.image_url,
        'status': t.status,
        'max_teams': t.max_teams,
        'registered_teams': reg_count,
        'matches': matches,
        'announcements': announcements,
        'organizer_id': t.organizer_id,
        'registrations_list': [{
            'id': r.id,
            'team_name': r.team_name,
            'captain_name': r.captain_name,
            'contact_number': r.contact_number,
            'status': r.status,
            'payment_status': r.payment_status
        } for r in t.registrations]
    }), 200

@app.route('/api/tournaments/<int:tournament_id>/register', methods=['POST'])
@jwt_required()
def register_tournament_team(tournament_id):
    current_user = get_current_user()
    data = request.get_json()
    
    t = Tournament.query.get_or_404(tournament_id)
    
    # Check duplicate
    existing = TournamentRegistration.query.filter_by(tournament_id=t.id, user_id=current_user['id']).first()
    if existing:
        return jsonify({'message': 'You are already registered'}), 400
        
    # Check cap
    current_count = TournamentRegistration.query.filter_by(tournament_id=t.id).count()
    if t.max_teams and current_count >= t.max_teams:
        return jsonify({'message': 'Tournament is full'}), 400
        
    registration = TournamentRegistration(
        tournament_id=t.id,
        user_id=current_user['id'],
        team_name=data.get('team_name'),
        captain_name=data.get('captain_name', current_user['username']),
        contact_number=data.get('contact_number'),
        status='pending', # Payment pending usually
        payment_status='pending'
    )
    
    db.session.add(registration)
    db.session.commit()
    
    return jsonify({'message': 'Registration successful! Proceed to payment if required.'}), 201

@app.route('/api/tournaments/my-registrations', methods=['GET'])
@jwt_required()
def get_my_tournament_registrations():
    current_user = get_current_user()
    registrations = TournamentRegistration.query.filter_by(user_id=current_user['id']).all()
    
    result = []
    for reg in registrations:
        t = Tournament.query.get(reg.tournament_id)
        result.append({
            'registration_id': reg.id,
            'team_name': reg.team_name,
            'status': reg.status,
            'payment_status': reg.payment_status,
            'tournament': {
                'id': t.id,
                'name': t.name,
                'sport': t.sport,
                'start_date': t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
                'location': t.location,
                'status': t.status,
                'image_url': t.image_url
            }
        })
    return jsonify(result), 200

    return jsonify(result), 200

# --- ORGANIZER ROUTES ---

@app.route('/api/organizer/tournaments', methods=['GET'])
@jwt_required()
def get_organizer_tournaments():
    current_user = get_current_user()
    tournaments = Tournament.query.filter_by(organizer_id=current_user['id']).all()
    
    result = []
    for t in tournaments:
        # Calculate revenue/wallet
        confirmed_regs = TournamentRegistration.query.filter_by(tournament_id=t.id, payment_status='paid').count()
        wallet = confirmed_regs * (t.entry_fee or 0)
        
        result.append({
            'id': t.id,
            'name': t.name,
            'sport': t.sport,
            'status': t.status,
            'start_date': t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
            'team_count': len(t.registrations),
            'max_teams': t.max_teams,
            'wallet_balance': wallet,
            'entry_fee': t.entry_fee,
            'image_url': t.image_url
        })
    return jsonify(result), 200

@app.route('/api/tournaments/registrations/<int:reg_id>', methods=['PUT'])
@jwt_required()
def update_registration_status(reg_id):
    current_user = get_current_user()
    reg = TournamentRegistration.query.get_or_404(reg_id)
    t = Tournament.query.get(reg.tournament_id)
    
    # Auth check: Only organizer
    if t.organizer_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    
    if 'status' in data:
        reg.status = data['status']
    
    if 'payment_status' in data:
        reg.payment_status = data['payment_status']
        
    db.session.commit()
    return jsonify({'message': 'Registration updated'}), 200



@app.route('/api/tournaments/<int:tournament_id>/announcements', methods=['POST'])
@jwt_required()
def post_announcement(tournament_id):
    current_user = get_current_user()
    t = Tournament.query.get_or_404(tournament_id)
    
    if t.organizer_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    announ = TournamentAnnouncement(
        tournament_id=t.id,
        content=data.get('content')
    )
    db.session.add(announ)
    db.session.commit()
    return jsonify({'message': 'Announcement posted'}), 201

@app.route('/api/tournaments/<int:tournament_id>/matches', methods=['POST'])
@jwt_required()
def add_match(tournament_id):
    current_user = get_current_user()
    t = Tournament.query.get_or_404(tournament_id)
    
    if t.organizer_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    match = TournamentMatch(
        tournament_id=t.id,
        round_name=data.get('round_name'),
        team1_name=data.get('team1'),
        team2_name=data.get('team2'),
        scheduled_time=datetime.fromisoformat(data['time'].replace('Z', '+00:00')) if data.get('time') else None
    )
    db.session.add(match)
    db.session.commit()
    return jsonify({'message': 'Match added'}), 201

@app.route('/api/tournaments/matches/<int:match_id>/score', methods=['PUT'])
@jwt_required()
def update_score(match_id):
    current_user = get_current_user()
    match = TournamentMatch.query.get_or_404(match_id)
    t = Tournament.query.get(match.tournament_id)
    
    if t.organizer_id != current_user['id']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    match.score_team1 = data.get('score1', match.score_team1)
    match.score_team2 = data.get('score2', match.score_team2)
    match.status = data.get('status', match.status)
    if data.get('winner'):
        match.winner = data.get('winner')
        
    db.session.commit()
    return jsonify({'message': 'Score updated'}), 200





# ==========================================
# COMMUNITY FEATURE API
# ==========================================

@app.route('/api/communities', methods=['POST'])
@jwt_required()
def create_community():
    """Create a new community"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Validation
    if not data.get('name'):
        return jsonify({'message': 'Community name is required'}), 400
        
    try:
        new_community = Community(
            name=data.get('name'),
            description=data.get('description'),
            type=data.get('type', 'public'), # public, private
            image_url=data.get('image_url'),
            created_by=current_user['id']
        )
        db.session.add(new_community)
        db.session.commit()
        
        # Creator automatically becomes Admin
        admin_member = CommunityMember(
            community_id=new_community.id,
            user_id=current_user['id'],
            role='admin',
            status='active'
        )
        db.session.add(admin_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Community created successfully',
            'community_id': new_community.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/communities', methods=['GET'])
def get_communities():
    """List public communities or search"""
    limit = int(request.args.get('limit', 20))
    search = request.args.get('q')
    
    query = Community.query.filter_by(type='public')
    
    if search:
        query = query.filter(Community.name.ilike(f'%{search}%'))
        
    communities = query.order_by(Community.created_at.desc()).limit(limit).all()
    
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'description': c.description,
        'image_url': c.image_url,
        'members_count': CommunityMember.query.filter_by(community_id=c.id, status='active').count()
    } for c in communities]), 200

@app.route('/api/communities/my', methods=['GET'])
@jwt_required()
def get_my_communities():
    """Get communities the user has joined"""
    current_user = get_current_user()
    
    memberships = CommunityMember.query.filter_by(user_id=current_user['id'], status='active').all()
    
    results = []
    for m in memberships:
        c = Community.query.get(m.community_id)
        if c:
            results.append({
                'id': c.id,
                'name': c.name,
                'type': c.type,
                'role': m.role,
                'image_url': c.image_url
            })
            
    return jsonify(results), 200

@app.route('/api/communities/<int:community_id>', methods=['GET'])
@jwt_required()
def get_community_details(community_id):
    """Get full details of a community"""
    current_user = get_current_user()
    community = Community.query.get_or_404(community_id)
    
    # Check membership
    membership = CommunityMember.query.filter_by(
        community_id=community_id, 
        user_id=current_user['id']
    ).first()
    
    user_status = membership.status if membership else 'none'
    user_role = membership.role if membership else 'none'
    
    # If private and not a member, restrict info
    if community.type == 'private' and user_status != 'active':
        return jsonify({
            'id': community.id,
            'name': community.name,
            'description': community.description,
            'image_url': community.image_url,
            'type': community.type,
            'is_member': False,
            'status': user_status,
            'message': 'This is a private community. Request to join to see more.'
        }), 200
        
    return jsonify({
        'id': community.id,
        'name': community.name,
        'description': community.description,
        'image_url': community.image_url,
        'type': community.type,
        'created_by': community.created_by,
        'is_member': (user_status == 'active'),
        'role': user_role,
        'status': user_status,
        'members_count': CommunityMember.query.filter_by(community_id=community.id, status='active').count()
    }), 200

@app.route('/api/communities/<int:community_id>/join', methods=['POST'])
@jwt_required()
def join_community(community_id):
    """Join or request to join a community"""
    current_user = get_current_user()
    community = Community.query.get_or_404(community_id)
    
    # Check if already a member
    existing = CommunityMember.query.filter_by(
        community_id=community_id, 
        user_id=current_user['id']
    ).first()
    
    if existing:
        if existing.status == 'active':
            return jsonify({'message': 'Already a member'}), 400
        elif existing.status == 'pending':
             return jsonify({'message': 'Request already pending'}), 400
        elif existing.status == 'banned':
             return jsonify({'message': 'You are banned from this community'}), 403
    
    # Determine status based on privacy
    initial_status = 'active'
    if community.type == 'private':
        initial_status = 'pending'
        
    new_member = CommunityMember(
        community_id=community_id,
        user_id=current_user['id'],
        role='member',
        status=initial_status
    )
    
    db.session.add(new_member)
    db.session.commit()
    
    msg = 'Joined successfully' if initial_status == 'active' else 'Request sent for approval'
    return jsonify({'message': msg, 'status': initial_status}), 200

@app.route('/api/communities/<int:community_id>/members', methods=['GET'])
@jwt_required()
def get_community_members(community_id):
    """Get members list (Admin sees pending too)"""
    current_user = get_current_user()
    
    # Check permissions
    membership = CommunityMember.query.filter_by(community_id=community_id, user_id=current_user['id']).first()
    if not membership or membership.status != 'active':
        return jsonify({'message': 'Access denied'}), 403
        
    is_admin = (membership.role == 'admin')
    
    query = CommunityMember.query.filter_by(community_id=community_id)
    if not is_admin:
        query = query.filter_by(status='active')
        
    members = query.all()
    
    results = []
    for m in members:
        user = User.query.get(m.user_id)
        results.append({
            'userId': user.id,
            'username': user.username,
            'role': m.role,
            'status': m.status,
            'joined_at': m.joined_at.isoformat()
        })
        
    return jsonify(results), 200

@app.route('/api/communities/<int:community_id>/members/action', methods=['POST'])
@jwt_required()
def member_action(community_id):
    """Admin actions: Approve, Reject, Kick, Promote"""
    current_user = get_current_user()
    data = request.get_json()
    target_user_id = data.get('user_id')
    action = data.get('action') # approve, reject, kick, promote, demote
    
    # Verify Admin
    membership = CommunityMember.query.filter_by(community_id=community_id, user_id=current_user['id'], status='active').first()
    if not membership or membership.role != 'admin':
         return jsonify({'message': 'Unauthorized: Admin access required'}), 403
         
    target_member = CommunityMember.query.filter_by(community_id=community_id, user_id=target_user_id).first()
    if not target_member:
        return jsonify({'message': 'Member not found'}), 404
        
    if action == 'approve':
        target_member.status = 'active'
    elif action == 'reject':
        db.session.delete(target_member)
    elif action == 'kick':
        db.session.delete(target_member)
    elif action == 'promote':
        target_member.role = 'admin'
    elif action == 'demote':
        target_member.role = 'member'
        
    db.session.commit()
    return jsonify({'message': f'Action {action} completed'}), 200

@app.route('/api/communities/<int:community_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(community_id):
    """Get chat history"""
    current_user = get_current_user()
    limit = int(request.args.get('limit', 50))
    
    # Check access
    membership = CommunityMember.query.filter_by(community_id=community_id, user_id=current_user['id'], status='active').first()
    if not membership:
        return jsonify({'message': 'Access denied'}), 403
        
    messages = CommunityMessage.query.filter_by(community_id=community_id)\
        .order_by(CommunityMessage.created_at.desc())\
        .limit(limit).all()
        
    results = []
    for msg in reversed(messages): # Return chrono order
        results.append({
            'id': msg.id,
            'sender_id': msg.sender_id,
            'sender_name': msg.sender.username,
            'content': msg.content,
            'is_broadcast': msg.is_broadcast,
            'timestamp': msg.created_at.isoformat()
        })
        
    return jsonify(results), 200

@app.route('/api/communities/<int:community_id>/messages', methods=['POST'])
@jwt_required()
def send_message(community_id):
    """Send a message or broadcast"""
    current_user = get_current_user()
    data = request.get_json()
    content = data.get('content')
    is_broadcast = data.get('is_broadcast', False)
    
    if not content:
        return jsonify({'message': 'Content required'}), 400
        
    # Check membership
    membership = CommunityMember.query.filter_by(community_id=community_id, user_id=current_user['id'], status='active').first()
    if not membership:
        return jsonify({'message': 'Not a member'}), 403
        
    # Broadcast Permission Check
    can_broadcast = False
    if membership.role == 'admin':
        can_broadcast = True
    elif current_user['role'] in ['coach', 'owner', 'admin', 'academy']:
        can_broadcast = True
        
    if is_broadcast and not can_broadcast:
        return jsonify({'message': 'Unauthorized to send broadcast'}), 403
        
    # Create Message
    msg = CommunityMessage(
        community_id=community_id,
        sender_id=current_user['id'],
        content=content,
        is_broadcast=is_broadcast
    )
    
    db.session.add(msg)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent',
        'data': {
            'id': msg.id,
            'sender_id': msg.sender_id,
            'sender_name': current_user.get('username', 'Me'),
            'content': msg.content,
            'is_broadcast': msg.is_broadcast,
            'timestamp': msg.created_at.isoformat()
        }
    }), 201

# ---------------------------------------------------------------------
# MATCHMAKING (TEAMS) ROUTES
# ---------------------------------------------------------------------

@app.route('/api/matches', methods=['POST'])
@jwt_required()
def create_match_request():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    booking_id = data.get('booking_id')
    players_needed = data.get('players_needed')
    
    if not booking_id or not players_needed:
        return jsonify({'message': 'Booking ID and players needed are required'}), 400
        
    print(f"DEBUG: create_match_request. Token User: {user_id}. Data: {data}")
    
    booking = Booking.query.get(booking_id)
    if not booking:
        print(f"DEBUG: Booking {booking_id} not found")
        return jsonify({'message': 'Invalid booking'}), 403
    
    if booking.user_id != user_id:
        print(f"DEBUG: Booking User Mismatch. Booking User: {booking.user_id}, Token User: {user_id}")
        return jsonify({'message': 'Invalid booking'}), 403

    # Calculate approximate cost per player (Booking Owner + N players)
    total_participants = int(players_needed) + 1
    cost_per_player = booking.total_price / total_participants
    
    new_match = MatchRequest(
        creator_id=user_id,
        booking_id=booking_id,
        sport=data.get('sport', 'Football'), # Default or fetch from Booking->Turf->Game
        gender_preference=data.get('gender_preference', 'Any'),
        skill_level=data.get('skill_level', 'Any'),
        players_needed=int(players_needed),
        cost_per_player=cost_per_player,
        description=data.get('description', ''),
        status='open'
    )
    
    db.session.add(new_match)
    db.session.commit()
    
    return jsonify({'message': 'Match created successfully', 'id': new_match.id}), 201

@app.route('/api/bookings/confirm', methods=['POST'])
@jwt_required()
def confirm_player_booking():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    booking_id = data.get('booking_id')
    payment_mode = data.get('payment_mode')
    
    booking = Booking.query.get_or_404(booking_id)
    
    if booking.user_id != user_id:
        print(f"DEBUG: Unauthorized confirm. Token User: {user_id}, Booking User: {booking.user_id}")
        return jsonify({'message': f'Unauthorized. Token: {user_id}, Book: {booking.user_id}'}), 403
        
    # Update status to 'under_review' as requested by the user flow
    # This ensures it shows up with the correct status in "My Bookings"
    booking.status = 'under_review' 
    booking.payment_mode = payment_mode
    booking.payment_status = 'paid' if payment_mode == 'full' else 'partial'
    
    db.session.commit()
    
    return jsonify({'message': 'Booking confirmed under review', 'status': booking.status}), 200

@app.route('/api/matches', methods=['GET'])
def get_matches():
    # Filters: sport, city (via booking->turf->location)
    sport = request.args.get('sport')
    
    query = MatchRequest.query.filter(MatchRequest.status == 'open')
    
    if sport:
        query = query.filter(MatchRequest.sport.ilike(f"%{sport}%"))
        
    matches = query.order_by(MatchRequest.created_at.desc()).all()
    
    result = []
    for m in matches:
        turf_name = m.booking.unit.game.turf.name if m.booking else "Unknown Turf"
        location = m.booking.unit.game.turf.location if m.booking else "Unknown Location"
        start_time = m.booking.start_time.strftime("%Y-%m-%d %H:%M") if m.booking else "TBD"
        
        result.append({
            'id': m.id,
            'sport': m.sport,
            'gender_preference': m.gender_preference,
            'players_needed': m.players_needed,
            'cost_per_player': m.cost_per_player,
            'description': m.description,
            'turf_name': turf_name,
            'location': location,
            'time': start_time,
            'creator_name': m.creator.username,
            'created_at': m.created_at
        })
        
    return jsonify(result), 200

@app.route('/api/matches/my', methods=['GET'])
@jwt_required()
def get_my_matches():
    user_id = int(get_jwt_identity())
    
    # Matches created by user
    created = MatchRequest.query.filter_by(creator_id=user_id).all()
    
    # Matches joined by user
    joined_requests = MatchJoinRequest.query.filter_by(user_id=user_id).all()
    
    created_data = [{
        'id': m.id,
        'sport': m.sport,
        'status': m.status,
        'players_needed': m.players_needed,
        'join_requests_count': len(m.join_requests),
        'turf_name': m.booking.unit.game.turf.name if m.booking else "Unknown",
        'requests': [{
            'id': r.id,
            'user_name': r.user.username,
            'status': r.status,
            'user_skill': r.user.skill_level or 'Unknown'
        } for r in m.join_requests]
    } for m in created]
    
    joined_data = [{
        'id': jr.match.id,
        'sport': jr.match.sport,
        'status': jr.status, # Request status
        'match_status': jr.match.status,
        'turf_name': jr.match.booking.unit.game.turf.name if jr.match.booking else "Unknown"
    } for jr in joined_requests]
    
    return jsonify({'hosted': created_data, 'joined': joined_data}), 200

@app.route('/api/matches/<int:match_id>/join', methods=['POST'])
@jwt_required()
def join_match(match_id):
    user_id = int(get_jwt_identity())
    
    match = MatchRequest.query.get_or_404(match_id)
    
    # Allowed creator to join own match
    # if match.creator_id == user_id:
    #     return jsonify({'message': 'You cannot join your own match'}), 400
        
    if match.status != 'open':
        return jsonify({'message': 'Match is not open for joining'}), 400
        
    existing = MatchJoinRequest.query.filter_by(match_id=match_id, user_id=user_id).first()
    if existing:
        return jsonify({'message': 'Request already sent'}), 400
        
    new_req = MatchJoinRequest(match_id=match_id, user_id=user_id, status='pending')
    db.session.add(new_req)
    db.session.commit()
    
    return jsonify({'message': 'Join request sent'}), 201

@app.route('/api/matches/join-requests/<int:req_id>/action', methods=['POST'])
@jwt_required()
def action_join_request(req_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get('action') # approve, reject
    
    join_req = MatchJoinRequest.query.get_or_404(req_id)
    match = join_req.match
    
    if match.creator_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    if action == 'approve':
        join_req.status = 'approved'
        # Logic: Check if full?
        # approved_count = MatchJoinRequest.query.filter_by(match_id=match.id, status='approved').count()
        # if approved_count >= match.players_needed:
        #     match.status = 'full'
    elif action == 'reject':
        join_req.status = 'rejected'
    else:
        return jsonify({'message': 'Invalid action'}), 400
        
    db.session.commit()
    return jsonify({'message': f'Request {action}ed'}), 200

@app.route('/api/matches/join-requests/<int:req_id>/pay', methods=['POST'])
@jwt_required()
def pay_match_fee(req_id):
    user_id = int(get_jwt_identity())
    
    join_req = MatchJoinRequest.query.get_or_404(req_id)
    
    if join_req.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    if join_req.status != 'approved':
        return jsonify({'message': 'Cannot pay for unapproved request'}), 400
        
    # Simulate Payment Processing
    join_req.status = 'paid'
    db.session.commit()
    
    return jsonify({'message': 'Payment successful! You are now confirmed.'}), 200

# ---------------------------------------------------------------------
# SUPPORT AI ROUTES
# ---------------------------------------------------------------------

@app.route('/api/support/chat', methods=['POST'])
def support_chat():
    if not chat_model:
        return jsonify({'reply': "I'm currently undergoing maintenance. Please try again later."}), 503
        
    data = request.get_json()
    user_msg = data.get('message', '')
    history = data.get('history', []) # list of {role: 'user/bot', text: '...'}
    
    # Convert history to Gemini format (user/model)
    chat_history = []
    for h in history:
        role = 'user' if h['role'] == 'user' else 'model'
        chat_history.append({'role': role, 'parts': [h['text']]})
        
    try:
        chat = chat_model.start_chat(history=chat_history)
        response = chat.send_message(user_msg)
        return jsonify({'reply': response.text})
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({'reply': "I encountered an error processing your request. Please try again."}), 500

if __name__ == '__main__':
    # Force reload
    app.run(debug=True, port=5000)
