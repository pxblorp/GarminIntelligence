import pytest

@pytest.mark.skip(reason="Not implemented")
class TestApiVitals:

    async def test_get_vitals_from_db(self, client):
        pass

    async def test_get_vitals_sync_from_garmin(self, client):
        pass

    async def test_get_vitals_no_data(self, client):
        pass
