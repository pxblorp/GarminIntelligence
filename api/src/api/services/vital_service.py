from typing import Optional

from db import db_client
from db.models.vitals import Vital
from api.routes.vitals.models import VitalsCreate, VitalsResponse, VitalsVM

class VitalService:
    def __init__(self, db_client):
        self.db_client = db_client

    async def get_vitals(self, user_id: int, date: str) -> Optional[Vital]:
        query = """
            SELECT vital_id, user_id, date, sleep_score, sleeping_hr, hrv, stress, created_at, updated_at
            FROM vitals
            WHERE user_id = ? AND date = ?
        """
        result = await self.db_client.execute(query, params={"user_id": user_id, "date": date})
        if not result.rows:
            return None
        row = result.rows[0]
        return Vital(
            vital_id=row["vital_id"],
            user_id=row["user_id"],
            date=row["date"],
            sleep_score=row["sleep_score"],
            sleeping_hr=row["sleeping_hr"],
            hrv=row["hrv"],
            stress=row["stress"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    async def create_or_update_vitals(self, user_id: int, vital_data: VitalsCreate) -> Optional[Vital]:
        existing = await self.get_vitals(user_id, vital_data.date)
        if existing:
            query = """
                UPDATE vitals
                SET sleep_score = ?, sleeping_hr = ?, hrv = ?, stress = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND date = ?
            """
            await self.db_client.execute(query, params={
                "sleep_score": vital_data.sleep_score, "sleeping_hr": vital_data.sleeping_hr, "hrv": vital_data.hrv, "stress": vital_data.stress,
                "user_id": user_id, "date": vital_data.date
            })
            return  await self.get_vitals(user_id, vital_data.date)
        else:
            # Insert
            query = """
                INSERT INTO vitals (user_id, date, sleep_score, sleeping_hr, hrv, stress)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            await self.db_client.execute(query, params={
                "user_id": user_id, "date": vital_data.date, "sleep_score": vital_data.sleep_score, "sleeping_hr": vital_data.sleeping_hr, "hrv": vital_data.hrv, "stress": vital_data.stress
            })
            return await self.get_vitals(user_id, vital_data.date)

    async def sync_vitals_from_garmin(self, user_id: int, date: str, garmin_client) -> Optional[VitalsVM]:
        stats = garmin_client.get_stats(date)
        sleep_data = garmin_client.get_sleep_data(date)
        hrv_data = garmin_client.get_hrv_data(date)
        
        vital_create = VitalsCreate(
            date=date,
            sleep_score=sleep_data.get('sleepScores', {}).get('overall', {}).get('value', None) if sleep_data else None,
            sleeping_hr=sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
            hrv=hrv_data.get('lastNightAvg', None) if hrv_data else None,
            stress=stats.get('averageStressLevel', None)
        )
        vital = await self.create_or_update_vitals(user_id, vital_create)
        if vital:
            return VitalsVM(
                date=vital.date,
                sleep_score=vital.sleep_score,
                sleeping_hr=vital.sleeping_hr,
                hrv=vital.hrv,
                stress=vital.stress,
            )
        else:
            return None
