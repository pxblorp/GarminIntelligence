from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from garminconnect import Garmin
from datetime import datetime, timedelta
import os
import io
import zipfile
import uuid
from dotenv import load_dotenv
from fit_tool.fit_file_builder import FitFileBuilder
from fit_tool.profile.messages.file_id_message import FileIdMessage
from fit_tool.profile.messages.activity_message import ActivityMessage
from fit_tool.profile.messages.session_message import SessionMessage
from fit_tool.profile.messages.lap_message import LapMessage
from fit_tool.profile.messages.record_message import RecordMessage
from fit_tool.profile.messages.event_message import EventMessage
from fit_tool.profile.messages.workout_message import WorkoutMessage
from fit_tool.profile.messages.workout_step_message import WorkoutStepMessage
from fit_tool.profile.profile_type import Sport, SubSport, Event, EventType, FileType, Manufacturer, WorkoutStepDuration, WorkoutStepTarget, Intensity

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*")  # permite todos los orígenes

# Garmin credentials - STORE THESE IN .env FILE
GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')

# Initialize Garmin client
garmin_client = None

# In-memory storage for workout planner
# Workout templates (reusable workouts)
workout_templates = {}  # id -> workout

# Scheduled workouts (workouts assigned to specific dates)
scheduled_workouts = {}  # date (YYYY-MM-DD) -> list of workouts

# Sport type mapping for FIT files
SPORT_MAP = {
    'run': (Sport.RUNNING, SubSport.GENERIC),
    'running': (Sport.RUNNING, SubSport.GENERIC),
    'bike': (Sport.CYCLING, SubSport.GENERIC),
    'cycling': (Sport.CYCLING, SubSport.GENERIC),
    'swim': (Sport.SWIMMING, SubSport.GENERIC),
    'swimming': (Sport.SWIMMING, SubSport.GENERIC),
    'strength': (Sport.TRAINING, SubSport.STRENGTH_TRAINING),
    'yoga': (Sport.TRAINING, SubSport.YOGA),
    'sail': (Sport.GENERIC, SubSport.GENERIC),
    'sailing': (Sport.GENERIC, SubSport.GENERIC),
    'other': (Sport.GENERIC, SubSport.GENERIC),
}

# HR Zone mapping (percentage of max HR, typical zones)
HR_ZONES = {
    1: (0.50, 0.60),  # Recovery
    2: (0.60, 0.70),  # Endurance
    3: (0.70, 0.80),  # Tempo
    4: (0.80, 0.90),  # Threshold
    5: (0.90, 1.00),  # VO2max
}

# RPE to HR Zone approximate mapping
RPE_TO_ZONE = {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5
}

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
                
                # Fetch health stats for the day
                try:
                    stats = client.get_stats(date_str)
                    sleep_data = client.get_sleep_data(date_str)
                    hrv_data = client.get_hrv_data(date_str)
                    
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
            'sleepingHR': sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
            'hrv': hrv_data.get('lastNightAvg', None) if hrv_data else None,
            'stress': stats.get('averageStressLevel', None)
        }
        
        return jsonify({'vitals': vitals})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# WORKOUT PLANNER ENDPOINTS
# ============================================================================

def generate_workout_id():
    """Generate a unique workout ID"""
    return str(uuid.uuid4())[:8]


def calculate_workout_load(workout):
    """Calculate estimated training load for a workout"""
    total_duration = 0
    weighted_intensity = 0

    for step in workout.get('steps', []):
        step_type = step.get('type', '')

        if step_type == 'interval':
            # Intervals have repeat, on, off
            repeats = step.get('repeat', 1)
            on_duration = step.get('on', {}).get('duration', 0)
            off_duration = step.get('off', {}).get('duration', 0)
            on_zone = step.get('on', {}).get('zone', 3)
            off_zone = step.get('off', {}).get('zone', 2)

            interval_duration = repeats * (on_duration + off_duration)
            total_duration += interval_duration

            # Weight by zone intensity
            weighted_intensity += repeats * (on_duration * on_zone + off_duration * off_zone)
        else:
            # Regular step: warmup, cooldown, etc.
            duration = step.get('duration', 0)
            zone = step.get('zone', 2)
            total_duration += duration
            weighted_intensity += duration * zone

    if total_duration == 0:
        return 0

    avg_intensity = weighted_intensity / total_duration
    rpe = workout.get('rpe', 5)

    # Training load formula: duration (min) * intensity factor
    duration_minutes = total_duration / 60
    load = duration_minutes * (avg_intensity * 0.3 + rpe * 0.7)

    return round(load, 1)


@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    """Get all workout templates"""
    return jsonify({
        'success': True,
        'workouts': list(workout_templates.values())
    })


@app.route('/api/workouts', methods=['POST'])
def create_workout():
    """Create a new workout template"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        workout_id = generate_workout_id()

        workout = {
            'id': workout_id,
            'sport': data.get('sport', 'other'),
            'name': data.get('name', 'Untitled Workout'),
            'steps': data.get('steps', []),
            'rpe': data.get('rpe', 5),
            'notes': data.get('notes', ''),
            'estimatedLoad': calculate_workout_load(data),
            'createdAt': datetime.now().isoformat()
        }

        workout_templates[workout_id] = workout

        return jsonify({
            'success': True,
            'workout': workout
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/workouts/<workout_id>', methods=['GET'])
def get_workout(workout_id):
    """Get a specific workout template"""
    workout = workout_templates.get(workout_id)

    if not workout:
        return jsonify({'error': 'Workout not found'}), 404

    return jsonify({
        'success': True,
        'workout': workout
    })


@app.route('/api/workouts/<workout_id>', methods=['PUT'])
def update_workout(workout_id):
    """Update a workout template"""
    try:
        if workout_id not in workout_templates:
            return jsonify({'error': 'Workout not found'}), 404

        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        existing = workout_templates[workout_id]

        workout = {
            'id': workout_id,
            'sport': data.get('sport', existing.get('sport', 'other')),
            'name': data.get('name', existing.get('name', 'Untitled Workout')),
            'steps': data.get('steps', existing.get('steps', [])),
            'rpe': data.get('rpe', existing.get('rpe', 5)),
            'notes': data.get('notes', existing.get('notes', '')),
            'estimatedLoad': calculate_workout_load(data),
            'createdAt': existing.get('createdAt'),
            'updatedAt': datetime.now().isoformat()
        }

        workout_templates[workout_id] = workout

        return jsonify({
            'success': True,
            'workout': workout
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/workouts/<workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    """Delete a workout template"""
    if workout_id not in workout_templates:
        return jsonify({'error': 'Workout not found'}), 404

    del workout_templates[workout_id]

    return jsonify({
        'success': True,
        'message': 'Workout deleted'
    })


@app.route('/api/calendar', methods=['GET'])
def get_calendar():
    """
    Get scheduled workouts for a date range
    Query params:
    - start_date: YYYY-MM-DD (required)
    - end_date: YYYY-MM-DD (required)
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required'}), 400

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    result = {}
    current = start
    while current <= end:
        date_str = current.strftime('%Y-%m-%d')
        result[date_str] = scheduled_workouts.get(date_str, [])
        current += timedelta(days=1)

    # Calculate weekly totals
    weekly_load = sum(
        sum(w.get('estimatedLoad', 0) for w in workouts)
        for workouts in result.values()
    )

    return jsonify({
        'success': True,
        'calendar': result,
        'weeklyLoad': weekly_load
    })


@app.route('/api/calendar', methods=['POST'])
def schedule_workout():
    """
    Schedule a workout on a specific date
    Body: { date: YYYY-MM-DD, workout: {...} or workoutId: string }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        date = data.get('date')
        if not date:
            return jsonify({'error': 'date is required'}), 400

        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        # Get workout either from template or from body
        workout_id = data.get('workoutId')
        workout_data = data.get('workout')

        if workout_id:
            if workout_id not in workout_templates:
                return jsonify({'error': 'Workout template not found'}), 404
            workout = workout_templates[workout_id].copy()
        elif workout_data:
            workout = {
                'id': generate_workout_id(),
                'sport': workout_data.get('sport', 'other'),
                'name': workout_data.get('name', 'Untitled Workout'),
                'steps': workout_data.get('steps', []),
                'rpe': workout_data.get('rpe', 5),
                'notes': workout_data.get('notes', ''),
                'estimatedLoad': calculate_workout_load(workout_data)
            }
        else:
            return jsonify({'error': 'Either workoutId or workout is required'}), 400

        # Add date and scheduled ID to workout
        workout['date'] = date
        workout['scheduledId'] = generate_workout_id()

        if date not in scheduled_workouts:
            scheduled_workouts[date] = []

        scheduled_workouts[date].append(workout)

        return jsonify({
            'success': True,
            'scheduled': workout
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/calendar/<date>/<scheduled_id>', methods=['DELETE'])
def unschedule_workout(date, scheduled_id):
    """Remove a scheduled workout"""
    if date not in scheduled_workouts:
        return jsonify({'error': 'No workouts on this date'}), 404

    workouts = scheduled_workouts[date]
    original_len = len(workouts)
    scheduled_workouts[date] = [w for w in workouts if w.get('scheduledId') != scheduled_id]

    if len(scheduled_workouts[date]) == original_len:
        return jsonify({'error': 'Scheduled workout not found'}), 404

    # Clean up empty dates
    if not scheduled_workouts[date]:
        del scheduled_workouts[date]

    return jsonify({
        'success': True,
        'message': 'Workout unscheduled'
    })


def create_fit_workout_file(workout, workout_date):
    """
    Create a FIT workout file for Garmin
    Returns bytes of the FIT file
    """
    sport_key = workout.get('sport', 'other').lower()
    sport, sub_sport = SPORT_MAP.get(sport_key, (Sport.GENERIC, SubSport.GENERIC))

    builder = FitFileBuilder()

    # File ID message
    file_id = FileIdMessage()
    file_id.type = FileType.WORKOUT
    file_id.manufacturer = Manufacturer.GARMIN.value
    file_id.product = 65534
    file_id.serial_number = 12345
    file_id.time_created = int(datetime.strptime(workout_date, '%Y-%m-%d').timestamp() * 1000)
    builder.add(file_id)

    # Workout message
    workout_msg = WorkoutMessage()
    workout_msg.sport = sport
    workout_msg.sub_sport = sub_sport
    workout_msg.num_valid_steps = len(workout.get('steps', []))

    # Encode workout name (max 16 chars for compatibility)
    name = workout.get('name', 'Workout')[:16]
    workout_msg.wkt_name = name
    builder.add(workout_msg)

    # Add workout steps
    step_index = 0
    for step in workout.get('steps', []):
        step_type = step.get('type', 'active')

        if step_type == 'interval':
            # Create repeat structure
            repeats = step.get('repeat', 1)
            on_step = step.get('on', {})
            off_step = step.get('off', {})

            # Add "on" interval steps
            for _ in range(repeats):
                # On step
                on_msg = WorkoutStepMessage()
                on_msg.message_index = step_index
                on_msg.duration_type = WorkoutStepDuration.TIME
                on_msg.duration_value = int(on_step.get('duration', 60) * 1000)  # ms
                on_msg.intensity = Intensity.ACTIVE

                zone = on_step.get('zone', 4)
                if 'zone' in on_step:
                    on_msg.target_type = WorkoutStepTarget.HEART_RATE
                    hr_low, hr_high = HR_ZONES.get(zone, (0.7, 0.9))
                    on_msg.target_value = 0  # Use custom values
                    on_msg.custom_target_value_low = int(hr_low * 100)  # % of max HR
                    on_msg.custom_target_value_high = int(hr_high * 100)
                else:
                    on_msg.target_type = WorkoutStepTarget.OPEN
                    on_msg.target_value = 0

                builder.add(on_msg)
                step_index += 1

                # Off step (recovery)
                off_msg = WorkoutStepMessage()
                off_msg.message_index = step_index
                off_msg.duration_type = WorkoutStepDuration.TIME
                off_msg.duration_value = int(off_step.get('duration', 60) * 1000)  # ms
                off_msg.intensity = Intensity.RECOVERY
                off_msg.target_type = WorkoutStepTarget.OPEN
                off_msg.target_value = 0
                builder.add(off_msg)
                step_index += 1
        else:
            # Regular step (warmup, cooldown, active)
            step_msg = WorkoutStepMessage()
            step_msg.message_index = step_index

            duration = step.get('duration', 300)  # default 5 min
            step_msg.duration_type = WorkoutStepDuration.TIME
            step_msg.duration_value = int(duration * 1000)  # ms

            # Map step type to intensity
            if step_type == 'warmup':
                step_msg.intensity = Intensity.WARMUP
            elif step_type == 'cooldown':
                step_msg.intensity = Intensity.COOLDOWN
            elif step_type == 'recovery':
                step_msg.intensity = Intensity.RECOVERY
            else:
                step_msg.intensity = Intensity.ACTIVE

            # Set HR target if zone specified
            zone = step.get('zone')
            if zone:
                step_msg.target_type = WorkoutStepTarget.HEART_RATE
                hr_low, hr_high = HR_ZONES.get(zone, (0.6, 0.7))
                step_msg.target_value = 0
                step_msg.custom_target_value_low = int(hr_low * 100)
                step_msg.custom_target_value_high = int(hr_high * 100)
            else:
                step_msg.target_type = WorkoutStepTarget.OPEN
                step_msg.target_value = 0

            builder.add(step_msg)
            step_index += 1

    # Build and return the FIT file bytes
    fit_file = builder.build()
    return fit_file.to_bytes()


@app.route('/api/export/week', methods=['GET'])
def export_week():
    """
    Export a week's scheduled workouts as FIT files in a ZIP
    Query params:
    - start_date: YYYY-MM-DD (Monday of the week)
    """
    start_date = request.args.get('start_date')

    if not start_date:
        return jsonify({'error': 'start_date is required'}), 400

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Collect workouts for the week (7 days)
    workouts_to_export = []
    for i in range(7):
        date = start + timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')

        if date_str in scheduled_workouts:
            for workout in scheduled_workouts[date_str]:
                workouts_to_export.append((date_str, workout))

    if not workouts_to_export:
        return jsonify({'error': 'No workouts scheduled for this week'}), 404

    # Create ZIP file in memory
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for date_str, workout in workouts_to_export:
            try:
                fit_bytes = create_fit_workout_file(workout, date_str)

                # Create filename: YYYY-MM-DD-sport-name.fit
                sport = workout.get('sport', 'workout')
                name = workout.get('name', 'workout').lower().replace(' ', '-')[:20]
                filename = f"{date_str}-{sport}-{name}.fit"

                zip_file.writestr(filename, fit_bytes)
            except Exception as e:
                print(f"Error creating FIT file for {workout.get('name')}: {e}")
                continue

    if zip_buffer.tell() == 0:
        return jsonify({'error': 'Failed to create any FIT files'}), 500

    zip_buffer.seek(0)

    # Generate filename for the ZIP
    end_date = (start + timedelta(days=6)).strftime('%Y-%m-%d')
    zip_filename = f"workouts-{start_date}-to-{end_date}.zip"

    return send_file(
        zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename
    )


@app.route('/api/export/workout/<scheduled_id>', methods=['GET'])
def export_single_workout(scheduled_id):
    """Export a single scheduled workout as a FIT file"""
    # Find the workout
    workout = None
    workout_date = None

    for date_str, workouts in scheduled_workouts.items():
        for w in workouts:
            if w.get('scheduledId') == scheduled_id:
                workout = w
                workout_date = date_str
                break
        if workout:
            break

    if not workout:
        return jsonify({'error': 'Scheduled workout not found'}), 404

    try:
        fit_bytes = create_fit_workout_file(workout, workout_date)

        # Create filename
        sport = workout.get('sport', 'workout')
        name = workout.get('name', 'workout').lower().replace(' ', '-')[:20]
        filename = f"{workout_date}-{sport}-{name}.fit"

        return send_file(
            io.BytesIO(fit_bytes),
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': f'Failed to create FIT file: {str(e)}'}), 500


if __name__ == '__main__':
    # Check if credentials are set
    if not GARMIN_EMAIL or not GARMIN_PASSWORD:
        print("ERROR: GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env file")
        exit(1)
    
    print("Starting Garmin Connect Backend...")
    print(f"Login email: {GARMIN_EMAIL}")
    app.run(debug=True, host='0.0.0.0', port=5000)
