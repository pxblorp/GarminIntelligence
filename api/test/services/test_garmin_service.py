import pytest
from unittest.mock import patch, MagicMock
from api.services.garmin_service import GarminService, OAuth1Token, OAuth2Token

class TestGarminService:

    @pytest.mark.skip(reason="Not implemented yet")
    async def test_login(self, mock_client, mock_garth_login, garmin_service: GarminService):
        pass

    @pytest.mark.skip(reason="Not implemented yet")
    async def test_get_user_garmin_tokens(self, garmin_service: GarminService, test_fixtures):
        """Test getting user's Garmin tokens from the database."""
        pass