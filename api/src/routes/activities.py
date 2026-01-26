from flask import Blueprint, jsonify, request
import os
from garminconnect import Garmin

activities_bp = Blueprint('activities', __name__)

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

@activities_bp.route('/api/activities', methods=['GET'])
def get_activities():
    """Get activities for a date range"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'error': 'start_date and end_date are required'}), 400
        
        client = get_garmin_client()
        activities = client.get_activities_by_date(start_date, end_date)
        
        processed_activities = []
        for activity in activities:
            duration_minutes = activity.get('duration', 0) / 60
            training_effect = activity.get('aerobicTrainingEffect', 3)
            rpe = min(10, max(1, int(training_effect * 2)))
            
            processed_activities.append({
                'date': activity.get('startTimeLocal', '').split('T')[0],
                'duration': duration_minutes,
                'rpe': rpe,
                'trainingLoad': activity.get('trainingLoad', 0) or training_effect * 30,
                'tRPE': duration_minutes * rpe,
                'activityType': activity.get('activityType', {}).get('typeKey', 'Unknown')
            })
        
        return jsonify({'activities': processed_activities})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500