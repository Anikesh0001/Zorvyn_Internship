from flask import Blueprint, request
from sqlalchemy import func
from app.models.transaction import Transaction
from app.extensions import db
from app.utils.responses import success_response
from app.middleware.rbac import require_roles
from app.schemas.transaction_schema import TransactionSchema
from datetime import datetime
from dateutil.relativedelta import relativedelta

dashboard_bp = Blueprint('dashboard', __name__)
transactions_schema = TransactionSchema(many=True)

@dashboard_bp.route('/summary', methods=['GET'])
@require_roles('analyst', 'admin')
def get_summary():
    transactions = Transaction.query.filter_by(is_deleted=False).all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
    net_balance = total_income - total_expenses
    record_count = len(transactions)
    
    return success_response({
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_balance": net_balance,
        "record_count": record_count
    })

@dashboard_bp.route('/by-category', methods=['GET'])
@require_roles('analyst', 'admin')
def get_by_category():
    results = db.session.query(
        Transaction.category, Transaction.type, func.sum(Transaction.amount)
    ).filter_by(is_deleted=False).group_by(Transaction.category, Transaction.type).all()
    
    data = []
    for cat, t_type, total in results:
        data.append({
            "category": cat,
            "type": t_type,
            "total": total
        })
        
    return success_response({"categories": data})

@dashboard_bp.route('/trends', methods=['GET'])
@require_roles('analyst', 'admin')
def get_trends():
    today = datetime.today().date()
    # Go back 5 full months from current month + current month = 6 months
    six_months_ago = today.replace(day=1) - relativedelta(months=5)
    
    results = db.session.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        Transaction.type,
        func.sum(Transaction.amount)
    ).filter(
        Transaction.is_deleted == False,
        Transaction.date >= six_months_ago
    ).group_by('month', Transaction.type).order_by('month').all()
    
    data = []
    for month, t_type, total in results:
        data.append({
            "month": month,
            "type": t_type,
            "total": total
        })
        
    return success_response({"trends": data})

@dashboard_bp.route('/recent', methods=['GET'])
@require_roles('viewer', 'analyst', 'admin')
def get_recent():
    txns = Transaction.query.filter_by(is_deleted=False).order_by(Transaction.date.desc(), Transaction.created_at.desc()).limit(10).all()
    
    return success_response({
        "transactions": transactions_schema.dump(txns)
    })
