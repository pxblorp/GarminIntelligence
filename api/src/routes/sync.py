from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import os
from garminconnect import Garmin

sync_bp = Blueprint('sync', __name__)

GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')

garmin_client = None

def get_garmin_client() -> Garmin:
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

@sync_bp.route('/api/sync', methods=['GET'])
def sync_garmin_data():
    """
    Fetch all data from Garmin and return it
    Query params:
    - days: number of days to fetch (default: 60)
    """
    try:
        days = int(request.args.get('days', 60))
        client = get_garmin_client()
        
        activities = client.get_activities_by_date(
            (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d'),
            datetime.now().strftime('%Y-%m-%d')
        )

        vitals = []

        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            stats = client.get_stats(date)
            sleep_data = client.get_sleep_data(date)
            hrv_data = client.get_hrv_data(date)
            
            vitals.append({
                'date': date,
                'sleepScore': sleep_data.get('sleepScores', {}).get('overall', {}).get('value', None) if sleep_data else None,
                'sleepingHR': sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
                'hrv': hrv_data.get('lastNightAvg', None) if hrv_data else None,
                'stress': stats.get('averageStressLevel', None)
            })

                       
        
        return jsonify({
            'success': True,
            'activities': activities,
            'vitals': vitals,
            'message': f'Successfully fetched {len(activities)} activities and {len(vitals)} days of vitals'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to sync Garmin data'
        }), 500