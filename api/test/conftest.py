import os
os.environ['TESTING'] = 'true'

import pytest
from unittest.mock import AsyncMock, MagicMock


"""TODO
- create a mock sqlite db, populate with fake data for
    * users
    * activities
    * vitals
    * workouts
- patch the db client in the app to use the mock db client
- ensure each test runs in isolation with a fresh mock db state
- teardown the mock db after tests complete (remove file)
"""

@pytest.fixture(autouse=True)
def mock_db_client(monkeypatch):
    import db
    from unittest.mock import MagicMock
    mock_client = AsyncMock()
    mock_result = MagicMock()
    mock_result.rows = []
    mock_client.execute.return_value = mock_result
    db.db_client = mock_client
    return mock_client

@pytest.fixture
def client(mock_db_client):
    from fastapi.testclient import TestClient
    from api.server import app
    return TestClient(app)