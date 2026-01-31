import garth
from garth import Client
from garth.auth_tokens import OAuth1Token, OAuth2Token

class GarminService:
    def __init__(self, db_client):
        self.db_client = db_client

    def get_client(self) -> Client:
        raise NotImplementedError("Method not implemented. Use resume_session with tokens.")

    def resume_session(self, token: str, token_secret: str) -> Client:
        raise NotImplementedError("Method not implemented. Use appropriate OAuth token method.")