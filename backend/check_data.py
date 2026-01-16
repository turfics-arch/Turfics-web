from app import app, db, Community, CommunityMember, User

with app.app_context():
    user_count = User.query.count()
    community_count = Community.query.count()
    member_count = CommunityMember.query.count()
    
    print(f"Users: {user_count}")
    print(f"Communities: {community_count}")
    print(f"Memberships: {member_count}")
    
    if community_count > 0:
        print("\nExisting Communities:")
        for c in Community.query.all():
            print(f"- {c.name} ({c.type})")
