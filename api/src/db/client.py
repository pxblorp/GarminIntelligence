import os
from dotenv import load_dotenv
from libsql_client import create_client

class DatabaseClient:
    def __init__(self):
        url = os.getenv("DATABASE_URL")
        auth_token = os.getenv("DATABASE_AUTH_TOKEN")

        if url is None:
            raise ValueError("DATABASE_URL not set in environment variables.")

        self.client = create_client(
            url=url,
            auth_token=auth_token
        )

    async def execute(self, query: str, params: dict = {}):
        return await self.client.execute(query, params)

    async def stop(self):
        await self.client.close()
