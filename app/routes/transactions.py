from flask import Blueprint, request
from marshmallow import ValidationError
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionSchema, TransactionUpdateSchema
from app.extensions import db
from app.utils.responses import success_response, not_found_error, validation_error, error_response
from app.middleware.rbac import require_roles
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)
transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)
transaction_update_schema = TransactionUpdateSchema()

@transactions_bp.route('/', methods=['GET'])
@require_roles('viewer', 'analyst', 'admin')
def get_transactions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Transaction.query.filter_by(is_deleted=False)

    # Filtering
    txn_type = request.args.get('type')
    if txn_type:
        query = query.filter_by(type=txn_type)
        
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
        
    start_date = request.args.get('start_date')
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Transaction.date >= start_date_obj)
        except ValueError:
            return error_response("Invalid start_date format, YYYY-MM-DD required", status=400)
            
    end_date = request.args.get('end_date')
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Transaction.date <= end_date_obj)
        except ValueError:
            return error_response("Invalid end_date format, YYYY-MM-DD required", status=400)

    # Ordering
    query = query.order_by(Transaction.date.desc())

    # Pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response({
        "transactions": transactions_schema.dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    })

@transactions_bp.route('/', methods=['POST'])
@require_roles('admin')
def create_transaction():
    try:
        data = request.get_json() or {}
        validated_data = transaction_schema.load(data)
    except ValidationError as err:
        return validation_error(err.messages)

    current_user_id = get_jwt_identity()

    txn = Transaction(
        amount=validated_data['amount'],
        type=validated_data['type'],
        category=validated_data['category'],
        date=validated_data['date'],
        notes=validated_data.get('notes'),
        created_by=current_user_id
    )

    db.session.add(txn)
    db.session.commit()

    return success_response({
        "transaction": transaction_schema.dump(txn)
    }, status=201, message="Transaction created successfully")

@transactions_bp.route('/<id>', methods=['GET'])
@require_roles('viewer', 'analyst', 'admin')
def get_transaction(id):
    txn = Transaction.query.filter_by(id=id, is_deleted=False).first()
    if not txn:
        return not_found_error("Transaction not found")
        
    return success_response({
        "transaction": transaction_schema.dump(txn)
    })

@transactions_bp.route('/<id>', methods=['PATCH'])
@require_roles('admin')
def update_transaction(id):
    txn = Transaction.query.filter_by(id=id, is_deleted=False).first()
    if not txn:
        return not_found_error("Transaction not found")

    try:
        data = request.get_json() or {}
        validated_data = transaction_update_schema.load(data, partial=True)
    except ValidationError as err:
        return validation_error(err.messages)

    if 'amount' in validated_data:
        txn.amount = validated_data['amount']
    if 'type' in validated_data:
        txn.type = validated_data['type']
    if 'category' in validated_data:
        txn.category = validated_data['category']
    if 'date' in validated_data:
        txn.date = validated_data['date']
    if 'notes' in validated_data:
        txn.notes = validated_data['notes']

    db.session.commit()

    return success_response({
        "transaction": transaction_schema.dump(txn)
    }, message="Transaction updated successfully")

@transactions_bp.route('/<id>', methods=['DELETE'])
@require_roles('admin')
def delete_transaction(id):
    txn = Transaction.query.filter_by(id=id, is_deleted=False).first()
    if not txn:
        return not_found_error("Transaction not found")
        
    txn.is_deleted = True
    db.session.commit()

    return success_response(message="Transaction deleted successfully")
