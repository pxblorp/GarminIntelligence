import pytest

def test_sync_not_implemented(client):
    with pytest.raises(Exception, match="Not implemented yet"):
        client.get("/api/sync?days=7")