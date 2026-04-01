from flask import Blueprint, request
from marshmallow import ValidationError
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app.schemas.user_schema import UserSchema
from app.extensions import db
from app.utils.responses import success_response, error_response, validation_error, unauthorized_error

auth_bp = Blueprint('auth', __name__)
user_schema = UserSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        validated_data = user_schema.load(data)
    except ValidationError as err:
        return validation_error(err.messages)

    if User.query.filter_by(email=validated_data['email']).first():
        return error_response("Email already registered", status=409)

    user = User(
        name=validated_data['name'],
        email=validated_data['email'],
        # role default is 'viewer' unless specified, but for safety lets enforce it or let schema handle
        role=validated_data.get('role', 'viewer')
    )
    user.set_password(validated_data['password'])

    db.session.add(user)
    db.session.commit()

    return success_response({
        "user": user_schema.dump(user)
    }, message="Registration successful", status=201)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return validation_error("Email and password are required")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return unauthorized_error("Invalid credentials")

    if not user.is_active:
        return error_response("Account is disabled", status=403)

    access_token = create_access_token(identity=user.id)
    return success_response({
        "token": access_token,
        "user": user_schema.dump(user)
    }, message="Login successful")

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", status=404)
        
    return success_response({
        "user": user_schema.dump(user)
    })
