import traceback
from flask import Flask
from werkzeug.exceptions import HTTPException
from config import config_map
from app.extensions import db, jwt, cors
from app.utils.responses import error_response

def create_app(config_name='development'):
    # serve frontend from /static folder
    app = Flask(__name__, static_folder='../static')
    app.config.from_object(config_map[config_name])

    # init extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    # register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.transactions import transactions_bp
    from app.routes.dashboard import dashboard_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    @app.route('/')
    def serve_index():
        return app.send_static_file('index.html')

    @app.errorhandler(Exception)
    def handle_exception(e):
        # pass through HTTP errors (like 404, 405)
        if isinstance(e, HTTPException):
            return error_response(str(e.description), code=f"HTTP_{e.code}", status=e.code)
        
        # log unexpected exceptions here in a real app
        print(traceback.format_exc())
        return error_response("An internal server error occurred", code="INTERNAL_SERVER_ERROR", status=500)
    
    return app
