from app import app
from models import Turf
with app.app_context():
    print('Turf count:', Turf.query.count())
    turfs = Turf.query.all()
    for t in turfs:
        print(f'ID: {t.id}, Name: {t.name}, Status: {t.status}')
