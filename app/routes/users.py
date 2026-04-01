from flask import Blueprint, request
from marshmallow import ValidationError
from app.models.user import User
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app.extensions import db
from app.utils.responses import success_response, not_found_error, validation_error
from app.middleware.rbac import require_roles

users_bp = Blueprint('users', __name__)
user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_update_schema = UserUpdateSchema()

@users_bp.route('/', methods=['GET'])
@require_roles('admin')
def get_users():
    users = User.query.all()
    return success_response({
        "users": users_schema.dump(users)
    })

@users_bp.route('/<id>', methods=['GET'])
@require_roles('admin')
def get_user(id):
    user = User.query.get(id)
    if not user:
        return not_found_error("User not found")
        
    return success_response({
        "user": user_schema.dump(user)
    })

@users_bp.route('/<id>', methods=['PATCH'])
@require_roles('admin')
def update_user(id):
    user = User.query.get(id)
    if not user:
        return not_found_error("User not found")

    try:
        data = request.get_json() or {}
        validated_data = user_update_schema.load(data, partial=True)
    except ValidationError as err:
        return validation_error(err.messages)

    if 'role' in validated_data:
        user.role = validated_data['role']
    if 'is_active' in validated_data:
        user.is_active = validated_data['is_active']

    db.session.commit()

    return success_response({
        "user": user_schema.dump(user)
    }, message="User updated successfully")

@users_bp.route('/<id>', methods=['DELETE'])
@require_roles('admin')
def delete_user(id):
    user = User.query.get(id)
    if not user:
        return not_found_error("User not found")
        
    user.is_active = False
    db.session.commit()

    return success_response(message="User deactivated successfully")
