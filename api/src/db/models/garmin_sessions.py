from sqlalchemy import Table, Column, String, DateTime, MetaData

metadata = MetaData()

garmin_sessions = Table(
    "garmin_sessions",
    metadata,
    Column("user_id", String, primary_key=True),
    Column("session_json", String, nullable=False),
    Column("updated_at", DateTime),
)