
from .fixtures.vitals import load_vitals_fixtures
from .fixtures.workouts import load_workouts_fixtures
from .fixtures.activities import load_activities_fixtures
from .fixtures.auth import load_fixtures as load_auth_fixtures


async def load_all_fixtures(db_client) -> dict:
    """Load all test fixtures and return them as a dictionary"""

    fixtures = {}

    # Load auth fixtures
    user = await load_auth_fixtures(db_client)
    fixtures['user'] = user

    # Load vitals fixtures
    vitals = await load_vitals_fixtures(db_client, user)
    fixtures['vitals'] = vitals

    # Load workouts fixtures
    workouts = await load_workouts_fixtures(db_client, user)
    fixtures['workouts'] = workouts

    # Load activities fixtures
    activities = await load_activities_fixtures(db_client, user)
    fixtures['activities'] = activities

    return fixtures


async def setup_db(db_client):