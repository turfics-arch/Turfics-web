from app import app, db, Community, CommunityMember, User
import random

def seed_communities():
    with app.app_context():
        # diverse categories
        communities = [
            {
                "name": "Weekend Warriors FC",
                "description": "Casual football matches every Saturday morning. All skill levels welcome!",
                "type": "public",
                "image_url": "https://images.unsplash.com/photo-1522778119026-d647f0565c6da?w=800&auto=format&fit=crop"
            },
            {
                "name": "Pro Tennis Circuit",
                "description": "For serious tennis players looking for competitive matches and tournaments.",
                "type": "public",
                "image_url": "https://images.unsplash.com/photo-1595435934270-d5a48ab2333a?w=800&auto=format&fit=crop"
            },
            {
                "name": "Cricket Legends",
                "description": "Discuss matches, organize street cricket, and find local turf slots.",
                "type": "public",
                "image_url": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop"
            },
            {
                "name": "Badminton Club Elite",
                "description": "Daily evening sessions. Book your slots and find partners here.",
                "type": "public",
                "image_url": "https://images.unsplash.com/photo-1626224583764-84786c713608?w=800&auto=format&fit=crop"
            },
            {
                "name": "Hoops & Dreams",
                "description": "Street basketball community. 3v3 tournaments every month.",
                "type": "public",
                "image_url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop"
            }
        ]

        # Get a fallback user (first admin or user 1)
        creator = User.query.first()
        if not creator:
            print("No users found! Create a user first.")
            return

        count = 0
        for c_data in communities:
            exists = Community.query.filter_by(name=c_data['name']).first()
            if not exists:
                new_c = Community(
                    name=c_data['name'],
                    description=c_data['description'],
                    type=c_data['type'],
                    image_url=c_data['image_url'],
                    created_by=creator.id
                )
                db.session.add(new_c)
                db.session.commit() # Commit to get ID
                
                # Add creator as admin
                mem = CommunityMember(
                    community_id=new_c.id,
                    user_id=creator.id,
                    role='admin',
                    status='active'
                )
                db.session.add(mem)
                count += 1
        
        db.session.commit()
        print(f"Seeded {count} new communities.")

if __name__ == "__main__":
    seed_communities()
