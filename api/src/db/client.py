import os
from dotenv import load_dotenv
from libsql_client import create_client

class DatabaseClient:
    def __init__(self):
        pass

    def initialize(self, url: str, token: str):
        self.client = create_client(url, auth_token=token)

    async def execute(self, query: str, params: dict = {}):
        return await self.client.execute(query, params)

    async def stop(self):
        await self.client.close()

db_client = DatabaseClient()