import pytest
import pytest_asyncio
from datetime import datetime
from api.services.auth_service import AuthService
from api.utils.crypto import CryptoManager
from test_db import TestDB
import jwt
import os


@pytest_asyncio.fixture
async def auth_db():
    """Create a test database with users table."""
    db = TestDB(":memory:")
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
    yield db
    await db.close()


@pytest_asyncio.fixture
async def crypto_manager():
    """Create a crypto manager for testing."""
    # Set a test SECRET_KEY if not already set
    if not os.getenv("SECRET_KEY"):
        os.environ["SECRET_KEY"] = "ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv2oasOM1Pg="
    return CryptoManager()


@pytest_asyncio.fixture
async def auth_service(auth_db, crypto_manager):
    """Create an AuthService instance."""
    return AuthService(auth_db, crypto_manager)


class TestAuthService:

    @pytest.mark.asyncio
    async def test_signup_creates_user(self, auth_service: AuthService):
        """Test that signup creates a user with hashed password."""
        email = "test@example.com"
        password = "TestPassword123!"
        
        user_id = await auth_service.signup(email, password)
        
        assert user_id > 0
        
        # Verify user was created
        result = await auth_service.db.execute(
            "SELECT user_id, email, password_hash FROM users WHERE user_id = ?",
            args=(user_id,)
        )
        
        assert len(result.rows) == 1
        row = result.rows[0]
        assert row['email'] == email
        assert row['password_hash'] is not None
        assert row['password_hash'] != password  # Password should be hashed

    @pytest.mark.asyncio
    async def test_signup_with_duplicate_email_fails(self, auth_service: AuthService):
        """Test that signup fails when email already exists."""
        email = "duplicate@example.com"
        password = "TestPassword123!"
        
        # Create first user
        await auth_service.signup(email, password)
        
        # Try to create second user with same email
        with pytest.raises(Exception):  # Should raise database constraint error
            await auth_service.signup(email, password)

    @pytest.mark.asyncio
    async def test_login_with_valid_credentials(self, auth_service: AuthService):
        """Test successful login with valid credentials."""
        email = "login@example.com"
        password = "ValidPassword123!"
        
        # Create user
        user_id = await auth_service.signup(email, password)
        
        # Attempt login
        user = await auth_service.login(email, password)
        
        assert user is not None
        assert user.user_id == user_id
        assert user.email == email
        assert user.last_login_at is not None

    @pytest.mark.asyncio
    async def test_login_with_invalid_password(self, auth_service: AuthService):
        """Test login fails with invalid password."""
        email = "wrongpass@example.com"
        password = "CorrectPassword123!"
        
        # Create user
        await auth_service.signup(email, password)
        
        # Attempt login with wrong password
        user = await auth_service.login(email, "WrongPassword123!")
        
        assert user is None

    @pytest.mark.asyncio
    async def test_login_with_nonexistent_email(self, auth_service: AuthService):
        """Test login fails with non-existent email."""
        user = await auth_service.login("nonexistent@example.com", "SomePassword123!")
        
        assert user is None

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, auth_service: AuthService):
        """Test retrieving a user by ID."""
        email = "getuser@example.com"
        password = "TestPassword123!"
        
        user_id = await auth_service.signup(email, password)
        
        user = await auth_service.get_user_by_id(user_id)
        
        assert user is not None
        assert user['user_id'] == user_id
        assert user['email'] == email

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, auth_service: AuthService):
        """Test getting user with non-existent ID returns None."""
        user = await auth_service.get_user_by_id(99999)
        
        assert user is None

    @pytest.mark.asyncio
    async def test_create_access_token(self, auth_service: AuthService):
        """Test JWT token creation."""
        user_id = 123
        email = "token@example.com"
        
        token = await auth_service.create_access_token(user_id, email)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Decode and verify token
        secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        decoded = jwt.decode(token, secret_key, algorithms=["HS256"])
        
        assert decoded['user_id'] == user_id
        assert decoded['email'] == email
        assert 'exp' in decoded

    @pytest.mark.asyncio
    async def test_login_updates_last_login_time(self, auth_service: AuthService):
        """Test that login updates the last_login_at timestamp."""
        email = "timestamp@example.com"
        password = "TestPassword123!"
        
        # Create user
        user_id = await auth_service.signup(email, password)
        
        # Get initial last_login_at (should be None)
        result = await auth_service.db.execute(
            "SELECT last_login_at FROM users WHERE user_id = ?",
            args=(user_id,)
        )
        initial_last_login = result.rows[0]['last_login_at']
        
        # Login
        user = await auth_service.login(email, password)
        
        # Verify last_login_at was updated
        assert user.last_login_at is not None
        if initial_last_login:
            assert user.last_login_at != initial_last_login
