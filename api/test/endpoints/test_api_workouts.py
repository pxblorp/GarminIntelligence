import pytest

@pytest.mark.skip(reason="Not implemented")
class TestApiWorkouts:

    async def test_get_workouts(self, client):
        pass

    async def test_create_workout(self, client):
        pass

    async def test_get_workout_by_id(self, client):
        pass

    async def test_get_workout_not_found(self, client):
        pass

    def test_update_workout_not_implemented(self, client):
        pass

    def test_delete_workout_not_implemented(self, client):
        pass
