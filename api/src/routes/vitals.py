from flask import Blueprint, jsonify, request
import os
from garminconnect import Garmin

vitals_bp = Blueprint('vitals', __name__)

GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')

garmin_client = None

def get_garmin_client():
    """Initialize and return authenticated Garmin client"""
    global garmin_client
    
    if garmin_client is None:
        try:
            garmin_client = Garmin(GARMIN_EMAIL, GARMIN_PASSWORD)
            garmin_client.login()
            print("Successfully logged in to Garmin Connect")
        except Exception as e:
            print(f"Error logging in to Garmin: {e}")
            raise
    
    return garmin_client

@vitals_bp.route('/api/vitals', methods=['GET'])
def get_vitals():
    """Get vitals for a specific date"""
    try:
        date = request.args.get('date')
        
        if not date:
            return jsonify({'error': 'date parameter is required'}), 400
        
        client = get_garmin_client()
        
        stats = client.get_stats(date)
        sleep_data = client.get_sleep_data(date)
        hrv_data = client.get_hrv_data(date)
        
        vitals = {
            'date': date,
            'sleepScore': sleep_data.get('sleepScores', {}).get('overall', {}).get('value', None) if sleep_data else None,
            'sleepingHR': sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
            'hrv': hrv_data.get('lastNightAvg', None) if hrv_data else None,
            'stress': stats.get('averageStressLevel', None)
        }
        
        return jsonify({'vitals': vitals})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500