import os
from libsql_client import create_client
from dotenv import load_dotenv

load_dotenv()

db_client = create_client(
    url=os.getenv("DATABASE_URL") or "sqlite:///dev.db",
    auth_token=os.getenv("DATABASE_AUTH_TOKEN")
)
