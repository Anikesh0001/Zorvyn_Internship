import os
from app import create_app
from app.extensions import db

# Load environment logic
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

if __name__ == '__main__':
    # When running directly during development
    app.run(host='0.0.0.0', port=5001)
