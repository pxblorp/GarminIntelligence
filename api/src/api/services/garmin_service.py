import garth
from garth import Client
from garth.auth_tokens import OAuth1Token, OAuth2Token

class GarminService:
    registry : dict[str, Client] = {}
    def get_client(self, email: str, password: str, oauth1: OAuth1Token = None, oauth2: OAuth2Token = None) -> Client:
        try:
            oauth1, oauth2 = garth.login(email, password)
            client = Client()
            client.configure(oauth1, oauth2)
            return client
        except Exception as e:
            raise Exception(f"Failed to authenticate with Garmin: {str(e)}")

    def resume_session(self, token: str, token_secret: str) -> Client:
        try:
            oauth1 = OAuth1Token(oauth_token=token, oauth_token_secret=token_secret)
            # Assuming oauth2 is not needed or default.
            client = Client()
            client.configure(oauth1, None)  # Adjust as per API
            return client
        except Exception as e:
            raise Exception(f"Failed to resume Garmin session: {str(e)}")