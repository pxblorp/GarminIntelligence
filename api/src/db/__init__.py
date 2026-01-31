import os
from .client import DatabaseClient

if os.getenv('TESTING') != 'true':
    db_client = DatabaseClient()
else:
    db_client = None
