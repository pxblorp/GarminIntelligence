import os
import sys
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from cryptography.fernet import Fernet
from pathlib import Path

from test_db import TestDB
from api.server import app
from api.utils.crypto import CryptoManager
from api.dependencies import get_db
from garth.auth_tokens import OAuth1Token, OAuth2Token


@pytest.fixture(scope="session")
def test_db():
    """Create a test database instance"""
    return TestDB(":memory:")


@pytest_asyncio.fixture
async def setup_test_db(test_db):
    """Setup test database with schema"""
    # Create users table
    await test_db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME
        )
    """)
    
    # Create oauth_tokens table
    await test_db.execute("""
        CREATE TABLE IF NOT EXISTS oauth_tokens (
            user_id INTEGER PRIMARY KEY,
            oauth1_token TEXT,
            oauth1_token_secret TEXT,
            oauth2_access_token TEXT,
            oauth2_refresh_token TEXT,
            oauth2_expires_in INTEGER,
            oauth2_expires_at INTEGER,
            oauth2_refresh_token_expires_in INTEGER,
            oauth2_refresh_token_expires_at INTEGER,
            oauth2_token_type TEXT,
            oauth2_scope TEXT,
            oauth2_jti TEXT,
            oauth1_mfa_token TEXT,
            oauth1_mfa_expiration_timestamp DATETIME,
            oauth1_domain TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    yield test_db
    
    await test_db.close()


@pytest.fixture
def test_client(setup_test_db, test_db):
    """Create a test client with overridden dependencies"""
    app.dependency_overrides[get_db] = lambda: test_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_oauth1_token():
    """Create mock OAuth1 token"""
    return OAuth1Token(
        oauth_token="test_oauth1_token_12345",
        oauth_token_secret="test_oauth1_secret_67890",
        mfa_token=None,
        mfa_expiration_timestamp=None,
        domain="garmin.com"
    )


@pytest.fixture
def mock_oauth2_token():
    """Create mock OAuth2 token"""
    return OAuth2Token(
        scope="GARMINPAY_WRITE ATP_READ",
        jti="test-jti-12345",
        token_type="bearer",
        access_token="test_access_token_abcdef",
        refresh_token="test_refresh_token_ghijkl",
        expires_in=3600,
        expires_at=9999999999,  # Far future
        refresh_token_expires_in=2592000,
        refresh_token_expires_at=9999999999
    )


@pytest.fixture
def test_user_data():
    """Test user credentials"""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }



