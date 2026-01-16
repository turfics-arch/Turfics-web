import sys
try:
    from app import app
    with open('routes.txt', 'w') as f:
        for rule in app.url_map.iter_rules():
            f.write(f"{rule.endpoint}: {rule}\n")
    print("Routes written to routes.txt")
except Exception as e:
    with open('routes.txt', 'w') as f:
        f.write(f"Error: {e}")
    print(f"Error: {e}")
