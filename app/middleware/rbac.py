from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
from app.utils.responses import unauthorized_error, forbidden_error

def require_roles(*roles):
    """
    Decorator to verify JWT, check if user exists, is active,
    and has one of the allowed roles.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return unauthorized_error("Missing or invalid token")
            
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return unauthorized_error("User not found")
                
            if not user.is_active:
                return forbidden_error("Account is deactivated")
                
            if user.role not in roles:
                return forbidden_error(f"Role '{user.role}' not authorized to perform this action")
                
            # optionally, can inject user into request kwargs
            # kwargs['current_user'] = user
            return fn(*args, **kwargs)
        return decorator
    return wrapper
