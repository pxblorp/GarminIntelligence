from flask import Flask, jsonify, request
from flask_cors import CORS
from garminconnect import Garmin
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*")  # permite todos los orígenes

# Garmin credentials - STORE THESE IN .env FILE
GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')

# Initialize Garmin client
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Garmin backend is running"})

@app.route('/api/sync', methods=['GET'])
def sync_garmin_data():
    """
    Fetch all data from Garmin and return it
    Query params:
    - days: number of days to fetch (default: 60)
    """
    try:
        days = int(request.args.get('days', 60))
        client = get_garmin_client()
        
        activities = []
        vitals = []
        
        # Fetch data for the specified number of days
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            
            try:
                # Fetch activities for the day
                daily_activities = client.get_activities_by_date(date_str, date_str)
                
                for activity in daily_activities:
    try:
        duration_minutes = activity.get('duration', 0) / 60
        rpe = activity.get('averageRPE', None)
        if rpe is None:
            training_effect = activity.get('aerobicTrainingEffect', 3)
            rpe = min(10, max(1, int(training_effect * 2)))

        activities.append({
            'date': date_str,
            'duration': duration_minutes,
            'rpe': rpe,
            'trainingLoad': activity.get('trainingLoad', 0) or activity.get('aerobicTrainingEffect', 0) * 30,
            'tRPE': duration_minutes * rpe,
            'activityType': activity.get('activityType', {}).get('typeKey', 'Unknown')
        })
    except Exception as e:
        print(f"Skipping activity due to error: {e}")
        continue

                    })
                
                # Fetch health stats for the day
                try:
                    stats = client.get_stats(date_str)
                    sleep_data = client.get_sleep_data(date_str)
                    hrv_data = client.get_hrv_data(date_str)
                    
                    # Get resting HR
                    resting_hr = stats.get('restingHeartRate', None)
                    
                    # Get sleep data
                    sleep_score = sleep_data.get('sleepScores', {}).get('overall', {}).get('value', None) if sleep_data else None
                    sleeping_hr = sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None
                    
                    # Get HRV
                    hrv = hrv_data.get('lastNightAvg', None) if hrv_data else None
                    
                    # Get stress
                    stress = stats.get('averageStressLevel', None)
                    
                    vitals.append({
                        'date': date_str,
                        'sleepScore': sleep_score,
                        'restingHR': resting_hr,
                        'sleepingHR': sleeping_hr,
                        'hrv': hrv,
                        'stress': stress
                    })
                    
                except Exception as e:
                    print(f"Error fetching vitals for {date_str}: {e}")
                    # Add placeholder vitals to maintain data consistency
                    vitals.append({
                        'date': date_str,
                        'sleepScore': None,
                        'restingHR': None,
                        'sleepingHR': None,
                        'hrv': None,
                        'stress': None
                    })
                    
            except Exception as e:
                print(f"Error fetching data for {date_str}: {e}")
                continue
        
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

@app.route('/api/activities', methods=['GET'])
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

@app.route('/api/vitals', methods=['GET'])
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
            'restingHR': stats.get('restingHeartRate', None),
            'sleepingHR': sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
            'hrv': hrv_data.get('lastNightAvg', None) if hrv_data else None,
            'stress': stats.get('averageStressLevel', None)
        }
        
        return jsonify({'vitals': vitals})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Check if credentials are set
    if not GARMIN_EMAIL or not GARMIN_PASSWORD:
        print("ERROR: GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env file")
        exit(1)
    
    print("Starting Garmin Connect Backend...")
    print(f"Login email: {GARMIN_EMAIL}")
    app.run(debug=True, host='0.0.0.0', port=5000)
