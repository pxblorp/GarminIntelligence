import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('api.routes.auth.routes.auth_service.signin')
@patch('api.routes.auth.routes.auth_service.create_access_token')
async def test_login_success(mock_create_token, mock_signin, client):
    mock_signin.return_value = {"user_id": "123", "email": "test@example.com"}
    mock_create_token.return_value = "fake_token"

    response = client.post("/auth/login", json={"email": "test@example.com", "password": "password"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
@patch('api.routes.auth.routes.auth_service.signin')
async def test_login_invalid_credentials(mock_signin, client):
    mock_signin.return_value = None

    response = client.post("/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
@patch('api.routes.auth.routes.garth')
@patch('api.routes.auth.routes.auth_service.signup')
async def test_signup_success(mock_signup, mock_garth, client):
    mock_garth.login = AsyncMock(return_value=(AsyncMock(token="token", token_secret="secret"), None))
    mock_signup.return_value = {"user_id": "123", "email": "test@example.com"}

    response = client.post("/auth/signup", json={"email": "test@example.com", "password": "password"})
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "123"
    assert data["email"] == "test@example.com"

@patch('api.routes.auth.routes.garth')
def test_signup_email_exists(mock_garth, mock_db_client, client):
    mock_db_client.execute.return_value.rows = [{"user_id": "123"}]

    response = client.post("/auth/signup", json={"email": "existing@example.com", "password": "password"})
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

@pytest.mark.asyncio
@patch('api.routes.auth.routes.garth')
async def test_signup_invalid_garmin_credentials(mock_garth, client):
    mock_garth.login = AsyncMock(side_effect=Exception("Invalid credentials"))

    response = client.post("/auth/signup", json={"email": "test@example.com", "password": "password"})
    assert response.status_code == 401
    assert "Invalid Garmin credentials" in response.json()["detail"]