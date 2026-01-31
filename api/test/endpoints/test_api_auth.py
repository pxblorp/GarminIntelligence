import pytest

@pytest.mark.skip(reason="Not implemented")
class TestApiAuth:

    async def test_login_success(self, client):
        pass

    async def test_login_invalid_credentials(self, client):
        pass

    async def test_signup_success(self, client):
        pass

    async def test_signup_email_exists(self, client):
        pass

    async def test_signup_invalid_garmin_credentials(self, client):
        pass
