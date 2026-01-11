
import os
import sys
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker

# 1. Setup paths and imports
sys.path.append(os.getcwd())
from app import app, db # Import main app to get models/metadata

# 2. Configuration
# Local DB (Source)
LOCAL_DB_URL = "postgresql+psycopg2://postgres:2024@localhost:5432/turfics_db"

# Remote DB (Destination) - From your previous setup
REMOTE_DB_URL = "postgresql://neondb_owner:npg_YAhykjb15uXz@ep-odd-sea-ahy6x0t8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def migrate_data():
    print("--- STARTING MIGRATION: LOCAL -> CLOUD ---")
    
    # Create Engines
    local_engine = create_engine(LOCAL_DB_URL)
    remote_engine = create_engine(REMOTE_DB_URL)
    
    # Create Sessions
    LocalSession = sessionmaker(bind=local_engine)
    RemoteSession = sessionmaker(bind=remote_engine)
    
    local_session = LocalSession()
    remote_session = RemoteSession()

    try:
        # Test Connections
        print("Checking connections...")
        local_connection = local_engine.connect()
        remote_connection = remote_engine.connect()
        print("✅ Connected to both databases.")

        # Get Tables in Dependency Order
        # We need the app context so SQLAlchemy knows about the models
        with app.app_context():
            metadata = db.metadata
            # Sort tables by dependency (Users first, etc.)
            sorted_tables = metadata.sorted_tables

            print(f"Found {len(sorted_tables)} tables to migrate.")

            # CLEANUP: Delete data in reverse dependency order to avoid FK errors
            print("Cleaning remote database...")
            # We skip session_replication_role as it requires superuser which might fail
            
            # Delete in reverse order (Child tables first, then Parents)
            for table in reversed(sorted_tables):
                print(f"  - Deleting data from {table.name}...")
                remote_connection.execute(text(f'DELETE FROM "{table.name}";'))
                remote_connection.commit()
            
            print("⬇️  Starting Data Copy...")

            # Migrate Data
            for table in sorted_tables:
                table_name = table.name
                print(f"Migrating table: {table_name}...")
                
                # 1. Fetch data from Local
                # Use text() for raw SQL selection to be safe
                rows = local_connection.execute(text(f'SELECT * FROM "{table_name}"')).fetchall()
                
                if not rows:
                    print(f"   (Skipping {table_name}: No data)")
                    continue
                
                print(f"   -> Found {len(rows)} rows. Inserting...")

                # 2. Insert into Remote
                # We use SQLAlchemy's Table object to generate the INSERT statement
                # This handles column mapping automatically
                data_to_insert = [dict(row._mapping) for row in rows]
                
                if data_to_insert:
                    # Execute bulk insert
                    remote_connection.execute(table.insert(), data_to_insert)
                    remote_connection.commit() # Commit after each table
                
            # Done
            print("\n✅ MIGRATION COMPLETE! Your local data is now live.")

    except Exception as e:
        print(f"\n❌ ERROR during migration: {e}")
        remote_connection.rollback()
    finally:
        local_session.close()
        remote_session.close()
        local_connection.close()
        remote_connection.close()

if __name__ == "__main__":
    migrate_data()
