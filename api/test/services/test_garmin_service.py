import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime
from api.services.garmin_service import GarminService
from garth.auth_tokens import OAuth1Token, OAuth2Token
from garth import Client
from api.utils.crypto import CryptoManager
from test_db import TestDB
import os


@pytest_asyncio.fixture
async def garmin_db():
    """Create a test database with required tables."""
    db = TestDB(":memory:")
    
    # Create users table
    await db.execute("""
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
    await db.execute("""
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
    
    # Create sync_history table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS sync_history (
            sync_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sync_type TEXT NOT NULL,
            status TEXT NOT NULL,
            items_synced INTEGER DEFAULT 0,
            error TEXT,
            last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Create activities table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            garmin_activity_id INTEGER,
            activity_type TEXT,
            date TEXT,
            duration REAL,
            distance REAL,
            calories INTEGER,
            avg_hr INTEGER,
            max_hr INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Create vitals table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS vitals (
            vital_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            sleep_score REAL,
            sleeping_hr REAL,
            hrv REAL,
            stress REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Insert a test user
    await db.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        args=("test@example.com", "hashedpassword123")
    )
    
    yield db
    await db.close()


@pytest_asyncio.fixture
async def crypto_manager():
    """Create a crypto manager for testing."""
    if not os.getenv("SECRET_KEY"):
        os.environ["SECRET_KEY"] = "ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv2oasOM1Pg="
    return CryptoManager()


@pytest_asyncio.fixture
async def garmin_service(garmin_db, crypto_manager):
    """Create a GarminService instance."""
    return GarminService(garmin_db, crypto_manager)


@pytest.fixture
def mock_oauth1_token():
    """Create mock OAuth1 token."""
    return OAuth1Token(
        oauth_token="test_oauth1_token_12345",
        oauth_token_secret="test_oauth1_secret_67890",
        mfa_token=None,
        mfa_expiration_timestamp=None,
        domain="garmin.com"
    )


@pytest.fixture
def mock_oauth2_token():
    """Create mock OAuth2 token."""
    return OAuth2Token(
        scope="GARMINPAY_WRITE ATP_READ",
        jti="test-jti-12345",
        token_type="bearer",
        access_token="test_access_token_abcdef",
        refresh_token="test_refresh_token_ghijkl",
        expires_in=3600,
        expires_at=9999999999,
        refresh_token_expires_in=2592000,
        refresh_token_expires_at=9999999999
    )


class TestGarminService:

    @pytest.mark.asyncio
    @patch('api.services.garmin_service.login')
    async def test_authenticate(self, mock_login, garmin_service: GarminService, 
                                mock_oauth1_token, mock_oauth2_token):
        """Test Garmin authentication."""
        mock_login.return_value = (mock_oauth1_token, mock_oauth2_token)
        
        email = "garmin@example.com"
        password = "garminpass123"
        
        oauth1, oauth2 = await garmin_service.authenticate(email, password)
        
        assert oauth1 == mock_oauth1_token
        assert oauth2 == mock_oauth2_token
        mock_login.assert_called_once_with(email, password)

    @pytest.mark.asyncio
    async def test_store_tokens_insert(self, garmin_service: GarminService, 
                                      mock_oauth1_token, mock_oauth2_token):
        """Test storing OAuth tokens for a new user."""
        user_id = 1
        
        success = await garmin_service.store_tokens(user_id, mock_oauth1_token, mock_oauth2_token)
        
        assert success is True
        
        # Verify tokens were stored
        result = await garmin_service.db.execute(
            "SELECT user_id, oauth1_token, oauth2_access_token FROM oauth_tokens WHERE user_id = ?",
            args=(user_id,)
        )
        
        assert len(result.rows) == 1
        assert result.rows[0]['user_id'] == user_id
        # Tokens should be encrypted
        assert result.rows[0]['oauth1_token'] is not None
        assert result.rows[0]['oauth2_access_token'] is not None

    @pytest.mark.asyncio
    async def test_store_tokens_update(self, garmin_service: GarminService, 
                                      mock_oauth1_token, mock_oauth2_token):
        """Test updating OAuth tokens for an existing user."""
        user_id = 1
        
        # Store initial tokens
        await garmin_service.store_tokens(user_id, mock_oauth1_token, mock_oauth2_token)
        
        # Create new tokens
        new_oauth2 = OAuth2Token(
            scope="GARMINPAY_WRITE ATP_READ",
            jti="new-jti-67890",
            token_type="bearer",
            access_token="new_access_token",
            refresh_token="new_refresh_token",
            expires_in=7200,
            expires_at=9999999999,
            refresh_token_expires_in=2592000,
            refresh_token_expires_at=9999999999
        )
        
        # Update tokens
        success = await garmin_service.store_tokens(user_id, oauth2=new_oauth2)
        
        assert success is True
        
        # Verify tokens were updated
        result = await garmin_service.db.execute(
            "SELECT user_id FROM oauth_tokens WHERE user_id = ?",
            args=(user_id,)
        )
        
        assert len(result.rows) == 1

    @pytest.mark.asyncio
    async def test_store_tokens_oauth1_only(self, garmin_service: GarminService, 
                                           mock_oauth1_token):
        """Test storing only OAuth1 tokens."""
        user_id = 1
        
        success = await garmin_service.store_tokens(user_id, oauth1=mock_oauth1_token)
        
        assert success is True
        
        # Verify token was stored
        result = await garmin_service.db.execute(
            "SELECT oauth1_token FROM oauth_tokens WHERE user_id = ?",
            args=(user_id,)
        )
        
        assert len(result.rows) == 1
        assert result.rows[0]['oauth1_token'] is not None

    @pytest.mark.asyncio
    async def test_store_tokens_no_tokens_raises_error(self, garmin_service: GarminService):
        """Test that storing with no tokens raises ValueError."""
        user_id = 1
        
        with pytest.raises(ValueError, match="At least one token type"):
            await garmin_service.store_tokens(user_id)

    @pytest.mark.asyncio
    async def test_load_client_success(self, garmin_service: GarminService, 
                                      mock_oauth1_token, mock_oauth2_token):
        """Test loading a Garmin client with stored tokens."""
        user_id = 1
        
        # Store tokens first
        await garmin_service.store_tokens(user_id, mock_oauth1_token, mock_oauth2_token)
        
        # Load client
        client = await garmin_service.load_client(user_id)
        
        assert client is not None
        assert isinstance(client, Client)

    @pytest.mark.asyncio
    async def test_load_client_no_tokens(self, garmin_service: GarminService):
        """Test loading client when no tokens exist."""
        user_id = 999  # Non-existent user
        
        client = await garmin_service.load_client(user_id)
        
        assert client is None

    @pytest.mark.asyncio
    async def test_get_client_for_user(self, garmin_service: GarminService, 
                                      mock_oauth1_token, mock_oauth2_token):
        """Test getting a client for a user."""
        user_id = 1
        
        # Store tokens first
        await garmin_service.store_tokens(user_id, mock_oauth1_token, mock_oauth2_token)
        
        # Get client
        client = await garmin_service.get_client_for_user(user_id)
        
        assert client is not None
        assert isinstance(client, Client)

    @pytest.mark.asyncio
    async def test_get_client_for_user_no_tokens_raises_error(self, garmin_service: GarminService):
        """Test that getting client without tokens raises error."""
        user_id = 999  # Non-existent user
        
        with pytest.raises(ValueError, match="No Garmin tokens found"):
            await garmin_service.get_client_for_user(user_id)

    @pytest.mark.asyncio
    async def test_record_sync(self, garmin_service: GarminService):
        """Test recording sync history."""
        user_id = 1
        sync_type = "activities"
        status = "success"
        items_synced = 10
        
        await garmin_service._record_sync(user_id, sync_type, status, items_synced)
        
        # Verify sync was recorded
        result = await garmin_service.db.execute(
            "SELECT user_id, sync_type, status, items_synced FROM sync_history WHERE user_id = ?",
            args=(user_id,)
        )
        
        assert len(result.rows) == 1
        row = result.rows[0]
        assert row['user_id'] == user_id
        assert row['sync_type'] == sync_type
        assert row['status'] == status
        assert row['items_synced'] == items_synced

    @pytest.mark.asyncio
    async def test_record_sync_with_error(self, garmin_service: GarminService):
        """Test recording sync history with error."""
        user_id = 1
        sync_type = "vitals"
        status = "error"
        error_message = "Connection timeout"
        
        await garmin_service._record_sync(user_id, sync_type, status, 0, error_message)
        
        # Verify error was recorded
        result = await garmin_service.db.execute(
            "SELECT status, error FROM sync_history WHERE user_id = ?",
            args=(user_id,)
        )
        
        assert len(result.rows) == 1
        row = result.rows[0]
        assert row['status'] == status
        assert row['error'] == error_message