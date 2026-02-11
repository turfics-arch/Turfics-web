import requests
import json
import random
import string

# Configuration
BASE_URL = "https://turfics-web.onrender.com"
EMAIL = f"debug_{''.join(random.choices(string.ascii_lowercase, k=5))}@example.com"
USERNAME = f"debug_{''.join(random.choices(string.ascii_lowercase, k=5))}"
PASSWORD = "password123"

def debug_api():
    print(f"--- Debugging API: {BASE_URL} ---")
    
    try:
        # 1. Register
        print(f"Registering {USERNAME}...")
        res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": USERNAME, "email": EMAIL, "password": PASSWORD, "role": "owner"
        })
        if res.status_code != 201:
             print(f"Registration Failed: {res.text}")
             # try login if exists
        
        # 2. Login
        print("Logging in...")
        res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": USERNAME, "password": PASSWORD})
        if res.status_code != 200:
            print(f"Login Failed: {res.text}")
            return
        
        token = res.json()['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        print("Login Success.")
        
        # 3. Create Turf
        print("Creating Turf...")
        res = requests.post(f"{BASE_URL}/api/turfs/create", headers=headers, json={
            "name": "Debug Arena", "location": "Test Loc", "opening_time": "06:00", "closing_time": "23:00"
        })
        if res.status_code != 201:
            print(f"Create Turf Failed: {res.text}")
            return
        turf_id = res.json()['turf_id']
        print(f"Turf Created: {turf_id}")
        
        # 4. Create Game
        print("Creating Game...")
        res = requests.post(f"{BASE_URL}/api/turfs/{turf_id}/games", headers=headers, json={
            "sport_type": "Football", "default_price": 1000, "slot_duration": 60
        })
        if res.status_code != 201:
             print(f"Create Game Failed: {res.text}")
             return
        game_id = res.json()['game_id']
        print(f"Game Created: {game_id}")
        
        # 5. Create Unit
        print("Creating Unit...")
        res = requests.post(f"{BASE_URL}/api/games/{game_id}/units", headers=headers, json={
             "name": "Pitch A", "unit_type": "PITCH", "capacity": 10, "size": "5v5", "indoor": False, "has_lighting": True
        })
        if res.status_code != 201:
             print(f"Create Unit Failed: {res.text}")
             return
        print("Unit Created.")
        
        # 6. Fetch Games & Verify
        print(f"Fetching Games for Turf {turf_id}...")
        res = requests.get(f"{BASE_URL}/api/turfs/{turf_id}/games", headers=headers)
        games = res.json()
        
        print("\n--- RAW GAMES JSON RESPONSE ---")
        print(json.dumps(games, indent=2))
        print("-------------------------------")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    debug_api()
