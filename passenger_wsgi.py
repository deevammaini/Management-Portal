import sys
import os

# Add your app directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import your Flask app
from flask_backend_mysql import app

# This is the WSGI application
application = app
