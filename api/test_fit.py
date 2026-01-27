import sys
sys.path.insert(0, 'src')

# Mock the problematic imports
from unittest.mock import MagicMock
sys.modules['routes'] = MagicMock()
sys.modules['routes.workouts'] = MagicMock()
sys.modules['routes.workouts.services'] = MagicMock()
sys.modules['routes.workouts.services.GarminManager'] = MagicMock()

# Mock the models
class MockModel:
    pass

WorkoutsResponse = MockModel
WorkoutResponse = MockModel
WorkoutQuery = MockModel
WorkoutCreate = MockModel
CalendarQuery = MockModel
CalendarResponse = MockModel
ExportWeekQuery = MockModel
ExportSingleQuery = MockModel
UnscheduleQuery = MockModel

sys.modules['routes.workouts.models'] = MagicMock()
sys.modules['routes.workouts.models'].WorkoutsResponse = WorkoutsResponse
sys.modules['routes.workouts.models'].WorkoutResponse = WorkoutResponse
sys.modules['routes.workouts.models'].WorkoutQuery = WorkoutQuery
sys.modules['routes.workouts.models'].WorkoutCreate = WorkoutCreate
sys.modules['routes.workouts.models'].CalendarQuery = CalendarQuery
sys.modules['routes.workouts.models'].CalendarResponse = CalendarResponse
sys.modules['routes.workouts.models'].ExportWeekQuery = ExportWeekQuery
sys.modules['routes.workouts.models'].ExportSingleQuery = ExportSingleQuery
sys.modules['routes.workouts.models'].UnscheduleQuery = UnscheduleQuery

# Import the specific functions we need
import importlib.util
spec = importlib.util.spec_from_file_location("route", "src/routes/workouts/route.py")
route = importlib.util.module_from_spec(spec)

# Add the mocks to the module
route.WorkoutsResponse = WorkoutsResponse
route.WorkoutResponse = WorkoutResponse
route.WorkoutQuery = WorkoutQuery
route.WorkoutCreate = WorkoutCreate
route.CalendarQuery = CalendarQuery
route.CalendarResponse = CalendarResponse
route.ExportWeekQuery = ExportWeekQuery
route.ExportSingleQuery = ExportSingleQuery
route.UnscheduleQuery = UnscheduleQuery

spec.loader.exec_module(route)

# Test the function
workout = {'name': 'Test Workout', 'sport': 'run', 'steps': [{'type': 'warmup', 'duration': 300, 'zone': 2}]}
result = route.create_fit_workout_file(workout, '2024-01-01')
print(f'Generated {len(result)} bytes')
