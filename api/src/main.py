from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Import blueprints
from .routes.health import health_bp
from .routes.sync import sync_bp
from .routes.activities import activities_bp
from .routes.vitals import vitals_bp
from .routes.workouts import workouts_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(health_bp)
app.register_blueprint(sync_bp)
app.register_blueprint(activities_bp)
app.register_blueprint(vitals_bp)
app.register_blueprint(workouts_bp)

GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')


if __name__ == '__main__':
    # Check if credentials are set
    if not GARMIN_EMAIL or not GARMIN_PASSWORD:
        print("ERROR: GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env file")
        exit(1)
    
    print("Starting Garmin Connect Backend...")
    print(f"Login email: {GARMIN_EMAIL}")
    app.run(debug=True, host='0.0.0.0', port=5000)
