import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.workouts.route.workout_service.get_workouts')
async def test_get_workouts(mock_get_workouts, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_workouts.return_value = [
        AsyncMock(
            workout_id=1,
            sport="running",
            name="Morning Run",
            steps=[],
            rpe=5,
            notes="",
            estimated_load=100.0,
            created_at=AsyncMock(isoformat=lambda: "2023-01-01T00:00:00")
        )
    ]

    response = client.get("/api/workouts")
    assert response.status_code == 200
    data = response.json()
    assert len(data["workouts"]) == 1
    assert data["workouts"][0]["sport"] == "running"

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.workouts.route.workout_service.create_workout')
async def test_create_workout(mock_create_workout, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_create_workout.return_value = AsyncMock(
        workout_id=1,
        sport="cycling",
        name="Bike Ride",
        steps=[],
        rpe=6,
        notes="Fun ride",
        estimated_load=150.0,
        created_at=AsyncMock(isoformat=lambda: "2023-01-01T00:00:00")
    )

    workout_data = {
        "sport": "cycling",
        "name": "Bike Ride",
        "steps": [],
        "rpe": 6,
        "notes": "Fun ride"
    }
    response = client.post("/api/workouts", json=workout_data)
    assert response.status_code == 200
    data = response.json()
    assert data["sport"] == "cycling"
    assert data["name"] == "Bike Ride"

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.workouts.route.workout_service.get_workout')
async def test_get_workout_by_id(mock_get_workout, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_workout.return_value = AsyncMock(
        workout_id=1,
        sport="swimming",
        name="Pool Swim",
        steps=[],
        rpe=4,
        notes="",
        estimated_load=80.0,
        created_at=AsyncMock(isoformat=lambda: "2023-01-01T00:00:00")
    )

    response = client.get("/api/workouts/1")
    assert response.status_code == 200
    data = response.json()
    assert data["sport"] == "swimming"

@pytest.mark.asyncio
@patch('api.dependencies.auth.get_current_user')
@patch('api.routes.workouts.route.workout_service.get_workout')
async def test_get_workout_not_found(mock_get_workout, mock_get_current_user, client):
    mock_get_current_user.return_value = {"user_id": "123"}
    mock_get_workout.return_value = None

    response = client.get("/api/workouts/999")
    assert response.status_code == 404
    assert "Workout not found" in response.json()["detail"]

def test_update_workout_not_implemented(client):
    response = client.put("/api/workouts/1", json={})
    assert response.status_code == 404
    assert "Workout not found" in response.json()["detail"]

def test_delete_workout_not_implemented(client):
    response = client.delete("/api/workouts/1")
    assert response.status_code == 404
    assert "Workout not found" in response.json()["detail"]