from app import app, db
from models import Tournament, TournamentRegistration, TournamentMatch, TournamentAnnouncement, Turf, Booking, User
from sqlalchemy import text

with app.app_context():
    print("Migrating Tournament tables and fields...")
    
    # Check if table exists manually or by trying to query
    try:
        # Create tables if they don't exist
        db.create_all()
        print("Created new tables (TournamentMatch, TournamentAnnouncement) if they were missing.")

        # Manually alter Tournament table to add new columns if they are missing
        # This is a 'poor man's migration' since we aren't using Flask-Migrate CLI interactively here easily
        
        # Helper to check column
        conn = db.engine.connect()
        
        def add_column(table, column, type_def):
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
                print(f"Added column {column} to {table}")
            except Exception as e:
                # Column likely exists
                print(f"Column {column} likely exists in {table} (or error: {str(e)})")

        with conn.begin(): # Start transaction
            add_column('tournaments', 'venue_type', 'VARCHAR(20)')
            add_column('tournaments', 'turf_id', 'INTEGER REFERENCES turfs(id)')
            add_column('tournaments', 'booking_id', 'INTEGER REFERENCES bookings(id)')
            add_column('tournaments', 'description', 'TEXT')
            add_column('tournaments', 'rules', 'TEXT')
            add_column('tournaments', 'status', 'VARCHAR(20)')
            add_column('tournaments', 'wallet_balance', 'FLOAT')
            
            add_column('tournament_registrations', 'user_id', 'INTEGER REFERENCES users(id)')
            add_column('tournament_registrations', 'payment_status', 'VARCHAR(20)')
        
        print("Migration columns added/checked.")
    except Exception as e:
        print(f"Migration error: {e}")
        
    print("Done.")
