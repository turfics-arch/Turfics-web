from app import app

print("Mapping Rules:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule}")
