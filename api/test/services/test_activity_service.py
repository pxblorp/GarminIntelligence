"""
Activity Service Tests

Note: There is currently no separate ActivityService class in this application.
Activity-related functionality is handled by:
1. GarminService.sync_activities() - for syncing activities from Garmin
2. Direct API routes in api/routes/ - for CRUD operations

For testing activity functionality, see:
- test/services/test_garmin_service.py - for sync functionality
- test/endpoints/test_api_activities.py - for API endpoint tests
- test/endpoints/test_api_sync.py - for sync endpoint tests
"""

import pytest

