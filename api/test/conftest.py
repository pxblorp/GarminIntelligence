from alabaster import setup
import os
os.environ['TESTING'] = 'true'

import pytest
import libsql_client
from unittest.mock import AsyncMock

from .utils import load_all_fixtures, setup_db


@pytest.fixture(scope="session")
def test_db():
    """Create an in-memory SQLite database for testing"""
    conn = libsql_client.create_client("file::memory:?cache=shared")
    yield conn
    conn.close()


@pytest.fixture
def mock_db_client(setup_schema):
    """Mock the database client to use our test database"""
    from unittest.mock import AsyncMock
    
    class MockResult:
        def __init__(self, rows):
            self.rows = rows
    
    async def mock_execute(query, params=None):
        cursor = setup_schema.cursor()
        try:
            # Handle parameter conversion for sqlite3
            if params:
                # Convert named parameters to positional for sqlite3
                param_values = []
                for key, value in params.items():
                    # Replace :key with ? in query
                    query = query.replace(f":{key}", "?")
                    param_values.append(value)
                
                cursor.execute(query, param_values)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
                setup_schema.commit()
                return MockResult([])
            else:
                rows = cursor.fetchall()
                return MockResult([dict(row) for row in rows])
        except Exception as e:
            setup_schema.rollback()
            raise e
    
    mock_client = AsyncMock()
    mock_client.execute = mock_execute
    mock_client.close = AsyncMock()
    
    return mock_client

@pytest.fixture
async def test_fixtures(db_client):
    """Load all test fixtures"""
    await setup_db(db_client)
    return await load_all_fixtures(db_client)
