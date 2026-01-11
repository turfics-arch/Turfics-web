
from app import app, db, User

def test_connection():
    print("Testing connection to: ", app.config['SQLALCHEMY_DATABASE_URI'])
    try:
        with app.app_context():
            # count users
            user_count = User.query.count()
            print(f"✅ Connection Successful!")
            print(f"found {user_count} users in the database.")
            
            # Print first 5 users to verify migration
            users = User.query.all()
            print("\n--- Users Found ---")
            for u in users:
                print(f"ID: {u.id} | Username: {u.username} | Role: {u.role} | Password Hash Start: {u.password_hash[:10] if u.password_hash else 'None'}")
                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == '__main__':
    test_connection()
