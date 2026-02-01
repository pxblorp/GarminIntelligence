import time
from datetime import datetime
from db.client import DB

from garth import login
from garth import Client
from garth.auth_tokens import OAuth1Token, OAuth2Token

class GarminService:
    def __init__(self, db: DB):
        self.db = db

    async def login(self, email: str, password: str, user_id: int):
        oauth1, oauth2 = login(email, password)

        await self._save_tokens(user_id, oauth1, oauth2)

        return oauth1, oauth2

    async def load_client(self, user_id: int) -> Client | None:
        query = "SELECT oauth_token, oauth_token_secret FROM  WHERE user_id = ?"
        result = await self.db.execute(query, args=(user_id,))
        if not result.rows:
            return None
        row = result.rows[0]
        
        if not row["oauth_token"] or not row["oauth_token_secret"]:
            return None

        oauth1 = OAuth1Token(
            oauth_token=row["oauth_token"],
            oauth_token_secret=row["oauth_token_secret"]
        )

        client = Client(oauth1=oauth1)

        return client

    async def persist_if_refreshed(self, user_id: int, client: Client):
        # Implementation skipped as schema doesn't support expiration checks yet
        pass

    async def _save_tokens(self, user_id, oauth1, oauth2):
        query = """
            UPDATE users 
            SET oauth_token = ?, oauth_token_secret = ?, updated_at = ?
            WHERE user_id = ?
        """
        await self.db.execute(query, args=(
            oauth1.oauth_token,
            oauth1.oauth_token_secret,
            datetime.now(),
            user_id
        ))
