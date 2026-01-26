from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, MaintenanceTask, Asset, InventoryItem, Supplier, TurfConditionLog, Turf, User
from datetime import datetime
import json

maintenance_bp = Blueprint('maintenance', __name__)

# --- Maintenance Tasks ---

@maintenance_bp.route('/api/maintenance/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    current_user_id = get_jwt_identity()
    turf_id = request.args.get('turf_id')
    if not turf_id:
        return jsonify({'message': 'turf_id required'}), 400
    
    tasks = MaintenanceTask.query.filter_by(turf_id=turf_id).all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'description': t.description,
        'task_type': t.task_type,
        'scheduled_date': t.scheduled_date.isoformat(),
        'priority': t.priority,
        'status': t.status,
        'is_recurring': t.is_recurring,
        'asset_id': t.asset_id
    } for t in tasks])

@maintenance_bp.route('/api/maintenance/tasks', methods=['POST'])
@jwt_required()
def create_task():
    data = request.json
    try:
        new_task = MaintenanceTask(
            turf_id=data['turf_id'],
            asset_id=data.get('asset_id'),
            title=data['title'],
            description=data.get('description'),
            task_type=data.get('task_type'),
            scheduled_date=datetime.fromisoformat(data['scheduled_date']),
            priority=data.get('priority', 'medium'),
            is_recurring=data.get('is_recurring', False),
            recurrence_rule=data.get('recurrence_rule')
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify({'message': 'Task created', 'id': new_task.id}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

# --- Assets ---

@maintenance_bp.route('/api/maintenance/assets', methods=['GET'])
@jwt_required()
def get_assets():
    turf_id = request.args.get('turf_id')
    assets = Asset.query.filter_by(turf_id=turf_id).all()
    return jsonify([{
        'id': a.id,
        'name': a.name,
        'category': a.category,
        'serial_number': a.serial_number,
        'status': a.status,
        'current_hours': a.current_hours,
        'next_service_date': a.next_service_date.isoformat() if a.next_service_date else None
    } for a in assets])

# --- Inventory ---

@maintenance_bp.route('/api/maintenance/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    turf_id = request.args.get('turf_id')
    items = InventoryItem.query.filter_by(turf_id=turf_id).all()
    return jsonify([{
        'id': i.id,
        'name': i.name,
        'category': i.category,
        'current_stock': i.current_stock,
        'unit': i.unit,
        'min_stock_alert': i.min_stock_alert
    } for i in items])

# --- Condition Logs ---

@maintenance_bp.route('/api/maintenance/condition-logs', methods=['POST'])
@jwt_required()
def add_condition_log():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.json
    new_log = TurfConditionLog(
        turf_id=data['turf_id'],
        grass_quality=data.get('grass_quality'),
        wear_level=data.get('wear_level'),
        drainage_status=data.get('drainage_status'),
        notes=data.get('notes'),
        photo_url=data.get('photo_url'),
        performed_by=user.username if user else 'Unknown'
    )
    db.session.add(new_log)
    db.session.commit()
    return jsonify({'message': 'Log saved'}), 201
