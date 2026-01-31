import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.activities.route.activity_service.get_activities')
async def test_get_activities_from_db(mock_get_activities, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_activities.return_value = [
        AsyncMock(date="2023-01-01", duration=60.0, rpe=5, training_load=100.0, trpe=50.0, activity_type="running")
    ]

    response = client.get("/api/activities?email=test@example.com&start_date=2023-01-01&end_date=2023-01-31")
    assert response.status_code == 200
    data = response.json()
    assert len(data["activities"]) == 1
    assert data["activities"][0]["date"] == "2023-01-01"

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.activities.route.activity_service.get_activities')
@patch('api.routes.activities.route.auth_service.get_user_by_id')
@patch('api.routes.activities.route.activity_service.sync_activities_from_garmin')
@patch('api.routes.activities.route.GarminService')
async def test_get_activities_sync_from_garmin(mock_garmin_service, mock_sync, mock_get_user, mock_get_activities, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_activities.return_value = []
    mock_get_user.return_value = {"oauth_token": "token", "oauth_token_secret": "secret"}
    mock_garmin_service.return_value.resume_session.return_value = AsyncMock()
    mock_sync.return_value = [
        AsyncMock(date="2023-01-01", duration=60.0, rpe=5, training_load=100.0, trpe=50.0, activity_type="running")
    ]

    response = client.get("/api/activities?email=test@example.com&start_date=2023-01-01&end_date=2023-01-31")
    assert response.status_code == 200
    data = response.json()
    assert len(data["activities"]) == 1

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.activities.route.activity_service.get_activities')
@patch('api.routes.activities.route.auth_service.get_user_by_id')
async def test_get_activities_no_garmin_credentials(mock_get_user, mock_get_activities, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_activities.return_value = []
    mock_get_user.return_value = {}

    response = client.get("/api/activities?email=test@example.com&start_date=2023-01-01&end_date=2023-01-31")
    assert response.status_code == 401
    assert "Garmin credentials not found" in response.json()["detail"]