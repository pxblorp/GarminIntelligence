"""Test-specific database client using SQLite instead of libsql."""
import aiosqlite
from typing import Optional, List

class MockResultSet:
    """Mock ResultSet to match libsql interface."""
    def __init__(self, rows: List):
        self.rows = rows

class TestDB:
    __test__ = False  # Tell pytest not to collect this class
    
    def __init__(self, database: str = ":memory:"):
        self.database = database
        self._conn: Optional[aiosqlite.Connection] = None

    async def get_connection(self) -> aiosqlite.Connection:
        if self._conn is None:
            self._conn = await aiosqlite.connect(self.database)
            self._conn.row_factory = aiosqlite.Row
        return self._conn
    
    async def close(self):
        if self._conn:
            await self._conn.close()
            self._conn = None

    async def execute(self, sql: str, args: tuple = ()) -> MockResultSet:
        """Execute SQL and return a mock ResultSet compatible with libsql."""
        conn = await self.get_connection()
        cursor = await conn.execute(sql, args)
        
        if sql.strip().upper().startswith('SELECT') or 'RETURNING' in sql.upper():
            rows = await cursor.fetchall()
            await conn.commit()
            return MockResultSet([dict(row) for row in rows])
        
        await conn.commit()
        return MockResultSet([])

# Export with Test prefix for backward compatibility
TestDB = TestDB
