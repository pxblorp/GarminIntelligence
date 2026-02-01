"""
Vital Service Tests

Note: There is currently no separate VitalService class in this application.
Vitals-related functionality is handled by:
1. GarminService.sync_vitals() - for syncing health vitals from Garmin
2. Direct API routes in api/routes/ - for querying vitals data

For testing vitals functionality, see:
- test/services/test_garmin_service.py - for sync functionality
- test/endpoints/test_api_vitals.py - for API endpoint tests
- test/endpoints/test_api_sync.py - for sync endpoint tests

If a VitalService is created in the future (e.g., for business logic like
vitals analysis, trend calculation, or health insights), add tests here.
"""

import pytest

# This file is intentionally left empty as there is no VitalService to test.
