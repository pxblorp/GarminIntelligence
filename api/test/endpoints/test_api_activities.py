import pytest

@pytest.mark.skip(reason="Not implemented")
class TestApiActivities:

    async def test_get_activities_from_db(self, client):
        pass

    async def test_get_activities_sync_from_garmin(self, client):
        pass

    async def test_get_activities_no_garmin_credentials(self, client):
        pass
