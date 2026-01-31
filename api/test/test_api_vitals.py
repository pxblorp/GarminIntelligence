import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.vitals.route.vital_service.get_vitals')
async def test_get_vitals_from_db(mock_get_vitals, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_vitals.return_value = AsyncMock(
        date="2023-01-01",
        sleep_score=85.0,
        sleeping_hr=60.0,
        hrv=50.0,
        stress=20.0
    )

    response = client.get("/api/vitals?date=2023-01-01")
    assert response.status_code == 200
    data = response.json()
    assert len(data["vitals"]) == 1
    assert data["vitals"][0]["date"] == "2023-01-01"

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.vitals.route.vital_service.get_vitals')
@patch('api.routes.vitals.route.auth_service.get_user_by_id')
@patch('api.routes.vitals.route.vital_service.sync_vitals_from_garmin')
@patch('api.routes.vitals.route.GarminService')
async def test_get_vitals_sync_from_garmin(mock_garmin_service, mock_sync, mock_get_user, mock_get_vitals, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_vitals.return_value = None
    mock_get_user.return_value = {"oauth_token": "token", "oauth_token_secret": "secret"}
    mock_garmin_service.return_value.resume_session.return_value = AsyncMock()
    mock_sync.return_value = AsyncMock(
        date="2023-01-01",
        sleep_score=85.0,
        sleeping_hr=60.0,
        hrv=50.0,
        stress=20.0
    )

    response = client.get("/api/vitals?date=2023-01-01")
    assert response.status_code == 200
    data = response.json()
    assert len(data["vitals"]) == 1

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.vitals.route.vital_service.get_vitals')
async def test_get_vitals_no_data(mock_get_vitals, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_vitals.return_value = None

    response = client.get("/api/vitals?date=2023-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["vitals"] == []