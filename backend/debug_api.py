import urllib.request
import urllib.error

try:
    print("Attempting to fetch tournaments...")
    with urllib.request.urlopen('http://localhost:5000/api/tournaments') as response:
        print(f"Status Code: {response.getcode()}")
        print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Error Content: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Request failed: {e}")
