import os
from typing import Optional, List, Union
from libsql_client import create_client, Client, ResultSet

class DB:
    def __init__(self, url: Optional[str] = None, auth_token: Optional[str] = None):
        self.url = url or os.getenv("TURSO_DATABASE_URL", "libsql://your-db.turso.io")
        self.auth_token = auth_token or os.getenv("TURSO_AUTH_TOKEN", "")
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(self.url, auth_token=self.auth_token)
        return self._client
    
    def close(self):
        if self._client:
            self._client.close()
            self._client = None

    async def execute(self, sql: str, args = ()) -> ResultSet:
        return await self.client.execute(sql, args)

db = DB()
