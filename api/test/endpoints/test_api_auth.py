import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from garth.auth_tokens import OAuth1Token, OAuth2Token


class TestAuthSignup:
    """Tests for signup endpoint"""
    
    @patch('api.services.garmin_service.garth.login')
    def test_signup_success(self, mock_login, test_client: TestClient, test_user_data, mock_oauth1_token, mock_oauth2_token):
        """Test successful user signup"""
        # Mock Garmin authentication
        mock_client = MagicMock()
        mock_client.oauth1_token = mock_oauth1_token
        mock_client.oauth2_token = mock_oauth2_token
        mock_login.return_value = mock_client
        
        response = test_client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["email"] == test_user_data["email"]
        assert "user_id" in data
    
    @patch('api.services.garmin_service.garth.login')
    def test_signup_duplicate_email(self, mock_login, test_client: TestClient, test_user_data, mock_oauth1_token, mock_oauth2_token):
        """Test signup fails with duplicate email"""
        mock_client = MagicMock()
        mock_client.oauth1_token = mock_oauth1_token
        mock_client.oauth2_token = mock_oauth2_token
        mock_login.return_value = mock_client
        
        test_client.post("/auth/signup", json=test_user_data)
        
        response = test_client.post("/auth/signup", json=test_user_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    @patch('api.services.garmin_service.garth.login')
    def test_signup_invalid_garmin_credentials(self, mock_login, test_client: TestClient):
        """Test signup fails with invalid Garmin credentials"""
        mock_login.side_effect = Exception("Authentication failed")
        
        response = test_client.post(
            "/auth/signup",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        
        assert response.status_code == 401


class TestAuthLogin:
    """Tests for login endpoint"""
    
    @patch('api.services.garmin_service.garth.Client')
    @patch('api.services.garmin_service.garth.login')
    def test_login_success(self, mock_login, mock_client_class, test_client: TestClient, test_user_data, mock_oauth1_token, mock_oauth2_token):
        """Test successful login"""
        # Setup mocks
        mock_client = MagicMock()
        mock_client.oauth1_token = mock_oauth1_token
        mock_client.oauth2_token = mock_oauth2_token
        mock_login.return_value = mock_client
        mock_client_class.return_value = mock_client
        
        # First signup
        test_client.post("/auth/signup", json=test_user_data)
        
        # Then login
        response = test_client.post("/auth/login", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == test_user_data["email"]
    
    def test_login_wrong_password(self, test_client: TestClient, test_user_data):
        """Test login fails with wrong password"""
        response = test_client.post(
            "/auth/login",
            json={"email": test_user_data["email"], "password": "wrongpassword"}
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, test_client: TestClient):
        """Test login fails for nonexistent user"""
        response = test_client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"}
        )
        
        assert response.status_code == 401


class TestTokenValidation:
    """Tests for JWT token validation"""
    
    @patch('garth.login')
    def test_token_contains_user_info(self, mock_login, test_client: TestClient, test_user_data, mock_oauth1_token, mock_oauth2_token):
        """Test JWT token contains user_id and email"""
        import jwt
        import os
        
        mock_client = MagicMock()
        mock_client.oauth1_token = mock_oauth1_token
        mock_client.oauth2_token = mock_oauth2_token
        mock_login.return_value = mock_client
        
        response = test_client.post("/auth/signup", json=test_user_data)
        token = response.json()["access_token"]
        
        # Decode token
        secret = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        
        assert "user_id" in payload
        assert "email" in payload
        assert payload["email"] == test_user_data["email"]
        assert "exp" in payload


class TestValidation:
    """Tests for input validation"""
    
    def test_invalid_email_format(self, test_client: TestClient):
        """Test signup fails with invalid email format"""
        response = test_client.post(
            "/auth/signup",
            json={"email": "not-an-email", "password": "password123"}
        )
        
        assert response.status_code == 422
    
    def test_missing_password(self, test_client: TestClient):
        """Test signup fails without password"""
        response = test_client.post(
            "/auth/signup",
            json={"email": "test@example.com"}
        )
        
        assert response.status_code == 422
