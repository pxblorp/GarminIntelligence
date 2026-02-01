"""
Workout Service Tests

Workout-related functionality is handled by:
1. Direct API routes in api/routes/ - for workout CRUD operations
2. FIT file generation for exporting workouts to Garmin devices

For testing workout functionality, see:
- test/endpoints/test_api_workouts.py - for API endpoint tests

If a WorkoutService is created in the future (e.g., for business logic like
workout validation, load calculation, or FIT file generation), add tests here.
"""

import pytest

